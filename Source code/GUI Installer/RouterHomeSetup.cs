// Router Home Setup: a point-and-click Windows installer for the Router Home tab (owner, 2026-11-24).
// Does exactly what installer.ps1 does, with a window instead of a console:
//   - Router Home's files are packed inside this .exe (resources made by tools/build-setup-exe.ps1)
//   - it talks to the router with Windows' own OpenSSH client (ssh.exe), ONE connection: the files go as a tar
//     stream into the same ssh session that runs install-on-router.sh (same as the script installers)
//   - the router password is typed into this window and handed to ssh through ssh's own "askpass" feature: ssh
//     starts this same .exe in askpass mode, which prints the password to ssh only. It's never written to disk.
// Built with the C# compiler that ships with Windows (.NET Framework 4.x, C# 5) so users need nothing extra.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("Router Home Setup")]
[assembly: AssemblyProduct("Router Home")]
[assembly: AssemblyDescription("Installs the Router Home tab on a GL.iNet router")]

static class Program
{
    [STAThread]
    static int Main(string[] args)
    {
        // askpass mode: ssh starts us with the prompt as the argument; we print the password and quit
        if (Environment.GetEnvironmentVariable("RH_ASKPASS") == "1")
        {
            string prompt = args.Length > 0 ? string.Join(" ", args) : "";
            if (Regex.IsMatch(prompt, "yes/no|fingerprint", RegexOptions.IgnoreCase)) { Console.Out.Write("no\n"); return 0; }
            Console.Out.Write((Environment.GetEnvironmentVariable("RH_PW") ?? "") + "\n");
            Console.Out.Flush();
            return 0;
        }
        // test mode for the developer (no window): RouterHomeSetup.exe --test-transport <ip> <logfile>
        if (args.Length >= 3 && args[0] == "--test-transport") return Setup.TestTransport(args[1], args[2]);
        // README screenshots (developer): RouterHomeSetup.exe --screenshots <folder>. Draws the windows, connects to nothing.
        if (args.Length >= 2 && args[0] == "--screenshots") { Application.EnableVisualStyles(); MainForm.Screens(args[1]); return 0; }
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new MainForm());
        return 0;
    }
}

// ------------------------------------------------------------------ the work (no UI)
static class Setup
{
    // Both versions are packed inside (owner, 2026-11-24): resources "stable/..." and, when a beta is newer than the
    // stable release, "beta/...". The window lets the user pick; installing also sets the router's update channel.
    public static string VersionOf(string ch) { string v = Res(ch + "/version.txt"); return v == null ? null : v.Trim(); }
    public static string Version { get { return VersionOf("stable"); } }
    public static bool HasBeta { get { return VersionOf("beta") != null; } }

    public static string Res(string name)
    {
        var s = Assembly.GetExecutingAssembly().GetManifestResourceStream(name);
        if (s == null) return null;
        using (s) using (var r = new StreamReader(s, Encoding.UTF8)) return r.ReadToEnd();
    }
    public static byte[] ResBytes(string name)
    {
        using (var s = Assembly.GetExecutingAssembly().GetManifestResourceStream(name))
        using (var m = new MemoryStream()) { s.CopyTo(m); return m.ToArray(); }
    }

    public static string SshPath()
    {
        string sys = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), Environment.Is64BitProcess ? "System32" : "Sysnative");
        string p = Path.Combine(sys, @"OpenSSH\ssh.exe");
        if (File.Exists(p)) return p;
        foreach (string d in (Environment.GetEnvironmentVariable("PATH") ?? "").Split(';'))
        {
            try { string q = Path.Combine(d.Trim(), "ssh.exe"); if (File.Exists(q)) return q; } catch { }
        }
        return null;
    }

    // OpenSSH 8.4+ can take the password from us (SSH_ASKPASS_REQUIRE). Older ones need their own console window.
    public static bool SshCanAskpass(string ssh)
    {
        try
        {
            var psi = new ProcessStartInfo(ssh, "-V") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardError = true, RedirectStandardOutput = true };
            using (var p = Process.Start(psi))
            {
                string o = p.StandardError.ReadToEnd() + p.StandardOutput.ReadToEnd(); p.WaitForExit(5000);
                var m = Regex.Match(o, @"OpenSSH[^\d]*(\d+)\.(\d+)");
                if (!m.Success) return false;
                int a = int.Parse(m.Groups[1].Value), b = int.Parse(m.Groups[2].Value);
                return a > 8 || (a == 8 && b >= 4);
            }
        }
        catch { return false; }
    }

    public static string GuessRouter()
    {
        try
        {
            foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (ni.OperationalStatus != OperationalStatus.Up || ni.NetworkInterfaceType == NetworkInterfaceType.Loopback) continue;
                foreach (var g in ni.GetIPProperties().GatewayAddresses)
                    if (g.Address.AddressFamily == AddressFamily.InterNetwork && !g.Address.Equals(IPAddress.Any)) return g.Address.ToString();
            }
        }
        catch { }
        return "192.168.8.1";
    }

    public static bool ValidIp(string ip)
    {
        return Regex.IsMatch(ip ?? "", @"^(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})$") && ip.Split('.').All(x => int.Parse(x) <= 255);
    }

    public static bool Port22(string ip)
    {
        try { using (var c = new TcpClient()) { var t = c.BeginConnect(ip, 22, null, null); bool ok = t.AsyncWaitHandle.WaitOne(3000) && c.Connected; return ok; } }
        catch { return false; }
    }

    // ---- ustar archive (BusyBox tar on the router reads it), built in memory
    public static byte[] Tar(List<KeyValuePair<string, byte[]>> files)
    {
        var m = new MemoryStream();
        long now = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalSeconds;
        foreach (var f in files)
        {
            var h = new byte[512];
            Action<int, string> put = (off, s) => { var b = Encoding.ASCII.GetBytes(s); Array.Copy(b, 0, h, off, b.Length); };
            put(0, f.Key); put(100, "0000644\0"); put(108, "0000000\0"); put(116, "0000000\0");
            put(124, Convert.ToString(f.Value.Length, 8).PadLeft(11, '0') + "\0");
            put(136, Convert.ToString(now, 8).PadLeft(11, '0') + "\0");
            put(148, "        "); h[156] = (byte)'0'; put(257, "ustar\0"); put(263, "00"); put(265, "root"); put(297, "root");
            int sum = 0; foreach (byte b in h) sum += b;
            put(148, Convert.ToString(sum, 8).PadLeft(6, '0') + "\0 ");
            m.Write(h, 0, 512); m.Write(f.Value, 0, f.Value.Length);
            int pad = (512 - f.Value.Length % 512) % 512; m.Write(new byte[pad], 0, pad);
        }
        m.Write(new byte[1024], 0, 1024);
        return m.ToArray();
    }

    public static byte[] InstallBundle(string ch, bool ookla, List<string> opts)
    {
        var files = new List<KeyValuePair<string, byte[]>>();
        files.Add(new KeyValuePair<string, byte[]>("machome-rootfs-generic.tgz", ResBytes(ch + "/machome-rootfs-generic.tgz")));
        files.Add(new KeyValuePair<string, byte[]>("machome-rootfs-mt5000.tgz", ResBytes(ch + "/machome-rootfs-mt5000.tgz")));
        files.Add(new KeyValuePair<string, byte[]>("install-on-router.sh", ResBytes(ch + "/install-on-router.sh")));
        if (ookla) files.Add(new KeyValuePair<string, byte[]>("mh-accept-ookla", Encoding.ASCII.GetBytes("yes\n")));
        if (opts.Count > 0)
        {
            files.Add(new KeyValuePair<string, byte[]>("mh-options", Encoding.ASCII.GetBytes(string.Join("\n", opts) + "\n")));
            files.Add(new KeyValuePair<string, byte[]>("options-on-router.sh", ResBytes(ch + "/options-on-router.sh")));
        }
        return Tar(files);
    }

    // writes the update channel the router's "Router Home updates" button follows (2.7.1+): {"channel":"beta"|"stable"}.
    // No double quotes allowed in the router command (it's one double-quoted ssh argument): printf with \042 makes them.
    public static string ChannelCmd(string ch, string file)
    {
        return "mkdir -p " + Path.GetDirectoryName(file).Replace('\\', '/') + " && printf '{\\042channel\\042:\\042" + ch + "\\042}' > " + file;
    }
    // router commands (single quotes only: the whole thing is one ssh argument in double quotes)
    public static string InstallCmd(string ch)
    {
        return "tar -xf - -C /tmp && { tr -d '\\r' < /tmp/install-on-router.sh | sh; }; r=$?; [ $r = 0 ] && " + ChannelCmd(ch, "/etc/machome/update.json") +
               "; rm -f /tmp/install-on-router.sh /tmp/options-on-router.sh /tmp/mh-options /tmp/mh-accept-ookla /tmp/machome-rootfs*.tgz; exit $r";
    }
    // Remove (2026-11-24): GL firmware upgrades wipe /root, so /root/machome-backup/uninstall.sh is often gone (owner's
    // Slate: "not installed" while it was installed). Try it, then the copy kept in /usr/lib/machome (installers from
    // 2.8.0 on), then remove the files directly (same list as uninstall.sh). No double quotes (one ssh argument).
    public const string RemoveCmd = "if [ -f /root/machome-backup/uninstall.sh ]; then sh /root/machome-backup/uninstall.sh; " +
        "elif [ -f /usr/lib/machome/uninstall.sh ]; then sh /usr/lib/machome/uninstall.sh; " +
        "elif [ -f /usr/share/oui/menu.d/machome.json ] || [ -f /www/views/gl-sdk4-ui-machome.common.js.gz ]; then echo 'Removing the Home tab (its uninstaller was deleted by a firmware upgrade) ...'; " +
        "/etc/init.d/machome stop 2>/dev/null; /etc/init.d/machome disable 2>/dev/null; /etc/init.d/machome-st stop 2>/dev/null; killall speedtest 2>/dev/null; " +
        "rm -rf /usr/share/oui/menu.d/machome.json /www/views/gl-sdk4-ui-machome.common.js.gz /usr/lib/oui-httpd/rpc/machome /usr/bin/machome-sampler /usr/lib/machome /etc/init.d/machome " +
        "/usr/bin/machome-speedtest /etc/init.d/machome-st /usr/share/machome /root/.config/ookla /usr/share/gl-download.d/machome /usr/share/gl-validator.d/machome.lua /tmp/machome; " +
        "sed -i -e '/machome/d' -e '\\#/root/.config/ookla/#d' /etc/sysupgrade.conf; /etc/init.d/nginx restart; echo 'Home tab removed (settings in /etc/machome kept).'; " +
        "else echo 'The Home tab is not installed on this router.'; fi";
    public const string UndoCmd = "ls /root/machome-backup/undo-options-*.sh >/dev/null 2>&1 || echo 'No optional changes from this installer were found.'; for u in $(ls -t /root/machome-backup/undo-options-*.sh 2>/dev/null); do echo Running $u; sh $u && mv $u $u.done; done";

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern uint GetShortPathName(string l, StringBuilder s, uint n);
    static string Short(string p) { var sb = new StringBuilder(1024); uint n = GetShortPathName(p, sb, 1024); return n > 0 && n < 1024 ? sb.ToString() : p; }

    // Runs ssh root@ip "<cmd>" with stdin = data (or nothing). Every output line goes to log. Returns ssh's exit code.
    // stderr text is returned too (to tell a wrong password from a changed host key).
    public static int Ssh(string ip, string password, string cmd, byte[] stdin, bool askpass, Action<string> log, out string errText, string extraOpts = "")
    {
        string ssh = SshPath();
        string helper = null;
        var err = new StringBuilder();
        try
        {
            var psi = new ProcessStartInfo(ssh) { UseShellExecute = false, RedirectStandardInput = true };
            psi.Arguments = extraOpts + "-o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -o NumberOfPasswordPrompts=1 root@" + ip + " \"" + cmd + "\"";
            if (askpass)
            {
                // ssh starts the askpass program by path: use a copy with a short path (no spaces) in %TEMP%
                helper = Path.Combine(Path.GetTempPath(), "rh-askpass-" + Guid.NewGuid().ToString("N").Substring(0, 8) + ".exe");
                File.Copy(Application.ExecutablePath, helper);
                psi.CreateNoWindow = true; psi.RedirectStandardOutput = true; psi.RedirectStandardError = true;
                psi.EnvironmentVariables["SSH_ASKPASS"] = Short(helper);
                psi.EnvironmentVariables["SSH_ASKPASS_REQUIRE"] = "force";
                psi.EnvironmentVariables["RH_ASKPASS"] = "1";
                psi.EnvironmentVariables["RH_PW"] = password ?? "";
                psi.EnvironmentVariables["DISPLAY"] = "rh";
            }
            else psi.CreateNoWindow = false;   // old OpenSSH: it asks for the password in its own console window
            using (var p = Process.Start(psi))
            {
                if (askpass)
                {
                    p.OutputDataReceived += (s, e) => { if (e.Data != null) log(Clean(e.Data)); };
                    p.ErrorDataReceived += (s, e) => { if (e.Data != null) { lock (err) err.AppendLine(e.Data); log(Clean(e.Data)); } };
                    p.BeginOutputReadLine(); p.BeginErrorReadLine();
                }
                try
                {
                    if (stdin != null) { p.StandardInput.BaseStream.Write(stdin, 0, stdin.Length); p.StandardInput.BaseStream.Flush(); }
                    p.StandardInput.Close();
                }
                catch (IOException) { }   // ssh quit early (wrong password, no connection): its exit code says why
                p.WaitForExit();
                p.WaitForExit(200);
                errText = err.ToString();
                return p.ExitCode;
            }
        }
        finally
        {
            if (helper != null) for (int i = 0; i < 10; i++) { try { File.Delete(helper); break; } catch { Thread.Sleep(200); } }
        }
    }

    static string Clean(string s) { return Regex.Replace(s, @"\x1b\[[0-9;]*[A-Za-z]", "").TrimEnd(); }

    public static bool HostKeyChanged(string err) { return Regex.IsMatch(err ?? "", "identification has changed|host key verification failed", RegexOptions.IgnoreCase); }
    public static bool WrongPassword(string err) { return Regex.IsMatch(err ?? "", "permission denied", RegexOptions.IgnoreCase); }
    // "Permission denied (publickey)": the router only accepts SSH keys, so no password can work (owner's Slate, 2026-11-24)
    public static bool KeysOnly(string err)
    {
        var m = Regex.Match(err ?? "", @"permission denied \(([^)]*)\)", RegexOptions.IgnoreCase);
        return m.Success && !m.Groups[1].Value.Contains("password") && !m.Groups[1].Value.Contains("keyboard-interactive");
    }

    public static void ForgetHostKey(string ip)
    {
        try
        {
            string kg = Path.Combine(Path.GetDirectoryName(SshPath()), "ssh-keygen.exe");
            using (var p = Process.Start(new ProcessStartInfo(kg, "-R " + ip) { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true })) p.WaitForExit(10000);
        }
        catch { }
    }

    // developer test: send the real install bundle, but the router only unpacks it in a scratch folder, lists it and
    // deletes it (nothing installed). Uses RH_TEST_KEY for key login and RH_TEST_PW (or none) for askpass.
    public static int TestTransport(string ip, string logfile)
    {
        var sb = new StringBuilder();
        Action<string> log = s => { lock (sb) sb.AppendLine(s); };
        string key = Environment.GetEnvironmentVariable("RH_TEST_KEY");
        string extra = string.IsNullOrEmpty(key) ? "" : "-i \"" + key + "\" -o IdentitiesOnly=yes ";
        string ch = Environment.GetEnvironmentVariable("RH_TEST_CHANNEL") == "beta" && HasBeta ? "beta" : "stable";
        string cmd = "mkdir -p /tmp/rhsetup-test && tar -xf - -C /tmp/rhsetup-test && ls -la /tmp/rhsetup-test && md5sum /tmp/rhsetup-test/* && " +
                     ChannelCmd(ch, "/tmp/rhsetup-test/update.json") + " && echo && cat /tmp/rhsetup-test/update.json && echo; rm -rf /tmp/rhsetup-test";
        log("stable " + Version + " | beta " + (VersionOf("beta") ?? "none") + " | sending " + ch + " | ssh " + SshPath() + " | askpass " + SshCanAskpass(SshPath()));
        var bundle = InstallBundle(ch, true, new List<string> { "kernel", "wgkey" });
        log("bundle bytes " + bundle.Length);
        string err;
        int rc = Ssh(ip, Environment.GetEnvironmentVariable("RH_TEST_PW"), cmd, bundle, true, log, out err, extra);
        log("exit " + rc);
        File.WriteAllText(logfile, sb.ToString());
        return rc;
    }
}

// ------------------------------------------------------------------ optional security / cleanup choices
class OptionsForm : Form
{
    public static readonly string[][] Q = {
        new[] { "https",    "Make the admin page always use HTTPS (encrypted)", "Stops your login going over the network unencrypted. Your browser may show a one-time certificate warning." },
        new[] { "wgkey",    "Lock down the VPN key file", "Makes the file holding WireGuard VPN private keys readable only by the router's admin account. No downside." },
        new[] { "ipsec",    "Close the unused IPsec ports facing the internet", "Two firewall openings are on by default even with no IPsec VPN set up. Leave this off if you run an IPsec VPN server on this router." },
        new[] { "kernel",   "Harden a few kernel security settings", "Hides kernel memory addresses, blocks a feature (BPF) often used in exploits, ignores ICMP redirects. No visible effect." },
        new[] { "opkgsig",  "Check signatures on add-on packages", "The router verifies GL's digital signature before installing add-on packages (skipped if it can't)." },
        new[] { "inetd",    "Remove an unused FTP entry", "Removes a dormant config line that would share the whole router over FTP if that service were ever started. No downside." },
        new[] { "dpi",      "Turn off app detection (DPI)", "Frees about 60 MB of memory. You lose per-app traffic statistics and app-based parental-control rules." },
        new[] { "cellular", "Turn off the cellular / SMS services", "Only used with a USB 4G/5G modem or SIM. Leave this off if you ever plug a modem into the router." },
        new[] { "avahi",    "Turn off Bonjour / mDNS (avahi)", "Used to announce the router's own file sharing to Macs. Leave this off if you share a USB drive from the router." },
        new[] { "bark",     "Turn off the Bark parental-control client", "Only needed if you use the Bark parental-control service with this router." },
        new[] { "vpntune",  "Brume 3 only: VPN speed tuning", "Spreads VPN packet handling over 3 CPU cores (about 20% more combined VPN speed at gigabit). Skipped on other models." } };
    readonly List<CheckBox> boxes = new List<CheckBox>();
    public List<string> Chosen = new List<string>();

    public OptionsForm(List<string> current)
    {
        Text = "Optional security and cleanup"; FormBorderStyle = FormBorderStyle.FixedDialog; MaximizeBox = false; MinimizeBox = false;
        StartPosition = FormStartPosition.CenterParent; Font = new Font("Segoe UI", 9.5f); AutoScaleMode = AutoScaleMode.Dpi;
        ClientSize = new Size(560, 616);
        var intro = new Label { Text = "Nothing here is needed for the Home tab. Leave anything you're unsure about unticked. Everything you tick can be undone later (choose \"Undo the optional security changes\" in the main window).", Location = new Point(16, 12), Size = new Size(528, 60) };
        Controls.Add(intro);
        var panel = new Panel { Location = new Point(8, 74), Size = new Size(544, 486), AutoScroll = true };
        int y = 4;
        foreach (var q in Q)
        {
            var cb = new CheckBox { Text = q[1], Tag = q[0], Checked = current.Contains(q[0]), Location = new Point(8, y), Size = new Size(510, 22), Font = new Font("Segoe UI", 9.5f, FontStyle.Bold) };
            var d = new Label { Text = q[2], Location = new Point(28, y + 22), Size = new Size(490, 34), ForeColor = Color.DimGray };
            panel.Controls.Add(cb); panel.Controls.Add(d); boxes.Add(cb); y += 60;
        }
        var note = new Label { Text = "Not offered on purpose: \"SSH key-only login\" (it would stop this installer from working for updates or removal).", Location = new Point(8, y), Size = new Size(510, 34), ForeColor = Color.Gray };
        panel.Controls.Add(note);
        Controls.Add(panel);
        var ok = new Button { Text = "OK", DialogResult = DialogResult.OK, Location = new Point(366, 572), Size = new Size(84, 30) };
        var cancel = new Button { Text = "Cancel", DialogResult = DialogResult.Cancel, Location = new Point(458, 572), Size = new Size(84, 30) };
        Controls.Add(ok); Controls.Add(cancel); AcceptButton = ok; CancelButton = cancel;
        ok.Click += (s, e) => { Chosen = boxes.Where(b => b.Checked).Select(b => (string)b.Tag).ToList(); };
    }
}

// ------------------------------------------------------------------ main window
class MainForm : Form
{
    TextBox ipBox, pwBox, logBox;
    RadioButton rbInstall, rbRemove, rbUndo, rbStable, rbBeta;
    GroupBox verGrp;
    CheckBox ookla;
    Button goBtn, optBtn, openBtn;
    Label optLabel, status;
    ProgressBar bar;
    LinkLabel help, keyLink;
    List<string> opts = new List<string>();
    string keyFile = null;   // "Use an SSH key instead" (routers with password login over SSH turned off)

    public MainForm()
    {
        Text = "Router Home Setup"; FormBorderStyle = FormBorderStyle.FixedSingle; MaximizeBox = false;
        StartPosition = FormStartPosition.CenterScreen; Font = new Font("Segoe UI", 9.5f); AutoScaleMode = AutoScaleMode.Dpi;
        ClientSize = new Size(600, 734); BackColor = Color.White;
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }

        var head = new Panel { Location = new Point(0, 0), Size = new Size(600, 74), BackColor = Color.FromArgb(79, 70, 229) };
        head.Controls.Add(new Label { Text = "Router Home", Font = new Font("Segoe UI Semibold", 17f), ForeColor = Color.White, Location = new Point(20, 8), AutoSize = true });
        head.Controls.Add(new Label { Text = "Adds a Home dashboard tab to your GL.iNet router (firmware 4.x).", ForeColor = Color.FromArgb(224, 231, 255), Location = new Point(22, 44), AutoSize = true });
        Controls.Add(head);

        int y = 88;
        Controls.Add(new Label { Text = "Router address", Location = new Point(20, y + 3), AutoSize = true });
        ipBox = new TextBox { Text = Setup.GuessRouter(), Location = new Point(170, y), Size = new Size(160, 26) };
        Controls.Add(ipBox);
        Controls.Add(new Label { Text = "the address of your router's admin page", ForeColor = Color.Gray, Location = new Point(338, y + 3), AutoSize = true });
        y += 36;
        Controls.Add(new Label { Text = "Admin password", Location = new Point(20, y + 3), AutoSize = true });
        pwBox = new TextBox { UseSystemPasswordChar = true, Location = new Point(170, y), Size = new Size(160, 26) };
        Controls.Add(pwBox);
        Controls.Add(new Label { Text = "the one you log in to the admin page with", ForeColor = Color.Gray, Location = new Point(338, y + 3), AutoSize = true });
        y += 30;
        keyLink = new LinkLabel { Text = "Use an SSH key instead (for routers set to SSH keys only)", Location = new Point(168, y), AutoSize = true };
        keyLink.LinkClicked += (s, e) => PickKey();
        Controls.Add(keyLink);
        y += 26;

        var grp = new GroupBox { Text = "What to do", Location = new Point(20, y), Size = new Size(560, 104) };
        rbInstall = new RadioButton { Text = "Install or update the Home tab (your settings are kept)", Checked = true, Location = new Point(14, 22), AutoSize = true };
        rbRemove = new RadioButton { Text = "Remove the Home tab", Location = new Point(14, 48), AutoSize = true };
        rbUndo = new RadioButton { Text = "Undo the optional security changes made by this installer", Location = new Point(14, 74), AutoSize = true };
        grp.Controls.Add(rbInstall); grp.Controls.Add(rbRemove); grp.Controls.Add(rbUndo);
        Controls.Add(grp);
        y += 114;

        // which version (owner, 2026-11-24): stable, or the beta when one newer than stable is packed in
        verGrp = new GroupBox { Text = "Version", Location = new Point(20, y), Size = new Size(560, Setup.HasBeta ? 78 : 50) };
        rbStable = new RadioButton { Text = "Stable " + Setup.Version + " (recommended)", Checked = true, Location = new Point(14, 22), AutoSize = true };
        verGrp.Controls.Add(rbStable);
        if (Setup.HasBeta)
        {
            rbBeta = new RadioButton { Text = "Beta " + Setup.VersionOf("beta") + ": new features first, less tested", Location = new Point(14, 48), AutoSize = true };
            verGrp.Controls.Add(rbBeta);
        }
        Controls.Add(verGrp);
        y += Setup.HasBeta ? 88 : 60;

        ookla = new CheckBox { Text = "Include the speed test (uses Ookla's free Speedtest CLI; I accept Ookla's terms)", Checked = true, Location = new Point(22, y), Size = new Size(560, 24) };
        Controls.Add(ookla);
        y += 24;
        var terms = new LinkLabel { Text = "Ookla's terms   ·   privacy policy", Location = new Point(40, y), AutoSize = true };
        terms.Links.Add(0, 13, "https://www.speedtest.net/about/eula"); terms.Links.Add(20, 14, "https://www.speedtest.net/about/privacy");
        terms.LinkClicked += (s, e) => Open((string)e.Link.LinkData);
        Controls.Add(terms);
        y += 30;
        optBtn = new Button { Text = "Optional security and cleanup…", Location = new Point(20, y), Size = new Size(230, 30) };
        optLabel = new Label { Text = "None chosen (the Home tab works either way)", ForeColor = Color.Gray, Location = new Point(258, y + 6), Size = new Size(330, 22) };
        optBtn.Click += (s, e) => { using (var f = new OptionsForm(opts)) if (f.ShowDialog(this) == DialogResult.OK) { opts = f.Chosen; optLabel.Text = opts.Count == 0 ? "None chosen (the Home tab works either way)" : opts.Count + " chosen: " + string.Join(", ", opts); } };
        Controls.Add(optBtn); Controls.Add(optLabel);
        y += 44;

        goBtn = new Button { Text = "Install", Location = new Point(20, y), Size = new Size(150, 38), BackColor = Color.FromArgb(79, 70, 229), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Font = new Font("Segoe UI Semibold", 10.5f) };
        goBtn.FlatAppearance.BorderSize = 0;
        goBtn.Click += (s, e) => Go();
        openBtn = new Button { Text = "Open the admin page", Location = new Point(180, y), Size = new Size(170, 38), Visible = false };
        openBtn.Click += (s, e) => Open("https://" + ipBox.Text.Trim());
        Controls.Add(goBtn); Controls.Add(openBtn);
        AcceptButton = goBtn;
        EventHandler sync = (s, e) => { goBtn.Text = rbInstall.Checked ? "Install" : rbRemove.Checked ? "Remove" : "Undo changes"; ookla.Enabled = optBtn.Enabled = verGrp.Enabled = rbInstall.Checked; };
        rbInstall.CheckedChanged += sync; rbRemove.CheckedChanged += sync; rbUndo.CheckedChanged += sync;
        y += 48;

        status = new Label { Text = "Ready. Make sure this PC is connected to the router (Wi-Fi or cable).", Location = new Point(20, y), Size = new Size(560, 22) };
        Controls.Add(status);
        y += 24;
        bar = new ProgressBar { Location = new Point(20, y), Size = new Size(560, 8), Style = ProgressBarStyle.Continuous };
        Controls.Add(bar);
        y += 14;
        int H = ClientSize.Height;
        logBox = new TextBox { Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Vertical, Location = new Point(20, y), Size = new Size(560, H - y - 40), BackColor = Color.FromArgb(246, 246, 248), Font = new Font("Consolas", 8.5f) };
        Controls.Add(logBox);
        help = new LinkLabel { Text = "Help: turning on SSH, and other common problems", Location = new Point(20, H - 30), AutoSize = true };
        help.LinkClicked += (s, e) => ShowHelp();
        Controls.Add(help);

        if (Setup.SshPath() == null)
        {
            status.Text = "Windows' OpenSSH Client is missing. See Help.";
            status.ForeColor = Color.Firebrick; goBtn.Enabled = false;
            Log("Windows' built-in OpenSSH Client isn't installed. Settings > System > Optional features > Add a feature > \"OpenSSH Client\", then start Router Home Setup again.");
        }
    }

    void Open(string url) { try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); } catch { } }

    // README screenshots: the real windows in a few states, drawn to PNG files (address shown = GL's default 192.168.8.1)
    public static void Screens(string dir)
    {
        Directory.CreateDirectory(dir);
        Action<Control, string> save = (c, name) => { using (var b = new Bitmap(c.Width, c.Height)) { c.DrawToBitmap(b, new Rectangle(0, 0, c.Width, c.Height)); b.Save(Path.Combine(dir, name), System.Drawing.Imaging.ImageFormat.Png); } };
        var f = new MainForm(); f.StartPosition = FormStartPosition.Manual; f.Location = new Point(-3000, -3000); f.ShowInTaskbar = false; f.Show(); Application.DoEvents();
        f.ipBox.Text = "192.168.8.1"; f.pwBox.Text = "password"; f.Refresh(); Application.DoEvents();
        save(f, "1-main-window.png");
        if (f.rbBeta != null) { f.rbBeta.Checked = true; f.Refresh(); Application.DoEvents(); save(f, "2-beta-choice.png"); f.rbStable.Checked = true; }
        using (var o = new OptionsForm(new List<string> { "https", "wgkey", "kernel" })) { o.StartPosition = FormStartPosition.Manual; o.Location = new Point(-3000, -3000); o.ShowInTaskbar = false; o.Show(); Application.DoEvents(); save(o, "3-optional-settings.png"); o.Close(); }
        // what a finished install looks like (the same messages the installer prints)
        f.status.Text = "Installed! Open the admin page and press Ctrl+F5 once."; f.status.ForeColor = Color.ForestGreen; f.openBtn.Visible = true;
        foreach (string l in new[] { "Router found at 192.168.8.1.", "Router Home " + Setup.Version + ", with the speed test.", "Router model: GL-BE3600 - using the generic build",
                                     "GL.iNet firmware 4.8.8 - OK", "Downloading Ookla Speedtest CLI (aarch64) from install.speedtest.net ...", "Speed test installed.", "nginx reloaded",
                                     "sampler running: 1", "", "Installed! Open https://192.168.8.1 , log in and press Ctrl+F5 once. \"Home\" is now the first item in the menu." }) f.logBox.AppendText(l + Environment.NewLine);
        f.bar.Value = 100; f.Refresh(); Application.DoEvents();
        save(f, "4-installed.png");
        f.Close();
    }

    void PickKey()
    {
        if (keyFile != null) { keyFile = null; keyLink.Text = "Use an SSH key instead (for routers set to SSH keys only)"; return; }
        using (var d = new OpenFileDialog { Title = "Choose your SSH private key (the file WITHOUT .pub)", Filter = "All files (*.*)|*.*" })
        {
            string ssh = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".ssh");
            if (Directory.Exists(ssh)) d.InitialDirectory = ssh;
            if (d.ShowDialog(this) != DialogResult.OK) return;
            if (d.FileName.EndsWith(".pub", StringComparison.OrdinalIgnoreCase)) { Status("Pick the private key: the file with the same name but WITHOUT .pub.", Color.Firebrick); return; }
            keyFile = d.FileName;
            keyLink.Text = "Using SSH key: " + Path.GetFileName(keyFile) + "   (click to stop using it)";
            Status("Using your SSH key. The password box is only needed if the key itself has a passphrase.", Color.Black);
        }
    }

    void ShowHelp()
    {
        MessageBox.Show(this,
            "Can't reach the router / \"SSH is off\":\n" +
            "  1. Open the router's admin page in your browser and log in.\n" +
            "  2. Go to Security > Access Control (on some models: System > Admin Panel).\n" +
            "  3. Turn on \"Enable SSH\" and press Apply.\n" +
            "  If it won't stay on, set a stronger admin password first: GL turns SSH off when the password is weak.\n\n" +
            "Wrong password: it's the same password you use for the router's admin page.\n\n" +
            "Wrong address: it's the address you type to open the admin page (often 192.168.8.1).\n\n" +
            "\"Windows protected your PC\": this free installer isn't code-signed. Click More info > Run anyway.\n\n" +
            "Still stuck? Report it on the Router Home GitHub page (link in the README).",
            "Router Home Setup: help", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    void Log(string s)
    {
        if (InvokeRequired) { BeginInvoke(new Action<string>(Log), s); return; }
        logBox.AppendText(s + Environment.NewLine);
    }
    void Status(string s, Color c)
    {
        if (InvokeRequired) { BeginInvoke(new Action<string, Color>(Status), s, c); return; }
        status.Text = s; status.ForeColor = c;
    }
    void Busy(bool on)
    {
        if (InvokeRequired) { BeginInvoke(new Action<bool>(Busy), on); return; }
        foreach (Control c in new Control[] { ipBox, pwBox, rbInstall, rbRemove, rbUndo, goBtn, keyLink }) c.Enabled = !on;
        ookla.Enabled = optBtn.Enabled = verGrp.Enabled = !on && rbInstall.Checked;
        bar.Style = on ? ProgressBarStyle.Marquee : ProgressBarStyle.Continuous; bar.Value = 0;
        UseWaitCursor = on;
    }

    void Go()
    {
        string ip = ipBox.Text.Trim(), pw = pwBox.Text;
        if (!Setup.ValidIp(ip)) { Status("That isn't a valid address like 192.168.8.1.", Color.Firebrick); ipBox.Focus(); return; }
        string ssh = Setup.SshPath();
        bool askpass = Setup.SshCanAskpass(ssh);
        if (askpass && pw.Length == 0 && keyFile == null) { Status("Type the router's admin password first.", Color.Firebrick); pwBox.Focus(); return; }
        int mode = rbInstall.Checked ? 1 : rbRemove.Checked ? 2 : 3;
        if (mode == 2 && MessageBox.Show(this, "Remove the Home tab from " + ip + "?\n\nThe router itself and your settings in GL's own pages aren't touched.", "Remove Router Home", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
        string ch = rbBeta != null && rbBeta.Checked ? "beta" : "stable";
        if (mode == 1 && ch == "beta" && MessageBox.Show(this, "Install the beta, Router Home " + Setup.VersionOf("beta") + "?\n\nBetas get new features first but are less tested. The router's update channel is set to Beta, so its update button offers newer betas too.\n\nTo go back: run this again and install Stable, or switch the channel in Control Center > Router Home updates.", "Install the beta", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
        bool withOokla = ookla.Checked; var chosen = new List<string>(opts); string key = keyFile;
        logBox.Clear(); openBtn.Visible = false; Busy(true);
        new Thread(() =>
        {
            try { Work(ip, pw, mode, askpass, withOokla, chosen, ch, key); }
            catch (Exception ex) { Log("Error: " + ex.Message); Status("Something went wrong (details below).", Color.Firebrick); }
            finally { Busy(false); }
        }) { IsBackground = true }.Start();
    }

    void Work(string ip, string pw, int mode, bool askpass, bool withOokla, List<string> chosen, string ch, string key)
    {
        Status("Checking " + ip + " …", Color.Black);
        if (!Setup.Port22(ip))
        {
            Status("Can't reach the router's SSH at " + ip + ". Is SSH turned on? (Help, below)", Color.Firebrick);
            Log("No answer from " + ip + " on the SSH port (22).");
            Log("- Is this PC connected to that router (Wi-Fi or cable)?");
            Log("- Is the address right? It's the one you open the admin page with.");
            Log("- Is SSH turned on? Router admin page > Security > Access Control > Enable SSH > Apply.");
            Log("  If it won't stay on, set a stronger admin password first (GL turns SSH off for weak passwords).");
            return;
        }
        Log("Router found at " + ip + ".");
        if (!askpass) Log("This PC's OpenSSH is older, so a small black window will ask for the router password. Type it there and press Enter.");
        string cmd = mode == 1 ? Setup.InstallCmd(ch) : mode == 2 ? Setup.RemoveCmd : Setup.UndoCmd;
        byte[] data = null;
        if (mode == 1)
        {
            Log("Router Home " + Setup.VersionOf(ch) + (ch == "beta" ? " (beta)" : "") + (withOokla ? ", with the speed test" : ", without the speed test") + (chosen.Count > 0 ? ", options: " + string.Join(", ", chosen) : "") + ".");
            data = Setup.InstallBundle(ch, withOokla, chosen);
            Status("Copying and installing (about 30 seconds) …", Color.Black);
        }
        else Status(mode == 2 ? "Removing …" : "Undoing the optional changes …", Color.Black);
        string err;
        string extra = key == null ? "" : "-i \"" + key + "\" -o IdentitiesOnly=yes ";
        if (key != null) Log("Logging in with the SSH key " + Path.GetFileName(key) + ".");
        int rc = Setup.Ssh(ip, pw, cmd, data, askpass, Log, out err, extra);
        if (rc == 255 && Setup.HostKeyChanged(err))
        {
            var ans = (DialogResult)Invoke(new Func<DialogResult>(() => MessageBox.Show(this,
                "This PC remembers a different device at " + ip + " (for example after a router reset or a new router).\n\nForget the old entry and try again?",
                "Router Home Setup", MessageBoxButtons.YesNo, MessageBoxIcon.Question)));
            if (ans == DialogResult.Yes) { Setup.ForgetHostKey(ip); Log("Forgot the old entry; trying again."); rc = Setup.Ssh(ip, pw, cmd, data, askpass, Log, out err, extra); }
        }
        if (rc == 0)
        {
            if (mode == 1)
            {
                Status("Installed! Open the admin page and press Ctrl+F5 once.", Color.ForestGreen);
                Log(""); Log("Installed! Open https://" + ip + " , log in and press Ctrl+F5 once. \"Home\" is now the first item in the menu.");
                if (chosen.Count > 0) Log("Your optional changes can be undone any time: run this again and choose \"Undo\".");
                BeginInvoke(new Action(() => openBtn.Visible = true));
            }
            else Status("Done.", Color.ForestGreen);
        }
        else if (rc == 255 && key != null && Setup.WrongPassword(err))
        {
            Status("The router didn't accept that SSH key.", Color.Firebrick);
            Log("The router refused the key " + Path.GetFileName(key) + ". Pick the key that's installed on this router (the file without .pub).");
        }
        else if (rc == 255 && Setup.KeysOnly(err))
        {
            Status("This router only allows SSH keys, so no password can work. See below.", Color.Firebrick);
            Log("");
            Log("The router turned password login for SSH off (\"SSH keys only\"), so it refuses every password, even the right one.");
            Log("Either: click \"Use an SSH key instead\" and pick the key you set up for this router,");
            Log("or turn password login for SSH back on in the router's admin page, then try again.");
        }
        else if (rc == 255 && Setup.WrongPassword(err)) Status("The router didn't accept the password. It's the admin page password.", Color.Firebrick);
        else Status("It didn't finish (code " + rc + "). Nothing harmful was left behind; details below.", Color.Firebrick);
    }
}

package main

// usage: winrestool out.syso id:image.png [id:image.png ...]
// Builds icon resources (id 1 is the app icon) plus a PerMonitorV2 manifest and
// version info. The version comes from HOMEHUB_VERSION (default 1.0.0).
import (
	"image"
	_ "image/png"
	"os"
	"strconv"
	"strings"

	"github.com/tc-hib/winres"
	"github.com/tc-hib/winres/version"
)

func main() {
	rs := &winres.ResourceSet{}
	for _, a := range os.Args[2:] {
		p := strings.SplitN(a, ":", 2)
		id, _ := strconv.Atoi(p[0])
		f, err := os.Open(p[1])
		if err != nil {
			panic(err)
		}
		img, _, err := image.Decode(f)
		if err != nil {
			panic(err)
		}
		f.Close()
		ic, err := winres.NewIconFromResizedImage(img, []int{256, 64, 48, 40, 32, 24, 20, 16})
		if err != nil {
			panic(err)
		}
		rs.SetIcon(winres.ID(id), ic)
	}
	manifest := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <assemblyIdentity type="win32" name="HomeHub" version="1.0.0.0" processorArchitecture="amd64"/>
  <dependency><dependentAssembly><assemblyIdentity type="win32" name="Microsoft.Windows.Common-Controls" version="6.0.0.0" processorArchitecture="*" publicKeyToken="6595b64144ccf1df" language="*"/></dependentAssembly></dependency>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1"><application><supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}"/></application></compatibility>
  <application xmlns="urn:schemas-microsoft-com:asm.v3"><windowsSettings>
    <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true/pm</dpiAware>
    <dpiAwareness xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">PerMonitorV2</dpiAwareness>
  </windowsSettings></application>
</assembly>`
	rs.Set(winres.RT_MANIFEST, winres.ID(1), 0, []byte(manifest))
	ver := os.Getenv("HOMEHUB_VERSION")
	if ver == "" {
		ver = "1.0.0"
	}
	vi := version.Info{}
	vi.SetFileVersion(ver)
	vi.SetProductVersion(ver)
	for k, v := range map[string]string{
		version.FileDescription: "Home Hub", version.ProductName: "Home Hub",
		version.InternalName: "HomeHub", version.OriginalFilename: "HomeHub.exe",
		version.Comments: "Your home network's web pages in one window, with GL.iNet router alerts in the system tray.", version.ProductVersion: ver, version.FileVersion: ver,
	} {
		_ = vi.Set(0x0409, k, v)
	}
	rs.SetVersionInfo(vi)
	out, err := os.Create(os.Args[1])
	if err != nil {
		panic(err)
	}
	defer out.Close()
	if err := rs.WriteObject(out, winres.ArchAMD64); err != nil {
		panic(err)
	}
}

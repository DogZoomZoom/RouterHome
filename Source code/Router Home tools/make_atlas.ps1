param([string]$Out)
# Builds weather_atlas.bin: anti-aliased glyphs (alpha) for 3 font sizes + RGBA weather icons,
# so the router can draw nice text/icons onto its sleep-screen wallpaper without any font engine.
Add-Type -AssemblyName System.Drawing
$ms = New-Object System.IO.MemoryStream; $bw = New-Object System.IO.BinaryWriter $ms
$bw.Write([byte[]][char[]]"WXA1")
$fonts = @(
  @{ id=1; f=(New-Object System.Drawing.Font("Segoe UI Semibold", 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)) },
  @{ id=2; f=(New-Object System.Drawing.Font("Segoe UI Semibold", 13, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)) },
  @{ id=3; f=(New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)) }
)
$chars = @(); for ($c = 32; $c -le 126; $c++) { $chars += [char]$c }; $chars += [char]0xB0; $chars += [char]0xB7
$sf = [System.Drawing.StringFormat]::GenericTypographic
foreach ($F in $fonts) {
  $font = $F.f; $fam = $font.FontFamily
  $asc = [Math]::Round($fam.GetCellAscent($font.Style) * $font.Size / $fam.GetEmHeight($font.Style))
  foreach ($ch in $chars) {
    $S = 80; $pad = 10
    $bmp = New-Object System.Drawing.Bitmap $S, $S; $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Black); $g.TextRenderingHint = 'AntiAliasGridFit'
    $g.DrawString([string]$ch, $font, [System.Drawing.Brushes]::White, [single]$pad, [single]$pad, $sf)
    $adv = [int][Math]::Round($g.MeasureString([string]$ch, $font, [System.Drawing.PointF]::Empty, $sf).Width)
    if ($ch -eq ' ') { $adv = [int][Math]::Round($font.Size * 0.28) }
    $g.Dispose()
    $minx = $S; $miny = $S; $maxx = -1; $maxy = -1
    for ($y = 0; $y -lt $S; $y++) { for ($x = 0; $x -lt $S; $x++) { if ($bmp.GetPixel($x, $y).R -gt 8) { if ($x -lt $minx) {$minx=$x}; if ($y -lt $miny) {$miny=$y}; if ($x -gt $maxx) {$maxx=$x}; if ($y -gt $maxy) {$maxy=$y} } } }
    $code = [int][char]$ch
    $bw.Write([byte]1); $bw.Write([byte]$F.id); $bw.Write([uint16]$code)
    if ($maxx -lt 0) { $bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([sbyte]0); $bw.Write([sbyte]0); $bw.Write([byte]$adv); $bmp.Dispose(); continue }
    $w = $maxx - $minx + 1; $h = $maxy - $miny + 1
    $bw.Write([byte]$w); $bw.Write([byte]$h); $bw.Write([sbyte]($minx - $pad)); $bw.Write([sbyte]($miny - ($pad + $asc))); $bw.Write([byte]$adv)
    for ($y = $miny; $y -le $maxy; $y++) { for ($x = $minx; $x -le $maxx; $x++) { $bw.Write([byte]$bmp.GetPixel($x, $y).R) } }
    $bmp.Dispose()
  }
}
# icons (RGBA, 40x40)
function NewIcon { $b = New-Object System.Drawing.Bitmap 40, 40; $g = [System.Drawing.Graphics]::FromImage($b); $g.SmoothingMode = 'AntiAlias'; $g.Clear([System.Drawing.Color]::Transparent); return @($b, $g) }
function Sun($g, $cx, $cy, $r) { $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 204, 51)), 2.4; $pen.StartCap='Round'; $pen.EndCap='Round'
  for ($i = 0; $i -lt 8; $i++) { $a = $i * [Math]::PI / 4; $g.DrawLine($pen, [single]($cx + [Math]::Cos($a) * ($r + 3)), [single]($cy + [Math]::Sin($a) * ($r + 3)), [single]($cx + [Math]::Cos($a) * ($r + 7)), [single]($cy + [Math]::Sin($a) * ($r + 7))) }
  $g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 204, 51))), [single]($cx - $r), [single]($cy - $r), [single](2 * $r), [single](2 * $r)) }
function Moon($g, $cx, $cy, $r) { $p = New-Object System.Drawing.Drawing2D.GraphicsPath; $p.AddEllipse([single]($cx - $r), [single]($cy - $r), [single](2*$r), [single](2*$r)); $rg = New-Object System.Drawing.Region $p
  $p2 = New-Object System.Drawing.Drawing2D.GraphicsPath; $p2.AddEllipse([single]($cx - $r + $r*0.7), [single]($cy - $r - $r*0.35), [single](2*$r), [single](2*$r)); $rg.Exclude($p2); $g.FillRegion((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(242, 232, 190))), $rg) }
function Cloud($g, $x, $y, $s, $col) { $b = New-Object System.Drawing.SolidBrush $col
  $g.FillEllipse($b, [single]($x), [single]($y + 8*$s), [single](14*$s), [single](12*$s)); $g.FillEllipse($b, [single]($x + 7*$s), [single]($y), [single](17*$s), [single](17*$s))
  $g.FillEllipse($b, [single]($x + 17*$s), [single]($y + 6*$s), [single](13*$s), [single](13*$s)); $g.FillRectangle($b, [single]($x + 6*$s), [single]($y + 12*$s), [single](18*$s), [single](8*$s)) }
$white = [System.Drawing.Color]::FromArgb(245, 247, 252); $grey = [System.Drawing.Color]::FromArgb(176, 184, 200); $dark = [System.Drawing.Color]::FromArgb(120, 128, 148)
$icons = @{}
$icons[1] = { param($g) Sun $g 20 20 8 }
$icons[2] = { param($g) Moon $g 20 20 11 }
$icons[3] = { param($g) Cloud $g 4 10 1.05 $grey; Cloud $g 2 13 1.0 $white }
$icons[4] = { param($g) Sun $g 14 14 6.5; Cloud $g 6 16 0.95 $white }
$icons[5] = { param($g) Moon $g 15 14 8; Cloud $g 6 16 0.95 $white }
$icons[6] = { param($g) Cloud $g 3 4 1.05 $grey; $p = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(90, 170, 255)), 2.4; $p.StartCap='Round'; $p.EndCap='Round'; foreach ($dx in 10,18,26) { $g.DrawLine($p, [single]$dx, [single]28, [single]($dx - 3), [single]36) } }
$icons[7] = { param($g) Cloud $g 3 4 1.05 $white; $b = New-Object System.Drawing.SolidBrush $white; foreach ($pt in @(@(9,30),@(18,34),@(27,30),@(14,37),@(23,37))) { $g.FillEllipse($b, [single]($pt[0]-2), [single]($pt[1]-2), [single]4, [single]4) } }
$icons[8] = { param($g) Cloud $g 3 3 1.05 $dark; $pts = [System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 21,22),(New-Object System.Drawing.PointF 14,31),(New-Object System.Drawing.PointF 19,31),(New-Object System.Drawing.PointF 16,39),(New-Object System.Drawing.PointF 25,28),(New-Object System.Drawing.PointF 20,28),(New-Object System.Drawing.PointF 23,22)); $g.FillPolygon((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 214, 10))), $pts) }
$icons[9] = { param($g) $p = New-Object System.Drawing.Pen $grey, 3; $p.StartCap='Round'; $p.EndCap='Round'; foreach ($yy in 12,20,28) { $g.DrawLine($p, [single]6, [single]$yy, [single]34, [single]$yy) } }
foreach ($id in 1..9) {
  $pair = NewIcon; $b = $pair[0]; $g = $pair[1]; & $icons[$id] $g; $g.Dispose()
  $bw.Write([byte]2); $bw.Write([byte]$id); $bw.Write([byte]40); $bw.Write([byte]40)
  for ($y = 0; $y -lt 40; $y++) { for ($x = 0; $x -lt 40; $x++) { $c = $b.GetPixel($x, $y); $bw.Write([byte]$c.R); $bw.Write([byte]$c.G); $bw.Write([byte]$c.B); $bw.Write([byte]$c.A) } }
  $b.Dispose()
}
$bw.Write([byte]0); $bw.Flush(); [IO.File]::WriteAllBytes($Out, $ms.ToArray()); "atlas: $Out ($($ms.Length) bytes)"

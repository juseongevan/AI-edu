$src  = "C:\Users\JU_SEONG\Desktop\R-BG AI"
$dest = "C:\Users\JU_SEONG\Desktop\vibe-gallery-source.zip"

if (Test-Path $dest) { Remove-Item $dest -Force }

$include = @("src", "firebase.json", "firestore.rules", "storage.rules", ".firebaserc", "package.json", "vite.config.js", "index.html")

Add-Type -Assembly "System.IO.Compression.FileSystem"
$zip = [System.IO.Compression.ZipFile]::Open($dest, "Create")

foreach ($item in $include) {
    $fullPath = Join-Path $src $item
    if (-not (Test-Path $fullPath)) { continue }

    if (Test-Path $fullPath -PathType Container) {
        Get-ChildItem $fullPath -Recurse -File | ForEach-Object {
            $entryName = $item + "/" + ($_.FullName.Substring($fullPath.Length + 1).Replace("\", "/"))
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryName) | Out-Null
        }
    } else {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $item) | Out-Null
    }
}

$zip.Dispose()

$size = [math]::Round((Get-Item $dest).Length / 1KB, 1)
Write-Output "OK: $dest ($size KB)"

Add-Type -AssemblyName System.IO.Compression.FileSystem
$docPath = "D:\WEB KJPP NSR_Compro new ver\username dan password kjppnsr.docx"
$tempPath = [System.IO.Path]::GetTempFileName()
$fileStream = [System.IO.File]::Open($docPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
$outStream = [System.IO.File]::Create($tempPath)
$fileStream.CopyTo($outStream)
$fileStream.Close()
$outStream.Close()

$zip = [System.IO.Compression.ZipFile]::OpenRead($tempPath)
$entry = $zip.GetEntry("word/document.xml")
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$raw = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()
[System.IO.File]::Delete($tempPath)

$clean = $raw -replace "<[^>]+>", " "
$clean = $clean -replace "\s+", " "
Write-Output $clean


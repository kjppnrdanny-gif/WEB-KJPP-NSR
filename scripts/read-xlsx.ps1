Add-Type -AssemblyName System.IO.Compression.FileSystem

$xlsxPath = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/.user_uploaded/media_1792777876315_fb87e526.xlsx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($xlsxPath)

Write-Output "--- XLSX SHEETS / ENTRIES ---"
foreach ($e in $zip.Entries) {
    if ($e.FullName -match 'sheet|sharedStrings') {
        Write-Output $e.FullName
    }
}

$entryStrings = $zip.GetEntry('xl/sharedStrings.xml')
if ($entryStrings) {
    $stream = $entryStrings.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xmlContent = $reader.ReadToEnd()
    $reader.Close()
    $stream.Close()
    $xml = [xml]$xmlContent
    $ts = $xml.GetElementsByTagName('t')
    Write-Output "--- SHARED STRINGS ($($ts.Count)) ---"
    $count = 0
    foreach ($t in $ts) {
        $count++
        if ($count -le 50 -or $t.InnerText -match 'Job Order|ETI|Independen|Penilai') {
            Write-Output "[$count] $($t.InnerText)"
        }
    }
}
$zip.Dispose()

Add-Type -AssemblyName System.IO.Compression.FileSystem

$xlsxPath = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/.user_uploaded/media_1792777876315_fb87e526.xlsx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($xlsxPath)

$entryWb = $zip.GetEntry('xl/workbook.xml')
if ($entryWb) {
    $stream = $entryWb.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = [xml]$reader.ReadToEnd()
    $reader.Close()
    $stream.Close()
    $sheets = $xml.GetElementsByTagName('sheet')
    foreach ($s in $sheets) {
        Write-Output "Sheet: $($s.name) (id: $($s.sheetId))"
    }
}
$zip.Dispose()

Add-Type -AssemblyName System.IO.Compression.FileSystem

$docxPath = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/.user_uploaded/media_1792777876380_b71c057e.docx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)

$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlContent = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

$xml = [xml]$xmlContent
$paragraphs = $xml.GetElementsByTagName('w:p')

$allHeadings = @()
foreach ($p in $paragraphs) {
    $text = ''
    $ts = $p.GetElementsByTagName('w:t')
    foreach ($t in $ts) { $text += $t.InnerText }
    $trimmed = $text.Trim()
    # Check if text is all uppercase or starts with capital and looks like a section
    if ($trimmed -match '^[A-Z\s\/\(\)\,\.\-]{4,}$' -and $trimmed.Length -lt 80 -and $trimmed -notmatch 'KJPP|MEDAN|BANK|NPWP|JALAN|JAKARTA|Licensed|Rekan|No\.') {
        $allHeadings += $trimmed
    }
}
$allHeadings | ForEach-Object { Write-Output $_ }

import zipfile
import xml.etree.ElementTree as ET
import re

docx_path = r'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/.user_uploaded/media_1792777876370_5bfbcdad.docx'

with zipfile.ZipFile(docx_path) as z:
    xml_content = z.read('word/document.xml')
    tree = ET.fromstring(xml_content)
    
    # namespaces
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    paragraphs = []
    for p in tree.findall('.//w:p', ns):
        texts = [node.text for node in p.findall('.//w:t', ns) if node.text]
        if texts:
            paragraphs.append(''.join(texts))

print(f"Total paragraphs: {len(paragraphs)}")

# Let's find all numbered clauses or headings
clauses = []
for p in paragraphs:
    p_strip = p.strip()
    # Check if starts with a number or roman numeral or heading
    m = re.match(r'^(\d+[\.\)]|[A-Z][\.\)]|[IVXLCDM]+[\.\)])\s*(.*)', p_strip)
    if m:
        clauses.append(p_strip)
    elif any(k in p_strip.lower() for k in ['lingkup penugasan', 'klausul', 'pemberi tugas', 'objek penilaian', 'dasar nilai', 'asumsi']):
        clauses.append("HEADING: " + p_strip)

for idx, c in enumerate(clauses[:60]):
    print(f"[{idx+1}] {c}")

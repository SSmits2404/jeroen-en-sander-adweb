import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

p = Path('Eindopdracht ADWEB 2425.docx')
print('DOCX_EXISTS', p.exists())
if p.exists():
    with zipfile.ZipFile(p, 'r') as z:
        if 'word/document.xml' in z.namelist():
            xml = z.read('word/document.xml')
            root = ET.fromstring(xml)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            print('DOCX_TEXT_START')
            for para in root.findall('.//w:p', ns):
                words = [t.text for t in para.findall('.//w:t', ns) if t.text]
                line = ''.join(words).strip()
                if line:
                    print(line)
            print('DOCX_TEXT_END')
        else:
            print('DOCX_NO_DOCUMENT_XML')

try:
    from pathlib import Path
    import PyPDF2
    p = Path('rubric.pdf')
    print('PDF_EXISTS', p.exists())
    if p.exists():
        print('PDF_TEXT_START')
        with open(p, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for i, page in enumerate(reader.pages, 1):
                text = page.extract_text()
                if text:
                    print(f'---PAGE {i}---')
                    print(text)
        print('PDF_TEXT_END')
except Exception as e:
    print('PDF_ERROR', type(e).__name__, e)

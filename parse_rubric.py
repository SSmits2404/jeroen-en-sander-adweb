from pathlib import Path
from pypdf import PdfReader

p = Path('rubric.pdf')
print('PDF_EXISTS', p.exists())
if not p.exists():
    raise FileNotFoundError(p)
reader = PdfReader(p)
print('PDF_TEXT_START')
for i, page in enumerate(reader.pages, 1):
    text = page.extract_text()
    print(f'---PAGE {i}---')
    print(text or '')
print('PDF_TEXT_END')

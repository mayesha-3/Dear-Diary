from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_sample_pdf(pdf_path):
    c = canvas.Canvas(pdf_path, pagesize=letter)
    
    # --- METADATA ---
    c.setTitle("Sample PDF Document")
    c.setAuthor("John Doe")
    c.setSubject("PDF Extraction Test")
    c.setCreator("ReportLab PDF Generator")
    c.setProducer("ReportLab")

    # --- PAGE 1 ---
    c.drawString(100, 750, "Hello, this is page 1.")
    c.drawString(100, 730, "This PDF is created for testing text extraction.")
    c.showPage()

    # --- PAGE 2 ---
    c.drawString(100, 750, "Welcome to page 2.")
    c.drawString(100, 730, "You can add more text here to test multi-page extraction.")
    c.showPage()

    # --- PAGE 3 ---
    c.drawString(100, 750, "Page 3 contains some special characters:")
    c.drawString(100, 730, "© ™ ✓ ∑ ∞ →")
    c.showPage()

    c.save()
    print(f"Sample PDF created at: {pdf_path}")

# --- HOW TO RUN ---
create_sample_pdf("sample.pdf")

from pypdf import PdfReader

def pdf_to_plain_text(pdf_path, output_txt_path):
    try:
        # 1. Initialize the PDF reader
        reader = PdfReader(pdf_path)
        
        # 2. Open the output text file for writing (using utf-8 to handle special characters)
        with open(output_txt_path, "w", encoding="utf-8") as txt_file:
            
            # --- EXTRACT METADATA ---
            txt_file.write("=========================================\n")
            txt_file.write("           DOCUMENT METADATA             \n")
            txt_file.write("=========================================\n")
            
            meta = reader.metadata
            if meta:
                # Common metadata fields
                txt_file.write(f"Title: {meta.title}\n")
                txt_file.write(f"Author: {meta.author}\n")
                txt_file.write(f"Subject: {meta.subject}\n")
                txt_file.write(f"Creator: {meta.creator}\n")
                txt_file.write(f"Producer: {meta.producer}\n")
            else:
                txt_file.write("No metadata found.\n")
                
            txt_file.write(f"Total Pages: {len(reader.pages)}\n")
            txt_file.write("\n\n")
            
            # --- EXTRACT TEXT PAGE BY PAGE ---
            txt_file.write("=========================================\n")
            txt_file.write("           DOCUMENT CONTENT              \n")
            txt_file.write("=========================================\n")
            
            for index, page in enumerate(reader.pages):
                txt_file.write(f"--- Page {index + 1} ---\n")
                
                # Extract text from the current page
                page_text = page.extract_text()
                
                if page_text:
                    txt_file.write(page_text)
                else:
                    # This happens if the page is blank or an unscanned image
                    txt_file.write("[No readable text found on this page]\n")
                    
                txt_file.write("\n\n")
                
        print(f"Success! PDF content successfully saved to: {output_txt_path}")
        
    except FileNotFoundError:
        print(f"Error: The file '{pdf_path}' could not be found.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# --- HOW TO RUN IT ---
# Replace 'sample.pdf' with your actual PDF file path
pdf_input = "sample.pdf"
txt_output = "extracted_output.txt"

pdf_to_plain_text(pdf_input, txt_output)
import sys
from pathlib import Path
from pypdf import PdfReader


def pdf_to_plain_text(pdf_path, output_txt_path):
    try:
        input_path = Path(pdf_path)
        output_path = Path(output_txt_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if not input_path.is_file():
            raise FileNotFoundError(f"PDF file does not exist: {input_path}")

        reader = PdfReader(str(input_path))
        with output_path.open("w", encoding="utf-8") as txt_file:
            meta = reader.metadata or {}
            title = meta.get('/Title') or meta.get('Title') or 'Unknown'
            txt_file.write(f"Title: {title}\n")
            txt_file.write(f"Total Pages: {len(reader.pages)}\n\n")

            for page_number, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""
                txt_file.write(f"--- Page {page_number} ---\n")
                txt_file.write(page_text.strip())
                txt_file.write("\n\n")

        print(f"SUCCESS:{output_path}", flush=True)

    except Exception as e:
        print(f"ERROR:{e}", file=sys.stderr, flush=True)
        raise


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("ERROR: Missing arguments", file=sys.stderr, flush=True)
        sys.exit(1)

    pdf_to_plain_text(sys.argv[1], sys.argv[2])
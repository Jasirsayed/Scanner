# Invoice PDF Renamer Website

Client-side website that renames invoice PDFs using this exact format:

`Invoice Number - Company Full Name`

Example:

`285607736 - Teejan Equipments LLC.pdf`

## Extraction rules

- Invoice number is read from labels like `Invoice No`, `Invoice Number`, `Invoice #`, or `INV`.
- Company name is extracted from the `Billed To:` section.
- If required fields are missing, the app falls back to a sanitized original filename.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.

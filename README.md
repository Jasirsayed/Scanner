# PDF Renamer Website

Simple static website that suggests a PDF filename based on extracted text from the first pages.

## How it works

1. Upload a `.pdf` file.
2. The app extracts text from the first 3 pages using PDF.js.
3. It generates a slug-style filename from the first meaningful words.
4. Click **Download with new name** to save the same PDF under the suggested filename.

## Run locally

Because the app uses JavaScript modules, serve it through a local web server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

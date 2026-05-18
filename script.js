import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs';

const fileInput = document.getElementById('pdfFile');
const suggestedNameElement = document.getElementById('suggestedName');
const resultCard = document.getElementById('result');
const statusElement = document.getElementById('status');
const downloadButton = document.getElementById('downloadButton');

let currentFile = null;
let currentSuggestedName = null;

const MAX_PAGES = 3;

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  currentFile = file;
  setStatus('Reading PDF content...');
  resultCard.classList.add('hidden');

  try {
    const text = await extractText(file);
    const name = buildFileName(text, file.name);

    currentSuggestedName = `${name}.pdf`;
    suggestedNameElement.textContent = currentSuggestedName;
    resultCard.classList.remove('hidden');
    setStatus('Done. Review the suggested name and download.');
  } catch (error) {
    console.error(error);
    currentSuggestedName = null;
    setStatus('Could not read this PDF. Try a different file.');
  }
});

downloadButton.addEventListener('click', () => {
  if (!currentFile || !currentSuggestedName) {
    return;
  }

  const url = URL.createObjectURL(currentFile);
  const link = document.createElement('a');
  link.href = url;
  link.download = currentSuggestedName;
  link.click();
  URL.revokeObjectURL(url);
});

async function extractText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageCount = Math.min(pdf.numPages, MAX_PAGES);
  const chunks = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');
    chunks.push(pageText);
  }

  return chunks.join(' ');
}

function buildFileName(text, fallbackName) {
  const cleanText = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleanText
    .split(' ')
    .filter((word) => word.length > 3)
    .slice(0, 6);

  const fromContent = words.join('_');
  if (fromContent) {
    return fromContent.slice(0, 80);
  }

  return sanitizeFallbackName(fallbackName);
}

function sanitizeFallbackName(fileName) {
  return fileName
    .replace(/\.pdf$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'renamed_document';
}

function setStatus(message) {
  statusElement.textContent = message;
}

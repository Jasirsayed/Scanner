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

const MAX_PAGES = 4;

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  currentFile = file;
  resultCard.classList.add('hidden');
  setStatus('Reading invoice content...');

  try {
    const text = await extractText(file);
    const name = buildInvoiceName(text, file.name);

    currentSuggestedName = `${name}.pdf`;
    suggestedNameElement.textContent = currentSuggestedName;
    resultCard.classList.remove('hidden');
    setStatus('Done. Verify the format and download.');
  } catch (error) {
    console.error(error);
    currentSuggestedName = null;
    setStatus('Could not parse this PDF. Please try another file.');
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

  return chunks.join('\n');
}

function buildInvoiceName(text, fallbackName) {
  const invoiceNumber = extractInvoiceNumber(text);
  const companyName = extractCompanyName(text);

  if (invoiceNumber && companyName) {
    return sanitizeFileName(`${invoiceNumber} - ${companyName}`);
  }

  return sanitizeFileName(sanitizeFallbackName(fallbackName));
}

function extractInvoiceNumber(text) {
  const patterns = [
    /invoice\s*(?:no|number|#)?\s*[:\-]?\s*([a-z0-9\-/]+)/i,
    /inv\s*(?:no|number|#)?\s*[:\-]?\s*([a-z0-9\-/]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/[^a-z0-9\-/]/gi, '');
    }
  }

  return null;
}

function extractCompanyName(text) {
  const billedSectionMatch = text.match(/billed\s*to\s*[:\-]?\s*([\s\S]{0,300})/i);
  if (!billedSectionMatch) {
    return null;
  }

  const section = billedSectionMatch[1]
    .replace(/\s+/g, ' ')
    .trim();

  const stopKeywords = ['invoice', 'date', 'phone', 'email', 'ship to', 'subtotal', 'tax', 'total'];
  let candidate = section;
  for (const keyword of stopKeywords) {
    const index = candidate.toLowerCase().indexOf(keyword);
    if (index > 0) {
      candidate = candidate.slice(0, index).trim();
    }
  }

  const nameMatch = candidate.match(/^([a-z0-9&.,'()\-\s]{3,80})/i);
  return nameMatch ? nameMatch[1].trim() : null;
}

function sanitizeFileName(name) {
  return name
    .replace(/\s+/g, ' ')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim();
}

function sanitizeFallbackName(fileName) {
  return fileName
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'renamed_invoice';
}

function setStatus(message) {
  statusElement.textContent = message;
}

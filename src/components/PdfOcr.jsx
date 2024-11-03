import Tesseract from 'tesseract.js';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf';

// Set the worker source for PDF.js
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs`;

// Function to convert PDF to text
async function pdfToText(pdfUrl) {
  const response = await fetch(pdfUrl);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const imagesList = [];

  // Render each page as an image
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport: viewport,
    }).promise;

    // Convert canvas to data URL
    const img = canvas.toDataURL("image/png");
    imagesList.push(img);
  }

  // Perform OCR on each image and collect results
  const textPromises = imagesList.map(async (img) => {
    const result = await Tesseract.recognize(img, 'eng', {
      logger: (m) => console.log(m), // Optional: for logging progress
    });

    if (result && result.data && result.data.text) {
      return result.data.text; // Return the extracted text
    } else {
      throw new Error('No text found in the OCR result.');
    }
  });

  try {
    // Wait for all OCR promises to resolve
    const results = await Promise.all(textPromises);
    // Join all results into a single string
    return results.join('\n');
  } catch (error) {
    console.error('Error during OCR processing:', error);
    throw new Error('Error extracting text from the PDF.');
  }
}

export default pdfToText;

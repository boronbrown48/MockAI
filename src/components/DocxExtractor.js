import mammoth from "mammoth";

/**
 * Extract text from a .docx file
 * @param {File} file - The .docx file (from an input element)
 * @returns {Promise<string>} - The extracted plain text
 */
export async function extractTextFromDocx(file) {
  if (!file || file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    throw new Error("Invalid file type. Please upload a .docx file.");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value; // Return the extracted plain text
  } catch (error) {
    console.error("Error extracting text from DOCX file:", error);
    throw new Error("Failed to extract text. Please try again.");
  }
}

// Text extraction utilities for different file types

const extractTextFromBuffer = (buffer, mimeType) => {
  try {
    switch (mimeType) {
      case 'application/pdf':
        return extractPDFText(buffer);
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return extractWordText(buffer);
      case 'text/plain':
        return buffer.toString('utf-8');
      default:
        throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from file');
  }
};

// Basic PDF text extraction (simplified approach)
const extractPDFText = (buffer) => {
  try {
    // Convert buffer to string and extract readable text
    let text = buffer.toString('binary');
    
    // Basic PDF text extraction - remove PDF formatting
    text = text.replace(/[^\x20-\x7E\n\r\t]/g, ' '); // Remove non-printable characters
    text = text.replace(/\s+/g, ' '); // Normalize whitespace
    text = text.trim();
    
    // If the text is too short or seems corrupted, return a message
    if (text.length < 50) {
      return 'PDF text extraction requires manual processing. Please ensure the PDF contains selectable text.';
    }
    
    return text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return 'Unable to extract text from PDF. Please try uploading a text-based PDF or Word document.';
  }
};

// Basic Word document text extraction (simplified approach)
const extractWordText = (buffer) => {
  try {
    // Convert buffer to string for basic text extraction
    let text = buffer.toString('utf-8');
    
    // Basic cleanup for Word documents
    text = text.replace(/[^\x20-\x7E\n\r\t]/g, ' '); // Remove non-printable characters
    text = text.replace(/\s+/g, ' '); // Normalize whitespace
    text = text.trim();
    
    return text;
  } catch (error) {
    console.error('Word extraction error:', error);
    return 'Unable to extract text from Word document. Please try uploading as PDF or text file.';
  }
};

module.exports = {
  extractTextFromBuffer
};
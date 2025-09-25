// File Processing Utilities

// Extract text from different file types
export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const result = e.target?.result;
        
        if (file.type === 'application/pdf') {
          // For PDF files, we'll extract text using a simple approach
          // In production, you might want to use pdf-parse or similar library
          const arrayBuffer = result as ArrayBuffer;
          const text = await extractPDFText(arrayBuffer);
          resolve(text);
        } else if (file.type.includes('word')) {
          // For Word documents, basic text extraction
          const text = result as string;
          resolve(text);
        } else {
          // For plain text files
          const text = result as string;
          resolve(text);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    if (file.type === 'application/pdf') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
};

// Basic PDF text extraction (simplified)
const extractPDFText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    // Convert ArrayBuffer to string for basic text extraction
    // This is a simplified approach - in production, use a proper PDF parser
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8');
    let text = decoder.decode(uint8Array);
    
    // Basic cleanup for PDF text
    text = text.replace(/[^\x20-\x7E\n\r\t]/g, ' '); // Remove non-printable characters
    text = text.replace(/\s+/g, ' '); // Normalize whitespace
    text = text.trim();
    
    return text;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

// Validate file for resume upload
export const validateResumeFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please upload a PDF, Word document, or text file'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 10MB'
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File appears to be empty'
    };
  }

  return { isValid: true };
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate unique file path for storage
export const generateFilePath = (fileName: string, userId: string): string => {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `resumes/${userId}/${timestamp}_${cleanFileName}`;
};
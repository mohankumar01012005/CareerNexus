// Resume Upload Component with Drag & Drop and Progress Tracking

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Loader2
} from 'lucide-react';
import { uploadFile, getPublicUrl } from '../config/supabase';
import { useResume } from '../hooks/useResume';
import { extractTextFromFile, validateResumeFile, formatFileSize, generateFilePath } from '../utils/fileUtils';
import { useToast } from '../hooks/use-toast';

interface ResumeUploadProps {
  onUploadComplete?: (resumeData: any) => void;
  currentResume?: string;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUploadComplete, currentResume }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { toast } = useToast();
  const { uploadResume } = useResume();

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const validation = validateResumeFile(file);
    if (validation.isValid) {
      setSelectedFile(file);
      setErrorMessage('');
      setUploadStatus('idle');
    } else {
      setErrorMessage(validation.error || 'Invalid file');
    }
  }, []);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Upload and process resume
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Step 1: Upload to Supabase (30% progress)
      const fileName = generateFilePath(selectedFile.name, 'current-user'); // You'll need to get actual user ID
      setUploadProgress(10);
      
      await uploadFile(selectedFile, fileName);
      const resumeUrl = getPublicUrl(fileName);
      setUploadProgress(30);

      // Step 2: Extract text from file (50% progress)
      setUploadStatus('analyzing');
      const resumeText = await extractTextFromFile(selectedFile); 
      setUploadProgress(50);

      // Step 3: Save to database with AI analysis (100% progress)
      const resumeData = {
        fileName: selectedFile.name,
        fileUrl: resumeUrl,
        filePath: fileName,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        resumeText: resumeText
      };

      await uploadResume(resumeData);
      setUploadProgress(80);

      setUploadProgress(100);
      setUploadStatus('success');
      
      toast({
        title: "Resume Uploaded Successfully",
        description: "Your resume has been analyzed and saved to your profile.",
      });

      onUploadComplete?.(resumeData);
      
      // Reset after success
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
      
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-neon-teal" />
          <span>Resume Upload</span>
        </CardTitle>
        <CardDescription>
          Upload your resume for AI-powered analysis and career insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Resume Status */}
        {currentResume && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              You have a resume on file. Upload a new one to replace it.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
            ${isDragging 
              ? 'border-primary bg-primary/5 scale-105' 
              : 'border-border hover:border-primary/50 hover:bg-primary/5'
            }
            ${uploadStatus === 'success' ? 'border-neon-green bg-neon-green/5' : ''}
            ${uploadStatus === 'error' ? 'border-red-400 bg-red-400/5' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {uploadStatus === 'idle' && !selectedFile && (
            <>
              <Upload className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Drop your resume here</h3>
              <p className="text-foreground-secondary mb-4">
                or click to browse files
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="glass-button">
                Choose File
              </Button>
              <p className="text-xs text-foreground-secondary mt-2">
                Supports PDF, DOC, DOCX (max 10MB)
              </p>
            </>
          )}

          {selectedFile && uploadStatus === 'idle' && (
            <div className="space-y-4">
              <FileText className="w-12 h-12 text-neon-teal mx-auto" />
              <div>
                <h3 className="font-semibold">{selectedFile.name}</h3>
                <p className="text-sm text-foreground-secondary">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <div className="flex space-x-2 justify-center">
                <Button onClick={handleUpload} className="btn-gradient-primary">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Analyze
                </Button>
                <Button variant="outline" onClick={handleRemoveFile} className="glass-button">
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          )}

          {(uploadStatus === 'uploading' || uploadStatus === 'analyzing') && (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 text-neon-teal mx-auto animate-spin" />
              <div>
                <h3 className="font-semibold">
                  {uploadStatus === 'uploading' ? 'Uploading Resume...' : 'Analyzing with AI...'}
                </h3>
                <p className="text-sm text-foreground-secondary mb-4">
                  {uploadStatus === 'uploading' 
                    ? 'Securely storing your resume' 
                    : 'AI is extracting insights from your resume'
                  }
                </p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-foreground-secondary mt-2">
                  {uploadProgress}% complete
                </p>
              </div>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-12 h-12 text-neon-green mx-auto" />
              <div>
                <h3 className="font-semibold text-neon-green">Upload Successful!</h3>
                <p className="text-sm text-foreground-secondary">
                  Your resume has been analyzed and saved
                </p>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <div>
                <h3 className="font-semibold text-red-400">Upload Failed</h3>
                <p className="text-sm text-foreground-secondary">
                  {errorMessage}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setUploadStatus('idle')}
                className="glass-button"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Upload Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-neon-teal rounded-full" />
            <span>AI-powered analysis</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-neon-purple rounded-full" />
            <span>Secure cloud storage</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-neon-blue rounded-full" />
            <span>Instant career insights</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeUpload;
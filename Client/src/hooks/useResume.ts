// Custom Hook for Resume Management

import { useState, useEffect } from 'react';
import { ResumeData } from '@/types/resume';
import { useToast } from './use-toast';

export const useResume = () => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch resume data on mount
  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employee/resume`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResumeData(data.resume);
      } else if (response.status === 404) {
        // No resume found - this is okay
        setResumeData(null);
      } else {
        throw new Error('Failed to fetch resume');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch resume';
      setError(errorMessage);
      console.error('Resume fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadResume = async (resumeData: Partial<ResumeData>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employee/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(resumeData)
      });

      if (!response.ok) {
        throw new Error('Failed to upload resume');
      }

      const data = await response.json();
      setResumeData(data.resume);
      
      toast({
        title: "Resume Uploaded",
        description: "Your resume has been successfully analyzed and saved.",
      });

      return data.resume;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload resume';
      setError(errorMessage);
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteResume = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employee/resume`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      setResumeData(null);
      
      toast({
        title: "Resume Deleted",
        description: "Your resume has been removed from the system.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete resume';
      setError(errorMessage);
      
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateCareerAdvice = async (question: string): Promise<string> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employee/career-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        throw new Error('Failed to get career advice');
      }

      const data = await response.json();
      return data.advice;
    } catch (err) {
      console.error('Career advice error:', err);
      throw new Error('Failed to generate career advice');
    }
  };

  return {
    resumeData,
    isLoading,
    error,
    fetchResume,
    uploadResume,
    deleteResume,
    generateCareerAdvice
  };
};
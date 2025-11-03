import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Progress } from '../../components/ui/progress';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  FileText,
  Send,
  UserPlus,
  AlertCircle,
  Loader2,
  TrendingUp,
  Target
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';

import { uploadFile } from '../../lib/supabase';

// Types
interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  requiredSkills: string[];
  deadline: string;
  postedDate: string;
  hasApplied: boolean;
  hasReferred: boolean;
  canApply: boolean;
  canRefer: boolean;
}

interface JobSwitchRequest {
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  rejectionReason?: string;
  rejectionDate?: string;
}

interface ActiveJobsResponse {
  message: string;
  success: boolean;
  jobs: Job[];
  jobSwitchRequest: JobSwitchRequest | null;
  canApply: boolean;
  rejectionMessage?: string;
  employeeInfo: {
    fullName: string;
    email: string;
    department: string;
    role: string;
  };
}

const InternalJobs: React.FC = () => {
  const { credentials } = useAuth();
  const { toast } = useToast();
  
  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobSwitchRequest, setJobSwitchRequest] = useState<JobSwitchRequest | null>(null);
  const [canApply, setCanApply] = useState(true);
  const [rejectionMessage, setRejectionMessage] = useState<string>('');
  
  // Modal states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  // Application states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resumeType, setResumeType] = useState<'current' | 'updated'>('current');
  const [updatedResumeFile, setUpdatedResumeFile] = useState<File | null>(null);
  const [updatedResumeUrl, setUpdatedResumeUrl] = useState<string>('');
  const [uploadingResume, setUploadingResume] = useState(false);
  
  // Referral states
  const [candidateName, setCandidateName] = useState<string>('');
  const [candidateEmail, setCandidateEmail] = useState<string>('');
  const [candidatePhone, setCandidatePhone] = useState<string>('');
  const [candidateResumeFile, setCandidateResumeFile] = useState<File | null>(null);
  const [candidateResumeUrl, setCandidateResumeUrl] = useState<string>('');
  const [candidateSkills, setCandidateSkills] = useState<string>('');
  const [candidateExperience, setCandidateExperience] = useState<string>('');
  const [uploadingCandidateResume, setUploadingCandidateResume] = useState(false);

  // API Base URL
  const API_BASE_URL = 'https://skillcompassserver.vercel.app/api';

  // Fetch active jobs and job switch request status
  const fetchActiveJobs = async () => {
    if (!credentials?.email || !credentials?.password) {
      toast({
        title: "Authentication Error",
        description: "Please log in again to continue.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employee/jobs/active-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      const data: ActiveJobsResponse = await response.json();

      if (data.success) {
        setJobs(data.jobs);
        setJobSwitchRequest(data.jobSwitchRequest);
        setCanApply(data.canApply);
        if (data.rejectionMessage) {
          setRejectionMessage(data.rejectionMessage);
        } else {
          setRejectionMessage('');
        }
      } else {
        throw new Error(data.message || 'Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching active jobs:', error);
      
      let errorMessage = "Failed to load jobs. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit job switch request
  const submitJobSwitchRequest = async () => {
    if (!credentials?.email || !credentials?.password) {
      toast({
        title: "Authentication Error",
        description: "Please log in again to continue.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/employee/jobs/job-switch-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Request Submitted",
          description: "Your job switch request has been submitted for HR review.",
        });
        setIsRequestModalOpen(false);
        fetchActiveJobs(); // Refresh data
      } else {
        throw new Error(data.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting job switch request:', error);
      
      let errorMessage = "Failed to submit request. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Upload resume file
  const uploadResumeFile = async (file: File): Promise<string> => {
    setUploadingResume(true);
    try {
      const result = await uploadFile(file, 'SkillCompass');
      if (result.success && result.publicUrl) {
        return result.publicUrl;
      } else {
        throw new Error(result.error || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      
      let errorMessage = "Failed to upload resume. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      throw new Error(errorMessage);
    } finally {
      setUploadingResume(false);
    }
  };

  // Apply for job
  const applyForJob = async () => {
    if (!selectedJob || !credentials?.email || !credentials?.password) {
      toast({
        title: "Error",
        description: "Please select a job and ensure you're logged in.",
        variant: "destructive"
      });
      return;
    }

    try {
      let finalResumeUrl = '';

      // Only upload if it's an updated resume with a file
      if (resumeType === 'updated' && updatedResumeFile) {
        finalResumeUrl = await uploadResumeFile(updatedResumeFile);
        setUpdatedResumeUrl(finalResumeUrl);
      }

      const requestBody = {
        email: credentials.email,
        password: credentials.password,
        resumeType,
        ...(resumeType === 'updated' && finalResumeUrl && { updatedResume: finalResumeUrl })
      };

      console.log("Sending application request:", {
        jobId: selectedJob._id,
        resumeType,
        hasUpdatedResume: !!finalResumeUrl
      });

      const response = await fetch(`${API_BASE_URL}/employee/jobs/${selectedJob._id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response not OK:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Application Submitted",
          description: `Your application for ${selectedJob.title} has been submitted successfully.`,
        });
        setIsApplyModalOpen(false);
        setIsConfirmModalOpen(false);
        setSelectedJob(null);
        setResumeType('current');
        setUpdatedResumeFile(null);
        setUpdatedResumeUrl('');
        fetchActiveJobs(); // Refresh data
      } else {
        throw new Error(data.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      
      let errorMessage = "Failed to submit application. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Refer candidate
  const referCandidate = async () => {
    if (!selectedJob || !credentials?.email || !credentials?.password) {
      toast({
        title: "Error",
        description: "Please select a job and ensure you're logged in.",
        variant: "destructive"
      });
      return;
    }

    if (!candidateName || !candidateEmail || !candidateResumeFile) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields and upload candidate resume.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingCandidateResume(true);
      const resumeUrl = await uploadResumeFile(candidateResumeFile);

      const requestBody = {
        email: credentials.email,
        password: credentials.password,
        candidateName,
        candidateEmail,
        candidatePhone: candidatePhone || '',
        candidateResume: resumeUrl,
        candidateSkills: candidateSkills.split(',').map(skill => skill.trim()).filter(skill => skill),
        candidateExperience: candidateExperience || ''
      };

      const response = await fetch(`${API_BASE_URL}/employee/jobs/${selectedJob._id}/refer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Referral Submitted",
          description: `You have successfully referred ${candidateName} for ${selectedJob.title}.`,
        });
        setIsReferModalOpen(false);
        setSelectedJob(null);
        // Reset form
        setCandidateName('');
        setCandidateEmail('');
        setCandidatePhone('');
        setCandidateResumeFile(null);
        setCandidateSkills('');
        setCandidateExperience('');
        fetchActiveJobs(); // Refresh data
      } else {
        throw new Error(data.message || 'Failed to submit referral');
      }
    } catch (error) {
      console.error('Error referring candidate:', error);
      
      let errorMessage = "Failed to submit referral. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploadingCandidateResume(false);
    }
  };

  // Handle file selection for updated resume
  const handleUpdatedResumeSelect = (file: File) => {
    setUpdatedResumeFile(file);
  };

  // Handle candidate resume selection
  const handleCandidateResumeSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCandidateResumeFile(file);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-neon-green bg-neon-green/10';
      case 'rejected': return 'text-red-400 bg-red-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-foreground-secondary bg-muted';
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchActiveJobs();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space text-gradient-primary">Internal Job Portal</h1>
          <p className="text-foreground-secondary mt-1">
            Explore internal opportunities and refer talented candidates
          </p>
        </div>
      </div>

      {/* Job Switch Request Card - Always at the top */}
      <Card className="glass-card tilt-3d border-l-4 border-l-neon-teal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6 text-neon-teal" />
            Job Switch Request
          </CardTitle>
          <CardDescription>
            Request approval to apply for internal job opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {jobSwitchRequest ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(jobSwitchRequest.status)}>
                    {jobSwitchRequest.status.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-foreground-secondary">
                    Requested on {formatDate(jobSwitchRequest.requestDate)}
                  </span>
                </div>
                {jobSwitchRequest.status === 'rejected' && (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
              </div>

              {jobSwitchRequest.status === 'rejected' && jobSwitchRequest.rejectionReason && (
                <div className="p-3 bg-red-400/10 border border-red-400/30 rounded-lg">
                  <p className="text-sm text-red-400 font-medium">Request Rejected</p>
                  <p className="text-xs text-red-400/80 mt-1">
                    {jobSwitchRequest.rejectionReason}
                  </p>
                  {rejectionMessage && (
                    <p className="text-xs text-red-400/80 mt-2">{rejectionMessage}</p>
                  )}
                </div>
              )}

              {jobSwitchRequest.status === 'pending' && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Under HR review</span>
                </div>
              )}

              {jobSwitchRequest.status === 'approved' && (
                <div className="flex items-center gap-2 text-neon-green">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Approved - You can apply for jobs</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-foreground-secondary mb-4">
                You need to submit a job switch request before applying for internal positions.
              </p>
              <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-gradient-primary">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Submit Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>Submit Job Switch Request</DialogTitle>
                    <DialogDescription>
                      Your request will be reviewed by HR. You'll be notified once a decision is made.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <p className="text-sm text-foreground-secondary">
                      By submitting this request, you're indicating your interest in exploring internal 
                      career opportunities. HR will review your profile and career goals.
                    </p>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={submitJobSwitchRequest} className="btn-gradient-primary">
                        Submit Request
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Jobs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-space text-gradient-primary">Active Job Opportunities</h2>
          <Badge variant="outline" className="text-sm">
            {jobs.length} positions
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neon-teal" />
            <span className="ml-2 text-foreground-secondary">Loading jobs...</span>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="glass-card text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto text-foreground-secondary mb-4" />
            <h3 className="text-xl font-semibold text-foreground-secondary">No active jobs</h3>
            <p className="text-foreground-secondary mt-2">Check back later for new opportunities.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <Card key={job._id} className="glass-card tilt-3d hover-lift">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <CardDescription className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          {job.department}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-neon-green/10 text-neon-green">
                      {job.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-foreground-secondary">
                    {job.description.substring(0, 150)}...
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center text-foreground-secondary">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {job.salary}
                      </span>
                      <span className="flex items-center text-foreground-secondary">
                        <Calendar className="w-4 h-4 mr-1" />
                        Deadline: {formatDate(job.deadline)}
                      </span>
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.slice(0, 4).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {job.requiredSkills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{job.requiredSkills.length - 4} more
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <Dialog open={isApplyModalOpen && selectedJob?._id === job._id} onOpenChange={(open) => {
                      if (!open) {
                        setIsApplyModalOpen(false);
                        setSelectedJob(null);
                      } else if (job.canApply && canApply) {
                        setSelectedJob(job);
                        setIsApplyModalOpen(true);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          className="flex-1"
                          disabled={!job.canApply || !canApply}
                          variant={job.hasApplied ? "outline" : "default"}
                        >
                          {job.hasApplied ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Applied
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Apply
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Apply for {job.title}</DialogTitle>
                          <DialogDescription>
                            Choose your resume type and submit your application
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6 mt-4">
                          {/* Resume Type Selection - IMPROVED UI */}
                          <div className="space-y-4">
                            <Label className="text-base font-semibold">Select Resume Type</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Button
                                type="button"
                                variant={resumeType === 'current' ? 'default' : 'outline'}
                                onClick={() => setResumeType('current')}
                                className={`h-24 flex-col p-4 transition-all duration-200 ${
                                  resumeType === 'current' 
                                    ? 'bg-gradient-to-r from-neon-teal to-neon-purple text-white border-0 shadow-lg' 
                                    : 'bg-background/50 border-2 border-border hover:border-neon-teal/50 hover:bg-background/80'
                                }`}
                              >
                                <div className="flex flex-col items-center justify-center space-y-2">
                                  <FileText className={`w-6 h-6 ${resumeType === 'current' ? 'text-white' : 'text-neon-teal'}`} />
                                  <span className="font-semibold text-sm">Current Resume</span>
                                  <span className="text-xs text-center opacity-80">
                                    Use your platform resume
                                  </span>
                                </div>
                              </Button>
                              <Button
                                type="button"
                                variant={resumeType === 'updated' ? 'default' : 'outline'}
                                onClick={() => setResumeType('updated')}
                                className={`h-24 flex-col p-4 transition-all duration-200 ${
                                  resumeType === 'updated' 
                                    ? 'bg-gradient-to-r from-neon-teal to-neon-purple text-white border-0 shadow-lg' 
                                    : 'bg-background/50 border-2 border-border hover:border-neon-teal/50 hover:bg-background/80'
                                }`}
                              >
                                <div className="flex flex-col items-center justify-center space-y-2">
                                  <Upload className={`w-6 h-6 ${resumeType === 'updated' ? 'text-white' : 'text-neon-purple'}`} />
                                  <span className="font-semibold text-sm">Updated Resume</span>
                                  <span className="text-xs text-center opacity-80">
                                    Upload new version
                                  </span>
                                </div>
                              </Button>
                            </div>
                          </div>

                          {/* Updated Resume Upload */}
                          {resumeType === 'updated' && (
                            <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-border/50">
                              <Label htmlFor="updatedResume" className="text-base font-semibold">Upload Updated Resume</Label>
                              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-neon-purple/50 transition-colors">
                                <Input
                                  id="updatedResume"
                                  type="file"
                                  accept=".pdf,.doc,.docx,.txt"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpdatedResumeSelect(file);
                                  }}
                                  className="hidden"
                                />
                                <Label htmlFor="updatedResume" className="cursor-pointer flex flex-col items-center">
                                  <Upload className="w-10 h-10 mx-auto text-foreground-secondary mb-3" />
                                  <p className="text-base font-medium">Click to upload resume</p>
                                  <p className="text-sm text-foreground-secondary mt-2">
                                    PDF, DOC, DOCX, TXT (Max 10MB)
                                  </p>
                                </Label>
                                {updatedResumeFile && (
                                  <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <p className="text-sm font-medium flex items-center justify-center">
                                      <FileText className="w-4 h-4 mr-2" />
                                      {updatedResumeFile.name}
                                    </p>
                                    <p className="text-xs text-foreground-secondary mt-1">
                                      Size: {(updatedResumeFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-foreground-secondary">
                                This resume will only be sent for this job application and won't update your platform resume.
                              </p>
                            </div>
                          )}

                          <div className="flex justify-end space-x-3 pt-4">
                            <Button variant="outline" onClick={() => setIsApplyModalOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => setIsConfirmModalOpen(true)}
                              disabled={resumeType === 'updated' && !updatedResumeFile}
                              className="btn-gradient-primary px-6"
                            >
                              Continue
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isReferModalOpen && selectedJob?._id === job._id} onOpenChange={(open) => {
                      if (!open) {
                        setIsReferModalOpen(false);
                        setSelectedJob(null);
                      } else {
                        setSelectedJob(job);
                        setIsReferModalOpen(true);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline"
                          disabled={!job.canRefer}
                          className="flex-1"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Refer
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Refer Candidate for {job.title}</DialogTitle>
                          <DialogDescription>
                            Recommend a talented candidate for this position
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="candidateName">Candidate Name *</Label>
                              <Input
                                id="candidateName"
                                value={candidateName}
                                onChange={(e) => setCandidateName(e.target.value)}
                                placeholder="Enter candidate's full name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="candidateEmail">Candidate Email *</Label>
                              <Input
                                id="candidateEmail"
                                type="email"
                                value={candidateEmail}
                                onChange={(e) => setCandidateEmail(e.target.value)}
                                placeholder="Enter candidate's email"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="candidatePhone">Candidate Phone</Label>
                            <Input
                              id="candidatePhone"
                              value={candidatePhone}
                              onChange={(e) => setCandidatePhone(e.target.value)}
                              placeholder="Enter candidate's phone number"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="candidateSkills">Key Skills (comma separated)</Label>
                            <Input
                              id="candidateSkills"
                              value={candidateSkills}
                              onChange={(e) => setCandidateSkills(e.target.value)}
                              placeholder="e.g., React, Node.js, Python"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="candidateExperience">Experience</Label>
                            <Textarea
                              id="candidateExperience"
                              value={candidateExperience}
                              onChange={(e) => setCandidateExperience(e.target.value)}
                              placeholder="Describe candidate's experience and background"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="candidateResume">Candidate Resume *</Label>
                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                              <Input
                                id="candidateResume"
                                type="file"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleCandidateResumeSelect}
                                className="hidden"
                              />
                              <Label htmlFor="candidateResume" className="cursor-pointer">
                                <Upload className="w-8 h-8 mx-auto text-foreground-secondary mb-2" />
                                <p className="text-sm font-medium">Click to upload candidate resume</p>
                                <p className="text-xs text-foreground-secondary mt-1">
                                  PDF, DOC, DOCX, TXT (Max 10MB)
                                </p>
                              </Label>
                              {candidateResumeFile && (
                                <div className="mt-3 p-2 bg-primary/10 rounded">
                                  <p className="text-sm font-medium flex items-center justify-center">
                                    <FileText className="w-4 h-4 mr-2" />
                                    {candidateResumeFile.name}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={() => setIsReferModalOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={referCandidate}
                              disabled={!candidateName || !candidateEmail || !candidateResumeFile || uploadingCandidateResume}
                              className="btn-gradient-primary"
                            >
                              {uploadingCandidateResume ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Send className="w-4 h-4 mr-2" />
                              )}
                              Submit Referral
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Status Indicators */}
                  {(job.hasApplied || job.hasReferred) && (
                    <div className="pt-2 border-t border-border/50">
                      {job.hasApplied && (
                        <div className="flex items-center text-sm text-neon-green">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          You have applied for this position
                        </div>
                      )}
                      {job.hasReferred && (
                        <div className="flex items-center text-sm text-neon-purple">
                          <UserPlus className="w-4 h-4 mr-2" />
                          You have referred someone for this position
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Application Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Confirm Application</DialogTitle>
            <DialogDescription>
              Please review your application details before submitting
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-primary/5 rounded-lg">
              <h4 className="font-semibold mb-2">Application Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Job:</span>
                  <span className="font-medium">{selectedJob?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Department:</span>
                  <span>{selectedJob?.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Resume Type:</span>
                  <span className="capitalize">{resumeType}</span>
                </div>
                {resumeType === 'updated' && updatedResumeFile && (
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Updated Resume:</span>
                    <span className="font-medium">{updatedResumeFile.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">Important Notice</p>
                  <p className="text-xs text-yellow-400/80 mt-1">
                    Your complete employee profile, skills, career goals, and resume data will be shared with HR for this application.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={applyForJob} className="btn-gradient-primary">
                <Send className="w-4 h-4 mr-2" />
                Confirm & Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternalJobs;
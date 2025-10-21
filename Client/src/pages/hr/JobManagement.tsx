// HR Job Management - Create, Edit, and Manage Internal Job Postings

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Progress } from '../../components/ui/progress';
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Calendar, 
  MapPin,
  DollarSign,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  FileText
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { HR_CREDENTIALS, createBasicAuthHeader } from '../../utils/api';
import JobApplicationsModal from './JobApplicationsModal'; // New import

// Types based on backend schema
interface Applicant {
  _id: string;
  employee: {
    _id: string;
    fullName: string;
    role: string;
    department: string;
    avatar?: string;
    skills: string[];
    experience?: string;
  };
  appliedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  matchPercentage: number;
  skills: string[];
  experience: string;
}

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  postedDate: string;
  deadline: string;
  status: 'draft' | 'active' | 'closed';
  description: string;
  requirements: string[];
  requiredSkills: string[];
  applications: Applicant[];
  createdBy: string;
}

interface JobStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
}

const JobManagement: React.FC = () => {
  // State management
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedJobForApplications, setSelectedJobForApplications] = useState<Job | null>(null); // New state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isApplicationsModalOpen, setIsApplicationsModalOpen] = useState(false); // New state
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<JobStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0
  });
  
  // Form state for new job creation
  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    location: '',
    type: 'Full-time',
    salary: '',
    description: '',
    requirements: [''],
    requiredSkills: [''],
    deadline: ''
  });

  const { toast } = useToast();

  // API base URL - using localhost as requested
  const API_BASE_URL = 'http://localhost:5000/api';

  // Get HR credentials from localStorage or use defaults
  const getHRCredentials = () => {
    const storedEmail = localStorage.getItem('hr_email') || HR_CREDENTIALS.EMAIL;
    const storedPassword = localStorage.getItem('hr_password') || HR_CREDENTIALS.PASSWORD;
    return { email: storedEmail, password: storedPassword };
  };

  // API Headers with HR authentication
  const getHeaders = () => {
    const { email, password } = getHRCredentials();
    return {
      'Content-Type': 'application/json',
      'Authorization': createBasicAuthHeader(email, password)
    };
  };

  // Fetch all jobs
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/hr/jobs`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs || []);
        calculateStats(data.jobs || []);
      } else {
        throw new Error(data.message || 'Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch jobs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from jobs data (fallback) - FIXED VERSION
  const calculateStats = (jobsData: Job[]) => {
    if (!jobsData || !Array.isArray(jobsData)) {
      setStats({
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        pendingApplications: 0
      });
      return;
    }

    const totalJobs = jobsData.length;
    const activeJobs = jobsData.filter(job => job.status === 'active').length;
    const totalApplications = jobsData.reduce((total, job) => 
      total + (job.applications ? job.applications.length : 0), 0
    );
    const pendingApplications = jobsData.reduce((total, job) => 
      total + (job.applications ? job.applications.filter(app => app.status === 'pending').length : 0), 0
    );

    setStats({
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications
    });
  };

  // Create new job
  const handleCreateJob = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/hr/jobs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...newJob,
          requirements: newJob.requirements.filter(req => req.trim() !== ''),
          requiredSkills: newJob.requiredSkills.filter(skill => skill.trim() !== '')
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Job Created",
          description: "New job posting has been created successfully.",
        });
        setIsCreateDialogOpen(false);
        setNewJob({
          title: '',
          department: '',
          location: '',
          type: 'Full-time',
          salary: '',
          description: '',
          requirements: [''],
          requiredSkills: [''],
          deadline: ''
        });
        fetchJobs();
      } else {
        throw new Error(data.message || 'Failed to create job');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: "Error",
        description: "Failed to create job. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/hr/jobs/${jobId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Job Deleted",
          description: "Job posting has been removed.",
        });
        fetchJobs();
      } else {
        throw new Error(data.message || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete job. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Update job status
  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/hr/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Status Updated",
          description: `Job status changed to ${newStatus}.`,
        });
        fetchJobs();
      } else {
        throw new Error(data.message || 'Failed to update job status');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: "Failed to update job status. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Application management functions
  const handleApplicationAction = async (jobId: string, applicantId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`${API_BASE_URL}/hr/jobs/${jobId}/applications/${applicantId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ 
          status: action === 'approve' ? 'approved' : 'rejected' 
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: `Application ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          description: `The application has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
        });
        fetchJobs();
      } else {
        throw new Error(data.message || 'Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Form input handlers
  const handleRequirementChange = (index: number, value: string) => {
    const updated = [...newJob.requirements];
    updated[index] = value;
    setNewJob({ ...newJob, requirements: updated });
  };

  const addRequirement = () => {
    setNewJob({ ...newJob, requirements: [...newJob.requirements, ''] });
  };

  const removeRequirement = (index: number) => {
    const updated = newJob.requirements.filter((_, i) => i !== index);
    setNewJob({ ...newJob, requirements: updated });
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-neon-green bg-neon-green/10';
      case 'draft': return 'text-yellow-400 bg-yellow-400/10';
      case 'closed': return 'text-foreground-secondary bg-muted';
      default: return 'text-foreground-secondary bg-muted';
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'text-neon-green bg-neon-green/10';
      case 'rejected': return 'text-red-400 bg-red-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-foreground-secondary bg-muted';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Open applications modal
  const handleViewApplications = (job: Job) => {
    setSelectedJobForApplications(job);
    setIsApplicationsModalOpen(true);
  };

  // Load jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space text-gradient-primary">Job Management</h1>
          <p className="text-foreground-secondary mt-1">
            Create, edit, and manage internal job postings and applications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass-card">
              <DialogHeader>
                <DialogTitle>Create New Job Posting</DialogTitle>
                <DialogDescription>
                  Add a new internal job posting to attract talent from within the organization
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                {/* Existing form content... */}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Job Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Total Jobs</p>
                <p className="text-2xl font-bold text-gradient-primary">{stats.totalJobs}</p>
              </div>
              <Briefcase className="w-8 h-8 text-neon-teal" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Active Jobs</p>
                <p className="text-2xl font-bold text-gradient-primary">
                  {stats.activeJobs}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-neon-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Total Applications</p>
                <p className="text-2xl font-bold text-gradient-primary">
                  {stats.totalApplications}
                </p>
              </div>
              <Users className="w-8 h-8 text-neon-purple" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Pending Reviews</p>
                <p className="text-2xl font-bold text-gradient-primary">
                  {stats.pendingApplications}
                </p>
              </div>
              <Clock className="w-8 h-8 text-neon-orange" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Listings */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neon-teal" />
          <span className="ml-2 text-foreground-secondary">Loading jobs...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto text-foreground-secondary mb-4" />
              <h3 className="text-xl font-semibold text-foreground-secondary">No jobs found</h3>
              <p className="text-foreground-secondary mt-2">Create your first job posting to get started.</p>
            </div>
          ) : (
            jobs.map((job, index) => (
              <Card key={job._id} className="glass-card tilt-3d" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
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
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-foreground-secondary">
                    {job.description.substring(0, 120)}...
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-foreground-secondary" />
                      <span className="text-sm">{job.applications?.length || 0} applicants</span>
                    </div>
                    <div className="flex space-x-2">
                      {/* View Applications Button - Only for active jobs */}
                      {job.status === 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="glass-button"
                          onClick={() => handleViewApplications(job)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Applications
                        </Button>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="glass-button"
                            onClick={() => setSelectedJob(job)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl glass-card">
                          <DialogHeader>
                            <DialogTitle>{job.title}</DialogTitle>
                            <DialogDescription>{job.department} • {job.location}</DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            {/* Job Details */}
                            <div className="space-y-4">
                              <div className="p-4 glass-card border-border/30">
                                <h4 className="font-semibold mb-2">Job Description</h4>
                                <p className="text-sm text-foreground-secondary">{job.description}</p>
                              </div>
                              
                              <div className="p-4 glass-card border-border/30">
                                <h4 className="font-semibold mb-2">Requirements</h4>
                                <ul className="text-sm space-y-1">
                                  {job.requirements.map((req, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="w-1.5 h-1.5 bg-neon-teal rounded-full mt-2 mr-2 flex-shrink-0" />
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="p-4 glass-card border-border/30">
                                <h4 className="font-semibold mb-2">Required Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                  {job.requiredSkills.map((skill, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Applicants */}
                            <div className="space-y-4">
                              <div className="p-4 glass-card border-border/30">
                                <h4 className="font-semibold mb-3">Applications ({job.applications?.length || 0})</h4>
                                <div className="space-y-3">
                                  {job.applications && job.applications.length > 0 ? job.applications.map((applicant) => (
                                    <div key={applicant._id} className="p-3 border border-border/30 rounded-lg space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                          <Avatar className="w-8 h-8">
                                            <AvatarImage src={applicant.employee.avatar} />
                                            <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                                              {getInitials(applicant.employee.fullName)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <div className="font-medium text-sm">{applicant.employee.fullName}</div>
                                            <div className="text-xs text-foreground-secondary">{applicant.employee.role}</div>
                                          </div>
                                        </div>
                                        <Badge className={getApplicationStatusColor(applicant.status)}>
                                          {applicant.status}
                                        </Badge>
                                      </div>
                                      
                                      <div className="text-xs">
                                        <div className="flex justify-between mb-1">
                                          <span>Match Score</span>
                                          <span className="font-semibold">{applicant.matchPercentage}%</span>
                                        </div>
                                        <Progress value={applicant.matchPercentage} className="h-1" />
                                      </div>

                                      <div className="text-xs text-foreground-secondary">
                                        Applied: {formatDate(applicant.appliedDate)}
                                      </div>

                                      {applicant.status === 'pending' && (
                                        <div className="flex space-x-2">
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="text-neon-green border-neon-green/30 hover:bg-neon-green/10"
                                            onClick={() => handleApplicationAction(job._id, applicant._id, 'approve')}
                                          >
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Approve
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                                            onClick={() => handleApplicationAction(job._id, applicant._id, 'reject')}
                                          >
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Reject
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )) : (
                                    <div className="text-center text-sm text-foreground-secondary py-4">
                                      No applications yet
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Select value={job.status} onValueChange={(value) => handleStatusChange(job._id, value)}>
                        <SelectTrigger className="w-24 h-8 glass-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                        onClick={() => handleDeleteJob(job._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Applications Modal */}
      {selectedJobForApplications && (
        <JobApplicationsModal
          job={selectedJobForApplications}
          isOpen={isApplicationsModalOpen}
          onClose={() => {
            setIsApplicationsModalOpen(false);
            setSelectedJobForApplications(null);
          }}
        />
      )}
    </div>
  );
};

export default JobManagement;
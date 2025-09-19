// HR Job Management - Create, Edit, and Manage Internal Job Postings

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock job data with applicants
const mockJobs = [
  {
    id: 'job_001',
    title: 'Senior Product Manager',
    department: 'Product',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$130,000 - $150,000',
    postedDate: '2024-01-15',
    deadline: '2024-02-15',
    status: 'active',
    description: 'Lead product strategy and development for our core platform. Work closely with engineering and design teams to deliver exceptional user experiences.',
    requirements: [
      '5+ years of product management experience',
      'Strong analytical and problem-solving skills',
      'Experience with agile development processes',
      'Excellent communication and leadership skills'
    ],
    requiredSkills: ['Product Strategy', 'Data Analysis', 'Agile/Scrum', 'Leadership'],
    applicants: [
      {
        id: 'emp_003',
        name: 'Emily Watson',
        role: 'Product Manager',
        department: 'Product',
        matchPercentage: 92,
        avatar: '',
        status: 'pending',
        appliedDate: '2024-01-18',
        skills: ['Product Strategy', 'Data Analysis', 'User Research', 'Agile/Scrum'],
        experience: '3 years'
      },
      {
        id: 'emp_006',
        name: 'John Smith',
        role: 'Associate Product Manager',
        department: 'Product',
        matchPercentage: 76,
        avatar: '',
        status: 'pending',
        appliedDate: '2024-01-20',
        skills: ['Product Strategy', 'Market Research', 'Analytics'],
        experience: '2 years'
      }
    ]
  },
  {
    id: 'job_002',
    title: 'Lead UX Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    salary: '$110,000 - $130,000',
    postedDate: '2024-01-10',
    deadline: '2024-02-10',
    status: 'active',
    description: 'Lead the design vision for our mobile and web applications. Mentor junior designers and collaborate with product and engineering teams.',
    requirements: [
      '6+ years of UX/UI design experience',
      'Strong portfolio showcasing design process',
      'Experience leading design teams',
      'Proficiency in Figma and design systems'
    ],
    requiredSkills: ['UI/UX Design', 'Figma', 'Design Systems', 'Leadership'],
    applicants: [
      {
        id: 'emp_001',
        name: 'Sarah Chen',
        role: 'Senior UX Designer',
        department: 'Design',
        matchPercentage: 87,
        avatar: '',
        status: 'approved',
        appliedDate: '2024-01-12',
        skills: ['UI/UX Design', 'Figma', 'User Research', 'Prototyping'],
        experience: '4 years'
      }
    ]
  },
  {
    id: 'job_003',
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Austin, TX',
    type: 'Full-time',
    salary: '$120,000 - $140,000',
    postedDate: '2024-01-08',
    deadline: '2024-02-08',
    status: 'draft',
    description: 'Build and maintain our cloud infrastructure. Implement CI/CD pipelines and ensure system reliability and scalability.',
    requirements: [
      '4+ years of DevOps experience',
      'Strong knowledge of AWS/Azure',
      'Experience with Kubernetes and Docker',
      'Scripting skills in Python or Bash'
    ],
    requiredSkills: ['AWS', 'Kubernetes', 'Docker', 'Python'],
    applicants: []
  }
];

const JobManagement: React.FC = () => {
  // State management
  const [jobs, setJobs] = useState(mockJobs);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  
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

  // Job management functions
  const handleCreateJob = () => {
    const job = {
      id: `job_${Date.now()}`,
      ...newJob,
      postedDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      applicants: []
    };
    
    setJobs([...jobs, job]);
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
    
    toast({
      title: "Job Created",
      description: "New job posting has been created successfully.",
    });
  };

  const handleDeleteJob = (jobId: string) => {
    setJobs(jobs.filter(job => job.id !== jobId));
    toast({
      title: "Job Deleted",
      description: "Job posting has been removed.",
    });
  };

  const handleStatusChange = (jobId: string, newStatus: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, status: newStatus } : job
    ));
    toast({
      title: "Status Updated",
      description: `Job status changed to ${newStatus}.`,
    });
  };

  // Application management functions
  const handleApplicationAction = (jobId: string, applicantId: string, action: 'approve' | 'reject') => {
    setJobs(jobs.map(job => {
      if (job.id === jobId) {
        const updatedApplicants = job.applicants.map(applicant =>
          applicant.id === applicantId 
            ? { ...applicant, status: action === 'approve' ? 'approved' : 'rejected' }
            : applicant
        );
        return { ...job, applicants: updatedApplicants };
      }
      return job;
    }));

    toast({
      title: `Application ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      description: `The application has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
    });
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={newJob.department} onValueChange={(value) => setNewJob({ ...newJob, department: value })}>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Salary Range</Label>
                  <Input
                    id="salary"
                    value={newJob.salary}
                    onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                    className="glass-input"
                    placeholder="e.g., $80,000 - $100,000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="glass-input"
                  rows={3}
                />
              </div>

              <div>
                <Label>Requirements</Label>
                {newJob.requirements.map((req, index) => (
                  <div key={index} className="flex space-x-2 mt-2">
                    <Input
                      value={req}
                      onChange={(e) => handleRequirementChange(index, e.target.value)}
                      className="glass-input"
                      placeholder="Enter requirement"
                    />
                    {newJob.requirements.length > 1 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeRequirement(index)}
                        className="glass-button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addRequirement}
                  className="glass-button mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Requirement
                </Button>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="glass-button">
                  Cancel
                </Button>
                <Button onClick={handleCreateJob} className="btn-gradient-primary">
                  Create Job
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Job Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Total Jobs</p>
                <p className="text-2xl font-bold text-gradient-primary">{jobs.length}</p>
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
                  {jobs.filter(job => job.status === 'active').length}
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
                  {jobs.reduce((total, job) => total + job.applicants.length, 0)}
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
                  {jobs.reduce((total, job) => 
                    total + job.applicants.filter(app => app.status === 'pending').length, 0
                  )}
                </p>
              </div>
              <Clock className="w-8 h-8 text-neon-orange" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobs.map((job, index) => (
          <Card key={job.id} className="glass-card tilt-3d" style={{ animationDelay: `${index * 0.1}s` }}>
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
                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-foreground-secondary" />
                  <span className="text-sm">{job.applicants.length} applicants</span>
                </div>
                <div className="flex space-x-2">
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
                        </div>

                        {/* Applicants */}
                        <div className="space-y-4">
                          <div className="p-4 glass-card border-border/30">
                            <h4 className="font-semibold mb-3">Applications ({job.applicants.length})</h4>
                            <div className="space-y-3">
                              {job.applicants.length > 0 ? job.applicants.map((applicant) => (
                                <div key={applicant.id} className="p-3 border border-border/30 rounded-lg space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <Avatar className="w-8 h-8">
                                        <AvatarImage src={applicant.avatar} />
                                        <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                                          {getInitials(applicant.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium text-sm">{applicant.name}</div>
                                        <div className="text-xs text-foreground-secondary">{applicant.role}</div>
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

                                  {applicant.status === 'pending' && (
                                    <div className="flex space-x-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="text-neon-green border-neon-green/30 hover:bg-neon-green/10"
                                        onClick={() => handleApplicationAction(job.id, applicant.id, 'approve')}
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Approve
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                                        onClick={() => handleApplicationAction(job.id, applicant.id, 'reject')}
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

                  <Select value={job.status} onValueChange={(value) => handleStatusChange(job.id, value)}>
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
                    onClick={() => handleDeleteJob(job.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default JobManagement;

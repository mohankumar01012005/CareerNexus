"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import { 
  CheckSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Target,
  Briefcase, 
  Calendar,
  AlertCircle,
  Filter,
  RefreshCw,
  MessageSquare,
  Star,
  GraduationCap,
  FileText,
  ExternalLink,
  Loader2,
  Users,
  Mail
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { 
  getPendingCareerGoalsHR, 
  updateCareerGoalStatusHR, 
  getCareerGoalsStatsHR 
} from '../../utils/api';

interface CareerGoalRequest {
  goalId: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  department: string
  role: string
  targetRole: string
  priority: "High" | "Medium" | "Low"
  targetDate: string
  skillsRequired: string[]
  progress: number
  submittedAt: string
  status: "pending" | "approved" | "rejected"
}

interface CareerGoalsStats {
  totalGoals: number
  pendingGoals: number
  approvedGoals: number
  rejectedGoals: number
  goalsByDepartment: Record<string, number>
  goalsByPriority: Record<string, number>
}

interface PendingCourseCompletion {
  id: string
  title: string
  provider: string
  duration: string
  costType: string
  skillsCovered: string[]
  enrollLink: string
  savedAt: string
  status: string
  completionProof: {
    file?: string
    link?: string
    submittedAt: string
  }
  rating: number
  level: string
  certificate: boolean
  description: string
  employeeInfo: {
    fullName: string
    email: string
    department: string
    role: string
    employeeId: string
  }
  resubmissionCount?: number
  reviewNotes?: string
}

// Job Switch Request Types
interface JobSwitchRequest {
  _id: string;
  employee: {
    _id: string;
    fullName: string;
    department: string;
    role: string;
    email: string;
    phoneNumber: string;
    skills: Array<{ name: string; proficiency: number; category: string }>;
    careerGoals: any[];
    resume_link: string;
  };
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: {
    fullName: string;
  };
  rejectionReason?: string;
  rejectionDate?: string;
}

const Approvals: React.FC = () => {
  const [pendingGoals, setPendingGoals] = useState<CareerGoalRequest[]>([]);
  const [pendingCourseCompletions, setPendingCourseCompletions] = useState<PendingCourseCompletion[]>([]);
  const [pendingJobSwitchRequests, setPendingJobSwitchRequests] = useState<JobSwitchRequest[]>([]);
  const [stats, setStats] = useState<CareerGoalsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedGoal, setSelectedGoal] = useState<CareerGoalRequest | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<PendingCourseCompletion | null>(null);
  const [selectedJobSwitchRequest, setSelectedJobSwitchRequest] = useState<JobSwitchRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [courseReviewNotes, setCourseReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { toast } = useToast();

  // API base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Get HR credentials from localStorage or use defaults
  const getHRCredentials = () => {
    try {
      const hrCredentials = localStorage.getItem('hrCredentials');
      if (hrCredentials) {
        return JSON.parse(hrCredentials);
      }
      
      return {
        email: import.meta.env.VITE_HR_EMAIL || 'hr@company.com',
        password: import.meta.env.VITE_HR_PASSWORD || 'admin123'
      };
    } catch (error) {
      console.error('Error getting HR credentials:', error);
      return {
        email: import.meta.env.VITE_HR_EMAIL || 'hr@company.com',
        password: import.meta.env.VITE_HR_PASSWORD || 'admin123'
      };
    }
  };

  // Create Basic Auth header
  const createBasicAuthHeader = (email: string, password: string) => {
    return 'Basic ' + btoa(`${email}:${password}`);
  };

  // Fetch pending course completions
  const fetchPendingCourseCompletions = async () => {
    try {
      const credentials = getHRCredentials();
      const authHeader = createBasicAuthHeader(credentials.email, credentials.password);

      const response = await fetch(`${API_BASE_URL}/hr/pending-course-completions`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch pending course completions:', error);
      return { success: true, pendingCompletions: [], count: 0 };
    }
  };

  // Fetch pending job switch requests
  const fetchPendingJobSwitchRequests = async () => {
    try {
      const credentials = getHRCredentials();
      const authHeader = createBasicAuthHeader(credentials.email, credentials.password);

      const response = await fetch(`${API_BASE_URL}/hr/job-management/job-switch-requests/pending`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch job switch requests:', error);
      return { success: true, pendingRequests: [], count: 0 };
    }
  };

// Update job switch request status - CORRECTED VERSION
const updateJobSwitchRequestStatus = async (requestId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
  try {
    const credentials = getHRCredentials();
    const authHeader = createBasicAuthHeader(credentials.email, credentials.password);

    const response = await fetch(`${API_BASE_URL}/hr/job-management/job-switch-requests/status`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestId, // Make sure this is included
        status,
        rejectionReason
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData?.message || 'Unknown error'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to update job switch request:', error);
    throw error;
  }
};

  // Update course completion status
  const updateCourseCompletionStatus = async (course: PendingCourseCompletion, status: 'completed' | 'active', notes?: string) => {
    try {
      if (status === 'active' && (!notes || notes.trim() === '')) {
        toast({
          title: "❌ Review Notes Required",
          description: "You must provide review notes when rejecting a course completion.",
          variant: "destructive",
        });
        return;
      }

      const credentials = getHRCredentials();
      const authHeader = createBasicAuthHeader(credentials.email, credentials.password);

      const response = await fetch(`${API_BASE_URL}/hr/update-course-status`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: course.id,
          employeeId: course.employeeInfo.employeeId,
          status,
          notes: notes || '',
          resubmissionCount: course.resubmissionCount || 0
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: `✅ Course ${status === 'completed' ? 'Approved' : 'Rejected'}`,
          description: `Course completion for ${course.employeeInfo.fullName} has been ${status === 'completed' ? 'approved' : 'rejected'}.`,
        });
        
        fetchData();
        setSelectedCourse(null);
        setCourseReviewNotes('');
      } else {
        toast({
          title: "❌ Action Failed",
          description: result.message || "Please try again later",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update course status:', error);
      toast({
        title: "❌ Connection Error",
        description: "Could not connect to server. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [goalsResponse, statsResponse, coursesResponse, jobSwitchResponse] = await Promise.allSettled([
        getPendingCareerGoalsHR(),
        getCareerGoalsStatsHR(),
        fetchPendingCourseCompletions(),
        fetchPendingJobSwitchRequests()
      ]);

      // Handle career goals response
      if (goalsResponse.status === 'fulfilled' && goalsResponse.value.success) {
        setPendingGoals(goalsResponse.value.pendingGoals);
      } else {
        console.error('Failed to fetch career goals:', goalsResponse.status === 'rejected' ? goalsResponse.reason : goalsResponse.value);
        setPendingGoals([]);
      }

      // Handle stats response
      if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
        setStats(statsResponse.value.stats);
      } else {
        console.error('Failed to fetch stats:', statsResponse.status === 'rejected' ? statsResponse.reason : statsResponse.value);
        setStats(null);
      }

      // Handle courses response
      if (coursesResponse.status === 'fulfilled' && coursesResponse.value.success) {
        setPendingCourseCompletions(coursesResponse.value.pendingCompletions || []);
      } else {
        console.error('Failed to fetch courses:', coursesResponse.status === 'rejected' ? coursesResponse.reason : coursesResponse.value);
        setPendingCourseCompletions([]);
      }

      // Handle job switch requests response
      if (jobSwitchResponse.status === 'fulfilled' && jobSwitchResponse.value.success) {
        setPendingJobSwitchRequests(jobSwitchResponse.value.pendingRequests || []);
      } else {
        console.error('Failed to fetch job switch requests:', jobSwitchResponse.status === 'rejected' ? jobSwitchResponse.reason : jobSwitchResponse.value);
        setPendingJobSwitchRequests([]);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: "❌ Connection Error",
        description: "Could not connect to server. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // Handle goal approval/rejection
  const handleGoalAction = async (goal: CareerGoalRequest, action: 'approve' | 'reject') => {
    try {
      const status: 'approved' | 'rejected' = action === 'approve' ? 'approved' : 'rejected';
      const response = await updateCareerGoalStatusHR({
        employeeId: goal.employeeId,
        goalId: goal.goalId,
        status,
        reviewNotes: reviewNotes || undefined
      });

      if (response.success) {
        toast({
          title: `✅ Goal ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          description: `Career goal for ${goal.employeeName} has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
        });
        
        fetchData();
        setSelectedGoal(null);
        setReviewNotes('');
      } else {
        toast({
          title: "❌ Action Failed",
          description: response.message || "Please try again later",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update goal status:', error);
      toast({
        title: "❌ Connection Error",
        description: "Could not connect to server. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  // Handle job switch request approval/rejection - FIXED VERSION
  const handleJobSwitchRequestAction = async (request: JobSwitchRequest, action: 'approve' | 'reject') => {
    try {
      if (action === 'reject' && (!rejectionReason || rejectionReason.trim() === '')) {
        toast({
          title: "❌ Rejection Reason Required",
          description: "You must provide a reason when rejecting a job switch request.",
          variant: "destructive",
        });
        return;
      }

      // FIX: Convert action to the correct status values
      const status: 'approved' | 'rejected' = action === 'approve' ? 'approved' : 'rejected';

      const response = await updateJobSwitchRequestStatus(
        request._id,
        status, // Now passing 'approved' or 'rejected' instead of 'approve' or 'reject'
        action === 'reject' ? rejectionReason : undefined
      );

      if (response.success) {
        toast({
          title: `✅ Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          description: `Job switch request for ${request.employee.fullName} has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
        });
        
        // Remove the request from the list
        setPendingJobSwitchRequests(prev => 
          prev.filter(req => req._id !== request._id)
        );
        setSelectedJobSwitchRequest(null);
        setRejectionReason('');
      } else {
        toast({
          title: "❌ Action Failed",
          description: response.message || "Please try again later",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update job switch request:', error);
      toast({
        title: "❌ Connection Error",
        description: "Could not connect to server. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  // Helper functions
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'low': return 'text-neon-green bg-neon-green/10 border-neon-green/30';
      default: return 'text-foreground-secondary bg-muted';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getDaysSinceSubmission = (submittedAt: string) => {
    const submitted = new Date(submittedAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - submitted.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (days: number) => {
    if (days > 7) return 'text-red-400';
    if (days > 3) return 'text-yellow-400';
    return 'text-neon-green';
  };

  const getCourseLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'text-neon-green bg-neon-green/10 border-neon-green/30';
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'advanced': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-foreground-secondary bg-muted';
    }
  };

  const getResubmissionInfo = (course: PendingCourseCompletion) => {
    const count = course.resubmissionCount || 0;
    const attemptsLeft = 3 - count;
    
    if (count === 0) return null;
    
    return {
      count,
      attemptsLeft,
      isFinalAttempt: count >= 2,
      shouldAutoDelete: count >= 3
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space text-gradient-primary">Approvals Center</h1>
          <p className="text-foreground-secondary mt-1">
            Review and manage employee career development requests and course completions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {stats?.pendingGoals || 0} pending goals • {pendingCourseCompletions.length} pending courses • {pendingJobSwitchRequests.length} job switch requests
          </Badge>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="glass-button"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Pending Goals</p>
                <p className="text-2xl font-bold text-gradient-primary">{stats?.pendingGoals || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-neon-orange" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Pending Courses</p>
                <p className="text-2xl font-bold text-gradient-primary">{pendingCourseCompletions.length}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-neon-purple" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Job Switch Requests</p>
                <p className="text-2xl font-bold text-gradient-primary">{pendingJobSwitchRequests.length}</p>
              </div>
              <Briefcase className="w-8 h-8 text-neon-teal" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Approved Goals</p>
                <p className="text-2xl font-bold text-gradient-primary">{stats?.approvedGoals || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-neon-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Rejected Goals</p>
                <p className="text-2xl font-bold text-gradient-primary">{stats?.rejectedGoals || 0}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Tabs */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-neon-teal" />
            <span>Approval Dashboard</span>
          </CardTitle>
          <CardDescription>
            Review employee career development requests and course completion submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="relative">
                Career Goals
                {pendingGoals.length > 0 && (
                  <Badge className="ml-2 bg-neon-orange/20 text-neon-orange text-xs">
                    {pendingGoals.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="courses" className="relative">
                Course Completion
                {pendingCourseCompletions.length > 0 && (
                  <Badge className="ml-2 bg-neon-purple/20 text-neon-purple text-xs">
                    {pendingCourseCompletions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="job-switch" className="relative">
                Job Switch Requests
                {pendingJobSwitchRequests.length > 0 && (
                  <Badge className="ml-2 bg-neon-teal/20 text-neon-teal text-xs">
                    {pendingJobSwitchRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Pending Goals Tab - EXISTING CONTENT */}
            <TabsContent value="pending" className="space-y-6 mt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-neon-teal mx-auto" />
                  <p className="text-foreground-secondary mt-4">Loading career goals...</p>
                </div>
              ) : pendingGoals.length === 0 ? (
                <div className="text-center py-12 text-foreground-secondary">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                  <p>All career goal requests have been reviewed and processed.</p>
                </div>
              ) : (
                pendingGoals.map((goal, index) => {
                  const daysSinceSubmission = getDaysSinceSubmission(goal.submittedAt);
                  
                  return (
                    <div 
                      key={goal.goalId} 
                      className="p-6 glass-card border-border/30 tilt-3d hover:border-neon-teal/30 transition-colors"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Employee Information */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                {getInitials(goal.employeeName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{goal.employeeName}</h4>
                              <p className="text-sm text-foreground-secondary">{goal.role}</p>
                              <p className="text-xs text-foreground-secondary">{goal.employeeEmail}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Department:</span>
                              <Badge variant="outline">{goal.department}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Submitted:</span>
                              <span>{new Date(goal.submittedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-foreground-secondary">Pending for:</span>
                              <span className={`font-semibold ${getUrgencyColor(daysSinceSubmission)}`}>
                                {daysSinceSubmission} days
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Goal Details */}
                        <div className="space-y-4 lg:col-span-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-semibold text-lg mb-1">{goal.targetRole}</h5>
                              <div className="flex items-center space-x-2 mb-3">
                                <Badge className={getPriorityColor(goal.priority)}>
                                  <span className="flex items-center space-x-1">
                                    <span>{getPriorityIcon(goal.priority)}</span>
                                    <span>{goal.priority} Priority</span>
                                  </span>
                                </Badge>
                                <Badge variant="outline">
                                  Target: {new Date(goal.targetDate).toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-neon-teal">{goal.progress}%</div>
                              <div className="text-xs text-foreground-secondary">Current Progress</div>
                            </div>
                          </div>
                          
                          {goal.skillsRequired.length > 0 && (
                            <div>
                              <h6 className="font-semibold mb-2 text-sm">Required Skills Development:</h6>
                              <div className="flex flex-wrap gap-1">
                                {goal.skillsRequired.map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-neon-blue/10 text-neon-blue border-neon-blue/30">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 text-sm text-foreground-secondary">
                            <Star className="w-4 h-4" />
                            <span>Career progression from {goal.role} to {goal.targetRole}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col justify-center space-y-3">
                          <Button 
                            className="btn-gradient-primary"
                            onClick={() => setSelectedGoal(goal)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Review Goal
                          </Button>
                          <div className="text-center">
                            <Badge variant="outline" className="text-xs">
                              Requires HR Approval
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* Course Completion Review Tab - EXISTING CONTENT */}
            <TabsContent value="courses" className="space-y-6 mt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-neon-purple mx-auto" />
                  <p className="text-foreground-secondary mt-4">Loading course completions...</p>
                </div>
              ) : pendingCourseCompletions.length === 0 ? (
                <div className="text-center py-12 text-foreground-secondary">
                  <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Course Completions</h3>
                  <p>All course completion requests have been reviewed and processed.</p>
                </div>
              ) : (
                pendingCourseCompletions.map((course, index) => {
                  const daysSinceSubmission = getDaysSinceSubmission(course.completionProof.submittedAt);
                  const resubmissionInfo = getResubmissionInfo(course);
                  
                  return (
                    <div 
                      key={course.id} 
                      className="p-6 glass-card border-border/30 tilt-3d hover:border-neon-purple/30 transition-colors w-full"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Employee Information */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                {getInitials(course.employeeInfo.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{course.employeeInfo.fullName}</h4>
                              <p className="text-sm text-foreground-secondary">{course.employeeInfo.role}</p>
                              <p className="text-xs text-foreground-secondary">{course.employeeInfo.email}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Department:</span>
                              <Badge variant="outline">{course.employeeInfo.department}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Submitted:</span>
                              <span>{new Date(course.completionProof.submittedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-foreground-secondary">Pending for:</span>
                              <span className={`font-semibold ${getUrgencyColor(daysSinceSubmission)}`}>
                                {daysSinceSubmission} days
                              </span>
                            </div>
                            {resubmissionInfo && (
                              <div className="flex justify-between items-center">
                                <span className="text-foreground-secondary">Resubmission:</span>
                                <span className={`font-semibold ${
                                  resubmissionInfo.shouldAutoDelete ? 'text-red-400' : 
                                  resubmissionInfo.isFinalAttempt ? 'text-orange-400' : 'text-blue-400'
                                }`}>
                                  {resubmissionInfo.count} of 3
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Course Details */}
                        <div className="space-y-4 lg:col-span-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-semibold text-lg mb-1">{course.title}</h5>
                              <div className="flex items-center space-x-2 mb-3 flex-wrap gap-2">
                                <Badge variant="outline" className="bg-neon-blue/10 text-neon-blue border-neon-blue/30">
                                  {course.provider}
                                </Badge>
                                <Badge className={getCourseLevelColor(course.level)}>
                                  {course.level || 'Not Specified'}
                                </Badge>
                                <Badge variant="outline">
                                  {course.duration}
                                </Badge>
                                <Badge variant="outline">
                                  {course.costType}
                                </Badge>
                                {course.certificate && (
                                  <Badge variant="outline" className="bg-neon-green/10 text-neon-green border-neon-green/30">
                                    Certificate
                                  </Badge>
                                )}
                                {resubmissionInfo && (
                                  <Badge variant="outline" className={
                                    resubmissionInfo.shouldAutoDelete ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                    resubmissionInfo.isFinalAttempt ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                                    'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  }>
                                    {resubmissionInfo.shouldAutoDelete ? 'Final Attempt' :
                                     resubmissionInfo.isFinalAttempt ? 'Last Chance' : 'Resubmission'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {course.rating && (
                                <>
                                  <div className="text-2xl font-bold text-neon-teal">{course.rating}/5</div>
                                  <div className="text-xs text-foreground-secondary">Rating</div>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {course.description && (
                            <p className="text-sm text-foreground-secondary line-clamp-2">
                              {course.description}
                            </p>
                          )}

                          {course.skillsCovered.length > 0 && (
                            <div>
                              <h6 className="font-semibold mb-2 text-sm">Skills Covered:</h6>
                              <div className="flex flex-wrap gap-1">
                                {course.skillsCovered.map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-neon-purple/10 text-neon-purple border-neon-purple/30">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resubmission Warning */}
                          {resubmissionInfo?.shouldAutoDelete && (
                            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <p className="text-sm font-semibold text-red-400">Final Attempt</p>
                              </div>
                              <p className="text-xs text-red-400 mt-1">
                                If rejected this time, the course will be automatically deleted and the employee will need to save it again.
                              </p>
                            </div>
                          )}

                          {/* Completion Proof */}
                          <div className="space-y-2">
                            <h6 className="font-semibold text-sm">Completion Proof:</h6>
                            <div className="flex flex-wrap gap-2">
                              {course.completionProof.file && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => window.open(course.completionProof.file, '_blank')}
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  View Certificate
                                </Button>
                              )}
                              {course.completionProof.link && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => window.open(course.completionProof.link, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Proof Link
                                </Button>
                              )}
                              {!course.completionProof.file && !course.completionProof.link && (
                                <span className="text-xs text-foreground-secondary">No proof provided</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col justify-center space-y-3">
                          <Button 
                            className="btn-gradient-primary"
                            onClick={() => setSelectedCourse(course)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Review Course
                          </Button>
                          <div className="text-center">
                            <Badge variant="outline" className="text-xs">
                              Awaiting Review
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* Job Switch Requests Tab - NEW CONTENT */}
            <TabsContent value="job-switch" className="space-y-6 mt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-neon-teal mx-auto" />
                  <p className="text-foreground-secondary mt-4">Loading job switch requests...</p>
                </div>
              ) : pendingJobSwitchRequests.length === 0 ? (
                <div className="text-center py-12 text-foreground-secondary">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Job Switch Requests</h3>
                  <p>All job switch requests have been reviewed and processed.</p>
                </div>
              ) : (
                pendingJobSwitchRequests.map((request, index) => {
                  const daysSinceSubmission = getDaysSinceSubmission(request.requestDate);
                  
                  return (
                    <div 
                      key={request._id} 
                      className="p-6 glass-card border-border/30 tilt-3d hover:border-neon-teal/30 transition-colors"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Employee Information */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                {getInitials(request.employee.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{request.employee.fullName}</h4>
                              <p className="text-sm text-foreground-secondary">{request.employee.role}</p>
                              <p className="text-xs text-foreground-secondary">{request.employee.email}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Department:</span>
                              <Badge variant="outline">{request.employee.department}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Requested:</span>
                              <span>{new Date(request.requestDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-foreground-secondary">Pending for:</span>
                              <span className={`font-semibold ${getUrgencyColor(daysSinceSubmission)}`}>
                                {daysSinceSubmission} days
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Employee Details */}
                        <div className="space-y-4 lg:col-span-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-semibold text-lg mb-1">Job Switch Request</h5>
                              <p className="text-sm text-foreground-secondary mb-3">
                                Employee is requesting approval to apply for internal job opportunities
                              </p>
                            </div>
                          </div>
                          
                          {/* Employee Skills */}
                          {request.employee.skills.length > 0 && (
                            <div>
                              <h6 className="font-semibold mb-2 text-sm">Employee Skills:</h6>
                              <div className="flex flex-wrap gap-2">
                                {request.employee.skills.slice(0, 6).map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-neon-blue/10 text-neon-blue border-neon-blue/30">
                                    {skill.name}
                                  </Badge>
                                ))}
                                {request.employee.skills.length > 6 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{request.employee.skills.length - 6} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Career Goals */}
                          {request.employee.careerGoals && request.employee.careerGoals.length > 0 && (
                            <div>
                              <h6 className="font-semibold mb-2 text-sm">Career Goals:</h6>
                              <div className="space-y-2">
                                {request.employee.careerGoals.slice(0, 2).map((goal, idx) => (
                                  <div key={idx} className="text-xs text-foreground-secondary">
                                    • {goal.targetRole} {goal.targetDate ? `(Target: ${new Date(goal.targetDate).toLocaleDateString()})` : ''}
                                  </div>
                                ))}
                                {request.employee.careerGoals.length > 2 && (
                                  <div className="text-xs text-foreground-secondary">
                                    +{request.employee.careerGoals.length - 2} more goals
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Resume Link */}
                          {request.employee.resume_link && (
                            <div className="flex items-center space-x-2 text-sm">
                              <FileText className="w-4 h-4 text-foreground-secondary" />
                              <Button
                                variant="link"
                                className="p-0 h-auto text-xs"
                                onClick={() => window.open(request.employee.resume_link, '_blank')}
                              >
                                View Employee Resume
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col justify-center space-y-3">
                          <Button 
                            className="btn-gradient-primary"
                            onClick={() => setSelectedJobSwitchRequest(request)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Review Request
                          </Button>
                          <div className="text-center">
                            <Badge variant="outline" className="text-xs">
                              Awaiting HR Review
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Job Switch Request Modal */}
      {selectedJobSwitchRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gradient-primary">Review Job Switch Request</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedJobSwitchRequest(null);
                    setRejectionReason('');
                  }}
                  className="h-8 w-8 p-0"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              {/* Request Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {getInitials(selectedJobSwitchRequest.employee.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedJobSwitchRequest.employee.fullName}</h3>
                    <p className="text-sm text-foreground-secondary">{selectedJobSwitchRequest.employee.role} • {selectedJobSwitchRequest.employee.department}</p>
                    <p className="text-xs text-foreground-secondary">{selectedJobSwitchRequest.employee.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-foreground-secondary">Phone:</span>
                    <div>{selectedJobSwitchRequest.employee.phoneNumber || 'Not provided'}</div>
                  </div>
                  <div>
                    <span className="text-foreground-secondary">Request Date:</span>
                    <div>{new Date(selectedJobSwitchRequest.requestDate).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Skills */}
                {selectedJobSwitchRequest.employee.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedJobSwitchRequest.employee.skills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="bg-neon-blue/10 text-neon-blue border-neon-blue/30">
                          {skill.name} ({skill.proficiency}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Career Goals */}
                {selectedJobSwitchRequest.employee.careerGoals && selectedJobSwitchRequest.employee.careerGoals.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Career Goals</h4>
                    <div className="space-y-2">
                      {selectedJobSwitchRequest.employee.careerGoals.map((goal, idx) => (
                        <div key={idx} className="p-2 bg-primary/5 rounded text-sm">
                          <div className="font-medium">{goal.targetRole}</div>
                          {goal.targetDate && (
                            <div className="text-foreground-secondary">
                              Target: {new Date(goal.targetDate).toLocaleDateString()}
                            </div>
                          )}
                          {goal.skillsRequired && goal.skillsRequired.length > 0 && (
                            <div className="text-foreground-secondary">
                              Skills: {goal.skillsRequired.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume Link */}
                {selectedJobSwitchRequest.employee.resume_link && (
                  <div>
                    <h4 className="font-semibold mb-2">Resume</h4>
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedJobSwitchRequest.employee.resume_link, '_blank')}
                      className="flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Employee Resume</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Rejection Reason - Only show for rejection */}
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium text-foreground">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Rejection Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a clear reason for rejecting this job switch request..."
                  className="w-full p-3 rounded-lg bg-background/50 border border-border focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 transition-colors min-h-[100px] resize-vertical"
                />
                <p className="text-xs text-foreground-secondary">
                  Rejection reason is required and will be shown to the employee.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => handleJobSwitchRequestAction(selectedJobSwitchRequest, 'reject')}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  disabled={!rejectionReason.trim()}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Request
                </Button>
                <Button
                  onClick={() => handleJobSwitchRequestAction(selectedJobSwitchRequest, 'approve')}
                  className="flex-1 bg-gradient-to-r from-neon-teal to-neon-purple hover:from-neon-teal/80 hover:to-neon-purple/80 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing modals for goals and courses... */}
    </div>
  );
};

export default Approvals;
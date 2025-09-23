// HR Approvals Center - Review and Manage All Pending Requests

import React, { useState } from 'react';
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
  GraduationCap, 
  Briefcase, 
  Calendar,
  AlertCircle,
  Filter
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

// Mock approval requests data
const mockApprovalRequests = {
  mentorRequests: [
    {
      id: 'mentor_001',
      requesterName: 'Sarah Chen',
      requesterRole: 'Senior UX Designer',
      requesterAvatar: '',
      mentorName: 'Dr. Emily Rodriguez',
      mentorRole: 'VP of Design',
      requestType: 'mentor',
      status: 'pending',
      submittedDate: '2024-01-20',
      reason: 'Seeking guidance on design leadership and transitioning to management role',
      duration: '6 months',
      goals: ['Leadership skills', 'Team management', 'Design strategy'],
      priority: 'high'
    },
    {
      id: 'mentor_002',
      requesterName: 'Marcus Rodriguez',
      requesterRole: 'Full Stack Developer',
      requesterAvatar: '',
      mentorName: 'John Kim',
      mentorRole: 'Engineering Director',
      requestType: 'mentor',
      status: 'pending',
      submittedDate: '2024-01-18',
      reason: 'Looking for technical mentorship in system architecture and cloud technologies',
      duration: '4 months',
      goals: ['System architecture', 'AWS expertise', 'Technical leadership'],
      priority: 'medium'
    }
  ],
  roleChangeRequests: [
    {
      id: 'role_001',
      requesterName: 'Emily Watson',
      requesterRole: 'Product Manager',
      requesterAvatar: '',
      currentDepartment: 'Product',
      targetRole: 'Senior Product Manager',
      targetDepartment: 'Product',
      requestType: 'role_change',
      status: 'pending',
      submittedDate: '2024-01-22',
      reason: 'Ready for increased responsibilities and team leadership',
      justification: 'Successfully led 3 major product launches, increased user engagement by 35%',
      managerApproval: 'approved',
      requiredSkills: ['Product Strategy', 'Team Leadership', 'Data Analysis'],
      readinessScore: 92,
      priority: 'high'
    },
    {
      id: 'role_002',
      requesterName: 'David Kim',
      requesterRole: 'DevOps Engineer',
      requesterAvatar: '',
      currentDepartment: 'Engineering',
      targetRole: 'Platform Engineer',
      targetDepartment: 'Engineering',
      requestType: 'role_change',
      status: 'pending',
      submittedDate: '2024-01-19',
      reason: 'Interested in platform architecture and infrastructure strategy',
      justification: 'Reduced deployment time by 60%, implemented new monitoring systems',
      managerApproval: 'pending',
      requiredSkills: ['Kubernetes', 'Platform Design', 'Team Collaboration'],
      readinessScore: 69,
      priority: 'medium'
    }
  ],
  trainingRequests: [
    {
      id: 'training_001',
      requesterName: 'Lisa Thompson',
      requesterRole: 'Marketing Specialist',
      requesterAvatar: '',
      requestType: 'training',
      status: 'pending',
      submittedDate: '2024-01-21',
      courseName: 'Advanced Data Analytics for Marketing',
      provider: 'DataCamp Pro',
      duration: '8 weeks',
      cost: '$299',
      reason: 'To improve campaign analysis and ROI measurement capabilities',
      expectedOutcomes: ['Better campaign performance', 'Data-driven decisions', 'Advanced SQL skills'],
      priority: 'medium'
    },
    {
      id: 'training_002',
      requesterName: 'Alex Johnson',
      requesterRole: 'Junior Developer',
      requesterAvatar: '',
      requestType: 'training',
      status: 'pending',
      submittedDate: '2024-01-17',
      courseName: 'AWS Solutions Architect Certification',
      provider: 'AWS Training',
      duration: '12 weeks',
      cost: '$500',
      reason: 'To support company migration to cloud-first architecture',
      expectedOutcomes: ['AWS certification', 'Cloud architecture skills', 'Cost optimization'],
      priority: 'high'
    }
  ]
};

const Approvals: React.FC = () => {
  // State management
  const [requests, setRequests] = useState(mockApprovalRequests);
  const [activeTab, setActiveTab] = useState('mentor');
  const [filter, setFilter] = useState('all');

  const { toast } = useToast();

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'text-neon-green bg-neon-green/10';
      case 'rejected': return 'text-red-400 bg-red-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-foreground-secondary bg-muted';
    }
  };

  // Request handling functions
  const handleApproval = (requestType: string, requestId: string, action: 'approve' | 'reject') => {
    const updatedRequests = { ...requests };
    
    // Update the specific request based on type
    switch (requestType) {
      case 'mentor':
        updatedRequests.mentorRequests = updatedRequests.mentorRequests.map(req =>
          req.id === requestId ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' } : req
        );
        break;
      case 'role_change':
        updatedRequests.roleChangeRequests = updatedRequests.roleChangeRequests.map(req =>
          req.id === requestId ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' } : req
        );
        break;
      case 'training':
        updatedRequests.trainingRequests = updatedRequests.trainingRequests.map(req =>
          req.id === requestId ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' } : req
        );
        break;
    }
    
    setRequests(updatedRequests);
    
    toast({
      title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      description: `The ${requestType.replace('_', ' ')} request has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
    });
  };

  // Get counts for each category
  const getCounts = () => {
    return {
      mentor: requests.mentorRequests.filter(r => r.status === 'pending').length,
      roleChange: requests.roleChangeRequests.filter(r => r.status === 'pending').length,
      training: requests.trainingRequests.filter(r => r.status === 'pending').length,
      total: [
        ...requests.mentorRequests,
        ...requests.roleChangeRequests,
        ...requests.trainingRequests
      ].filter(r => r.status === 'pending').length
    };
  };

  const counts = getCounts();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space text-gradient-primary">Approval Center</h1>
          <p className="text-foreground-secondary mt-1">
            Review and manage pending requests across the organization
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {counts.total} pending requests
          </Badge>
          <Button variant="outline" className="glass-button">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Total Pending</p>
                <p className="text-2xl font-bold text-gradient-primary">{counts.total}</p>
              </div>
              <Clock className="w-8 h-8 text-neon-orange" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Mentor Requests</p>
                <p className="text-2xl font-bold text-gradient-primary">{counts.mentor}</p>
              </div>
              <User className="w-8 h-8 text-neon-teal" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Role Changes</p>
                <p className="text-2xl font-bold text-gradient-primary">{counts.roleChange}</p>
              </div>
              <Briefcase className="w-8 h-8 text-neon-purple" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Training Requests</p>
                <p className="text-2xl font-bold text-gradient-primary">{counts.training}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-neon-blue" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Tabs */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-neon-teal" />
            <span>Pending Requests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mentor" className="relative">
                Mentor Requests
                {counts.mentor > 0 && (
                  <Badge className="ml-2 bg-neon-orange/20 text-neon-orange text-xs">
                    {counts.mentor}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rolechange" className="relative">
                Role Changes
                {counts.roleChange > 0 && (
                  <Badge className="ml-2 bg-neon-purple/20 text-neon-purple text-xs">
                    {counts.roleChange}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="training" className="relative">
                Training
                {counts.training > 0 && (
                  <Badge className="ml-2 bg-neon-blue/20 text-neon-blue text-xs">
                    {counts.training}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Mentor Requests Tab */}
            <TabsContent value="mentor" className="space-y-4 mt-6">
              {requests.mentorRequests.filter(req => req.status === 'pending').map((request, index) => (
                <div 
                  key={request.id} 
                  className="p-6 glass-card border-border/30 tilt-3d"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Requester Info */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.requesterAvatar} />
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {getInitials(request.requesterName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{request.requesterName}</h4>
                          <p className="text-sm text-foreground-secondary">{request.requesterRole}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Submitted:</span>
                          <span>{new Date(request.submittedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Duration:</span>
                          <span>{request.duration}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-foreground-secondary">Priority:</span>
                          <Badge className={getPriorityColor(request.priority)}>
                            {request.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-semibold mb-2">Mentor Requested</h5>
                        <div className="p-3 bg-primary/5 rounded border">
                          <div className="font-medium">{request.mentorName}</div>
                          <div className="text-sm text-foreground-secondary">{request.mentorRole}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold mb-2">Reason</h5>
                        <p className="text-sm text-foreground-secondary">{request.reason}</p>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">Goals</h5>
                        <div className="flex flex-wrap gap-1">
                          {request.goals.map((goal, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {goal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col justify-center space-y-3">
                      <Button 
                        className="btn-gradient-primary"
                        onClick={() => handleApproval('mentor', request.id, 'approve')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Request
                      </Button>
                      <Button 
                        variant="outline"
                        className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                        onClick={() => handleApproval('mentor', request.id, 'reject')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Request
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {requests.mentorRequests.filter(req => req.status === 'pending').length === 0 && (
                <div className="text-center py-8 text-foreground-secondary">
                  No pending mentor requests
                </div>
              )}
            </TabsContent>

            {/* Role Change Requests Tab */}
            <TabsContent value="rolechange" className="space-y-4 mt-6">
              {requests.roleChangeRequests.filter(req => req.status === 'pending').map((request, index) => (
                <div 
                  key={request.id} 
                  className="p-6 glass-card border-border/30 tilt-3d"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Employee Info */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.requesterAvatar} />
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {getInitials(request.requesterName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{request.requesterName}</h4>
                          <p className="text-sm text-foreground-secondary">{request.requesterRole}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">From:</span>
                          <span>{request.currentDepartment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">To:</span>
                          <span className="font-medium">{request.targetRole}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Manager Approval:</span>
                          <Badge className={getStatusColor(request.managerApproval)}>
                            {request.managerApproval}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground-secondary">Readiness Score</span>
                          <span className="font-semibold">{request.readinessScore}%</span>
                        </div>
                        <Progress value={request.readinessScore} className="h-2" />
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-semibold mb-2">Justification</h5>
                        <p className="text-sm text-foreground-secondary">{request.justification}</p>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold mb-2">Required Skills</h5>
                        <div className="flex flex-wrap gap-1">
                          {request.requiredSkills.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-foreground-secondary" />
                        <span className="text-foreground-secondary">
                          Submitted: {new Date(request.submittedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col justify-center space-y-3">
                      <Button 
                        className="btn-gradient-primary"
                        onClick={() => handleApproval('role_change', request.id, 'approve')}
                        disabled={request.readinessScore < 70}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Promotion
                      </Button>
                      <Button 
                        variant="outline"
                        className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                        onClick={() => handleApproval('role_change', request.id, 'reject')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Request
                      </Button>
                      {request.readinessScore < 70 && (
                        <div className="flex items-center space-x-2 text-xs text-yellow-400">
                          <AlertCircle className="w-3 h-3" />
                          <span>Readiness score below threshold</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {requests.roleChangeRequests.filter(req => req.status === 'pending').length === 0 && (
                <div className="text-center py-8 text-foreground-secondary">
                  No pending role change requests
                </div>
              )}
            </TabsContent>

            {/* Training Requests Tab */}
            <TabsContent value="training" className="space-y-4 mt-6">
              {requests.trainingRequests.filter(req => req.status === 'pending').map((request, index) => (
                <div 
                  key={request.id} 
                  className="p-6 glass-card border-border/30 tilt-3d"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Requester Info */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.requesterAvatar} />
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {getInitials(request.requesterName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{request.requesterName}</h4>
                          <p className="text-sm text-foreground-secondary">{request.requesterRole}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Submitted:</span>
                          <span>{new Date(request.submittedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Duration:</span>
                          <span>{request.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Cost:</span>
                          <span className="font-semibold text-neon-teal">{request.cost}</span>
                        </div>
                      </div>
                    </div>

                    {/* Course Details */}
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-semibold mb-2">Course Information</h5>
                        <div className="p-3 bg-primary/5 rounded border">
                          <div className="font-medium">{request.courseName}</div>
                          <div className="text-sm text-foreground-secondary">{request.provider}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold mb-2">Business Justification</h5>
                        <p className="text-sm text-foreground-secondary">{request.reason}</p>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">Expected Outcomes</h5>
                        <div className="space-y-1">
                          {request.expectedOutcomes.map((outcome, idx) => (
                            <div key={idx} className="flex items-start text-sm">
                              <span className="w-1.5 h-1.5 bg-neon-teal rounded-full mt-2 mr-2 flex-shrink-0" />
                              {outcome}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col justify-center space-y-3">
                      <Button 
                        className="btn-gradient-primary"
                        onClick={() => handleApproval('training', request.id, 'approve')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Training
                      </Button>
                      <Button 
                        variant="outline"
                        className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                        onClick={() => handleApproval('training', request.id, 'reject')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Request
                      </Button>
                      <div className="pt-2 border-t border-border/30">
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {requests.trainingRequests.filter(req => req.status === 'pending').length === 0 && (
                <div className="text-center py-8 text-foreground-secondary">
                  No pending training requests
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Approvals;

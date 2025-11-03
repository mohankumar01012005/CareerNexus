import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Progress } from '../../components/ui/progress';
import { 
  Briefcase, 
  Mail, 
  FileText, 
  ExternalLink,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Loader2,
  Users
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

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
    email: string;
  };
  appliedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  matchPercentage: number;
  skills: string[];
  experience: string;
  resumeType: 'current' | 'updated';
  updatedResume?: string;
  applicationData?: any;
}

interface Referral {
  _id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateResume: string;
  candidateSkills: string[];
  candidateExperience: string;
  referralDate: string;
  status: 'pending' | 'under_review' | 'rejected' | 'hired';
  referredBy: {
    fullName: string;
    email: string;
    department: string;
    role: string;
  };
}

interface JobApplicationsModalProps {
  job: {
    _id: string;
    title: string;
    department: string;
    location: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const JobApplicationsModal: React.FC<JobApplicationsModalProps> = ({ job, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('internal');
  const [applications, setApplications] = useState<Applicant[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const API_BASE_URL = 'https://skillcompassserver.vercel.app/api';

  // Get HR credentials
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

  // Fetch applications and referrals
  const fetchData = async () => {
    if (!job?._id) return;

    setLoading(true);
    try {
      const credentials = getHRCredentials();
      const authHeader = createBasicAuthHeader(credentials.email, credentials.password);

      // Fetch applications from the job
      const applicationsResponse = await fetch(`${API_BASE_URL}/hr/jobs/${job._id}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        if (applicationsData.success) {
          setApplications(applicationsData.job.applications || []);
        }
      }

      // Fetch referrals
      const referralsResponse = await fetch(`${API_BASE_URL}/hr/job-management/job-referrals`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (referralsResponse.ok) {
        const referralsData = await referralsResponse.json();
        if (referralsData.success) {
          // Filter referrals for this specific job
          const jobReferrals = referralsData.referrals.filter((ref: any) => 
            ref.job && ref.job._id === job._id
          );
          setReferrals(jobReferrals);
        }
      }

    } catch (error) {
      console.error('Error fetching applications data:', error);
      toast({
        title: "Error",
        description: "Failed to load applications data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && job?._id) {
      fetchData();
    }
  }, [isOpen, job?._id]);

  const handleSendInvite = (email: string, name: string, type: 'internal' | 'referral') => {
    const subject = type === 'internal' 
      ? `Interview Invitation - ${job.title}`
      : `Job Opportunity - ${job.title}`;
    
    const body = type === 'internal'
      ? `Dear ${name},\n\nWe are impressed with your application for the ${job.title} position at ${job.department}. We would like to invite you for an interview.\n\nBest regards,\nHR Team`
      : `Dear ${name},\n\nWe received your referral for the ${job.title} position and would like to invite you to learn more about this opportunity.\n\nBest regards,\nHR Team`;

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'hired': return 'text-neon-green bg-neon-green/10';
      case 'rejected': return 'text-red-400 bg-red-400/10';
      case 'under_review': return 'text-blue-400 bg-blue-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-foreground-secondary bg-muted';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl glass-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-neon-teal" />
            <span>Applications for {job.title}</span>
          </DialogTitle>
          <DialogDescription>
            {job.department} • {job.location}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="internal" className="relative">
              Internal Applications
              {applications.length > 0 && (
                <Badge className="ml-2 bg-neon-blue/20 text-neon-blue text-xs">
                  {applications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="referrals" className="relative">
              Referrals
              {referrals.length > 0 && (
                <Badge className="ml-2 bg-neon-purple/20 text-neon-purple text-xs">
                  {referrals.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Internal Applications Tab */}
          <TabsContent value="internal" className="space-y-4 mt-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-neon-teal mx-auto" />
                <p className="text-foreground-secondary mt-2">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-foreground-secondary">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No internal applications yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {applications.map((application) => (
                  <Card key={application._id} className="glass-card border-border/30">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Employee Info */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={application.employee.avatar} />
                              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                {getInitials(application.employee.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{application.employee.fullName}</h4>
                              <p className="text-sm text-foreground-secondary">{application.employee.role}</p>
                              <p className="text-xs text-foreground-secondary">{application.employee.department}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Applied:</span>
                              <span>{formatDate(application.appliedDate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Status:</span>
                              <Badge className={getStatusColor(application.status)}>
                                {application.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Resume:</span>
                              <span className="capitalize">{application.resumeType}</span>
                            </div>
                          </div>
                        </div>

                        {/* Match Score & Skills */}
                        <div className="space-y-4 lg:col-span-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-semibold">Match Analysis</h5>
                              <p className="text-sm text-foreground-secondary">
                                Skills compatibility with job requirements
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-neon-teal">
                                {application.matchPercentage}%
                              </div>
                              <div className="text-xs text-foreground-secondary">Match Score</div>
                            </div>
                          </div>
                          
                          <Progress value={application.matchPercentage} className="h-2" />

                          {application.skills.length > 0 && (
                            <div>
                              <h6 className="font-semibold mb-2 text-sm">Employee Skills:</h6>
                              <div className="flex flex-wrap gap-1">
                                {application.skills.slice(0, 8).map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-neon-blue/10 text-neon-blue border-neon-blue/30">
                                    {skill}
                                  </Badge>
                                ))}
                                {application.skills.length > 8 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{application.skills.length - 8} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {application.experience && (
                            <div>
                              <h6 className="font-semibold mb-1 text-sm">Experience:</h6>
                              <p className="text-sm text-foreground-secondary">{application.experience}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col justify-center space-y-3">
                          <Button 
                            className="btn-gradient-primary"
                            onClick={() => handleSendInvite(
                              application.employee.email,
                              application.employee.fullName,
                              'internal'
                            )}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Send Invite
                          </Button>
                          
                          {/* Resume Links */}
                          <div className="flex flex-col space-y-2">
                            {application.resumeType === 'current' && application.applicationData?.resumeLink && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(application.applicationData.resumeLink, '_blank')}
                                className="text-xs"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                View Current Resume
                              </Button>
                            )}
                            {application.resumeType === 'updated' && application.updatedResume && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(application.updatedResume, '_blank')}
                                className="text-xs"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                View Updated Resume
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-4 mt-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-neon-purple mx-auto" />
                <p className="text-foreground-secondary mt-2">Loading referrals...</p>
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8 text-foreground-secondary">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No referrals yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {referrals.map((referral) => (
                  <Card key={referral._id} className="glass-card border-border/30">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Candidate Info */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-neon-purple/20 text-neon-purple font-semibold">
                                {getInitials(referral.candidateName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{referral.candidateName}</h4>
                              <p className="text-sm text-foreground-secondary">{referral.candidateEmail}</p>
                              {referral.candidatePhone && (
                                <p className="text-xs text-foreground-secondary">{referral.candidatePhone}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Referred:</span>
                              <span>{formatDate(referral.referralDate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Status:</span>
                              <Badge className={getStatusColor(referral.status)}>
                                {referral.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Referred by:</span>
                              <span className="text-right">
                                {referral.referredBy.fullName}
                                <br />
                                <span className="text-xs">{referral.referredBy.department}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Candidate Details */}
                        <div className="space-y-4 lg:col-span-2">
                          {referral.candidateSkills.length > 0 && (
                            <div>
                              <h5 className="font-semibold mb-2">Candidate Skills</h5>
                              <div className="flex flex-wrap gap-1">
                                {referral.candidateSkills.slice(0, 8).map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-neon-purple/10 text-neon-purple border-neon-purple/30">
                                    {skill}
                                  </Badge>
                                ))}
                                {referral.candidateSkills.length > 8 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{referral.candidateSkills.length - 8} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {referral.candidateExperience && (
                            <div>
                              <h5 className="font-semibold mb-1">Experience</h5>
                              <p className="text-sm text-foreground-secondary">{referral.candidateExperience}</p>
                            </div>
                          )}

                          {/* Referrer Info */}
                          <div className="p-3 bg-primary/5 rounded-lg">
                            <h6 className="font-semibold text-sm mb-1">Referrer Information</h6>
                            <p className="text-xs text-foreground-secondary">
                              {referral.referredBy.fullName} ({referral.referredBy.role})
                              <br />
                              {referral.referredBy.department} • {referral.referredBy.email}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col justify-center space-y-3">
                          <Button 
                            className="btn-gradient-primary"
                            onClick={() => handleSendInvite(
                              referral.candidateEmail,
                              referral.candidateName,
                              'referral'
                            )}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Send Invite
                          </Button>
                          
                          {/* Resume Link */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(referral.candidateResume, '_blank')}
                            className="text-xs"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            View Candidate Resume
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default JobApplicationsModal;
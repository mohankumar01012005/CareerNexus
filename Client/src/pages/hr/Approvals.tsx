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
  Star
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

const Approvals: React.FC = () => {
  const [pendingGoals, setPendingGoals] = useState<CareerGoalRequest[]>([]);
  const [stats, setStats] = useState<CareerGoalsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedGoal, setSelectedGoal] = useState<CareerGoalRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const { toast } = useToast();

  // Fetch pending career goals and stats
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [goalsResponse, statsResponse] = await Promise.all([
        getPendingCareerGoalsHR(),
        getCareerGoalsStatsHR()
      ]);

      if (goalsResponse.success) {
        setPendingGoals(goalsResponse.pendingGoals);
      }

      if (statsResponse.success) {
        setStats(statsResponse.stats);
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
        
        // Refresh data
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space text-gradient-primary">Career Goals Approval Center</h1>
          <p className="text-foreground-secondary mt-1">
            Review and manage employee career development requests
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {stats?.pendingGoals || 0} pending requests
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Pending Review</p>
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
                <p className="text-sm text-foreground-secondary">Approved</p>
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
                <p className="text-sm text-foreground-secondary">Rejected</p>
                <p className="text-2xl font-bold text-gradient-primary">{stats?.rejectedGoals || 0}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Total Goals</p>
                <p className="text-2xl font-bold text-gradient-primary">{stats?.totalGoals || 0}</p>
              </div>
              <Target className="w-8 h-8 text-neon-purple" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Tabs */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-neon-teal" />
            <span>Career Goals Approval Queue</span>
          </CardTitle>
          <CardDescription>
            Review employee career development requests and provide feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="relative">
                Pending Review
                {pendingGoals.length > 0 && (
                  <Badge className="ml-2 bg-neon-orange/20 text-neon-orange text-xs">
                    {pendingGoals.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="stats">
                Department Analytics
              </TabsTrigger>
            </TabsList>

            {/* Pending Goals Tab */}
            <TabsContent value="pending" className="space-y-6 mt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-teal mx-auto"></div>
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

            {/* Analytics Tab */}
            <TabsContent value="stats" className="space-y-6 mt-6">
              {stats ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Department Distribution */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Goals by Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(stats.goalsByDepartment).map(([dept, count]) => (
                          <div key={dept} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{dept}</span>
                            <div className="flex items-center space-x-3">
                              <Progress value={(count / stats.totalGoals) * 100} className="w-32 h-2" />
                              <span className="text-sm font-semibold w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Priority Distribution */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Goals by Priority</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(stats.goalsByPriority).map(([priority, count]) => (
                          <div key={priority} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span>{getPriorityIcon(priority)}</span>
                              <span className="text-sm font-medium capitalize">{priority}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Progress 
                                value={(count / stats.totalGoals) * 100} 
                                className="w-32 h-2" 
                              />
                              <span className="text-sm font-semibold w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12 text-foreground-secondary">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No analytics data available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gradient-primary">Review Career Goal</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedGoal(null);
                    setReviewNotes('');
                  }}
                  className="h-8 w-8 p-0"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              {/* Goal Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {getInitials(selectedGoal.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedGoal.employeeName}</h3>
                    <p className="text-sm text-foreground-secondary">{selectedGoal.role} • {selectedGoal.department}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-foreground-secondary">Target Role:</span>
                    <div className="font-semibold">{selectedGoal.targetRole}</div>
                  </div>
                  <div>
                    <span className="text-foreground-secondary">Priority:</span>
                    <Badge className={getPriorityColor(selectedGoal.priority)}>
                      {selectedGoal.priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-foreground-secondary">Target Date:</span>
                    <div>{new Date(selectedGoal.targetDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-foreground-secondary">Progress:</span>
                    <div className="font-semibold text-neon-teal">{selectedGoal.progress}%</div>
                  </div>
                </div>

                {selectedGoal.skillsRequired.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Required Skills Development</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGoal.skillsRequired.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="bg-neon-blue/10 text-neon-blue border-neon-blue/30">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Review Notes */}
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium text-foreground">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Review Notes (Optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add feedback or notes for the employee..."
                  className="w-full p-3 rounded-lg bg-background/50 border border-border focus:border-neon-teal focus:outline-none focus:ring-2 focus:ring-neon-teal/20 transition-colors min-h-[100px] resize-vertical"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => handleGoalAction(selectedGoal, 'reject')}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Goal
                </Button>
                <Button
                  onClick={() => handleGoalAction(selectedGoal, 'approve')}
                  className="flex-1 bg-gradient-to-r from-neon-teal to-neon-purple hover:from-neon-teal/80 hover:to-neon-purple/80 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Goal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
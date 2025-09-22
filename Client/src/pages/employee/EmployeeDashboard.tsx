// Employee Dashboard with 3D Effects and Gamified Interface

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Target, 
  TrendingUp, 
  BookOpen, 
  Users, 
  Zap, 
  Award,
  Upload,
  MessageCircle,
  Compass,
  Star
} from 'lucide-react';
import { Employee } from '@/types/auth';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth() as { user: Employee };

  // Mock recommendations data
  const recommendations = [
    {
      type: 'job',
      title: 'Senior Product Manager',
      match: 78,
      department: 'Product',
      icon: '🎯'
    },
    {
      type: 'course',
      title: 'Advanced Leadership Skills',
      match: 92,
      provider: 'LinkedIn Learning',
      icon: '👑'
    },
    {
      type: 'mentor',
      title: 'Connect with Sarah Kim',
      match: 85,
      role: 'VP of Product',
      icon: '🤝'
    }
  ];

  const getSkillColor = (level: number) => {
    if (level >= 80) return 'text-neon-green';
    if (level >= 60) return 'text-neon-teal';
    if (level >= 40) return 'text-neon-blue';
    return 'text-neon-orange';
  };

  const getSkillBackground = (level: number) => {
    if (level >= 80) return 'from-neon-green/20 to-neon-green/5';
    if (level >= 60) return 'from-neon-teal/20 to-neon-teal/5';
    if (level >= 40) return 'from-neon-blue/20 to-neon-blue/5';
    return 'from-neon-orange/20 to-neon-orange/5';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="glass-card tilt-3d lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 ring-4 ring-primary/20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-gradient-primary text-white text-xl">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl font-space">
                  Welcome back, {user.name.split(' ')[0]}! 👋
                </CardTitle>
                <CardDescription className="text-lg">
                  {user.currentRole} • {user.department}
                </CardDescription>
                <Badge variant="outline" className="mt-2">
                  Member since {new Date(user.joinDate).getFullYear()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button className="btn-gradient-primary h-12 justify-start">
                <Upload className="w-4 h-4 mr-2" />
                Upload Resume
              </Button>
              <Button className="glass-button h-12 justify-start">
                <MessageCircle className="w-4 h-4 mr-2" />
                AI Career Chat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Readiness Score */}
        <Card className="glass-card tilt-3d">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Career Readiness</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-teal to-neon-purple p-1">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gradient-primary">
                      {user.readinessScore}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-foreground-secondary">
                Your promotion readiness score
              </p>
              <Button size="sm" variant="outline" className="mt-2">
                <Compass className="w-4 h-4 mr-1" />
                View Path
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-neon-teal" />
            <span>Your Skill Arsenal</span>
          </CardTitle>
          <CardDescription>
            Track your expertise across different domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {user.skills.map((skill, index) => (
              <div 
                key={skill.id} 
                className={`p-4 rounded-xl bg-gradient-to-br ${getSkillBackground(skill.level)} border border-border/50 tilt-3d`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center space-y-2">
                  <div className="text-2xl">{skill.icon}</div>
                  <h3 className="font-semibold text-sm">{skill.name}</h3>
                  <div className={`text-lg font-bold ${getSkillColor(skill.level)}`}>
                    {skill.level}%
                  </div>
                  <Progress 
                    value={skill.level} 
                    className="h-2 bg-background/50"
                  />
                  <Badge variant="secondary" className="text-xs">
                    {skill.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Career Goals & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Career Goals */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-neon-purple" />
              <span>Career Aspirations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.careerGoals.map((goal, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 glass-card border-border/30 tilt-3d"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center space-x-3">
                  <Star className="w-4 h-4 text-neon-teal" />
                  <span className="font-medium">{goal}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Target
                </Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full glass-button">
              <Target className="w-4 h-4 mr-2" />
              Add New Goal
            </Button>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-neon-orange" />
              <span>AI Recommendations</span>
            </CardTitle>
            <CardDescription>
              Personalized opportunities for your growth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div 
                key={index}
                className="p-4 glass-card border-border/30 tilt-3d hover:scale-[1.02] transition-transform cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{rec.icon}</span>
                    <div>
                      <h4 className="font-semibold text-sm">{rec.title}</h4>
                      <p className="text-xs text-foreground-secondary">
                        {'department' in rec ? rec.department : 'provider' in rec ? rec.provider : 'role' in rec ? rec.role : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${rec.match >= 85 ? 'border-neon-green text-neon-green' : 'border-neon-teal text-neon-teal'}`}>
                    {rec.match}% match
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" className="btn-gradient-primary flex-1">
                    {rec.type === 'job' ? 'Apply' : rec.type === 'course' ? 'Enroll' : 'Connect'}
                  </Button>
                  <Button size="sm" variant="outline" className="glass-button">
                    Details
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full glass-button">
              <BookOpen className="w-4 h-4 mr-2" />
              View All Recommendations
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card text-center p-4 tilt-3d">
          <TrendingUp className="w-8 h-8 text-neon-teal mx-auto mb-2" />
          <div className="text-xl font-bold text-gradient-primary">24</div>
          <div className="text-xs text-foreground-secondary">Skills Tracked</div>
        </Card>
        <Card className="glass-card text-center p-4 tilt-3d">
          <BookOpen className="w-8 h-8 text-neon-purple mx-auto mb-2" />
          <div className="text-xl font-bold text-gradient-primary">12</div>
          <div className="text-xs text-foreground-secondary">Courses Available</div>
        </Card>
        <Card className="glass-card text-center p-4 tilt-3d">
          <Users className="w-8 h-8 text-neon-blue mx-auto mb-2" />
          <div className="text-xl font-bold text-gradient-primary">8</div>
          <div className="text-xs text-foreground-secondary">Open Positions</div>
        </Card>
        <Card className="glass-card text-center p-4 tilt-3d">
          <Award className="w-8 h-8 text-neon-green mx-auto mb-2" />
          <div className="text-xl font-bold text-gradient-primary">3</div>
          <div className="text-xs text-foreground-secondary">Achievements</div>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

// Career Compass - AI-Powered Career Path Analysis

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Compass, 
  Target, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  Award,
  ArrowRight,
  CheckCircle,
  Circle
} from 'lucide-react';

const CareerCompass: React.FC = () => {
  // Mock career path data
  const careerPath = {
    current: 'Software Developer',
    target: 'Senior Product Manager',
    readinessScore: 65,
    timeEstimate: '18-24 months',
    steps: [
      {
        id: 1,
        title: 'Develop Product Thinking',
        description: 'Learn product strategy and customer-centric design',
        skills: ['Product Strategy', 'User Research', 'Market Analysis'],
        estimatedTime: '3-4 months',
        completed: true,
        progress: 100
      },
      {
        id: 2,
        title: 'Build Leadership Skills',
        description: 'Enhance communication and team management abilities',
        skills: ['Team Leadership', 'Communication', 'Project Management'],
        estimatedTime: '6-8 months',
        completed: false,
        progress: 45
      },
      {
        id: 3,
        title: 'Gain Business Acumen',
        description: 'Understand business metrics and strategic planning',
        skills: ['Business Strategy', 'Data Analysis', 'Financial Planning'],
        estimatedTime: '4-6 months',
        completed: false,
        progress: 15
      },
      {
        id: 4,
        title: 'Cross-functional Experience',
        description: 'Work with design, sales, and marketing teams',
        skills: ['Cross-team Collaboration', 'Stakeholder Management'],
        estimatedTime: '6-8 months',
        completed: false,
        progress: 0
      }
    ]
  };

  const getStepColor = (step: any) => {
    if (step.completed) return 'border-neon-green bg-neon-green/10';
    if (step.progress > 0) return 'border-neon-teal bg-neon-teal/10';
    return 'border-border bg-card';
  };

  const getStepIcon = (step: any) => {
    if (step.completed) return <CheckCircle className="w-6 h-6 text-neon-green" />;
    if (step.progress > 0) return <Circle className="w-6 h-6 text-neon-teal fill-current" />;
    return <Circle className="w-6 h-6 text-foreground-secondary" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-neon mb-4">
          <Compass className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold font-space text-gradient-primary">Career Compass</h1>
        <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
          Your AI-powered roadmap from <strong>{careerPath.current}</strong> to <strong>{careerPath.target}</strong>
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-space">Journey Progress</CardTitle>
          <CardDescription>
            Track your advancement toward your career goal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-gradient-primary">{careerPath.readinessScore}%</div>
              <p className="text-sm text-foreground-secondary">Overall Readiness</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-gradient-secondary">{careerPath.timeEstimate}</div>
              <p className="text-sm text-foreground-secondary">Estimated Timeline</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-neon-green">2/4</div>
              <p className="text-sm text-foreground-secondary">Steps in Progress</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Career Readiness Score</span>
              <span className="font-semibold">{careerPath.readinessScore}%</span>
            </div>
            <Progress value={careerPath.readinessScore} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Career Path Steps */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold font-space text-center">Your Development Roadmap</h2>
        
        <div className="space-y-4">
          {careerPath.steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connection Line */}
              {index < careerPath.steps.length - 1 && (
                <div className="absolute left-8 top-16 w-0.5 h-16 bg-gradient-to-b from-border to-transparent z-0" />
              )}
              
              <Card className={`glass-card border-2 ${getStepColor(step)} tilt-3d relative z-10`}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Step Icon */}
                    <div className="flex-shrink-0">
                      {getStepIcon(step)}
                    </div>
                    
                    {/* Step Content */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">{step.title}</h3>
                          <p className="text-foreground-secondary">{step.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-2">
                            <Clock className="w-3 h-3 mr-1" />
                            {step.estimatedTime}
                          </Badge>
                          {step.progress > 0 && (
                            <div className="text-sm font-semibold text-neon-teal">
                              {step.progress}% Complete
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Skills Required */}
                      <div>
                        <p className="text-sm font-medium mb-2">Skills to Develop:</p>
                        <div className="flex flex-wrap gap-2">
                          {step.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Progress Bar for Active Steps */}
                      {!step.completed && step.progress > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{step.progress}%</span>
                          </div>
                          <Progress value={step.progress} className="h-2" />
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        {step.completed ? (
                          <Button size="sm" variant="outline" className="text-neon-green border-neon-green/30">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </Button>
                        ) : step.progress > 0 ? (
                          <Button size="sm" className="btn-gradient-primary">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Continue Learning
                          </Button>
                        ) : (
                          <Button size="sm" className="btn-gradient-secondary">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Start Learning
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="glass-button">
                          View Resources
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Action Center */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="btn-gradient-primary h-16 text-left justify-start flex-col">
              <div className="flex items-center space-x-2 mb-1">
                <Target className="w-5 h-5" />
                <span className="font-semibold">Update Goals</span>
              </div>
              <span className="text-sm opacity-90">Modify your target role</span>
            </Button>
            
            <Button className="glass-button h-16 text-left justify-start flex-col">
              <div className="flex items-center space-x-2 mb-1">
                <Award className="w-5 h-5" />
                <span className="font-semibold">Find Mentors</span>
              </div>
              <span className="text-sm opacity-90">Connect with experts</span>
            </Button>
            
            <Button className="glass-button h-16 text-left justify-start flex-col">
              <div className="flex items-center space-x-2 mb-1">
                <BookOpen className="w-5 h-5" />
                <span className="font-semibold">Browse Courses</span>
              </div>
              <span className="text-sm opacity-90">Discover learning paths</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CareerCompass;

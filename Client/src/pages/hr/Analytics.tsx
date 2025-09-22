// HR Analytics & Reports - Advanced Analytics Dashboard with Interactive Charts

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Download, 
  Filter,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  PieChart,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock analytics data
const mockAnalyticsData = {
  overview: {
    totalEmployees: 1247,
    newHires: 45,
    promotions: 23,
    attritionRate: 8.5,
    engagementScore: 84,
    diversityIndex: 72
  },
  skillsData: [
    { skill: 'JavaScript', employees: 245, demand: 89, gap: 15 },
    { skill: 'Python', employees: 198, demand: 76, gap: 22 },
    { skill: 'React', employees: 156, demand: 85, gap: 28 },
    { skill: 'Data Analysis', employees: 134, demand: 92, gap: 35 },
    { skill: 'Project Management', employees: 167, demand: 78, gap: 12 },
    { skill: 'UI/UX Design', employees: 89, demand: 83, gap: 25 },
    { skill: 'Cloud Architecture', employees: 67, demand: 88, gap: 42 },
    { skill: 'Machine Learning', employees: 45, demand: 91, gap: 48 }
  ],
  departmentMetrics: [
    { 
      department: 'Engineering', 
      employees: 428, 
      avgTenure: 3.2, 
      satisfaction: 87, 
      attrition: 12,
      openPositions: 12,
      productivity: 92 
    },
    { 
      department: 'Product', 
      employees: 156, 
      avgTenure: 2.8, 
      satisfaction: 91, 
      attrition: 8,
      openPositions: 8,
      productivity: 89 
    },
    { 
      department: 'Design', 
      employees: 89, 
      avgTenure: 2.5, 
      satisfaction: 88, 
      attrition: 10,
      openPositions: 5,
      productivity: 85 
    },
    { 
      department: 'Sales', 
      employees: 234, 
      avgTenure: 1.9, 
      satisfaction: 82, 
      attrition: 18,
      openPositions: 9,
      productivity: 78 
    },
    { 
      department: 'Marketing', 
      employees: 145, 
      avgTenure: 2.1, 
      satisfaction: 86, 
      attrition: 6,
      openPositions: 4,
      productivity: 83 
    },
    { 
      department: 'Operations', 
      employees: 195, 
      avgTenure: 4.1, 
      satisfaction: 79, 
      attrition: 11,
      openPositions: 4,
      productivity: 88 
    }
  ],
  hiringTrends: [
    { month: 'Jan', internal: 8, external: 12, total: 20 },
    { month: 'Feb', internal: 12, external: 8, total: 20 },
    { month: 'Mar', internal: 15, external: 10, total: 25 },
    { month: 'Apr', internal: 18, external: 7, total: 25 },
    { month: 'May', internal: 22, external: 8, total: 30 },
    { month: 'Jun', internal: 19, external: 6, total: 25 }
  ],
  diversityMetrics: {
    gender: { male: 52, female: 46, other: 2 },
    ethnicity: { 
      asian: 34, 
      white: 38, 
      hispanic: 15, 
      black: 10, 
      other: 3 
    },
    ageGroups: {
      under25: 18,
      age25to35: 45,
      age36to45: 28,
      over45: 9
    }
  },
  performanceMetrics: [
    { quarter: 'Q1 2024', exceeds: 23, meets: 68, below: 9 },
    { quarter: 'Q4 2023', exceeds: 21, meets: 72, below: 7 },
    { quarter: 'Q3 2023', exceeds: 19, meets: 74, below: 7 },
    { quarter: 'Q2 2023', exceeds: 22, meets: 70, below: 8 }
  ]
};

const Analytics: React.FC = () => {
  // State management
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [reportType, setReportType] = useState('comprehensive');

  const { toast } = useToast();

  // Helper functions
  const getGapSeverity = (gap: number) => {
    if (gap >= 40) return { color: 'text-red-400 bg-red-400/10', label: 'Critical' };
    if (gap >= 25) return { color: 'text-yellow-400 bg-yellow-400/10', label: 'High' };
    if (gap >= 15) return { color: 'text-orange-400 bg-orange-400/10', label: 'Medium' };
    return { color: 'text-neon-green bg-neon-green/10', label: 'Low' };
  };

  const getPerformanceColor = (metric: string, value: number) => {
    switch (metric) {
      case 'satisfaction':
        return value >= 85 ? 'text-neon-green' : value >= 75 ? 'text-yellow-400' : 'text-red-400';
      case 'attrition':
        return value <= 10 ? 'text-neon-green' : value <= 15 ? 'text-yellow-400' : 'text-red-400';
      case 'productivity':
        return value >= 85 ? 'text-neon-green' : value >= 75 ? 'text-yellow-400' : 'text-red-400';
      default:
        return 'text-foreground';
    }
  };

  const handleExportReport = () => {
    toast({
      title: "Report Generated",
      description: `${reportType} report for ${selectedTimeframe} has been prepared for download.`,
    });
  };

  // Filter department data based on selection
  const filteredDepartmentData = selectedDepartment === 'all' 
    ? mockAnalyticsData.departmentMetrics 
    : mockAnalyticsData.departmentMetrics.filter(dept => dept.department.toLowerCase() === selectedDepartment);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section with Export Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space text-gradient-primary">Analytics & Reports</h1>
          <p className="text-foreground-secondary mt-1">
            Deep dive into talent analytics, performance metrics, and strategic insights
          </p>
        </div>
        <div className="flex space-x-3">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32 glass-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40 glass-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comprehensive">Comprehensive</SelectItem>
              <SelectItem value="skills">Skills Analysis</SelectItem>
              <SelectItem value="diversity">Diversity Report</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport} className="btn-gradient-primary">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="glass-card tilt-3d">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-secondary">Total Employees</p>
                <p className="text-xl font-bold text-gradient-primary">{mockAnalyticsData.overview.totalEmployees}</p>
              </div>
              <Users className="w-6 h-6 text-neon-teal" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-secondary">New Hires</p>
                <p className="text-xl font-bold text-gradient-primary">{mockAnalyticsData.overview.newHires}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-neon-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-secondary">Attrition Rate</p>
                <p className="text-xl font-bold text-gradient-primary">{mockAnalyticsData.overview.attritionRate}%</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-neon-orange" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-secondary">Engagement</p>
                <p className="text-xl font-bold text-gradient-primary">{mockAnalyticsData.overview.engagementScore}%</p>
              </div>
              <Activity className="w-6 h-6 text-neon-purple" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-secondary">Promotions</p>
                <p className="text-xl font-bold text-gradient-primary">{mockAnalyticsData.overview.promotions}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-neon-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-secondary">Diversity Index</p>
                <p className="text-xl font-bold text-gradient-primary">{mockAnalyticsData.overview.diversityIndex}%</p>
              </div>
              <Award className="w-6 h-6 text-neon-pink" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Gap Analysis */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-neon-teal" />
            <span>Skills Gap Analysis</span>
          </CardTitle>
          <CardDescription>
            Critical skills gaps across the organization with demand vs supply analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockAnalyticsData.skillsData.map((skill, index) => (
              <div 
                key={skill.skill} 
                className="p-4 glass-card border-border/30 tilt-3d"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{skill.skill}</h4>
                    <Badge className={getGapSeverity(skill.gap).color}>
                      {getGapSeverity(skill.gap).label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Current Supply</span>
                      <span className="font-semibold">{skill.employees} employees</span>
                    </div>
                    <Progress value={(skill.employees / 300) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Market Demand</span>
                      <span className="font-semibold">{skill.demand}%</span>
                    </div>
                    <Progress value={skill.demand} className="h-2" />
                  </div>

                  <div className="pt-2 border-t border-border/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Skills Gap</span>
                      <span className={`font-semibold ${skill.gap >= 30 ? 'text-red-400' : skill.gap >= 20 ? 'text-yellow-400' : 'text-neon-green'}`}>
                        {skill.gap}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department Performance Matrix */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-neon-purple" />
                <span>Department Performance Matrix</span>
              </CardTitle>
              <CardDescription>
                Comprehensive performance metrics across all departments
              </CardDescription>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-40 glass-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {mockAnalyticsData.departmentMetrics.map(dept => (
                  <SelectItem key={dept.department} value={dept.department.toLowerCase()}>
                    {dept.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left p-3 text-sm font-semibold">Department</th>
                  <th className="text-left p-3 text-sm font-semibold">Employees</th>
                  <th className="text-left p-3 text-sm font-semibold">Avg Tenure</th>
                  <th className="text-left p-3 text-sm font-semibold">Satisfaction</th>
                  <th className="text-left p-3 text-sm font-semibold">Attrition</th>
                  <th className="text-left p-3 text-sm font-semibold">Open Positions</th>
                  <th className="text-left p-3 text-sm font-semibold">Productivity</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartmentData.map((dept, index) => (
                  <tr 
                    key={dept.department} 
                    className="border-b border-border/20 hover:bg-primary/5 transition-colors"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td className="p-3">
                      <div className="font-semibold">{dept.department}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-foreground-secondary" />
                        <span>{dept.employees}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span>{dept.avgTenure} years</span>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className={getPerformanceColor('satisfaction', dept.satisfaction)}>
                            {dept.satisfaction}%
                          </span>
                        </div>
                        <Progress value={dept.satisfaction} className="h-1" />
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={getPerformanceColor('attrition', dept.attrition)}>
                        {dept.attrition}%
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">
                        {dept.openPositions} open
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className={getPerformanceColor('productivity', dept.productivity)}>
                            {dept.productivity}%
                          </span>
                        </div>
                        <Progress value={dept.productivity} className="h-1" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Hiring Trends & Diversity Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hiring Trends */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-neon-blue" />
              <span>Hiring Trends</span>
            </CardTitle>
            <CardDescription>
              Internal vs external hiring patterns over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAnalyticsData.hiringTrends.map((month, index) => (
                <div 
                  key={month.month} 
                  className="p-3 glass-card border-border/30"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{month.month} 2024</span>
                    <span className="text-sm text-foreground-secondary">
                      Total: {month.total} hires
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-neon-green">Internal</span>
                        <span className="font-semibold">{month.internal}</span>
                      </div>
                      <Progress 
                        value={(month.internal / month.total) * 100} 
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-neon-purple">External</span>
                        <span className="font-semibold">{month.external}</span>
                      </div>
                      <Progress 
                        value={(month.external / month.total) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Diversity Metrics */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-neon-pink" />
              <span>Diversity Insights</span>
            </CardTitle>
            <CardDescription>
              Organization diversity breakdown across multiple dimensions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Gender Distribution */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Gender Distribution</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="p-2 glass-card border-border/30 text-center">
                  <div className="font-semibold text-neon-teal">{mockAnalyticsData.diversityMetrics.gender.male}%</div>
                  <div className="text-xs text-foreground-secondary">Male</div>
                </div>
                <div className="p-2 glass-card border-border/30 text-center">
                  <div className="font-semibold text-neon-purple">{mockAnalyticsData.diversityMetrics.gender.female}%</div>
                  <div className="text-xs text-foreground-secondary">Female</div>
                </div>
                <div className="p-2 glass-card border-border/30 text-center">
                  <div className="font-semibold text-neon-orange">{mockAnalyticsData.diversityMetrics.gender.other}%</div>
                  <div className="text-xs text-foreground-secondary">Other</div>
                </div>
              </div>
            </div>

            {/* Age Groups */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Age Distribution</h4>
              <div className="space-y-2">
                {Object.entries(mockAnalyticsData.diversityMetrics.ageGroups).map(([group, percentage]) => (
                  <div key={group} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">
                        {group.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span className="font-semibold">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Ethnicity */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Ethnic Diversity</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(mockAnalyticsData.diversityMetrics.ethnicity).map(([ethnicity, percentage]) => (
                  <div key={ethnicity} className="p-2 glass-card border-border/30 text-center">
                    <div className="font-semibold">{percentage}%</div>
                    <div className="text-foreground-secondary capitalize">{ethnicity}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-neon-gold" />
            <span>Performance Trends</span>
          </CardTitle>
          <CardDescription>
            Employee performance distribution over the last 4 quarters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {mockAnalyticsData.performanceMetrics.map((quarter, index) => (
              <div 
                key={quarter.quarter} 
                className="p-4 glass-card border-border/30 tilt-3d"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h4 className="font-semibold mb-3 text-center">{quarter.quarter}</h4>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-sm text-neon-green font-semibold">Exceeds</div>
                    <div className="text-2xl font-bold">{quarter.exceeds}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-neon-teal font-semibold">Meets</div>
                    <div className="text-2xl font-bold">{quarter.meets}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-yellow-400 font-semibold">Below</div>
                    <div className="text-2xl font-bold">{quarter.below}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;

// Futuristic Sidebar Navigation Component with Glassmorphism

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import skillCompassLogo from '@/assets/skillcompass-logo.png';
import { 
  Home, 
  Compass, 
  BookOpen, 
  Target, 
  Bell, 
  Settings, 
  LogOut,
  Users,
  BarChart3,
  Briefcase,
  CheckSquare,
  Brain,
  UserCheck,
  TrendingUp
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { userType, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items for employees
  const employeeNavItems = [
    { icon: Home, label: 'Dashboard', path: '/employee/dashboard' },
    { icon: Compass, label: 'Career Compass', path: '/employee/compass' },
    { icon: BookOpen, label: 'Recommendations', path: '/employee/recommendations' },
    { icon: Target, label: 'Simulator', path: '/employee/simulator' },
    { icon: Bell, label: 'Notifications', path: '/employee/notifications' },
    { icon: Settings, label: 'Profile', path: '/employee/profile' },
  ];

  // Navigation items for HR
  const hrNavItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/hr/dashboard' },
    { icon: Users, label: 'Employee Explorer', path: '/hr/employees' },
    { icon: Briefcase, label: 'Job Management', path: '/hr/jobs' },
    { icon: TrendingUp, label: 'Analytics', path: '/hr/analytics' },
    { icon: CheckSquare, label: 'Approvals', path: '/hr/approvals' },
    { icon: Settings, label: 'Settings', path: '/hr/settings' },
  ];

  const navItems = userType === 'hr' ? hrNavItems : employeeNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="h-full flex flex-col glass-card border-r border-glass-border/50 w-64 relative overflow-hidden">
      {/* Sidebar Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-neon-teal/5 via-transparent to-neon-purple/5 pointer-events-none" />
      
      {/* Header */}
      <div className="p-6 border-b border-glass-border/30 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-neon">
            <img src={skillCompassLogo} alt="SkillCompass" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-bold text-lg font-space text-gradient-primary">SkillCompass</h2>
            <p className="text-xs text-foreground-secondary">
              {userType === 'hr' ? 'HR Portal' : 'Employee Hub'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.path);
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                "w-full justify-start h-12 px-4 transition-all duration-300 hover:bg-primary/10 hover:border-primary/30 border border-transparent",
                isActive && "bg-primary/20 border-primary/50 text-primary shadow-sm"
              )}
              onClick={() => navigate(item.path)}
            >
              <Icon className={cn(
                "w-5 h-5 mr-3 transition-colors",
                isActive ? "text-primary" : "text-foreground-secondary"
              )} />
              <span className={cn(
                "font-medium transition-colors",
                isActive ? "text-primary" : "text-foreground"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute right-2 w-2 h-2 bg-primary rounded-full shadow-neon" />
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-glass-border/30 relative z-10">
        <Button
          variant="ghost"
          className="w-full justify-start h-12 px-4 text-foreground-secondary hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;

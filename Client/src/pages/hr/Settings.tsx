// HR Settings - System Configuration and User Preferences

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Building, 
  Palette, 
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock company codes data
const mockCompanyCodes = [
  {
    code: 'COMP001',
    name: 'Tech Innovations Inc.',
    employees: 1247,
    createdDate: '2023-01-15',
    status: 'active'
  },
  {
    code: 'COMP002',
    name: 'Digital Solutions LLC',
    employees: 89,
    createdDate: '2023-06-10',
    status: 'active'
  },
  {
    code: 'COMP003',
    name: 'StartupXYZ',
    employees: 23,
    createdDate: '2023-11-20',
    status: 'pending'
  }
];

const Settings: React.FC = () => {
  // State management
  const [profile, setProfile] = useState({
    name: 'HR Administrator',
    email: 'hr@company.com',
    role: 'HR Manager',
    department: 'Human Resources',
    avatar: ''
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    approvalAlerts: true,
    systemUpdates: false,
    marketingEmails: false
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: '4',
    passwordExpiry: '90',
    loginNotifications: true
  });

  const [companyCodes, setCompanyCodes] = useState(mockCompanyCodes);
  const [newCompanyCode, setNewCompanyCode] = useState({
    code: '',
    name: ''
  });
  const [isAddCodeDialogOpen, setIsAddCodeDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [themeMode, setThemeMode] = useState('dark');

  const { toast } = useToast();

  // Helper functions
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-neon-green bg-neon-green/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'inactive': return 'text-foreground-secondary bg-muted';
      default: return 'text-foreground-secondary bg-muted';
    }
  };

  // Event handlers
  const handleProfileSave = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  const handleNotificationSave = () => {
    toast({
      title: "Notification Preferences Updated",
      description: "Your notification settings have been saved.",
    });
  };

  const handleSecuritySave = () => {
    toast({
      title: "Security Settings Updated",
      description: "Your security preferences have been saved.",
    });
  };

  const handleAddCompanyCode = () => {
    const newCode = {
      code: newCompanyCode.code.toUpperCase(),
      name: newCompanyCode.name,
      employees: 0,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    
    setCompanyCodes([...companyCodes, newCode]);
    setNewCompanyCode({ code: '', name: '' });
    setIsAddCodeDialogOpen(false);
    
    toast({
      title: "Company Code Added",
      description: `Company code ${newCode.code} has been created successfully.`,
    });
  };

  const handleDeleteCompanyCode = (code: string) => {
    setCompanyCodes(companyCodes.filter(c => c.code !== code));
    toast({
      title: "Company Code Deleted",
      description: `Company code ${code} has been removed.`,
    });
  };

  const handleThemeChange = (mode: string) => {
    setThemeMode(mode);
    toast({
      title: "Theme Updated",
      description: `Theme changed to ${mode} mode.`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space text-gradient-primary">HR Settings</h1>
          <p className="text-foreground-secondary mt-1">
            Manage your profile, system preferences, and organizational settings
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Admin Access
        </Badge>
      </div>

      {/* Settings Tabs */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6 mt-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xl">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{profile.name}</h3>
                  <p className="text-sm text-foreground-secondary">{profile.role} • {profile.department}</p>
                  <Button variant="outline" size="sm" className="glass-button">
                    Change Photo
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={profile.department}
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileSave} className="btn-gradient-primary">
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 glass-card border-border/30">
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-foreground-secondary">Receive notifications via email</div>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, emailNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 glass-card border-border/30">
                    <div>
                      <div className="font-medium">Push Notifications</div>
                      <div className="text-sm text-foreground-secondary">Browser push notifications</div>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, pushNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 glass-card border-border/30">
                    <div>
                      <div className="font-medium">Weekly Reports</div>
                      <div className="text-sm text-foreground-secondary">Automated weekly analytics reports</div>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, weeklyReports: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 glass-card border-border/30">
                    <div>
                      <div className="font-medium">Approval Alerts</div>
                      <div className="text-sm text-foreground-secondary">Notifications for pending approvals</div>
                    </div>
                    <Switch
                      checked={notifications.approvalAlerts}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, approvalAlerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 glass-card border-border/30">
                    <div>
                      <div className="font-medium">System Updates</div>
                      <div className="text-sm text-foreground-secondary">Platform updates and maintenance notices</div>
                    </div>
                    <Switch
                      checked={notifications.systemUpdates}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, systemUpdates: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 glass-card border-border/30">
                    <div>
                      <div className="font-medium">Marketing Emails</div>
                      <div className="text-sm text-foreground-secondary">Product updates and feature announcements</div>
                    </div>
                    <Switch
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, marketingEmails: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNotificationSave} className="btn-gradient-primary">
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Security & Privacy</h3>
                <div className="space-y-6">
                  <div className="p-4 glass-card border-border/30">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium">Two-Factor Authentication</div>
                        <div className="text-sm text-foreground-secondary">Add an extra layer of security</div>
                      </div>
                      <Switch
                        checked={security.twoFactorAuth}
                        onCheckedChange={(checked) => 
                          setSecurity({ ...security, twoFactorAuth: checked })
                        }
                      />
                    </div>
                    {security.twoFactorAuth && (
                      <Button variant="outline" size="sm" className="glass-button">
                        Configure 2FA
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 glass-card border-border/30">
                      <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                      <Input
                        id="sessionTimeout"
                        value={security.sessionTimeout}
                        onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                        className="glass-input mt-2"
                        type="number"
                        min="1"
                        max="24"
                      />
                    </div>

                    <div className="p-4 glass-card border-border/30">
                      <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                      <Input
                        id="passwordExpiry"
                        value={security.passwordExpiry}
                        onChange={(e) => setSecurity({ ...security, passwordExpiry: e.target.value })}
                        className="glass-input mt-2"
                        type="number"
                        min="30"
                        max="365"
                      />
                    </div>
                  </div>

                  <div className="p-4 glass-card border-border/30">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium">Login Notifications</div>
                        <div className="text-sm text-foreground-secondary">Get notified of new login attempts</div>
                      </div>
                      <Switch
                        checked={security.loginNotifications}
                        onCheckedChange={(checked) => 
                          setSecurity({ ...security, loginNotifications: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="p-4 glass-card border-border/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Change Password</div>
                        <div className="text-sm text-foreground-secondary">Update your account password</div>
                      </div>
                      <Button variant="outline" className="glass-button">
                        Update Password
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSecuritySave} className="btn-gradient-primary">
                  <Save className="w-4 h-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </TabsContent>

            {/* Company Management */}
            <TabsContent value="company" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Company Codes Management</h3>
                  <p className="text-sm text-foreground-secondary">Manage organization codes for employee registration</p>
                </div>
                <Dialog open={isAddCodeDialogOpen} onOpenChange={setIsAddCodeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="btn-gradient-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Company Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card">
                    <DialogHeader>
                      <DialogTitle>Add New Company Code</DialogTitle>
                      <DialogDescription>
                        Create a new company code for employee registration
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="companyCode">Company Code</Label>
                        <Input
                          id="companyCode"
                          value={newCompanyCode.code}
                          onChange={(e) => setNewCompanyCode({ ...newCompanyCode, code: e.target.value })}
                          className="glass-input"
                          placeholder="COMP004"
                        />
                      </div>
                      <div>
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={newCompanyCode.name}
                          onChange={(e) => setNewCompanyCode({ ...newCompanyCode, name: e.target.value })}
                          className="glass-input"
                          placeholder="Company Name Inc."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsAddCodeDialogOpen(false)} className="glass-button">
                          Cancel
                        </Button>
                        <Button onClick={handleAddCompanyCode} className="btn-gradient-primary">
                          Create Code
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {companyCodes.map((company, index) => (
                  <div 
                    key={company.code} 
                    className="p-4 glass-card border-border/30 tilt-3d"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold">{company.name}</h4>
                          <Badge className={getStatusColor(company.status)}>
                            {company.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-foreground-secondary">
                          Code: <span className="font-mono">{company.code}</span> • 
                          {company.employees} employees • 
                          Created: {new Date(company.createdDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="glass-button">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                          onClick={() => handleDeleteCompanyCode(company.code)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Theme & Display</h3>
                <div className="space-y-6">
                  <div className="p-4 glass-card border-border/30">
                    <div className="mb-4">
                      <div className="font-medium mb-2">Theme Mode</div>
                      <div className="text-sm text-foreground-secondary mb-4">Choose your preferred theme</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <Button
                        variant={themeMode === 'light' ? 'default' : 'outline'}
                        className={themeMode === 'light' ? 'btn-gradient-primary' : 'glass-button'}
                        onClick={() => handleThemeChange('light')}
                      >
                        <Sun className="w-4 h-4 mr-2" />
                        Light
                      </Button>
                      <Button
                        variant={themeMode === 'dark' ? 'default' : 'outline'}
                        className={themeMode === 'dark' ? 'btn-gradient-primary' : 'glass-button'}
                        onClick={() => handleThemeChange('dark')}
                      >
                        <Moon className="w-4 h-4 mr-2" />
                        Dark
                      </Button>
                      <Button
                        variant={themeMode === 'system' ? 'default' : 'outline'}
                        className={themeMode === 'system' ? 'btn-gradient-primary' : 'glass-button'}
                        onClick={() => handleThemeChange('system')}
                      >
                        <Monitor className="w-4 h-4 mr-2" />
                        System
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 glass-card border-border/30">
                    <div className="font-medium mb-2">Color Scheme</div>
                    <div className="text-sm text-foreground-secondary mb-4">Customize your brand colors</div>
                    <div className="grid grid-cols-6 gap-2">
                      {['teal', 'purple', 'blue', 'green', 'orange', 'pink'].map((color) => (
                        <Button 
                          key={color}
                          variant="outline" 
                          className={`h-12 glass-button bg-neon-${color}/20 border-neon-${color}/30`}
                        >
                          <div className={`w-6 h-6 rounded-full bg-neon-${color}`} />
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 glass-card border-border/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Reduce Motion</div>
                        <div className="text-sm text-foreground-secondary">Minimize animations and transitions</div>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <div className="p-4 glass-card border-border/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">High Contrast</div>
                        <div className="text-sm text-foreground-secondary">Increase contrast for better visibility</div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="btn-gradient-primary">
                  <Save className="w-4 h-4 mr-2" />
                  Save Appearance
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

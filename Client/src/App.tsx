import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import CareerCompass from "./pages/employee/CareerCompass";
import HRDashboard from "./pages/hr/HRDashboard";
import EmployeeExplorer from "./pages/hr/EmployeeExplorer";
import JobManagement from "./pages/hr/JobManagement";
import Analytics from "./pages/hr/Analytics";
import Approvals from "./pages/hr/Approvals";
import Settings from "./pages/hr/Settings";
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedUserTypes: ('employee' | 'hr')[];
}> = ({ children, allowedUserTypes }) => {
  const { isAuthenticated, userType } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (userType && !allowedUserTypes.includes(userType)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

// Main App Router
const AppRouter: React.FC = () => {
  const { isAuthenticated, userType } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to={`/${userType}/dashboard`} replace /> : <Login />} 
      />
      
      {/* Default Route */}
      <Route 
        path="/" 
        element={
          isAuthenticated 
            ? <Navigate to={`/${userType}/dashboard`} replace />
            : <Navigate to="/login" replace />
        } 
      />

      {/* Employee Routes */}
      <Route path="/employee" element={
        <ProtectedRoute allowedUserTypes={['employee']}>
          <DashboardLayout title="Employee Dashboard" subtitle="Your career growth hub" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="compass" element={<CareerCompass />} />
        <Route path="recommendations" element={<div className="p-8 text-center glass-card"><h2 className="text-2xl font-bold text-gradient-primary">AI Recommendations</h2><p className="text-foreground-secondary mt-2">Coming soon - Personalized job and learning recommendations</p></div>} />
        <Route path="simulator" element={<div className="p-8 text-center glass-card"><h2 className="text-2xl font-bold text-gradient-primary">Career Simulator</h2><p className="text-foreground-secondary mt-2">Coming soon - Interactive career planning tool</p></div>} />
        <Route path="notifications" element={<div className="p-8 text-center glass-card"><h2 className="text-2xl font-bold text-gradient-primary">Notifications</h2><p className="text-foreground-secondary mt-2">Coming soon - Real-time updates and alerts</p></div>} />
        <Route path="profile" element={<div className="p-8 text-center glass-card"><h2 className="text-2xl font-bold text-gradient-primary">Profile Settings</h2><p className="text-foreground-secondary mt-2">Coming soon - Manage your profile and preferences</p></div>} />
      </Route>

      {/* HR Routes */}
      <Route path="/hr" element={
        <ProtectedRoute allowedUserTypes={['hr']}>
          <DashboardLayout title="HR Analytics Hub" subtitle="Comprehensive talent management" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<HRDashboard />} />
        <Route path="employees" element={<EmployeeExplorer />} />
        <Route path="jobs" element={<JobManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Error Routes */}
      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center glass-card p-8">
            <h1 className="text-4xl font-bold text-gradient-primary mb-4">Access Denied</h1>
            <p className="text-foreground-secondary mb-4">You don't have permission to access this area.</p>
            <button 
              onClick={() => window.history.back()}
              className="btn-gradient-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

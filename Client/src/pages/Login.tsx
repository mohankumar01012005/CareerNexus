// .."use client"

// Futuristic Login Page with Glassmorphism and 3D Effects

import type React from "react"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import type { LoginCredentials } from "../types/auth"
import ParticleBackground from "../components/ParticleBackground"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Switch } from "../components/ui/switch"
import { useToast } from "../hooks/use-toast"
import { Eye, EyeOff, Zap, Shield, Users, Brain } from "lucide-react"

const Login: React.FC = () => {
  const { login } = useAuth()
  const { toast } = useToast()

  const [userType, setUserType] = useState<"employee" | "hr">("employee")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginForm, setLoginForm] = useState<LoginCredentials>({
    email: "",
    password: "",
  })

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(loginForm, userType)
      if (success) {
        toast({
          title: "✅ Login Successful",
          description: `Welcome to SkillCompass ${userType === "hr" ? "HR Portal" : "Employee Dashboard"}`,
        })
      } else {
        toast({
          title: "❌ Login Failed",
          description: "Invalid credentials. Please check your details and try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Connection Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Particle Background */}
      <ParticleBackground />

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-neon-teal/10 rounded-full blur-xl animate-float" />
        <div
          className="absolute top-40 right-32 w-24 h-24 bg-neon-purple/10 rounded-full blur-xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-32 left-1/4 w-40 h-40 bg-neon-blue/10 rounded-full blur-xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Main Login Container */}
      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-neon">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold font-space text-gradient-primary mb-2">SkillCompass</h1>
          <p className="text-foreground-secondary text-lg">AI Talent Compass</p>
        </div>

        {/* User Type Toggle */}
        <div className="glass-card mb-6 p-4 animate-scale-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-neon-teal" />
              <span className="font-medium">Employee Login</span>
            </div>
            <Switch
              checked={userType === "hr"}
              onCheckedChange={(checked) => setUserType(checked ? "hr" : "employee")}
            />
            <div className="flex items-center space-x-3">
              <span className="font-medium">HR Portal</span>
              <Shield className="w-5 h-5 text-neon-purple" />
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="glass-card border-0 animate-scale-in" style={{ animationDelay: "0.4s" }}>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-space">
              {userType === "hr" ? "HR Portal Access" : "Employee Access"}
            </CardTitle>
            <CardDescription>
              {userType === "hr" ? "Secure login for HR professionals" : "Access your talent ecosystem"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="futuristic-input"
                  placeholder={userType === "hr" ? "hr@company.com" : "your.email@company.com"}
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="futuristic-input pr-10"
                    placeholder="Enter password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className={userType === "hr" ? "btn-gradient-secondary w-full" : "btn-gradient-primary w-full"}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{userType === "hr" ? "Authenticating..." : "Signing In..."}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {userType === "hr" ? <Shield className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    <span>{userType === "hr" ? "Access HR Portal" : "Enter SkillCompass"}</span>
                  </div>
                )}
              </Button>

              {userType === "employee" && (
                <div className="mt-4 p-3 glass-card text-sm text-center">
                  <p className="text-neon-orange font-medium mb-1">Employee Account Information</p>
                  <p className="text-foreground-secondary">
                    Employee accounts are created by HR. Please contact HR for login credentials.
                  </p>
                </div>
              )}

              {/* Demo Credentials */}
              <div className="mt-4 p-3 glass-card text-sm text-center">
                <p className="text-neon-teal font-medium mb-1">Demo Credentials:</p>
                {userType === "hr" ? (
                  <>
                    <p className="text-foreground-secondary">Email: hr@company.com</p>
                    <p className="text-foreground-secondary">Password: admin123</p>
                  </>
                ) : (
                  <>
                    <p className="text-foreground-secondary">Email: john.doe@company.com</p>
                    <p className="text-foreground-secondary">Password: password123</p>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div
          className="text-center mt-8 text-foreground-secondary text-sm animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <p>Powered by AI • Secured by Enterprise Standards</p>
        </div>
      </div>
    </div>
  )
}

export default Login

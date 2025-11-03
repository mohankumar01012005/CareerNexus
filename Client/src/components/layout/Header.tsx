"use client"

// Futuristic Header Component with Profile and Notifications

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Button } from "../../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Badge } from "../../components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { Bell, User, LogOut, Menu, FileText } from "lucide-react"
import { API_CONFIG } from "../../config/api"
import { useNavigate } from "react-router-dom"

interface HeaderProps {
  title: string
  subtitle?: string
  onMenuClick?: () => void
}

interface ResumeResponse {
  success: boolean
  resume_link: string
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onMenuClick }) => {
  const { user, userType, logout } = useAuth()
  const [notificationCount] = useState(3) // Mock notification count
  const [resumeLink, setResumeLink] = useState<string>("")
  const [isLoadingResume, setIsLoadingResume] = useState<boolean>(false)
  const navigate = useNavigate()

  // Fetch resume link on component mount - only for employees
  useEffect(() => {
    const fetchResumeLink = async () => {
      // Only fetch resume link for employees, not HR
      if (userType !== "employee") {
        return
      }

      try {
        setIsLoadingResume(true)

        // Get auth credentials from localStorage
        const authCredentials = localStorage.getItem("authCredentials")

        if (!authCredentials) {
          console.error("No auth credentials found in localStorage")
          return
        }

        const credentials = JSON.parse(authCredentials)

        const response = await fetch(`${API_CONFIG.BASE_URL}/employee/get-resume-link`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch resume link: ${response.status}`)
        }

        const data: ResumeResponse = await response.json()

        if (data.success && data.resume_link) {
          setResumeLink(data.resume_link)
        } else {
          console.error("No resume link found in response:", data)
        }
      } catch (error) {
        console.error("Error fetching resume link:", error)
      } finally {
        setIsLoadingResume(false)
      }
    }

    fetchResumeLink()
  }, [userType])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
  }

  const handleResumeClick = () => {
    if (resumeLink) {
      window.open(resumeLink, "_blank", "noopener,noreferrer")
    } else {
      console.error("No resume link available")
    }
  }

  const handleProfileClick = () => {
    if (userType === "hr") {
      navigate("/hr/settings")
    } else {
      navigate("/employee/profile")
    }
  }

  return (
    <header className="h-16 glass-card border-b border-glass-border/50 flex items-center justify-between px-6 relative overflow-hidden">
      {/* Header Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-teal/3 via-transparent to-neon-purple/3 pointer-events-none" />

      <div className="flex items-center space-x-4 relative z-10">
        {/* Mobile Menu Button */}
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>

        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold font-space text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-foreground-secondary">{subtitle}</p>}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4 relative z-10">
        {/* My Resume Button - Only show for employees */}
        {userType === "employee" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResumeClick}
            disabled={!resumeLink || isLoadingResume}
            className="glass-card border-glass-border hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 bg-transparent"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isLoadingResume ? "Loading..." : "My Resume"}
          </Button>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative hover:bg-primary/10">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-gradient-primary text-white text-xs">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 glass-card border-glass-border/50" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                <Badge variant="outline" className="w-fit mt-1">
                  {userType === "hr" ? "HR Manager" : "Employee"}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-glass-border/30" />
            <DropdownMenuItem className="hover:bg-primary/10" onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-glass-border/30" />
            <DropdownMenuItem
              className="hover:bg-destructive/10 text-destructive focus:text-destructive"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Header
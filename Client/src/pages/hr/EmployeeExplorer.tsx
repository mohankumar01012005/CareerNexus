"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../../contexts/AuthContext"
import type { CreateEmployeeData } from "../../types/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Progress } from "../../components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { useToast } from "../../hooks/use-toast"
import {
  Users,
  Search,
  Filter,
  Eye,
  Mail,
  Calendar,
  Award,
  Target,
  Briefcase,
  Code,
  Palette,
  Megaphone,
  SettingsIcon,
  Plus,
  UserPlus,
  RefreshCw,
} from "lucide-react"
import { getAllEmployeesHR, createEmployeeApi } from "../../utils/api"

interface Employee {
  id: string
  user_id: string
  fullName: string
  email: string
  phoneNumber: string
  department: string
  role: string
  joiningDate: string
  tenure: number
  skills: Array<{
    name: string
    proficiency: number
    category: string
  }>
  careerGoals: Array<{
    _id: string
    targetRole: string
    priority: string
    targetDate: string
    progress: number
    skillsRequired: string[]
    status: string
    submittedAt?: string
    reviewedAt?: string
    reviewNotes?: string
  }>
  careerReadinessScore: number
  isActive: boolean
  lastLogin: string
  resume_link: string
  resume_data_count: number
  createdAt: string
  updatedAt: string
}

const EmployeeExplorer: React.FC = () => {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // State management for filters and search
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState<CreateEmployeeData>({
    name: "",
    email: "",
    password: "",
    department: "",
    role: "",
    joinDate: new Date().toISOString().split("T")[0],
    phone: "",
    skills: [],
  })

  // Fetch employees from backend
  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      const response = await getAllEmployeesHR()
      
      if (response.success) {
        setEmployees(response.employees)
      } else {
        toast({
          title: "❌ Failed to fetch employees",
          description: response.message || "Please try again later",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error)
      toast({
        title: "❌ Connection Error",
        description: "Could not connect to server. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchEmployees()
  }

  // Get unique departments and roles for filter options
  const departments = [...new Set(employees.map((emp) => emp.department))]
  const roles = [...new Set(employees.map((emp) => emp.role))]

  // Filter employees based on search and filter criteria
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter
      const matchesRole = roleFilter === "all" || employee.role === roleFilter
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && employee.isActive) ||
        (statusFilter === "inactive" && !employee.isActive)

      return matchesSearch && matchesDepartment && matchesRole && matchesStatus
    })
  }, [searchTerm, departmentFilter, roleFilter, statusFilter, employees])

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await createEmployeeApi(createForm)
      if (response.success) {
        toast({
          title: "✅ Employee Created Successfully",
          description: `${createForm.name} has been added to the system and can now log in with their credentials.`,
        })
        setIsCreateModalOpen(false)
        setCreateForm({
          name: "",
          email: "",
          password: "",
          department: "",
          role: "",
          joinDate: new Date().toISOString().split("T")[0],
          phone: "",
          skills: [],
        })
        // Refresh the employee list
        fetchEmployees()
      } else {
        toast({
          title: "❌ Failed to Create Employee",
          description: response.message || "Email already exists or there was a server error. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Connection Error",
        description: "Could not connect to server. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Helper functions for styling and data display
  const getStatusColor = (isActive: boolean) => {
    return isActive ? "text-neon-green bg-neon-green/10" : "text-red-400 bg-red-400/10"
  }

  const getDepartmentIcon = (department: string) => {
    switch (department.toLowerCase()) {
      case "engineering":
        return <Code className="w-4 h-4" />
      case "design":
        return <Palette className="w-4 h-4" />
      case "product":
        return <Target className="w-4 h-4" />
      case "marketing":
        return <Megaphone className="w-4 h-4" />
      default:
        return <Briefcase className="w-4 h-4" />
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getGoalStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "text-neon-green bg-neon-green/10"
      case "rejected":
        return "text-red-400 bg-red-400/10"
      case "pending":
        return "text-yellow-400 bg-yellow-400/10"
      default:
        return "text-foreground-secondary bg-muted"
    }
  }

  // Reset all filters function
  const resetFilters = () => {
    setSearchTerm("")
    setDepartmentFilter("all")
    setRoleFilter("all")
    setStatusFilter("all")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space text-gradient-primary">Employee Explorer</h1>
          <p className="text-foreground-secondary mt-1">
            Advanced search and filtering for comprehensive employee management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-sm">
            {filteredEmployees.length} of {employees.length} employees
          </Badge>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="glass-button bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient-primary">
                <UserPlus className="w-4 h-4 mr-2" />
                Create New Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass-card">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-neon-teal" />
                  <span>Create New Employee</span>
                </DialogTitle>
                <DialogDescription>
                  Add a new employee to the system. They will be able to log in immediately with the provided
                  credentials.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateEmployee} className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">Full Name *</Label>
                    <Input
                      id="create-name"
                      type="text"
                      className="glass-input"
                      placeholder="John Doe"
                      value={createForm.name}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-email">Email *</Label>
                    <Input
                      id="create-email"
                      type="email"
                      className="glass-input"
                      placeholder="john.doe@company.com"
                      value={createForm.email}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-password">Initial Password *</Label>
                    <Input
                      id="create-password"
                      type="password"
                      className="glass-input"
                      placeholder="Set initial password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-phone">Phone Number</Label>
                    <Input
                      id="create-phone"
                      type="tel"
                      className="glass-input"
                      placeholder="+1-555-0123"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-department">Department *</Label>
                    <Select
                      value={createForm.department}
                      onValueChange={(value) => setCreateForm((prev) => ({ ...prev, department: value }))}
                    >
                      <SelectTrigger className="glass-input">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="HR">Human Resources</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-role">Role/Designation *</Label>
                    <Input
                      id="create-role"
                      type="text"
                      className="glass-input"
                      placeholder="Software Developer"
                      value={createForm.role}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-joindate">Joining Date *</Label>
                  <Input
                    id="create-joindate"
                    type="date"
                    className="glass-input"
                    value={createForm.joinDate}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, joinDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-skills">Skills (Optional)</Label>
                  <Input
                    id="create-skills"
                    type="text"
                    className="glass-input"
                    placeholder="React, TypeScript, Node.js (comma separated)"
                    value={createForm.skills?.join(", ") || ""}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        skills: e.target.value
                          .split(",")
                          .map((skill) => skill.trim())
                          .filter((skill) => skill.length > 0),
                      }))
                    }
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="btn-gradient-primary flex-1" disabled={isCreating}>
                    {isCreating ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating Employee...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>Create Employee</span>
                      </div>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="glass-button bg-transparent"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-neon-teal" />
            <span>Search & Filter</span>
          </CardTitle>
          <CardDescription>
            Use advanced filters to find employees based on skills, department, role, and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-foreground-secondary" />
            <Input
              placeholder="Search by name, email, or role..."
              className="pl-10 glass-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <div></div>

            <Button variant="outline" onClick={resetFilters} className="glass-button bg-transparent">
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-neon-purple" />
            <span>Employee Directory</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-teal mx-auto"></div>
              <p className="text-foreground-secondary mt-4">Loading employee data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Readiness Score</TableHead>
                  <TableHead>Career Goals</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee, index) => (
                  <TableRow
                    key={employee.id}
                    className="hover:bg-primary/5 transition-colors"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {getInitials(employee.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{employee.fullName}</div>
                          <div className="text-sm text-foreground-secondary flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {employee.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                        {getDepartmentIcon(employee.department)}
                        <span>{employee.department}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{employee.role}</div>
                      <div className="text-sm text-foreground-secondary flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {employee.tenure} months
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(employee.isActive)}>
                        {employee.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Score</span>
                          <span className="font-semibold">{employee.careerReadinessScore}%</span>
                        </div>
                        <Progress value={employee.careerReadinessScore} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          Total: {employee.careerGoals.length}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {employee.careerGoals.slice(0, 2).map((goal, idx) => (
                            <Badge key={idx} variant="outline" className={`text-xs ${getGoalStatusColor(goal.status)}`}>
                              {goal.status}
                            </Badge>
                          ))}
                          {employee.careerGoals.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{employee.careerGoals.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="glass-button bg-transparent"
                            onClick={() => setSelectedEmployee(employee)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl glass-card max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-3">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                  {getInitials(employee.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-xl">{employee.fullName}</div>
                                <div className="text-sm text-foreground-secondary">{employee.role}</div>
                              </div>
                            </DialogTitle>
                          </DialogHeader>

                          {/* Employee Detail View */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                              <div className="p-4 glass-card border-border/30">
                                <h4 className="font-semibold mb-3 flex items-center">
                                  <SettingsIcon className="w-4 h-4 mr-2" />
                                  Basic Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-foreground-secondary">Email:</span>
                                    <span>{employee.email}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-foreground-secondary">Department:</span>
                                    <span>{employee.department}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-foreground-secondary">Phone:</span>
                                    <span>{employee.phoneNumber || "Not provided"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-foreground-secondary">Join Date:</span>
                                    <span>{new Date(employee.joiningDate).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-foreground-secondary">Tenure:</span>
                                    <span>{employee.tenure} months</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-foreground-secondary">Status:</span>
                                    <Badge className={getStatusColor(employee.isActive)}>
                                      {employee.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Career Goals */}
                              <div className="p-4 glass-card border-border/30">
                                <h4 className="font-semibold mb-3 flex items-center">
                                  <Target className="w-4 h-4 mr-2" />
                                  Career Goals ({employee.careerGoals.length})
                                </h4>
                                <div className="space-y-3">
                                  {employee.careerGoals.map((goal, idx) => (
                                    <div key={goal._id} className="p-3 bg-primary/5 rounded border">
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium">{goal.targetRole}</span>
                                        <Badge className={getGoalStatusColor(goal.status)}>
                                          {goal.status}
                                        </Badge>
                                      </div>
                                      <div className="text-sm text-foreground-secondary space-y-1">
                                        <div>Priority: {goal.priority}</div>
                                        <div>Target: {new Date(goal.targetDate).toLocaleDateString()}</div>
                                        <div>Progress: {goal.progress}%</div>
                                        {goal.skillsRequired.length > 0 && (
                                          <div>
                                            Skills: {goal.skillsRequired.slice(0, 3).join(", ")}
                                            {goal.skillsRequired.length > 3 && "..."}
                                          </div>
                                        )}
                                        {goal.reviewNotes && (
                                          <div className="mt-2 p-2 bg-background/50 rounded">
                                            <strong>HR Notes:</strong> {goal.reviewNotes}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {employee.careerGoals.length === 0 && (
                                    <div className="text-center text-foreground-secondary py-4">
                                      No career goals set
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Skills & Performance */}
                            <div className="space-y-4">
                              <div className="p-4 glass-card border-border/30">
                                <h4 className="font-semibold mb-3 flex items-center">
                                  <Award className="w-4 h-4 mr-2" />
                                  Skills Assessment
                                </h4>
                                <div className="space-y-3">
                                  {employee.skills.map((skill, idx) => (
                                    <div key={idx} className="space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span>{skill.name}</span>
                                        <span className="font-semibold">{skill.proficiency}%</span>
                                      </div>
                                      <Progress value={skill.proficiency} className="h-2" />
                                      <div className="text-xs text-foreground-secondary">{skill.category}</div>
                                    </div>
                                  ))}
                                  {employee.skills.length === 0 && (
                                    <div className="text-center text-foreground-secondary py-4">
                                      No skills recorded
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Performance Metrics */}
                              <div className="p-4 glass-card border-border/30">
                                <h4 className="font-semibold mb-3 flex items-center">
                                  <Award className="w-4 h-4 mr-2" />
                                  Performance Metrics
                                </h4>
                                <div className="space-y-4">
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span>Career Readiness</span>
                                      <span className="font-semibold">{employee.careerReadinessScore}%</span>
                                    </div>
                                    <Progress value={employee.careerReadinessScore} className="h-2" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="text-center p-3 bg-primary/5 rounded">
                                      <div className="font-semibold text-lg">{employee.careerGoals.length}</div>
                                      <div className="text-foreground-secondary">Career Goals</div>
                                    </div>
                                    <div className="text-center p-3 bg-primary/5 rounded">
                                      <div className="font-semibold text-lg">{employee.skills.length}</div>
                                      <div className="text-foreground-secondary">Skills</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!isLoading && filteredEmployees.length === 0 && (
            <div className="text-center py-12 text-foreground-secondary">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Employees Found</h3>
              <p>Try adjusting your search criteria or create a new employee.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default EmployeeExplorer
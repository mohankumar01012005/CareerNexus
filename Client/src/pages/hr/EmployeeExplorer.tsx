"use client"

// HR Employee Explorer - Advanced Search and Filtering for Employee Management

import type React from "react"
import { useState, useMemo } from "react"
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
} from "lucide-react"

const EmployeeExplorer: React.FC = () => {
  const { getAllEmployees, createEmployee } = useAuth()
  const { toast } = useToast()

  const mockEmployees = getAllEmployees()

  // State management for filters and search
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [riskFilter, setRiskFilter] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState(null)

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

  // Get unique departments and roles for filter options
  const departments = [...new Set(mockEmployees.map((emp) => emp.department))]
  const roles = [...new Set(mockEmployees.map((emp) => emp.currentRole))]

  // Filter employees based on search and filter criteria
  const filteredEmployees = useMemo(() => {
    return mockEmployees.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.currentRole.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter
      const matchesRole = roleFilter === "all" || employee.currentRole === roleFilter

      return matchesSearch && matchesDepartment && matchesRole
    })
  }, [searchTerm, departmentFilter, roleFilter, mockEmployees])

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const success = await createEmployee(createForm)
      if (success) {
        toast({
          title: "✅ Employee Created Successfully",
          description: `${createForm.name} has been added to the system and can now log in.`,
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
        window.location.reload()
      } else {
        toast({
          title: "Failed to Create Employee",
          description: "Email already exists or there was an error. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Helper functions for styling and data display
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "high":
        return "text-red-400 bg-red-400/10"
      case "medium":
        return "text-yellow-400 bg-yellow-400/10"
      case "low":
        return "text-neon-green bg-neon-green/10"
      default:
        return "text-foreground-secondary bg-muted"
    }
  }

  const getPerformanceColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "excellent":
        return "text-neon-green bg-neon-green/10"
      case "good":
        return "text-neon-teal bg-neon-teal/10"
      case "needs improvement":
        return "text-yellow-400 bg-yellow-400/10"
      default:
        return "text-foreground-secondary bg-muted"
    }
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

  // Reset all filters function
  const resetFilters = () => {
    setSearchTerm("")
    setDepartmentFilter("all")
    setRoleFilter("all")
    setRiskFilter("all")
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
            {filteredEmployees.length} of {mockEmployees.length} employees
          </Badge>
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
            Use advanced filters to find employees based on skills, department, role, and risk factors
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Readiness Score</TableHead>
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
                        <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{employee.name}</div>
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
                    <div className="font-medium">{employee.currentRole}</div>
                    <div className="text-sm text-foreground-secondary flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Joined {new Date(employee.joinDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Score</span>
                        <span className="font-semibold">{employee.readinessScore}%</span>
                      </div>
                      <Progress value={employee.readinessScore} className="h-2" />
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
                      <DialogContent className="max-w-4xl glass-card">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                {getInitials(employee.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-xl">{employee.name}</div>
                              <div className="text-sm text-foreground-secondary">{employee.currentRole}</div>
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
                                  <span>{employee.phone || "Not provided"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-foreground-secondary">Join Date:</span>
                                  <span>{new Date(employee.joinDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            {/* Career Goals */}
                            <div className="p-4 glass-card border-border/30">
                              <h4 className="font-semibold mb-3 flex items-center">
                                <Target className="w-4 h-4 mr-2" />
                                Career Goals
                              </h4>
                              <div className="space-y-2">
                                {employee.careerGoals.map((goal: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined, idx: React.Key | null | undefined) => (
                                  <Badge key={idx} variant="outline" className="mr-2">
                                    {goal}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Skills Chart */}
                          <div className="space-y-4">
                            <div className="p-4 glass-card border-border/30">
                              <h4 className="font-semibold mb-3 flex items-center">
                                <Award className="w-4 h-4 mr-2" />
                                Skills Assessment
                              </h4>
                              <div className="space-y-3">
                                {employee.skills.map((skill: { name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; level: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined }, idx: React.Key | null | undefined) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span>{skill.name}</span>
                                      <span className="font-semibold">{skill.level}%</span>
                                    </div>
                                    <Progress value={Number(skill.level)} className="h-2" />
                                  </div>
                                ))}
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
        </CardContent>
      </Card>
    </div>
  )
}

export default EmployeeExplorer

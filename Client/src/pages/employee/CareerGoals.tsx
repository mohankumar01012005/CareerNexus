"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Target, Star, Plus, X, Trash2, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { getEmployeeCareerGoals, addEmployeeCareerGoal, deleteCareerGoalByCredentials } from "../../utils/api"

interface CareerGoal {
  _id?: string
  targetRole: string
  priority: "Low" | "Medium" | "High"
  targetDate: string
  progress: number
  skillsRequired: string[]
  status: "pending" | "approved" | "rejected"
  submittedAt?: string
  reviewedAt?: string
  reviewNotes?: string
}

const CareerGoals: React.FC = () => {
  const { credentials } = useAuth() as unknown as {
    credentials: { email: string; password: string } | null
  }
  
  const [careerGoals, setCareerGoals] = useState<CareerGoal[]>([])
  const [isLoadingGoals, setIsLoadingGoals] = useState(false)
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [isDeletingGoal, setIsDeletingGoal] = useState(false)

  // Modal states
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null)

  // Form state for new goal
  const [newGoal, setNewGoal] = useState<Omit<CareerGoal, 'progress' | 'status'>>({
    targetRole: "",
    priority: "Medium",
    targetDate: "",
    skillsRequired: []
  })
  const [currentSkill, setCurrentSkill] = useState("")
  const [formError, setFormError] = useState("")

  // Fetch career goals
  const fetchCareerGoals = async () => {
    if (!credentials?.email || !credentials?.password) {
      console.log("No credentials available for fetching career goals")
      return
    }

    try {
      setIsLoadingGoals(true)
      console.log("Fetching career goals...")
      const response = await getEmployeeCareerGoals({
        email: credentials.email,
        password: credentials.password,
      })

      console.log("Career goals response:", response)

      if (response.success && response.careerGoals) {
        setCareerGoals(response.careerGoals)
        console.log(`Loaded ${response.careerGoals.length} career goals`)
      } else {
        console.log("No career goals found")
        setCareerGoals([])
      }
    } catch (error) {
      console.error("Failed to fetch career goals:", error)
      setCareerGoals([])
    } finally {
      setIsLoadingGoals(false)
    }
  }

  useEffect(() => {
    fetchCareerGoals()
  }, [credentials])

  // Handle adding new career goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    
    if (!credentials?.email || !credentials?.password) {
      setFormError("No credentials available for adding career goal")
      return
    }

    if (!newGoal.targetRole.trim()) {
      setFormError("Please enter a target role")
      return
    }

    // Check if priority already exists
    const existingPriorityGoal = careerGoals.find(goal => goal.priority === newGoal.priority)
    if (existingPriorityGoal) {
      setFormError(`You already have a ${newGoal.priority.toLowerCase()} priority goal. Each priority level can only have one goal.`)
      return
    }

    // Check if maximum goals reached
    if (careerGoals.length >= 3) {
      setFormError("Maximum of 3 career goals allowed. Please delete an existing goal to add a new one.")
      return
    }

    try {
      setIsAddingGoal(true)
      console.log("Adding new career goal:", newGoal)

      const response = await addEmployeeCareerGoal({
        email: credentials.email,
        password: credentials.password,
        targetRole: newGoal.targetRole,
        priority: newGoal.priority,
        targetDate: newGoal.targetDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        skillsRequired: newGoal.skillsRequired,
      })

      console.log("Add career goal response:", response)

      if (response.success) {
        // Refresh goals
        await fetchCareerGoals()
        // Close modal and reset form
        setGoalModalOpen(false)
        setNewGoal({
          targetRole: "",
          priority: "Medium",
          targetDate: "",
          skillsRequired: []
        })
        setCurrentSkill("")
        setFormError("")
      } else {
        setFormError(response.message || "Failed to add career goal")
      }
    } catch (error: any) {
      console.error("Error adding career goal:", error)
      setFormError(error.message || "Failed to add career goal. Please try again.")
    } finally {
      setIsAddingGoal(false)
    }
  }

  // Handle deleting career goal
  const handleDeleteGoal = async () => {
    if (!goalToDelete || !credentials?.email || !credentials?.password) {
      return
    }

    try {
      setIsDeletingGoal(true)
      console.log("Deleting career goal:", goalToDelete)

      const response = await deleteCareerGoalByCredentials({
        email: credentials.email,
        password: credentials.password,
        goalId: goalToDelete,
      })

      console.log("Delete career goal response:", response)

      if (response.success) {
        // Refresh goals
        await fetchCareerGoals()
        // Close modal
        setDeleteModalOpen(false)
        setGoalToDelete(null)
      } else {
        alert(`Failed to delete goal: ${response.message}`)
      }
    } catch (error: any) {
      console.error("Error deleting career goal:", error)
      alert(error.message || "Failed to delete career goal. Please try again.")
    } finally {
      setIsDeletingGoal(false)
    }
  }

  // Add skill to the skillsRequired array
  const addSkill = () => {
    if (currentSkill.trim() && !newGoal.skillsRequired.includes(currentSkill.trim())) {
      setNewGoal(prev => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, currentSkill.trim()]
      }))
      setCurrentSkill("")
    }
  }

  // Remove skill from skillsRequired array
  const removeSkill = (skillToRemove: string) => {
    setNewGoal(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter(skill => skill !== skillToRemove)
    }))
  }

  // Handle Enter key in skills input
  const handleSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  // Open delete confirmation modal
  const openDeleteModal = (goalId: string) => {
    setGoalToDelete(goalId)
    setDeleteModalOpen(true)
  }

  // Close modals and reset states
  const closeModals = () => {
    setGoalModalOpen(false)
    setDeleteModalOpen(false)
    setGoalToDelete(null)
    setFormError("")
    setNewGoal({
      targetRole: "",
      priority: "Medium",
      targetDate: "",
      skillsRequired: []
    })
    setCurrentSkill("")
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-500/20 text-red-400 border-red-500/30"
      case "Medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Low": return "bg-green-500/20 text-green-400 border-green-500/30"
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "rejected":
        return <X className="w-4 h-4 text-red-400" />
      case "pending":
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "pending":
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    }
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-neon-purple flex-shrink-0" />
            <span>Career Aspirations</span>
          </CardTitle>
          <CardDescription>
            {isLoadingGoals ? "Loading your career goals..." : `You have ${careerGoals.length} of 3 career goals`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingGoals ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple mx-auto"></div>
              <p className="text-foreground-secondary mt-2">Loading career goals...</p>
            </div>
          ) : careerGoals.length === 0 ? (
            <div className="text-center py-8 glass-card border-border/30">
              <Target className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Career Goals</h3>
              <p className="text-foreground-secondary mb-4">
                Set your career aspirations to track your progress
              </p>
              <Button 
                className="glass-button" 
                onClick={() => setGoalModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Goal
              </Button>
            </div>
          ) : (
            careerGoals.map((goal, index) => (
              <div
                key={goal._id || index}
                className="flex items-center justify-between p-3 glass-card border-border/30 tilt-3d group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Star className="w-4 h-4 text-neon-teal flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate block">{goal.targetRole}</span>
                      <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                        <Badge variant="outline" className={`text-xs ${getStatusColor(goal.status)}`}>
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(goal.status)}
                            <span className="capitalize">{goal.status}</span>
                          </span>
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(goal._id!)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400"
                          disabled={isDeletingGoal}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </Badge>
                      <span className="text-xs text-foreground-secondary">
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </span>
                      {goal.reviewedAt && (
                        <span className="text-xs text-foreground-secondary">
                          Reviewed: {new Date(goal.reviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {goal.skillsRequired.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {goal.skillsRequired.slice(0, 3).map((skill, skillIndex) => (
                          <Badge key={skillIndex} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {goal.skillsRequired.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{goal.skillsRequired.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    {goal.reviewNotes && (
                      <div className="mt-2 p-2 bg-background/50 rounded text-xs text-foreground-secondary">
                        <strong>HR Notes:</strong> {goal.reviewNotes}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
                  {goal.progress}%
                </Badge>
              </div>
            ))
          )}
          {careerGoals.length > 0 && careerGoals.length < 3 && (
            <Button 
              variant="outline" 
              className="w-full glass-button bg-transparent" 
              onClick={() => setGoalModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Goal
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Add Goal Modal */}
      {goalModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gradient-primary">Add New Career Goal</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeModals}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-2 text-red-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{formError}</span>
                </div>
              )}

              <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
                <p><strong>Note:</strong> You can have maximum 3 career goals - one for each priority level (High, Medium, Low).</p>
                <p className="mt-1">Goals require HR approval before they become active.</p>
              </div>
              
              <form onSubmit={handleAddGoal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Target Role *
                  </label>
                  <input
                    type="text"
                    value={newGoal.targetRole}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetRole: e.target.value }))}
                    placeholder="e.g., Senior Frontend Engineer"
                    className="w-full p-3 rounded-lg bg-background/50 border border-border focus:border-neon-teal focus:outline-none focus:ring-2 focus:ring-neon-teal/20 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Priority *
                  </label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value as "Low" | "Medium" | "High" }))}
                    className="w-full p-3 rounded-lg bg-background/50 border border-border focus:border-neon-teal focus:outline-none focus:ring-2 focus:ring-neon-teal/20 transition-colors"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                  <p className="text-xs text-foreground-secondary mt-1">
                    {careerGoals.find(goal => goal.priority === newGoal.priority) 
                      ? `You already have a ${newGoal.priority.toLowerCase()} priority goal` 
                      : `Available priority slot`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 rounded-lg bg-background/50 border border-border focus:border-neon-teal focus:outline-none focus:ring-2 focus:ring-neon-teal/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Required Skills
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyPress={handleSkillKeyPress}
                      placeholder="Enter a skill and press Enter"
                      className="flex-1 p-3 rounded-lg bg-background/50 border border-border focus:border-neon-teal focus:outline-none focus:ring-2 focus:ring-neon-teal/20 transition-colors"
                    />
                    <Button
                      type="button"
                      onClick={addSkill}
                      className="bg-neon-teal hover:bg-neon-teal/80 text-white"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newGoal.skillsRequired.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center space-x-1 bg-neon-blue/20 text-neon-blue border-neon-blue/30"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModals}
                    className="flex-1 glass-button bg-transparent"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAddingGoal || !!careerGoals.find(goal => goal.priority === newGoal.priority)}
                    className="flex-1 bg-gradient-to-r from-neon-teal to-neon-purple hover:from-neon-teal/80 hover:to-neon-purple/80 text-white disabled:opacity-50"
                  >
                    {isAddingGoal ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      "Submit for Approval"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Delete Career Goal</h2>
              </div>
              
              <p className="text-foreground-secondary mb-6">
                Are you sure you want to delete this career goal? This action cannot be undone.
              </p>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 glass-button bg-transparent"
                  disabled={isDeletingGoal}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteGoal}
                  disabled={isDeletingGoal}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {isDeletingGoal ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Goal"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CareerGoals
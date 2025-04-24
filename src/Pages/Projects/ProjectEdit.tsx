"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Box, Button, Grid, Typography, CircularProgress } from "@mui/material"
import { TextField } from "../../Components/TextField"
import { PageNav } from "../../Components/PageNav"
import { useNavigate, useParams } from "react-router-dom"
import DatePicker from "../../Components/Buttons/DatePickerButton"
import supabaseClient from "../../supabaseClient"
import { useToast } from "../../Components/Toast/ToastContext"
import DropDown from "../../Components/DropDown"
import { ButtonShowHide } from "../../Components/Buttons/ButtonShowHide"
import { DataGrid, type DataGridField } from "../../Components/DataGrid"
import { ListContextProvider, useListController } from "react-admin"
import { DeleteOutline as DeleteIcon, Link as LinkIcon } from "@mui/icons-material"
import { SearchBox } from "../../Components/SearchBox"
import { EmbeddedComponentPopup } from "../../Components/EmbeddedComponentPopup"
import UserCreate from "../Users 2.0/UserCreate"
import { ButtonRadioSelect2 } from "../../Components/Buttons/ButtonRadioSelect2"
import { StickyWrapper } from "../../Components/sticky-wrapper"
import MultiSelectDropDown from "../../Components/MultiSelectDropDown"

interface ProjectEditProps {
  onSaveSuccess: () => void
}

interface Project {
  id: string
  name: string
  planned_start_date: string
  planned_end_date: string
  location: string
  street: string
  suburb: string
  city: string
  province: string
  project_owner: string
  notification_start_date: string
  notification_frequency: number | null
}

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  contact_number: string
  company_name: string
  user_roles: {
    role_name: string
  }
  disciplines?: string[] // Added disciplines property
}

interface Consultant {
  id: string
  first_name: string
  last_name: string
  email: string
  company_name: string
  user_roles: {
    role_name: string
  }
}

interface Frequency {
  id: number
  frequency: string
}

interface Discipline {
  id: string
  name: string
}

const consultantFields: DataGridField[] = [
  { source: "first_name", label: "Name", type: "text" },
  { source: "last_name", label: "Surname", type: "text" },
  { source: "email", label: "Email", type: "text" },
]

const DataGridWrapper = ({ data, children }) => {
  const listContext = useListController({
    data,
    resource: "users",
    perPage: 10,
    sort: { field: "first_name", order: "ASC" },
  })

  return <ListContextProvider value={listContext}>{children}</ListContextProvider>
}

export const ProjectEdit: React.FC<ProjectEditProps> = ({ onSaveSuccess }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showMessage } = useToast()

  const [project, setProject] = useState<Project | null>(null)
  const [projectUsers, setProjectUsers] = useState<User[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [provinces, setProvinces] = useState<{ id: string; province_name: string }[]>([])
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [hasConsultant, setHasConsultant] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showConsultantModal, setShowConsultantModal] = useState(false)
  const [selectedConsultantId, setSelectedConsultantId] = useState<string | null>(null)
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingConsultants, setLoadingConsultants] = useState(false)
  const [openPersonCreatePopup, setOpenPersonCreatePopup] = useState(false)
  const [projectNotificationFrequencies, setProjectNotificationFrequencies] = useState<Frequency[]>([])
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null)
  
  // New state for disciplines
  const [allDisciplines, setAllDisciplines] = useState<{ value: string; label: string }[]>([])

  const fetchProjectData = useCallback(async () => {
    if (!id) return

    try {
      const { data: projectData, error: projectError } = await supabaseClient
        .from("projects")
        .select("*, project_notification_frequency!inner(frequency)") // Add this join
        .eq("id", id)
        .single()

      if (projectError) throw projectError

      setProject(projectData)
      // Set the selected frequency from the joined data
      setSelectedFrequency(projectData.project_notification_frequency?.frequency || null)

      const { data: userData, error: userError } = await supabaseClient
        .from("user_project_contractors")
        .select(`
          users:user_id (
            id,
            first_name,
            last_name,
            email,
            contact_number,
            company_name,
            user_roles (
              role_name
            )
          ),
          project_contractors!inner (
            id,
            project_id
          )
        `)
        .eq("project_contractors.project_id", id)

      if (userError) throw userError

      const allUsers = userData.map((item: any) => item.users)
      
      // After getting users, fetch their disciplines
      const usersWithDisciplines = await Promise.all(
        allUsers.map(async (user: User) => {
          const disciplines = await fetchUserDisciplinesData(user.id)
          return {
            ...user,
            disciplines: disciplines
          }
        })
      )
      
      setProjectUsers(usersWithDisciplines)
      setHasConsultant(allUsers.some((user) => user.user_roles.role_name === "Consultant"))
    } catch (error) {
      console.error("Error fetching project data:", error)
      showMessage("Error fetching project data", "error")
    } finally {
      setLoading(false)
    }
  }, [id, showMessage])

// Updated function to fetch disciplines for a specific user in the current project
const fetchUserDisciplinesData = async (userId: string): Promise<string[]> => {
  try {
    // Use the id from useParams directly instead of relying on the project state
    // This ensures we have a valid project ID even if the project state isn't loaded yet
    const projectId = id;
    
    console.log(`Fetching disciplines for user ${userId} in project ${projectId}`);
    
    const { data, error } = await supabaseClient
      .from("user_disciplines")
      .select("discipline_id")
      .eq("user_id", userId)
      .eq("project_id", projectId);
    
    if (error) throw error;
    
    console.log(`Found ${data?.length || 0} disciplines for user ${userId}`);
    return data?.map(d => d.discipline_id) || [];
  } catch (error) {
    console.error("Error fetching user disciplines:", error);
    return [];
  }
};

  const fetchProvinces = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient.from("provinces").select("id, province_name")
      if (error) throw error
      setProvinces(data)
    } catch (error) {
      console.error("Error fetching provinces:", error)
      showMessage("Error fetching provinces", "error")
    }
  }, [showMessage])

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient.from("users").select(`
          *,
          user_roles!inner (
            id,
            role_name
          )
        `)

      if (error) throw error
      setAvailableUsers(data || [])
    } catch (error) {
      console.error("Error fetching available users:", error)
      showMessage("Error fetching available users", "error")
    }
  }, [showMessage])

  const fetchConsultants = useCallback(async () => {
    setLoadingConsultants(true)
    try {
      let query = supabaseClient
        .from("users")
        .select(`
          id, 
          first_name, 
          last_name, 
          email, 
          company_name,
          user_roles!inner(role_name)
        `)
        .eq("user_roles.role_name", "Consultant")

      if (searchQuery) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`,
        )
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching consultants:", error)
        return
      }

      setConsultants(data)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoadingConsultants(false)
    }
  }, [searchQuery])

  const fetchProjectNotificationFrequencies = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient.from("project_notification_frequency").select("id, frequency")
      if (error) throw error
      setProjectNotificationFrequencies(data)
    } catch (error) {
      console.error("Error fetching project notification frequencies:", error)
      showMessage("Error fetching notification frequencies", "error")
    }
  }, [showMessage])

  // New function to fetch all available disciplines
  const fetchAllDisciplines = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient.from("disciplines").select("id, name")
      if (error) throw error
      setAllDisciplines(data.map((d: Discipline) => ({
        value: d.id,
        label: d.name,
      })))
    } catch (error) {
      console.error("Error fetching disciplines:", error)
      showMessage("Error fetching disciplines", "error")
    }
  }, [showMessage])

  useEffect(() => {
    fetchProjectData()
    fetchProvinces()
    fetchAvailableUsers()
    fetchConsultants()
    fetchProjectNotificationFrequencies()
    fetchAllDisciplines() // Fetch all disciplines on component mount
  }, [fetchProjectData, fetchProvinces, fetchAvailableUsers, fetchConsultants, fetchProjectNotificationFrequencies, fetchAllDisciplines])

  const handleBack = () => {
    navigate(-1)
  }

  const handleOnSave = async () => {
    if (!project) return

    try {
      // Update project details
      const selectedFrequencyId = projectNotificationFrequencies.find((f) => f.frequency === selectedFrequency)?.id

      // Create a clean project object with only the fields that exist in the projects table
      const cleanProjectData = {
        name: project.name,
        planned_start_date: project.planned_start_date,
        planned_end_date: project.planned_end_date,
        street: project.street,
        suburb: project.suburb,
        city: project.city,
        province: project.province,
        project_owner: project.project_owner,
        notification_start_date: project.notification_start_date,
        notification_frequency: selectedFrequencyId,
      }

      const { error: projectError } = await supabaseClient
        .from("projects")
        .update(cleanProjectData)
        .eq("id", project.id)

      if (projectError) throw projectError

      // Update user details
      const userUpdatePromises = projectUsers.map((user) =>
        supabaseClient
          .from("users")
          .update({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            contact_number: user.contact_number,
            company_name: user.company_name,
          })
          .eq("id", user.id),
      )

      await Promise.all(userUpdatePromises)

      showMessage("Project and user details have been updated successfully", "success")
      onSaveSuccess()
      navigate(`/projects/${project.id}/show`)
    } catch (error) {
      console.error("Error updating project or user details:", error)
      showMessage("Error updating project or user details", "error")
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!project) return

    try {
      // Fetch all project_contractors for this project
      const { data: projectContractors, error: projectContractorError } = await supabaseClient
        .from("project_contractors")
        .select("id")
        .eq("project_id", project.id)

      if (projectContractorError) throw projectContractorError

      if (!projectContractors || projectContractors.length === 0) {
        throw new Error("No project contractors found for this project")
      }

      // Remove the user from user_project_contractors table for all project_contractors
      const { error: removeFromProjectError } = await supabaseClient
        .from("user_project_contractors")
        .delete()
        .in(
          "project_contractor_id",
          projectContractors.map((pc) => pc.id),
        )
        .eq("user_id", userId)

      if (removeFromProjectError) throw removeFromProjectError

      // Update local state
      const removedUser = projectUsers.find((user) => user.id === userId)
      setProjectUsers(projectUsers.filter((user) => user.id !== userId))
      if (removedUser && removedUser.user_roles.role_name === "Consultant") {
        setHasConsultant(false)
      }

      showMessage("User removed from project successfully", "success")
    } catch (error) {
      console.error("Error removing user from project:", error)
      showMessage("Error removing user from project", "error")
    }
  }

  const handleUserSelection = async (selectedUserId: string) => {
    const user = availableUsers.find((u) => u.id === selectedUserId)
    if (!user) return

    await addUserToProject(user.id)
  }

  const addUserToProject = async (userId: string) => {
    if (!project) return

    try {
      const { data: projectContractors, error: projectContractorError } = await supabaseClient
        .from("project_contractors")
        .select("id")
        .eq("project_id", project.id)

      if (projectContractorError) throw projectContractorError
      if (!projectContractors || projectContractors.length === 0) {
        throw new Error("No project contractors found for this project")
      }

      const { error } = await supabaseClient.from("user_project_contractors").insert({
        user_id: userId,
        project_contractor_id: projectContractors[0].id,
        is_active: true,
      })

      if (error) throw error

      const newUser = availableUsers.find((u) => u.id === userId)
      if (newUser) {
        // Fetch disciplines for the new user
        const disciplines = await fetchUserDisciplinesData(userId)
        setProjectUsers([...projectUsers, {...newUser, disciplines}])
      }

      showMessage("User added to project successfully", "success")
      setShowUserSearch(false)
    } catch (error) {
      console.error("Error linking user to project:", error)
      showMessage("Error adding user to project", "error")
    }
  }

  const handleConsultantChange = async (newConsultantId: string) => {
    if (!project || !selectedConsultantId) return

    try {
      const { data: projectContractors, error: projectContractorError } = await supabaseClient
        .from("project_contractors")
        .select("id")
        .eq("project_id", project.id)

      if (projectContractorError) throw projectContractorError
      if (!projectContractors || projectContractors.length === 0) {
        throw new Error("No project contractors found for this project")
      }

      const { error } = await supabaseClient
        .from("user_project_contractors")
        .update({ user_id: newConsultantId })
        .eq("project_contractor_id", projectContractors[0].id)
        .eq("user_id", selectedConsultantId)

      if (error) throw error

      // Update local state
      const newConsultant = consultants.find((u) => u.id === newConsultantId)
      if (newConsultant) {
        // Fetch disciplines for the new consultant
        const disciplines = await fetchUserDisciplinesData(newConsultantId)
        setProjectUsers(projectUsers.map((u) => (u.id === selectedConsultantId ? {...newConsultant, disciplines} : u)))
      }

      showMessage("Consultant updated successfully", "success")
      setShowConsultantModal(false)
      setSelectedConsultantId(null)
    } catch (error) {
      console.error("Error updating consultant:", error)
      showMessage("Error updating consultant", "error")
    }
  }

  // New function to handle discipline changes
  const handleDisciplineChange = async (event: React.ChangeEvent<{ value: unknown }>, userId: string) => {
    const updatedIds = event.target.value as string[]
    
    // Find the current user's disciplines
    const user = projectUsers.find(u => u.id === userId)
    if (!user || !user.disciplines) return
    
    // Insert new disciplines
    const newDisciplineIds = updatedIds.filter(id => !user.disciplines?.includes(id))
    for (const id of newDisciplineIds) {
      await insertDiscipline(userId, id)
    }

    // Remove unselected disciplines
    const removedDisciplineIds = user.disciplines.filter(id => !updatedIds.includes(id))
    for (const id of removedDisciplineIds) {
      await deleteDiscipline(userId, id)
    }

    // Update local state
    setProjectUsers(projectUsers.map(u => 
      u.id === userId 
        ? {...u, disciplines: updatedIds} 
        : u
    ))
  }

  // New function to insert a discipline
  const insertDiscipline = async (userId: string, disciplineId: string) => {
    try {
      const { error } = await supabaseClient.from("user_disciplines").insert({
        user_id: userId,
        discipline_id: disciplineId,
        project_id: project?.id,
      })

      if (error) {
        console.error("Error inserting discipline:", error)
        showMessage("Error assigning discipline to user", "error")
      } else {
        console.log(`Inserted discipline ID: ${disciplineId} for user ID: ${userId}`)
        // showMessage("Discipline assigned successfully", "success")
      }
    } catch (error) {
      console.error("Insert error:", error)
      showMessage("Error assigning discipline", "error")
    }
  }

  // New function to delete a discipline
  const deleteDiscipline = async (userId: string, disciplineId: string) => {
    try {
      const { error } = await supabaseClient
        .from("user_disciplines")
        .delete()
        .eq("user_id", userId)
        .eq("discipline_id", disciplineId)
        .eq("project_id", project?.id)

      if (error) {
        console.error("Error deleting discipline:", error)
        showMessage("Error removing discipline from user", "error")
      } else {
        console.log(`Deleted discipline ID: ${disciplineId} for user ID: ${userId}`)
        // showMessage("Discipline removed successfully", "success")
      }
    } catch (error) {
      console.error("Delete error:", error)
      showMessage("Error removing discipline", "error")
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleOpenPersonCreate = () => {
    setOpenPersonCreatePopup(true)
  }

  const handleClosePersonCreatePopup = () => {
    setOpenPersonCreatePopup(false)
    fetchProjectData() // Optionally refresh project data after closing
  }

  const dataGridFields: DataGridField[] = [
    { source: "first_name", label: "First Name", type: "text" },
    { source: "last_name", label: "Last Name", type: "text" },
    { source: "email", label: "Email", type: "text" },
    { source: "contact_number", label: "Contact Number", type: "text" },
    { source: "user_roles.role_name", label: "Role", type: "text" },
  ]

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!project) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Typography variant="h6">Project not found</Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "700px",
          borderRadius: "8px",
          padding: "24px",
        }}
      >
        <StickyWrapper>
        <PageNav title="Edit Project" onBack={handleBack} onSave={handleOnSave} saveButtonText="Update project" />
        </StickyWrapper>
        <Box sx={{ display: "flex", width: "100%", gap: 2 }}>
          <TextField
            source="name"
            label="Project Name"
            value={project.name}
            onChange={(e) => setProject({ ...project, name: e.target.value })}
          />
          <TextField
            source="project_owner"
            label="Client owner/developer"
            value={project.project_owner}
            onChange={(e) => setProject({ ...project, project_owner: e.target.value })}
          />
        </Box>
        <Box sx={{ display: "flex", width: "100%", gap: 2 }}>
          <TextField
            source="street"
            label="Street"
            value={project.street}
            onChange={(e) => setProject({ ...project, street: e.target.value })}
          />
          <TextField
            source="suburb"
            label="Suburb"
            value={project.suburb}
            onChange={(e) => setProject({ ...project, suburb: e.target.value })}
          />
        </Box>
        <Box sx={{ display: "flex", width: "100%", gap: 2 }}>
          <TextField
            source="city"
            label="City"
            value={project.city}
            onChange={(e) => setProject({ ...project, city: e.target.value })}
          />
          <DropDown
            label="Province"
            value={project.province}
            onChange={(e) => setProject({ ...project, province: e.target.value })}
            options={provinces.map((p) => ({ value: p.id, label: p.province_name }))}
          />
        </Box>
        <Box sx={{ display: "flex", width: "100%", gap: 2 }}>
          <DatePicker
            label="Planned start date"
            value={project.planned_start_date}
            onChange={(e) => setProject({ ...project, planned_start_date: e.target.value })}
          />
          <DatePicker
            label="Planned end date"
            value={project.planned_end_date}
            onChange={(e) => setProject({ ...project, planned_end_date: e.target.value })}
          />
        </Box>
        {/* <TextField
          source="location"
          label="Location"
          value={project.location}
          onChange={(e) => setProject({ ...project, location: e.target.value })}
        /> */}
        <DatePicker
          label="Notification start date"
          value={project.notification_start_date}
          onChange={(e) => setProject({ ...project, notification_start_date: e.target.value })}
        />
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              component="label"
              sx={{ fontSize: "0.875rem", fontWeight: 800, marginRight: "10%", marginLeft: "2%" }}
            >
              Notification frequency
            </Typography>
            <ButtonRadioSelect2
              value={selectedFrequency}
              onChange={setSelectedFrequency}
              options={projectNotificationFrequencies.map((f) => f.frequency)}
            />
          </Grid>
        </Grid>

        {/* Project Users and Contractors Section */}
        <Box sx={{ mt: 4, borderTop: "1px solid #e0e0e0", pt: 4 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Project Users and Contractors
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
              <ButtonShowHide
                text={showUserSearch ? "Back to user list" : "+ Add people to the project"}
                onClick={handleOpenPersonCreate}
                readonly={false}
                sx={{
                  backgroundColor: "#DBEAFE",
                  color: "#235e84",
                  "&:hover": {
                    backgroundColor: "#e0effa",
                  },
                }}
              />
            </Grid>
          </Grid>

          {showUserSearch ? (
            <DataGridWrapper data={availableUsers}>
              <DataGrid
                fields={dataGridFields}
                data={availableUsers.filter(
                  (user) =>
                    !projectUsers.some((projectUser) => projectUser.id === user.id) &&
                    (user.user_roles.role_name === "Contractor" || user.user_roles.role_name === "Sub-Contractor"),
                )}
                onRowClick={(id) => handleUserSelection(id as string)}
                hidePagination={false}
                hideColumnNames={false}
              />
            </DataGridWrapper>
          ) : (
            <Box sx={{ mt: 2 }}>
              {projectUsers.length === 0 ? (
                <Typography color="text.secondary">No users assigned to this project</Typography>
              ) : (
                projectUsers.map((user) => (
                  <Box
                    key={user.id}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      p: 2,
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: "grid", gap: 1 }}>
                      <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                        <Typography
                          component="label"
                          sx={{
                            fontSize: "0.875rem",
                            fontWeight: 800,
                            color: "rgba(0, 0, 0, 0.87)",
                            marginRight: "16px",
                          }}
                        >
                          Role
                        </Typography>
                        <ButtonShowHide
                          text={`${user.user_roles.role_name}`}
                          onClick={() => {}}
                          readonly={true}
                          sx={{
                            backgroundColor: "#E5E7EB",
                            color: "#374151",
                            "&:hover": {
                              backgroundColor: "#E5E7EB",
                            },
                            cursor: "default",
                          }}
                        />
                        <Box sx={{ display: "flex", marginLeft: "auto" }}>
                          {user.user_roles.role_name === "Consultant" && (
                            <Button
                              onClick={() => {
                                setSelectedConsultantId(user.id)
                                setShowConsultantModal(true)
                              }}
                              sx={{ borderRadius: "50px", marginRight: 1 }}
                              color="primary"
                            >
                              <LinkIcon />
                            </Button>
                          )}
                          <Button onClick={() => handleRemoveUser(user.id)} sx={{ borderRadius: "50px" }} color="error">
                            <DeleteIcon />
                          </Button>
                        </Box>
                      </Grid>
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                        <TextField
                          source="first_name"
                          label="First Name"
                          value={user.first_name}
                          readonly="true"
                          onChange={(e) => {
                            const updatedUsers = projectUsers.map((u) =>
                              u.id === user.id ? { ...u, first_name: e.target.value } : u,
                            )
                            setProjectUsers(updatedUsers)
                          }}
                        />
                        <TextField
                          source="last_name"
                          label="Last Name"
                          value={user.last_name}
                          readonly="true"
                          onChange={(e) => {
                            const updatedUsers = projectUsers.map((u) =>
                              u.id === user.id ? { ...u, last_name: e.target.value } : u,
                            )
                            setProjectUsers(updatedUsers)
                          }}
                        />
                      </Box>
                      <TextField
                        source="email"
                        label="Email"
                        value={user.email}
                        readonly="true"
                        onChange={(e) => {
                          const updatedUsers = projectUsers.map((u) =>
                            u.id === user.id ? { ...u, email: e.target.value } : u,
                          )
                          setProjectUsers(updatedUsers)
                        }}
                      />
                      <TextField
                        source="contact_number"
                        label="Contact Number"
                        value={user.contact_number}
                        readonly="true"
                        onChange={(e) => {
                          const updatedUsers = projectUsers.map((u) =>
                            u.id === user.id ? { ...u, contact_number: e.target.value } : u,
                          )
                          setProjectUsers(updatedUsers)
                        }}
                      />
                      
                      {/* Updated MultiSelectDropDown component - pre-populated */}
                      <Grid item xs={12}>
                        <MultiSelectDropDown
                          label="Assign safety files"
                          value={user.disciplines || []}
                          onChange={(e) => handleDisciplineChange(e, user.id)}
                          options={allDisciplines}
                          multiple
                        />
                      </Grid>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          )}
        </Box>
        <EmbeddedComponentPopup
          open={showConsultantModal}
          onClose={() => setShowConsultantModal(false)}
          title="Select New Consultant"
          subtitle=""
        >
          <Box sx={{ width: "100%", mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <SearchBox placeholder="Search consultants" fullWidth onSearch={handleSearch} />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ height: "400px", overflow: "auto" }}>
                  <DataGridWrapper data={consultants}>
                    <DataGrid
                      fields={consultantFields}
                      data={consultants}
                      loading={loadingConsultants}
                      hidePagination
                      hideColumnNames={false}
                      rowClick={(id) => {
                        handleConsultantChange(id as string)
                        return false
                      }}
                      rowStyle={() => ({
                        cursor: "pointer",
                      })}
                    />
                  </DataGridWrapper>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </EmbeddedComponentPopup>
        <EmbeddedComponentPopup open={openPersonCreatePopup} onClose={handleClosePersonCreatePopup} title="">
          <UserCreate
            preselectedProjectId={project.id}
            onClose={handleClosePersonCreatePopup}
            onSaveSuccess={fetchProjectData} // Refreshes the project state after saving
          />
        </EmbeddedComponentPopup>
      </Box>
    </Box>
  )
}

export default ProjectEdit
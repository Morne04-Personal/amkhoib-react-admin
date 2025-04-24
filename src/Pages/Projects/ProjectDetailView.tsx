"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Grow,
  Link,
  Card,
  CardContent,
  styled,
  Checkbox,
  FormControlLabel,
  Button,
  Chip
} from "@mui/material"
import { useParams, useNavigate } from "react-router-dom"
import ListCard from "../../Components/ListCard"
import supabaseClient from "../../supabaseClient"
import { Breadcrumbs } from "../../Components/Breadcrumbs"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import EmailIcon from "@mui/icons-material/Email"
import CheckIcon from "@mui/icons-material/Check"
import PeopleIcon from "@mui/icons-material/People"
import { EmbeddedComponentPopup } from "../../Components/EmbeddedComponentPopup"
import ProjectEdit from "./ProjectEdit"
import { NullSearch } from "../../Components/NullSearch"
import UserCreate from "../Users 2.0/UserCreate"

interface ProjectUser {
  id: string
  first_name: string
  last_name: string
  email: string
  role_name: string
  company_name: string
  discipline: string | null
  contractor_name: string | null
  contractor_type: "main" | "contractor" | "subcontractor" | null
}

interface Project {
  id: string
  name: string
  project_owner: string
  planned_start_date: string
  planned_end_date: string
  location: string
  street: string
  suburb: string
  city: string
  province: string
  users?: ProjectUser[]
}

interface Discipline {
  id: string
  name: string
  isSelected?: boolean
  user?: {
    id: string
    name: string
    email: string
    role: string  // Add this line to store the user's role
  }
}

interface Contractor {
  id: string
  name: string
  type: "Principal contractor" | "Contractor" | "Sub-contractor" | "Consultant" | "Project manager" | "Construction manager" | "Safety officer"
  disciplines: Discipline[]
  user: ProjectUser
}

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  backgroundColor: "#f1f4fb",
  borderRadius: "8px",
  boxShadow: "none",
  display: "flex",
  flexDirection: "column",
}))

const ContractorCard = styled(Box)<{ selected?: boolean }>(({ theme, selected }) => ({
  backgroundColor: "#f8f9fd",
  borderRadius: "8px",
  marginBottom: theme.spacing(1),
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  overflow: "hidden",
  "&:hover": {
    backgroundColor: selected ? undefined : "#f5f5f5",
  },
}))

const ContractorHeader = styled(Box)<{ selected?: boolean; type?: string }>(({ theme, selected, type }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2),
  backgroundColor: selected ? "#ff4d0d" : "#f8f9fd",
  color: selected ? "#fff" : "rgba(0, 0, 0, 0.87)",
  borderTopLeftRadius: "8px",
  borderTopRightRadius: "8px",
}))

const DisciplineItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5, 1),
  borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
  "&:last-child": {
    borderBottom: "none",
  },
}))

const GridContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: theme.spacing(3),
  width: "100%",
  alignItems: "start",
  "& > *:first-of-type": {
    backgroundColor: "#f8f9fd",
    borderRadius: "8px",
    padding: theme.spacing(2),
    height: "fit-content",
  },
  "& > *:last-of-type": {
    backgroundColor: "transparent",
    borderRadius: "8px",
    padding: theme.spacing(2),
  },
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "rgba(0, 0, 0, 0.6)",
  letterSpacing: "0.1em",
  marginBottom: theme.spacing(2),
  textTransform: "uppercase",
}))

const ProjectDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null)
  const [allDisciplines, setAllDisciplines] = useState<Discipline[]>([])
  const [showSelected, setShowSelected] = useState(true)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [disciplineCount, setDisciplineCount] = useState<number>(0)
  const [openPersonCreatePopup, setOpenPersonCreatePopup] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }

    try {
      const [projectResponse, disciplinesResponse] = await Promise.all([
        supabaseClient.from("vw_project_details_view").select("*").eq("id", id).single(),
        supabaseClient.from("disciplines").select("id, name").order("name"),
      ])

      if (projectResponse.error) {
        console.error("Error fetching project:", projectResponse.error)
        setProject(null)
        setLoading(false)
        return
      }

      if (!projectResponse.data) {
        console.error("Project not found")
        setProject(null)
        setLoading(false)
        return
      }

      setProject(projectResponse.data)
      setAllDisciplines(disciplinesResponse.data)

      // Check if users exist in the project data
      if (!projectResponse.data.users || projectResponse.data.users.length === 0) {
        setContractors([])
        setLoading(false)
        return
      }

      // Group users by contractor and their disciplines
      const contractorsMap = new Map<string, Contractor>()
      const contractorRolePriority = {
        "Contractor": 1,
        "Principal contractor": 2,
        "Sub-contractor": 3,
        "Project manager": 4,
        "Construction manager": 5,
        "Safety officer": 6,
        "Consultant": 7
      }

      // First pass: Create contractor entries and collect all users by contractor
      const contractorUsers = new Map<string, ProjectUser[]>()

      projectResponse.data.users?.forEach((user) => {
        if (user.contractor_name) {
          // Collect users by contractor_name
          if (!contractorUsers.has(user.contractor_name)) {
            contractorUsers.set(user.contractor_name, [])
          }
          contractorUsers.get(user.contractor_name)?.push(user)
        }
      })

      // Second pass: Create contractor entries with the highest priority user
      contractorUsers.forEach((users, contractorName) => {
        // Sort users by role priority
        const sortedUsers = [...users].sort((a, b) => {
          const priorityA = contractorRolePriority[a.role_name as keyof typeof contractorRolePriority] || 999
          const priorityB = contractorRolePriority[b.role_name as keyof typeof contractorRolePriority] || 999
          return priorityA - priorityB
        })

        // Use the highest priority user (first after sorting) for the contractor entry
        const primaryUser = sortedUsers[0]
        
        if (primaryUser && (primaryUser.role_name === "Principal contractor" || primaryUser.role_name === "Contractor" || primaryUser.role_name === "Sub-contractor" || primaryUser.role_name === "Consultant" || primaryUser.role_name === "Project manager" || primaryUser.role_name === "Construction manager" || primaryUser.role_name === "Safety officer")) {
          contractorsMap.set(contractorName, {
            id: primaryUser.id,
            name: contractorName,
            type: primaryUser.role_name as "Principal contractor" | "Contractor" | "Sub-contractor" | "Consultant" | "Project manager" | "Construction manager" | "Safety officer",
            disciplines: [],
            user: primaryUser,
          })
        }
      })

      // Third pass: Add disciplines to contractors
      projectResponse.data.users?.forEach((user) => {
        if (user.contractor_name && user.discipline) {
          const contractor = contractorsMap.get(user.contractor_name)
          if (contractor) {
            contractor.disciplines.push({
              id: disciplinesResponse.data.find((d) => d.name === user.discipline)?.id || "",
              name: user.discipline,
              isSelected: true,
              user: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                role: user.role_name
              }
            })
          }
        }
      })

      setContractors(Array.from(contractorsMap.values()))
    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    fetchData()
  }

  const handleContractorClick = (contractorId: string) => {
    setSelectedContractor(selectedContractor === contractorId ? null : contractorId)
  }

  //Old implimentattion
  // const handleDisciplineClick = (disciplineId: string, disciplineName: string) => {
  //   navigate(`/projects/${id}/disciplines/${disciplineId}`, {
  //     state: { projectName: project?.name, disciplineName },
  //   })
  // }

  const handleDisciplineClick = (disciplineId: string, disciplineName: string) => {
    if (selectedContractor) {
      // Get the contractor data for the name
      const contractorData = contractors.find(c => c.id === selectedContractor);
      
      // Get the discipline data to access its associated user ID
      const disciplineData = getDisplayedDisciplines().find(d => d.id === disciplineId);
      const disciplineUserId = disciplineData?.user?.id || selectedContractor;
      
      // Navigate with the discipline's user ID instead of contractor ID
      navigate(`/projects/${id}/contractors/${disciplineUserId}/disciplines/${disciplineId}`, {
        state: { 
          projectName: project?.name, 
          disciplineName,
          contractorName: contractorData?.name || ''
        },
      });
    } else {
      // Show an error or notification that a contractor must be selected first
      console.error("Please select a contractor first");
    }
  }

  const getDisplayedDisciplines = useCallback(() => {
    if (!selectedContractor) return []

    const selectedContractorData = contractors.find((c) => c.id === selectedContractor)
    const contractorDisciplineNames = new Set(selectedContractorData?.disciplines.map((d) => d.name) || [])

    if (showSelected) {
      return selectedContractorData?.disciplines || []
    }

    return allDisciplines.map((discipline) => ({
      ...discipline,
      isSelected: contractorDisciplineNames.has(discipline.name),
    }))
  }, [selectedContractor, showSelected, contractors, allDisciplines])

  useEffect(() => {
    const disciplines = getDisplayedDisciplines()
    setDisciplineCount(disciplines.length)
  }, [getDisplayedDisciplines])

  const handleOpenPersonCreate = () => {
    setOpenPersonCreatePopup(true)
  }

  const handleClosePersonCreatePopup = () => {
    setOpenPersonCreatePopup(false)
    fetchData()
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!project) {
    return (
      <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Breadcrumbs
            items={[{ label: "Home", path: "/" }, { label: "Projects", path: "/projects" }, { label: "Not Found" }]}
          />
        </Box>
        <NullSearch
          icon={PeopleIcon}
          header="No people assigned to project"
          subHeader="Please add people to this project to continue."
        />
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenPersonCreate}
          >
            Add a user to the project
          </Button>
        </Box>
        <EmbeddedComponentPopup open={openPersonCreatePopup} onClose={handleClosePersonCreatePopup} title="Add User">
          <UserCreate
            preselectedProjectId={id}
            onClose={handleClosePersonCreatePopup}
            onSaveSuccess={fetchData}
          />
        </EmbeddedComponentPopup>
      </Container>
    )
  }

  const getFullAddress = () => {
    const parts = [project.street, project.suburb, project.city, project.province].filter(Boolean)
    return parts.join(", ")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleString("en-US", { month: "short" })
    const year = date.getFullYear()
    return `${day}, ${month} ${year}`
  }

  const sortUsers = (users: ProjectUser[]) => {
    const roleOrder = {
      Consultant: 1,
      "Principal contractor": 2,
      Contractor: 3,
      "Sub-contractor": 4,
    }

    return users.sort((a, b) => {
      const roleA = roleOrder[a.role_name as keyof typeof roleOrder] || 999
      const roleB = roleOrder[b.role_name as keyof typeof roleOrder] || 999
      return roleA - roleB
    })
  }

  const peopleSection = project.users
    ? sortUsers(project.users).map((user) => ({
        label:
          user.role_name === "Consultant" ? "Amkhoib" : user.discipline || user.contractor_name || user.company_name,
        subLabel: user.role_name,
        companyName: user.contractor_name || user.company_name,
        value: (
          <Link
            href={`mailto:${user.email}`}
            sx={{
              display: "flex",
              alignItems: "center",
              color: "primary.main",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
            {`${user.first_name} ${user.last_name}`}
          </Link>
        ),
      }))
    : []

  const projectSection = [
    {
      label: "Project owner",
      value: project.project_owner,
    },
    {
      label: "Planned start date",
      value: formatDate(project.planned_start_date),
    },
    {
      label: "Planned end date",
      value: formatDate(project.planned_end_date),
    },
    {
      label: "Location",
      value: (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LocationOnIcon sx={{ fontSize: 16 }} />
          <Typography>{getFullAddress()}</Typography>
        </Box>
      ),
    },
  ]

  const sections = [
    {
      title: "PEOPLE",
      items: peopleSection,
      showSeparators: true,
    },
    {
      title: "PROJECT",
      items: projectSection,
      showSeparators: false,
    },
  ]

// Add this function before your return statement
const getRoleStyles = (role: string) => {
  switch (role) {
    case 'Contractor':
      return { bg: '#ddebf7', text: '#228bc8' }; // green
    case 'Principal contractor':
      return { bg: '#ddebf6', text: '#206390' }; // blue
    case 'Sub-contractor':
      return { bg: '#e4e9ee', text: '#228bc8' }; // orange
    case 'Project manager':
      return { bg: '#2c8dbf', text: 'white' }; // purple
    case 'Construction manager':
      return { bg: '#071135', text: 'white' }; // pink
    case 'Safety officer':
      return { bg: '#ff4d0d', text: 'white' }; // red
    case 'Consultant':
      return { bg: '#0e568d', text: 'white' }; // blue grey
    default:
      return { bg: '#757575', text: 'white' }; // grey
  }
}

// Remove the useCallback and make it a regular function
const getContractorSectionTitle = () => {
  // Create a Set to track unique contractor types
  const contractorTypes = new Set<string>()
  
  // Add each contractor type to the Set
  contractors.forEach(contractor => {
    contractorTypes.add(contractor.type)
  })
  
  // Convert the Set to an Array and sort it
  const types = Array.from(contractorTypes).sort((a, b) => {
    // Custom sort order: Principal contractor first, then Contractor, then Sub-contractor
    const order = {
      "Principal contractor": 1,
      "Contractor": 2,
      "Sub-contractor": 3,
    }
    return order[a as keyof typeof order] - order[b as keyof typeof order]
  })
  
  // If no types, return default title
  if (types.length === 0) {
    return "CONTRACTORS"
  }
  
  // Join the types with " & " for the title
  return types.join(" & ").toUpperCase()
}

// Then in your render function, before the return statement:
const contractorSectionTitle = getContractorSectionTitle();

  return (
    <Grow in={true} timeout={500}>
      <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Breadcrumbs
            items={[{ label: "Home", path: "/" }, { label: "Projects", path: "/projects" }, { label: project?.name }]}
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "row", gap: 4, width: "100%" }}>
          <Box sx={{ width: "350px", flexShrink: 0 }}>
            <ListCard showLogo={false} title={project?.name || ""} sections={sections} onEdit={handleEdit} />
          </Box>
          <StyledCard sx={{ flex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", padding: 3 }}>
              {contractors.length > 0 ? (
                <GridContainer>
                <Box>
                <SectionTitle>{contractorSectionTitle}</SectionTitle>
                  {contractors.map((contractor) => (
                    <ContractorCard
                      key={contractor.id}
                      selected={selectedContractor === contractor.id}
                      onClick={() => handleContractorClick(contractor.id)}
                    >
                      <ContractorHeader selected={selectedContractor === contractor.id} type={contractor.type}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {contractor.name}
                        </Typography>
                        <Typography variant="body2">{contractor.type}</Typography>
                      </ContractorHeader>
                    </ContractorCard>
                  ))}
                </Box>
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <SectionTitle>SAFETY FILES ({disciplineCount})</SectionTitle>
                      {selectedContractor && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={showSelected}
                              onChange={(e) => {
                                setShowSelected(e.target.checked)
                              }}
                              size="small"
                            />
                          }
                          label={
                            <Typography
                              sx={{
                                fontSize: "0.75rem",
                                color: "rgba(0, 0, 0, 0.6)",
                                letterSpacing: "0.1em",
                                fontWeight: 500,
                              }}
                            >
                              SHOW ASSIGNED SAFETY FILES
                            </Typography>
                          }
                          labelPlacement="start"
                          sx={{
                            ml: 0,
                            mr: 0,
                            "& .MuiFormControlLabel-label": {
                              mr: 1,
                            },
                          }}
                        />
                      )}
                    </Box>
                    {selectedContractor && (
                      <Box>
                      {getDisplayedDisciplines().map((discipline, index) => (
                        <DisciplineItem
                          key={index}
                          onClick={() => handleDisciplineClick(discipline.id, discipline.name)}
                          sx={{ cursor: "pointer" }}
                        >
                          {discipline.isSelected ? (
                            <CheckIcon
                              sx={{
                                fontSize: 20,
                                color: "#4ba965",
                                opacity: 0.9,
                              }}
                            />
                          ) : (
                            <Box sx={{ width: 20 }} />
                          )}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                color: "rgba(0, 0, 0, 0.87)",
                              }}
                            >
                              {discipline.name}
                            </Typography>
                            
                            {discipline.user && (
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                color: "rgba(0, 0, 0, 0.6)",
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              {/* <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} /> */}
                              {discipline.user.name}
                              <Chip
                                label={discipline.user.role}
                                size="small"
                                sx={{
                                  height: '20px',
                                  fontSize: '0.7rem',
                                  backgroundColor: getRoleStyles(discipline.user.role).bg,
                                  color: getRoleStyles(discipline.user.role).text,
                                  fontWeight: 800,
                                  borderRadius: '8px',
                                  '& .MuiChip-label': {
                                    padding: '0 8px',
                                  }
                                }}
                              />
                            </Typography>
                          )}
                          </Box>
                        </DisciplineItem>
                      ))}
                      </Box>
                    )}
                  </Box>
                </GridContainer>
              ) : (
                <NullSearch
                  icon={PeopleIcon}
                  header="No Contractors found"
                  subHeader="There are no Contractors associated with this project. Please add Contractors to view contractor and safety file information."
                />
              )}
            </CardContent>
          </StyledCard>
        </Box>

        <EmbeddedComponentPopup open={isEditModalOpen} onClose={handleCloseEditModal} title="">
          <ProjectEdit onSaveSuccess={handleCloseEditModal} />
        </EmbeddedComponentPopup>
      </Container>
    </Grow>
  )
}

export default ProjectDetailView
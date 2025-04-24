// UserCreate.tsx

"use client"

import type React from "react"
import { Fragment, useEffect, useCallback } from "react"
import { useState } from "react"
import { Create, SimpleForm, type RaRecord } from "react-admin"
import { Box, Grid, Grow, Typography, CircularProgress, Button, Divider } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import { IconButton, Tooltip } from "@mui/material"
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"
import { PageNav } from "../../Components/PageNav"
import { useNavigate, useLocation } from "react-router-dom"
import { Stepper } from "../../Components/Stepper"
import { SearchBox } from "../../Components/SearchBox"
import { DataGrid, type DataGridField } from "../../Components/DataGrid"
import supabaseClient from "../../supabaseClient"
import { ListContextProvider, useListController } from "react-admin"
import { ButtonRadioSelect2 } from "../../Components/Buttons/ButtonRadioSelect2"
import { Form1 } from "./ConsultantForms/Form1"
import { Form1Link } from "./ConsultantForms/Form1_link"
import { Form2 } from "./Sub-ContractorForms/Form2"
import { Form2Link } from "./Sub-ContractorForms/Form2_link"
import { Form3 } from "./ContractorForms/Form3"
import { Form3Link } from "./ContractorForms/Form3_link"
import { Form4 } from "./ConstructionManagerForms/Form4"
import { Form5 } from "./SafetyOfficerForms/Form5"
import { Form6 } from "./ProjectManagerForms/Form6"
import { Form1Confirm } from "./ConsultantForms/Form1_confirm"
import { Form2Confirm } from "./Sub-ContractorForms/Form2_confirm"
import { Form3Confirm } from "./ContractorForms/Form3_confirm"
import { Form7 } from "./PrincipalContractorForms/Form7"
import { useToast } from "../../Components/Toast/ToastContext"
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import HierarchyModal from "./HierarchyModal"
import { Form4Link } from "./ConstructionManagerForms/Form4_link"
import { Form4Confirm } from "./ConstructionManagerForms/Form4_confirm"
import { Form5Link } from "./SafetyOfficerForms/Form5_link"
import { Form5Confirm } from "./SafetyOfficerForms/Form5_confirm"
import { Form6Link } from "./ProjectManagerForms/Form6_link"
import { Form6Confirm } from "./ProjectManagerForms/Form6_confirm"
import { Form7Link } from "./PrincipalContractorForms/Form7_link"
import { Form7Confirm } from "./PrincipalContractorForms/Form7_confirm"
import { StickyWrapper } from "../../Components/sticky-wrapper"

const steps = ["Are any of these your project?", "Who do you need on this project"]

interface Project extends RaRecord {
  id: string
  name: string
  location: string
}

interface UserCreateProps {
  preselectedProjectId?: string;
  onClose?: () => void; // Prop to handle closing the modal
  onSaveSuccess?: () => void; // Prop to handle actions after successful save
}

interface UserRole {
  id: string
  role_name: string
}

interface UserData {
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  disciplineIds: string[]
  assignedCompanyId?: string
  role: string
  id?: string
  emailError?: string
  contactNumberError?: string
}

interface Consultant extends RaRecord {
  id: string
  company_name: string
  first_name: string
  last_name: string
  email: string
  contact_number?: string
}

interface SubContractor extends RaRecord {
  id: string
  company_name: string
  first_name: string
  last_name: string
  email: string
  contact_number: string
  disciplineIds?: string[]
}

interface Contractor extends RaRecord {
  id: string
  company_name: string
  first_name: string
  last_name: string
  email: string
  contact_number?: string
  disciplineIds?: string[]
  assignedCompanyId?: string
}

interface ConstructionManager extends RaRecord {
  id: string
  first_name: string
  last_name: string
  email: string
  contact_number?: string
}

interface SafetyOfficer extends RaRecord {
  id: string
  first_name: string
  last_name: string
  email: string
  contact_number?: string
}

interface ProjectManager extends RaRecord {
  id: string
  first_name: string
  last_name: string
  email: string
  contact_number?: string
}

interface PrincipalContractor extends RaRecord {
  id: string
  first_name: string
  last_name: string
  email: string
  contact_number?: string
}

const projectFields: DataGridField[] = [
  { source: "name", label: "Project Name", type: "text" },
  { source: "city", label: "Location", type: "text" },
]

const CustomListWrapper = ({ children, data }: { children: React.ReactNode; data: any[] }) => {
  const listContext = useListController({
    resource: "projects",
    data,
    perPage: 10,
    sort: { field: "name", order: "ASC" },
  })

  return <ListContextProvider value={listContext}>{children}</ListContextProvider>
}

export const UserCreate: React.FC<UserCreateProps> = ({ preselectedProjectId, onClose, onSaveSuccess  }) => {
  const navigate = useNavigate()
  const location = useLocation();
  const projectIdFromState = location.state?.preselectedProjectId;
  const actualPreselectedProjectId = preselectedProjectId || projectIdFromState;
  const [activeStep, setActiveStep] = useState<number>(preselectedProjectId ? 1 : 0); // Directly set to Step 2 if there's a preselectedProjectId
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [disciplines, setDisciplines] = useState<{ value: string; label: string }[]>([])
  const [loadingDisciplines, setLoadingDisciplines] = useState(true)
  const [assignableCompanies, setAssignableCompanies] = useState<{ value: string; label: string; type: string }[]>([])
  const [showLinkView, setShowLinkView] = useState(true)
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null)
  const [showSubContractorLinkView, setShowSubContractorLinkView] = useState(true)
  const [selectedSubContractor, setSelectedSubContractor] = useState<SubContractor | null>(null)
  const [existingRoles, setExistingRoles] = useState<string[]>([])
  const [formValidity, setFormValidity] = useState<boolean[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const { showMessage } = useToast()
  const [showHierarchy, setShowHierarchy] = useState(false)
  const [hierarchyData, setHierarchyData] = useState<any>(null)
  const [mainContractorType, setMainContractorType] = useState<string>("")
  const [selectedSubContractorAssignedCompanyId, setSelectedSubContractorAssignedCompanyId] = useState<string>("")
  const [showContractorLinkView, setShowContractorLinkView] = useState(true)
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)
  const [showConstructionManagerLinkView, setShowConstructionManagerLinkView] = useState(true)
  const [selectedConstructionManager, setSelectedConstructionManager] = useState<ConstructionManager | null>(null)
  const [showSafetyOfficerLinkView, setShowSafetyOfficerLinkView] = useState(true)
  const [selectedSafetyOfficer, setSelectedSafetyOfficer] = useState<SafetyOfficer | null>(null)
  const [showProjectManagerLinkView, setShowProjectManagerLinkView] = useState(true)
  const [selectedProjectManager, setSelectedProjectManager] = useState<ProjectManager | null>(null)
  const [showPrincipalContractorLinkView, setShowPrincipalContractorLinkView] = useState(true)
  const [selectedPrincipalContractor, setSelectedPrincipalContractor] = useState<PrincipalContractor | null>(null)

  useEffect(() => {
    // This cleanup function runs when the component unmounts
    return () => {
      // Remove the item from local storage when navigating away
      localStorage.removeItem("UserCreateProjectIdAttachment")
      console.log("Project ID removed from local storage")
    }
  }, []) // Empty dependency array means this runs only on mount/unmount

  const renderStepTitle = (index: number) => {
    const stepTitle = steps[index];
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center" }}>
        <Typography sx={{ display: "inline-flex", alignItems: "center" }} variant="h5">{stepTitle}</Typography>
        {index === 1 && (
          <Tooltip title="View Project Structure">
            <IconButton onClick={() => setShowHierarchy(true)}>
              <QuestionMarkIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  useEffect(() => {
    if (actualPreselectedProjectId) {
      console.log("Preselected Project ID:", actualPreselectedProjectId);  // Log the project ID
      handleProjectSelect(actualPreselectedProjectId);
    }
  }, [actualPreselectedProjectId]);

  const handleProjectSelect = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId) || (await fetchProjectById(projectId));
    if (project) {
      setSelectedProject(project)
      // Add this line to save project ID to local storage
      localStorage.setItem("UserCreateProjectIdAttachment", projectId)
      console.log("Project ID saved to local storage:", projectId)

      // Fetch main contractor and its type
      const { data: mainContractor, error: mainError } = await supabaseClient
        .from("project_contractors")
        .select(`
          contractor_id,
          contractor:contractors!project_contractors_contractor_id_fkey(
            id,
            name,
            contractor_type:contractor_types(
              id,
              name
            )
          )
        `)
        .eq("project_id", projectId)
        .is("parent_contractor_id", null)
        .single()

      if (mainError) {
        console.error("Error fetching main contractor:", mainError)
        return
      }

      if (mainContractor && mainContractor.contractor) {
        console.log(`Project "${project.name}" selected.`)
        console.log(`Main Contractor ID: ${mainContractor.contractor_id}`)
        console.log(`Main Contractor Name: ${mainContractor.contractor.name}`)
        console.log(`Contractor Type: ${mainContractor.contractor.contractor_type.name}`)

        setMainContractorType(mainContractor.contractor.contractor_type.name)

        // Create hierarchy data structure
        const hierarchyStructure = {
          id: mainContractor.contractor.id,
          name: mainContractor.contractor.name,
          type: mainContractor.contractor.contractor_type.name,
          subContractors: [],
        }

        // Fetch associated contractors based on main contractor's type
        const { data: associatedContractors, error: associatedError } = await supabaseClient
          .from("project_contractors")
          .select(`
            contractor:contractors!project_contractors_contractor_id_fkey(
              id,
              name,
              contractor_type:contractor_types(
                id,
                name
              )
            )
          `)
          .eq("project_id", projectId)
          .eq("parent_contractor_id", mainContractor.contractor_id)

        if (!associatedError && associatedContractors) {
          for (const ac of associatedContractors) {
            if (ac.contractor) {
              const contractorNode = {
                id: ac.contractor.id,
                name: ac.contractor.name,
                type: ac.contractor.contractor_type.name,
                subContractors: [],
              }

              const { data: subContractors, error: subError } = await supabaseClient
                .from("project_contractors")
                .select(`
                  contractor:contractors!project_contractors_contractor_id_fkey(
                    id,
                    name,
                    contractor_type:contractor_types(
                      id,
                      name
                    )
                  )
                `)
                .eq("project_id", projectId)
                .eq("parent_contractor_id", ac.contractor.id)

              if (!subError && subContractors) {
                contractorNode.subContractors = subContractors.map((sc) => ({
                  id: sc.contractor.id,
                  name: sc.contractor.name,
                  type: sc.contractor.contractor_type.name,
                }))
              }

              hierarchyStructure.subContractors.push(contractorNode)
            }
          }
        }

        setHierarchyData(hierarchyStructure)
      } else {
        console.log(`Project "${project.name}" selected. No main contractor found for this project.`)
        setHierarchyData(null)
      }

      await fetchExistingRoles(project.id)
      setActiveStep(1) // Move directly to the next step
    }
  }

  const fetchProjectById = async (projectId: string): Promise<Project | null> => {
    try {
      const { data, error } = await supabaseClient
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single()

      if (error) {
        console.error("Error fetching project by ID:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error:", error)
      return null
    }
  }

  useEffect(() => {
    if (preselectedProjectId) {
      // Log and handle the project selection immediately if preselectedProjectId is present
      console.log("Preselected Project ID:", preselectedProjectId);
      handleProjectSelect(preselectedProjectId);
    }
  }, [preselectedProjectId]);
    
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true)
      try {
        let query = supabaseClient.from("projects").select(`
            id,
            name,
            location,
            city
          `)

        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching projects:", error)
          return
        }

        setProjects(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [searchQuery])

  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const { data, error } = await supabaseClient.from("user_roles").select("id, role_name")

        if (error) {
          console.error("Error fetching user roles:", error)
          return
        }

        setUserRoles(data)
      } catch (error) {
        console.error("Error:", error)
      }
    }

    fetchUserRoles()
  }, [])

  useEffect(() => {
    const fetchDisciplines = async () => {
      setLoadingDisciplines(true)
      try {
        const { data, error } = await supabaseClient.from("disciplines").select("id, name")
        if (error) {
          console.error("Error fetching disciplines:", error)
          return
        }
        setDisciplines(data.map((d) => ({ value: d.id, label: d.name })))
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoadingDisciplines(false)
      }
    }

    fetchDisciplines()
  }, [])

  useEffect(() => {
    const fetchAssignableCompanies = async () => {
      if (selectedProject) {
        try {
          // Find the main contractor
          const { data: mainContractor, error: mainContractorError } = await supabaseClient
            .from("project_contractors")
            .select(`
              contractor_id,
              contractor:contractors!project_contractors_contractor_id_fkey(
                id,
                name,
                contractor_type:contractor_types(
                  id,
                  name
                )
              )
            `)
            .eq("project_id", selectedProject.id)
            .is("parent_contractor_id", null)
            .single()
  
          if (mainContractorError) throw mainContractorError
  
          let assignableCompaniesToSet = []
  
          if (mainContractor.contractor.contractor_type.name === "Sub-Contractor") {
            setAssignableCompanies([])
          } else if (mainContractor.contractor.contractor_type.name === "Contractor") {
            // For main contractor type "Contractor", fetch sub-contractors
            const { data: subContractors, error: subContractorError } = await supabaseClient
              .from("project_contractors")
              .select(`
                contractor:contractors!project_contractors_contractor_id_fkey(
                  id,
                  name
                )
              `)
              .eq("project_id", selectedProject.id)
              .eq("parent_contractor_id", mainContractor.contractor_id)
  
            if (subContractorError) throw subContractorError
  
            setAssignableCompanies(
              subContractors.map((sc) => ({
                value: sc.contractor.id,
                label: sc.contractor.name,
                type: "subcontractor",
              })),
            )
          } else {
            // For main contractor type "Principal contractor", keep existing logic
            // For Contractor, find companies where main contractor is the parent
            const { data: contractorCompanies, error: contractorError } = await supabaseClient
              .from("project_contractors")
              .select("id, contractor_id")
              .eq("project_id", selectedProject.id) // Added project_id filter here
              .eq("parent_contractor_id", mainContractor.contractor_id)
  
            if (contractorError) throw contractorError
  
            // Fetch company names for contractors
            const contractorIds = contractorCompanies.map((c) => c.contractor_id)
            const { data: contractorNames, error: contractorNamesError } = await supabaseClient
              .from("contractors")
              .select("id, name")
              .in("id", contractorIds)
  
            if (contractorNamesError) throw contractorNamesError
  
            // For Sub-contractor, find companies where main contractor's children are the parent
            const { data: subContractorCompanies, error: subContractorError } = await supabaseClient
              .from("project_contractors")
              .select("id, contractor_id")
              .eq("project_id", selectedProject.id) // Added project_id filter here
              .in("parent_contractor_id", contractorIds)
  
            if (subContractorError) throw subContractorError
  
            // Fetch company names for sub-contractors
            const subContractorIds = subContractorCompanies.map((c) => c.contractor_id)
            const { data: subContractorNames, error: subContractorNamesError } = await supabaseClient
              .from("contractors")
              .select("id, name")
              .in("id", subContractorIds)
  
            if (subContractorNamesError) throw subContractorNamesError
  
            // Combine and set assignable companies
            assignableCompaniesToSet = [
              ...contractorNames.map((c) => ({ value: c.id, label: c.name, type: "contractor" })),
              ...subContractorNames.map((c) => ({ value: c.id, label: c.name, type: "subcontractor" })),
            ]
  
            console.log("UserCreate - mainContractorType:", mainContractor.contractor.contractor_type.name)
            console.log("UserCreate - assignableCompanies to be set:", assignableCompaniesToSet)
  
            setAssignableCompanies(assignableCompaniesToSet)
          }
        } catch (error) {
          console.error("Error fetching assignable companies:", error)
        }
      }
    }
  
    fetchAssignableCompanies()
  }, [selectedProject])

  const createDefaultUser = (role: string): UserData => ({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    disciplineIds: [],
    role: role,
    emailError: undefined,
    contactNumberError: undefined,
  })

  const getFirstAvailableRole = (currentRoles: string[] = existingRoles): string | undefined => {
    const allRoles = [
      "Consultant",
      "Project manager",
      "Construction manager",
      "Safety officer",
      "Contractor",
      "Sub-contractor",
      "Principal contractor",
    ]

    return allRoles.find((role) => isRoleAvailable(role, currentRoles))
  }

  const updateUser = (index: number, field: keyof UserData, value: string | string[] | undefined) => {
    setUsers((prevUsers) => {
      const updatedUsers = [...prevUsers]
      updatedUsers[index] = { ...updatedUsers[index], [field]: value }
      // console.log("Updated user:", updatedUsers[index])
      return updatedUsers
    })

    // Update form validity
    setFormValidity((prevValidity) => {
      const newValidity = [...prevValidity]
      newValidity[index] = isFormValid(users[index], field, value)
      return newValidity
    })

    // Log current forms after update
    logCurrentForms()
  }

  const removeUserForm = (index: number) => {
    setUsers((prevUsers) => prevUsers.filter((_, i) => i !== index))
    setFormValidity((prevValidity) => prevValidity.filter((_, i) => i !== index))
  }

  const handleBack = () => {
    if (activeStep === 0) {
      navigate(-1)
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const addUserForm = () => {
    const availableRole = getFirstAvailableRole()
    if (availableRole) {
      setUsers((prevUsers) => {
        const newUsers = [...prevUsers, createDefaultUser(availableRole)]
        console.log("Added new user form")
        logCurrentForms()
        return newUsers
      })
      setFormValidity((prevValidity) => [...prevValidity, false]) // Set new form validity to false
    } else {
      console.log("No available roles to add")
      // Optionally, you can show a message to the user that no more roles can be added
    }
  }

  const getProjectContractorId = async (user: UserData): Promise<string> => {
    if (user.role === "Contractor" || user.role === "Sub-contractor") {
      if (!user.assignedCompanyId) {
        throw new Error(`No company assigned for user ${user.firstName} ${user.lastName}`)
      }

      const { data: assignedProjectContractor, error: assignedError } = await supabaseClient
        .from("project_contractors")
        .select("id")
        .eq("project_id", selectedProject!.id)
        .eq("contractor_id", user.assignedCompanyId)
        .single()

      if (assignedError) {
        throw assignedError
      }

      return assignedProjectContractor.id
    } else {
      const { data: mainProjectContractor, error: mainContractorError } = await supabaseClient
        .from("project_contractors")
        .select("id")
        .eq("project_id", selectedProject!.id)
        .is("parent_contractor_id", null)
        .single()

      if (mainContractorError) {
        throw mainContractorError
      }

      return mainProjectContractor.id
    }
  }

  const insertDisciplines = async (userId: string, user: UserData) => {
    const disciplinesToInsert = user.role === "Sub-contractor" ? [user.disciplineIds[0]] : user.disciplineIds

    const { error: disciplinesError } = await supabaseClient.from("user_disciplines").insert(
      disciplinesToInsert.map((disciplineId) => ({
        user_id: userId,
        discipline_id: disciplineId,
        project_id: selectedProject?.id,
      })),
    )

    if (disciplinesError) {
      throw disciplinesError
    }
  }

  const linkUserToProject = async (projectContractorId: string, userId: string) => {
    const { error: linkError } = await supabaseClient.from("user_project_contractors").insert({
      project_contractor_id: projectContractorId,
      user_id: userId,
      is_active: true,
    })

    if (linkError) {
      throw linkError
    }
  }

  const saveUser = async (user: UserData) => {
    const selectedUserRole = userRoles.find((role) => role.role_name === user.role)
    if (!selectedUserRole) {
      throw new Error(`Selected role not found for user ${user.firstName} ${user.lastName}`)
    }

    // Insert the new user
    const { data: data, error: dataError } = await supabaseClient
    .auth
    .signUp({
      email: user.email,
      password: 'example-password',
      options:{
        data: {
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          contact_number: user.contactNumber,
          role: selectedUserRole.id,
        }
      }
    });

   let { data: newUser, error: userError } = await supabaseClient
    .from("users")
    .select("*")
    .eq("email", user.email);

    if (newUser && newUser.length > 0) {
      newUser = newUser[0];
    } else {
      throw new Error("User creation failed");
    }
    console.log('newUser', newUser);


    if (userError) {
      throw userError
    }

    if (
      (user.role === "Contractor" && mainContractorType === "Contractor") ||
      (user.role === "Sub-contractor" && mainContractorType === "Sub-Contractor")
    ) {
      // Automatically link to the main contractor
      const { data: mainContractor, error: mainContractorError } = await supabaseClient
        .from("project_contractors")
        .select("id")
        .eq("project_id", selectedProject!.id)
        .is("parent_contractor_id", null)
        .single()

      if (mainContractorError) {
        throw mainContractorError
      }

      await linkUserToProject(mainContractor.id, newUser.id)
    } else {
      // Use existing logic for other cases
      const projectContractorId = await getProjectContractorId(user)
      await linkUserToProject(projectContractorId, newUser.id)
    }

    // Insert disciplines for Sub-contractor and Contractor and Principal contractors
    if (user.role === "Sub-contractor" || user.role === "Contractor" || user.role === "Principal contractor" || user.role === "Project manager" || user.role === "Project manager" || user.role === "Consultant" || user.role === "Construction manager" || user.role === "Safety officer") {
      await insertDisciplines(newUser.id, user)
    }

    console.log("User created and linked successfully:", newUser)
  }

  const handleConfirmContractorLink = async () => {
    try {
      if (!selectedProject || !selectedContractor) {
        throw new Error("No project or contractor selected")
      }
  
      let projectContractorId: string
  
      if (mainContractorType === "Contractor") {
        const { data: mainContractor, error: mainContractorError } = await supabaseClient
          .from("project_contractors")
          .select("id")
          .eq("project_id", selectedProject.id)
          .is("parent_contractor_id", null)
          .single()
  
        if (mainContractorError) {
          throw mainContractorError
        }
  
        projectContractorId = mainContractor.id
      } else {
        if (!selectedContractor.assignedCompanyId) {
          throw new Error("No company assigned for the contractor")
        }
  
        const { data: assignedProjectContractor, error: assignedError } = await supabaseClient
          .from("project_contractors")
          .select("id")
          .eq("project_id", selectedProject.id)
          .eq("contractor_id", selectedContractor.assignedCompanyId)
          .single()
  
        if (assignedError) {
          throw assignedError
        }
  
        projectContractorId = assignedProjectContractor.id
      }
  
      const { error: linkError } = await supabaseClient.from("user_project_contractors").insert({
        project_contractor_id: projectContractorId,
        user_id: selectedContractor.id,
        is_active: true,
      })
  
      if (linkError) {
        throw linkError
      }
  
      if (selectedContractor.assignedCompanyId && mainContractorType !== "Contractor") {
        const { error: updateError } = await supabaseClient
          .from("users")
          .update({ assigned_contractor_id: selectedContractor.assignedCompanyId })
          .eq("id", selectedContractor.id)
  
        if (updateError) {
          throw updateError
        }
      }
  
      console.log("Contractor linked successfully:", selectedContractor)
      showMessage("Contractor linked successfully", "success")
    } catch (error) {
      console.error("Error linking contractor:", error)
      showMessage("Error linking contractor", "error")
    }
  }

  const handleConfirmLink = async () => {
    try {
      if (!selectedProject || !selectedConsultant) {
        throw new Error("No project or consultant selected")
      }

      const { data: mainProjectContractor, error: mainContractorError } = await supabaseClient
        .from("project_contractors")
        .select("id")
        .eq("project_id", selectedProject.id)
        .is("parent_contractor_id", null)
        .single()

      if (mainContractorError) {
        throw mainContractorError
      }

      const { error: linkError } = await supabaseClient.from("user_project_contractors").insert({
        project_contractor_id: mainProjectContractor.id,
        user_id: selectedConsultant.id,
        is_active: true,
      })

      if (linkError) {
        throw linkError
      }

      console.log("Consultant linked successfully:", selectedConsultant)

      // Optionally, you can show a success message here
    } catch (error) {
      console.error("Error linking consultant:", error)
      // Optionally, you can show an error message here
    }
  }

  const handleConfirmSubContractorLink = async () => {
    try {
      if (!selectedProject || !selectedSubContractor) {
        throw new Error("No project or sub-contractor selected")
      }

      let projectContractorId: string

      if (mainContractorType === "Sub-Contractor") {
        const { data: mainContractor, error: mainContractorError } = await supabaseClient
          .from("project_contractors")
          .select("id")
          .eq("project_id", selectedProject.id)
          .is("parent_contractor_id", null)
          .single()

        if (mainContractorError) {
          throw mainContractorError
        }

        projectContractorId = mainContractor.id
      } else {
        if (!selectedSubContractorAssignedCompanyId) {
          throw new Error("No company assigned for the sub-contractor")
        }

        const { data: assignedProjectContractor, error: assignedError } = await supabaseClient
          .from("project_contractors")
          .select("id")
          .eq("project_id", selectedProject.id)
          .eq("contractor_id", selectedSubContractorAssignedCompanyId)
          .single()

        if (assignedError) {
          throw assignedError
        }

        projectContractorId = assignedProjectContractor.id
      }

      const { error: linkError } = await supabaseClient.from("user_project_contractors").insert({
        project_contractor_id: projectContractorId,
        user_id: selectedSubContractor.id,
        is_active: true,
      })

      if (linkError) {
        throw linkError
      }

      if (selectedSubContractorAssignedCompanyId && mainContractorType !== "Sub-Contractor") {
        const { error: updateError } = await supabaseClient
          .from("users")
          .update({ assigned_contractor_id: selectedSubContractorAssignedCompanyId })
          .eq("id", selectedSubContractor.id)

        if (updateError) {
          throw updateError
        }
      }

      console.log("Sub-contractor linked successfully:", selectedSubContractor)
      showMessage("Sub-contractor linked successfully", "success")
    } catch (error) {
      console.error("Error linking sub-contractor:", error)
      showMessage("Error linking sub-contractor", "error")
    }
  }

  const handleLinkConstructionManager = async (constructionManager: ConstructionManager) => {
    setSelectedConstructionManager(constructionManager)
    setShowConstructionManagerLinkView(false)
  }

  const handleSwitchToConstructionManagerLink = () => {
    setShowConstructionManagerLinkView(true)
    setSelectedConstructionManager(null)
  }

  const handleConfirmConstructionManagerLink = async () => {
    try {
      if (!selectedProject || !selectedConstructionManager) {
        throw new Error("No project or construction manager selected")
      }

      const { data: mainProjectContractor, error: mainContractorError } = await supabaseClient
        .from("project_contractors")
        .select("id")
        .eq("project_id", selectedProject.id)
        .is("parent_contractor_id", null)
        .single()

      if (mainContractorError) {
        throw mainContractorError
      }

      const { error: linkError } = await supabaseClient.from("user_project_contractors").insert({
        project_contractor_id: mainProjectContractor.id,
        user_id: selectedConstructionManager.id,
        is_active: true,
      })

      if (linkError) {
        throw linkError
      }

      console.log("Construction Manager linked successfully:", selectedConstructionManager)
      showMessage("Construction Manager linked successfully", "success")
    } catch (error) {
      console.error("Error linking construction manager:", error)
      showMessage("Error linking construction manager", "error")
    }
  }

  const handleLinkSafetyOfficer = async (SafetyOfficer: SafetyOfficer) => {
    setSelectedSafetyOfficer(SafetyOfficer)
    setShowSafetyOfficerLinkView(false)
  }

  const handleSwitchToSafetyOfficerLink = () => {
    setShowSafetyOfficerLinkView(true)
    setSelectedSafetyOfficer(null)
  }

  const handleConfirmSafetyOfficerLink = async () => {
    try {
      if (!selectedProject || !selectedSafetyOfficer) {
        throw new Error("No project or Safety Officer selected")
      }

      const { data: mainProjectContractor, error: mainContractorError } = await supabaseClient
        .from("project_contractors")
        .select("id")
        .eq("project_id", selectedProject.id)
        .is("parent_contractor_id", null)
        .single()

      if (mainContractorError) {
        throw mainContractorError
      }

      const { error: linkError } = await supabaseClient.from("user_project_contractors").insert({
        project_contractor_id: mainProjectContractor.id,
        user_id: selectedSafetyOfficer.id,
        is_active: true,
      })

      if (linkError) {
        throw linkError
      }

      console.log("Safety Officer linked successfully:", selectedConstructionManager)
      showMessage("Safety Officer linked successfully", "success")
    } catch (error) {
      console.error("Error linking construction manager:", error)
      showMessage("Error linking construction manager", "error")
    }
  }

  const handleLinkProjectManager = async (ProjectManager: ProjectManager) => {
    setSelectedProjectManager(ProjectManager)
    setShowProjectManagerLinkView(false)
  }

  const handleSwitchToProjectManagerLink = () => {
    setShowProjectManagerLinkView(true)
    setSelectedProjectManager(null)
  }

  const handleConfirmProjectManagerLink = async () => {
    try {
      if (!selectedProject || !selectedProjectManager) {
        throw new Error("No project or Project Manager selected")
      }

      const { data: mainProjectContractor, error: mainContractorError } = await supabaseClient
        .from("project_contractors")
        .select("id")
        .eq("project_id", selectedProject.id)
        .is("parent_contractor_id", null)
        .single()

      if (mainContractorError) {
        throw mainContractorError
      }

      const { error: linkError } = await supabaseClient.from("user_project_contractors").insert({
        project_contractor_id: mainProjectContractor.id,
        user_id: selectedProjectManager.id,
        is_active: true,
      })

      if (linkError) {
        throw linkError
      }

      console.log("Project Manager linked successfully:", selectedProjectManager)
      showMessage("Project Manager linked successfully", "success")
    } catch (error) {
      console.error("Error linking Project Manager:", error)
      showMessage("Error linking Project Manager", "error")
    }
  }

  const handleLinkPrincipalContractor = async (PrincipalContractor: PrincipalContractor) => {
    setSelectedPrincipalContractor(PrincipalContractor)
    setShowPrincipalContractorLinkView(false)
  }

  const handleSwitchToPrincipalContractorLink = () => {
    setShowPrincipalContractorLinkView(true)
    setSelectedPrincipalContractor(null)
  }

  const handleConfirmPrincipalContractorLink = async () => {
    try {
      if (!selectedProject || !selectedPrincipalContractor) {
        throw new Error("No project or Principal Contractor selected")
      }

      const { data: mainProjectContractor, error: mainContractorError } = await supabaseClient
        .from("project_contractors")
        .select("id")
        .eq("project_id", selectedProject.id)
        .is("parent_contractor_id", null)
        .single()

      if (mainContractorError) {
        throw mainContractorError
      }

      const { error: linkError } = await supabaseClient.from("user_project_contractors").insert({
        project_contractor_id: mainProjectContractor.id,
        user_id: selectedPrincipalContractor.id,
        is_active: true,
      })

      if (linkError) {
        throw linkError
      }

      console.log("Principal Contractor linked successfully:", selectedPrincipalContractor)
      showMessage("Principal Contractor linked successfully", "success")
    } catch (error) {
      console.error("Error linking Principal Contractor:", error)
      showMessage("Error linking Principal Contractor", "error")
    }
  }

  const handleOnSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (!selectedProject) {
        throw new Error("No project selected");
      }
  
      const formsToSubmit = users.filter((user) => {
        if (user.role === "Consultant") {
          return !showLinkView && !selectedConsultant && isFormValid(user);
        }
        if (user.role === "Sub-contractor") {
          return !showSubContractorLinkView && !selectedSubContractor && isFormValid(user);
        }
        if (user.role === "Contractor") {
          return !showContractorLinkView && !selectedContractor && isFormValid(user);
        }
        if (user.role === "Construction manager") {
          return !showConstructionManagerLinkView && !selectedConstructionManager && isFormValid(user);
        }
        if (user.role === "Safety officer") {
          return !showSafetyOfficerLinkView && !selectedSafetyOfficer && isFormValid(user);
        }
        if (user.role === "Project Manager") {
          return !showProjectManagerLinkView && !selectedProjectManager && isFormValid(user);
        }
        if (user.role === "Principal contractor") {
          return !showPrincipalContractorLinkView && !selectedPrincipalContractor && isFormValid(user);
        }
        return isFormValid(user);
      });
  
      for (const user of formsToSubmit) {
        await saveUser(user);
      }
  
      if (selectedConsultant) {
        await handleConfirmLink();
      }
  
      if (selectedSubContractor) {
        await handleConfirmSubContractorLink();
      }
  
      if (selectedContractor) {
        await handleConfirmContractorLink();
      }
  
      if (selectedConstructionManager) {
        await handleConfirmConstructionManagerLink();
      }
  
      if (selectedSafetyOfficer) {
        await handleConfirmSafetyOfficerLink();
      }
  
      if (selectedProjectManager) {
        await handleConfirmProjectManagerLink();
      }
  
      if (selectedPrincipalContractor) {
        await handleConfirmPrincipalContractorLink();
      }
  
      showMessage("User(s) added successfully", "success");
  
      // Conditionally handle navigation or modal close
      if (onSaveSuccess) {
        onSaveSuccess(); // Call the success handler if provided
      }
  
      if (onClose) {
        onClose(); // Call the close handler if provided to close the modal
      } else {
        // Default behavior
        setTimeout(() => {
          navigate("/users");
          window.location.reload();
        }, 0);
      }
    } catch (error) {
      console.error("Error saving users:", error);
      showMessage("Error adding user(s)", "error");
    } finally {
      setIsSaving(false);
    }
  }, [
    users,
    showLinkView,
    selectedConsultant,
    showSubContractorLinkView,
    selectedSubContractor,
    showContractorLinkView,
    selectedContractor,
    navigate,
    showMessage,
    saveUser,
    handleConfirmLink,
    handleConfirmSubContractorLink,
    handleConfirmContractorLink,
    selectedProject,
    showConstructionManagerLinkView,
    selectedConstructionManager,
    handleConfirmConstructionManagerLink,
    showSafetyOfficerLinkView,
    selectedSafetyOfficer,
    handleConfirmSafetyOfficerLink,
    showProjectManagerLinkView,
    selectedProjectManager,
    handleConfirmProjectManagerLink,
    showPrincipalContractorLinkView,
    selectedPrincipalContractor,
    handleConfirmPrincipalContractorLink,
    onSaveSuccess,
    onClose
  ]);

  const handleLinkConsultant = async (consultant: Consultant) => {
    setSelectedConsultant(consultant)
    setShowLinkView(false)
  }

  const handleLinkSubContractor = async (subContractor: SubContractor) => {
    setSelectedSubContractor(subContractor)
    setShowSubContractorLinkView(false)
  }

  const handleSwitchToLink = () => {
    setShowLinkView(true)
    setSelectedConsultant(null)
  }

  const handleSwitchToSubContractorLink = () => {
    setShowSubContractorLinkView(true)
    setSelectedSubContractor(null)
    setSelectedSubContractorAssignedCompanyId("")
  }

  const handleLinkContractor = async (contractor: Contractor) => {
    setSelectedContractor(contractor)
    setShowContractorLinkView(false)
  }

  const handleSwitchToContractorLink = () => {
    setShowContractorLinkView(true)
    setSelectedContractor(null)
  }

  const renderForm = (user: UserData, index: number) => {
    if (loadingDisciplines) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
          <CircularProgress />
        </Box>
      )
    }

    const formProps = {
      user,
      updateUser: (field: string, value: string | string[]) => updateUser(index, field, value),
      disciplines,
      assignableCompanies:
        user.role === "Contractor"
          ? assignableCompanies.filter((c) => c.type === "contractor")
          : assignableCompanies.filter((c) => c.type === "subcontractor"),
      onSwitchToLink: handleSwitchToLink,
      mainContractorType,
    }

    switch (user.role) {
      case "Consultant":
        if (showLinkView) {
          return <Form1Link onSelectConsultant={handleLinkConsultant} onCreateNew={() => setShowLinkView(false)} />
        } else if (selectedConsultant) {
          return (
            <Form1Confirm
              user={{
                id: selectedConsultant.id,
                firstName: selectedConsultant.first_name,
                lastName: selectedConsultant.last_name,
                email: selectedConsultant.email,
                contactNumber: selectedConsultant.contact_number || "",
              }}
              onCancel={() => {
                setSelectedConsultant(null)
                setShowLinkView(true)
              }}
              onLink={handleConfirmLink}
            />
          )
        } else {
          return (
            <Form1
              {...formProps}
              onSwitchToLink={() => {
                setShowLinkView(true)
                setSelectedConsultant(null)
              }}
              allowMultipleDisciplines={true}
            />
          )
        }
      case "Sub-contractor":
        if (showSubContractorLinkView) {
          return (
            <Form2Link
              onSelectSubContractor={handleLinkSubContractor}
              onCreateNew={() => setShowSubContractorLinkView(false)}
              projectId={selectedProject?.id || ""}
            />
          )
        } else if (selectedSubContractor) {
          return (
            <Form2Confirm
              subContractor={selectedSubContractor}
              onCancel={() => {
                setSelectedSubContractor(null)
                setShowSubContractorLinkView(true)
                setSelectedSubContractorAssignedCompanyId("")
              }}
              onLink={handleConfirmSubContractorLink}
              mainContractorType={mainContractorType}
              assignableCompanies={assignableCompanies.filter((c) => c.type === "subcontractor")}
              updateAssignedCompany={(companyId) => setSelectedSubContractorAssignedCompanyId(companyId)}
              assignedCompanyId={selectedSubContractorAssignedCompanyId}
            />
          )
        } else {
          return (
            <Form2
              {...formProps}
              onSwitchToLink={() => {
                setShowSubContractorLinkView(true)
                setSelectedSubContractor(null)
              }}
            />
          )
        }
      case "Contractor":
        if (showContractorLinkView) {
          return (
            <Form3Link
              onSelectContractor={handleLinkContractor}
              onCreateNew={() => setShowContractorLinkView(false)}
              projectId={selectedProject?.id || ""}
            />
          )
        } else if (selectedContractor) {
          return (
            <Form3Confirm
              contractor={selectedContractor}
              onCancel={() => {
                setSelectedContractor(null)
                setShowContractorLinkView(true)
              }}
              onLink={handleConfirmContractorLink}
              mainContractorType={mainContractorType}
              assignableCompanies={assignableCompanies.filter((c) => c.type === "contractor")}
              updateAssignedCompany={(companyId) =>
                setSelectedContractor({ ...selectedContractor, assignedCompanyId: companyId })
              }
              assignedCompanyId={selectedContractor.assignedCompanyId || ""}
            />
          )
        } else {
          return (
            <Form3
              {...formProps}
              onSwitchToLink={() => {
                setShowContractorLinkView(true)
                setSelectedContractor(null)
              }}
              allowMultipleDisciplines={true}
            />
          )
        }
      case "Construction manager":
        if (showConstructionManagerLinkView) {
          return (
            <Form4Link
              onSelectConstructionManager={handleLinkConstructionManager}
              onCreateNew={() => setShowConstructionManagerLinkView(false)}
            />
          )
        } else if (selectedConstructionManager) {
          return (
            <Form4Confirm
              user={{
                id: selectedConstructionManager.id,
                firstName: selectedConstructionManager.first_name,
                lastName: selectedConstructionManager.last_name,
                email: selectedConstructionManager.email,
                contactNumber: selectedConstructionManager.contact_number || "",
              }}
              onCancel={() => {
                setSelectedConstructionManager(null)
                setShowConstructionManagerLinkView(true)
              }}
              onLink={handleConfirmConstructionManagerLink}
            />
          )
        } else {
          return (
            <Form4
              {...formProps}
              onSwitchToLink={() => {
                setShowConstructionManagerLinkView(true)
                setSelectedConstructionManager(null)
              }}
              allowMultipleDisciplines={true}
            />
          )
        }
      case "Safety officer":
        if (showSafetyOfficerLinkView) {
          return (
            <Form5Link
              onSelectSafetyOfficer={handleLinkSafetyOfficer}
              onCreateNew={() => setShowSafetyOfficerLinkView(false)}
            />
          )
        } else if (selectedSafetyOfficer) {
          return (
            <Form5Confirm
              user={{
                id: selectedSafetyOfficer.id,
                firstName: selectedSafetyOfficer.first_name,
                lastName: selectedSafetyOfficer.last_name,
                email: selectedSafetyOfficer.email,
                contactNumber: selectedSafetyOfficer.contact_number || "",
              }}
              onCancel={() => {
                setSelectedSafetyOfficer(null)
                setShowSafetyOfficerLinkView(true)
              }}
              onLink={handleConfirmSafetyOfficerLink}
            />
          )
        } else {
          return (
            <Form5
              {...formProps}
              onSwitchToLink={() => {
                setShowSafetyOfficerLinkView(true)
                setSelectedSafetyOfficer(null)
              }}
              allowMultipleDisciplines={true}
            />
          )
        }
      case "Project manager":
        if (showProjectManagerLinkView) {
          return (
            <Form6Link
              onSelectProjectManager={handleLinkProjectManager}
              onCreateNew={() => setShowProjectManagerLinkView(false)}
            />
          )
        } else if (selectedProjectManager) {
          return (
            <Form6Confirm
              user={{
                id: selectedProjectManager.id,
                firstName: selectedProjectManager.first_name,
                lastName: selectedProjectManager.last_name,
                email: selectedProjectManager.email,
                contactNumber: selectedProjectManager.contact_number || "",
              }}
              onCancel={() => {
                setSelectedProjectManager(null)
                setShowProjectManagerLinkView(true)
              }}
              onLink={handleConfirmProjectManagerLink}
            />
          )
        } else {
          return (
            <Form6
              {...formProps}
              onSwitchToLink={() => {
                setShowProjectManagerLinkView(true)
                setSelectedProjectManager(null)
              }}
              allowMultipleDisciplines={true}
            />
          )
        }
        case "Principal contractor":
          if (showPrincipalContractorLinkView) {
            return (
              <Form7Link onSelectPrincipalContractor={handleLinkPrincipalContractor}
                onCreateNew={() => setShowPrincipalContractorLinkView(false)}
              />
            );
          } else if (selectedPrincipalContractor) {
            return (
              <Form7Confirm
                user={{
                  id: selectedPrincipalContractor.id,
                  firstName: selectedPrincipalContractor.first_name,
                  lastName: selectedPrincipalContractor.last_name,
                  email: selectedPrincipalContractor.email,
                  contactNumber: selectedPrincipalContractor.contact_number || "",
                  disciplines: (selectedPrincipalContractor.disciplineIds || []).map((id) => {
                    const discipline = disciplines.find((d) => d.value === id);
                    return { id: discipline?.value || '', name: discipline?.label || '' };
                  })
                }}
                onCancel={() => {
                  setSelectedPrincipalContractor(null);
                  setShowPrincipalContractorLinkView(true);
                }}
                onLink={handleConfirmPrincipalContractorLink}
              />
            );
          } else {
            return (
              <Form7
                {...formProps}
                onSwitchToLink={() => {
                  setShowPrincipalContractorLinkView(true);
                  setSelectedPrincipalContractor(null);
                }}
                allowMultipleDisciplines={true}
              />
            );
          }
      default:
        return null
    }
  }

  const fetchExistingRoles = async (projectId: string) => {
    try {
      console.log("Fetching existing roles for project:", projectId)

      const { data, error } = await supabaseClient
        .from("project_contractors")
        .select(`
        id,
        user_project_contractors!inner(
          user:users(
            id,
            first_name,
            last_name,
            email,
            user_roles(role_name)
          )
        )
      `)
        .eq("project_id", projectId)
        .eq("user_project_contractors.is_active", true)

      if (error) throw error

      let existingRolesArray: string[] = []

      if (data && data.length > 0) {
        const rolesAndUsers = data.flatMap((item) =>
          item.user_project_contractors.map((upc) => ({
            id: upc.user.id,
            firstName: upc.user.first_name,
            lastName: upc.user.last_name,
            email: upc.user.email,
            role: upc.user.user_roles.role_name,
          })),
        )

        console.log("Existing users and their roles for this project:", rolesAndUsers)

        existingRolesArray = Array.from(new Set(rolesAndUsers.map((user) => user.role)))
        console.log("Unique roles:", existingRolesArray)
      } else {
        console.log("No user_project_contractors found for this project")
      }

      setExistingRoles(existingRolesArray)

      // Set the first available role
      const availableRole = getFirstAvailableRole(existingRolesArray)
      if (availableRole) {
        setUsers([createDefaultUser(availableRole)])
        setFormValidity([false])
      } else {
        setUsers([])
        setFormValidity([])
      }
    } catch (error) {
      console.error("Error fetching existing roles:", error)
    }
  }

  const isRoleAvailable = (role: string, currentRoles: string[] = existingRoles): boolean => {
    const singleInstanceRoles = [
      "Consultant",
      "Project manager",
      "Construction manager",
      "Safety officer",
      "Principal contractor",
    ]
    const currentRolesInForm = users.map((user) => user.role)

    // If it's a single instance role
    if (singleInstanceRoles.includes(role)) {
      // Check if it exists in existing roles or current form
      return !currentRoles.includes(role) && !currentRolesInForm.includes(role)
    }

    // For Contractor and Sub-contractor, always return true
    return true
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidPhoneNumber = (number: string): boolean => {
    const saPhoneNumberRegex = /^(?:\+27|0)[6-8][0-9]{8}$/
    return saPhoneNumberRegex.test(number)
  }

  const isFormValid = (user: UserData, field?: keyof UserData, value?: string | string[] | undefined): boolean => {
    const updatedUser = field && value !== undefined ? { ...user, [field]: value } : user

    switch (updatedUser.role) {
      case "Consultant":
        if (showLinkView) {
          return true // Form1_link is always considered valid
        } else if (selectedConsultant) {
          return true // Form1_confirm is always considered valid
        } else {
          return (
            updatedUser.firstName.trim() !== "" &&
            updatedUser.lastName.trim() !== "" &&
            isValidEmail(updatedUser.email) &&
            isValidPhoneNumber(updatedUser.contactNumber) &&
            !updatedUser.emailError &&
            !updatedUser.contactNumberError
          )
        }
      case "Sub-contractor":
        if (showSubContractorLinkView) {
          return true // Form2_link is always considered valid
        } else if (selectedSubContractor) {
          return true // Form2_confirm is always considered valid
        } else {
          return (
            updatedUser.firstName.trim() !== "" &&
            updatedUser.lastName.trim() !== "" &&
            isValidEmail(updatedUser.email) &&
            isValidPhoneNumber(updatedUser.contactNumber) &&
            updatedUser.disciplineIds.length > 0 &&
            (updatedUser.assignedCompanyId ? updatedUser.assignedCompanyId.trim() !== "" : true) &&
            !updatedUser.emailError &&
            !updatedUser.contactNumberError
          )
        }
      case "Contractor":
        return (
          updatedUser.firstName.trim() !== "" &&
          updatedUser.lastName.trim() !== "" &&
          isValidEmail(updatedUser.email) &&
          isValidPhoneNumber(updatedUser.contactNumber) &&
          updatedUser.disciplineIds.length > 0 &&
          (updatedUser.assignedCompanyId ? updatedUser.assignedCompanyId.trim() !== "" : true) &&
          !updatedUser.emailError &&
          !updatedUser.contactNumberError
        )
      case "Construction manager":
        return (
          updatedUser.firstName.trim() !== "" &&
          updatedUser.lastName.trim() !== "" &&
          isValidEmail(updatedUser.email) &&
          isValidPhoneNumber(updatedUser.contactNumber) &&
          (updatedUser.assignedCompanyId ? updatedUser.assignedCompanyId.trim() !== "" : true) &&
          !updatedUser.emailError &&
          !updatedUser.contactNumberError
        )
      case "Safety officer":
        return (
          updatedUser.firstName.trim() !== "" &&
          updatedUser.lastName.trim() !== "" &&
          isValidEmail(updatedUser.email) &&
          isValidPhoneNumber(updatedUser.contactNumber) &&
          (updatedUser.assignedCompanyId ? updatedUser.assignedCompanyId.trim() !== "" : true) &&
          !updatedUser.emailError &&
          !updatedUser.contactNumberError
        )
      case "Project manager":
        return (
          updatedUser.firstName.trim() !== "" &&
          updatedUser.lastName.trim() !== "" &&
          isValidEmail(updatedUser.email) &&
          isValidPhoneNumber(updatedUser.contactNumber) &&
          (updatedUser.assignedCompanyId ? updatedUser.assignedCompanyId.trim() !== "" : true) &&
          !updatedUser.emailError &&
          !updatedUser.contactNumberError
        )
      case "Principal contractor":
        return (
          updatedUser.firstName.trim() !== "" &&
          updatedUser.lastName.trim() !== "" &&
          isValidEmail(updatedUser.email) &&
          isValidPhoneNumber(updatedUser.contactNumber) &&
          !updatedUser.emailError &&
          !updatedUser.contactNumberError
        )
      default:
        return false
    }
  }

  const shouldDisableSaveButton = (): boolean => {
    const allForms = users.map((user, index) => {
      let formType = "Unknown";
      
      // Determine form type based on role and selected status
      if (user.role === "Consultant") {
        formType = showLinkView ? "Form1_link" : selectedConsultant ? "Form1_confirm" : "Form1";
      } else if (user.role === "Sub-contractor") {
        formType = showSubContractorLinkView ? "Form2_link" : selectedSubContractor ? "Form2_confirm" : `Form2_${index}`;
      } else if (user.role === "Contractor") {
        formType = showContractorLinkView ? "Form3_link" : selectedContractor ? "Form3_confirm" : `Form3_${index}`;
      } else if (user.role === "Construction manager") {
        formType = showConstructionManagerLinkView ? "Form4_link" : selectedConstructionManager ? "Form4_confirm" : `Form4_${index}`;
      } else if (user.role === "Safety officer") {
        formType = showSafetyOfficerLinkView ? "Form5_link" : selectedSafetyOfficer ? "Form5_confirm" : `Form5_${index}`;
      } else if (user.role === "Project manager") {
        formType = showProjectManagerLinkView ? "Form6_link" : selectedProjectManager ? "Form6_confirm" : `Form6_${index}`;
      } else if (user.role === "Principal contractor") {
        formType = showPrincipalContractorLinkView ? "Form7_link" : selectedPrincipalContractor ? "Form7_confirm" : `Form7_${index}`;
      }
  
      return { formType, isValid: isFormValid(user) };
    });
  
    // Check conditions
    const hasUnpopulatedForm = allForms.some(form => !form.isValid && !form.formType.includes("_confirm"));
    const hasPopulatedForm = allForms.some(form => form.isValid);
    const hasConfirmOnlyForms = allForms.every(form => form.formType.includes("_confirm"));
    const hasLinkForm = allForms.some(form => form.formType.includes("_link"));
  
    // Logic to determine button disabled state
    if (hasUnpopulatedForm || hasLinkForm) {
      return true; // Disable if there's any unpopulated form or link form
    }
  
    if (hasConfirmOnlyForms && !hasPopulatedForm) {
      return false; // Enable if only confirm forms are present without unpopulated forms
    }
  
    if (hasPopulatedForm) {
      return false; // Enable if all custom forms are populated and valid
    }
  
    return true;
  };
  
  const logCurrentForms = () => {
    const currentForms = users
      .map((user, index) => {
        if (user.role === "Consultant") {
          return showLinkView ? "Form1_link" : selectedConsultant ? "Form1_confirm" : "Form1"
        }
        if (user.role === "Sub-contractor") {
          return showSubContractorLinkView ? "Form2_link" : selectedSubContractor ? "Form2_confirm" : `Form2_${index}`
        }
        if (user.role === "Contractor") {
          return showContractorLinkView ? "Form3_link" : selectedContractor ? "Form3_confirm" : `Form3_${index}`
        }
        if (user.role === "Construction manager") {
          return showConstructionManagerLinkView
            ? "Form4_link"
            : selectedConstructionManager
              ? "Form4_confirm"
              : `Form4_${index}`
        }
        if (user.role === "Safety officer") {
          return showSafetyOfficerLinkView
            ? "Form5_link"
            : selectedSafetyOfficer
              ? "Form5_confirm"
              : `Form5_${index}`
        }
        if (user.role === "Project Manager") {
          return showProjectManagerLinkView
            ? "Form6_link"
            : selectedProjectManager
              ? "Form6_confirm"
              : `Form6_${index}`
        }
        if (user.role === "Principal contractor") {
          return showPrincipalContractorLinkView
            ? "Form7_link"
            : selectedProjectManager
              ? "Form7_confirm"
              : `Form7_${index}`
        }
        switch (user.role) {
          case "Construction manager":
            return "Form4"
          case "Safety officer":
            return "Form5"
          case "Project manager":
            return "Form6"
          case "Principal contractor":
            return "Form7"
          default:
            return "Unknown"
        }
      })
      .filter(
        (form) => form !== "Form1_link" && form !== "Form2_link" && form !== "Form3_link" && form !== "Form4_link",
      )
    console.log("Current forms:", currentForms)
  }

  useEffect(() => {
    logCurrentForms()
  }, [
    users,
    showLinkView,
    selectedConsultant,
    showSubContractorLinkView,
    selectedSubContractor,
    showContractorLinkView,
    selectedContractor,
    showConstructionManagerLinkView,
    selectedConstructionManager,
  ])

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        if (preselectedProjectId) return null; // Skip rendering Step 1 if preselectedProjectId exists
        return (
          <Box sx={{ width: "100%" }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <SearchBox placeholder="Search projects" fullWidth onSearch={handleSearch} />
              </Grid>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <CustomListWrapper data={projects}>
                  <Box sx={{ height: "400px", overflow: "auto" }}>
                    <DataGrid
                      fields={projectFields}
                      data={projects}
                      loading={loading}
                      hidePagination
                      hideColumnNames={false}
                      rowClick={(id) => {
                        handleProjectSelect(id as string);
                        return false;
                      }}
                      rowStyle={() => ({
                        cursor: "pointer",
                      })}
                    />
                  </Box>
                </CustomListWrapper>
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ width: "100%" }}>
            {users.map((user, index) => (
              <Fragment key={index}>
                {index > 0 && <Divider sx={{ my: 4 }} />}
                <Box sx={{ mb: 4, position: "relative" }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    PERSON {index + 1}
                  </Typography>
                  {users.length > 1 && (
                    <Button
                      onClick={() => removeUserForm(index)}
                      sx={{ position: "absolute", top: 0, right: 0 }}
                      color="error"
                    >
                      <DeleteIcon />
                    </Button>
                  )}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        component="label"
                        sx={{ fontSize: "0.875rem", fontWeight: 800, marginRight: "10%", marginLeft: "2%" }}
                      >
                        User Role
                      </Typography>
                      <ButtonRadioSelect2
                        value={user.role}
                        onChange={(value) => {
                          if (value) {
                            console.log("Selected role:", value)
                            updateUser(index, "role", value)
                            updateUser(index, "firstName", "")
                            updateUser(index, "lastName", "")
                            updateUser(index, "email", "")
                            updateUser(index, "contactNumber", "")
                            updateUser(index, "disciplineIds", [])
                            updateUser(index, "assignedCompanyId", "")
                            updateUser(index, "emailError", undefined)
                            updateUser(index, "contactNumberError", undefined)
                            logCurrentForms()
                          }
                        }}
                        options={userRoles
                          .map((role) => role.role_name)
                          .filter((role) => isRoleAvailable(role) || role === user.role)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      {renderForm(user, index)}
                    </Grid>
                  </Grid>
                </Box>
              </Fragment>
            ))}
            {userRoles.some((role) => isRoleAvailable(role.role_name)) && (
              <Button onClick={addUserForm} startIcon={<AddIcon />} variant="outlined" sx={{ alignSelf: "flex-start" }}>
                New person
              </Button>
            )}
          </Box>
        )
      default:
        return null
    }
  }

  // useEffect(() => {
  //   console.log("Users state updated:", users)
  // }, [users])

  return (
    <Create resource="users">
      <Grow in={true} timeout={500}>
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
              maxWidth: "800px",
              padding: "24px",
            }}
          >
            <StickyWrapper>
            <PageNav
              title={renderStepTitle(activeStep)} 
              onBack={handleBack}
              onSave={activeStep === steps.length - 1 ? handleOnSave : undefined}
              saveButtonText={activeStep === steps.length - 1 ? (isSaving ? "Saving..." : "Add users") : undefined}
              isSaveDisabled={activeStep === steps.length - 1 ? shouldDisableSaveButton() || isSaving : false}
            />
            </StickyWrapper>
            {/* {selectedProject && (
              <MuiButton variant="outlined" onClick={() => setShowHierarchy(true)} sx={{ mt: 2, mb: 2 }}>
                View Hierarchy
              </MuiButton>
            )} */}
            <HierarchyModal
              open={showHierarchy}
              onClose={() => setShowHierarchy(false)}
              mainContractor={hierarchyData}
            />
            <Stepper activeStep={activeStep} steps={steps} />
            <SimpleForm toolbar={false}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  {renderStepContent(activeStep)}
                </Grid>
              </Grid>
            </SimpleForm>
          </Box>
        </Box>
      </Grow>
    </Create>
  )
}

export default UserCreate
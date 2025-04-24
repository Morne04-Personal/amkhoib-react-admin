"use client"

import React, { useState, useEffect } from "react"
import { Create, SimpleForm } from "react-admin"
import { Box, Grid, CircularProgress, Grow, Typography, Chip, Zoom } from "@mui/material"
import { TextField } from "../../Components/TextField"
import { PageNav } from "../../Components/PageNav"
import { useNavigate } from "react-router-dom"
import DatePicker from "../../Components/Buttons/DatePickerButton"
import DropDown from "../../Components/DropDown"
import supabaseClient from "../../supabaseClient"
import { useToast } from "../../Components/Toast/ToastContext"
import { Stepper } from "../../Components/Stepper"
import { SearchBox } from "../../Components/SearchBox"
import { ProjectContractorListCard } from "../../Components/ProjectContractorListCard"
import { NullSearch } from "../../Components/NullSearch"
import { FolderOpen as FolderIcon } from "@mui/icons-material"
import { ButtonRadioSelect2 } from "../../Components/Buttons/ButtonRadioSelect2"
import OutlinedButton from "../../Components/Buttons/OutlinedButton"
import { EmbeddedComponentPopup } from "../../Components/EmbeddedComponentPopup"
import { AddContractorModal } from "./AddContractorModal"
import { AddSubContractorsModal } from "./AddSubContractorModal"
import { StickyWrapper } from "../../Components/sticky-wrapper"

const steps = ["Are any of these your contractor?", "What are your project details?"]

interface Contractor {
  id: string
  name: string
  email: string
  phone: string
  contractor_type_id: string
  logo_url: string | null
  contractor_type_name: string
  contractor_description: string
  contractor_multiple_types_id: string
}

interface ContractorGroup {
  name: string
  description: string
  contractor_multiple_types_id: string
  contractors: Contractor[]
}

interface SubContractor extends Contractor {}

interface Province {
  id: string
  province_name: string
}

interface Frequency {
  id: number
  frequency: string
}

const StackedChips: React.FC<{ types: string[] }> = ({ types }) => {
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text
  }

  // Sort types to maintain consistent order: Principle contractor -> Contractor -> Sub-contractor
  const sortedTypes = [...types].sort((a, b) => {
    const order = ["Sub-contractor", "Principle contractor", "Contractor"]
    return order.indexOf(a) - order.indexOf(b)
  })

  return (
    <Box
      sx={{ display: "inline-flex", alignItems: "center", position: "relative", minHeight: "40px", minWidth: "200px" }}
    >
      {sortedTypes.map((type, index) => (
        <Chip
          key={type}
          label={truncateText(type, 25)}
          sx={{
            position: "absolute",
            left: `${index * 60}px`,
            top: `${index * 0}px`,
            zIndex: sortedTypes.length - index,
            backgroundColor: getChipColors(type).backgroundColor,
            color: getChipColors(type).textColor,
            border: getChipColors(type).border,
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.8rem",
            minWidth: "150px",
            maxWidth: "150px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
            ...(index !== 0 && {
              "&:hover": {
                backgroundColor: getChipColors(type).backgroundColor,
                transform: "translateX(75px)",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)",
              },
            }),
            transition: "all 0.3s ease-in-out",
          }}
        />
      ))}
    </Box>
  )
}

const getChipColors = (type: string): { backgroundColor: string; textColor: string; border: string } => {
  switch (type) {
    case "Principle contractor":
      return { backgroundColor: "#ddebf6", textColor: "#206390", border: "transparent" }
    case "Contractor":
      return { backgroundColor: "#ddebf7", textColor: "#228bc8", border: "transparent" }
    case "Multiple Types":
      return { backgroundColor: "#d7deeb", textColor: "#071135", border: "1px solid red" }
    default:
      return { backgroundColor: "#e4e9ee", textColor: "#228bc8", border: "transparent" }
  }
}

export const ProjectCreate = () => {
  const navigate = useNavigate()
  const { showMessage } = useToast()
  const [activeStep, setActiveStep] = useState(0)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [filteredContractors, setFilteredContractors] = useState<Contractor[]>([])
  const [selectedContractor, setSelectedContractor] = useState<string>("")
  const [projectName, setProjectName] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [street, setStreet] = useState<string>("")
  const [suburb, setSuburb] = useState<string>("")
  const [city, setCity] = useState<string>("")
  const [province, setProvince] = useState<string>("")
  const [projectOwner, setProjectOwner] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [loadingContractors, setLoadingContractors] = useState<boolean>(true)
  const [loadingSave, setLoadingSave] = useState<boolean>(false)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [notificationStartDate, setNotificationStartDate] = useState<string>("")
  const [projectNotificationFrequencies, setProjectNotificationFrequencies] = useState<Frequency[]>([])
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null)
  const [selectedContractorType, setSelectedContractorType] = useState<string | null>(null)
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false)
  const [isSubContractorModalOpen, setIsSubContractorModalOpen] = useState(false)
  const [isAddingContractor, setIsAddingContractor] = useState(false)
  const [selectedContractors, setSelectedContractors] = useState<Contractor[]>([])
  const [selectedSubContractors, setSelectedSubContractors] = useState<SubContractor[]>([])
  const [linkedSubContractors, setLinkedSubContractors] = useState<{ [contractorId: string]: SubContractor[] }>({})
  const [contractorGroups, setContractorGroups] = useState<ContractorGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<ContractorGroup | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  useEffect(() => {
    const fetchContractors = async () => {
      setLoadingContractors(true)
      try {
        const { data, error } = await supabaseClient.from("contractors").select(`
          id, 
          name, 
          logo_url,
          contractor_type_id,
          contractor_types(id, name),
          contractor_description,
          contractor_multiple_types_id
        `)

        if (error) {
          console.error("Error fetching contractors:", error)
          showMessage("Error fetching contractors", "error")
          return
        }

        const contractorsData = data.map((contractor: any) => ({
          id: contractor.id,
          name: contractor.name,
          email: contractor.email,
          phone: contractor.phone,
          logo_url: contractor.logo_url,
          contractor_type_id: contractor.contractor_type_id,
          contractor_type_name: contractor.contractor_types.name,
          contractor_description: contractor.contractor_description,
          contractor_multiple_types_id: contractor.contractor_multiple_types_id,
        }))

        const groupedContractors = contractorsData.reduce((acc: ContractorGroup[], contractor) => {
          const groupId = contractor.contractor_multiple_types_id || contractor.id
          const existingGroup = acc.find((group) => group.contractor_multiple_types_id === groupId)

          if (existingGroup) {
            existingGroup.contractors.push(contractor)
          } else {
            acc.push({
              name: contractor.name,
              description: contractor.contractor_description,
              contractor_multiple_types_id: groupId,
              contractors: [contractor],
            })
          }
          return acc
        }, [])

        setContractorGroups(groupedContractors)
        setContractors(contractorsData)
        setFilteredContractors(contractorsData)
      } catch (error) {
        console.error("Error in fetchContractors:", error)
        showMessage("An unexpected error occurred while fetching contractors", "error")
      } finally {
        setLoadingContractors(false)
      }
    }

    fetchContractors()
  }, [])

  useEffect(() => {
    const fetchProvinces = async () => {
      const { data, error } = await supabaseClient.from("provinces").select("id, province_name")

      if (error) {
        console.error("Error fetching provinces:", error)
        return
      }

      setProvinces(data)
    }

    fetchProvinces()
  }, [])

  useEffect(() => {
    const fetchProjectNotificationFrequencies = async () => {
      const { data, error } = await supabaseClient.from("project_notification_frequency").select("id, frequency")

      if (error) {
        console.error("Error fetching project notification frequencies:", error)
        return
      }

      setProjectNotificationFrequencies(data)
    }

    fetchProjectNotificationFrequencies()
  }, [])

  useEffect(() => {
    if (searchTerm && contractorGroups.length > 0) {
      const filtered = contractorGroups.filter((group) => group.name.toLowerCase().includes(searchTerm.toLowerCase()))
      setContractorGroups(filtered)
    } else {
      setContractorGroups(contractorGroups)
    }
  }, [searchTerm, contractorGroups])

  useEffect(() => {
    if (activeStep === 1) {
      console.log(`Step 2 - Selected contractor type: ${selectedContractorType}`)
      console.log(
        `Step 2 - Visible buttons: ${
          selectedContractorType === "Principle contractor"
            ? "CONTRACTORS and SUB-CONTRACTORS"
            : selectedContractorType === "Contractor" || selectedContractorType === "Sub-contractor"
              ? "SUB-CONTRACTORS only"
              : "None"
        }`,
      )
    }
  }, [activeStep, selectedContractorType])

  const isFormValid = () => {
    const baseValidation =
      projectName.trim() !== "" &&
      projectOwner.trim() !== "" &&
      startDate !== "" &&
      endDate !== "" &&
      street.trim() !== "" &&
      suburb.trim() !== "" &&
      city.trim() !== "" &&
      province !== "" &&
      selectedContractor !== "" &&
      notificationStartDate !== "" &&
      selectedFrequency !== null

    const contractorValidation = selectedContractorType !== "Principle contractor" || selectedContractors.length > 0

    const subContractorValidation =
      (selectedContractorType !== "Principle contractor" && selectedContractorType !== "Contractor") ||
      Object.values(linkedSubContractors).some((subContractors) => subContractors.length > 0)

    return baseValidation && contractorValidation && subContractorValidation
  }

  const handleBack = () => {
    if (activeStep === 0) {
      navigate(-1)
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1)
    }
  }

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleOnSave = async () => {
    if (!isFormValid()) {
      showMessage("Please fill in all required fields", "error")
      return
    }

    setLoadingSave(true)

    try {
      // 1. Create the project first
      const selectedFrequencyId = projectNotificationFrequencies.find((f) => f.frequency === selectedFrequency)?.id

      const { data: projectData, error: projectError } = await supabaseClient
        .from("projects")
        .insert({
          name: projectName,
          assigned_contractor_id: selectedContractor,
          planned_start_date: startDate,
          planned_end_date: endDate,
          street,
          suburb,
          city,
          province,
          project_owner: projectOwner,
          notification_start_date: notificationStartDate,
          notification_frequency: selectedFrequencyId,
        })
        .select("id")
        .single()

      if (projectError) {
        console.error("Error saving project:", projectError)
        showMessage("Error creating project", "error")
        setLoadingSave(false)
        return
      }

      const newProjectId = projectData.id

      // 2. Create entries in project_contractors table
      const projectContractorsEntries = []

      // Add main contractor entry
      projectContractorsEntries.push({
        project_id: newProjectId,
        parent_contractor_id: null,
        contractor_id: selectedContractor,
      })

      // Add entries for additional contractors
      selectedContractors.forEach((contractor) => {
        projectContractorsEntries.push({
          project_id: newProjectId,
          parent_contractor_id: selectedContractor,
          contractor_id: contractor.id,
        })
      })

      // Add entries for sub-contractors
      Object.entries(linkedSubContractors).forEach(([contractorId, subContractors]) => {
        subContractors.forEach((subContractor) => {
          projectContractorsEntries.push({
            project_id: newProjectId,
            parent_contractor_id: contractorId,
            contractor_id: subContractor.id,
          })
        })
      })

      // Insert all project_contractors entries
      const { error: projectContractorsError } = await supabaseClient
        .from("project_contractors")
        .insert(projectContractorsEntries)

      if (projectContractorsError) {
        console.error("Error saving project contractors:", projectContractorsError)
        showMessage("Error linking contractors to project", "error")
        setLoadingSave(false)
        return
      }

      // 3. Handle user_projects entry (keeping existing functionality)
      const { data: contractorData, error: contractorError } = await supabaseClient
        .from("contractors")
        .select("contractor_representative_id")
        .eq("id", selectedContractor)
        .single()

      if (!contractorError && contractorData?.contractor_representative_id) {
        const { error: userProjectError } = await supabaseClient.from("user_projects").insert({
          user_id: contractorData.contractor_representative_id,
          project_id: newProjectId,
        })

        if (userProjectError) {
          console.error("Error inserting into user_projects:", userProjectError)
        }
      }

      setLoadingSave(false)
      showMessage("Your project has been added successfully", "success")
      navigate("/users/create", { state: { preselectedProjectId: newProjectId } })
    } catch (error) {
      console.error("Error in handleOnSave:", error)
      showMessage("An unexpected error occurred", "error")
      setLoadingSave(false)
    }
  }

  const handleOpenContractorModal = () => {
    setIsContractorModalOpen(true)
  }

  const handleCloseContractorModal = () => {
    setIsContractorModalOpen(false)
  }

  const handleOpenSubContractorModal = () => {
    setIsSubContractorModalOpen(true)
  }

  const handleCloseSubContractorModal = () => {
    setIsSubContractorModalOpen(false)
  }

  const handleAddContractor = (contractor: Contractor) => {
    setSelectedContractors((prevContractors) => [...prevContractors, contractor])
    setIsContractorModalOpen(false)
  }

  const handleAddSubContractor = (subContractor: SubContractor, contractorId: string) => {
    setLinkedSubContractors((prev) => ({
      ...prev,
      [contractorId]: [...(prev[contractorId] || []), subContractor],
    }))
    setIsSubContractorModalOpen(false)
  }

  const handleDeleteContractor = (contractorId: string) => {
    setSelectedContractors((prevContractors) => prevContractors.filter((c) => c.id !== contractorId))
  }

  const handleDeleteSubContractor = (subContractorId: string, parentContractorId: string) => {
    setLinkedSubContractors((prev) => ({
      ...prev,
      [parentContractorId]: prev[parentContractorId].filter((sc) => sc.id !== subContractorId),
    }))
  }

  const handleContractorClick = (group: ContractorGroup) => {
    if (group.contractors.length > 1) {
      setSelectedGroup(group)
      setIsPopupOpen(true)
    } else {
      setSelectedContractor(group.contractors[0].id)
      setSelectedContractorType(group.contractors[0].contractor_type_name)
      handleNext()
    }
  }

  const handlePopupContractorSelect = (contractor: Contractor) => {
    setSelectedContractor(contractor.id)
    setSelectedContractorType(contractor.contractor_type_name)
    setIsPopupOpen(false)
    handleNext()
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grow in={true} timeout={500}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "0 16px",
                }}
              >
                <SearchBox
                  placeholder="Search contractors"
                  fullWidth
                  onSearch={(query) => setSearchTerm(query)}
                  sx={{ minWidth: "700px" }}
                />
              </Box>
              <Grid container spacing={2}>
                {loadingContractors ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%",
                      height: "200px",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : contractorGroups.length > 0 ? (
                  contractorGroups.map((group) => (
                    <Grid item xs={12} sm={6} md={6} key={`${group.name}-${group.description}`}>
                      <ProjectContractorListCard
                        title={group.name}
                        subtitle=""
                        imageUrl={group.contractors[0].logo_url || "https://via.placeholder.com/80"}
                        onClick={() => handleContractorClick(group)}
                        contractorType={
                          group.contractors.length > 1 ? "Multiple Types" : group.contractors[0].contractor_type_name
                        }
                        chipProps={
                          group.contractors.length > 1
                            ? {
                                customContent: (
                                  <Box
                                    sx={{
                                      position: "relative",
                                      width: "100%",
                                      minHeight: "40px",
                                      paddingRight: `${(group.contractors.length - 1) * 20}px`,
                                    }}
                                  >
                                    <StackedChips types={group.contractors.map((c) => c.contractor_type_name)} />
                                  </Box>
                                ),
                              }
                            : {
                                label: group.contractors[0].contractor_type_name,
                                backgroundColor: getChipColors(group.contractors[0].contractor_type_name)
                                  .backgroundColor,
                                textColor: getChipColors(group.contractors[0].contractor_type_name).textColor,
                                fontWeight: 600,
                              }
                        }
                      />
                    </Grid>
                  ))
                ) : (
                  <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 4 }}>
                    <NullSearch
                      icon={FolderIcon}
                      header="No contractor found"
                      subHeader="You will need to add a contractor from the contractor's screen before you can add a new project"
                    />
                  </Box>
                )}
              </Grid>
            </Box>
          </Grow>
        )
      case 1:
        return (
          <>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={7}>
                <TextField
                  source="name"
                  label="Project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  source="project_owner"
                  label="Client owner/developer"
                  value={projectOwner}
                  onChange={(e) => setProjectOwner(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={7}>
                <TextField source="street" label="Street" value={street} onChange={(e) => setStreet(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField source="suburb" label="Suburb" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={7}>
                <TextField source="city" label="City" value={city} onChange={(e) => setCity(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={5}>
                <DropDown
                  label="Province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  options={provinces.map((p) => ({ value: p.id, label: p.province_name }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Planned start date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker label="Planned end date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Grid>
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
              <Grid item xs={12}>
                <DatePicker
                  label="Notification start date"
                  value={notificationStartDate}
                  onChange={(e) => setNotificationStartDate(e.target.value)}
                  sx={{ width: "50%" }}
                />
              </Grid>
            </Grid>
            {selectedContractorType === "Principle contractor" && (
              <Box sx={{ width: "100%", marginTop: "2%" }}>
                <Typography
                  component="h6"
                  sx={{
                    color: "#6B7280",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    marginBottom: 1,
                  }}
                >
                  CONTRACTORS
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={12} md={12}>
                    <OutlinedButton buttonText="Add a contractor" onClick={handleOpenContractorModal} />
                  </Grid>
                  {selectedContractors.map((contractor) => (
                    <Grid item xs={12} sm={6} md={6} key={contractor.id}>
                      <ProjectContractorListCard
                        title={contractor.name}
                        subtitle=""
                        imageUrl={contractor.logo_url || "https://via.placeholder.com/80"}
                        contractorType="Contractor"
                        onDelete={() => handleDeleteContractor(contractor.id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            {(selectedContractorType === "Principle contractor" || selectedContractorType === "Contractor") && (
              <Box sx={{ width: "100%", marginTop: "2%" }}>
                <Typography
                  component="h6"
                  sx={{
                    color: "#6B7280",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    marginBottom: 1,
                  }}
                >
                  SUB-CONTRACTORS
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={12} md={12}>
                    <OutlinedButton buttonText="Add a sub-contractor" onClick={handleOpenSubContractorModal} />
                  </Grid>
                  {Object.entries(linkedSubContractors).map(([contractorId, subContractors]) => (
                    <React.Fragment key={contractorId}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1">
                          {contractorId === selectedContractor
                            ? "Primary Contractor"
                            : selectedContractors.find((c) => c.id === contractorId)?.name}
                        </Typography>
                      </Grid>
                      {subContractors.map((subContractor) => (
                        <Grid item xs={12} sm={6} md={6} key={subContractor.id}>
                          <ProjectContractorListCard
                            title={subContractor.name}
                            subtitle=""
                            imageUrl={subContractor.logo_url || "https://via.placeholder.com/80"}
                            contractorType="Sub-contractor"
                            onDelete={() => handleDeleteSubContractor(subContractor.id, contractorId)}
                          />
                        </Grid>
                      ))}
                    </React.Fragment>
                  ))}
                </Grid>
              </Box>
            )}

            <TextField
              source="contractor"
              label="Selected Contractor"
              value={contractors.find((c) => c.id === selectedContractor)?.name || ""}
              disabled
              style={{ display: "none" }}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <Create resource="projects">
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
              borderRadius: "8px",
              padding: "24px",
            }}
          >
            <StickyWrapper>
            <PageNav
              title={steps[activeStep]}
              onBack={handleBack}
              onSave={activeStep === steps.length - 1 ? handleOnSave : undefined}
              saveButtonText={activeStep === steps.length - 1 ? "Add project" : undefined}
              isSaveDisabled={activeStep === steps.length - 1 && (!isFormValid() || loadingSave)}
            />
            </StickyWrapper>
            <Stepper activeStep={activeStep} steps={steps} />
            <SimpleForm toolbar={false}>{renderStepContent(activeStep)}</SimpleForm>
          </Box>
        </Box>
      </Grow>
      <EmbeddedComponentPopup open={isContractorModalOpen} onClose={handleCloseContractorModal} title="" subtitle="">
        <AddContractorModal
          onClose={handleCloseContractorModal}
          onAddContractor={handleAddContractor}
          selectedContractors={selectedContractors}
        />
      </EmbeddedComponentPopup>
      <EmbeddedComponentPopup
        open={isSubContractorModalOpen}
        onClose={handleCloseSubContractorModal}
        title=""
        subtitle=""
      >
        <AddSubContractorsModal
          onClose={handleCloseSubContractorModal}
          onAddSubContractor={handleAddSubContractor}
          selectedSubContractors={Object.values(linkedSubContractors).flat()}
          selectedContractors={selectedContractors}
          primaryContractor={contractors.find((c) => c.id === selectedContractor)!}
          linkedSubContractors={linkedSubContractors}
        />
      </EmbeddedComponentPopup>
      <EmbeddedComponentPopup
        open={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        title="Select Contractor"
        subtitle="This contractor has multiple roles. Please select the appropriate one."
      >
        <Zoom in={true} timeout={500}>
          <Grid container spacing={2}>
            {selectedGroup?.contractors.map((contractor) => (
              <Grid item xs={12} sm={6} md={6} key={contractor.id}>
                <ProjectContractorListCard
                  title={contractor.name}
                  subtitle=""
                  imageUrl={contractor.logo_url || "https://via.placeholder.com/80"}
                  onClick={() => handlePopupContractorSelect(contractor)}
                  contractorType={contractor.contractor_type_name}
                  chipProps={{
                    label: contractor.contractor_type_name,
                    backgroundColor: getChipColors(contractor.contractor_type_name).backgroundColor,
                    textColor: getChipColors(contractor.contractor_type_name).textColor,
                    fontWeight: 600,
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Zoom>
      </EmbeddedComponentPopup>
    </Create>
  )
}

export default ProjectCreate


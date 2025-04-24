"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Box, Grid, CircularProgress, Grow, Chip } from "@mui/material"
import ContractorListCard from "../../Components/ContractorListCard"
import supabaseClient from "../../supabaseClient"
import { SearchBox } from "../../Components/SearchBox"
import { AddButton } from "../../Components/Buttons/AddButton"
import { useNavigate } from "react-router-dom"
import { Breadcrumbs } from "../../Components/Breadcrumbs"
import { ButtonRadioSelect2 } from "../../Components/Buttons/ButtonRadioSelect2"
import { EmbeddedComponentPopup } from "../../Components/EmbeddedComponentPopup"
import { PopupButton } from "../../Components/Buttons/PopupButton"

// Define contractor
interface Contractor {
  id: string
  name: string
  contractor_representative_id: string | null
  logo_url: string | null
  created_at: string
  contractor_multiple_types_id: string
  contractor_representative?: {
    first_name: string
    last_name: string
  }
  contractor_types:
    | {
        id: string
        name: string
      }
    | {
        id: string
        name: string
      }[]
}

interface ContractorGroup {
  name: string
  description: string
  contractor_multiple_types_id: string
  contractors: Contractor[]
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
    case "Sub-contractor":
      return { backgroundColor: "#e4e9ee", textColor: "#228bc8", border: "transparent" }
    default:
      return { backgroundColor: "#e4e9ee", textColor: "#228bc8", border: "transparent" }
  }
}

export const ContractorList = () => {
  const [contractorGroups, setContractorGroups] = useState<ContractorGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredContractorGroups, setFilteredContractorGroups] = useState<ContractorGroup[]>([])
  const [contractorTypes, setContractorTypes] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<ContractorGroup | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const { data: contractorsData, error: contractorsError } = await supabaseClient.from("contractors").select(`
            id, 
            name, 
            contractor_representative_id, 
            logo_url, 
            created_at, 
            contractor_multiple_types_id,
            contractor_types (id, name)
          `)

        if (contractorsError) throw contractorsError

        const contractorIds = contractorsData
          ?.map((contractor) => contractor.contractor_representative_id)
          .filter((id) => id !== null) as string[]

        let usersData: any[] = []
        if (contractorIds.length > 0) {
          const { data, error: usersError } = await supabaseClient
            .from("users")
            .select("id, first_name, last_name")
            .in("id", contractorIds)

          if (usersError) throw usersError
          usersData = data || []
        }

        const groupedContractors = contractorsData.reduce((acc: ContractorGroup[], contractor) => {
          const groupId = contractor.contractor_multiple_types_id || contractor.id
          const existingGroup = acc.find(
            (group) =>
              group.contractor_multiple_types_id === groupId || group.contractors.some((c) => c.id === groupId),
          )

          if (existingGroup) {
            existingGroup.contractors.push({
              ...contractor,
              contractor_representative: usersData.find((user) => user.id === contractor.contractor_representative_id),
            })
          } else {
            acc.push({
              name: contractor.name,
              description: "",
              contractor_multiple_types_id: groupId,
              contractors: [
                {
                  ...contractor,
                  contractor_representative: usersData.find(
                    (user) => user.id === contractor.contractor_representative_id,
                  ),
                },
              ],
            })
          }
          return acc
        }, [])

        setContractorGroups(groupedContractors)
        setFilteredContractorGroups(groupedContractors)

        const types = Array.from(
          new Set(
            contractorsData.flatMap((contractor) => {
              if (Array.isArray(contractor.contractor_types)) {
                return contractor.contractor_types.map((type) => type.name)
              } else if (contractor.contractor_types && typeof contractor.contractor_types === "object") {
                return [contractor.contractor_types.name]
              }
              return []
            }),
          ),
        )
        setContractorTypes(types)
      } catch (err) {
        console.error("Error fetching contractors:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchContractors()
  }, [])

  const handleSearch = (query: string) => {
    filterContractors(query, selectedType)
  }

  const handleTypeChange = (type: string | null) => {
    setSelectedType(type)
    filterContractors("", type)
  }

  const filterContractors = (query: string, type: string | null) => {
    let filtered = contractorGroups

    if (query) {
      filtered = filtered.filter(
        (group) =>
          group.name.toLowerCase().includes(query.toLowerCase()) ||
          group.contractors.some((contractor) =>
            (contractor.contractor_representative?.first_name + " " + contractor.contractor_representative?.last_name)
              .toLowerCase()
              .includes(query.toLowerCase()),
          ),
      )
    }

    if (type) {
      filtered = filtered.filter((group) =>
        group.contractors.some((contractor) => {
          if (Array.isArray(contractor.contractor_types)) {
            return contractor.contractor_types.some((contractorType) => contractorType.name === type)
          } else if (contractor.contractor_types && typeof contractor.contractor_types === "object") {
            return contractor.contractor_types.name === type
          }
          return false
        }),
      )
    }

    setFilteredContractorGroups(filtered)
  }

  const handleAddContractorButtonClick = () => {
    navigate("/contractors/create")
  }

  const handleContractorClick = (group: ContractorGroup) => {
    if (group.contractors.length > 1) {
      setSelectedGroup(group)
      setIsPopupOpen(true)
    } else {
      navigate(`/contractors/${group.contractors[0].id}/show`)
    }
  }

  const handlePopupContractorSelect = (contractor: Contractor) => {
    setIsPopupOpen(false)
    navigate(`/contractors/${contractor.id}/show`)
  }

  const isNewContractor = (createdAt: string) => {
    const createdDate = new Date(createdAt)
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return createdDate > oneWeekAgo
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grow in={true} timeout={500}>
      <Box sx={{ padding: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
          <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Contractors" }]} />

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SearchBox onSearch={handleSearch} placeholder="Search" fullWidth={false} />
            <Box sx={{ marginLeft: 2 }}>
              <AddButton onClick={handleAddContractorButtonClick} />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
          <ButtonRadioSelect2 value={selectedType} onChange={handleTypeChange} options={contractorTypes} />
        </Box>

        <Grid container spacing={2}>
          {filteredContractorGroups.map((group) => {
            const contractorTypes = Array.from(
              new Set(
                group.contractors
                  .flatMap((contractor) =>
                    Array.isArray(contractor.contractor_types)
                      ? contractor.contractor_types.map((type) => type.name)
                      : [contractor.contractor_types?.name],
                  )
                  .filter(Boolean),
              ),
            )

            return (
              <Grid item xs={12} sm={12} md={4} key={group.contractor_multiple_types_id}>
                <ContractorListCard
                  title={group.contractors[0].name}
                  // subtitle={
                  //   group.contractors[0].contractor_representative
                  //     ? `${group.contractors[0].contractor_representative.first_name} ${group.contractors[0].contractor_representative.last_name}`
                  //     : "No representative"
                  // }
                  imageUrl={group.contractors[0].logo_url || "https://via.placeholder.com/80"}
                  onClick={() => handleContractorClick(group)}
                  contractorType={contractorTypes.length > 1 ? "Multiple Types" : contractorTypes[0]}
                  chipProps={
                    contractorTypes.length > 1
                      ? {
                          customContent: (
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                              {isNewContractor(group.contractors[0].created_at) && (
                                <Chip
                                  label="New"
                                  sx={{
                                    backgroundColor: "#e8f5e9",
                                    color: "#2e7d32",
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                  }}
                                />
                              )}
                              <StackedChips types={contractorTypes} />
                            </Box>
                          ),
                        }
                      : {
                          label: contractorTypes[0],
                          backgroundColor: getChipColors(contractorTypes[0]).backgroundColor,
                          textColor: getChipColors(contractorTypes[0]).textColor,
                          fontWeight: 600,
                        }
                  }
                  newChip={isNewContractor(group.contractors[0].created_at)}
                />
              </Grid>
            )
          })}
        </Grid>

        <EmbeddedComponentPopup
          open={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          title="Select Contractor"
          subtitle="This contractor has multiple roles. Please select the appropriate one."
        >
          {isPopupOpen && (
            <Grid container spacing={2} sx={{ maxWidth: "md", margin: "auto" }}>
              {selectedGroup?.contractors.map((contractor) => (
                <Grid item xs={12} sm={6} key={contractor.id}>
                  <ContractorListCard
                    title={contractor.name}
                    subtitle=""
                    imageUrl={contractor.logo_url || "https://via.placeholder.com/80"}
                    onClick={() => handlePopupContractorSelect(contractor)}
                    contractorType={
                      Array.isArray(contractor.contractor_types)
                        ? contractor.contractor_types[0].name
                        : contractor.contractor_types?.name
                    }
                    chipProps={{
                      label: Array.isArray(contractor.contractor_types)
                        ? contractor.contractor_types[0].name
                        : contractor.contractor_types?.name,
                      backgroundColor: getChipColors(
                        Array.isArray(contractor.contractor_types)
                          ? contractor.contractor_types[0].name
                          : contractor.contractor_types?.name,
                      ).backgroundColor,
                      textColor: getChipColors(
                        Array.isArray(contractor.contractor_types)
                          ? contractor.contractor_types[0].name
                          : contractor.contractor_types?.name,
                      ).textColor,
                      fontWeight: 600,
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          )}
          {/* {selectedGroup && selectedGroup.contractors.length < 3 && isPopupOpen && (
            <Box sx={{ display: "flex", justifyContent: "center", width: "100%", mt: 2 }}>
              <PopupButton
                onClick={() => {
                  setIsPopupOpen(false)

                  if (selectedGroup) {
                    const existingTypes = selectedGroup.contractors.map((contractor) =>
                      Array.isArray(contractor.contractor_types)
                        ? contractor.contractor_types[0].name
                        : contractor.contractor_types?.name,
                    )

                    const allTypes = ["Principle contractor", "Contractor", "Sub-contractor"]
                    const availableTypes = allTypes.filter((type) => !existingTypes.includes(type))

                    console.log("Existing contractor types:", existingTypes)
                    console.log("Available contractor types:", availableTypes)

                    navigate("/contractors/create", {
                      state: {
                        contractorGroupId: selectedGroup.contractor_multiple_types_id,
                        existingTypes,
                        availableTypes,
                      },
                    })
                  }
                }}
                text="Add Contractor"
              />
            </Box>
          )} */}
        </EmbeddedComponentPopup>
      </Box>
    </Grow>
  )
}

export default ContractorList


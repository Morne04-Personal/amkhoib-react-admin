"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Box, Container, Typography, CircularProgress, Grow } from "@mui/material"
import { useParams, useNavigate } from "react-router-dom"
import { List } from "react-admin"
import ListCard from "../../Components/ListCard"
import { DataGrid, type DataGridField } from "../../Components/DataGrid"
import supabaseClient from "../../supabaseClient"
import { Breadcrumbs } from "../../Components/Breadcrumbs"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import { EmbeddedComponentPopup } from "../../Components/EmbeddedComponentPopup"
import ContractorEdit from "./ContractorEdit"

interface Contractor {
  id: string
  name: string
  physical_address: string
  logo_url: string | null
  contractor_representative?: {
    first_name: string
    last_name: string
    email?: string
  }
  suburb: string
  city: string
  province: string
  contractor_description: string
  created_at: string
  contractor_types: { id: string; name: string }[] | { id: string; name: string }
}

interface Project {
  id: string
  name: string
  location: string
  assigned_contractor_id: string
  sub_contractors_count: number
  disciplines_count: number
}

const ContractorDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contractor, setContractor] = useState<Contractor | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const fetchContractorDetails = async () => {
    try {
      const { data: contractorData, error: contractorError } = await supabaseClient
        .from("contractors")
        .select(`
          id,
          name,
          physical_address,
          logo_url,
          contractor_representative_id,
          suburb,
          city,
          province,
          contractor_description,
          created_at,
          contractor_types (id, name)
        `)
        .eq("id", id)
        .single()

      if (contractorError) throw contractorError

      if (contractorData.contractor_representative_id) {
        const { data: userData, error: userError } = await supabaseClient
          .from("users")
          .select("first_name, last_name, email")
          .eq("id", contractorData.contractor_representative_id)
          .single()

        if (userError) throw userError

        setContractor({
          ...contractorData,
          contractor_representative: userData,
        })
      } else {
        setContractor(contractorData)
      }

      // Fetch projects from vw_project_contractor_details
      const { data: projectsData, error: projectsError } = await supabaseClient
        .from("vw_project_contractor_details")
        .select("id, name, location, assigned_contractor_id, sub_contractors_count, disciplines_count")

      if (projectsError) throw projectsError

      setProjects(projectsData)
    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchContractorDetails()
    }
  }, [id]) // Removed fetchContractorDetails from dependencies

  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    fetchContractorDetails()
  }

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`)
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!contractor) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">Contractor not found</Typography>
      </Box>
    )
  }

  const getFullAddress = () => {
    const parts = [contractor.physical_address, contractor.suburb, contractor.city, contractor.province].filter(Boolean)
    return parts.join(", ")
  }

  const renderProjectField = (record: Project, fieldName: keyof Project) => {
    const isMatch = record.assigned_contractor_id === id
    return (
      <Typography
        sx={{
          color: isMatch ? "#2688be" : "inherit",
          fontWeight: isMatch ? "bold" : "normal",
        }}
      >
        {record[fieldName]}
      </Typography>
    )
  }

  const projectFields: DataGridField[] = [
    {
      source: "name",
      label: "Project Name",
      type: "custom",
      render: (record: Project) => renderProjectField(record, "name"),
    },
    {
      source: "location",
      label: "Location",
      type: "custom",
      render: (record: Project) => renderProjectField(record, "location"),
    },
    {
      source: "sub_contractors_count",
      label: "Sub-contractors",
      type: "custom",
      render: (record: Project) => <Typography sx={{ fontWeight: "bold" }}>{record.sub_contractors_count}</Typography>,
    },
    {
      source: "disciplines_count",
      label: "Disciplines",
      type: "custom",
      render: (record: Project) => <Typography sx={{ fontWeight: "bold" }}>{record.disciplines_count}</Typography>,
    },
  ]

  const getContractorRoles = () => {
    if (Array.isArray(contractor.contractor_types)) {
      return contractor.contractor_types.map((type) => type.name).join(", ")
    } else if (contractor.contractor_types && typeof contractor.contractor_types === "object") {
      return contractor.contractor_types.name
    }
    return "No role assigned"
  }

  const infoItems = [
    { label: "Role", value: getContractorRoles() },
    {
      label: "Location",
      value: (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <LocationOnIcon sx={{ mt: 0.5 }} />
          <Typography>{getFullAddress()}</Typography>
        </Box>
      ),
    },
  ]

  return (
    <Grow in={true} timeout={500}>
      <Container sx={{ py: 4, px: 0, ml: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Breadcrumbs
            items={[
              { label: "Home", path: "/" },
              { label: "Contractors", path: "/contractors" },
              { label: contractor.name },
            ]}
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "row", gap: 4 }}>
          <Box sx={{ flex: "0 0 400px" }}>
            <ListCard logo={contractor.logo_url} title={contractor.name} infoItems={infoItems} onEdit={handleEdit} />
          </Box>
          <Box sx={{ flex: 1, width: "100%" }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Projects
            </Typography>
            <List
              resource="projects"
              pagination={false}
              actions={false}
              sx={{
                width: "100%",
                "& .RaList-main": {
                  margin: 0,
                  padding: 0,
                  boxShadow: "none",
                  backgroundColor: "transparent",
                  width: "100%",
                },
                "& .MuiPaper-root": {
                  boxShadow: "none",
                  backgroundColor: "transparent",
                  width: "100%",
                },
                "& .MuiTable-root": {
                  width: "100%",
                },
                "& .MuiTableContainer-root": {
                  width: "100%",
                },
              }}
            >
              <DataGrid
                fields={projectFields}
                data={projects}
                disableRowClick={false}
                hideColumnNames={false}
                onRowClick={(id) => handleProjectClick(id)}
              />
            </List>
          </Box>
        </Box>

        <EmbeddedComponentPopup open={isEditModalOpen} onClose={handleCloseEditModal} title="">
          <ContractorEdit onUserSelected={handleCloseEditModal} />
        </EmbeddedComponentPopup>
      </Container>
    </Grow>
  )
}

export default ContractorDetailView


"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { List, useRedirect } from "react-admin"
import { Box, Card, CardContent, Grow, Typography, CircularProgress } from "@mui/material"
import { SearchBox } from "../../Components/SearchBox"
import { AddButton } from "../../Components/Buttons/AddButton"
import { DataGrid, type DataGridField } from "../../Components/DataGrid"
import { ButtonRadioSelect2 } from "../../Components/Buttons/ButtonRadioSelect2"
import { Breadcrumbs } from "../../Components/Breadcrumbs"
import { Chip } from "../../Components/Chips/Chip"
import { useNavigate } from "react-router-dom"
import supabaseClient from "../../supabaseClient"
import type { RaRecord, Identifier } from "react-admin"

// Define Project interface
interface Project {
  id: string
  name: string
  created_at: string
  contractor_logo_url: string | null
  users: any[] | null
  status: string
  assigned_contractor_id: string
  sub_contractors_count: number
  disciplines_count: number
  files_completed: string
}

// Filters component
const ProjectFilters = ({ onTabChange }: { onTabChange: (tab: "Open projects" | "Archived projects") => void }) => {
  const [activeTab, setActiveTab] = useState<"Open projects" | "Archived projects">("Open projects")

  const handleTabChange = (tab: "Open projects" | "Archived projects") => {
    setActiveTab(tab)
    onTabChange(tab)
  }

  return (
    <Grow in={true} timeout={500}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mb: 2,
        }}
      >
        <ButtonRadioSelect2
          value={activeTab}
          onChange={handleTabChange}
          options={["Open projects"]}
          // options={["Open projects", "Archived projects"]}
        />
      </Box>
    </Grow>
  )
}

export const ProjectList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [tabFilter, setTabFilter] = useState("Open projects")
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [loading, setLoading] = useState(true)
  const redirect = useRedirect()
  const navigate = useNavigate()

  const fetchProjects = useCallback(async () => {
    try {
      let query = supabaseClient.from("vw_project_contractor_details").select(`
          id,
          name,
          created_at,
          contractor_logo_url,
          users,
          status,
          assigned_contractor_id
        `)

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`)
      }

      query = query.order("created_at", { ascending: false })

      const { data, error } = await query

      if (error) throw error

      const projectsWithCounts = data?.map((project) => ({
        ...project,
        contractor_logo_url: project.contractor_logo_url || "https://via.placeholder.com/80",
        sub_contractors_count: project.users
          ? project.users.filter((user: any) => user.role_name === "Sub-contractor").length
          : 0,
        disciplines_count: project.users ? [...new Set(project.users.map((user: any) => user.discipline))].length : 0,
        files_completed: "⭐ 0", // Placeholder - you may want to calculate this based on actual data
      }))
      setProjects(projectsWithCounts || [])
    } catch (err) {
      console.error("Error fetching projects:", err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleTabChange = (tab: "Open projects" | "Archived projects") => {
    setTabFilter(tab)
  }

  const handleAddProject = () => {
    redirect("/projects/create")
  }

  const handleRowClick = (id: string) => {
    const project = projects?.find((p) => p.id === id)
    console.log("Row clicked:", { id, project })
    if (project && project.users && Array.isArray(project.users) && project.users.length > 0) {
      navigate(`/projects/${id}/show`)
    } else {
      console.log("This project is not clickable")
    }
  }

  const isNewProject = (createdAt: string) => {
    const createdDate = new Date(createdAt)
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return createdDate > oneWeekAgo
  }

  const projectFields: DataGridField[] = [
    {
      type: "custom",
      source: "contractor_logo_url",
      label: "",
      hideLabel: true,
      render: (record: RaRecord<Identifier>) => (
        <img
          src={(record as Project).contractor_logo_url || "https://via.placeholder.com/80"}
          alt="Contractor Logo"
          style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "50px" }}
        />
      ),
    },
    {
      type: "custom",
      source: "name",
      label: "Project Name",
      render: (record: RaRecord<Identifier>) => {
        const project = record as Project
        const isNew = isNewProject(project.created_at)

        return (
          <Box display="flex" alignItems="center">
            <Typography sx={{ color: "#1a1a26" }}>{project.name}</Typography>
            {isNew && (
              <Chip
                label="New"
                backgroundColor="#e8f5e9"
                textColor="#2e7d32"
                fontWeight={600}
                size="small"
                style={{ marginLeft: "8px" }}
              />
            )}
          </Box>
        )
      },
    },
    {
      type: "custom",
      source: "sub_contractors_count",
      label: "Sub-contractors",
      render: (record: RaRecord<Identifier>) => (
        <Typography sx={{ fontWeight: "bold" }}>{(record as Project).sub_contractors_count}</Typography>
      ),
    },
    {
      type: "custom",
      source: "disciplines_count",
      label: "Safety files",
      render: (record: RaRecord<Identifier>) => (
        <Typography sx={{ fontWeight: "bold" }}>{(record as Project).disciplines_count}</Typography>
      ),
    },
    // {
    //   type: "custom",
    //   source: "files_completed",
    //   label: "File completion rate",
    //   render: (record: RaRecord<Identifier>) => (
    //     <Typography sx={{ fontWeight: "bold" }}>{(record as Project).files_completed}</Typography>
    //   ),
    // },
  ]

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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Projects" }]} />

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SearchBox onSearch={handleSearch} placeholder="Search Projects" fullWidth={false} />
            <Box sx={{ marginLeft: 2 }}>
              <AddButton onClick={handleAddProject} />
            </Box>
          </Box>
        </Box>

        <Card
          elevation={0}
          sx={{
            backgroundColor: "transparent",
            "& .MuiPaper-root": {
              boxShadow: "none",
              backgroundColor: "transparent",
            },
          }}
        >
          <CardContent>
            <ProjectFilters onTabChange={handleTabChange} />
            <List
              basePath="/projects"
              resource="projects"
              filters={null}
              filter={{ status: tabFilter === "Open projects" ? "Open" : "Archived" }}
              sort={{ field: "created_at", order: "DESC" }}
              actions={false}
              exporter={false}
              sx={{
                "& .RaList-main": {
                  margin: 0,
                  padding: 0,
                  boxShadow: "none",
                  backgroundColor: "transparent",
                },
                "& .MuiPaper-root": {
                  boxShadow: "none",
                  backgroundColor: "transparent",
                },
              }}
            >
              <DataGrid
                fields={projectFields}
                onRowClick={(id) => handleRowClick(id)}
                data={projects || []}
                getRowClassName={(params) => {
                  const project = params.row as Project
                  return project.users && Array.isArray(project.users) && project.users.length > 0
                    ? ""
                    : "unclickable-row"
                }}
              />
            </List>
          </CardContent>
        </Card>
      </Box>
    </Grow>
  )
}


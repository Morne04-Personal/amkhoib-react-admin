"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Grid } from "@mui/material"
import { SearchBox } from "../../../Components/SearchBox"
import {  DataGrid, type DataGridField  } from "../../../Components/DataGrid"
import supabaseClient from "../../../supabaseClient"
import { ListContextProvider, useListController } from "react-admin"
import { ButtonShowHide } from "../../../Components/Buttons/ButtonShowHide"
import AddIcon from "@mui/icons-material/Add"

interface Form6LinkProps {
  onSelectProjectManager: (ProjectManager: ProjectManager) => void
  onCreateNew: () => void
}

interface ProjectManager {
  id: string
  first_name: string
  last_name: string
  email: string
  contact_number: string
  user_roles: {
    role_name: string
  }[]
}

const projectManagerFields: DataGridField[] = [
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

export const Form6Link: React.FC<Form6LinkProps> = ({ onSelectProjectManager, onCreateNew }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProjectManagers = async () => {
      setLoading(true)
      try {
        let query = supabaseClient
          .from("users")
          .select(`
            id, 
            first_name, 
            last_name, 
            email, 
            contact_number,
            user_roles!inner(role_name)
          `)
          .eq("user_roles.role_name", "Project manager")

        if (searchQuery) {
          query = query.or(
            `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`,
          )
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching Project Managers:", error)
          return
        }

        setProjectManagers(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectManagers()
  }, [searchQuery])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SearchBox placeholder="Search Project Manager" fullWidth onSearch={handleSearch} />
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-start">
            <ButtonShowHide text="Create New Project Manager" icon={<AddIcon />} onClick={onCreateNew} />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ height: "400px", overflow: "auto" }}>
            <DataGridWrapper data={projectManagers}>
              <DataGrid
                fields={projectManagerFields}
                data={projectManagers}
                loading={loading}
                hidePagination
                hideColumnNames={false}
                rowClick={(id) => {
                  const selectedProjectManager = projectManagers.find((so) => so.id === id)
                  if (selectedProjectManager) {
                    onSelectProjectManager(selectedProjectManager)
                  }
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
  )
}


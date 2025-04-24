"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Grid } from "@mui/material"
import { SearchBox } from "../../../Components/SearchBox"
import { DataGrid, type DataGridField } from "../../../Components/DataGrid"
import supabaseClient from "../../../supabaseClient"
import { ListContextProvider, useListController } from "react-admin"
import { ButtonShowHide } from "../../../Components/Buttons/ButtonShowHide"
import AddIcon from "@mui/icons-material/Add"

interface Form5LinkProps {
  onSelectSafetyOfficer: (safetyOfficer: SafetyOfficer) => void
  onCreateNew: () => void
}

interface SafetyOfficer {
  id: string
  first_name: string
  last_name: string
  email: string
  contact_number: string
  user_roles: {
    role_name: string
  }[]
}

const safetyOfficerFields: DataGridField[] = [
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

export const Form5Link: React.FC<Form5LinkProps> = ({ onSelectSafetyOfficer, onCreateNew }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [safetyOfficers, setSafetyOfficers] = useState<SafetyOfficer[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSafetyOfficers = async () => {
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
          .eq("user_roles.role_name", "Safety officer")

        if (searchQuery) {
          query = query.or(
            `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`,
          )
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching safety officers:", error)
          return
        }

        setSafetyOfficers(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSafetyOfficers()
  }, [searchQuery])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SearchBox placeholder="Search safety officers" fullWidth onSearch={handleSearch} />
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-start">
            <ButtonShowHide text="Create New Safety Officer" icon={<AddIcon />} onClick={onCreateNew} />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ height: "400px", overflow: "auto" }}>
            <DataGridWrapper data={safetyOfficers}>
              <DataGrid
                fields={safetyOfficerFields}
                data={safetyOfficers}
                loading={loading}
                hidePagination
                hideColumnNames={false}
                rowClick={(id) => {
                  const selectedSafetyOfficer = safetyOfficers.find((so) => so.id === id)
                  if (selectedSafetyOfficer) {
                    onSelectSafetyOfficer(selectedSafetyOfficer)
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


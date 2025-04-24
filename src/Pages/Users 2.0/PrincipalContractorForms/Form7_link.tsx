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

interface Form7LinkProps {
  onSelectPrincipalContractor: (PrincipalContractor: PrincipalContractor) => void
  onCreateNew: () => void
}

interface PrincipalContractor {
  id: string
  first_name: string
  last_name: string
  email: string
  contact_number: string
  user_roles: {
    role_name: string
  }[]
}

const PrincipalContractorFields: DataGridField[] = [
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

export const Form7Link: React.FC<Form7LinkProps> = ({ onSelectPrincipalContractor, onCreateNew }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [principalContractors, setPrincipalContractors] = useState<PrincipalContractor[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPrincipalContractors = async () => {
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
          .eq("user_roles.role_name", "Principal contractor")

        if (searchQuery) {
          query = query.or(
            `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`,
          )
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching Principal Contractors:", error)
          return
        }

        setPrincipalContractors(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrincipalContractors()
  }, [searchQuery])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SearchBox placeholder="Search Principal Contractor" fullWidth onSearch={handleSearch} />
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-start">
            <ButtonShowHide text="Create New Principal Contractor" icon={<AddIcon />} onClick={onCreateNew} />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ height: "400px", overflow: "auto" }}>
            <DataGridWrapper data={principalContractors}>
              <DataGrid
                fields={PrincipalContractorFields}
                data={principalContractors}
                loading={loading}
                hidePagination
                hideColumnNames={false}
                rowClick={(id) => {
                  const selectedPrincipalContractor = principalContractors.find((so) => so.id === id)
                  if (selectedPrincipalContractor) {
                    onSelectPrincipalContractor(selectedPrincipalContractor)
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


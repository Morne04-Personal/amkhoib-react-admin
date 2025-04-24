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

interface Form2LinkProps {
  onSelectSubContractor: (subContractor: SubContractor) => void
  onCreateNew: () => void
  projectId: string
}

interface SubContractor {
  id: string
  first_name: string
  last_name: string
  email: string
  contact_number: string
  company_name: string
}

const subContractorFields: DataGridField[] = [
//   { source: "company_name", label: "Company Name", type: "text" },
  { source: "first_name", label: "Name", type: "text" },
  { source: "last_name", label: "Surname", type: "text" },
  { source: "email", label: "Email", type: "text" },
//   { source: "contact_number", label: "Contact Number", type: "text" },
]

const DataGridWrapper = ({ data, children }) => {
  const listContext = useListController({
    data,
    resource: "users",
    perPage: 10,
    sort: { field: "company_name", order: "ASC" },
  })

  return <ListContextProvider value={listContext}>{children}</ListContextProvider>
}

export const Form2Link: React.FC<Form2LinkProps> = ({ onSelectSubContractor, onCreateNew, projectId }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [subContractors, setSubContractors] = useState<SubContractor[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSubContractors = async () => {
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
            company_name,
            user_roles!inner(role_name)
          `)
          .eq("user_roles.role_name", "Sub-contractor")

        if (searchQuery) {
          query = query.or(
            `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`,
          )
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching sub-contractors:", error)
          return
        }

        setSubContractors(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubContractors()
  }, [searchQuery])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SearchBox placeholder="Search sub-contractors" fullWidth onSearch={handleSearch} />
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-start">
            <ButtonShowHide text="Create New Sub-Contractor" icon={<AddIcon />} onClick={onCreateNew} />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ height: "400px", overflow: "auto" }}>
            <DataGridWrapper data={subContractors}>
              <DataGrid
                fields={subContractorFields}
                data={subContractors}
                loading={loading}
                hidePagination
                hideColumnNames={false}
                rowClick={(id) => {
                  const selectedSubContractor = subContractors.find((c) => c.id === id)
                  if (selectedSubContractor) {
                    onSelectSubContractor(selectedSubContractor)
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


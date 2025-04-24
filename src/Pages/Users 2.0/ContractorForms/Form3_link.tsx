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

interface Form3LinkProps {
  onSelectContractor: (contractor: Contractor) => void
  onCreateNew: () => void
  projectId: string
}

interface Contractor {
  id: string
  first_name: string
  last_name: string
  email: string
  contact_number: string
  company_name: string
  disciplines: { id: string; name: string }[]
}

const contractorFields: DataGridField[] = [
{ source: "first_name", label: "Name", type: "text" },
{ source: "last_name", label: "Surname", type: "text" },
{ source: "email", label: "Email", type: "text" },
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

export const Form3Link: React.FC<Form3LinkProps> = ({ onSelectContractor, onCreateNew, projectId }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchContractors = async () => {
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
            user_roles!inner(role_name),
            user_disciplines(discipline:disciplines(id, name))
          `)
          .eq("user_roles.role_name", "Contractor")

        if (searchQuery) {
          query = query.or(
            `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`,
          )
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching contractors:", error)
          return
        }

        const formattedContractors = data.map((contractor) => ({
          ...contractor,
          disciplines: contractor.user_disciplines.map((ud) => ud.discipline),
        }))

        setContractors(formattedContractors)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContractors()
  }, [searchQuery])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SearchBox placeholder="Search contractors" fullWidth onSearch={handleSearch} />
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-start">
            <ButtonShowHide text="Create New Contractor" icon={<AddIcon />} onClick={onCreateNew} />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ height: "400px", overflow: "auto" }}>
            <DataGridWrapper data={contractors}>
              <DataGrid
                fields={contractorFields}
                data={contractors}
                loading={loading}
                hidePagination
                hideColumnNames={false}
                rowClick={(id) => {
                  const selectedContractor = contractors.find((c) => c.id === id)
                  if (selectedContractor) {
                    onSelectContractor(selectedContractor)
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


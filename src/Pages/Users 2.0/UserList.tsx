"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { List, useRedirect, useGetList, type RaRecord, type SortPayload } from "react-admin"
import { Box, Typography, Card, CardContent, Grow } from "@mui/material"
import { SearchBox } from "../../Components/SearchBox"
import { AddButton } from "../../Components/Buttons/AddButton"
import { DataGrid, type DataGridField } from "../../Components/DataGrid"
import { ButtonRadioSelect2 } from "../../Components/Buttons/ButtonRadioSelect2"
import { Chip } from "../../Components/Chips/Chip"
import { Breadcrumbs } from "../../Components/Breadcrumbs"
import supabaseClient from "../../supabaseClient"

// Filters component
const UserFilters = ({
  onRoleChange,
  selectedRole,
}: {
  onRoleChange: (role: string | null) => void
  selectedRole: string | null
}) => {
  const { data: roles } = useGetList("user_roles", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "role_name", order: "ASC" },
  })

  const roleOptions = roles ? Object.values(roles).map((role) => role.role_name) : []

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        mb: 2,
      }}
    >
      <ButtonRadioSelect2 value={selectedRole} onChange={onRoleChange} options={roleOptions} />
    </Box>
  )
}

// Define the fields configuration
const userFields: DataGridField[] = [
  {
    type: "custom",
    label: "Name",
    source: "first_name",
    sortable: true,
    render: (record: RaRecord) => {
      const createdAt = new Date(record.created_at)
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const isNew = createdAt > oneWeekAgo

      return (
        <Box display="flex" alignItems="center">
          <Typography sx={{ fontWeight: "bold" }}>
            {record.first_name} {record.last_name}
          </Typography>
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
    type: "text",
    source: "email",
    label: "Email",
    sortable: true,
  },
  // {
  //   type: "reference",
  //   source: "assigned_contractor_id",
  //   reference: "contractors",
  //   label: "Association",
  //   referenceField: {
  //     source: "name",
  //   },
  //   sortable: true,
  // },
  {
    type: "reference",
    source: "role",
    reference: "user_roles",
    label: "Role",
    referenceField: {
      source: "role_name",
      displayType: "chip",
    },
    sortable: true,
    chipProps: {
      getStyles: (value: string) => {
        // Return different styles based on the role
        switch (value.toLowerCase()) {
          case "contractor":
            return {
              backgroundColor: "#ddebf7",
              textColor: "#228bc8",
              fontWeight: 600,
            }
          case "consultant":
            return {
              backgroundColor: "#dce0eb",
              textColor: "#18234e",
              fontWeight: 600,
            }
          case "sub-contractor":
            return {
              backgroundColor: "#d8e6f2",
              textColor: "#186091",
              fontWeight: 800,
            }
          default:
            return {
              backgroundColor: "#ddebf7",
              textColor: "#228bc8",
              fontWeight: 600,
            }
        }
      },
    },
  },
  {
    type: "custom",
    label: "Status",
    source: "is_active",
    sortable: true,
    render: (record: RaRecord) => {
      const isActive = record.is_active

      return (
        <Chip
          label={isActive ? "Active" : "Banned"}
          backgroundColor={isActive ? "#e8f5e9" : "#ffebee"}
          textColor={isActive ? "#2e7d32" : "#c62828"}
          fontWeight={600}
          size="small"
        />
      )
    },
  },
]

// Empty component to remove default actions
const EmptyActions = () => null

// User List component
export const UserList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [sort, setSort] = useState<SortPayload>({ field: "first_name", order: "ASC" })
  const [users, setUsers] = useState<RaRecord[]>([])
  const redirect = useRedirect()
  const { data: roles } = useGetList("user_roles", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "role_name", order: "ASC" },
  })

  const fetchUsers = useCallback(async () => {
    try {
      let query = supabaseClient.from("users").select(`
          id,
          first_name,
          last_name,
          email,
          created_at,
          assigned_contractor_id,
          role,
          is_active,
          contractors:assigned_contractor_id (name),
          user_roles:role (role_name)
        `)

      if (searchQuery) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`,
        )
      }

      if (selectedRole) {
        const roleId = roles ? Object.values(roles).find((r) => r.role_name === selectedRole)?.id : undefined
        if (roleId) {
          query = query.eq("role", roleId)
        }
      }

      const { data, error } = await query.order(sort.field, { ascending: sort.order === "ASC" })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }, [searchQuery, selectedRole, roles, sort])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleRoleChange = (role: string | null) => {
    setSelectedRole(role)
  }

  const handleAddUser = () => {
    redirect("/users/create")
  }

  const handleSort = (newSort: SortPayload) => {
    setSort(newSort)
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
          <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "People" }]} />

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SearchBox onSearch={handleSearch} placeholder="Search People" fullWidth={false} />
            <Box sx={{ marginLeft: 2 }}>
              <AddButton onClick={handleAddUser} />
            </Box>
          </Box>
        </Box>

        <Card elevation={0} sx={{ backgroundColor: "transparent" }}>
          <CardContent>
            <UserFilters onRoleChange={handleRoleChange} selectedRole={selectedRole} />
            <List
              resource="users"
              actions={<EmptyActions />}
              exporter={false}
              sort={sort}
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
              <DataGrid fields={userFields} data={users} disableRowClick={false} sort={sort} onSort={handleSort} />
            </List>
          </CardContent>
        </Card>
      </Box>
    </Grow>
  )
}


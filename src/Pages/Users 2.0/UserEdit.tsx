"use client"

import { useState, useEffect } from "react"
import { Edit, useGetOne } from "react-admin"
import { Box, Grid, CircularProgress, Grow, ButtonGroup, Button, Typography } from "@mui/material"
import { TextField } from "../../Components/TextField"
import { PageNav } from "../../Components/PageNav"
import { useNavigate, useParams } from "react-router-dom"
import supabaseClient from "../../supabaseClient"
import { useToast } from "../../Components/Toast/ToastContext"

interface UserRole {
  id: string
  role_name: string
}

interface UserFormData {
  companyName: string
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  roleId: string
  contractorId: string
  isActive: boolean
}

export const UserEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showMessage } = useToast()
  const [contractors, setContractors] = useState<{ value: string; label: string }[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])

  const [user, setUser] = useState<UserFormData>({
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    roleId: "",
    contractorId: "",
    isActive: false,
  })

  const { data: record, isLoading: isLoadingUser } = useGetOne("users", { id })

  useEffect(() => {
    const fetchUserRoles = async () => {
      const { data, error } = await supabaseClient.from("user_roles").select("id, role_name")

      if (error) {
        console.error("Error fetching user roles:", error)
        return
      }

      setUserRoles(data)
    }

    const fetchContractors = async () => {
      const { data, error } = await supabaseClient.from("contractors").select("id, name")
      if (error) {
        console.error("Error fetching contractors:", error)
        return
      }
      setContractors(data.map((contractor) => ({ value: contractor.id, label: contractor.name })))
    }

    fetchUserRoles()
    fetchContractors()
  }, [])

  useEffect(() => {
    if (record) {
      setUser({
        companyName: record.company_name || "",
        firstName: record.first_name || "",
        lastName: record.last_name || "",
        email: record.email || "",
        contactNumber: record.contact_number || "",
        roleId: record.role || "",
        contractorId: record.assigned_contractor_id || "",
        isActive: record.is_active || false,
      })
    }
  }, [record])

  const handleBack = () => {
    navigate(-1)
  }

  const updateUser = (field: keyof UserFormData, value: string) => {
    setUser((prevUser) => ({ ...prevUser, [field]: value }))
  }

  const handleOnSave = async () => {
    try {
      const userToUpdate = {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        contact_number: user.contactNumber,
        role: user.roleId || null,
        company_name: user.companyName,
        assigned_contractor_id: user.contractorId || null,
        is_active: user.isActive,
      }

      const { error: userError } = await supabaseClient.from("users").update(userToUpdate).eq("id", id)

      if (userError) throw userError

      showMessage("User has been updated successfully", "success")
      navigate("/users")
    } catch (error) {
      console.error("Error updating user:", error)
      showMessage("Error updating user", "error")
    }
  }

  const renderUserForm = () => (
    <Grow in={true} timeout={500}>
      <Box sx={{ position: "relative", p: 0 }}>
        <Grid container spacing={1}>
          {/* <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              component="label"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 800,
                color: 'rgba(0, 0, 0, 0.87)',
                marginRight: '16px',
              }}
            >
              Role
            </Typography>
            <ButtonRadioSelect2
              readOnly
              value={userRoles.find(r => r.id === user.roleId)?.role_name || ''}
              onChange={(roleName) => {
                const role = userRoles.find(r => r.role_name === roleName);
                if (role) {
                  updateUser('roleId', role.id);
                }
              }}
              options={userRoles.map(role => role.role_name)}
            />
          </Grid> */}
          <Grid item xs={12}>
            <TextField
              source="first_name"
              label="Name"
              value={user.firstName}
              onChange={(e) => updateUser("firstName", e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              source="last_name"
              label="Surname"
              value={user.lastName}
              onChange={(e) => updateUser("lastName", e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              source="email"
              label="Email address"
              value={user.email}
              onChange={(e) => updateUser("email", e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              source="contact_number"
              label="Contact number"
              value={user.contactNumber}
              onChange={(e) => updateUser("contactNumber", e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sx={{ mt: 1 }}>
            <Typography
              component="label"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 800,
                color: "rgba(0, 0, 0, 0.87)",
                marginBottom: "8px",
                display: "block",
              }}
            >
            </Typography>
            <ButtonGroup variant="contained" aria-label="user status button group" fullWidth>
              <Button
                onClick={() => setUser((prevUser) => ({ ...prevUser, isActive: true }))}
                sx={{
                  bgcolor: user.isActive ? "success.main" : "#e0e0e0",
                  "&:hover": { bgcolor: user.isActive ? "success.dark" : "#c0c0c0" },
                  color: user.isActive ? "white" : "#757575",
                  fontWeight: user.isActive ? "bold" : "normal",
                  opacity: user.isActive ? 1 : 0.7,
                }}
              >
                Active
              </Button>
              <Button
                onClick={() => setUser((prevUser) => ({ ...prevUser, isActive: false }))}
                sx={{
                  bgcolor: !user.isActive ? "error.main" : "#e0e0e0",
                  "&:hover": { bgcolor: !user.isActive ? "error.dark" : "#c0c0c0" },
                  color: !user.isActive ? "white" : "#757575",
                  fontWeight: !user.isActive ? "bold" : "normal",
                  opacity: !user.isActive ? 1 : 0.7,
                }}
              >
                Banned
              </Button>
            </ButtonGroup>
          </Grid>
        </Grid>
      </Box>
    </Grow>
  )

  if (isLoadingUser) {
    return <CircularProgress />
  }

  return (
    // <Edit>
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
            // backgroundColor: 'white',
            borderRadius: "8px",
            // boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            padding: "24px",
          }}
        >
          <PageNav title="Edit User" onBack={handleBack} onSave={handleOnSave} saveButtonText="Update user" />
          {/* <SimpleForm toolbar={false}> */}
          {renderUserForm()}
          {/* </SimpleForm> */}
        </Box>
      </Box>
    // </Edit>
  )
}

export default UserEdit


import type React from "react"
import { useState, useEffect } from "react"
import { Grid, Box } from "@mui/material"
import { TextField } from "../../../Components/TextField"
import { ButtonShowHide } from "../../../Components/Buttons/ButtonShowHide"
import LinkIcon from "@mui/icons-material/Link"
import MultiSelectDropDown from "../../../Components/MultiSelectDropDown"

interface Form1Props {
  user: {
    firstName: string
    lastName: string
    email: string
    contactNumber: string
    disciplineIds: string[]
    emailError?: string
    contactNumberError?: string
  }
  updateUser: (field: string, value: string | string[]) => void
  disciplines: { value: string; label: string }[]
  allowMultipleDisciplines: boolean
  onSwitchToLink: () => void
}

export const Form1: React.FC<Form1Props> = ({ user, updateUser, disciplines, allowMultipleDisciplines, onSwitchToLink }) => {
  const [emailError, setEmailError] = useState<string>("")
  const [contactNumberError, setContactNumberError] = useState<string>("")

  useEffect(() => {
    updateUser("emailError", emailError)
  }, [emailError, updateUser]) // Added updateUser to dependencies

  useEffect(() => {
    updateUser("contactNumberError", contactNumberError)
  }, [contactNumberError, updateUser]) // Added updateUser to dependencies

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidPhoneNumber = (number: string): boolean => {
    const saPhoneNumberRegex = /^(?:\+27|0)[6-8][0-9]{8}$/
    return saPhoneNumberRegex.test(number)
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-start">
            <ButtonShowHide text="Link Existing Consultant" icon={<LinkIcon />} onClick={onSwitchToLink} />
          </Box>
        </Grid>
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
            onChange={(e) => {
              const email = e.target.value
              updateUser("email", email)
              setEmailError(isValidEmail(email) ? "" : "Invalid email address")
            }}
            required
            error={Boolean(emailError)}
            helperText={emailError}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            source="contact_number"
            label="Contact number"
            value={user.contactNumber}
            onChange={(e) => {
              const input = e.target.value

              // Allow only numerical input
              if (/^\d*$/.test(input)) {
                updateUser("contactNumber", input)
                setContactNumberError(isValidPhoneNumber(input) ? "" : "Invalid South African phone number")
              }
            }}
            error={Boolean(contactNumberError)}
            helperText={contactNumberError}
          />
        </Grid>
        <Grid item xs={6}>
          <MultiSelectDropDown
            label="Assign safety files"
            value={user.disciplineIds}
            onChange={(event) => updateUser("disciplineIds", event.target.value as string[])}
            options={disciplines}
            multiple={allowMultipleDisciplines}
          />
        </Grid>
      </Grid>
    </Box>
  )
}


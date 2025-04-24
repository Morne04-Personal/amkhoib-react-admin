import type React from "react"
import { useState } from "react"
import { Grid, Box } from "@mui/material"
import { TextField } from "../../../Components/TextField"
import MultiSelectDropDown from "../../../Components/MultiSelectDropDown"
import { ButtonShowHide } from "../../../Components/Buttons/ButtonShowHide"
import LinkIcon from "@mui/icons-material/Link"

interface Form2Props {
  user: {
    firstName: string
    lastName: string
    email: string
    contactNumber: string
    disciplineIds: string[]
    assignedCompanyId?: string
  }
  updateUser: (field: string, value: string | string[]) => void
  disciplines: { value: string; label: string }[]
  assignableCompanies: { value: string; label: string }[]
  mainContractorType: string
  onSwitchToLink: () => void
}

export const Form2: React.FC<Form2Props> = ({
  user,
  updateUser,
  disciplines,
  assignableCompanies,
  mainContractorType,
  onSwitchToLink,
}) => {
  const [emailError, setEmailError] = useState<string>("")
  const [contactNumberError, setContactNumberError] = useState<string>("")

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidPhoneNumber = (number: string): boolean => {
    const saPhoneNumberRegex = /^(?:\+27|0)[6-8][0-9]{8}$/
    return saPhoneNumberRegex.test(number)
  }

  if (!disciplines || disciplines.length === 0) {
    return <div>Loading disciplines...</div>
  }

  console.log("Form2 - mainContractorType:", mainContractorType)
  console.log("Form2 - assignableCompanies:", assignableCompanies)

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-start" mb={2}>
            <ButtonShowHide text="Link Existing Sub-Contractor" icon={<LinkIcon />} onClick={onSwitchToLink} />
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
            label="Assign safety file"
            value={user.disciplineIds[0] || ""}
            onChange={(event) => updateUser("disciplineIds", [event.target.value as string])}
            options={disciplines}
            multiple={false}
          />
        </Grid>
        {mainContractorType !== "Sub-Contractor" && (
          <Grid item xs={12}>
            <MultiSelectDropDown
              label="Assign to company"
              value={user.assignedCompanyId || ""}
              onChange={(event) => updateUser("assignedCompanyId", event.target.value as string)}
              options={assignableCompanies}
              multiple={false}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  )
}


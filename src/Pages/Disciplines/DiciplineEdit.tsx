"use client"

import type React from "react"
import { useState } from "react"
import { useNotify, useTranslate } from "react-admin"
import { Box, Typography } from "@mui/material"
import FolderIcon from "@mui/icons-material/Folder"
import CancellButton from "../../Components/Buttons/CancellButton"
import PrimaryButton from "../../Components/Buttons/PrimaryButton"
import { TextField } from "../../Components/TextField"
import supabaseClient from "../../supabaseClient"

interface DisciplineEditProps {
  setIsPopupOpen: (isOpen: boolean) => void
  id: string
  existingName: string
  onSuccess: () => void
}

const DisciplineEdit: React.FC<DisciplineEditProps> = ({ setIsPopupOpen, id, existingName, onSuccess }) => {
  const notify = useNotify()
  const translate = useTranslate()
  const [name, setName] = useState(existingName)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return

    setIsSubmitting(true)
    // Update database with new name for the given discipline
    const { data, error } = await supabaseClient.from("disciplines").update({ name }).eq("id", id)

    setIsSubmitting(false)

    if (error) {
      notify(translate("Error updating discipline"), { type: "error" })
      console.error("Error updating discipline:", error)
    } else {
      notify(translate("Safety File updated successfully"), { type: "success" })
      setIsPopupOpen(false)
      onSuccess()
    }
  }

  const handleCancel = () => {
    setIsPopupOpen(false)
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        width: "100%",
        padding: "24px",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          backgroundColor: "#005eb8",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FolderIcon sx={{ fontSize: 32, color: "white" }} />
      </Box>

      <Typography variant="h6" component="h2">
        Edit Safety file
      </Typography>

      <TextField
        label="Name"
        fullWidth
        style={{ marginTop: "16px", marginBottom: "16px" }}
        onChange={(e) => setName(e.target.value)}
        value={name}
        error={!name.trim()}
        helperText={!name.trim() ? "Name is required" : ""}
      />

      <Box
        sx={{
          display: "flex",
          gap: 2,
          width: "100%",
          mt: 3,
          "& > button": {
            flex: 1,
          },
        }}
      >
        <CancellButton label="Cancel" onClick={handleCancel} />
        <PrimaryButton label="Save" onClick={handleSave} disabled={!name.trim() || isSubmitting} />
      </Box>
    </Box>
  )
}

export default DisciplineEdit


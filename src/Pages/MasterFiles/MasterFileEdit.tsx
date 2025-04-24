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

interface MasterFileEditProps {
  setIsPopupOpen: (isOpen: boolean) => void
  id: string
  existingName: string
  onSuccess: () => void
}

const MasterFileEdit: React.FC<MasterFileEditProps> = ({ setIsPopupOpen, id, existingName, onSuccess }) => {
  const notify = useNotify()
  const translate = useTranslate()
  const [name, setName] = useState(existingName)

  const handleSave = async () => {
    const { data, error } = await supabaseClient.from("master_files").update({ name }).eq("id", id)

    if (error) {
      notify(translate("Error updating Master Folder"), { type: "error" })
      console.error("Error updating Master Folder:", error)
    } else {
      notify(translate("Master Folder updated successfully"), { type: "success" })
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
        Edit Master Folder
      </Typography>

      <TextField
        label="Name"
        fullWidth
        style={{ marginTop: "16px", marginBottom: "16px" }}
        onChange={(e) => setName(e.target.value)}
        value={name}
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
        <PrimaryButton label="Save" onClick={handleSave} />
      </Box>
    </Box>
  )
}

export default MasterFileEdit


import React from "react"
import { Box, Typography, IconButton, Button, styled } from "@mui/material"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"

interface PageNavProps {
  title: string
  onBack?: () => void
  onNext?: () => void
  isNextDisabled?: boolean
  onSave?: () => void
  saveButtonText?: string
  isSaveDisabled?: boolean // New prop to disable the save button
}

const NavContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "5px 24px",
  backgroundColor: "transparent",
  width: "100%",
}))

const Title = styled(Typography)(({ theme }) => ({
  fontSize: "24px",
  fontWeight: "bold",
  color: "#111827",
  flex: 1,
  textAlign: "center",
}))

const BackButton = styled(IconButton)(({ theme }) => ({
  padding: "8px",
  color: "#111827",
  "&:hover": {
    backgroundColor: "transparent",
  },
}))

export const PageNav = ({
  title,
  onBack,
  onSave,
  onNext,
  isNextDisabled = false,
  saveButtonText = "Save",
  isSaveDisabled = false, // Default value is false
}: PageNavProps) => {
  return (
    <NavContainer>
      <BackButton onClick={onBack} size="small">
        <ChevronLeftIcon sx={{ fontSize: "40px", color: "#b8bbc2" }} />
      </BackButton>

      <Title variant="h6">{title}</Title>

      {/* Custom Save Button */}
      {onSave && (
        <Button
          variant="contained"
          onClick={onSave}
          disabled={isSaveDisabled} // Use the new prop here
          sx={{
            textTransform: "none",
            fontSize: "14px",
            backgroundColor: "#015fa3",
            padding: "12px 16px",
            "&:disabled": {
              backgroundColor: "#b8bbc2", // Change color when disabled
              color: "#ffffff", // Ensure text is visible when disabled
            },
          }}
        >
          {saveButtonText}
        </Button>
      )}
    </NavContainer>
  )
}


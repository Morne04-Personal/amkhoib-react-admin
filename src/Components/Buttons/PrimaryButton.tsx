import type React from "react"
import Button from "@mui/material/Button"
import { styled } from "@mui/system"

const StyledButton = styled(Button)(({ disabled }) => ({
  backgroundColor: disabled ? "#cccccc" : "#005eb8", // Gray when disabled, blue when enabled
  color: disabled ? "#666666" : "#ffffff", // Darker gray text when disabled, white when enabled
  borderRadius: "8px",
  padding: "8px 16px",
  textTransform: "none",
  "&:hover": {
    backgroundColor: disabled ? "#cccccc" : "#004a99", // No hover effect when disabled
  },
}))

interface PrimaryButtonProps {
  label: string
  onClick?: () => void
  type?: "button" | "submit" | "reset"
  disabled?: boolean // New prop for disabling the button
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onClick,
  type = "button",
  disabled = false, // Default to false (enabled)
}) => (
  <StyledButton variant="contained" onClick={onClick} type={type} disabled={disabled}>
    {label}
  </StyledButton>
)

export default PrimaryButton


import { Button, type ButtonProps, styled } from "@mui/material"
import type { ReactNode } from "react"

interface OutlinedButtonProps extends ButtonProps {
  buttonText?: ReactNode
}

const StyledButton = styled(Button)(({ theme }) => ({
  border: `1px dashed #b7e1f0`,
  color: "#0a5e9f",
  padding: theme.spacing(1.5, 3),
  fontWeight: 700,
  textTransform: "none",
  width: "100%", // Make the button full width by default
  "&:hover": {
    border: `1px dashed #0a5e9f`,
    background: "rgba(10, 94, 159, 0.04)",
  },
}))

export const OutlinedButton = ({ buttonText = "Add a contractor", sx, ...props }: OutlinedButtonProps) => {
  return (
    <StyledButton
      variant="outlined"
      sx={sx} // Apply custom sx prop
      {...props}
    >
      {buttonText}
    </StyledButton>
  )
}

export default OutlinedButton


import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Container, Box, Typography, Button } from "@mui/material"
import { useNotify } from "react-admin"
import { TextFieldAuth } from "./TextFieldAuth"
import logo from "../media/A-icon.png"
import supabaseClient from "../supabaseClient"

export const CustomResetPasswordPage = () => {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const navigate = useNavigate()
  const notify = useNotify()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      notify("Passwords do not match", { type: "error" })
      return
    }

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: password,
      })
      if (error) throw error
      notify("Password reset successfully", { type: "success" })
      navigate("/login")
    } catch (error) {
      notify(error.message || "An error occurred while resetting the password", { type: "error" })
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#071135",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              mb: 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={logo || "/placeholder.svg"}
              alt="Logo"
              style={{ width: "150px", height: "150px", borderRadius: "50%", marginBottom: "50px" }}
            />
          </Box>
          <Typography component="h1" variant="h5" sx={{ color: "white" }}>
            Reset Your Password
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: "100%" }}>
            <TextFieldAuth
              required
              name="password"
              label="New Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextFieldAuth
              required
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                backgroundColor: "#0066CC",
                borderRadius: "8px",
                padding: "12px",
                textTransform: "none",
                fontSize: "16px",
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: "#0052a3",
                },
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              Reset Password
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default CustomResetPasswordPage

CustomResetPasswordPage.path = "/password-reset"


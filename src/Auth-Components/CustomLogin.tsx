"use client"

import type React from "react"
import { useState } from "react"
import { useLogin, useNotify, useRedirect } from "react-admin"
import { Button, Container, Box, Typography } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { TextFieldAuth } from "./TextFieldAuth"
import logo from "../media/A-icon.png"
import supabaseClient from "../supabaseClient"
import { useToast } from "../Components/Toast/ToastContext"

const CustomLogin = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const login = useLogin()
  const navigate = useNavigate()
  const notify = useNotify()
  const redirect = useRedirect()
  const { showMessage } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // First, authenticate with Supabase
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // If authentication is successful, check if the user is active
      if (authData.user) {
        const { data: userData, error: userError } = await supabaseClient
          .from("users")
          .select("is_active")
          .eq("id", authData.user.id)
          .single()

        if (userError) throw userError

        // If user is not active, sign them out and show error toast
        if (!userData.is_active) {
          await supabaseClient.auth.signOut()
          showMessage("Your account is inactive. Please contact support.", "error")
          setIsLoading(false)
          return
        }

        // If user is active, proceed with login
        await login({ email, password })

        // Store user data in localStorage
        localStorage.setItem(
          "userData",
          JSON.stringify({
            id: authData.user.id,
            email: authData.user.email,
            is_active: userData.is_active,
            // Add other user data as needed
          }),
        )

        showMessage("Login successful", "success")
        redirect("/")
      }
    } catch (error: any) {
      const errorDescription = error?.message || "Your password is incorrect. Please try again."
      showMessage(errorDescription, "error")
      console.error("Login failed", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPasswordClick = () => {
    navigate("/forgot-password")
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
            Log into Amkhoib's Admin Portal
          </Typography>
          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: "100%" }}>
            <TextFieldAuth
              required
              id="email"
              label="Email"
              source="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              disabled={isLoading}
            />
            <TextFieldAuth
              required
              name="password"
              label="Password"
              source="password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              disabled={isLoading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
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
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </Box>
          <Typography
            component="h1"
            variant="h5"
            sx={{ color: "#348dc3", cursor: "pointer", mt: 2 }}
            onClick={handleForgotPasswordClick}
          >
            Forgot Password?
          </Typography>
          <br />
          <Typography sx={{ color: "#9199b3", fontSize: "h5" }}>
            Trouble Logging in? Please contact support at
          </Typography>
          <Typography sx={{ color: "#348dc3", fontSize: "h5" }}>support@amkhoib.co.za</Typography>
        </Box>
      </Container>
    </Box>
  )
}

export default CustomLogin


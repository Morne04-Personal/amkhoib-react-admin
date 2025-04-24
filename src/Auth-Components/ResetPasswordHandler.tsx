import React, { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Box, CircularProgress, Typography } from "@mui/material"
import supabaseClient from "../supabaseClient"

export const ResetPasswordHandler = () => {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        const searchParams = new URLSearchParams(location.search)
        const token = searchParams.get("token")
        const type = searchParams.get("type")

        if (!token || type !== "recovery") {
          throw new Error("Invalid or missing token")
        }

        // Set the access token to establish a session
        const { data, error } = await supabaseClient.auth.verifyOtp({
          token_hash: token,
          type: "recovery",
        })

        if (error) throw error

        // If successful, navigate to the reset password page
        navigate("/reset-password", { replace: true })
      } catch (err) {
        console.error("Error handling password reset:", err)
        setError("Failed to process password reset. Please try again.")
      }
    }

    handlePasswordReset()
  }, [location, navigate])

  if (error) {
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
        <Typography sx={{ color: "error.main", textAlign: "center", p: 3 }}>{error}</Typography>
      </Box>
    )
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
      <CircularProgress sx={{ color: "white" }} />
    </Box>
  )
}

export default ResetPasswordHandler


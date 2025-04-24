import * as React from "react"
import { Container, Box, Typography, CardActions, Stack, styled, Button } from "@mui/material"
import { Form, useNotify, useTranslate } from "react-admin"
import logo from "../media/A-icon.png"
import { TextFieldAuth } from "./TextFieldAuth"
import { useNavigate } from "react-router-dom"
import supabaseClient from "../supabaseClient"

const PREFIX = "RaSupabaseForgotPasswordForm"

const SupabaseLoginFormClasses = {
  container: `${PREFIX}-container`,
  input: `${PREFIX}-input`,
  button: `${PREFIX}-button`,
}

const Root = styled(Form, {
  name: PREFIX,
  overridesResolver: (props, styles) => styles.root,
})(({ theme }) => ({
  [`& .${SupabaseLoginFormClasses.container}`]: {
    padding: "0 1em 0 1em",
  },
  [`& .${SupabaseLoginFormClasses.input}`]: {
    marginTop: "1em",
  },
  [`& .${SupabaseLoginFormClasses.button}`]: {
    width: "100%",
  },
}))

export const CustomForgotPasswordPage = () => {
  const navigate = useNavigate()
  const notify = useNotify()
  const translate = useTranslate()

  const submit = async (values: Record<string, any>) => {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(values.email, {
        redirectTo: `https://amkhoib.org/auth/password-reset`,
      })

      if (error) throw error

      notify("Password reset email sent successfully. Please check your email.", { type: "success" })
    } catch (error) {
      notify(
        typeof error === "string" ? error : error.message || "An error occurred while trying to reset the password.",
        { type: "warning" },
      )
    }
  }

  const handleLoginClick = () => {
    navigate("/login")
  }

  const handleResetClick = () => {
    navigate("/password-reset")
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
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                marginBottom: "50px",
              }}
            />
          </Box>
          <Typography component="h1" variant="h5" sx={{ color: "white" }}>
            Reset Your Password
          </Typography>
          <Box sx={{ mt: 1, width: "100%" }}>
            <Root onSubmit={submit}>
              <div className={SupabaseLoginFormClasses.container}>
                <Stack spacing={1}></Stack>

                <div className={SupabaseLoginFormClasses.input}>
                  <TextFieldAuth
                    source="email"
                    label={translate("ra.auth.email", {
                      _: "Email",
                    })}
                    autoComplete="email"
                    fullWidth
                    required
                  />
                </div>
              </div>
              <CardActions sx={{ flexDirection: "column", gap: 1 }}>
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
                  Send Reset Link
                </Button>
                <Typography
                  component="h1"
                  variant="h5"
                  sx={{ color: "#348dc3", cursor: "pointer" }}
                  onClick={handleLoginClick}
                >
                  Back to Login
                </Typography>

                <Typography
                  component="h1"
                  variant="h5"
                  sx={{ color: "#348dc3", cursor: "pointer" }}
                  onClick={handleResetClick}
                >
                  Reset test
                </Typography>
              </CardActions>
            </Root>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

CustomForgotPasswordPage.path = "/forgot-password"


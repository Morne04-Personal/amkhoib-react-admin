"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AppBar, Toolbar, IconButton, Box, Drawer, List, ListItem, ListItemText, useMediaQuery } from "@mui/material"
import { Link as RouterLink, useLocation } from "react-router-dom"
import { styled, useTheme } from "@mui/material/styles"
import AccountCircleIcon from "@mui/icons-material/AccountCircle"
import MenuIcon from "@mui/icons-material/Menu"
import { useLogout, useGetIdentity } from "react-admin"
import { SecondaryPopup } from "../Components/SecondaryPopup"
import { PageNav } from "../Components/PageNav"
import { TextField } from "../Components/TextField"
import { LogOutButton } from "../Components/Buttons/LogOutButton"
import Logo from "../media/Logo.png"

// Update the StyledLink component to ensure white color
const StyledLink = styled(RouterLink)(({ theme }) => ({
  textDecoration: "none",
  color: "white",
  marginRight: theme.spacing(3),
  "&:hover": {
    color: "white",
  },
}))

const ActiveLink = styled(RouterLink)(({ theme }) => ({
  textDecoration: "none",
  color: "white",
  fontWeight: "bold",
  marginRight: theme.spacing(3),
}))

// Update the MobileNavItem to explicitly set text color
const MobileNavItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(2),
  "& .MuiListItemText-primary": {
    color: "white",
  },
  "&.active": {
    backgroundColor: "rgba(0, 182, 228, 0.1)",
    "& .MuiListItemText-primary": {
      color: "white",
      fontWeight: "bolder",
    },
  },
}))

export const CustomAppBar = () => {
  const logout = useLogout()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { identity, isLoading: identityLoading } = useGetIdentity()
  const [userData, setUserData] = useState({
    name: "",
    surname: "",
    email: "",
  })

  useEffect(() => {
    if (identity) {
      // Split email into name parts if no full name is provided
      const email = identity.email || ""
      const nameParts = email.split("@")[0].split(".")

      setUserData({
        name: nameParts[0] || "",
        surname: nameParts[1] || "",
        email: identity.email || "",
      })
    }
  }, [identity])

  const isActive = (path: string) => location.pathname === path

  const handleProfileMenuOpen = () => {
    setIsPopupOpen(true)
  }

  const handleClosePopup = () => {
    setIsPopupOpen(false)
  }

  const handleLogout = () => {
    console.log("Logging out...")
    localStorage.removeItem("userData") // Clear user data from localStorage
    logout()
    setIsPopupOpen(false)
  }

  const handleInputChange = (source: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserData((prevData) => ({
      ...prevData,
      [source]: event.target.value,
    }))
  }

  const handleUpdateProfile = () => {
    // Here you would typically send an API request to update the user's profile
    console.log("Updating profile with:", userData)
    setIsPopupOpen(false)
  }

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen)
  }

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/contractors", label: "Contractors" },
    { path: "/projects", label: "Projects" },
    { path: "/users", label: "People" },
    { path: "/disciplines", label: "Safety files" },
    { path: "/master_files", label: "Master Folders" },
  ]

  const renderDesktopNav = () => (
    <>
      {navItems.map((item) =>
        isActive(item.path) ? (
          <ActiveLink key={item.path} to={item.path}>
            {item.label}
          </ActiveLink>
        ) : (
          <StyledLink key={item.path} to={item.path}>
            {item.label}
          </StyledLink>
        ),
      )}
    </>
  )

  const renderMobileNav = () => (
    <Drawer
      anchor="right"
      open={mobileNavOpen}
      onClose={toggleMobileNav}
      PaperProps={{
        sx: { width: 250, backgroundColor: "#061135", color: "white" },
      }}
    >
      <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
        <img src={Logo || "/placeholder.svg"} alt="Logo" style={{ height: 40 }} />
      </Box>
      <List>
        {navItems.map((item) => (
          <MobileNavItem
            key={item.path}
            component={RouterLink}
            to={item.path}
            onClick={toggleMobileNav}
            className={isActive(item.path) ? "active" : ""}
          >
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                style: { color: isActive(item.path) ? "white" : "white" },
              }}
            />
          </MobileNavItem>
        ))}
        <MobileNavItem
          button
          onClick={() => {
            toggleMobileNav()
            handleProfileMenuOpen()
          }}
        >
          <ListItemText primary="My Profile" />
        </MobileNavItem>
      </List>
    </Drawer>
  )

  return (
    <AppBar position="sticky" sx={{ backgroundColor: "#061135", padding: "0 20px", marginTop: -8 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <RouterLink to="/" style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src={Logo || "/placeholder.svg"} alt="Logo" style={{ height: 40, marginRight: "20px" }} />
          </div>
        </RouterLink>

        <div style={{ display: "flex", alignItems: "center" }}>
          {!isMobile && renderDesktopNav()}

          {!isMobile && (
            <IconButton edge="end" color="inherit" onClick={handleProfileMenuOpen} sx={{ marginLeft: "20px" }}>
              <AccountCircleIcon />
            </IconButton>
          )}

          {isMobile && (
            <IconButton edge="end" color="inherit" onClick={toggleMobileNav}>
              <MenuIcon />
            </IconButton>
          )}

          {renderMobileNav()}

          <SecondaryPopup open={isPopupOpen} onClose={handleClosePopup} title="" subtitle="">
            <PageNav
              title="My Profile"
              onBack={handleClosePopup}
              onSave={handleUpdateProfile}
              saveButtonText="Update"
            />
            <Box sx={{ padding: "20px" }}>
              {identityLoading ? (
                <div>Loading user data...</div>
              ) : (
                <>
                  <TextField
                    label="Name"
                    source="name"
                    value={userData.name}
                    onChange={handleInputChange("name")}
                    style={{ marginBottom: "0px" }}
                  />
                  <TextField
                    label="Surname"
                    source="surname"
                    value={userData.surname}
                    onChange={handleInputChange("surname")}
                    style={{ marginBottom: "0px" }}
                  />
                  <TextField
                    label="Email address"
                    source="email"
                    value={userData.email}
                    onChange={handleInputChange("email")}
                    style={{ marginBottom: "0px" }}
                  />
                  <LogOutButton width="35%" onClick={handleLogout} />
                </>
              )}
            </Box>
          </SecondaryPopup>
        </div>
      </Toolbar>
    </AppBar>
  )
}

export default CustomAppBar


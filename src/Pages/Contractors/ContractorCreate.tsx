"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Create, SimpleForm } from "react-admin"
import { TextField } from "../../Components/TextField"
import { Box, Grow, Checkbox, FormControlLabel, Typography, Grid } from "@mui/material"
import { ButtonRadioSelect } from "../../Components/Buttons/ButtonRadioSelect"
import { UploadImageButton } from "../../Components/Buttons/UploadImageButton"
import { PageNav } from "../../Components/PageNav"
import { useNavigate } from "react-router-dom"
import supabaseClient from "../../supabaseClient"
import { useToast } from "../../Components/Toast/ToastContext"
import DropDown from "../../Components/DropDown"
import CachedIcon from "@mui/icons-material/Cached"
import TextBox from "../../Components/TextBox"
import { SearchBox } from "../../Components/SearchBox"
import { DataGrid, type DataGridField } from "../../Components/DataGrid"
import { ListContextProvider, useListController, type RaRecord } from "react-admin"
import { ButtonShowHide } from "../../Components/Buttons/ButtonShowHide"
import styled from "@emotion/styled"
import { StickyWrapper } from "../../Components/sticky-wrapper"

interface Province {
  id: string
  province_name: string
}

interface NotificationUser {
  id: string
  first_name: string
  last_name: string
  email: string
  isSelected?: boolean
}

interface ContractorType {
  id: string
  name: string
}

interface ExistingContractor {
  id: string
  contractor_type_id: string
  contractor_multiple_types_id: string | null
}

const StyledSearchBox = styled(SearchBox)({
  "& .MuiInputBase-root": {
    backgroundColor: "#F8FAFC",
    borderRadius: "8px",
    border: "1px solid #E2E8F0",
    "&:hover": {
      backgroundColor: "#F8FAFC",
      border: "1px solid #CBD5E1",
    },
  },
})

const NotificationUserList = ({ children }: { children: React.ReactNode }) => {
  const listContext = useListController({
    resource: "notification_users",
  })
  return <ListContextProvider value={listContext}>{children}</ListContextProvider>
}

const ContractorCreate = () => {
  const navigate = useNavigate()
  const { showMessage } = useToast()

  const [contractorTypeIds, setContractorTypeIds] = useState<string[]>([])
  const [name, setName] = useState<string>("")
  const [physicalAddress, setPhysicalAddress] = useState<string>("")
  const [suburb, setSuburb] = useState<string>("")
  const [city, setCity] = useState<string>("")
  const [province, setProvince] = useState<string>("")
  const [contractorDescription, setContractorDescription] = useState<string>("")
  const [provinces, setProvinces] = useState<Province[]>([])
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [isAmkhoibContractor, setIsAmkhoibContractor] = useState<boolean>(false)
  const [showNotificationUserSearch, setShowNotificationUserSearch] = useState<boolean>(false)
  const [notificationUsers, setNotificationUsers] = useState<NotificationUser[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showSearch, setShowSearch] = useState<boolean>(true)
  const [newNotificationUser, setNewNotificationUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
  })
  const [emailError, setEmailError] = useState<string>("")
  const [contactNumberError, setContactNumberError] = useState<string>("")
  const [contractorTypes, setContractorTypes] = useState<ContractorType[]>([])

  useEffect(() => {
    const fetchContractorTypes = async () => {
      const { data, error } = await supabaseClient.from("contractor_types").select("id, name")
      if (error) {
        console.error("Error fetching contractor types:", error)
        return
      }
      setContractorTypes(data || [])
    }
    fetchContractorTypes()
  }, [])

  const handleImageUpload = (file: File) => {
    setUploadedImageFile(file)
  }

  const generateUniqueFileName = (file: File): string => {
    const fileExtension = file.name.split(".").pop()
    const randomString = Math.random().toString(36).substring(2, 15)
    const timestamp = Date.now()
    return `${randomString}_${timestamp}.${fileExtension}`
  }

  const checkFileExists = async (fileName: string): Promise<string | null> => {
    const { data, error } = await supabaseClient.storage.from("logo").list("", {
      limit: 1,
      search: fileName,
    })

    if (error) {
      console.error("Error checking file existence:", error)
      return null
    }

    if (data && data.length > 0) {
      const { publicURL, error: urlError } = supabaseClient.storage.from("logo").getPublicUrl(fileName)

      if (urlError) {
        console.error("Error getting public URL:", urlError)
        return null
      }

      return publicURL
    }

    return null
  }

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      const uniqueFileName = generateUniqueFileName(file)

      // Check if file already exists
      const existingFileUrl = await checkFileExists(uniqueFileName)
      if (existingFileUrl) {
        console.log("File already exists, using existing URL:", existingFileUrl)
        return existingFileUrl
      }

      // If file doesn't exist, upload it
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from("logo")
        .upload(uniqueFileName, file)

      if (uploadError) {
        console.error("Error uploading image:", uploadError.message)
        return null
      }

      const { data: urlData } = supabaseClient.storage.from("logo").getPublicUrl(uniqueFileName)

      console.log("Uploaded image URL:", urlData.publicUrl)
      return urlData.publicUrl
    } catch (error) {
      console.error("Exception during image upload:", error)
      return null
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  useEffect(() => {
    const fetchProvinces = async () => {
      const { data, error } = await supabaseClient.from("provinces").select("id, province_name")
      if (error) {
        console.error("Error fetching provinces:", error)
        return
      }
      setProvinces(data || [])
    }
    fetchProvinces()
  }, [])

  useEffect(() => {
    const fetchNotificationUsers = async () => {
      setLoading(true)
      try {
        let query = supabaseClient.from("notification_users").select("id, first_name, last_name, email")

        if (searchQuery) {
          query = query.or(
            `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`,
          )
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching notification users:", error)
          return
        }

        setNotificationUsers((data || []).map((user) => ({ ...user, isSelected: false })))
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    if (showNotificationUserSearch && showSearch) {
      fetchNotificationUsers()
    }
  }, [searchQuery, showNotificationUserSearch, showSearch])

  const isFormValid = () => {
    const hasSelectedUsers = isAmkhoibContractor
      ? notificationUsers.some((user) => user.isSelected) || isNewNotificationUserValid()
      : true

    return (
      contractorTypeIds.length > 0 &&
      name.trim() !== "" &&
      physicalAddress.trim() !== "" &&
      suburb.trim() !== "" &&
      city.trim() !== "" &&
      province !== "" &&
      contractorDescription.trim() !== "" &&
      hasSelectedUsers
    )
  }

  const isNewNotificationUserValid = () => {
    return (
      !showSearch &&
      newNotificationUser.firstName.trim() !== "" &&
      newNotificationUser.lastName.trim() !== "" &&
      newNotificationUser.email.trim() !== "" &&
      newNotificationUser.contactNumber.trim() !== "" &&
      !emailError &&
      !contactNumberError
    )
  }

  const checkExistingContractor = async (name: string, description: string): Promise<ExistingContractor[]> => {
    const { data, error } = await supabaseClient
      .from("contractors")
      .select("id, contractor_type_id, contractor_multiple_types_id")
      .or(`name.ilike.${name},contractor_description.ilike.${description}`)

    if (error) {
      console.error("Error checking existing contractor:", error)
      return []
    }

    return data || []
  }

  const getContractorTypeName = (typeId: string): string => {
    const contractorType = contractorTypes.find((type) => type.id === typeId)
    return contractorType ? contractorType.name : "Unknown"
  }

  // New function to get role abbreviation
  const getRoleAbbreviation = (typeId: string): string => {
    const type = contractorTypes.find((t) => t.id === typeId)
    if (!type) return ""

    // Map role names to abbreviations
    switch (type.name.toLowerCase()) {
      case "contractor":
        return "(C)"
      case "principal contractor":
        return "(PC)"
      case "sub-contractor":
        return "(SC)"
      default:
        return `(${type.name.charAt(0).toUpperCase()})`
    }
  }

  const handleOnSave = async () => {
    if (!isFormValid()) {
      showMessage("Please fill in all required fields", "error")
      return
    }

    setLoading(true)

    try {
      // Upload image first
      let logoUrl: string | null = null
      if (uploadedImageFile) {
        try {
          logoUrl = (await Promise.race([
            uploadImageToStorage(uploadedImageFile),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Image upload timed out")), 30000)),
          ])) as string | null
        } catch (error) {
          console.error("Error uploading image:", error)
          showMessage("Error uploading image. Please try again.", "error")
          setLoading(false)
          return
        }
      }

      const existingContractors = await checkExistingContractor(name, contractorDescription)

      if (existingContractors.length > 0) {
        // Handle existing contractors
        const existingTypes = existingContractors.map((c) => c.contractor_type_id)
        const newTypes = contractorTypeIds.filter((id) => !existingTypes.includes(id))

        if (newTypes.length === 0) {
          const existingTypeNames = existingTypes.map(getContractorTypeName).join(", ")
          const availableTypes = contractorTypes
            .filter((type) => !existingTypes.includes(type.id))
            .map((type) => type.name)
            .join(", ")

          showMessage(
            `A contractor with this name or description already exists with the following type(s): ${existingTypeNames}. ` +
              `You can only create this contractor with the following type(s): ${availableTypes || "None available"}`,
            "error",
          )
          setLoading(false)
          return
        }

        const existingMultipleTypesId = existingContractors.find(
          (c) => c.contractor_multiple_types_id,
        )?.contractor_multiple_types_id

        const multipleTypesId = existingMultipleTypesId || existingContractors[0].id

        // Update existing contractors if they don't have a contractor_multiple_types_id
        for (const c of existingContractors.filter((c) => !c.contractor_multiple_types_id)) {
          try {
            await supabaseClient
              .from("contractors")
              .update({ contractor_multiple_types_id: multipleTypesId })
              .eq("id", c.id)
          } catch (error) {
            console.error(`Error updating existing contractor ${c.id}:`, error)
          }
        }

        // Insert new contractors for each new type
        const contractorsData = []
        for (const typeId of newTypes) {
          try {
            const roleAbbreviation = getRoleAbbreviation(typeId)
            const nameWithRole = `${name} ${roleAbbreviation}`

            const { data, error } = await supabaseClient
              .from("contractors")
              .insert({
                contractor_type_id: typeId,
                name: nameWithRole,
                physical_address: physicalAddress,
                suburb,
                city,
                province,
                logo_url: logoUrl,
                contractor_description: contractorDescription,
                is_amkhoib_contractor: isAmkhoibContractor,
                contractor_multiple_types_id: multipleTypesId,
              })
              .select()
              .single()

            if (error) throw error
            contractorsData.push(data)
          } catch (error) {
            console.error(`Error inserting new contractor type ${typeId}:`, error)
          }
        }

        await handleAmkhoibContractor(contractorsData)
      } else {
        // This is a completely new contractor
        const contractorsData = []
        for (const typeId of contractorTypeIds) {
          try {
            const roleAbbreviation = getRoleAbbreviation(typeId)
            const nameWithRole = `${name} ${roleAbbreviation}`

            const { data, error } = await supabaseClient
              .from("contractors")
              .insert({
                contractor_type_id: typeId,
                name: nameWithRole,
                physical_address: physicalAddress,
                suburb,
                city,
                province,
                logo_url: logoUrl,
                contractor_description: contractorDescription,
                is_amkhoib_contractor: isAmkhoibContractor,
                contractor_multiple_types_id: contractorsData.length > 0 ? contractorsData[0].id : null,
              })
              .select()
              .single()

            if (error) throw error
            contractorsData.push(data)
          } catch (error) {
            console.error(`Error inserting new contractor type ${typeId}:`, error)
          }
        }

        await handleAmkhoibContractor(contractorsData)
      }

      showMessage("Your contractor(s) have been added successfully", "success")
      navigate("/contractors")
    } catch (error) {
      console.error("Error saving:", error)
      showMessage("Error saving contractor(s)", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleAmkhoibContractor = async (contractorsData: any[]) => {
    if (isAmkhoibContractor) {
      if (!showSearch && isNewNotificationUserValid()) {
        const { data: newUser, error: newUserError } = await supabaseClient
          .from("notification_users")
          .insert({
            first_name: newNotificationUser.firstName,
            last_name: newNotificationUser.lastName,
            email: newNotificationUser.email,
            contact_number: newNotificationUser.contactNumber,
          })
          .select()
          .single()

        if (newUserError) throw newUserError

        const linkPromises = contractorsData.map((contractorData) =>
          supabaseClient.from("contractor_notification_users").insert({
            contractor_id: contractorData.id,
            notification_user_id: newUser.id,
          }),
        )

        await Promise.all(linkPromises)
      }

      const selectedUsers = notificationUsers.filter((user) => user.isSelected)
      if (selectedUsers.length > 0) {
        const linkPromises = contractorsData.flatMap((contractorData) =>
          selectedUsers.map((user) =>
            supabaseClient.from("contractor_notification_users").insert({
              contractor_id: contractorData.id,
              notification_user_id: user.id,
            }),
          ),
        )

        await Promise.all(linkPromises)
      }
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleNotificationUserSelect = (userId: string) => {
    setNotificationUsers((users) =>
      users.map((user) => (user.id === userId ? { ...user, isSelected: !user.isSelected } : user)),
    )
  }

  const notificationUserFields: DataGridField[] = [
    {
      source: "isSelected",
      label: "",
      type: "custom",
      render: (record: RaRecord) => (
        <Checkbox
          checked={(record as NotificationUser).isSelected || false}
          onChange={() => record.id && handleNotificationUserSelect(record.id.toString())}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    { source: "first_name", label: "First Name", type: "custom" },
    { source: "last_name", label: "Last Name", type: "custom" },
    { source: "email", label: "Email", type: "custom" },
  ]

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidPhoneNumber = (number: string): boolean => {
    const saPhoneNumberRegex = /^(?:\+27|0)[6-8][0-9]{8}$/
    return saPhoneNumberRegex.test(number)
  }

  const updateNewNotificationUser = (field: string, value: string) => {
    setNewNotificationUser((prev) => ({ ...prev, [field]: value }))

    if (field === "email") {
      setEmailError(isValidEmail(value) ? "" : "Invalid email address")
    } else if (field === "contactNumber") {
      setContactNumberError(isValidPhoneNumber(value) ? "" : "Invalid South African phone number")
    }
  }

  return (
    <Create resource="contractors">
      <Grow in={true} timeout={500}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            backgroundColor: "#f0f2f5",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "750px",
              borderRadius: "8px",
              padding: "24px",
            }}
          >
            <StickyWrapper>
              <PageNav
                title="What are your contractor details?"
                onBack={handleBack}
                onSave={handleOnSave}
                saveButtonText="Add contractor"
                isSaveDisabled={!isFormValid() || loading}
              />
            </StickyWrapper>
            <SimpleForm toolbar={false} sx={{ width: "100%" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                  <Typography
                    component="label"
                    sx={{ fontSize: "0.875rem", fontWeight: 800, marginRight: "10%", marginLeft: "2%" }}
                  >
                    Role(s)
                  </Typography>
                  <ButtonRadioSelect
                    source="contractor_type_id"
                    reference="contractor_types"
                    value={contractorTypeIds}
                    onChange={(newValue) => setContractorTypeIds(newValue)}
                    options={contractorTypes}
                  />
                </Grid>
              </Grid>

              <TextField
                source="name"
                label="Company legal name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextBox
                source="contractor_description"
                label="Contractor Description"
                value={contractorDescription}
                onChange={(e) => setContractorDescription(e.target.value)}
              />
              <TextField
                source="physical_address"
                label="Street"
                value={physicalAddress}
                onChange={(e) => setPhysicalAddress(e.target.value)}
              />
              <TextField source="suburb" label="Suburb" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
              <TextField source="city" label="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <DropDown
                label="Province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                options={provinces.map((p) => ({ value: p.id, label: p.province_name }))}
                sx={{ width: "50%" }}
              />

              <Box sx={{ marginTop: "16px", marginBottom: "16px", textAlign: "center" }}>
                {uploadedImageFile ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <Box
                      sx={{
                        width: "150px",
                        height: "150px",
                        borderRadius: "50%",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={URL.createObjectURL(uploadedImageFile) || "/placeholder.svg"}
                        alt="Uploaded"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#1976d2",
                      }}
                      onClick={() => document.getElementById("image-upload-input")?.click()}
                    >
                      <CachedIcon sx={{ fontSize: "32px" }} />
                    </Box>

                    <input
                      type="file"
                      id="image-upload-input"
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload(e.target.files[0])
                        }
                      }}
                    />
                  </Box>
                ) : (
                  <UploadImageButton onImageUpload={handleImageUpload} />
                )}
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAmkhoibContractor}
                    onChange={(e) => {
                      setIsAmkhoibContractor(e.target.checked)
                      setShowNotificationUserSearch(e.target.checked)
                    }}
                    color="primary"
                  />
                }
                label="Set as Amkhoib's contractor"
              />

              {showNotificationUserSearch && (
                <Box sx={{ mt: 2, width: "100%" }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Person Responsible for escalations
                  </Typography>
                  <Box sx={{ mt: 2, mb: 2, display: "flex", justifyContent: "flex-start" }}>
                    <ButtonShowHide
                      text={showSearch ? "I can't find my person" : "Back to search"}
                      onClick={() => setShowSearch(!showSearch)}
                      sx={{
                        backgroundColor: "#DBEAFE",
                        color: "#235e84",
                        "&:hover": {
                          backgroundColor: "#e0effa",
                        },
                      }}
                    />
                  </Box>
                  {showSearch ? (
                    <>
                      <StyledSearchBox placeholder="Search" fullWidth onSearch={handleSearch} sx={{ width: "100%" }} />
                      <Box sx={{ height: "280px", overflow: "auto", mt: 2, width: "100%" }}>
                        <NotificationUserList>
                          <DataGrid
                            fields={notificationUserFields}
                            data={notificationUsers}
                            onRowClick={handleNotificationUserSelect}
                            hidePagination
                            hideColumnNames={false}
                            sx={{ width: "100%" }}
                          />
                        </NotificationUserList>
                      </Box>
                    </>
                  ) : (
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <TextField
                          source="first_name"
                          label="Name"
                          value={newNotificationUser.firstName}
                          onChange={(e) => updateNewNotificationUser("firstName", e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          source="last_name"
                          label="Surname"
                          value={newNotificationUser.lastName}
                          onChange={(e) => updateNewNotificationUser("lastName", e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          source="email"
                          label="Email address"
                          value={newNotificationUser.email}
                          onChange={(e) => updateNewNotificationUser("email", e.target.value)}
                          required
                          error={Boolean(emailError)}
                          helperText={emailError}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          source="contact_number"
                          label="Contact number"
                          value={newNotificationUser.contactNumber}
                          onChange={(e) => {
                            const input = e.target.value
                            if (/^\d*$/.test(input)) {
                              updateNewNotificationUser("contactNumber", input)
                            }
                          }}
                          error={Boolean(contactNumberError)}
                          helperText={contactNumberError}
                          sx={{ width: "50%" }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Box>
              )}
            </SimpleForm>
          </Box>
        </Box>
      </Grow>
    </Create>
  )
}

export default ContractorCreate


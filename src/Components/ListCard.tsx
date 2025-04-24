"use client"

import type React from "react"
import { Card, Typography, Box, IconButton, styled, Avatar } from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  backgroundColor: theme.palette.background.paper,
  borderRadius: "8px",
  boxShadow: "none",
  display: "flex",
  flexDirection: "column",
}))

// Header section that stays fixed
const CardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingBottom: 0,
}))

// Scrollable content area
const ScrollableContent = styled(Box)(({ theme }) => ({
  maxHeight: "500px", // Default max height
  overflowY: "auto",
  padding: theme.spacing(2),
  paddingTop: theme.spacing(1),
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: theme.palette.background.default,
    borderRadius: "3px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: theme.palette.divider,
    borderRadius: "3px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: theme.palette.action.hover,
  },
}))

const LogoContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  justifyContent: "flex-start",
  marginBottom: theme.spacing(2),
  position: "relative",
  "& .MuiAvatar-root": {
    width: 120,
    height: 120,
  },
}))

const EditButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  right: theme.spacing(1),
  color: "#2688be",
}))

// New styled component for truncated title
const TruncatedTitle = styled(Typography)(({ theme }) => ({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "calc(100% - 40px)", // Leave space for edit button
}))

interface InfoRowProps {
  showSeparator?: boolean
}

const InfoRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== "showSeparator",
})<InfoRowProps>(({ theme, showSeparator }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  borderBottom: showSeparator ? `1px solid ${theme.palette.divider}` : "none",
  "&:last-child": {
    marginBottom: 0,
    paddingBottom: 0,
  },
}))

const RowContent = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "130px 1fr",
  gap: theme.spacing(1),
  alignItems: "start",
}))

const Label = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 500,
  fontSize: "0.95rem",
  lineHeight: 1.2,
}))

const SubLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 400,
  fontSize: "0.875rem",
  marginTop: theme.spacing(0.25),
  lineHeight: 1.2,
}))

const Value = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.25),
  alignItems: "flex-end",
}))

const CompanyName = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 500,
  fontSize: "0.95rem",
  marginBottom: theme.spacing(0.25),
  lineHeight: 1.2,
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 500,
  fontSize: "0.875rem",
  letterSpacing: "0.1em",
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1.5),
  lineHeight: 1.2,
}))

interface InfoItem {
  label: React.ReactNode
  subLabel?: string
  value: React.ReactNode
  companyName?: string
}

interface Section {
  title: string
  items: InfoItem[]
  showSeparators?: boolean
}

interface ListCardProps {
  showLogo?: boolean
  logo?: string | null
  title: string
  sections?: Section[]
  infoItems?: InfoItem[]
  onEdit?: () => void
  maxHeight?: number | string
  maxTitleLength?: number
}

const ListCard: React.FC<ListCardProps> = ({
  showLogo = true,
  logo = "/placeholder.svg?height=120&width=120",
  title,
  sections,
  infoItems,
  onEdit,
  maxHeight = "70vh",
  maxTitleLength = 50, // Default max length before truncation
}) => {
  // Function to truncate title if needed
  const displayTitle = title.length > maxTitleLength 
    ? `${title.substring(0, maxTitleLength)}...` 
    : title;
    
  return (
    <StyledCard>
      {/* Fixed header section with logo and title */}
      <CardHeader>
        {showLogo && (
          <LogoContainer>
            <Avatar src={logo || undefined} alt={title} />
            {onEdit && (
              <EditButton size="small" onClick={onEdit}>
                <EditIcon />
              </EditButton>
            )}
          </LogoContainer>
        )}

        <Box sx={{ position: "relative", mb: 2 }}>
          <TruncatedTitle 
            variant="h5" 
            component="h2" 
            gutterBottom
            title={title} // Full title as tooltip on hover
          >
            {displayTitle}
          </TruncatedTitle>
          {!showLogo && onEdit && (
            <EditButton size="small" onClick={onEdit}>
              <EditIcon />
            </EditButton>
          )}
        </Box>
      </CardHeader>

      {/* Scrollable content section */}
      <ScrollableContent sx={{ maxHeight }}>
        {sections
          ? sections.map((section, sectionIndex) => (
              <Box key={sectionIndex}>
                <SectionTitle>{section.title}</SectionTitle>
                {section.items.map((item, index) => (
                  <InfoRow key={index} showSeparator={section.showSeparators && index !== section.items.length - 1}>
                    <RowContent>
                      <Box>
                        <Label>{item.label}</Label>
                        {item.subLabel && <SubLabel>{item.subLabel}</SubLabel>}
                      </Box>
                      <Value>
                        {item.companyName && <CompanyName>{item.companyName}</CompanyName>}
                        {item.value}
                      </Value>
                    </RowContent>
                  </InfoRow>
                ))}
              </Box>
            ))
          : infoItems?.map((item, index) => (
              <InfoRow key={index}>
                <RowContent>
                  <Box>
                    <Label>{item.label}</Label>
                    {item.subLabel && <SubLabel>{item.subLabel}</SubLabel>}
                  </Box>
                  <Value>
                    {item.companyName && <CompanyName>{item.companyName}</CompanyName>}
                    {item.value}
                  </Value>
                </RowContent>
              </InfoRow>
            ))}
      </ScrollableContent>
    </StyledCard>
  )
}

export default ListCard
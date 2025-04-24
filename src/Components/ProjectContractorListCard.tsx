import type React from "react"
import { Card, Typography, Box, IconButton } from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import { Chip, type ChipProps as BaseChipProps } from "./Chips/Chip"

interface ChipProps extends BaseChipProps {
  label?: string
  backgroundColor?: string
  textColor?: string
  fontWeight?: number
  customContent?: React.ReactNode
  border?: string
}

interface ProjectContractorListCardProps {
  title: string
  subtitle: string
  imageUrl: string
  onClick?: () => void
  chipProps?: ChipProps[]
  showChip?: boolean
  contractorType?: string
  onDelete?: () => void
  hasImage?: boolean
  sx?: React.CSSProperties
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export const ProjectContractorListCard: React.FC<ProjectContractorListCardProps> = ({
  title = "Group Five",
  subtitle = "Ayanda Mthembu",
  imageUrl = "https://via.placeholder.com/80",
  onClick,
  chipProps = [],
  showChip = false,
  contractorType,
  onDelete,
  hasImage = true,
  sx = {},
}) => {
  const truncatedTitle = truncateText(title, 18)

  const getChipColors = (type: string): { backgroundColor: string; textColor: string; border: string } => {
    switch (type) {
      case "Principle contractor":
        return { backgroundColor: "#ddebf6", textColor: "#206390", border: "transparent" }
      case "Contractor":
        return { backgroundColor: "#ddebf7", textColor: "#228bc8", border: "transparent" }
      case "Multiple Types":
        return { backgroundColor: "#d7deeb", textColor: "#071135", border: "1px solid red" }
      default:
        return { backgroundColor: "#e4e9ee", textColor: "#228bc8", border: "transparent" }
    }
  }

  return (
    <Card
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        padding: 2,
        borderRadius: 2,
        boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.1)",
        maxWidth: 390,
        maxHeight: 80,
        minHeight: 80,
        transition: "all 0.2s ease-in-out",
        overflow: "visible",
        "&:hover": {
          boxShadow: onClick ? "0px 4px 8px rgba(0, 0, 0, 0.1)" : "0px 2px 4px rgba(0, 0, 0, 0.05)",
          transform: onClick ? "translateY(-2px)" : "none",
        },
        cursor: onClick ? "pointer" : "default",
        ...sx,
      }}
      onClick={onClick}
    >
      {/* Delete Button */}
      {onDelete && (
        <IconButton
          size="small"
          sx={{
            position: "absolute",
            top: -8,
            right: -8,
            zIndex: 1,
            backgroundColor: "white",
            boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.2)",
            transition: "background-color 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(253, 0, 0, 0.57)",
            },
          }}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}

      {/* Text content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Typography
          variant="h5"
          component="div"
          sx={{ fontWeight: "bold", color: "text.primary", fontSize: "14px" }}
          title={title}
        >
          {truncatedTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
        <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {contractorType && chipProps?.customContent ? (
            chipProps.customContent
          ) : (
            <Chip
              label={contractorType || chipProps?.label}
              sx={{
                backgroundColor: chipProps?.backgroundColor || getChipColors(contractorType || "").backgroundColor,
                color: chipProps?.textColor || getChipColors(contractorType || "").textColor,
                fontWeight: chipProps?.fontWeight || 600,
              }}
            />
          )}
          {showChip && chipProps.map((props, index) => <Chip key={index} {...props} />)}
        </Box>
      </Box>

      {/* Image */}
      {hasImage && (
        <Box
          component="img"
          src={imageUrl}
          alt={`${title} logo`}
          sx={{
            height: 50,
            width: 50,
            borderRadius: "50px",
            objectFit: "cover",
            marginLeft: 2,
          }}
        />
      )}
    </Card>
  )
}

export default ProjectContractorListCard


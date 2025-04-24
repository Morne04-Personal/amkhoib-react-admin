"use client"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Typography,
  Paper,
  useTheme,
  alpha,
  CircularProgress,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import AccountTreeIcon from "@mui/icons-material/AccountTree"
import { ProjectContractorListCard } from "../../Components/ProjectContractorListCard"
import type { JSX } from "react"
import supabaseClient from "../../supabaseClient"
// First, import the EmbeddedComponentPopup component
import { EmbeddedComponentPopup } from "../../Components/EmbeddedComponentPopup"

interface ContractorNode {
  id: string
  name: string
  type: string
  logo_url?: string | null
  subContractors?: ContractorNode[]
}

interface HierarchyModalProps {
  open: boolean
  onClose: () => void
  mainContractor: ContractorNode | null
}

interface ContractorLogo {
  id: string
  logo_url: string | null
}

const HierarchyModal = ({ open, onClose, mainContractor }: HierarchyModalProps) => {
  const theme = useTheme()
  const [contractorLogos, setContractorLogos] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState<boolean>(true)

  // Use a reliable placeholder image URL
  const placeholderImage = "https://placehold.co/80x80"

  // Collect all contractor IDs from the hierarchy tree
  const collectContractorIds = (node: ContractorNode | null): string[] => {
    if (!node) return []

    const ids = [node.id]

    if (node.subContractors && node.subContractors.length > 0) {
      node.subContractors.forEach((subNode) => {
        ids.push(...collectContractorIds(subNode))
      })
    }

    return ids
  }

  // Fetch contractor logos from Supabase
  useEffect(() => {
    const fetchContractorLogos = async () => {
      if (!mainContractor || !open) return

      setLoading(true)

      try {
        // Get all contractor IDs in the hierarchy
        const contractorIds = collectContractorIds(mainContractor)

        if (contractorIds.length === 0) {
          setLoading(false)
          return
        }

        // Fetch logos for all contractors in one query
        const { data, error } = await supabaseClient.from("contractors").select("id, logo_url").in("id", contractorIds)

        if (error) {
          console.error("Error fetching contractor logos:", error)
          setLoading(false)
          return
        }

        // Create a map of contractor ID to logo URL
        const logoMap: Record<string, string | null> = {}
        data.forEach((contractor: ContractorLogo) => {
          logoMap[contractor.id] = contractor.logo_url
        })

        setContractorLogos(logoMap)
      } catch (error) {
        console.error("Error in fetchContractorLogos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContractorLogos()
  }, [mainContractor, open])

  const getLogoUrl = (contractorId: string): string => {
    return contractorLogos[contractorId] || placeholderImage
  }

  const renderNode = (node: ContractorNode, isRoot = false) => (
    <Paper
      elevation={3}
      sx={{
        borderRadius: "12px",
        overflow: "hidden",
        transition: "all 0.2s ease-in-out",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[6],
          borderColor: alpha(theme.palette.primary.main, 0.3),
        },
        ...(isRoot && {
          borderColor: alpha(theme.palette.primary.main, 0.3),
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
        }),
      }}
    >
      <ProjectContractorListCard
        title={node.name}
        subtitle=""
        contractorType={node.type}
        imageUrl={getLogoUrl(node.id)}
        hasImage={true}
      />
    </Paper>
  )

  const renderTree = (node: ContractorNode, level = 0): JSX.Element => {
    const isRoot = level === 0
    const hasChildren = node.subContractors && node.subContractors.length > 0

    return (
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: isRoot ? 0 : 4,
          width: "100%",
        }}
      >
        <Box sx={{ zIndex: 2, minWidth: "280px", maxWidth: "320px" }}>{renderNode(node, isRoot)}</Box>

        {hasChildren && (
          <>
            {/* Vertical connector line */}
            <Box
              sx={{
                height: "24px",
                width: "2px",
                background: `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.6)}, ${alpha(theme.palette.primary.main, 0.2)})`,
                my: 1,
                zIndex: 1,
              }}
            />

            {/* Horizontal connector line for multiple children */}
            {node.subContractors!.length > 1 && (
              <Box
                sx={{
                  position: "relative",
                  width: `${Math.min(node.subContractors!.length * 320, 1000)}px`,
                  height: "2px",
                  background: `linear-gradient(to right, transparent 0%, ${alpha(theme.palette.primary.main, 0.3)} 50%, transparent 100%)`,
                  mb: 1,
                  zIndex: 1,
                }}
              />
            )}

            {/* Children container */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 4,
                width: "100%",
                px: 2,
              }}
            >
              {node.subContractors!.map((subNode) => (
                <Box
                  key={subNode.id}
                  sx={{
                    position: "relative",
                    minWidth: "280px",
                    maxWidth: "320px",
                  }}
                >
                  {renderTree(subNode, level + 1)}

                  {/* Vertical connector to parent */}
                  {node.subContractors!.length > 1 && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: "-24px",
                        left: "50%",
                        width: "2px",
                        height: "24px",
                        background: `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.main, 0.6)})`,
                        transform: "translateX(-50%)",
                        zIndex: 1,
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    )
  }


    return (
      <EmbeddedComponentPopup
        open={open}
        onClose={onClose}
        title=""
        width={1200} // Adjust this value as needed for "lg" equivalent
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
          }}
        >
          <AccountTreeIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Project Structure
          </Typography>
        </Box>
    
        <Box
          sx={{
            overflowX: "auto",
            background: alpha(theme.palette.background.default, 0.5),
            borderRadius: "8px",
            p: 3,
          }}
        >
          <Box
            sx={{
              minWidth: "100%",
              display: "flex",
              justifyContent: "center",
              py: 2,
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                <CircularProgress />
              </Box>
            ) : mainContractor ? (
              renderTree(mainContractor)
            ) : (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: "12px",
                  border: `1px dashed ${theme.palette.divider}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.7),
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  No hierarchy data available
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </EmbeddedComponentPopup>
    )
}

export default HierarchyModal


"use client"

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import {
  Box,
  Typography,
  Grow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Modal,
  IconButton,
} from "@mui/material"
import CheckIcon from "@mui/icons-material/Check"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { Breadcrumbs } from "../../Components/Breadcrumbs"
import { SearchBox } from "../../Components/SearchBox"
import supabaseClient from "../../supabaseClient"
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer"
import CloseIcon from "@mui/icons-material/Close"

interface Document {
  id: string
  title: string
  file_name: string
  code: string
  revision_date: string
  revision_numb: number
  path: string
  master_file_id: string | null
  isLinked?: boolean
  notification_frequency?: {
    id: number
    frequency: string
  }
}

interface Discipline {
  id: string
  name: string
  created_at: string
}

interface MasterFile {
  id: string
  name: string
  created_at: string
  hasDocumentLink?: boolean
}

export const DisciplineDetailView = () => {
  const { id } = useParams<{ id: string }>()
  const [discipline, setDiscipline] = useState<Discipline | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [masterFiles, setMasterFiles] = useState<MasterFile[]>([])
  const [filteredMasterFiles, setFilteredMasterFiles] = useState<MasterFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMasterFile, setSelectedMasterFile] = useState<string | null>(null)
  const [isDocumentListVisible, setIsDocumentListVisible] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: disciplineData, error: disciplineError } = await supabaseClient
          .from("disciplines")
          .select("*")
          .eq("id", id)
          .single()

        if (disciplineError) throw disciplineError
        setDiscipline(disciplineData)

        const { data: allDocuments, error: allDocumentsError } = await supabaseClient
          .from("documents")
          .select(`
            *,
            notification_frequency (id, frequency)
          `)
          .order("title")

        if (allDocumentsError) throw allDocumentsError

        const { data: linkedDocuments, error: linkedDocumentsError } = await supabaseClient
          .from("discipline_documents")
          .select("document_id")
          .eq("discipline_id", id)

        if (linkedDocumentsError) throw linkedDocumentsError

        const linkedDocumentIds = new Set(linkedDocuments.map((doc) => doc.document_id))
        const documentsWithLinkStatus = allDocuments.map((doc) => ({
          ...doc,
          isLinked: linkedDocumentIds.has(doc.id),
        }))

        setDocuments(documentsWithLinkStatus)

        const { data: masterFilesData, error: masterFilesError } = await supabaseClient
          .from("master_files")
          .select("*")
          .order("name")

        if (masterFilesError) throw masterFilesError

        const masterFilesWithLinkStatus = masterFilesData.map((masterFile) => ({
          ...masterFile,
          hasDocumentLink: documentsWithLinkStatus.some((doc) => doc.master_file_id === masterFile.id && doc.isLinked),
        }))

        setMasterFiles(masterFilesWithLinkStatus)
        setFilteredMasterFiles(masterFilesWithLinkStatus)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  const handleSearch = (query: string) => {
    if (query) {
      const filtered = masterFiles.filter((file) => file.name.toLowerCase().includes(query.toLowerCase()))
      setFilteredMasterFiles(filtered)
    } else {
      setFilteredMasterFiles(masterFiles)
    }
  }

  const handleToggleDocument = async (documentId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await supabaseClient.from("discipline_documents").delete().match({ discipline_id: id, document_id: documentId })
      } else {
        await supabaseClient.from("discipline_documents").insert({ discipline_id: id, document_id: documentId })
      }

      setDocuments((docs) => docs.map((doc) => (doc.id === documentId ? { ...doc, isLinked: !currentStatus } : doc)))

      setMasterFiles((prevMasterFiles) => {
        const updated = prevMasterFiles.map((masterFile) => ({
          ...masterFile,
          hasDocumentLink: documents.some(
            (doc) => doc.master_file_id === masterFile.id && (doc.id === documentId ? !currentStatus : doc.isLinked),
          ),
        }))
        setFilteredMasterFiles(updated)
        return updated
      })
    } catch (error) {
      console.error("Error updating document link:", error)
    }
  }

  const handleMasterFileClick = (masterFileId: string) => {
    setIsDocumentListVisible(false)
    setTimeout(() => {
      setSelectedMasterFile((currentSelected) => (currentSelected === masterFileId ? null : masterFileId))
      setIsDocumentListVisible(true)
    }, 300)
  }

  const getFilteredDocuments = () => {
    if (!selectedMasterFile) return []
    return documents.filter((doc) => doc.master_file_id === selectedMasterFile)
  }

  const handlePreview = async (document: Document) => {
    console.log(document,"hello")
    if (!document.file_name) {
      console.error("No document file name provided.")
      return
    }
  
    try {
      const limit = 10000;
      const { data: files, error: listError } = await supabaseClient.storage.from("files").list('', { limit });
      console.log(files);
      
      if (listError || !files) {
        console.error("Failed to list files:", listError?.message || "Unknown error")
        return
      }
  
      //General File search when timestamp is out
      const fileNameBase = `${document.file_name}`;
      console.log("Original filename:", fileNameBase);

      // First, try to find an exact match
      let possibleMatches = files.filter((file) => 
        file.name === fileNameBase
      );

      // If no exact matches, try without the last 2 digits of the timestamp and extension
      if (possibleMatches.length === 0) {
        console.log("No exact matches found. Trying without last 2 digits of timestamp...");
        
        // Extract the base part without extension
        const extensionMatch = fileNameBase.match(/\.(pdf|docx)$/i);
        const fileNameWithoutExtension = extensionMatch 
          ? fileNameBase.substring(0, fileNameBase.length - extensionMatch[0].length) 
          : fileNameBase;
        
        // Remove the last 2 digits from the timestamp part
        const truncatedFileName = fileNameWithoutExtension.slice(0, -2);
        console.log("Searching for files starting with:", truncatedFileName);
        
        // Find files that start with the truncated name and end with pdf or docx
        possibleMatches = files.filter((file) => 
          file.name.startsWith(truncatedFileName) && /\.(pdf|docx)$/i.test(file.name)
        );
      }

  console.log("Found possible matches:", possibleMatches.length, possibleMatches);

  if (possibleMatches.length === 0) {
    console.error("No matching files found.");
    // Handle the no-matches case
  }
  
      const withNumericSuffix = possibleMatches.map((file) => {
        const match = file.name.match(/_(\d+)\.(pdf|docx)$/i)
        return {
          file,
          numSuffix: match ? Number.parseInt(match[1], 10) : 0,
          extension: file.name.split('.').pop()!.toLowerCase(),
        }
      })
  
      withNumericSuffix.sort((a, b) => b.numSuffix - a.numSuffix)
  
      const bestMatch = withNumericSuffix[0].file
      console.log("Found best match file:", bestMatch.name)
  
      const { data: publicUrl } = supabaseClient.storage.from("files").getPublicUrl(bestMatch.name);
  
      if (!publicUrl?.publicUrl) {
        console.error("Failed to get public URL")
        return
      }
  
      setFileUrl(publicUrl.publicUrl)
      setViewerOpen(true)
    } catch (error) {
      console.error("Error accessing document:", error)
    }
  }

  return (
    <>
      {fileUrl && (
        <Modal
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: "50vw",
              height: "95vh",
              bgcolor: "background.paper",
              boxShadow: 24,
              outline: "none",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: "8px",
              "& .react-pdf__Document": {
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "auto",
              },
              "& .react-pdf__Page": {
                maxWidth: "100%",
                "& canvas": {
                  maxWidth: "100%",
                  height: "auto !important",
                },
              },
            }}
          >
            <IconButton
              onClick={() => setViewerOpen(false)}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                bgcolor: "rgba(255, 255, 255, 0.8)",
                zIndex: 1,
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
            {fileUrl.toLowerCase().endsWith(".docx") ? (
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                title="document viewer"
              />
            ) : (
              <DocViewer
                documents={[{ uri: fileUrl }]}
                pluginRenderers={DocViewerRenderers}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "auto",
                }}
                config={{
                  header: {
                    disableHeader: true,
                    disableFileName: true,
                  },
                  pdfZoom: {
                    defaultZoom: 0.8,
                    zoomJump: 0.2,
                  },
                  pdfVerticalScrollByDefault: true,
                }}
              />
            )}
          </Box>
        </Modal>
      )}

      <Grow in={true} timeout={500}>
        <Box sx={{ padding: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <Breadcrumbs
              items={[
                { label: "Home", path: "/" },
                { label: "Safety files", path: "/disciplines" },
                { label: discipline?.name || "Discipline Details" },
              ]}
            />
            <SearchBox onSearch={handleSearch} placeholder="Search" fullWidth={false} />
          </Box>

          <Box sx={{ display: "flex", gap: 3 }}>
            <Box
              sx={{
                flex: selectedMasterFile ? 1 : "auto",
                width: selectedMasterFile ? "auto" : "100%",
                backgroundColor: "#f8f9fd",
                borderRadius: 1,
                padding: 3,
                transition: "all 0.3s ease-in-out",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                maxHeight: "80vh",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: 500,
                  color: "rgba(0, 0, 0, 0.7)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  pl: 1,
                }}
              >
                MASTER FOLDERS
              </Typography>
              <List
                sx={{
                  flex: 1,
                  overflow: "auto",
                  width: "100%",
                  "& .MuiListItem-root": {
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    minHeight: "48px",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                    "&:last-child": {
                      borderBottom: "none",
                    },
                  },
                }}
              >
                {filteredMasterFiles.map((masterFile) => (
                  <ListItem
                    key={masterFile.id}
                    dense
                    onClick={() => handleMasterFileClick(masterFile.id)}
                    sx={{
                      cursor: "pointer",
                      backgroundColor: selectedMasterFile === masterFile.id ? "#ff5722" : "transparent",
                      color: selectedMasterFile === masterFile.id ? "white" : "inherit",
                      "&:hover": {
                        backgroundColor: selectedMasterFile === masterFile.id ? "#ff5722" : "rgba(0, 0, 0, 0.04)",
                      },
                      "&.Mui-selected": {
                        backgroundColor: "#ff5722",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "#ff5722",
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {masterFile.hasDocumentLink && (
                        <CheckIcon
                          sx={{
                            fontSize: 18,
                            color: selectedMasterFile === masterFile.id ? "white" : "#4CAF50",
                          }}
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={masterFile.name}
                      sx={{
                        "& .MuiTypography-root": {
                          fontSize: "0.875rem",
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box
              sx={{
                flex: 1,
                maxHeight: "80vh",
                backgroundColor: "transparent",
                overflow: "hidden",
                transition: "all 0.3s ease-in-out",
                width: isDocumentListVisible ? "50%" : "0%",
                opacity: isDocumentListVisible ? 1 : 0,
                visibility: isDocumentListVisible ? "visible" : "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {selectedMasterFile && (
                <Box
                  sx={{
                    flex: 1,
                    overflow: "auto",
                    mt: "42px",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                      px: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 500,
                        color: "rgba(0, 0, 0, 0.7)",
                        fontSize: "0.75rem",
                        letterSpacing: "0.1em",
                        pl: 1,
                      }}
                    >
                      CHECKLIST
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 500,
                        color: "rgba(0, 0, 0, 0.7)",
                        fontSize: "0.75rem",
                        letterSpacing: "0.1em",
                        pl: 1,
                        textAlign: 'center', // Center Notification
                        flex: 1
                      }}
                    >
                      NOTIFICATION
                    </Typography>

                    {/* Add a placeholder span to keep the icons on the right */}
                    <span style={{ width: 40 }}></span>
                  </Box>
                  <List
                    sx={{
                      width: "100%",
                      "& .MuiListItem-root": {
                        borderRadius: 1,
                        px: 2,
                        py: 1,
                        minHeight: "48px",
                        borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                        "&:last-child": {
                          borderBottom: "none",
                        },
                      },
                    }}
                  >
                    {getFilteredDocuments().map((document) => (
                      <ListItem
                        key={document.id}
                        dense
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                          },
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              checked={document.isLinked || false}
                              onChange={() => handleToggleDocument(document.id, document.isLinked || false)}
                              sx={{
                                color: "#b8bbc4",
                                "&.Mui-checked": {
                                  color: "#0159a0",
                                },
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={document.title}
                            sx={{
                              "& .MuiTypography-root": {
                                fontSize: "0.875rem",
                              },
                            }}
                          />
                        </Box>

                        {/* <Typography
                          variant="body2"
                          sx={{
                            fontSize: "0.875rem",
                            minWidth: "80px",
                            textAlign: 'center', // Center align Notification text
                            flex: 1
                          }}
                        >
                          {document.notification_frequency?.frequency}
                        </Typography> */}

                        {/* Eye Icon for Preview */}
                        <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                          <VisibilityIcon
                            onClick={() => handlePreview(document)}
                            sx={{
                              fontSize: 20,
                              color: "#13578d",
                              "&:hover": { color: "#0d3d66" },
                            }}
                          />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Grow>
    </>
  )
}

export default DisciplineDetailView
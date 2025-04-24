"use client"

import type React from "react"

import { useEffect, useState } from "react"
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormControlLabel,
  Grow,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material"
import { useParams, useLocation } from "react-router-dom"
import CheckIcon from "@mui/icons-material/Check"
// import VisibilityIcon from "@mui/icons-material/Visibility"
import DownloadIcon from "@mui/icons-material/Download"
import { SearchBox } from "../../Components/SearchBox"
import { Breadcrumbs } from "../../Components/Breadcrumbs"
import supabaseClient from "../../supabaseClient"
import { EmbeddedComponentPopup } from "../../Components/EmbeddedComponentPopup"
import PrintIcon from "@mui/icons-material/Print"
import BallotIcon from '@mui/icons-material/Ballot';

interface MasterFile {
  id: string
  name: string
  created_at: string
  hasDocumentLink?: boolean
}

interface Document {
  id: string
  title: string
  code: string
  revision_date: string
  revision_numb: number
  path: string | null
  dynamic_form_data: any | null
  master_file_id: string
  isLinked?: boolean
  project_document_id?: string
  doc_json?: string | null
  document_url?: string | null
}

interface User {
  id: string
  first_name: string
  last_name: string
  role: string // UUID of the role
}

interface UserRole {
  id: string
  role_name: string
}

interface ProjectUserDocument {
  id: string
  project_id: string
  contractor_id: string
  document_id: string
  created_at: string
  contractor_name?: string // Added for displaying user name
  document_title?: string // Added for displaying document title
}

interface LocationState {
  projectName: string
  disciplineName: string
  contractorName: string
}

export const ProjectDocumentLinkView = () => {
  const { projectId, contractorId, disciplineId } = useParams<{
    projectId: string
    contractorId: string
    disciplineId: string
  }>()
  const location = useLocation()
  const { projectName, disciplineName } = (location.state as LocationState) || {}
  const [masterFiles, setMasterFiles] = useState<MasterFile[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedMasterFile, setSelectedMasterFile] = useState<string | null>(null)
  const [showSelectedDocuments, setShowSelectedDocuments] = useState(false)
  const [showSelectedMasterFiles, setShowSelectedMasterFiles] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isDocumentListVisible, setIsDocumentListVisible] = useState(false)
  const [filteredMasterFiles, setFilteredMasterFiles] = useState<MasterFile[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [projectUserDocuments, setProjectUserDocuments] = useState<ProjectUserDocument[]>([])
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null)
  const [isDownloadingAllHistory, setIsDownloadingAllHistory] = useState(false)
  const [contractorUsers, setContractorUsers] = useState<Record<string, string>>({})
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [printingDocId, setPrintingDocId] = useState<string | null>(null)
  const [isPrintingAllSelected, setIsPrintingAllSelected] = useState(false)

  // Add these handler functions
  const handleSelectDocument = (docId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedDocIds((prev) => [...prev, docId])
    } else {
      setSelectedDocIds((prev) => prev.filter((id) => id !== docId))
    }
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked
    setSelectAll(checked)

    if (checked) {
      // Select all documents
      setSelectedDocIds(projectUserDocuments.map((doc) => doc.id))
    } else {
      // Deselect all documents
      setSelectedDocIds([])
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user information based on contractor_id
        if (contractorId) {
          const { data: userData, error: userError } = await supabaseClient
            .from("users")
            .select("id, first_name, last_name, role")
            .eq("id", contractorId)
            .single()

          if (userError) {
            console.error("Error fetching user data:", userError)
          } else if (userData) {
            setUserInfo(userData)
            console.log("User associated with this entry:", userData)
            console.log(`User name: ${userData.first_name} ${userData.last_name}`)

            // Fetch the role name from user_roles table
            if (userData.role) {
              const { data: roleData, error: roleError } = await supabaseClient
                .from("user_roles")
                .select("id, role_name")
                .eq("id", userData.role)
                .single()

              if (roleError) {
                console.error("Error fetching role data:", roleError)
              } else if (roleData) {
                setUserRole(roleData)
                console.log("User role:", roleData)
                console.log(`Role name: ${roleData.role_name}`)
              }
            }
          }
        }

        const [allDocuments, projectDocuments, masterFilesData] = await Promise.all([
          supabaseClient.from("documents").select("*").order("title"),
          supabaseClient
            .from("project_documents")
            .select("document_id, id, doc_json, document_url")
            .eq("project_id", projectId)
            .eq("contractor_id", contractorId)
            .eq("discipline_id", disciplineId)
            .eq("is_active", true),
          supabaseClient.from("master_files").select("*").order("name"),
        ])

        if (allDocuments.error) throw allDocuments.error
        if (projectDocuments.error) throw projectDocuments.error
        if (masterFilesData.error) throw masterFilesData.error

        const documentsWithLinkStatus = allDocuments.data.map((doc) => {
          const projectDoc = projectDocuments.data?.find((pd) => pd.document_id === doc.id)
          return {
            ...doc,
            isLinked: !!projectDoc,
            project_document_id: projectDoc?.id,
            doc_json: projectDoc?.doc_json,
            document_url: projectDoc?.document_url,
          }
        })

        setDocuments(documentsWithLinkStatus)

        const masterFilesWithLinkStatus = masterFilesData.data.map((masterFile) => ({
          ...masterFile,
          hasDocumentLink: documentsWithLinkStatus.some((doc) => doc.master_file_id === masterFile.id && doc.isLinked),
        }))

        setMasterFiles(masterFilesWithLinkStatus)
        setFilteredMasterFiles(masterFilesWithLinkStatus)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (projectId && contractorId && disciplineId) {
      fetchData()
    }
  }, [projectId, contractorId, disciplineId])

  useEffect(() => {
    const filtered = showSelectedMasterFiles ? masterFiles.filter((file) => file.hasDocumentLink) : masterFiles
    setFilteredMasterFiles(filtered)
  }, [showSelectedMasterFiles, masterFiles])

  const handleSearch = (query: string) => {
    const filtered = masterFiles.filter((file) => file.name.toLowerCase().includes(query.toLowerCase()))
    setFilteredMasterFiles(filtered)
  }

  const handleToggleDocument = async (documentId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        // Currently linked -> We need to deactivate it
        await supabaseClient.from("project_documents").update({ is_active: false }).match({
          project_id: projectId,
          contractor_id: contractorId,
          discipline_id: disciplineId,
          document_id: documentId,
        })
      } else {
        // Currently not linked -> Check if there's an inactive entry and reactivate it, otherwise insert a new entry
        const { data: existingRecord } = await supabaseClient
          .from("project_documents")
          .select("id")
          .eq("project_id", projectId)
          .eq("contractor_id", contractorId)
          .eq("discipline_id", disciplineId)
          .eq("document_id", documentId)
          .eq("is_active", false)
          .single()

        if (existingRecord) {
          // Reactivate by setting is_active to true
          await supabaseClient.from("project_documents").update({ is_active: true }).match({ id: existingRecord.id })
        } else {
          // Insert new record
          await supabaseClient.from("project_documents").insert({
            project_id: projectId,
            contractor_id: contractorId,
            discipline_id: disciplineId,
            document_id: documentId,
            doc_json: null,
            document_url: null,
            is_active: true,
          })
        }
      }

      // Update local state to reflect changes
      setDocuments((docs) => docs.map((doc) => (doc.id === documentId ? { ...doc, isLinked: !currentStatus } : doc)))

      setMasterFiles((prevMasterFiles) => {
        const updated = prevMasterFiles.map((masterFile) => ({
          ...masterFile,
          hasDocumentLink: documents.some(
            (doc) => doc.master_file_id === masterFile.id && (doc.id === documentId ? !currentStatus : doc.isLinked),
          ),
        }))
        setFilteredMasterFiles(showSelectedMasterFiles ? updated.filter((file) => file.hasDocumentLink) : updated)
        return updated
      })
    } catch (error) {
      console.error("Error updating document link:", error)
      setError("Failed to update document link. Please try again.")
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
    const docs = documents.filter((doc) => doc.master_file_id === selectedMasterFile)
    return showSelectedDocuments ? docs.filter((doc) => doc.isLinked) : docs
  }

  const getDownloadableDocuments = () => {
    return getFilteredDocuments().filter(
      (doc) => doc.isLinked && doc.path && doc.dynamic_form_data && (doc.doc_json || doc.document_url),
    )
  }

  // Function to fetch contractor names for all contractor IDs
  const fetchContractorNames = async (contractorIds: string[]) => {
    try {
      const { data, error } = await supabaseClient
        .from("users")
        .select("id, first_name, last_name")
        .in("id", contractorIds)

      if (error) {
        console.error("Error fetching contractor names:", error)
        return {}
      }

      const contractorMap: Record<string, string> = {}
      data?.forEach((user) => {
        contractorMap[user.id] = `${user.first_name} ${user.last_name}`
      })

      return contractorMap
    } catch (error) {
      console.error("Error in fetchContractorNames:", error)
      return {}
    }
  }

  // Function to fetch project user documents based on user role and master file
  const fetchProjectUserDocuments = async (doc: Document, filterByTitle = false) => {
    try {
      if (!userRole || !projectId || !doc.master_file_id) return []

      const roleName = userRole.role_name.toLowerCase()

      // First, get all documents that belong to the selected master file
      const { data: masterFileDocuments, error: masterFileError } = await supabaseClient
        .from("documents")
        .select("id, title")
        .eq("master_file_id", doc.master_file_id)

      if (masterFileError) {
        console.error("Error fetching master file documents:", masterFileError)
        return []
      }

      if (!masterFileDocuments || masterFileDocuments.length === 0) {
        return []
      }

      // If filtering by title, only include documents with matching title
      let filteredDocuments = masterFileDocuments
      if (filterByTitle) {
        filteredDocuments = masterFileDocuments.filter(d => d.title === doc.title)
      }

      // Get the document IDs from the filtered master file documents
      const documentIds = filteredDocuments.map((d) => d.id)

      // Start with base query that filters by project and document IDs from the master file
      let query = supabaseClient
        .from("project_users_documents")
        .select("*")
        .eq("project_id", projectId)
        .in("document_id", documentIds)

      if (roleName === "sub-contractor") {
        // For sub-contractors, only show their own documents
        query = query.eq("contractor_id", contractorId)
      } else if (roleName === "contractor") {
        // For contractors, show their own documents and documents of sub-contractors in the same project
        const { data: projectContractors } = await supabaseClient
          .from("project_documents")
          .select("contractor_id")
          .eq("project_id", projectId)
          .eq("document_id", doc.id)

        if (projectContractors && projectContractors.length > 0) {
          const contractorIds = projectContractors.map((pc) => pc.contractor_id)
          query = query.in("contractor_id", contractorIds)
        }
      }
      // For other roles, return all project documents (no additional filtering)

      const { data, error } = await query

      if (error) {
        console.error("Error fetching project user documents:", error)
        return []
      }

      if (data && data.length > 0) {
        // Get unique contractor IDs
        const contractorIds = [...new Set(data.map((doc) => doc.contractor_id))]

        // Fetch contractor names
        const contractorNamesMap = await fetchContractorNames(contractorIds)
        setContractorUsers(contractorNamesMap)

        // Get unique document IDs
        const docIds = [...new Set(data.map((doc) => doc.document_id))]

        // Fetch document titles
        const { data: documentsData, error: documentsError } = await supabaseClient
          .from("documents")
          .select("id, title")
          .in("id", docIds)

        if (documentsError) {
          console.error("Error fetching document titles:", documentsError)
        }

        // Create a map of document IDs to titles
        const documentTitlesMap: Record<string, string> = {}
        if (documentsData) {
          documentsData.forEach((doc) => {
            documentTitlesMap[doc.id] = doc.title
          })
        }

        // Add contractor names and document titles to the documents
        const docsWithNames = data.map((doc) => ({
          ...doc,
          contractor_name: contractorNamesMap[doc.contractor_id] || doc.contractor_id,
          document_title: documentTitlesMap[doc.document_id] || doc.document_id,
        }))

        return docsWithNames
      }

      return data || []
    } catch (error) {
      console.error("Error in fetchProjectUserDocuments:", error)
      return []
    }
  }

  // Modified to accept a filterByTitle parameter
  const handleViewDocument = async (doc: Document, filterByTitle = false) => {
    if (!doc.project_document_id) {
      setError("No project document ID available")
      return
    }

    try {
      setLoadingId(doc.id)
      setSelectedDocument(doc)

      // Fetch project user documents based on user role and master file
      // Pass the filterByTitle parameter to the fetch function
      const userDocuments = await fetchProjectUserDocuments(doc, filterByTitle)
      setProjectUserDocuments(userDocuments)
      console.log("Project user documents:", userDocuments)

      // Open the dialog
      setIsPreviewOpen(true)
    } catch (error) {
      console.error("Error fetching document data:", error)
      setError("Failed to fetch document data. Please try again.")
    } finally {
      setLoadingId(null)
    }
  }

  // Add a function to handle printing a document
  const handlePrintDocument = async (documentId: string) => {
    try {
      setPrintingDocId(documentId)

      // Generate document preview - same as download but we'll open in a new window for printing
      const response = await fetch(`${import.meta.env.VITE_DOCGEN_BACKEND_URL}/generate-doc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Open in a new window and trigger print
      const printWindow = window.open(url, "_blank")
      if (printWindow) {
        printWindow.onload = () => {
          // Add A4 print styles
          const style = printWindow.document.createElement("style")
          style.textContent = `
          @page {
            size: A4;
            margin: 0;
          }
          @media print {
            body {
              width: 210mm;
              height: 297mm;
            }
          }
        `
          printWindow.document.head.appendChild(style)

          // Set document title for saving
          printWindow.document.title = "Amkhoib Multiselect Download"

          // Trigger print with a slight delay to ensure styles are applied
          setTimeout(() => {
            printWindow.print()
          }, 1000)
        }
      } else {
        // If popup is blocked, provide the URL for manual printing
        setError("Pop-up blocked. Please allow pop-ups to print documents.")
      }
    } catch (error) {
      console.error("Error printing document:", error)
      setError("Failed to print document. Please try again.")
    } finally {
      setPrintingDocId(null)
    }
  }

  const handleDownloadDocument = async (documentId: string) => {
    try {
      setDownloadingDocId(documentId)

      // Generate document preview
      const response = await fetch(`${import.meta.env.VITE_DOCGEN_BACKEND_URL}/generate-doc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Create a download link and trigger the download
      const link = document.createElement("a")
      link.href = url
      link.download = `document-${documentId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading document:", error)
      setError("Failed to download document. Please try again.")
    } finally {
      setDownloadingDocId(null)
    }
  }

  const handleDownloadAll = async () => {
    const downloadableDocuments = getDownloadableDocuments()
    if (downloadableDocuments.length === 0) {
      setError("No documents available for download")
      return
    }

    try {
      setIsDownloadingAll(true)

      // Create an array of promises for all document downloads
      const downloadPromises = downloadableDocuments.map(async (doc) => {
        if (!doc.project_document_id) {
          return null
        }

        const response = await fetch(`${import.meta.env.VITE_DOCGEN_BACKEND_URL}/generate-doc`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ documentId: doc.project_document_id }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const blob = await response.blob()
        return { blob, name: `${doc.title}.pdf` }
      })

      // Wait for all downloads to complete
      const results = await Promise.all(downloadPromises)
      // Filter out null values and explicitly type the array
      const validResults = results.filter((result): result is { blob: Blob; name: string } => result !== null)

      if (validResults.length === 0) {
        throw new Error("No documents could be downloaded")
      }

      // If there's only one document, just download it directly
      if (validResults.length === 1) {
        const url = window.URL.createObjectURL(validResults[0].blob)
        window.open(url, "_blank")
        window.URL.revokeObjectURL(url)
        return
      }

      // For multiple documents, create a zip file
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()

      // Add each document to the zip
      validResults.forEach((result) => {
        zip.file(result.name, result.blob)
      })

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" })
      const zipUrl = window.URL.createObjectURL(zipBlob)

      // Create a download link and trigger the download
      const link = document.createElement("a")
      link.href = zipUrl
      link.download = `${projectName || "project"}_documents.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up
      window.URL.revokeObjectURL(zipUrl)
    } catch (error) {
      console.error("Error downloading files:", error)
      setError("Failed to download files. Please try again.")
    } finally {
      setIsDownloadingAll(false)
    }
  }

  const handleDownloadAllHistory = async () => {
    const docsToDownload =
      selectedDocIds.length > 0
        ? projectUserDocuments.filter((doc) => selectedDocIds.includes(doc.id))
        : projectUserDocuments

    if (docsToDownload.length === 0) {
      setError("No documents selected for download")
      return
    }

    console.log(`Downloading ${docsToDownload.length} documents`) // Debug log

    try {
      setIsDownloadingAllHistory(true)

      // Create an array of promises for all document downloads
      const downloadPromises = docsToDownload.map(async (doc) => {
        console.log(`Fetching document: ${doc.id}`) // Debug log

        const response = await fetch(`${import.meta.env.VITE_DOCGEN_BACKEND_URL}/generate-doc`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ documentId: doc.id }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const blob = await response.blob()
        // Use a more unique filename to avoid overwriting
        const filename = `${doc.document_title || doc.document_id}-${doc.id}.pdf`
        console.log(`Downloaded: ${filename}`) // Debug log

        return { blob, name: filename }
      })

      // Wait for all downloads to complete
      const results = await Promise.all(downloadPromises)
      console.log(`Got ${results.length} results`) // Debug log

      // Create a zip file
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()

      // Add each document to the zip with unique names
      results.forEach((result, index) => {
        // Ensure unique filenames in the zip
        const filename = result.name
        console.log(`Adding to zip: ${filename}`) // Debug log
        zip.file(filename, result.blob)
      })

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" })
      const zipUrl = window.URL.createObjectURL(zipBlob)

      // Create a download link and trigger the download
      const link = document.createElement("a")
      link.href = zipUrl
      link.download = `${selectedDocument?.title || "documents"}_history.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up
      window.URL.revokeObjectURL(zipUrl)
    } catch (error) {
      console.error("Error downloading all history files:", error)
      setError("Failed to download all files. Please try again.")
    } finally {
      setIsDownloadingAllHistory(false)
    }
  }

  // Replace the handlePrintAllSelected function with this updated version that includes a default filename
  const handlePrintAllSelected = async () => {
    const docsToPrint =
      selectedDocIds.length > 0
        ? projectUserDocuments.filter((doc) => selectedDocIds.includes(doc.id))
        : projectUserDocuments

    if (docsToPrint.length === 0) {
      setError("No documents selected for printing")
      return
    }

    console.log(`Printing ${docsToPrint.length} documents`)

    try {
      setIsPrintingAllSelected(true)

      // Create an array of promises for all document fetches
      const printPromises = docsToPrint.map(async (doc) => {
        console.log(`Fetching document for printing: ${doc.id}`)

        const response = await fetch(`${import.meta.env.VITE_DOCGEN_BACKEND_URL}/generate-doc`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ documentId: doc.id }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()

        return {
          arrayBuffer,
          title: doc.document_title || doc.document_id,
        }
      })

      // Wait for all fetches to complete
      const results = await Promise.all(printPromises)

      if (results.length === 0) {
        throw new Error("No documents could be printed")
      }

      // If there's only one document, just print it directly
      if (results.length === 1) {
        const blob = new Blob([results[0].arrayBuffer], { type: "application/pdf" })
        const url = window.URL.createObjectURL(blob)
        const printWindow = window.open(url, "_blank")
        if (printWindow) {
          printWindow.onload = () => {
            // Add A4 print styles
            const style = printWindow.document.createElement("style")
            style.textContent = `
            @page {
              size: A4;
              margin: 0;
            }
            @media print {
              body {
                width: 210mm;
                height: 297mm;
              }
            }
          `
            printWindow.document.head.appendChild(style)

            // Set document title for saving
            printWindow.document.title = "Amkhoib Multiselect Download"

            // Trigger print with a slight delay to ensure styles are applied
            setTimeout(() => {
              printWindow.print()
            }, 1000)
          }
        } else {
          setError("Pop-up blocked. Please allow pop-ups to print documents.")
        }
        return
      }

      // For multiple documents, we'll use pdf-lib to combine them
      console.log("Combining PDFs...")

      // Dynamically import pdf-lib
      const { PDFDocument, PageSizes } = await import("pdf-lib")

      // Create a new PDF document with A4 page size
      const mergedPdf = await PDFDocument.create()

      // Add each PDF to the merged document
      for (const result of results) {
        try {
          // Load the PDF document
          const pdf = await PDFDocument.load(result.arrayBuffer)

          // Get all pages from the document
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())

          // Add each page to the merged document
          pages.forEach((page) => {
            // We keep the original page size to avoid distortion
            mergedPdf.addPage(page)
          })
        } catch (error) {
          console.error(`Error processing PDF: ${error}`)
        }
      }

      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save()

      // Create a blob from the PDF bytes
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)

      // Open the merged PDF in a new window for printing
      const printWindow = window.open(url, "_blank")
      if (printWindow) {
        printWindow.onload = () => {
          // Add A4 print styles
          const style = printWindow.document.createElement("style")
          style.textContent = `
          @page {
            size: A4;
            margin: 0;
          }
          @media print {
            body {
              width: 210mm;
              height: 297mm;
            }
          }
        `
          printWindow.document.head.appendChild(style)

          // Set document title for saving
          printWindow.document.title = "Amkhoib Multiselect Download"

          // Add a slight delay to ensure the PDF is fully loaded and styles are applied
          setTimeout(() => {
            printWindow.print()
          }, 1000)
        }

        // Clean up the object URL when the window is closed
        printWindow.onunload = () => {
          URL.revokeObjectURL(url)
        }
      } else {
        setError("Pop-up blocked. Please allow pop-ups to print documents.")
        // Clean up if window couldn't be opened
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error printing selected documents:", error)
      setError("Failed to print selected documents. Please try again.")
    } finally {
      setIsPrintingAllSelected(false)
    }
  }

  // Remove the loadPrintJS function since we're not using print.js anymore

  // Don't forget to reset the selection when closing the dialog
  const handleClosePreview = () => {
    setIsPreviewOpen(false)
    setSelectedDocument(null)
    setProjectUserDocuments([])
    setSelectedDocIds([])
    setSelectAll(false)
  }

  if (loading) {
    return (
      <Box sx={{ padding: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    )
  }

  return (
    <Grow in={true} timeout={500}>
      <Box sx={{ padding: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <Breadcrumbs
            items={[
              { label: "Home", path: "/" },
              { label: "Projects", path: "/projects" },
              { label: projectName || "Project", path: `/projects/${projectId}/show` },
              { label: disciplineName || "Discipline" },
              {
                label:
                  userInfo?.first_name && userInfo?.last_name ? `${userInfo.first_name} ${userInfo.last_name}` : "user",
              },
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
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 500,
                  color: "rgba(0, 0, 0, 0.7)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                }}
              >
                MASTER FOLDERS ({filteredMasterFiles.length})
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showSelectedMasterFiles}
                    onChange={(e) => setShowSelectedMasterFiles(e.target.checked)}
                    sx={{
                      color: "#b8bbc4",
                      "&.Mui-checked": {
                        color: "#0159a0",
                      },
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: "rgba(0, 0, 0, 0.6)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    SHOW SELECTED
                  </Typography>
                }
                labelPlacement="start"
                sx={{
                  marginRight: 0,
                  "& .MuiFormControlLabel-label": {
                    marginRight: "8px",
                  },
                }}
              />
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
              {filteredMasterFiles.map((file) => (
                <ListItem
                  key={file.id}
                  onClick={() => handleMasterFileClick(file.id)}
                  sx={{
                    cursor: "pointer",
                    backgroundColor: selectedMasterFile === file.id ? "#ff5722" : "transparent",
                    color: selectedMasterFile === file.id ? "white" : "inherit",
                    "&:hover": {
                      backgroundColor: selectedMasterFile === file.id ? "#ff5722" : "rgba(0, 0, 0, 0.04)",
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
                    {file.hasDocumentLink && (
                      <CheckIcon
                        sx={{
                          fontSize: 18,
                          color: selectedMasterFile === file.id ? "white" : "#4CAF50",
                          opacity: 0.9,
                        }}
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
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
              backgroundColor: "transparent",
              overflow: "hidden",
              transition: "all 0.3s ease-in-out",
              width: isDocumentListVisible ? "50%" : "0%",
              opacity: isDocumentListVisible ? 1 : 0,
              visibility: isDocumentListVisible ? "visible" : "hidden",
            }}
          >
            {selectedMasterFile && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color: "rgba(0, 0, 0, 0.6)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      CHECKLIST ({getFilteredDocuments().length})
                    </Typography>
                    {/* Add the new "View All" icon at the top */}
                    {getFilteredDocuments().some((doc) => doc.isLinked) && (
                      <Tooltip title="View all documents history">
                        <BallotIcon
                          onClick={() => {
                            // Find the first linked document to use as reference
                            const firstLinkedDoc = getFilteredDocuments().find((doc) => doc.isLinked)
                            if (firstLinkedDoc) {
                              handleViewDocument(firstLinkedDoc, false) // false means don't filter by title
                            }
                          }}
                          sx={{
                            fontSize: 20,
                            color: "#13578d",
                            cursor: "pointer",
                            "&:hover": {
                              color: "#0d3d66",
                            },
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {getDownloadableDocuments().length > 1 && (
                      <Typography
                        onClick={!isDownloadingAll ? handleDownloadAll : undefined}
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          color: "#0159a0",
                          letterSpacing: "0.1em",
                          cursor: isDownloadingAll ? "default" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          "&:hover": {
                            textDecoration: isDownloadingAll ? "none" : "underline",
                          },
                        }}
                      >
                        {isDownloadingAll ? (
                          <>
                            <CircularProgress size={14} sx={{ color: "#0159a0" }} />
                            DOWNLOADING...
                          </>
                        ) : (
                          "DOWNLOAD ALL"
                        )}
                      </Typography>
                    )}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showSelectedDocuments}
                          onChange={(e) => setShowSelectedDocuments(e.target.checked)}
                          sx={{
                            color: "#b8bbc4",
                            "&.Mui-checked": {
                              color: "#0159a0",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "rgba(0, 0, 0, 0.6)",
                            letterSpacing: "0.1em",
                          }}
                        >
                          SHOW SELECTED
                        </Typography>
                      }
                      labelPlacement="start"
                      sx={{
                        marginRight: 0,
                        "& .MuiFormControlLabel-label": {
                          marginRight: "8px",
                        },
                      }}
                    />
                  </Box>
                </Box>
                <List
                  sx={{
                    width: "100%",
                    backgroundColor: "#f1f4fb",
                    borderRadius: 1,
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
                  {getFilteredDocuments().map((doc) => (
                    <ListItem
                      key={doc.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                        <Checkbox
                          checked={doc.isLinked}
                          onChange={() => handleToggleDocument(doc.id, doc.isLinked || false)}
                          sx={{
                            color: "#b8bbc4",
                            "&.Mui-checked": {
                              color: "#0159a0",
                            },
                          }}
                        />
                        <ListItemText
                          primary={doc.title}
                          sx={{
                            "& .MuiTypography-root": {
                              fontSize: "0.875rem",
                            },
                          }}
                        />
                      </Box>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {doc.isLinked &&
                          (loadingId === doc.id ? (
                            <CircularProgress
                              size={20}
                              sx={{
                                color: "#13578d",
                              }}
                            />
                          ) : (
                            <Tooltip title={`View history for ${doc.title}`}>
                              <BallotIcon
                                onClick={() => handleViewDocument(doc, true)} // true means filter by title
                                sx={{
                                  fontSize: 20,
                                  color: "#13578d",
                                  cursor: "pointer",
                                  "&:hover": {
                                    color: "#0d3d66",
                                  },
                                }}
                              />
                            </Tooltip>
                          ))}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        </Box>

        {/* Document History Dialog */}
        <EmbeddedComponentPopup
          open={isPreviewOpen}
          onClose={handleClosePreview}
          title=""
          width={1000} // You can adjust this value as needed
        >
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {selectedDocument?.title || "Document History"}
          </Typography>
          <Box sx={{ p: 2 }}>
            {projectUserDocuments.length > 0 ? (
              <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="document history table">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={
                            selectedDocIds.length > 0 && selectedDocIds.length < projectUserDocuments.length
                          }
                          checked={selectAll}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell>Document</TableCell>
                      <TableCell>Contractor</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projectUserDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedDocIds.includes(doc.id)}
                            onChange={(e) => handleSelectDocument(doc.id, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>{doc.document_title || doc.document_id}</TableCell>
                        <TableCell>{doc.contractor_name || doc.contractor_id}</TableCell>
                        <TableCell>{new Date(doc.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton
                              onClick={() => handleDownloadDocument(doc.id)}
                              disabled={downloadingDocId === doc.id}
                              size="small"
                              color="primary"
                              aria-label="download document"
                            >
                              {downloadingDocId === doc.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <DownloadIcon fontSize="small" />
                              )}
                            </IconButton>
                            <IconButton
                              onClick={() => handlePrintDocument(doc.id)}
                              disabled={printingDocId === doc.id}
                              size="small"
                              sx={{ color: "#fe5721" }}
                              aria-label="print document"
                            >
                              {printingDocId === doc.id ? (
                                <CircularProgress size={20} sx={{ color: "#fe5721" }} />
                              ) : (
                                <PrintIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No document history available.</Typography>
            )}

            <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                {projectUserDocuments.length > 0 && (
                  <>
                    <Button
                      onClick={handleDownloadAllHistory}
                      variant="outlined"
                      color="primary"
                      disabled={isDownloadingAllHistory || selectedDocIds.length === 0}
                      startIcon={isDownloadingAllHistory ? <CircularProgress size={16} /> : <DownloadIcon />}
                    >
                      {isDownloadingAllHistory ? "Downloading..." : `Download Selected (${selectedDocIds.length})`}
                    </Button>
                    <Button
                      onClick={handlePrintAllSelected}
                      variant="outlined"
                      sx={{
                        color: "#fe5721",
                        borderColor: "#fe5721",
                        "&:hover": {
                          borderColor: "#db4613",
                        },
                      }}
                      disabled={isPrintingAllSelected || selectedDocIds.length === 0}
                      startIcon={
                        isPrintingAllSelected ? <CircularProgress size={16} sx={{ color: "#fe5721" }} /> : <PrintIcon />
                      }
                    >
                      {isPrintingAllSelected ? "Printing..." : `Print Selected (${selectedDocIds.length})`}
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </EmbeddedComponentPopup>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Grow>
  )
}

// Add TypeScript declaration for printJS
declare global {
  interface Window {
    printJS: any
  }
}

export default ProjectDocumentLinkView
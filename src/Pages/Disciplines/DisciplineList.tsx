"use client"

import { useState, useCallback, useEffect } from "react"
import {
  List,
  useRedirect,
  useNotify,
  useRefresh,
  useRecordContext,
  type RaRecord,
  type SortPayload,
} from "react-admin"
import { DataGrid, type DataGridField } from "../../Components/DataGrid"
import { Box, Grow, Typography } from "@mui/material"
import { Breadcrumbs } from "../../Components/Breadcrumbs"
import { SearchBox } from "../../Components/SearchBox"
import { AddButton } from "../../Components/Buttons/AddButton"
import { EmbeddedComponentPopup } from "../../Components/EmbeddedComponentPopup"
import DisciplineCreate from "./DisciplineCreate"
import DG_Edit_Button from "../../Components/Buttons/DG_Edit_Button"
import DG_Delete_Button from "../../Components/Buttons/DG_Delete_button"
import supabaseClient from "../../supabaseClient"
import DisciplineEdit from "./DiciplineEdit"
import DeleteConfirmationDialog from "../../Components/DeleteConfirmationDialog"

const fields: DataGridField[] = [
  {
    source: "name",
    label: "Name",
    type: "custom",
    render: (record: RaRecord) => <Typography sx={{ fontWeight: "bold" }}>{record.name}</Typography>,
  },
]

const CustomActions = ({ onEdit, onDelete }) => {
  const record = useRecordContext()
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <DG_Edit_Button onClick={() => onEdit(record)} />
      <DG_Delete_Button onClick={() => onDelete(record)} />
    </Box>
  )
}

const EmptyActions = () => null

export const DisciplineList = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const redirect = useRedirect()
  const refresh = useRefresh()
  const notify = useNotify()
  const [data, setData] = useState([])
  const [sort, setSort] = useState<SortPayload>({ field: "name", order: "ASC" })
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false)
  const [selectedDiscipline, setSelectedDiscipline] = useState<{ id: string; name: string } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  // Add a refreshTrigger state to force re-fetch
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      let query = supabaseClient.from("disciplines").select("*")

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`)
      }

      query = query.order(sort.field, { ascending: sort.order === "ASC" })

      const { data, error } = await query

      if (error) throw error
      setData(data)
    } catch (error) {
      notify(`Error fetching data: ${error.message}`, { type: "warning" })
    }
  }, [searchQuery, sort, notify])

  // Remove the refreshTrigger state and triggerRefresh function
  // Instead, directly call fetchData() when needed

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddDisciplineButtonClick = () => {
    setIsPopupOpen(true)
  }

  const handleClosePopup = () => {
    setIsPopupOpen(false)
    fetchData() // Directly call fetchData to refresh the list
  }

  const handleRowClick = (id: string) => {
    redirect("show", "disciplines", id)
  }

  const handleSort = (newSort: SortPayload) => {
    setSort(newSort)
  }

  const handleEdit = useCallback((record) => {
    setSelectedDiscipline(record)
    setIsEditPopupOpen(true)
  }, [])

  const handleDeleteRequest = useCallback((record) => {
    setRecordToDelete(record)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleteDialogOpen(false)
    if (recordToDelete) {
      try {
        const { error } = await supabaseClient.from("disciplines").delete().eq("id", recordToDelete.id)
        if (error) throw error
        notify("Safety File successfully removed", { type: "success" })
        fetchData() // Directly call fetchData to refresh the list
      } catch (error) {
        notify(`Error deleting Safety File: ${error.message}`, { type: "warning" })
      }
    }
  }, [recordToDelete, notify, fetchData])

  const handleCloseEditPopup = useCallback(() => {
    setIsEditPopupOpen(false)
    setSelectedDiscipline(null)
    fetchData() // Directly call fetchData to refresh the list
  }, [fetchData])

  const handleEditSuccess = useCallback(() => {
    setIsEditPopupOpen(false)
    setSelectedDiscipline(null)
    fetchData() // Directly call fetchData to refresh the list
  }, [fetchData])

  return (
    <Grow in={true} timeout={500}>
      <Box sx={{ padding: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
          <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Safety files" }]} />

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SearchBox onSearch={handleSearch} placeholder="Search" fullWidth={false} />
            <Box sx={{ marginLeft: 2 }}>
              <AddButton onClick={handleAddDisciplineButtonClick} />
            </Box>
          </Box>
        </Box>

        <List
          actions={<EmptyActions />}
          exporter={false}
          sort={sort}
          sx={{
            "& .RaList-main": {
              margin: 0,
              padding: 0,
              boxShadow: "none",
              backgroundColor: "transparent",
            },
            "& .MuiPaper-root": {
              boxShadow: "none",
              backgroundColor: "transparent",
            },
          }}
        >
          <DataGrid
            data={data}
            fields={fields}
            customColumn={<CustomActions onEdit={handleEdit} onDelete={handleDeleteRequest} />}
            customColumnPosition="right"
            disableRowClick={false}
            onRowClick={(id) => handleRowClick(id)}
            sort={sort}
            onSort={handleSort}
          />
        </List>

        <EmbeddedComponentPopup open={isPopupOpen} onClose={handleClosePopup} title="" subtitle="">
          <DisciplineCreate
            setIsPopupOpen={(isOpen) => {
              setIsPopupOpen(isOpen)
              if (!isOpen) fetchData() // Refresh when popup is closed
            }}
          />
        </EmbeddedComponentPopup>

        {selectedDiscipline && (
          <EmbeddedComponentPopup
            open={isEditPopupOpen}
            onClose={handleCloseEditPopup}
            title=""
            subtitle=""
            width={500}
          >
            <DisciplineEdit
              id={selectedDiscipline.id}
              existingName={selectedDiscipline.name}
              setIsPopupOpen={(isOpen) => {
                setIsEditPopupOpen(isOpen)
                if (!isOpen) fetchData() // Refresh when popup is closed
              }}
              onSuccess={() => {
                setIsEditPopupOpen(false)
                fetchData() // Directly call fetchData to refresh the list
              }}
            />
          </EmbeddedComponentPopup>
        )}
        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Confirm Deletion"
          message="Are you sure you want to delete this folder and all its contents? This action cannot be undone."
        />
      </Box>
    </Grow>
  )
}

export default DisciplineList


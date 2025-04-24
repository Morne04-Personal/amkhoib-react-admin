"use client"

import { useState, useCallback, useEffect } from "react"
import { List, useNotify, useRefresh, useRecordContext } from "react-admin"
import {
  Box,
  Grow,
  Typography,
} from "@mui/material"
import { Breadcrumbs } from "../../Components/Breadcrumbs"
import { SearchBox } from "../../Components/SearchBox"
import { AddButton } from "../../Components/Buttons/AddButton"
import { EmbeddedComponentPopup } from "../../Components/EmbeddedComponentPopup"
import MasterFileCreate from "./MasterFileCreate"
import MasterFileEdit from "./MasterFileEdit"
import DG_Edit_Button from "../../Components/Buttons/DG_Edit_Button"
import DG_Delete_Button from "../../Components/Buttons/DG_Delete_button"
import supabaseClient from "../../supabaseClient"
import { DataGrid } from "../../Components/DataGrid"
import DeleteConfirmationDialog from "../../Components/DeleteConfirmationDialog"; // Adjust the import path as necessary

const fields = [
  {
    source: "name",
    label: "MASTER FOLDERS",
    type: "custom",
    render: (record) => <Typography sx={{ fontWeight: "bold" }}>{record.name}</Typography>,
    sortable: true,
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

export const MasterFileList = () => {
  const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false)
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [sort, setSort] = useState({ field: "name", order: "ASC" })
  const refresh = useRefresh()
  const notify = useNotify()
  const [data, setData] = useState([])
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = useCallback(async () => {
    try {
      let query = supabaseClient.from("master_files").select("*")

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

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
  }, [])

  const handleEdit = useCallback((record) => {
    setSelectedRecord(record)
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
        const { error } = await supabaseClient.from("master_files").delete().eq("id", recordToDelete.id)
        if (error) throw error
        notify("Master Folder successfully removed", { type: "success" })
        fetchData()
      } catch (error) {
        notify(`Error deleting Master File: ${error.message}`, { type: "warning" })
      }
    }
  }, [recordToDelete, notify, fetchData])

  const handleCloseCreatePopup = useCallback(() => {
    setIsCreatePopupOpen(false)
    fetchData()
  }, [fetchData])

  const handleCloseEditPopup = useCallback(() => {
    setIsEditPopupOpen(false)
    setSelectedRecord(null)
    fetchData()
  }, [fetchData])

  const handleRowClick = useCallback((id) => {
    return `/MasterFiles/${id}/documents`
  }, [])

  const handleSort = useCallback((newSort) => {
    if (newSort.field === "name") {
      setSort(newSort)
    }
  }, [])

  return (
    <Grow in={true} timeout={500}>
      <Box sx={{ padding: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
          <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Master Folders" }]} />
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SearchBox onSearch={handleSearch} placeholder="Search" fullWidth={false} />
            <Box sx={{ marginLeft: 2 }}>
              <AddButton onClick={() => setIsCreatePopupOpen(true)} />
            </Box>
          </Box>
        </Box>
        <List
          actions={<EmptyActions />}
          exporter={false}
          sort={sort}
          sx={{
            "& .RaList-main": { margin: 0, padding: 0, boxShadow: "none", backgroundColor: "transparent" },
            "& .MuiPaper-root": { boxShadow: "none", backgroundColor: "transparent" },
          }}
        >
          <DataGrid
            data={data}
            fields={fields}
            customColumn={<CustomActions onEdit={handleEdit} onDelete={handleDeleteRequest} />}
            customColumnPosition="right"
            rowClick={handleRowClick}
            sort={sort}
            onSort={handleSort}
          />
        </List>

        <EmbeddedComponentPopup
          open={isCreatePopupOpen}
          onClose={handleCloseCreatePopup}
          title="Add Master File"
          subtitle=""
          width={500}
        >
          <MasterFileCreate setIsPopupOpen={setIsCreatePopupOpen} onSuccess={fetchData} />
        </EmbeddedComponentPopup>

        {selectedRecord && (
          <EmbeddedComponentPopup
            open={isEditPopupOpen}
            onClose={handleCloseEditPopup}
            title="Edit Master File"
            subtitle=""
            width={500}
          >
            <MasterFileEdit
              setIsPopupOpen={setIsEditPopupOpen}
              id={selectedRecord.id}
              existingName={selectedRecord.name}
              onSuccess={fetchData}
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

export default MasterFileList


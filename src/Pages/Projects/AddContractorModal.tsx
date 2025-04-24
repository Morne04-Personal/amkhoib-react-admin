import type React from "react"
import { useState, useEffect } from "react"
import { Grid, Typography, Box } from "@mui/material"
import { SearchBox } from "../../Components/SearchBox"
import { DataGrid, type DataGridField } from "../../Components/DataGrid"
import supabaseClient from "../../supabaseClient"
import { ListContextProvider, type RaRecord, useListController } from "react-admin"
import { PageNav } from "../../Components/PageNav"
import CheckIcon from "@mui/icons-material/Check"

interface Contractor extends RaRecord {
  id: string
  name: string
  email: string
  phone: string
  contractor_type_id: string
  logo_url: string | null
}

interface AddContractorModalProps {
  onClose: () => void
  onAddContractor: (contractor: Contractor) => void
  selectedContractors: Contractor[]
}

const contractorFields: DataGridField[] = [
  { source: "name", label: "", type: "custom" },
  { source: "logo", label: "", type: "custom" },
]

const CustomListWrapper = ({ children, data }: { children: React.ReactNode; data: any[] }) => {
  const listContext = useListController({
    resource: "contractors",
    data,
    perPage: 10,
    sort: { field: "name", order: "ASC" },
  })

  return <ListContextProvider value={listContext}>{children}</ListContextProvider>
}

export const AddContractorModal: React.FC<AddContractorModalProps> = ({
  onClose,
  onAddContractor,
  selectedContractors,
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedContractorsState, setSelectedContractors] = useState<Contractor[]>([])

  useEffect(() => {
    const fetchContractors = async () => {
      setLoading(true)
      try {
        let query = supabaseClient
          .from("contractors")
          .select(`
            id,
            name,
            contractor_type_id,
            contractor_types!inner(name),
            logo_url
          `)
          .eq("contractor_types.name", "Contractor")

        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching contractors:", error)
          return
        }

        const alreadySelectedContractorIds = selectedContractors.map((sc) => sc.id)

        const filteredContractors = data
          .filter((contractor) => !alreadySelectedContractorIds.includes(contractor.id))
          .map(({ contractor_types, ...contractor }) => contractor as Contractor)

        setContractors(filteredContractors)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContractors()
  }, [searchQuery, selectedContractors])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleContractorSelect = (contractorId: string) => {
    setSelectedContractors((prev) => {
      const isSelected = prev.some((c) => c.id === contractorId)
      if (isSelected) {
        return prev.filter((c) => c.id !== contractorId)
      } else {
        const contractor = contractors.find((c) => c.id === contractorId)
        return contractor ? [...prev, contractor] : prev
      }
    })
  }

  const handleAddContractor = () => {
    if (selectedContractorsState.length > 0) {
      selectedContractorsState.forEach((contractor) => {
        onAddContractor(contractor)
      })
      setSelectedContractors([])
    }
  }

  const renderContractorField = (record: Contractor, fieldName: keyof Contractor) => {
    const isSelected = selectedContractorsState.some((c) => c.id === record.id)

    if (fieldName === "logo") {
      return (
        <Box sx={{ display: "flex", alignItems: "center", position: "relative" }}>
          <img
            src={record.logo_url || "https://via.placeholder.com/40"}
            alt={`${record.name} logo`}
            style={{
              width: "40px",
              height: "40px",
              marginRight: "10px",
              objectFit: "cover",
              borderRadius: "50%",
            }}
          />
          {isSelected && (
            <CheckIcon
              sx={{
                position: "absolute",
                right: "10px",
                color: "#4ba965",
                borderRadius: "50%",
              }}
            />
          )}
        </Box>
      )
    }

    return (
      <Typography
        sx={{
          padding: "4px",
          borderRadius: "4px",
          backgroundColor: isSelected ? "transparent" : "transparent",
          transition: "background-color 0.3s",
        }}
      >
        {record[fieldName]}
      </Typography>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageNav
        title="Add Contractors"
        onBack={onClose}
        onSave={handleAddContractor}
        saveButtonText="Add Contractors"
        isSaveDisabled={selectedContractorsState.length === 0}
      />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SearchBox placeholder="Search" fullWidth onSearch={handleSearch} />
        </Grid>
        <Grid item xs={12} sx={{ mt: 2 }}>
          <CustomListWrapper data={contractors}>
            <Box sx={{ height: "400px", overflow: "auto" }}>
              <DataGrid
                fields={contractorFields.map((field) => ({
                  ...field,
                  render: (record: any) =>
                    renderContractorField(record as Contractor, field.source as keyof Contractor),
                }))}
                data={contractors}
                onRowClick={handleContractorSelect}
                hidePagination
                hideColumnNames={false}
                rowClick={(id) => {
                  handleContractorSelect(id as string)
                  return false
                }}
                rowStyle={(record) => ({
                  backgroundColor: selectedContractorsState.some((c) => c.id === record.id)
                    ? "rgba(25, 118, 210, 0.08)"
                    : "transparent",
                  cursor: "pointer",
                })}
                sx={{
                  "& .RaDatagrid-headerCell": {
                    "&:first-of-type": { width: "60px" },
                    "&:nth-of-type(2)": { width: "calc(100% - 60px)" },
                  },
                }}
              />
            </Box>
          </CustomListWrapper>
        </Grid>
      </Grid>
    </Box>
  )
}


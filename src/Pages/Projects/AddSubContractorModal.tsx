import type React from "react"
import { useState, useEffect } from "react"
import { Grid, Typography, Box } from "@mui/material"
import { SearchBox } from "../../Components/SearchBox"
import { DataGrid, type DataGridField } from "../../Components/DataGrid"
import supabaseClient from "../../supabaseClient"
import { ListContextProvider, type RaRecord, useListController } from "react-admin"
import { PageNav } from "../../Components/PageNav"
import DropDown from "../../Components/DropDown"
import CheckIcon from "@mui/icons-material/Check"

interface SubContractor extends RaRecord {
  id: string
  name: string
  email: string
  phone: string
  contractor_type_id: string
  logo_url: string | null
}

interface Contractor extends RaRecord {
  id: string
  name: string
  contractor_type_id: string
  contractor_type_name: string
}

interface ContractorType {
  id: string
  name: string
}

interface AddSubContractorsModalProps {
  onClose: () => void
  onAddSubContractor: (subContractor: SubContractor, contractorId: string) => void
  selectedSubContractors: SubContractor[]
  selectedContractors: Contractor[]
  primaryContractor: Contractor
  linkedSubContractors?: { [contractorId: string]: SubContractor[] }
}

const subContractorFields: DataGridField[] = [
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

export const AddSubContractorsModal: React.FC<AddSubContractorsModalProps> = ({
  onClose,
  onAddSubContractor,
  selectedSubContractors,
  selectedContractors,
  primaryContractor,
  linkedSubContractors,
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [subContractors, setSubContractors] = useState<SubContractor[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSubContractorsState, setSelectedSubContractors] = useState<SubContractor[]>([])
  const [selectedContractor, setSelectedContractor] = useState<string>(
    primaryContractor.contractor_type_name === "Contractor" ? primaryContractor.id : selectedContractors[0]?.id || "",
  )
  const [contractorTypes, setContractorTypes] = useState<ContractorType[]>([])

  const isPrincipalContractor = primaryContractor.contractor_type_name === "Principle contractor"

  useEffect(() => {
    const fetchContractorTypes = async () => {
      const { data, error } = await supabaseClient.from("contractor_types").select("id, name")

      if (error) {
        console.error("Error fetching contractor types:", error)
      } else {
        setContractorTypes(data)
      }
    }

    fetchContractorTypes()
  }, [])

  useEffect(() => {
    const fetchSubContractors = async () => {
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
          .eq("contractor_types.name", "Sub-Contractor")

        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching sub-contractors:", error)
          return
        }

        const alreadySelectedSubContractors = linkedSubContractors
          ? Object.values(linkedSubContractors)
              .flat()
              .map((sc) => sc.id)
          : []

        const filteredSubContractors = data
          .filter((subContractor) => !alreadySelectedSubContractors.includes(subContractor.id))
          .map(({ contractor_types, ...subContractor }) => subContractor as SubContractor)

        setSubContractors(filteredSubContractors)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubContractors()
  }, [searchQuery, linkedSubContractors])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleSubContractorSelect = (subContractorId: string) => {
    setSelectedSubContractors((prev) => {
      const isSelected = prev.some((sc) => sc.id === subContractorId)
      if (isSelected) {
        return prev.filter((sc) => sc.id !== subContractorId)
      } else {
        const subContractor = subContractors.find((c) => c.id === subContractorId)
        return subContractor ? [...prev, subContractor] : prev
      }
    })
  }

  const handleAddSubContractor = () => {
    if (selectedSubContractorsState.length > 0 && selectedContractor) {
      selectedSubContractorsState.forEach((subContractor) => {
        onAddSubContractor(subContractor, selectedContractor)
      })
      setSelectedSubContractors([])
    }
  }

  const renderSubContractorField = (record: SubContractor, fieldName: keyof SubContractor) => {
    const isSelected = selectedSubContractorsState.some((sc) => sc.id === record.id)

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

  const contractorOptions = [
    ...(isPrincipalContractor ? [] : [{ value: primaryContractor.id, label: `${primaryContractor.name} (Primary)` }]),
    ...selectedContractors.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <Box sx={{ p: 3 }}>
      <PageNav
        title="Add Sub-Contractors"
        onBack={onClose}
        onSave={handleAddSubContractor}
        saveButtonText="Add Sub-Contractors"
        isSaveDisabled={selectedSubContractorsState.length === 0 || !selectedContractor}
      />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SearchBox placeholder="Search" fullWidth onSearch={handleSearch} />
        </Grid>
        <Grid item xs={12} sx={{ mt: 2 }}>
          <DropDown
            label="Contractor"
            value={selectedContractor}
            onChange={(e) => setSelectedContractor(e.target.value)}
            options={contractorOptions}
          />
          <CustomListWrapper data={subContractors}>
            <Box sx={{ height: "400px", overflow: "auto" }}>
              <DataGrid
                fields={subContractorFields.map((field) => ({
                  ...field,
                  render: (record: any) =>
                    renderSubContractorField(record as SubContractor, field.source as keyof SubContractor),
                }))}
                data={subContractors}
                onRowClick={handleSubContractorSelect}
                hidePagination
                hideColumnNames={false}
                rowClick={(id) => {
                  handleSubContractorSelect(id as string)
                  return false
                }}
                rowStyle={(record) => ({
                  backgroundColor: selectedSubContractorsState.some((sc) => sc.id === record.id)
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


import React from "react"
import {
  Datagrid,
  TextField,
  ReferenceField,
  type RowClickFunction,
  FunctionField,
  type RaRecord,
  ListProps,
  useListContext,
} from "react-admin"
import { CustomerAvatar } from "./CustomAvatar"
import { Chip } from "./Chips/Chip"

export interface DataGridField {
  source: string
  label: string
  reference?: string
  type: "text" | "reference" | "avatar" | "chip" | "custom"
  referenceField?: {
    source: string
    displayType?: "chip"
  }
  hideLabel?: boolean
  chipProps?: {
    backgroundColor?: string
    textColor?: string
    fontWeight?: number | string
    getStyles?: (value: string) => {
      backgroundColor?: string
      textColor?: string
      fontWeight?: number | string
    }
  }
  render?: (record: RaRecord) => React.ReactNode
}

interface DataGridProps {
  fields: DataGridField[]
  disableRowClick?: boolean
  customColumn?: React.ReactElement
  onRowClick?: (id: string) => void
  hidePagination?: boolean
  hideColumnNames?: boolean
  data?: RaRecord[]
  rowClick?: string | false | RowClickFunction
}

export const DataGrid: React.FC<DataGridProps> = ({
  fields,
  disableRowClick = false,
  customColumn,
  onRowClick,
  hidePagination = false,
  hideColumnNames = false,
  data,
  rowClick: propRowClick,
}) => {
  let rowClick: string | false | RowClickFunction = disableRowClick ? false : "edit"

  if (propRowClick) {
    rowClick = propRowClick
  } else if (onRowClick) {
    rowClick = (id: string | number, resource: string, record: RaRecord) => {
      if (typeof id === "string") {
        onRowClick(id)
      } else {
        onRowClick(id.toString())
      }
      return "show"
    }
  }

  const CustomDatagrid: React.FC = () => {
    const { data: contextData } = useListContext()
    const dataToUse = data || contextData

    return (
      <Datagrid
        bulkActionButtons={false}
        rowClick={rowClick}
        data={dataToUse}
        sx={{
          "& .RaDatagrid-headerCell": {
            backgroundColor: "#f1f4fb",
            color: "#666",
            fontWeight: "normal",
            fontSize: "0.875rem",
            padding: "12px 8px",
            borderBottom: "1px solid #eee",
            display: hideColumnNames ? "none" : "table-cell",
          },
          "& .RaDatagrid-row": {
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)", // Optional: adds a subtle hover effect
            },
            "& td": {
              padding: "12px 8px",
              borderBottom: "1px solid #e1e2e7",
              fontSize: "0.875rem",
            },
          },
          backgroundColor: "transparent",
          border: "none",
          boxShadow: "none",
          "& .MuiPaper-root": {
            boxShadow: "none",
            backgroundColor: "transparent",
          },
        }}
      >
        {fields.map((field, index) => {
          if (field.type === "avatar") {
            return <CustomerAvatar key={index} source={field.source} label={field.hideLabel ? " " : field.label} />
          }

          if (field.type === "reference" && field.reference && field.referenceField) {
            return (
              <ReferenceField
                key={index}
                source={field.source}
                reference={field.reference}
                label={field.hideLabel ? " " : field.label}
              >
                {field.referenceField.displayType === "chip" ? (
                  <FunctionField
                    render={(record: RaRecord) => {
                      const value = record[field.referenceField?.source || ""]
                      const styles = field.chipProps?.getStyles?.(value) || field.chipProps || {}
                      return <Chip label={value ? value.toString() : ""} {...styles} />
                    }}
                  />
                ) : (
                  <TextField source={field.referenceField.source} />
                )}
              </ReferenceField>
            )
          }

          if (field.type === "chip") {
            return (
              <FunctionField
                key={index}
                label={field.hideLabel ? " " : field.label}
                render={(record: RaRecord) => {
                  const value = field.source.split(".").reduce((obj, key) => obj && obj[key], record)
                  return <Chip label={value ? value.toString() : ""} {...field.chipProps} />
                }}
              />
            )
          }

          if (field.type === "custom" && field.render) {
            return <FunctionField key={index} label={field.hideLabel ? " " : field.label} render={field.render} />
          }

          return (
            <TextField
              key={index}
              source={field.source}
              label={field.hideLabel ? " " : field.label}
              sx={{
                "& .MuiTypography-root": {
                  fontWeight: field.source === "name" ? 500 : "normal",
                  color: field.source === "name" ? "#333" : "#666",
                },
              }}
            />
          )
        })}
        {customColumn && (
          <FunctionField
            label=""
            render={(record: RaRecord) => (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {React.cloneElement(customColumn as React.ReactElement, { record })}
              </div>
            )}
          />
        )}
      </Datagrid>
    )
  }

  return <CustomDatagrid />
}

export default DataGrid


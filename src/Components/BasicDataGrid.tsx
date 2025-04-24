import React from 'react';
import {
  Datagrid,
  TextField,
  ReferenceField,
  RowClickFunction,
  Identifier,
  ListContextProvider,
  useListContext,
  SortPayload,
  ListControllerResult,
} from 'react-admin';

export interface BasicDataGridField {
  source: string;
  label: string;
  reference?: string;
  referenceField?: {
    source: string;
  };
}

export interface BasicDataGridProps {
  fields: BasicDataGridField[];
  onRowClick?: (id: Identifier) => void;
  data?: any[];
  selectedId?: Identifier | null;
}

export const BasicDataGrid: React.FC<BasicDataGridProps> = ({ fields, onRowClick, data = [], selectedId }) => {
  const rowClick: RowClickFunction = (id, resource, record) => {
    if (onRowClick) {
      onRowClick(id);
    }
    return '';
  };

  // Create a complete context value that satisfies ListControllerResult requirements
  const listContext: ListControllerResult = {
    data,
    isLoading: false,
    isFetching: false,
    isPending: false, // Add the missing isPending property
    error: null,
    total: data.length,
    page: 1,
    perPage: 25,
    sort: { field: 'id', order: 'DESC' } as SortPayload,
    setSort: () => {},
    filterValues: {},
    displayedFilters: {},
    setFilters: () => {},
    hideFilter: () => {},
    showFilter: () => {},
    setPage: () => {},
    setPerPage: () => {},
    selectedIds: [],
    onSelect: () => {},
    onToggleItem: () => {},
    onUnselectItems: () => {},
    refetch: () => Promise.resolve(),
    resource: 'projects',
  };

  return (
    <ListContextProvider value={listContext}>
      <Datagrid
        bulkActionButtons={false}
        rowClick={rowClick}
        sx={{
          '& .RaDatagrid-headerCell': {
            backgroundColor: 'transparent',
            color: '#666',
            fontWeight: 'normal',
            fontSize: '0.875rem',
            padding: '12px 8px',
            borderBottom: '1px solid #eee',
            // display: hideColumnNames ? 'none' : 'table-cell',
          },
          '& .RaDatagrid-row': {
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            '& td': {
              padding: '12px 8px',
              borderBottom: '1px solid #e1e2e7',
              fontSize: '0.875rem',
            },
          },
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',
        }}
      >
        {fields.map((field, index) => {
          if (field.reference && field.referenceField) {
            return (
              <ReferenceField
                key={index}
                source={field.source}
                reference={field.reference}
                label={field.label}
              >
                <TextField source={field.referenceField.source} />
              </ReferenceField>
            );
          }

          return (
            <TextField
              key={index}
              source={field.source}
              label={field.label}
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: field.source === 'name' ? 500 : 'normal',
                  color: field.source === 'name' ? '#333' : '#666',
                }
              }}
            />
          );
        })}
      </Datagrid>
    </ListContextProvider>
  );
};

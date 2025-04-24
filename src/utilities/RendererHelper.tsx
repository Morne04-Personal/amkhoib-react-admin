import  { ChangeEvent } from 'react';
import { Box, Button, Grid, Input, InputLabel, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import moment from 'moment';
import { GetPlaceholderDefaultValue } from '../SupabaseMockEdgeFunctions';

interface Placeholder {
  full_tag_name: string;
  name: string;
  tag_name: string;
  field_type_id: string;
}

interface RenderInputPlaceholdersProps {
  placeholders: Placeholder[];
  values: { [key: string]: any };
  isSubmitting: boolean;
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  setFieldValue: (field: string, value: any) => void;
}

export const renderInputPlaceholders = ({
  placeholders,
  values,
  isSubmitting,
  handleChange,
  setFieldValue,
}: RenderInputPlaceholdersProps) => {
  const recursiveRenderFields = (obj: any, parentKey = ''): JSX.Element[] => {
    return Object.keys(obj).map((key) => {
      const fieldName = parentKey ? `${parentKey}.${key}` : key;
      const label = placeholders.find((p) => p.full_tag_name === `${key}`)?.name;
      const value = obj[key];

      if (Array.isArray(value)) {
        return (
          <Grid key={fieldName} item xs={12} sm={6} md={4} lg={3} container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">{key}</Typography>
            </Grid>
            <Grid item xs={12}>
              {value.map((item, index) => (
                <Box key={`${fieldName}[${index}]`} sx={{ mb: 2 }}>
                  {recursiveRenderFields(item, `${fieldName}[${index}]`)}
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      const newArray = [...value];
                      newArray.splice(index, 1);
                      setFieldValue(fieldName, newArray);
                    }}
                    disabled={isSubmitting || value.length === 1}
                  >
                    Remove {key}
                  </Button>
                </Box>
              ))}
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() => {
                  const newArrayItem = Object.keys(value[0]).reduce((acc: any, subKey: string) => {
                    const placeholder = placeholders.find(
                      (p) => p.full_tag_name === `${fieldName}.${subKey}`
                    );
                    acc[subKey] = GetPlaceholderDefaultValue(Number(placeholder?.field_type_id) || 0);
                    return acc;
                  }, {});
                  const newArray = [...value, newArrayItem];
                  setFieldValue(fieldName, newArray);
                }}
                disabled={isSubmitting}
              >
                Add {key}
              </Button>
            </Grid>
          </Grid>
        );
      } else {
        const placeholder = placeholders.find((p) => p.full_tag_name === fieldName.replace(/\[\d+\]/g, ''));

        if (!placeholder) return null;

        let comp: JSX.Element;

        switch (placeholder.field_type_id) {
          case (import.meta.env.VITE_ENV === 'development'? '8503c7c6-de2c-451c-b049-5d6786e8922e' : '58208a8a-e4c6-4b78-9aa9-47a033e2ad23'): // Image input
            comp = (
              <>
                <InputLabel sx={{ marginBottom: 1 }}>{placeholder.tag_name}</InputLabel>
                {typeof value?.source === 'string' && value?.source?.startsWith('http') ? (
                  <Box key={fieldName} display="flex" flexDirection="column" alignItems="center">
                    <img
                      src={value.source}
                      alt={`${fieldName} Preview`}
                      style={{ width: '100%', height: 'auto', marginBottom: '10px' }}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => setFieldValue(`${fieldName}.source`, '')}
                      disabled={isSubmitting}
                    >
                      Remove
                    </Button>
                  </Box>
                ) : (
                  <Input
                    fullWidth
                    type="file"
                    name={`${fieldName}.source`}
                    inputProps={{ accept: 'image/*' }}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setFieldValue(`${fieldName}.source`, e.target.files?.[0] || null);
                    }}
                    disabled={isSubmitting}
                    sx={{ my: 1 }}
                  />
                )}
              </>
            );
            break;
          case  (import.meta.env.VITE_ENV === 'development' ? '1ef6f11d-ed16-46cc-b82b-1c843e8e829a' : '4deb70f5-4095-4a85-8e19-78c72583e58a'):
            comp = (
              <DatePicker
                key={fieldName}
                label={label}
                value={moment(value)}
                onChange={(newValue) => setFieldValue(fieldName, moment(newValue).format('yyyy-MM-DD'))}
                disabled={isSubmitting}
                sx={{ my: 1 }}
              />
            );
            break;
          case (import.meta.env.VITE_ENV === 'development' ? '64cb6b7a-fdda-429d-9459-2a22e59a81a6' : '02ab4173-969b-42c9-a1a1-d8d63b05373b'):  // Number input
            comp = (
              <TextField
                key={fieldName}
                fullWidth
                type="number"
                name={fieldName}
                label={label}
                value={value}
                onChange={handleChange}
                disabled={isSubmitting}
                sx={{ my: 1 }}
              />
            );
            break;
          default: // Text input
            comp = (
              <TextField
                key={fieldName}
                fullWidth
                name={fieldName}
                label={label}
                value={value}
                onChange={handleChange}
                disabled={isSubmitting}
                sx={{ my: 1 }}
              />
            );
        }

        return parentKey ? comp : (
          <Grid key={`${fieldName}-wrapper`} item xs={12} sm={6} md={4} lg={3}>
            {comp}
          </Grid>
        );
      }
    }).filter((element) => element !== null);
  };

  return recursiveRenderFields(values);
};
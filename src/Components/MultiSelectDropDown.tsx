import React from 'react';
import { Select, MenuItem, InputLabel, FormControl, SelectChangeEvent, styled } from '@mui/material';

interface MultiSelectDropDownProps {
  label: string;
  value: string | string[];
  onChange: (event: SelectChangeEvent<string | string[]>) => void;
  options: { value: string; label: string }[];
  sx?: object;
  multiple?: boolean; // New prop to control single/multi-select behavior
}

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#e8eff9',
    borderRadius: theme.shape.borderRadius,
    transition: theme.transitions.create(['background-color']),
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
    },
    '&.Mui-focused': {
      backgroundColor: '#e8eff9',
      boxShadow: 'none',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'transparent',
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'transparent !important',
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'transparent',
  },
  '& .MuiInputLabel-outlined': {
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -6px) scale(0.75)',
      color: theme.palette.text.secondary,
    },
  },
  '& .MuiInputLabel-outlined.Mui-focused': {
    color: theme.palette.text.secondary,
  },
  '& .MuiInputBase-input': {
    padding: theme.spacing(2, 1.5),
  },
}));

const MultiSelectDropDown: React.FC<MultiSelectDropDownProps> = ({ label, value, onChange, options, sx, multiple = true }) => {
  return (
    <StyledFormControl fullWidth variant="outlined" sx={sx}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple={multiple}
        value={value}
        onChange={onChange}
        label={label}
        renderValue={(selected) => {
          if (multiple) {
            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(selected as string[]).map((value) => (
                  <span key={value} style={{ backgroundColor: '#e0e0e0', padding: '2px 4px', borderRadius: '4px' }}>
                    {options.find(option => option.value === value)?.label}
                  </span>
                ))}
              </div>
            );
          } else {
            return options.find(option => option.value === selected)?.label;
          }
        }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 224,
            },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </StyledFormControl>
  );
};

export default MultiSelectDropDown;

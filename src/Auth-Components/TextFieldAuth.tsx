import React from 'react';
import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps, styled } from '@mui/material';
import { useInput, UseInputValue } from 'react-admin';

interface TextFieldProps extends Omit<MuiTextFieldProps, 'variant'> {
  label: string;
  source: string;
  style?: React.CSSProperties;
}

const StyledTextField = styled(MuiTextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#081e45',
    borderRadius: '8px',
    transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow']),
    '&:hover': {
      backgroundColor: '#081e45',
    },
    '&.Mui-focused': {
      backgroundColor: '#081e45',
      boxShadow: 'none',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'transparent',
    legend: {
      display: 'none', // This removes the gap for the label
    },
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'transparent',
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#2c8fc9',
    borderWidth: '2px',
  },
  '& .MuiInputLabel-outlined': {
    color: 'white',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -4px) scale(0.75)', // Adjusted to sit on top of the border
      color: 'white',
    },
  },
  '& .MuiInputLabel-outlined.Mui-focused': {
    color: 'white',
  },
  '& .MuiInputBase-input': {
    padding: theme.spacing(2, 1.5), // Adjusted padding
    color: 'white',
  },
  '& .MuiInputLabel-root': {
    color: 'white',
  },
}));

export const TextFieldAuth: React.FC<TextFieldProps> = ({ label, source, style, ...props }) => {
  let inputProps: UseInputValue | null = null;
  let isReactAdmin = true;

  try {
    inputProps = useInput({ source });
  } catch (error) {
    isReactAdmin = false;
  }

  if (inputProps) {
    const {
      field: { value, onChange },
      fieldState: { error },
    } = inputProps;

    return (
      <StyledTextField
        label={label}
        variant="outlined"
        fullWidth
        value={value ?? ''}
        onChange={onChange}
        error={!!error}
        helperText={error?.message}
        style={style}
        {...props}
      />
    );
  } else {
    return (
      <StyledTextField
        label={label}
        variant="outlined"
        fullWidth
        style={style}
        {...props}
      />
    );
  }
};


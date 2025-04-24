import React from 'react';
import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps, styled } from '@mui/material';
import { useInput, UseInputValue } from 'react-admin';

interface TextFieldProps extends Omit<MuiTextFieldProps, 'variant'> {
  label: string;
  source: string;
  style?: React.CSSProperties;
  readonly?: boolean;
}

const StyledTextField = styled(MuiTextField, {
  shouldForwardProp: (prop) => prop !== 'readonly',
})<{ readonly?: boolean }>(({ theme, readonly }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: readonly ? '#e7e8ed' : '#e8eff9', // Change this color to your desired read-only background color
    borderRadius: "8px",
    transition: theme.transitions.create(['background-color']),
    '&:hover': {
      backgroundColor: readonly ? '#f0f0f0' : '#dbe7f8', // Also update the hover state
    },
    '&.Mui-focused': {
      backgroundColor: readonly ? '#f0f0f0' : '#e7e8ed', // Also update the focused state
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
    color: readonly ? theme.palette.text.disabled : 'inherit',
  },
}));

export const TextField: React.FC<TextFieldProps> = ({ label, source, style, readonly = false, ...props }) => {
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
        readonly={readonly}
        InputProps={{
          readOnly: readonly,
        }}
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
        readonly={readonly}
        InputProps={{
          readOnly: readonly,
        }}
        {...props}
      />
    );
  }
};


import React from 'react';
import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps, styled } from '@mui/material';
import { useInput, UseInputValue } from 'react-admin';

interface TextBoxProps extends Omit<MuiTextFieldProps, 'variant'> {
  label: string;
  source: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  rows?: number;
}

const StyledTextBox = styled(MuiTextField)<{ multiline?: boolean; rows?: number }>(({ theme, multiline, rows }) => ({
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
    ...(multiline && {
      height: `${(rows || 3) * 1.5}em`,
      overflow: 'auto',
    }),
  },
}));

export const TextBox: React.FC<TextBoxProps> = ({ 
  label, 
  source, 
  style, 
  multiline = true, 
  rows = 3, 
  ...props 
}) => {
  let inputProps: UseInputValue | null = null;
  let isReactAdmin = true;

  try {
    inputProps = useInput({ source });
  } catch (error) {
    isReactAdmin = false;
  }

  if (isReactAdmin && inputProps) {
    const {
      field: { value, onChange },
      fieldState: { error },
    } = inputProps;

    return (
      <StyledTextBox
        label={label}
        variant="outlined"
        fullWidth
        value={value ?? ''}
        onChange={onChange}
        error={!!error}
        helperText={error?.message}
        style={style}
        multiline={multiline}
        rows={rows}
        {...props}
      />
    );
  } else {
    return (
      <StyledTextBox
        label={label}
        variant="outlined"
        fullWidth
        style={style}
        multiline={multiline}
        rows={rows}
        {...props}
      />
    );
  }
};

export default TextBox;


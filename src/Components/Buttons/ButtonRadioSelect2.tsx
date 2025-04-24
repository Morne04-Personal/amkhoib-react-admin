import React from 'react';
import { Box, styled } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface ButtonRadioSelectProps<T extends string> {
  value: T | null;
  onChange: (value: T | null) => void;
  options: T[];
  defaultValue?: T;
  readOnly?: boolean;
}

const StyledButtonGroup = styled(Box)({
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
});

const StyledButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'readOnly',
})<{
  readOnly?: boolean;
}>(({ theme, readOnly }) => ({
  padding: '2px 20px',
  borderRadius: '20px',
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  color: '#165685',
  backgroundColor: '#deeaf6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: readOnly ? 'default' : 'pointer',
  border: '2px solid transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: readOnly ? '#deeaf6' : '#e0effa',
  },
  '&.selected': {
    color: theme.palette.primary.main,
    backgroundColor: '#e8eff9',
    border: '2px solid #b6d2e7',
  },
}));

const CheckIconWrapper = styled('span')({
  display: 'inline-flex',
  marginRight: '4px',
  alignItems: 'center',
});

export function ButtonRadioSelect2<T extends string>({
  value,
  onChange,
  options,
  defaultValue,
  readOnly = false,
}: ButtonRadioSelectProps<T>) {
  React.useEffect(() => {
    if (defaultValue && !value) {
      onChange(defaultValue);
    }
  }, [defaultValue, value, onChange]);

  return (
    <StyledButtonGroup>
      {options.map((option) => (
        <StyledButton
          key={option}
          className={value === option ? 'selected' : ''}
          onClick={() => {
            if (!readOnly) {
              onChange(value === option ? null : option);
            }
          }}
          readOnly={readOnly}
        >
          {value === option && (
            <CheckIconWrapper>
              <CheckIcon sx={{ fontSize: 18 }} />
            </CheckIconWrapper>
          )}
          {option}
        </StyledButton>
      ))}
    </StyledButtonGroup>
  );
}
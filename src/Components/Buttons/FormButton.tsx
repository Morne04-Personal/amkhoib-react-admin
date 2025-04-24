import React from 'react';
import { Box, styled } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface FormButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  selected?: boolean;
  className?: string;
}

const StyledButton = styled(Box)(({ theme }) => ({
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
  cursor: 'pointer',
  border: '2px solid transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#e0effa',
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

export const FormButton: React.FC<FormButtonProps> = ({ onClick, children, selected = false, className = '' }) => {
  return (
    <StyledButton
      onClick={onClick}
      className={`${selected ? 'selected' : ''} ${className}`}
    >
      {selected && (
        <CheckIconWrapper>
          <CheckIcon sx={{ fontSize: 18 }} />
        </CheckIconWrapper>
      )}
      {children}
    </StyledButton>
  );
};


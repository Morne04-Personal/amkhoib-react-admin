import React from 'react';
import { Box, styled, SxProps, Theme } from '@mui/material';

interface ButtonShowHideProps {
  text: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  sx?: SxProps<Theme>;
  readonly?: boolean; // New prop
}

const StyledButton = styled(Box)<Omit<ButtonShowHideProps, 'text'>>(({ theme, sx, readonly }) => ({
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
  cursor: readonly ? 'default' : 'pointer', // Change cursor based on readonly prop
  border: '2px solid transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: readonly ? '#deeaf6' : '#e0effa', // Prevent hover effect if readonly
  },
  '&.selected': {
    color: theme.palette.primary.main,
    backgroundColor: '#e8eff9',
    border: '2px solid #b6d2e7',
  },
  ...(sx as any),
}));

const IconWrapper = styled('span')({
  display: 'inline-flex',
  marginRight: '8px',
  alignItems: 'center',
});

export function ButtonShowHide({ text, icon, isSelected = false, onClick, sx, readonly = false }: ButtonShowHideProps) {
  const handleClick = () => {
    if (!readonly && onClick) {
      onClick();
    }
  };

  return (
    <StyledButton
      className={isSelected ? 'selected' : ''}
      onClick={handleClick}
      sx={sx}
      readonly={readonly}
    >
      {icon && (
        <IconWrapper>
          {icon}
        </IconWrapper>
      )}
      {text}
    </StyledButton>
  );
}


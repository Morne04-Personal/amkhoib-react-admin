import React from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/system';

const StyledButton = styled(Button)({
  borderColor: '#eb3950',  // Blue border
  color: '#eb3950',  // Blue text
  borderRadius: '8px',  // Rounded corners
  padding: '8px 16px',
  textTransform: 'none',  // Normal case text
  '&:hover': {
    borderColor: '#eb3950',  // Slightly darker on hover
    backgroundColor: 'rgba(255, 40, 40, 0.03)',  // Light blue background on hover
  },
});

interface CancellButtonProps {
  label: string;
  onClick?: () => void;
}

const CancellButton: React.FC<CancellButtonProps> = ({ label, onClick }) => (
  <StyledButton variant="outlined" onClick={onClick}>
    {label}
  </StyledButton>
);

export default CancellButton;
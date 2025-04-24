'use client'

import React from 'react';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';

const AnimatedButton = styled(IconButton)(({ theme }) => ({
  minWidth: '28.8px',
  padding: '3px',
  borderRadius: '50px',
  color: '#e0011c',
  backgroundColor: 'transparent',
  transition: 'all 0.3s ease',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  border: '1px solid transparent',
  transform: 'scale(0.72)',

  '& .MuiSvgIcon-root': {
    transition: 'all 0.3s ease',
    fontSize: '2rem',
  },

  '& .buttonText': {
    opacity: 0,
    maxWidth: 0,
    transition: 'all 0.3s ease',
    display: 'inline-block',
    verticalAlign: 'middle',
    padding: '0 4px', // Added padding to the text
  },

  '&:hover': {
    backgroundColor: '#e0011c',
    border: '1px solid #e0011c',
    padding: '3px 12px', // Increased horizontal padding when hovering
    '& .MuiSvgIcon-root': {
      color: '#fff',
      // marginLeft: '1px',
    },
    '& .buttonText': {
      opacity: 1,
      maxWidth: '70px', // Increased max width to accommodate padding
      // marginRight: '1px',
      color: '#fff',
    },
  },
}));

interface DG_Delete_ButtonProps {
  onClick?: (event: React.MouseEvent) => void;
  sx?: object;
}

export default function DG_Delete_Button({ onClick }: DG_Delete_ButtonProps) {
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event from reaching the row
    if (onClick) onClick(event);
  };

  return (
    <AnimatedButton onClick={handleClick} aria-label="delete">
      <span className="buttonText">Delete</span>
      <DeleteIcon />
    </AnimatedButton>
  );
}


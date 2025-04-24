'use client'

import React from 'react';
import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { styled } from '@mui/material/styles';

const AnimatedButton = styled(IconButton)(({ theme }) => ({
  minWidth: '28.8px',
  padding: '3px',
  borderRadius: '50px',
  color: '#005ea3',
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
  },

  '&:hover': {
    backgroundColor: '#005ea3',
    border: '1px solid #005ea3',
    padding: '3px 12px', // Increased horizontal padding when hovering
    '& .MuiSvgIcon-root': {
      color: '#fff',
      marginLeft: '3px',
    },
    '& .buttonText': {
      opacity: 1,
      maxWidth: '70px',
      marginRight: '3px',
      color: '#fff',
    },
  },
}));

interface DG_Edit_ButtonProps {
  onClick?: (event: React.MouseEvent) => void;
}

export default function DG_Edit_Button({ onClick }: DG_Edit_ButtonProps) {
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event from reaching the row
    if (onClick) onClick(event);
  };

  return (
    <AnimatedButton onClick={handleClick} aria-label="edit">
      <span className="buttonText">Edit</span>
      <EditIcon sx={{ fontSize: '1.44rem' }} />
    </AnimatedButton>
  );
}
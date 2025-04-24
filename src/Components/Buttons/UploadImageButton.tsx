import React, { ChangeEvent } from 'react';
import { styled, Box } from '@mui/material';
import { FileUpload as UploadIcon } from '@mui/icons-material';

interface UploadImageProps {
  onImageUpload?: (file: File) => void;
}

const Container = styled(Box)(({ theme }) => ({
  width: '150px', // Adjust width as needed
  height: '150px', // Adjust height as needed
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #cbd5e1', // Solid border
  borderRadius: '8px',
  backgroundColor: '#f5f8fd',
  cursor: 'pointer', // Ensure it looks clickable
  '&:hover': {
    backgroundColor: '#e8f1fc', // Optional hover effect
  },
}));

const StyledIcon = styled(UploadIcon)(({ theme }) => ({
  fontSize: '32px', // Icon size
  color: '#005c9e',
  marginBottom: '8px',
}));

const StyledText = styled('span')(({ theme }) => ({
  color: '#005c9e',
  fontSize: '16px',
  fontWeight: 500,
}));

const HiddenInput = styled('input')({
  display: 'none',
});

export const UploadImageButton = ({ onImageUpload }: UploadImageProps) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  return (
    <label htmlFor="upload-image">
      <HiddenInput
        accept="image/*"
        id="upload-image"
        type="file"
        onChange={handleFileChange}
      />
      <Container>
        <StyledIcon />
        <StyledText>Upload logo</StyledText>
      </Container>
    </label>
  );
};

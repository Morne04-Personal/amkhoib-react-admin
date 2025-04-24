import React from 'react';
import { Chip as MuiChip, ChipProps as MuiChipProps, styled } from '@mui/material';

export interface ChipProps extends Omit<MuiChipProps, 'color'> {
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: number | string;
  border?: string;
}

const StyledChip = styled(MuiChip, {
  shouldForwardProp: (prop) => 
    !['backgroundColor', 'textColor', 'fontWeight'].includes(prop as string),
})<ChipProps>(({ backgroundColor, textColor, fontWeight }) => ({
  backgroundColor: backgroundColor || '#F5F9FF',
  color: textColor || '#00A3FF',
  fontWeight: fontWeight || 600,
  height: 'auto',
  padding: '3px 14px',
  borderRadius: '8px',
  '& .MuiChip-label': {
    padding: 0,
    fontSize: '14px',
  },
}));

export const Chip: React.FC<ChipProps> = ({ 
  backgroundColor,
  textColor,
  fontWeight,
  border,
  label,
  ...props 
}) => {
  return (
    <StyledChip
      backgroundColor={backgroundColor}
      textColor={textColor}
      border={border}
      fontWeight={fontWeight}
      label={label}
      {...props}
    />
  );
};

// Example usage component
export const ChipExample: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Chip label="Supervisor" />
      <Chip 
        label="Custom Chip" 
        backgroundColor="#E8F5E9"
        textColor="#2E7D32"
        fontWeight={500}
        border="solid 1px transparrent"
        style={{ marginLeft: '8px' }}
      />
    </div>
  );
};


import React from 'react';
import { Box, Skeleton } from '@mui/material';

interface SkeletonCodeProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
  count?: number;
  sx?: React.CSSProperties;
}

export const SkeletonCode: React.FC<SkeletonCodeProps> = ({
  variant = 'rectangular',
  width = '100%',
  height = 20,
  animation = 'pulse',
  count = 1,
  sx = {},
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant={variant}
          width={width}
          height={height}
          animation={animation}
          sx={sx}
        />
      ))}
    </Box>
  );
};


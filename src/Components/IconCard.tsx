import { Card, CardContent, Typography, SxProps, Theme, Box } from '@mui/material';
import { ReactElement } from 'react';
import { Chip, ChipProps } from './Chips/Chip';

interface IconCardProps {
  icon: ReactElement;
  text: string;
  chip?: ChipProps; // Add chip prop
  sx?: SxProps<Theme>;
  onClick?: () => void;
}

// Helper function to truncate text
const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const IconCard = ({ icon, text, chip, sx, onClick }: IconCardProps) => {
  return (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: '#fff',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: onClick ? '0px 4px 8px rgba(0, 0, 0, 0.1)' : '0px 2px 4px rgba(0, 0, 0, 0.05)',
          transform: onClick ? 'translateY(-2px)' : 'none',
        },
        ...sx 
      }}
      onClick={onClick}
    >
      <CardContent sx={{ 
        p: '0 !important',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Icon wrapper */}
        <Box 
          sx={{ 
            p: 4,
            flex: '1 0 auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            '& > svg': {
              fontSize: 48,
              color: '#2d90c2',
              opacity: 0.9
            }
          }}
        >
          {icon}
        </Box>
        
        {/* Text section with background */}
        <Box 
          sx={{ 
            backgroundColor: '#eef3f9',
            py: 2,
            px: 3,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography 
            sx={{ 
              fontSize: '1.125rem',
              fontWeight: 400,
              color: '#1a1a1a',
              letterSpacing: '-0.01em',
              textAlign: 'left',
            }}
          >
            {truncateText(text,12)}
          </Typography>
          {chip && <Chip {...chip} style={{ marginLeft: '8px' }} />}
        </Box>
      </CardContent>
    </Card>
  )
};
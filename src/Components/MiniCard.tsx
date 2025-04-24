import { Card, Typography, Box } from '@mui/material';
import { Description as DescriptionIcon } from '@mui/icons-material';

interface MiniCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  onClick?: () => void; // Add onClick prop
}

export const MiniCard = ({ 
  title = "Contractors", 
  value = 2678,
  icon = <DescriptionIcon />,
  onClick // Destructure onClick
}: MiniCardProps) => {
  return (
    <Card 
      onClick={onClick} // Use onClick here
      sx={{
        padding: 2,
        borderRadius: 2,
        miWidth: 150,
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        justifyContent: 'space-between',
        boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.1)', // Minimal shadow
        cursor: onClick ? 'pointer' : 'default', // Change cursor if clickable
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: onClick ? '0px 4px 8px rgba(0, 0, 0, 0.1)' : '0px 2px 4px rgba(0, 0, 0, 0.05)',
          transform: onClick ? 'translateY(-2px)' : 'none',
        },
      }}
    >
      {/* Top-left icon */}
      <Box
        sx={{
          color: '#2d90c2',
          position: 'absolute',
          top: 16,
          left: 16,
          '& .MuiSvgIcon-root': {
            fontSize: 40,
          },
        }}
      >
        {icon}
      </Box>

      {/* Bottom-right content */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          textAlign: 'right',
        }}
      >
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ mb: 0.5 }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h3" 
          component="div" 
          sx={{ 
            fontWeight: 'bold',
            lineHeight: 1
          }}
        >
          {value.toLocaleString()}
        </Typography>
      </Box>
    </Card>
  );
};
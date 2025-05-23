import React from 'react';
import { 
  Dialog, 
  DialogContent,
  IconButton, 
  Typography,
  styled,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface MainPopupProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: number;
}

const StyledDialog = styled(Dialog)<{ width?: number }>(({ theme, width }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 8,
    padding: theme.spacing(3),
    maxWidth: width || 750, // Use the width prop if provided, otherwise default to 750
    width: '100%',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
    backgroundColor: '#f1f4fb',
  },
  '& .MuiDialogContent-root': {
    padding: 0,
    marginTop: theme.spacing(2),
  },
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(2),
  top: theme.spacing(2),
  color: theme.palette.grey[500],
  padding: 4,
  '& .MuiSvgIcon-root': {
    fontSize: 20,
  },
}));

export const EmbeddedComponentPopup: React.FC<MainPopupProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  width
}) => {
  return (
    <StyledDialog
      onClose={onClose}
      open={open}
      aria-labelledby="customized-dialog-title"
      width={width}
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.46)', // Darken the background
          backdropFilter: 'blur(5px)', // Apply blur to the background
        },
      }}
    >
      <CloseButton aria-label="close" onClick={onClose}>
        <CloseIcon />
      </CloseButton>
      
      {title || subtitle && <Box sx={{ pt: 2 }}>
        <Typography 
          variant="h6" 
          component="h2" 
          sx={{ 
            fontWeight: 600,
            fontSize: '1.1rem',
            textAlign: 'center',
            mb: 2
          }}
        >
          {title}
        </Typography>
        
        {subtitle && (
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              textAlign: 'center',
              mb: 2 
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>}

      <DialogContent>
        {children}
      </DialogContent>
    </StyledDialog>
  );
};

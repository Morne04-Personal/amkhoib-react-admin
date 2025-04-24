import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  TextField,
  Checkbox,
  Chip
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { useToast } from '../Components/Toast/ToastContext';
import supabaseClient from '../supabaseClient';

interface EditDocumentModalProps {
  open: boolean;
  onClose: () => void;
  initialData: {
    title: string;
    code: string;
    revision_number: string;
    revision_date: string;
    notification_frequency: string;
  };
}

interface NotificationFrequency {
  id: string;
  frequency: string;
}

const formatDate = (dateString: string): string => {
  try {
    const parts = dateString.split(' ');
   
    if (parts.length !== 3) throw new Error('Invalid date format');


    const day = parseInt((parts[0].split(','))[0],10) +1;
   
    const month = new Date(Date.parse(`1 ${parts[1]} 2021`)).getMonth(); // January is 0
    
    const year = parseInt(parts[2],10);

    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) {
      throw new RangeError("Invalid date value");
    }
    return date.toISOString().split('T')[0]; // "yyyy-MM-dd"
  
  } catch (error) {
    console.error("Date conversion error:", error);
    return ""; // Fallback to an empty string
  }
};

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({ open, onClose, initialData }) => {
  const { showMessage } = useToast();
  const [title, setTitle] = useState<string>(initialData.title || '');
  const [code, setCode] = useState<string>(initialData.code || '');
  const [revisionNumber, setRevisionNumber] = useState<string>(initialData.revision_number || '');
  const [revisionDate, setRevisionDate] = useState<string>(formatDate(initialData.revision_date) || '');
  const [receiveNotifications, setReceiveNotifications] = useState<boolean>(false);
  const [selectedFrequencyId, setSelectedFrequencyId] = useState<number | null>(null);
  const [notificationFrequencies, setNotificationFrequencies] = useState<NotificationFrequency[]>([]);

  const resetFields = () => {
    setTitle(initialData.title || '');
    setCode(initialData.code || '');
    setRevisionNumber(initialData.revision_number || '');
    setRevisionDate(formatDate(initialData.revision_date || ''));
    setReceiveNotifications(false);
    setSelectedFrequencyId(null);
  };

  useEffect(() => {
    let notificationData = 0;
    const fetchNotificationFrequencies = async () => {
    const { data, error } = await supabaseClient
        .from('notification_frequency')
        .select('id, frequency');

      if (error) {
        console.error('Failed to fetch notification frequencies:', error);
      } else {
        const match = data.find((item) => item.frequency === initialData.notification_frequency);
        setSelectedFrequencyId(match ? match.id : null);
        setNotificationFrequencies(data as NotificationFrequency[]);
      }
    };
    resetFields(); // Reset fields on save
    fetchNotificationFrequencies();
    setReceiveNotifications(initialData.notification_frequency ? true : false);

   
    setRevisionDate(formatDate(initialData.revision_date));
  }, [open]);

  const handleSave = async () => {
    try {

      const { error } = await supabaseClient
        .from('documents')
        .update({
          id: initialData?.id,
          title,
          code,
          revision_number: revisionNumber,
          revision_date: revisionDate,
          notification_frequency: selectedFrequencyId
        })
        .eq('id', initialData?.id);

      if (error) throw error;

      showMessage('Document updated successfully', 'success');
      onClose();
    } catch (err) {
      showMessage('Failed to update document', 'error');
    } finally {
      resetFields(); // Reset fields on save
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="center">
          <FolderIcon sx={{ fontSize: 48, color: '#2593D1' }} />
        </Box>
        <Typography variant="h6" align="center" sx={{ fontSize: '20px', fontWeight: 700, lineHeight: '22px' }}>
          Edit Document
        </Typography>
        <IconButton onClick={() => {
          onClose();
          resetFields(); // Reset fields on save
          }} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="dense"
          variant="filled"
          sx={inputStyles}
        />
        <TextField
          label="AM Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          fullWidth
          margin="dense"
          variant="filled"
          sx={inputStyles}
        />
        <TextField
          label="Rev Number"
          value={revisionNumber}
          onChange={(e) => setRevisionNumber(e.target.value)}
          fullWidth
          margin="dense"
          variant="filled"
          sx={inputStyles}
        />
        <TextField
          label="Rev Date"
          type="date"
          value={revisionDate}
          onChange={(e) => setRevisionDate(e.target.value)}
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          variant="filled"
          sx={inputStyles}
        />
        <Box display="flex" alignItems="center" mb={2}>
          <Checkbox
            checked={receiveNotifications}
            onChange={(e) => setReceiveNotifications(e.target.checked)}
          />
          <Typography variant="body2">Receive Notifications?</Typography>
        </Box>

        {receiveNotifications && (
          <Box display="flex" flexWrap="wrap" gap="4px">
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Notification Frequency:</Typography>
            {notificationFrequencies.map(({ id, frequency }) => (
              <Chip
                key={id}
                onClick={() => setSelectedFrequencyId(id)}
                label={frequency}
                sx={{
                  borderRadius: '16px',
                  bgcolor: selectedFrequencyId === id ? 'rgba(37, 147, 209, 0.25)' : 'rgba(37, 147, 209, 0.05)',
                  '&:hover': { bgcolor: 'rgba(37, 147, 209, 0.15)' }
                }}
                icon={selectedFrequencyId === id ? <CheckIcon /> : null}
              />
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 3 }}>
        <Button 
          variant="outlined" 
          onClick={() => {
              setRevisionDate('');
              resetFields(); // Reset fields on save
              onClose();
            }} 
          color="secondary" 
          sx={buttonStyles}
        >
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} color="primary" sx={buttonStyles}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const inputStyles = {
  mb: 2,
  backgroundColor: 'rgba(37, 147, 209, 0.05)',
  borderRadius: '8px',
  '& .MuiFilledInput-root': {
    backgroundColor: 'rgba(37, 147, 209, 0.05)',
    borderRadius: '8px',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    '&:before, &:after': { borderBottom: 'none' },
    '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
  },
  '& .MuiInputBase-input': { padding: '0', height: '56px' },
};

const buttonStyles = {
  width: '192px',
  height: '56px',
  padding: '10px 20px',
  borderRadius: '8px',
  textTransform: 'none',
};

export default EditDocumentModal;
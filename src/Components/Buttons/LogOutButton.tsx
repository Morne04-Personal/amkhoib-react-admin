import React from 'react';
import { Button, SxProps, Theme } from '@mui/material';
import { useLogout } from 'react-admin';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';

interface LogOutButtonProps {
  sx?: SxProps<Theme>;
  width?: string | number;
}

export const LogOutButton: React.FC<LogOutButtonProps> = ({ sx, width }) => {
  const logout = useLogout();

  const handleLogout = () => {
    logout();
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outlined"
      startIcon={<MeetingRoomOutlinedIcon />}
      fullWidth={!width}
      sx={{
        mt: 2,
        color: '#FF0000',
        borderColor: '#FFE5E5',
        backgroundColor: '#FFF5F5',
        borderRadius: '12px',
        textTransform: 'none',
        fontSize: '16px',
        padding: '10px 16px',
        width: width || '100%',
        '&:hover': {
          backgroundColor: '#FFE5E5',
          borderColor: '#FF0000',
        },
        ...sx
      }}
    >
      Log Out
    </Button>
  );
};


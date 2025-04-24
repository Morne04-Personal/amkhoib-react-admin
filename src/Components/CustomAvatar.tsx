import React from 'react';
import { useGetOne, useRecordContext } from 'react-admin';
import { Avatar } from '@mui/material';

interface CustomerAvatarProps {
  source: string;
  label?: string;
}

export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({ source }) => {
  const record = useRecordContext();
  const clientId = record?.assigned_client_id;
  
  const { data: clientData } = useGetOne('contractors', { 
    id: clientId 
  }, {
    enabled: !!clientId
  });

  return (
    <Avatar
      src={clientData?.logo_url}
      alt={clientData?.name}
      sx={{
        width: 35,
        height: 35,
        objectFit: 'cover',
        borderRadius: '50px',
        backgroundColor: '#f0f0f0',
        color: '#666',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!clientData?.logo_url && clientData?.name?.[0]}
    </Avatar>
  );
};
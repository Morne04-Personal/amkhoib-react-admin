import React from 'react';
import { Chip } from './Chip';

interface RoleChipProps {
  role: string;
}

export const RoleChip: React.FC<RoleChipProps> = ({ role }) => {
  const getChipStyles = (roleName: string) => {
    switch (roleName) {
      case 'Supervisor':
        return {
          backgroundColor: '#F5F9FF',
          textColor: '#00A3FF',
          fontWeight: 600,
        };
      case 'Consultant':
        return {
          backgroundColor: '#F6F4F9',
          textColor: '#2D1F41',
          fontWeight: 600,
        };
      case 'Sub contractor':
        return {
          backgroundColor: '#F5F9FF',
          textColor: '#00A3FF',
          fontWeight: 600,
        };
      default:
        return {
          backgroundColor: '#F5F9FF',
          textColor: '#00A3FF',
          fontWeight: 600,
        };
    }
  };

  const styles = getChipStyles(role);

  return (
    <Chip
      label={role}
      {...styles}
    />
  );
};


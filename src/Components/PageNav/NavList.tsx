import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Box,
  ListItemButton,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import { NavListProps } from './nav-types';

const NavList: React.FC<NavListProps> = ({
  items = [],
  title = '',
  onItemClick,
  onCheckboxChange,
  onEditClick,
  onDeleteClick,
  showActions = true,
  selected,
  titleColor = 'text.secondary',
  actionIconColor = 'action.active',
  listItemHoverColor = 'rgba(0, 0, 0, 0.04)',
  listItemSelectedColor = 'rgba(25, 118, 210, 0.08)',
  loading = false,
}) => {
  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: 360, 
      bgcolor: 'background.paper',
      borderRight: '1px solid',
      borderColor: 'divider',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="subtitle2"
          color={titleColor}
          sx={{ fontWeight: 'medium' }}
        >
          {title}
        </Typography>
        {showActions && (
          <Box>
            <IconButton 
              size="small" 
              sx={{ color: actionIconColor }}
              onClick={() => onDeleteClick?.(null)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              sx={{ color: actionIconColor }}
              onClick={() => onEditClick?.(null)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
      
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        position: 'relative'
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%'
          }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {items.map((item) => (
              <ListItem
                key={item.id}
                disablePadding
                sx={{
                  '& .MuiListItemButton-root': {
                    '&:hover': {
                      bgcolor: listItemHoverColor,
                    },
                    ...(selected === item.id && {
                      bgcolor: listItemSelectedColor,
                    }),
                  },
                }}
              >
                <ListItemButton
                  onClick={() => onItemClick?.(item)}
                  selected={selected === item.id}
                >
                  {onCheckboxChange && (
                    <Checkbox
                      edge="start"
                      checked={item.isChecked}
                      onChange={(e) => onCheckboxChange(item, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <ListItemText
                    primary={item.title}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default NavList;


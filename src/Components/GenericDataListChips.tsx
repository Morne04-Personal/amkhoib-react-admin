import React, { useEffect } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface Placeholder {
  full_tag_name: string;
}

interface GenericDataListChipsProps {
    genericDataList: Placeholder[];
    formData: {
      formName: string;
      code: string;
      revisionNumber: string;
      revisionDate: string;
      title: string;
      placeholders: Placeholder[];
    };
    setFormData: React.Dispatch<React.SetStateAction<{
      formName: string;
      code: string;
      revisionNumber: string;
      revisionDate: string;
      title: string;
      placeholders: Placeholder[];
    }>>;
  }

const GenericDataListChips: React.FC<GenericDataListChipsProps> = ({
  genericDataList,
  formData,
  setFormData,
}) => {
  useEffect(() => {
    const allTags = genericDataList.map(item => ({ ...item, showInMobile: false }));
    setFormData({ ...formData, placeholders: allTags, });

  }, [genericDataList, setFormData]);

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      gap="4px"
      sx={{
        borderRadius: '32px',
        borderColor: '#025EA3',
        p: 2,
      }}
    >
      {genericDataList.map((item, index) => (
        <Chip
          key={index}
          label={
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '15px',
                lineHeight: '17.25px',
                color: '#025EA3',
              }}
            >
              {item.full_tag_name}
            </Typography>
          }
          sx={{
            borderRadius: '16px',
            border: '1px solid',
            borderColor: '#2593D105',
            bgcolor: 'rgba(37, 147, 209, 0.05)',
          }}
          icon={
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: '12px',
                lineHeight: '12px',
                color: '#025EA3',
              }}
            >
              <CheckIcon fontSize="inherit" />
            </Typography>
          }
        />
      ))}
    </Box>
  );
};

export default GenericDataListChips;
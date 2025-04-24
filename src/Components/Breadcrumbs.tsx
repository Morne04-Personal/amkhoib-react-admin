import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { useRedirect } from 'react-admin';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface BreadcrumbsProps {
  items: Array<{ label: string; path?: string }>;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const redirect = useRedirect();

  return (
    <MuiBreadcrumbs
      separator={<ArrowForwardIosIcon sx={{ fontSize: 16, mx: 0.5 }} />}
      aria-label="breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast) {
          return (
            <Typography key={item.label} color="text.primary">
              {item.label}
            </Typography>
          );
        }

        return (
          <Link
            key={item.label}
            underline="hover"
            color="inherit"
            href={item.path}
            onClick={(e) => {
              e.preventDefault();
              if (item.path) {
                redirect(item.path);
              }
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};


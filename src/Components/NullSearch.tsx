import { Box, Typography, SvgIcon } from '@mui/material';
import { type SvgIconProps } from '@mui/material';

interface NullSearchProps {
  icon: typeof SvgIcon
  header: string
  subHeader: string
  button?: React.ReactNode
}

export const NullSearch = ({ icon: Icon, header, subHeader, button }: NullSearchProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        backgroundColor: "#f1f4fb",
        borderRadius: "8px",
        width: "100%",
      }}
    >
      <Icon
        sx={{
          fontSize: 24,
          color: "#94a3b8",
        }}
      />
      <Typography
        variant="h6"
        sx={{
          color: "#1e293b",
          marginTop: 2,
          marginBottom: 1,
          fontWeight: 500,
        }}
      >
        {header}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "#64748b",
          maxWidth: "300px",
          marginBottom: button ? 2 : 0,
        }}
      >
        {subHeader}
      </Typography>
      {button}
    </Box>
  )
}




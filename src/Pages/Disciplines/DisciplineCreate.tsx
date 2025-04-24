import type React from "react"
import { Create, SimpleForm, useNotify, useInput } from "react-admin"
import { useNavigate } from "react-router-dom"
import { Box, Typography } from "@mui/material"
import FolderIcon from "@mui/icons-material/Folder"
import { TextField } from "../../Components/TextField"
import CancellButton from "../../Components/Buttons/CancellButton"
import PrimaryButton from "../../Components/Buttons/PrimaryButton"

interface DisciplineCreateProps {
  setIsPopupOpen: (isOpen: boolean) => void
}

export const DisciplineCreate: React.FC<DisciplineCreateProps> = ({ setIsPopupOpen }) => {
  const notify = useNotify()
  const navigate = useNavigate()

  const onSuccess = () => {
    notify("Safety File created successfully", { type: "success" })
    navigate("/disciplines")
    setIsPopupOpen(false)
  }

  const handleCancel = () => {
    setIsPopupOpen(false)
    navigate("/disciplines")
  }

  return (
    <Create resource="disciplines" mutationOptions={{ onSuccess }}>
      <SimpleForm
        toolbar={false}
        sx={{
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        <FormContent onCancel={handleCancel} />
      </SimpleForm>
    </Create>
  )
}

interface FormContentProps {
  onCancel: () => void
}

const FormContent: React.FC<FormContentProps> = ({ onCancel }) => {
  const {
    field: { onChange, value },
    fieldState: { error },
    formState: { isSubmitting },
  } = useInput({ source: "name" })

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        width: "100%",
        padding: "24px",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          backgroundColor: "#005eb8",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FolderIcon sx={{ fontSize: 32, color: "white" }} />
      </Box>

      <Typography variant="h6" component="h2">
        Add Safety file
      </Typography>

      <TextField
        source="name"
        label="Name"
        fullWidth
        style={{ marginTop: "16px", marginBottom: "16px" }}
        onChange={onChange}
        value={value}
        error={!!error}
        helperText={error?.message}
      />

      <Box
        sx={{
          display: "flex",
          gap: 2,
          width: "100%",
          mt: 3,
          "& > button": {
            flex: 1,
          },
        }}
      >
        <CancellButton label="Cancel" onClick={onCancel} />
        <PrimaryButton label="Save" type="submit" disabled={!value || isSubmitting} />
      </Box>
    </Box>
  )
}

export default DisciplineCreate


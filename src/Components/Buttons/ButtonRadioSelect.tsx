import { useGetList } from "react-admin"
import { FormControl, Box, CircularProgress, styled } from "@mui/material"
import CheckIcon from "@mui/icons-material/Check"

interface ButtonRadioSelectProps {
  source: string
  reference: string
  label?: string
  optionText?: string | ((record: any) => string)
  value: string[]
  onChange: (value: string[]) => void
}

const StyledButtonGroup = styled(Box)({
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
})

const StyledButton = styled(Box)(({ theme }) => ({
  padding: "2px 20px",
  borderRadius: "20px",
  textTransform: "none",
  fontSize: "14px",
  fontWeight: 500,
  color: "#165685",
  backgroundColor: "#deeaf6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "2px solid transparent",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "#e0effa",
  },
  "&.selected": {
    color: theme.palette.primary.main,
    backgroundColor: "#e8eff9",
    border: "2px solid #b6d2e7",
  },
}))

const CheckIconWrapper = styled("span")({
  display: "inline-flex",
  marginRight: "4px",
  alignItems: "center",
})

export const ButtonRadioSelect = ({
  source,
  reference,
  optionText = "name",
  value,
  onChange,
}: ButtonRadioSelectProps) => {
  const { data, isLoading } = useGetList(reference)

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center">
        <CircularProgress size={20} />
      </Box>
    )
  }

  const getOptionText = (record: any) => {
    if (typeof optionText === "function") {
      return optionText(record)
    }
    return record[optionText]
  }

  const handleSelect = (id: string) => {
    const newValue = value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    onChange(newValue)
  }

  return (
    <FormControl component="fieldset" fullWidth>
      <StyledButtonGroup>
        {data?.map((option: any) => (
          <StyledButton
            key={option.id}
            className={value.includes(option.id) ? "selected" : ""}
            onClick={() => handleSelect(option.id)}
          >
            {value.includes(option.id) && (
              <CheckIconWrapper>
                <CheckIcon sx={{ fontSize: 18 }} />
              </CheckIconWrapper>
            )}
            {getOptionText(option)}
          </StyledButton>
        ))}
      </StyledButtonGroup>
    </FormControl>
  )
}


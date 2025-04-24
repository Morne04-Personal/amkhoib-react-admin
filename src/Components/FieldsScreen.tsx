import React, { useState, useEffect } from 'react';
import { Box, Button, Checkbox, Grid, MenuItem, Select, TextField, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { FolderOpenOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

interface Placeholder {
  full_tag_name: string;
  field_type_id?: string;
  name?: string;
  placeholder_type_id?: string;
  required?: boolean;
  options?: any[];
  order?: number;
  step?: number;
  [key: string]: any;
}

interface ValueType {
  id: string;
  name: string;
}

interface Step {
  title: string;
  fields: FormField[];
  isGroup?: boolean;
}

interface FormField {
  field_type_id: string;
  full_tag_name: string;
  name: string;
  required: any;
  options: any[];
  type: string;
  order: number;
  field: {
    type: string;
    name: string;
    placeHolderLabel: string;
    label: string;
    key: string;
    placeholder_type_id?: string;
    required: boolean;
    value: string;
    options?: any[];
  };
}

interface FieldsScreenProps {
    placeholders: {
      full_tag_name: string;
      placeholder_type_id: string;
      field_type_id: string;
      type: string;
      [key: string]: any;
      masterFolderId: string;
    }[];
    valueTypes: ValueType[];
    placeholderTypes: any;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    resetForm: boolean
    setResetForm: () => void; // Add this line
  }

  const filterUniqueFields = (fields: Placeholder[]) => {
    const seen = new Set<string>();
    return fields.filter(field => {
      if (field.name && !seen.has(field.name)) {
        seen.add(field.name);
        return true;
      }
      return false;
    });
  };
  
const FieldsScreen: React.FC<FieldsScreenProps> = ({
  placeholders,
  valueTypes,
  placeholderTypes,
  setFormData,
  resetForm,
  setResetForm,
}) => {
  const [selectedLeft, setSelectedLeft] = useState<Set<string>>(new Set());
  // const [leftFields, setLeftFields] = useState<Placeholder[]>(filterUniqueFields(placeholders));
  // const [steps, setSteps] = useState<Step[]>([]);
  const [options, setOptions] = useState<{ [key: string]: string[] }>({});
  const [currentOption, setCurrentOption] = useState<{ [key: string]: string }>({});
  const [leftSelectedCount, setLeftSelectedCount] = useState(0);
  const [rightSelectedCount, setRightSelectedCount] = useState(0);
  const [selectedStepsCount, setSelectedStepsCount] = useState(0);
  const hiddenTypeId = '33d914a6-b31d-4acd-99be-927a1ad6150b';
  const masterfolderId = 'bdb11833-fabb-414c-84a2-8138a8af4e0a';

  const visiblePlaceholders = (
    placeholders.filter(placeholder => placeholder.placeholder_type_id !== hiddenTypeId && placeholder.placeholder_type_id !== masterfolderId)
  );

  const [leftFields, setLeftFields] = useState<Placeholder[]>(visiblePlaceholders);
  const [steps, setSteps] = useState<Step[]>([]);
  const fieldTypeNameGroups = [
    'Dropdown',
    'Checkbox',
    'Chips'
  ];
  
  const fieldTypeIdGroups = {
    development: [
      'a77a4867-f81c-42b5-83ec-8c06e66fad3f',
      '9cbd9fbb-b9c8-4ee2-9e23-0f3b9e7b8867',
      '9db7401d-caff-4aa8-89b9-9b8793acbec3'
    ],
    production: [
      'b0dc0ee6-f845-4618-a2ce-abe4376abe1e',
      '2f729fdf-9c7f-4c31-9ff4-8c83e767f404',
      '06cb9954-4324-47cf-8186-3475fb06223d'
    ]
  };
  const currentEnv = import.meta.env.VITE_ENV;

  useEffect(() => {
    const stepMap: Record<number, Step> = {};


    steps.forEach((step, index) => {
      if (!stepMap[index]) {
        stepMap[index] = {
          title: step.title,
          fields: [],
        };
      }

      step.fields.forEach((field) => {
        const elementType = getElementTypeName(field.field.placeholder_type_id || '', placeholderTypes);
        const fieldType = getTypeName(field.field_type_id, valueTypes);

        const formField: FormField = {
          field_type_id: field.field_type_id,
          full_tag_name: field.full_tag_name,
          name: field.name,
          required: field.required,
          options: field.options || [],
          type: elementType,
          order: field.order || 0,
          field: {
            type: fieldType,
            name: field.full_tag_name,
            placeHolderLabel: field.name,
            label: field.name,
            key: field.full_tag_name,
            required: !!field.required,
            value: '',
          }
        };

        if (fieldType === 'Dropdown' || fieldType === 'Checkbox' || fieldType === 'Chips') {
          formField.field.options = field.options || [];
        }
        // Log field values
        console.log('field', field);

        stepMap[index].fields.push(formField);
      });
    });
 
    setFormData((prev: any) => ({
      ...prev,
      steps: Object.values(stepMap),
    }));

    // Ensure environments are set correctly
const currentEnv = import.meta.env.VITE_ENV;
    // Check if these contain the values you expect
console.log({ currentEnv, currentOption, options, visiblePlaceholders, fieldTypeIdGroups });


  }, [steps, setFormData, valueTypes, placeholderTypes]);

  const handleAddOption = (fieldKey: string) => {
  // Convert escape sequences to Unicode characters
  const unicodeValue = currentOption[fieldKey].replace(/\\u([\dA-F]{4})/gi, (match, grp) =>
    String.fromCharCode(parseInt(grp, 16))
  );

  setOptions((prev) => ({
    ...prev,
    [fieldKey]: [...(prev[fieldKey] || []), unicodeValue],
  }));

  setCurrentOption((prev) => ({
    ...prev,
    [fieldKey]: '',
  }));
  
    // Update the steps with new options
    setSteps(prevSteps => prevSteps.map(step => ({
      ...step,
      fields: step.fields.map(field => {
        if (field.full_tag_name === fieldKey) {
          return {
            ...field,
            options: [...field.options, currentOption[fieldKey]]
          };
        }
        return field;
      })
    })));
  };

  // Create a function to display Unicode correctly in inputs if needed
const handleChangeOptionInput = (fieldKey: string, value: string) => {
  setCurrentOption((prev) => ({
    ...prev,
    [fieldKey]: value,
  }));
};
  
  const handleRemoveOption = (fieldKey: string, option: string) => {
    setOptions(prev => ({
      ...prev,
      [fieldKey]: prev[fieldKey].filter(opt => opt !== option)
    }));
  
    // Update the steps to remove the option
    setSteps(prevSteps => prevSteps.map(step => ({
      ...step,
      fields: step.fields.map(field => {
        if (field.full_tag_name === fieldKey) {
          return {
            ...field,
            options: field.options.filter(opt => opt !== option)
          };
        }
        return field;
      })
    })));
  };


  useEffect(() => {
    if (resetForm) {
      setLeftFields(visiblePlaceholders);
      setSteps([]);
      setResetForm(false);
    }
  }, [resetForm, visiblePlaceholders]);


  const handleSelectStep = (stepIndex: number) => {
    const allFieldsSelected = steps[stepIndex].fields.every(field => selectedLeft.has(field.full_tag_name));
    const newSelected = new Set(selectedLeft);
  
    steps[stepIndex].fields.forEach(field => {
      if (allFieldsSelected) {
        newSelected.delete(field.full_tag_name);
      } else {
        newSelected.add(field.full_tag_name);
      }
    });
  
    setSelectedLeft(newSelected);
  
    // Count the number of steps where all fields are selected
    const count = steps.filter(step =>
      step.fields.every(field => newSelected.has(field.full_tag_name))
    ).length;
    
    setSelectedStepsCount(count);
  };

  const handleSelectLeft = (tagName: string, group = false) => {
    setSelectedLeft((prev) => {
      const newSelected = new Set(prev);
      if (group) {
        leftFields.forEach(field => {
          if (field.full_tag_name.startsWith(tagName)) {
            if (newSelected.has(field.full_tag_name)) {
              newSelected.delete(field.full_tag_name);
            } else {
              newSelected.add(field.full_tag_name);
            }
          }
        });
      } else {
        if (newSelected.has(tagName)) {
          newSelected.delete(tagName);
        } else {
          newSelected.add(tagName);
        }
      }
      return newSelected;
    });
  };

  const moveToRight = () => {
    const selectedFields = leftFields.filter(p => selectedLeft.has(p.full_tag_name));
    if (selectedFields.length > 0) {
      const isGroupedData = selectedFields.some(field => field.full_tag_name.includes('.'));
      const stepTitle = `Step ${steps.length + 1}`;

      const newStep: Step = {
        title: stepTitle,
        fields: selectedFields.map(p => ({
          ...p,
          field_type_id: p.field_type_id || '',
          type: getElementTypeName(p.placeholder_type_id || '', placeholderTypes),
          order: 0,
          name: p.name || '', // Ensure name is always a string
          required: !!p.required, // Ensure required is always present
          options: p.options || [], // Ensure options is always an array
          field: {
            type: getTypeName(p.field_type_id || '', valueTypes),
            name: p.full_tag_name,
            placeHolderLabel: p.name || '',
            label: p.name || '',
            key: p.full_tag_name,
            required: !!p.required,
            value: '',
            options: p.options || []
          }
        })),
        isGroup: isGroupedData,
      };

      setSteps((prev) => [
        ...prev,
        newStep
      ]);

      const updatedLeftFields = leftFields.filter(p => !selectedLeft.has(p.full_tag_name));
      setLeftFields(updatedLeftFields);
      setSelectedLeft(new Set());
    }
  };

  const moveToLeft = () => {
    const fieldsToMoveBack = steps.flatMap(step => step.fields.filter(field => selectedLeft.has(field.full_tag_name)));
    const updatedSteps = steps.map(step => ({
      ...step,
      fields: step.fields.filter(field => !selectedLeft.has(field.full_tag_name))
    })).filter(step => step.fields.length > 0);

    setLeftFields(prev => [...prev, ...fieldsToMoveBack]);
    setSteps(updatedSteps);
    setSelectedLeft(new Set());
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
  
    const { source, destination } = result;
  
    if (source.droppableId === destination.droppableId) {
      // Within the same step
      const stepIndex = parseInt(source.droppableId, 10);
      const newSteps = Array.from(steps);
      const stepFields = Array.from(newSteps[stepIndex].fields);
      const [movedItem] = stepFields.splice(source.index, 1);
      stepFields.splice(destination.index, 0, movedItem);
  
      // Update the order in fields based on the new position
      stepFields.forEach((field, index) => {
        field.order = index;
      });
  
      newSteps[stepIndex].fields = stepFields;
      setSteps(newSteps);
    }
  };

  const groupNames = [...new Set(
    leftFields
      .filter(field => field.full_tag_name.includes('.'))
      .map(field => field.full_tag_name.split('.')[0])
  )];

  // Component to render when no steps are selected
const NoStepsYet: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
     <FolderOpenOutlined sx={{ fontSize: 50, color: 'gray' }} />
    <Typography variant="h6" color="textSecondary">
      {title}
    </Typography>
    <Typography variant="body2" color="textSecondary">
      {subtitle}
    </Typography>
  </Box>
);

useEffect(() => {
  const calculateLeftSelectedCount = () => {
    const uniqueGroups = new Set<string>();
    let count = 0;

    leftFields.forEach(field => {
      if (selectedLeft.has(field.full_tag_name)) {
        if (field.full_tag_name.includes('.')) {
          const groupName = field.full_tag_name.split('.')[0];
          uniqueGroups.add(groupName);
        } else {
          count += 1;
        }
      }
    });

    return count + uniqueGroups.size;
  };

  // Execute calculation and update the count after logic completes
  const newCount = calculateLeftSelectedCount();
  setLeftSelectedCount(newCount);

}, [selectedLeft, leftFields]);
  return (
    <Grid container spacing={2} sx={{p: 3, height: '60vh'}}>
      <Grid item xs={5}>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{mb: 2}}>
          <Typography
            variant="h6"
            align="left"
            gutterBottom
            sx={{ fontSize: '20px', fontWeight: 700, lineHeight: '22px', marginRight: 2 }}
          >
            Group your fields into steps
          </Typography>
          <Typography
            variant="body2"
            align="left"
            sx={{ color: '#05051780', fontSize: '13px' }}
          >
            No. of Fields: {leftSelectedCount}
          </Typography>
        </Box>
       
        {/* <Grid 
          container 
          spacing={2} 
          sx={{
            p:1, 
            border: '1px solid  #0000000D', 
            borderRadius: '8px', 
            minHeight: '60vh', 
            pb: 2,
            display: 'flex',
            alignItems: leftFields.length === 0 ? 'center' : 'flex-start',
            justifyContent: leftFields.length === 0  ? 'center' : "flex-start",
          }}> */}
      <Box border={1}  borderRadius={1}  sx={{p:1, border: '1px solid  #0000000D', borderRadius: '8px',  height: '55vh', overflow: 'scroll' }}>
        {groupNames.map((groupName, index) => (
        <Box key={index} border={1} p={1} borderRadius={2} borderColor="#0000000D" sx={{width: '95%', marginLeft: '10px', marginTop: '5px', marginBottom: '10px'}}>
          <Grid container alignItems="center" >
            <Grid item sx={{marginLeft: '0px'}}>
              <Checkbox
                checked={leftFields
                  .filter(field => field.full_tag_name.startsWith(`${groupName}.`))
                  .every(field => selectedLeft.has(field.full_tag_name))
                }
                onChange={() => {
                  const groupFields = leftFields.filter(field => field.full_tag_name.startsWith(`${groupName}.`));
                  const shouldSelect = groupFields.some(field => !selectedLeft.has(field.full_tag_name));
                  setSelectedLeft(prev => {
                    const newSelected = new Set(prev);
                    groupFields.forEach(field => {
                      if (shouldSelect) {
                        newSelected.add(field.full_tag_name);
                      } else {
                        newSelected.delete(field.full_tag_name);
                      }
                    });
                    return newSelected;
                  });
                }}
              />
            </Grid>
            <Grid item xs>
              <Typography variant="subtitle2" style={{ fontWeight: 'bold' }}>
                {groupName}
              </Typography>
            </Grid>
          </Grid>
              {leftFields
                .filter(field => field.full_tag_name.startsWith(`${groupName}.`))
                .map((placeholder, idx) => (
                  <Grid key={idx} container alignItems="center" spacing={2}>
                    <Grid item xs sx={{height: '56px', marginLeft: '60px', marginTop: '5px', marginBottom: '5px'}}>
                      <Typography variant="body1">{placeholder.full_tag_name.split('.')[1]}</Typography>
                    </Grid>
                    <Grid item>
                      {/* <Select value={placeholder.field_type_id} displayEmpty disabled>
                        <MenuItem value="" disabled>Field type</MenuItem>
                        {valueTypes.map((type) => (
                          <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                        ))}
                      </Select> */}
                    </Grid>
                  </Grid>
                ))}
            </Box>
          ))}
          {leftFields.length === 0 ? (
          <NoStepsYet title={'No fields left'} subtitle={'There are no addional fieldsleft to organise'} />  // Display when no steps are selected
      ) : (
          leftFields.map((placeholder, index) => !placeholder.full_tag_name.includes('.') && (
            <Grid key={index} container alignItems="center" spacing={2}>
              <Grid item>
                <Checkbox
                sx={{ml: 2}}
                  checked={selectedLeft.has(placeholder.full_tag_name)}
                  onChange={() => handleSelectLeft(placeholder.full_tag_name)}
                />
              </Grid>
              <Grid item xs sx={{height: '56px', marginLeft: '5px', marginTop: '5px', marginBottom: '5px', alignContent: 'center'}}>
                <Typography variant="body1">{placeholder.full_tag_name}</Typography>

              </Grid>
              <Grid item>
                {/* <Select value={placeholder.field_type_id} displayEmpty disabled>
                  <MenuItem value="" disabled>Field type</MenuItem>
                  {valueTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                  ))}
                </Select> */}
              </Grid>
            </Grid>
          )))}
        {/* </Grid> */}
        </Box>
      </Grid>
      <Grid item container xs={1} justifyContent="flex-start" alignItems="center" direction="column" gap={1} sx={{mt:6}}>
        <Button variant="outlined" size="small" onClick={moveToRight}  disabled={leftSelectedCount === 0} sx={{
          backgroundColor: '#025EA3',
          color: '#FFF',
          borderRadius: '8px',
          boxShadow: 'none',
          width: 57,
          height: 57,
          borderColor: '#E0E0E0',
          '&:hover': {
            borderColor: '#E0E0E0',
            backgroundColor: '#025EA320',
          },
          '&.Mui-disabled': {
            backgroundColor: 'lightgray', // Set disabled background color to gray
            color: 'darkgray', // Set disabled text/icon color to dark gray
            '& .MuiSvgIcon-root': {
              color: 'darkgray', // Icon color when disabled
            },
          },
        }}>
          <ArrowForwardIcon />
        </Button>
        <Button variant="outlined" size="small" onClick={moveToLeft} 
        disabled={selectedStepsCount === 0}
        sx={{
          color: '#025EA3',
          borderColor: '#025EA3',
          borderRadius: '8px',
          width: 57,
          height: 57,
          '&:hover': {
            borderColor: '#E0E0E0',
            color: '#E0E0E0',
            backgroundColor: 'transparent',
          },
          '&.Mui-disabled': {
            // backgroundColor: 'lightgray', // Set disabled background color to gray
            color: 'darkgray', // Set disabled text/icon color to dark gray
            '& .MuiSvgIcon-root': {
              color: 'darkgray', // Icon color when disabled
            },
          },
        }}>
          <ArrowBackIcon />
        </Button>
      </Grid>
      <Grid item xs={6}>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{mb: 2}}>
          <Typography
            variant="h6"
            align="left"
            gutterBottom
            sx={{ fontSize: '20px', fontWeight: 700, lineHeight: '22px', marginRight: 2 }}
          >
            Steps created
          </Typography>
          <Typography
            variant="body2"
            align="left"
            sx={{ color: '#05051780', fontSize: '13px' }}
          >
            No. of Steps: {selectedStepsCount}
          </Typography>
        </Box>
  
        <Box border={1}  borderRadius={1} minHeight="200px"  sx={{p:1, border: '1px solid  #0000000D', borderRadius: '8px',  height: '55vh', overflow: 'scroll' }}>
          <DragDropContext onDragEnd={onDragEnd}>
          
            {steps.length === 0 ? (
              <NoStepsYet title={'No steps yet'} subtitle={'Select fields from the left-hand pane and move them here to organise them into steps.'}/>  // Display when no steps are selected
            ) : (
            steps.map((step, stepIndex) => (
              <Droppable droppableId={String(stepIndex)} key={stepIndex}>
                {(provided) => (
                  <Box ref={provided.innerRef} {...provided.droppableProps} mb={2} sx={{p:1, border: '1px solid  #0000000D', borderRadius: '8px',}}>
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item>
                        <Checkbox
                          checked={step.fields.every(field => selectedLeft.has(field.full_tag_name))}
                          onChange={() => handleSelectStep(stepIndex)}
                        />
                      </Grid>
                      <Grid item xs>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{`Step ${stepIndex + 1}`}</Typography>
                      </Grid>
                      <Grid item >
                        <TextField
                          fullWidth
                          label="Step name"
                          value={step.title}
                          onChange={(e) => {
                            const newSteps = Array.from(steps);
                            newSteps[stepIndex].title = e.target.value;
                            setSteps(newSteps);
                          }}
                          variant="filled"
                          sx={{
                            mb: 2,
                            backgroundColor: 'rgba(37, 147, 209, 0.05)',
                            width: '290px',
                            height: '56px',
                            borderRadius: '8px',
                            '& .MuiFilledInput-root': {
                              backgroundColor: 'rgba(37, 147, 209, 0.05)',
                              borderRadius: '8px',
                              padding: '0 12px',
                              display: 'flex',
                              alignItems: 'center', 
                              '&:before, &:after': {
                                borderBottom: 'none',
                              },
                              '&:hover:not(.Mui-disabled):before': {
                                borderBottom: 'none',

                              },
                            },
                            '& .MuiInputBase-input': {
                              padding: '0',
                              height: '56px', 
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                    <Box mt={1}>
                      {step.fields.map((field, fieldIndex) => {
                        const isPartOfGroup = field.full_tag_name.includes('.');
                        // const isFieldTypeValid = fieldTypeIdGroups[currentEnv]?.includes(field.field_type_id);
                        const fieldTypeName = getTypeName(field.field_type_id, valueTypes);
                        const isFieldTypeValid = fieldTypeNameGroups.includes(fieldTypeName);
                        return !isPartOfGroup ? (
                          <>
                          <Draggable key={field.full_tag_name} draggableId={`${field.full_tag_name}-${stepIndex}`} index={fieldIndex}>
                            {(provided) => (
                              <Grid
                                container
                                alignItems="center"
                                spacing={2}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                              >
                                <Grid item {...provided.dragHandleProps}>
                                  <DragIndicatorIcon sx={{ cursor: 'grab' }} />
                                </Grid>
                                <Grid item xs>
                                  <Typography variant="body1">{field.full_tag_name}</Typography>
                                </Grid>
                                <Grid item>
                                  <Select value={field.field_type_id} onChange={(e) => {
                                    const newSteps = Array.from(steps);
                                    newSteps[stepIndex].fields[fieldIndex].field_type_id = e.target.value as string;
                                    setSteps(newSteps);
                                  }} displayEmpty
                                  variant="outlined"
                                  sx={{
                                    mb: 1,
                                    backgroundColor: 'rgba(37, 147, 209, 0.05)',
                                    width: '290px',
                                    height: '56px',
                                    borderRadius: '8px',
                                    '& .MuiFilledInput-root': {
                                      backgroundColor: 'rgba(37, 147, 209, 0.05)',
                                      borderRadius: '8px',
                                      padding: '0 12px',
                                      display: 'flex',
                                      alignItems: 'center', 
                                      '&:before, &:after': {
                                        borderBottom: 'none',
                                      },
                                      '&:hover:not(.Mui-disabled):before': {
                                        borderBottom: 'none',
                                      },
                                    },
                                    '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                                  }}
                                  >
                                    <MenuItem value="" disabled>Field type</MenuItem>
                                    {valueTypes.map((type) => type.name !== 'Repeating'&& (
                                      <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                                    ))}
                                  </Select>
                        
                                     <Box>
  
                                    </Box>
                                </Grid>
                              </Grid>
                              
                            )}
                          </Draggable>
                                    {isFieldTypeValid && (
                                      <Box display="flex" alignItems="center" mt={1}>
                                        <Button
                                          size="small"
                                          onClick={() => handleAddOption(field.full_tag_name)}
                                          disabled={!currentOption[field.full_tag_name]}
                                          variant='outlined'
                                          sx={{
                                            color: '#025EA3',
                                            width: '56px',
                                            height: '48px',
                                            marginRight: '10px',
                                            borderRadius: '8px',
                                            alignSelf: 'center'
                                          }}
                                        >
                                         <AddIcon/>
                                        </Button>
                                        <TextField
                                          size="small"
                                          value={currentOption[field.full_tag_name] || ''}
                                          onChange={(e) => handleChangeOptionInput(field.full_tag_name, e.target.value)}
                                          placeholder="Add option"
                                          sx={{
                                            mb: 2,
                                            backgroundColor: 'rgba(37, 147, 209, 0.05)',
                                            width: '100%',
                                            height: '56px',
                                            borderRadius: '8px',
                                            '& .MuiFilledInput-root': {
                                              backgroundColor: 'rgba(37, 147, 209, 0.05)',
                                              borderRadius: '8px',
                                              padding: '0 12px',
                                              display: 'flex',
                                              alignItems: 'center', 
                                              '&:before, &:after': {
                                                borderBottom: 'none',
                                              },
                                              '&:hover:not(.Mui-disabled):before': {
                                                borderBottom: 'none',
                                              },
                                            },
                                            '& .MuiInputBase-input': {
                                              padding: '0',
                                              height: '56px', 
                                            },
                                          }}
                                        />
                                      </Box>
                                    )}
                                      {options[field.full_tag_name]?.map((option, index) => (
                                            <Box key={index} display="flex" alignItems="center" justifyContent={'space-between'} sx={{
                                              mb: 2,
                                              marginLeft: '76px',
                                              paddingLeft: '12px',
                                              backgroundColor: 'rgba(37, 147, 209, 0.05)',
                                              height: '56px',
                                              borderRadius: '8px',
                                            }}>
                                            <Typography variant="body1">{option}</Typography>
                                            <Button size="small" onClick={() => handleRemoveOption(field.full_tag_name, option)} variant='text' sx={{color: '#F00',  width: '56px',
                                            height: '48px',}}>
                                                <DeleteOutlineIcon />
                                            </Button>
                                            </Box>
                                        ))}
                                    </>
                        ) : null;
                      })}
                    </Box>
                    {step.isGroup && (
                      <Draggable key={`group-${stepIndex}`} draggableId={`group-${stepIndex}`} index={stepIndex}>
                        {(provided) => (
                          <Box
                            mt={1}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            border={1}
                            p={1}
                            borderRadius={1}
                            borderColor="grey.300"
                          >
                            <Grid container alignItems="center" spacing={2}>
                              <Grid item {...provided.dragHandleProps}>
                                <DragIndicatorIcon sx={{ cursor: 'grab' }} />
                              </Grid>
                              <Grid item xs>
                                <Typography variant="subtitle2" style={{ fontWeight: 'bold' }}>
                                  Group
                                </Typography>
                              </Grid>
                            </Grid>
                            {step.fields.map((field, fieldIndex) => {
                              const isPartOfGroup = field.full_tag_name.includes('.');
                              // const isFieldTypeValid = fieldTypeIdGroups[currentEnv]?.includes(field.field_type_id);
                              const fieldTypeName = getTypeName(field.field_type_id, valueTypes);
                              const isFieldTypeValid = fieldTypeNameGroups.includes(fieldTypeName);
                              return isPartOfGroup ? (
                                <Grid
                                  container
                                  alignItems="center"
                                  spacing={2}
                                  key={field.full_tag_name}
                                >
                                  <Grid item xs sx={{height: '56px', marginLeft: '40px', marginTop: '5px', marginBottom: '5px'}} >
                                    <Typography variant="body1">{field.name}</Typography>
                                  </Grid>
                                  <Grid item>
                                    <Select 
                                      value={field.field_type_id} 
                                      onChange={(e) => {
                                        const newSteps = Array.from(steps);
                                        newSteps[stepIndex].fields[fieldIndex].field_type_id = e.target.value as string;
                                        setSteps(newSteps);
                                      }} 
                                      displayEmpty
                                      variant="outlined"
                                      sx={{
                                        mb: 1,
                                        backgroundColor: 'rgba(37, 147, 209, 0.05)',
                                        width: '290px',
                                        height: '56px',
                                        borderRadius: '8px',
                                        '& .MuiFilledInput-root': {
                                          backgroundColor: 'rgba(37, 147, 209, 0.05)',
                                          borderRadius: '8px',
                                          padding: '0 12px',
                                          display: 'flex',
                                          alignItems: 'center', 
                                          '&:before, &:after': {
                                            borderBottom: 'none',
                                          },
                                          '&:hover:not(.Mui-disabled):before': {
                                            borderBottom: 'none',
                                          },
                                        },
                                        '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                                      }}
                                    >
                                      <MenuItem value="" disabled>Field type</MenuItem>
                                      {valueTypes.map((type) => type.name !== 'Repeating'&& (
                                        <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                                      ))}
                                    </Select>
                                    {isFieldTypeValid && (
                                      <Box display="flex" alignItems="center" mt={1}>
                                        <Button
                                          size="small"
                                          onClick={() => handleAddOption(field.full_tag_name)}
                                          disabled={!currentOption[field.full_tag_name]}
                                          variant='outlined'
                                          sx={{
                                            color: '#025EA3',
                                            width: '56px',
                                            height: '48px',
                                            marginRight: '10px',
                                            borderRadius: '8px',
                                            alignSelf: 'center'
                                          }}
                                        >
                                         <AddIcon/>
                                        </Button>
                                        <TextField
                                          size="small"
                                          value={currentOption[field.full_tag_name] || ''}
                                          onChange={(e) => handleChangeOptionInput(field.full_tag_name, e.target.value)}
                                          placeholder="Add option"
                                          sx={{
                                            mb: 2,
                                            backgroundColor: 'rgba(37, 147, 209, 0.05)',
                                            width: '100%',
                                            height: '56px',
                                            borderRadius: '8px',
                                            '& .MuiFilledInput-root': {
                                              backgroundColor: 'rgba(37, 147, 209, 0.05)',
                                              borderRadius: '8px',
                                              padding: '0 12px',
                                              display: 'flex',
                                              alignItems: 'center', 
                                              '&:before, &:after': {
                                                borderBottom: 'none',
                                              },
                                              '&:hover:not(.Mui-disabled):before': {
                                                borderBottom: 'none',
                                              },
                                            },
                                            '& .MuiInputBase-input': {
                                              padding: '0',
                                              height: '56px', 
                                            },
                                          }}
                                        />
                                      </Box>
                                    )}
                                      {options[field.full_tag_name]?.map((option, index) => (
                                            <Box key={index} display="flex" alignItems="center" justifyContent={'space-between'} sx={{
                                              mb: 2,
                                              marginLeft: '76px',
                                              paddingLeft: '12px',
                                              backgroundColor: 'rgba(37, 147, 209, 0.05)',
                                              height: '56px',
                                              borderRadius: '8px',
                                            }}>
                                            <Typography variant="body1">{option}</Typography>
                                            <Button size="small" onClick={() => handleRemoveOption(field.full_tag_name, option)} variant='text' sx={{color: '#F00',  width: '56px',
                                            height: '48px',}}>
                                                <DeleteOutlineIcon />
                                            </Button>
                                            </Box>))}
                                  </Grid>
                                </Grid>
                              ) : null;
                            })}
                          </Box>
                        )}
                      </Draggable>
                    )}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            )))}
          </DragDropContext>
        </Box>
      </Grid>
    </Grid>
  );
};

const getElementTypeName = (placeholder_type_id: string, placeholderTypes: any) =>
  (placeholderTypes.find((type: any) => type.id === placeholder_type_id) || {}).name || '';

const getTypeName = (field_type_id: string, valueTypes: ValueType[]) =>
  (valueTypes.find(type => type.id === field_type_id) || {}).name || '';

export default FieldsScreen;
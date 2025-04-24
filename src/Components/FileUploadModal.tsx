import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  TextField,
  Checkbox, 
  Chip,
  Paper} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import UploadIcon from '@mui/icons-material/Upload';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PageviewIcon from '@mui/icons-material/Pageview';
import {
  CreateDocument,
  GetAllPlaceholders,
  GetAllPlaceholderTypes,
  GetFieldTypes,
  GetFilePlaceholders,
} from "../SupabaseMockEdgeFunctions";
import FieldsScreen from './FieldsScreen';
import GenericDataListChips from './GenericDataListChips'
import { useToast } from '../Components/Toast/ToastContext';
import { createJsonForMobile } from '../utilities/CreateJsonForMobile';
import { DocumentController } from "../ApiCrud";
import supabaseClient from '../supabaseClient';
import moment from 'moment';
import PizZip from "pizzip";
import { TemplateHandler } from "easy-template-x";

export interface Placeholder {
  full_tag_name: string;
  placeholder_type_id?: string;
  field_type_id?: string;
  masterFolderId?: string;
  name?: string;
  required?: boolean;
  options?: any[];
  order?: number;
  step?: number;
  [key: string]: any;
}

export interface genericListPlaceholder extends Placeholder{
  full_tag_name: string;
  placeholder_type_id?: string;
  field_type_id?: string;
  masterFolderId?: string;
  name?: string;
  required?: boolean;
  options?: any[];
  order?: number;
  step?: number;
  [key: string]: any;
}
interface FilePlaceholder {
  name: string;
  tag_name: string;
  parent_tag_name: string;
  full_tag_name: string;
  placeholder_text: string;
  placeholder_type_id: string;
  field_type_id: number;
}

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  masterFolderId: string;
}
  
interface FormValues {
  [key: string]: any; // Adjust this according to your form structure
}


const FileUploadModal: React.FC<FileUploadModalProps> = ({ open, onClose, masterFolderId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [screen, setScreen] = useState<'select' | 'upload' | 'uploadpdf' | 'fields'>('select');
  const [existingPlaceholders, setExistingPlaceholders] = useState<Placeholder[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [placeholderTypes, setPlaceholderTypes] = useState<any[]>([]);
  const [valueTypes, setValueTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [genericDataList, setGenericDataList] = useState<Placeholder[]>([]);
  const [inputDataList, setInputDataList] = useState<Placeholder[]>([]);
  const [isFileValid, setIsFileValid] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string>('');
  const [pdfReview, setPdfReview] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    formName: string;
    code: string;
    revisionNumber: string;
    revisionDate: string;
    title: string;
    placeholders: Placeholder[];
  }>({
    formName: '',
    code: '',
    revisionNumber: '',
    revisionDate: '',
    title: '',
    placeholders: [],
  });
  const { showMessage } = useToast();
  const [receiveNotifications, setReceiveNotifications] = useState(false);
  const [notificationFrequencies, setNotificationFrequencies] = useState([]);
  const [selectedFrequencyId, setSelectedFrequencyId] = useState(null);
  const [resetForm, setResetForm] = useState(false);
  const [hasWatermark, setHasWatermark] = useState(true);
  const [watermark, setWatermark] = useState('');
  const [preview, setPreview] = useState(false);
  const [title, setTitle] = useState('');
  const [screenHistory, setScreenHistory] = useState<string[]>(['select']);


  useEffect(() => {
    let mounted = true;

    Promise.allSettled([GetAllPlaceholders(), GetAllPlaceholderTypes(), GetFieldTypes()])
        .then((responses) => {
            if (!mounted) return;
            if (responses[0].status === "fulfilled") setExistingPlaceholders(responses[0].value);
            if (responses[1].status === "fulfilled") setPlaceholderTypes(responses[1].value);
            if (responses[2].status === "fulfilled") setValueTypes(responses[2].value);
        })
        .finally(() => {
            if (!mounted) return;
            
        });

    return () => {
        mounted = false;
    };
}, []);

useEffect(() => {
  if (screen === 'fields') {
    const genericDataTypeId = '33d914a6-b31d-4acd-99be-927a1ad6150b';
    const masterFileTypeId = 'bdb11833-fabb-414c-84a2-8138a8af4e0a';

    const removeDuplicates = (placeholders: any[]) => {
      const seen = new Set();
      return placeholders.filter((placeholder: { full_tag_name: unknown; }) => {
        if (seen.has(placeholder.full_tag_name)) {
          return false;
        } else {
          seen.add(placeholder.full_tag_name);
          return true;
        }
      });
    };

    const filteredGenericDataList = removeDuplicates(
      placeholders.filter(placeholder => (placeholder.placeholder_type_id === genericDataTypeId || placeholder.placeholder_type_id === masterFileTypeId))
    );

    const filteredInputDataList = removeDuplicates(
      placeholders.filter(placeholder => (placeholder.placeholder_type_id !== genericDataTypeId && placeholder.placeholder_type_id !== masterFileTypeId ))
    );

    setGenericDataList(filteredGenericDataList);
    setInputDataList(filteredInputDataList);
    setLoading(false);

   
  }
}, [screen, placeholders]);

useEffect(() => {
  const fetchNotificationFrequencies = async () => {
    const { data, error } = await supabaseClient
      .from('notification_frequency')
      .select('id, frequency');

    if (error) {
      console.error('Failed to fetch notification frequencies:', error);
    } else {
      setNotificationFrequencies(data);
    }
  };

  fetchNotificationFrequencies();
}, []);

const goBack = () => {
  setScreenHistory(prevHistory => {
    if (prevHistory.length > 1) {
      const newHistory = [...prevHistory];
      newHistory.pop(); // Remove current screen
      setScreen(newHistory[newHistory.length - 1] as 'select' | 'upload' | 'uploadpdf' | 'fields'); // Navigate to previous screen
      return newHistory;
    }
    return prevHistory; // If no previous history, do nothing
  });
};

const handlePreviewClick = async () => {
  if (selectedFile) {
    try {
      // Fetch all field types
      const fieldTypes = await DocumentController.getFieldTypes();

      // Convert genericDataList to a format similar to formData.steps fields
      const dataListFields = genericDataList.map((item) => {
        
        const fieldType = fieldTypes.find(type => type.id === item.field_type_id);

        return {
          type: fieldType?.name || 'Text', // Use name from field types
          value: '', // Set if needed for preview
          required: item.required || false,
          order: item.order || 0,
          options: item.options || [],
          field_type_id: item.field_type_id,
          full_tag_name: item.full_tag_name,
          name: item.name,
          field: {
            key: item.full_tag_name.split('.').pop(),
            label: item.full_tag_name.split('.').pop(),
            name: item.name,
            placeholderLabel: item.placeholder_lable,
            required: item.required || false,
            type: fieldType?.name || 'Text', // Use name from field types
            value: '', // Set if needed for preview
          }
        };
      });

      // Add dataListFields to the first step's fields in formData.steps
      if(formData.steps.length === 0){
        formData.steps.push({
          title: 'Step 1',
          fields: [ ...dataListFields],
        })
      }
      const updatedSteps = formData.steps.map((step, index) => {
        if (index === 0) {
          return {
            ...step,
            fields: [...step.fields, ...dataListFields],
          };
        }
        return step;
      });

      const jsonData = createJsonForMobile('', updatedSteps, true).data;
      console.log('Combined Data:', jsonData);

      const formData2 = new FormData();
      formData2.append('file', selectedFile);
      formData2.append('jsonData', JSON.stringify(jsonData));

    
      const response = await fetch(import.meta.env.VITE_ENV !== 'development' ? 'https://be.amkhoib.org/preview-doc' : 'http://20.164.23.128:3001/preview-doc', {
        method: 'POST',
        body: formData2,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Automatically open the PDF in a new window
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error during preview operation:', error);
    }
  }
};

const resetModal = () => {
  setSelectedFile(null);
  setScreen('select');
  setScreenHistory(['select']);
  setFormData({
    formName: '',
    code: '',
    revisionNumber: '',
    revisionDate: '',
    title: '',
    placeholders: [],
  });
  setPlaceholders([]);
  setSelectedFrequencyId(null);
  setReceiveNotifications(false);
  setHasWatermark(true);
  setGenericDataList([]); // Reset the generic data list
  setInputDataList([]); // Reset input data list if needed
  setTitle('');
  onClose();
};

const handleSubmit = async (values: FormValues): Promise<void> => {
  const documentId = '';
  let name= values?.fileName;
  const fileExtension = name.split('.').pop();
  const fileNameWithoutExtension = name.replace(`.${fileExtension}`, '');
  const timestamp = Math.floor(Date.now() / 1000);
  let dynamicFormData = {};
  name = `${fileNameWithoutExtension}_${timestamp}.${fileExtension}`;
  if(preview){
    name = `preview_${name}`;
  }

  try {
    const supabaseStorageUrl = import.meta.env.VITE_SUPABASE_URL + "/storage/v1/object/public/files/";
    const formData = {
      master_file_id: masterFolderId,
      file_name: name,
      title: values?.title,
      code: values?.code,
      revision_number: values?.revisionNumber,
      revision_date: values?.revisionDate,
      has_watermark: hasWatermark,
      notification_frequency: selectedFrequencyId, // Include this
      path: `${supabaseStorageUrl}${name}`,
      dynamic_form_data: createJsonForMobile(documentId, values.steps, false),
      order: 0,
    };
    if (selectedFile) {
      dynamicFormData = await CreateDocument(selectedFile, formData, placeholders,values.steps, genericDataList, preview);
      showMessage('Your document has been added successfully', 'success');
    } else {
      console.error("No file selected");
      showMessage('Error saving document', 'error');
    }
  } catch (error) {
    console.error("Failed to create new master file: ", error);
    showMessage(`Failed to create new master file`, 'error');
  }finally{
    if(preview){
      handlePreviewClick(dynamicFormData)
    }else{
      onClose();
      resetModal();
    }
  }
};

const handleSelection = (option: 'newWebform' | 'newPdfDocx') => {
  setScreen(option === 'newWebform' ? 'upload' : 'uploadpdf');
  setScreenHistory(prevHistory => [...prevHistory, option === 'newWebform' ? 'upload' : 'uploadpdf']);
};

const handleFieldChange = (field: string, value: string) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
};

  const AssignExistingPlaceholders = (placeholders: Placeholder[]): Placeholder[] => {
  if (!(placeholders?.length > 0)) return placeholders;

  const assignedPlaceholders = placeholders.map((placeholder) => {
    const existingPlaceholder = existingPlaceholders.find((p) => p.full_tag_name === placeholder.full_tag_name);

    if (!existingPlaceholder) return placeholder;
    if (existingPlaceholder.placeholder_type_id === 'bdb11833-fabb-414c-84a2-8138a8af4e0a') return null;

    return { ...existingPlaceholder };
  });

  return assignedPlaceholders.filter((p): p is Placeholder => p !== null);
};

let docJson = {
  DocTitle: formData.title,
  DocCode: formData.code,
  RevNum: 0,
  RevDate: moment().format("yyyy-MM-DD"),
  ...formData,
};

// Function to extract placeholders from XML content
const extractPlaceholders = (xmlContent: string): string[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
  const textElements = xmlDoc.getElementsByTagName('w:t');
  
  const placeholders: string[] = [];
  for (let i = 0; i < textElements.length; i++) {
    const textContent = textElements[i].textContent || '';
    // const matches = textContent.match(/\{[^}]+\}/g);
    const matches = textContent.match(/{{[^}]+}}|\{[^}]+\}/g);
    if (matches) {
      placeholders.push(...matches);
    }
  }
  
  return placeholders;
};


// Assume these utility functions exist
const normaliseString = (str: string): string => {
  // Normalization logic
  return str.trim();
};


const convertPlaceholders = (placeholders: string[]): FilePlaceholder[] => {
  return placeholders.map(placeholderName => {
    const tagPrefixes = placeholderName.split('.');

    return {
      name: normaliseString(tagPrefixes.pop() || ""),
      tag_name: placeholderName,
      parent_tag_name: tagPrefixes.join("."),
      full_tag_name: placeholderName,
      placeholder_text: `{${placeholderName}}`,
      placeholder_type_id: "", // Assuming you set this elsewhere
      field_type_id: 0, // Assuming you set this elsewhere
    };
  });
};

// Main function to process DOCX file and extract placeholders
const processDocxFile = async (fileBlob: File) => {
  const arrayBuffer = await fileBlob.arrayBuffer();
  const validForm = await testDocFormat(arrayBuffer, docJson, watermark);
  if (!validForm.success) {
    setValidationError(validForm.error);
    setIsFileValid(false);
  } else {
    setValidationError('');
    setIsFileValid(true);
  }

  const zip = new PizZip(arrayBuffer);

  // Extract placeholders from headers
  const headers = [ 'word/header.xml','word/header1.xml', 'word/header2.xml', 'word/header3.xml',  'word/header4.xml',  'word/header5.xml'];
  let headerPlaceholders: string[] = [];
  headers.forEach(header => {
    const headerFile = zip.file(header);
    if (headerFile) {
      const headerText = headerFile.asText();
      headerPlaceholders.push(...extractPlaceholders(headerText));
    }
  });
  headerPlaceholders = headerPlaceholders.map(placeholder => placeholder.replace(/[{}]/g, ''));

  return convertPlaceholders(headerPlaceholders);
};

// Function to remove duplicates based on 'full_tag_name'
const filterUniquePlaceholders = (placeholders) => {
  const seen = new Set();
  return placeholders.filter(placeholder => {
    if (seen.has(placeholder.full_tag_name)) {
      return false;
    } else {
      seen.add(placeholder.full_tag_name);
      return true;
    }
  });
};

const testDocFormat = async (
  fileArrayBuffer: ArrayBuffer,
  docJsonData: any,
  watermark?: string | null
): Promise<{ success: boolean; error: string }> => {
  try {
    const zip = new PizZip(fileArrayBuffer);
    const handler = new TemplateHandler();

    if (watermark) {
      const headerFile = zip.file('word/header2.xml');
      if (headerFile) {
        const headerText = headerFile
          .asText()
          .replace('{Watermark}', watermark);
        const wordFolder = zip.folder('word');
        wordFolder?.file('header2.xml', headerText);
      }
    }

    await handler.process<ArrayBuffer>(fileArrayBuffer, docJsonData);
    return { success: true, error: '' };
  } catch (e) {
    if (typeof e === 'string') {
      return { success: false, error: e };
    } else if (e instanceof Error) {
      return { success: false, error: e.message };
    }
    return { success: false, error: 'Unknown error' };
  }
};


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      handleFieldChange('title', fileNameWithoutExtension);
      setTitle(fileNameWithoutExtension);
      if(screen !== 'uploadpdf'){
      try {

        setLoading(true);
        // Replace the placeholders in the document header, body and watermark
        const placeholdersHeader = await processDocxFile(file, hasWatermark);
        const response = await GetFilePlaceholders(file);

        const combinedPlaceholders = [...response, ...placeholdersHeader];
        const uniquePlaceholders = filterUniquePlaceholders(combinedPlaceholders);
        const filteredPlaceholders = filterPlaceholders(uniquePlaceholders, genericDataList);
        // Update placeholders state
   
        setPlaceholders(AssignExistingPlaceholders(filteredPlaceholders));
        
        // Update formData state
        setFormData((prev) => ({
          ...prev,
          fileName: `${file.name}`,
          placeholders: filteredPlaceholders,
    }));

      } catch (error) {
        console.error('Error processing file:', error);
      } 
    }}
  };

  const filterPlaceholders = (placeholders: Placeholder[], genericDataList: Placeholder[]): Placeholder[] => {
    // Create a map to track the complete placeholders
    const detailedPlaceholders = new Map<string, Placeholder>();
  
    // First pass, create a map without overwriting existing items that have details
    placeholders.forEach(placeholder => {
      if (!placeholders.placeholder_type_id || !placeholders.field_type_id) {
        if (!detailedPlaceholders.has(placeholder.full_tag_name)) {
          detailedPlaceholders.set(placeholder.full_tag_name, placeholder);
        }
      } else {
        detailedPlaceholders.set(placeholder.full_tag_name, placeholder);
      }
    });
  
    // Second pass to remove those from genericDataList matching detailed criteria
    const filteredPlaceholders = placeholders.filter(placeholder => {
      const matchingPlaceholder = genericDataList.find(genPlaceholder => genPlaceholder.full_tag_name === placeholder.full_tag_name);
      // If a matching generic placeholder is found and it has a full definition or the current placeholder is already full, keep it
      return !matchingPlaceholder || (!!placeholder.field_type_id && !!placeholder.placeholder_type_id);
    });
  
    return filteredPlaceholders;
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setValidationError(''); // Clear validation error
    setIsFileValid(true); // Reset valid state when file is removed
    setGenericDataList([]); // Reset the generic data list
    setInputDataList([]); // Reset input data list if needed
    setTitle('');
  };


  const handleNext = async () => {;
    if(screen === 'uploadpdf'){
      if (selectedFile) {
        const supabaseStorageUrl = import.meta.env.VITE_SUPABASE_URL + "/storage/v1/object/public/files/";
        const sanitizedFileName = replaceSpacesWithUnderscores(selectedFile.name);
        const newFile = new File([selectedFile], sanitizedFileName, { type: selectedFile.type });
        await DocumentController.uploadFile(newFile);
        const { error: documentError } = await supabaseClient
        .from('documents')
        .insert({
          file_name: newFile.name,
          title: formData.title,
          notification_frequency: selectedFrequencyId, // Include this
          path: `${supabaseStorageUrl}${newFile.name}`,
          master_file_id: masterFolderId
        })
        .select();

      if (documentError) throw documentError;

        showMessage('Your document has been added successfully', 'success');
       
        resetModal();
        onClose();
      }
    }

    if(screen === 'fields'){
      handleSubmit(formData);
    }
    if (selectedFile) {
      setScreen('fields');
      setScreenHistory(prevHistory => [...prevHistory, 'fields']);
    }
    
  };


  const replaceSpacesWithUnderscores = (fileName: string) => {
    return fileName.replace(/\s+/g, '_');
  }

  return (
    <Dialog 
      open={open} 
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
          // Do nothing if backdrop is clicked
          return;
        }
        if (reason === 'escapeKeyDown') {
          // Do nothing if escape key is pressed
          return;
        }
        resetModal();
        onClose();
       }} 
       maxWidth={screen !== 'fields' ? "xs" : "xl"} 
       fullWidth
       disableEscapeKeyDown 
       sx={{ height: '100vh', overflow: 'hidden' }}
      >
<DialogTitle>
{screen === 'upload' ||  screen === 'uploadpdf' ? <><Box display="flex" justifyContent="center" alignItems="center">
    <IconButton disabled>
      <FolderIcon sx={{ fontSize: 48, color: '#2593D1' }} />
    </IconButton>
  </Box>
  <Typography variant="h6" align="center" gutterBottom sx={{ fontSize: '20px', fontWeight: 700, lineHeight: '22px' }}>
    Add your file
  </Typography>
  </> :  <Typography variant="h6" align={screen === 'select' ? "center" : "left"} gutterBottom={screen === 'select'} sx={{ fontSize: '20px', fontWeight: 700, lineHeight: '22px' }}>
  {screen === 'select' ? 'What would you like to add?' : 'This document will be branded with'}
  </Typography>}
  <IconButton
    onClick={() => {
      resetModal();
      onClose();
    }}
    sx={{
      position: 'absolute',
      right: 8,
      top: 8,
      color: (theme) => theme.palette.grey[500],
    }}
  >
    <CloseIcon />
  </IconButton>
</DialogTitle>
      <DialogContent sx={{height: screen === 'fields' ? '90vh' : '100%'}}>
      {screen === 'select' && (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2} mt={2}>
            <Button size="large" variant="outlined" onClick={() => handleSelection('newWebform')} sx={{ width: '392px', height: '56px' }}>
              + New Webform
            </Button>
            <Button size="large" variant="outlined" onClick={() => handleSelection('newPdfDocx')} sx={{ width: '392px', height: '56px' }}>
              + New PDF/Docx
            </Button>
          </Box>
        )}
        {(screen === 'upload' || screen === 'uploadpdf') && (
          <Box>
            <TextField
              variant="filled"
              label="Document Title"
              defaultValue={title}
              value={title}
              disabled={!selectedFile}
              onChange={(e) => {
                handleFieldChange('title', e.target.value)
                setTitle(e.target.value)
              }}
              fullWidth
              sx={{
                mb: 2,
                backgroundColor: 'rgba(37, 147, 209, 0.05)',
                width: '392px',
                height: '56px',
                borderRadius: '8px',
                '& .MuiOutlinedInput-root.Mui-disabled': {
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                },
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
            {screen !== 'uploadpdf' && <><TextField
              variant="filled"
              label="AM code"
              value={formData.code}
              disabled={!selectedFile}
              onChange={(e) => handleFieldChange('code', e.target.value)}
              fullWidth
              sx={{
                mb: 2,
                backgroundColor: 'rgba(37, 147, 209, 0.05)',
                width: '392px',
                height: '56px',
                borderRadius: '8px',
                '& .MuiOutlinedInput-root.Mui-disabled': {
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                },
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
  <TextField
  variant="filled"
  label="Rev number"
  disabled={!selectedFile}
  value={formData.revisionNumber}
  onChange={(e) => {
    const revNumber = e.target.value;
    // Only use the user's input for rev number
    handleFieldChange('revisionNumber', revNumber);

    if (selectedFile) {
      const fileNameWithoutExtension = selectedFile.name.replace(/\.[^/.]+$/, "");
      handleFieldChange('title', `${fileNameWithoutExtension}${revNumber ? `_Rev_${revNumber}` : ''}`);
      setTitle(`${fileNameWithoutExtension}${revNumber ? `_Rev_${revNumber}` : ''}`);
    }
  }}
  fullWidth
  sx={{
    mb: 2,
    backgroundColor: 'rgba(37, 147, 209, 0.05)',
    width: '392px',
    height: '56px',
    borderRadius: '8px',
    '& .MuiOutlinedInput-root.Mui-disabled': {
      '& fieldset': {
        borderColor: 'transparent',
      },
    },
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
            <TextField
              variant="filled"
              label="Rev date"
              type="date"
              disabled={!selectedFile}
              value={formData.revisionDate}
              onChange={(e) => handleFieldChange('revisionDate', e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                mb: 2,
                backgroundColor: 'rgba(37, 147, 209, 0.05)',
                width: '392px',
                height: '56px',
                borderRadius: '8px',
                '& .MuiOutlinedInput-root.Mui-disabled': {
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                },
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
            <Box display="flex" alignItems="center" mb={2}>
  <Checkbox
    checked={hasWatermark}
    disabled={!selectedFile}
    onChange={(e) => setHasWatermark(e.target.checked)}
  />
  <Typography variant="body2">Has Watermark?</Typography>
</Box>

    <Box display="flex" alignItems="center" mb={2}>
      <Checkbox
        checked={receiveNotifications}
        disabled={!selectedFile}
        onChange={(e) => setReceiveNotifications(e.target.checked)}
      />
      <Typography variant="body2">Set file to receive notifications</Typography>
    </Box>
    
    {/* Display chips if checkbox is selected */}
    {receiveNotifications && (
      <Box display="flex" flexWrap="wrap" gap="4px" mb={2} alignItems="center">
       <Typography variant="body2" sx={{fontWeight: 700, textAlign: 'center' }}>
          Notification Frequency
        </Typography>
        {notificationFrequencies.map(({ id, frequency }) => (
          
            <Chip
              key={id}
              onClick={() => setSelectedFrequencyId(id)}
              label={<Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '15px',
                  lineHeight: '17.25px',
                  color: '#025EA3',
                }}
              >
                {frequency}
              </Typography>}
              sx={{
                borderRadius: '16px',
                border: '1px solid',
                borderColor: '#2593D105',
                bgcolor: 'rgba(37, 147, 209, 0.05)',
              }}
              icon={selectedFrequencyId === id ? <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: '12px',
                  lineHeight: '12px',
                  color: '#2593D1',
                }}
              >
                <CheckIcon fontSize="inherit" sx={{
                  fontWeight: 900,
                  fontSize: '12px',
                  lineHeight: '12px',
                  color: '#2593D1',
                }} />
              </Typography> : null} />
        ))}
      </Box>
    )}
            </>}
            {!selectedFile ? (<Button
              variant="outlined"
              fullWidth
              component="label"
              sx={{
                justifyContent: 'center',
                textTransform: 'none',
                 width: '392px', 
                 height: '76px',
                color: '#025EA3',
                borderColor: '#025EA340',
                borderRadius: '8px',
                '&:hover': {
                  borderColor: '#025EA3',
                },
                display: 'flex',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <UploadIcon sx={{ mr: 1 }} />
              Add your file
              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={screen === 'upload' ? ".doc,.docx" : ".doc,.docx,.pdf"} 
              />
            </Button>) : 
             (
              <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', width: '392px', height: '76px', borderColor: '#025EA340',
                borderRadius: '8px', pl: 0}}>
                <Box  sx={{ p: 2,mr: 2, width: '76px', height: '76px', backgroundColor: '#2593D11A', alignContent: 'center', textAlign: 'center',       display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center', }}>{selectedFile?.name.split('.').pop()?.toUpperCase()}
                </Box>
                <Box flexGrow={1} sx={{ overflow: 'hidden' }}>
                  <Typography variant="body1" sx={{
                    fontWeight: 700,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    width: '100%',
                   }}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="body2">{(selectedFile.size / 1024).toFixed(2)} KB</Typography>
                </Box>
                <IconButton onClick={handleRemoveFile} color="error" sx={{color: '#FF0000'}}>
                  <DeleteOutlineIcon />
                </IconButton>
              </Paper>
            )}
                    {!isFileValid && (
          <Typography variant="body2" color="error" style={{ marginTop: '10px' }}>
            {validationError}
          </Typography>
        )}
          </Box>
        )}
        {screen === 'fields' && <>
                <Box display="flex" flexWrap="wrap" gap="4px" sx={{ mb: 2 ,  height: '10vh', overflow: 'hidden' }}>
          <GenericDataListChips genericDataList={genericDataList} formData={formData} setFormData={setFormData} />
          </Box>
      
    <FieldsScreen placeholders={placeholders.map(placeholder => ({
        ...placeholder,
        placeholder_type_id: placeholder.placeholder_type_id || '',
        field_type_id: placeholder.field_type_id || '',
        masterFolderId: placeholder.masterFolderId || ''
      }))} valueTypes={valueTypes} formData={formData} setFormData={setFormData} placeholderTypes={placeholderTypes}  resetForm={resetForm} setResetForm={setResetForm}/>
        </>}
      </DialogContent>
      {screen !== 'select' && <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
      {screen === 'fields' && (
          <Button 
           variant="text"
            onClick={handlePreviewClick}
            color="primary" sx={{
            backgroundColor: '#FFF',
            color: '#1E5A99',
            textTransform: 'none',
            '&:hover': {
              color: '#164D8050',
              backgroundColor: 'rgba(255, 255, 255, 0.01)',
            },
          }}>
             <PageviewIcon />

            Preview
          </Button>
        )}
        {screen === 'fields' && (
          <Button 
           variant="text"
           onClick={() => setResetForm(true)} color="primary" sx={{
            backgroundColor: '#FFF',
            color: '#1E5A99',
            textTransform: 'none',
            '&:hover': {
              color: '#164D8050',
              backgroundColor: 'rgba(255, 255, 255, 0.01)',
            },
          }}>
             <RestartAltIcon />

            Reset
          </Button>
        )}
         {screen !== 'select' && (
    <Button
      variant="outlined"
      onClick={goBack}
      color="primary"
      sx={{
        backgroundColor: '#1E5A99',
        textTransform: 'none',
        fontSize: '16px',
        width: '192px',
        height: '56px',
        padding: '10px 20px',
        borderRadius: '8px',
        boxShadow: 'none',
        color: 'white',
        '&:hover': {
          backgroundColor: '#164D80',
          boxShadow: 'none',
        },
      }}
    >
      Back
    </Button>
  )}
        <Button 
          variant="outlined"
          onClick={() => {
            resetModal();
            onClose();
            }}   
          color="secondary"  
          disabled={!selectedFile}
          sx={{
              width: '192px',
              color: 'red',
              borderColor: 'red',
              textTransform: 'none',
              borderWidth: '1px',
              fontSize: '16px',
              height: '56px',
              padding: '10px 20px',
              borderRadius: '8px',
              '&:hover': {
                borderColor: 'red',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
              },
            }}
        >
          Cancel
        </Button>
        <Button 
        variant="contained"
        onClick={(values) => handleNext(values)} 
        color="primary" 
        disabled={!selectedFile || !isFileValid}  
        sx={{
          backgroundColor: '#1E5A99',
          textTransform: 'none',
          fontSize: '16px',
          width: '192px',
          height: '56px',
          padding: '10px 20px',
          borderRadius: '8px',
          boxShadow: 'none',
          color: 'white',
          '&:hover': {
            backgroundColor: '#164D80',
            boxShadow: 'none',
          },
        }}>
          {screen === 'uploadpdf' || screen === 'fields' ? 'Save' : 'Next'}
        </Button>
      </DialogActions>}


    </Dialog>
  );
};

export default FileUploadModal;
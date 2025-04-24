import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Grow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { DataGrid, DataGridField } from '../../Components/DataGrid';
import { Breadcrumbs } from '../../Components/Breadcrumbs';
import { SearchBox } from '../../Components/SearchBox';
import { AddButton } from '../../Components/Buttons/AddButton';
import supabaseClient from '../../supabaseClient';
import { List, useRefresh } from 'react-admin';
import FileUploadModal from '../../Components/FileUploadModal';
import moment from 'moment';
import DG_Edit_Button from "../../Components/Buttons/DG_Edit_Button";
import DG_Delete_Button from "../../Components/Buttons/DG_Delete_button";
import { useToast } from '../../Components/Toast/ToastContext';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EditDocumentModal from '../../Components/EditDocumentModal'; // Update the path as necessary

interface Document {
  id: string;
  file_name: string;
  title: string;
  code: string;
  revision_numb: number;
  revision_date: string;
  order: number;
  master_file_id: string;
}

interface MasterFile {
  id: string;
  name: string;
}

export const MasterFileDocuments = () => {
  const { id } = useParams<{ id: string }>();
  const refreshData = useRefresh()
  const { showMessage } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [masterFile, setMasterFile] = useState<MasterFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openPopup, setOpenPopup] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [frequencyNames, setFrequencyNames] = useState<{ [key: string]: string }>({});
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editDoc, setEditDoc] = useState<Document | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocToDelete, setSelectedDocToDelete] = useState<Document | null>(null);

  const handleAddButtonClick = () => {
    setOpenPopup(true);
  };

  const refreshPageWithDelay = () => {
    setTimeout(() => {
      window.location.reload();
    }, 1000); // 3000 milliseconds = 3 seconds
  };

  const handleClosePopup = () => {
    setOpenPopup(false);
    refreshPageWithDelay();
    // setRefresh(prev => !prev);
    // refreshData();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const { data: masterFileData, error: masterFileError } = await supabaseClient
          .from('master_files')
          .select('id, name')
          .eq('id', id)
          .single();

        if (masterFileError) throw masterFileError;
        setMasterFile(masterFileData);

        const { data: documentsData, error: documentsError } = await supabaseClient
          .from('documents')
          .select('*')
          .eq('master_file_id', id)
          .order('title', { ascending: true });

          const { data: notificationFreq, error } = await supabaseClient
          .from('notification_frequency')
          .select('id, frequency');
  
          const frequencyMap = (notificationFreq || []).reduce((acc, freq) => {
            acc[freq.id] = freq.frequency;
            return acc;
          }, {} as { [key: string]: string });

        if (documentsError) throw documentsError;
        const formattedDocuments = documentsData.map(doc => ({
          ...doc,
          revision_date: moment(doc.revision_date).format('DD, MMM YYYY'),
          notification_frequency: frequencyMap[doc.notification_frequency] || '',
        }));

      

        setFrequencyNames(frequencyMap);

        setDocuments(formattedDocuments);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, refresh, openEditModal]);

  // const handleSearch = async (query: string) => {
  //   try {
  //     setIsLoading(true);
  //     const { data, error } = await supabaseClient
  //       .from('documents')
  //       .select('*')
  //       .eq('master_file_id', id)
  //       .or(`file_name.ilike.%${query}%,title.ilike.%${query}%,code.ilike.%${query}%`)
  //       .order('title', { ascending: true });

  //     if (error) throw error;
  //     const formattedDocuments = data.map(doc => ({
  //       ...doc,
  //       revision_date: moment(doc.revision_date).format('MMMM Do, YYYY'),
  //       notification_frequency: frequencyNames[doc.notification_frequency] || '',
  //     }));
  //     setDocuments(formattedDocuments);
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'An error occurred while searching');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleSearch = async (query: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabaseClient
        .from('documents')
        .select('*')
        .eq('master_file_id', id)
        .or(`file_name.ilike.%${query}%,title.ilike.%${query}%,code.ilike.%${query}%`)
        .order('title', { ascending: true });
  
      if (error) throw error;
      const formattedDocuments = data.map(doc => ({
        ...doc,
        revision_date: moment(doc.revision_date).format('MMMM Do, YYYY'),
        notification_frequency: frequencyNames[doc.notification_frequency] || '',
      }));
      setDocuments(formattedDocuments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };
  const handleEdit = (doc: Document) => {
    setEditDoc(doc);
    setOpenEditModal(true);
  };


  const handleDeleteRequest = (doc: Document) => {
    setSelectedDocToDelete(doc);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedDocToDelete) {
      try {
        const { error } = await supabaseClient
          .from('documents')
          .delete()
          .eq('id', selectedDocToDelete.id);
        
        if (error) throw error;

        await supabaseClient.storage.from('files').remove([selectedDocToDelete.file_name]);
        showMessage("Document deleted successfully",  'success');
        setRefresh(prev => !prev);
        refreshData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while deleting');
        showMessage("Failed to delete document", 'error');
      } finally {
        setIsDeleteDialogOpen(false);
      }
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }
  
  const fields: DataGridField[] = [
    { source: 'title', label: `TITLE`, type: 'text' },
    { source: 'code', label: `AM CODE`, type: 'text' },
    { source: 'revision_number', label: 'REV NUMBER', type: 'text' },
    { source: 'revision_date', label: 'REV DATE', type: 'text' },
    { source: 'notification_frequency', label: 'NOTIFICATIONS', type: 'text' },
    {
      source: 'actions',
      label: '',
      type: 'custom',
      render: (doc: Document) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '150px' }}>
          <DG_Edit_Button onClick={() => handleEdit(doc)} />
          <DG_Delete_Button onClick={() => handleDeleteRequest(doc)} />
        </Box>
      ),
    },
  ];

  const NoData = () => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>No Records Found</h2>
      <p>Try adding some data to see it here.</p>
    </div>
  );

  return (
    <Grow in={true} timeout={500}>
      <Box sx={{ padding: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <Breadcrumbs
            items={[
              { label: 'Home', path: '/' },
              { label: 'Master Folders', path: '/Master_files' },
              { label: masterFile?.name || 'Documents' },
            ]}
          />

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchBox onSearch={handleSearch} placeholder="Search Documents" fullWidth={false} />
            <Box sx={{ marginLeft: 2 }}>
              <AddButton onClick={handleAddButtonClick}/>
            </Box>
          </Box>
        </Box>

        <List 
          resource="documents"
          filter={{ master_file_id: id }}
          actions={false}
          pagination={false}
          empty={<NoData />}
          sx={{
            "& .RaList-main": { margin: 0, padding: 0, boxShadow: "none", backgroundColor: "transparent" },
            "& .MuiPaper-root": { boxShadow: "none", backgroundColor: "transparent" },
          }}
        >
          <DataGrid 
            fields={fields}
            data={documents}
            disableRowClick
          />
        </List>
        
        <FileUploadModal
          masterFolderId={id || ''}
          open={openPopup}
          onClose={() => {
            handleClosePopup();
            // setRefresh(prev => !prev); // Ensure this is called
            // refreshData();
          
          }} 
        />
  
        {editDoc && (
        <EditDocumentModal
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          initialData={editDoc}
          refresh={() => {
            setRefresh(prev => !prev);
            refreshData();
          }}
        />
      )}

        <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
          <DialogTitle>
            <WarningAmberIcon sx={{ color: 'red', marginRight: 1 }} />
            Confirm Deletion
          </DialogTitle>
          <DialogContent>
            Are you sure you want to delete this document? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDeleteDialogOpen(false)} color="primary">Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="secondary" autoFocus>Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Grow>
  );
};

export default MasterFileDocuments;
import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, Grow } from '@mui/material';
import { List, RaRecord } from 'react-admin';
import { useNavigate } from 'react-router-dom';
import { MiniCard } from '../../Components/MiniCard';
import { SearchBox } from '../../Components/SearchBox';
import { AddButton } from '../../Components/Buttons/AddButton';
import { MainPopup } from '../../Components/MainPopup';
import { EmbeddedComponentPopup } from '../../Components/EmbeddedComponentPopup';
import { PopupButton } from '../../Components/Buttons/PopupButton';
import { DataGrid, DataGridField } from '../../Components/DataGrid';
import { IconCard } from '../../Components/IconCard';
import { Chip } from '../../Components/Chips/Chip';
import { SkeletonCode } from '../../Components/SkeletonCode';
import ContractorCreate from '../Contractors/ContractorCreate';
import ProjectCreate from '../Projects/ProjectCreate';
import UserCreate from '../Users 2.0/UserCreate';
import supabaseClient from '../../supabaseClient';
import MasterFileCreate from '../MasterFiles/MasterFileCreate';
import type { Identifier } from "react-admin"


// Icons
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FolderIcon from '@mui/icons-material/Folder';
import DisciplineCreate from '../Disciplines/DisciplineCreate';

type ChipStyle = {
  padding: string;
  borderRadius: string;
  fontSize: string;
  fontWeight: number;
  backgroundColor: string;
  color: string;
};

// Define Project interface
interface Project {
  id: string
  name: string
  created_at: string
  contractor_logo_url: string | null
  users: any[]
  status: string
  assigned_contractor_id: string
  sub_contractors_count: number
  disciplines_count: number
  files_completed: string
}

// Define the fields configuration for the projects grid
const projectFields: DataGridField[] = [
    {
      type: "custom",
      source: "contractor_logo_url",
      label: "",
      hideLabel: true,
      render: (record: RaRecord<Identifier>) => (
        <img
          src={(record as Project).contractor_logo_url || "https://via.placeholder.com/80"}
          alt="Contractor Logo"
          style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "50px" }}
        />
      ),
    },
  {
    type: 'custom',
    source: 'name',
    label: 'Project Name',
    render: (record: RaRecord) => {
      const createdAt = new Date(record.created_at);
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const isNew = createdAt > oneWeekAgo;

      return (
        <Box display="flex" alignItems="center">
          <Typography sx={{ color: '#1a1a26' }}>{record.name}</Typography>
          {isNew && (
            <Chip
              label="New"
              backgroundColor="#e8f5e9"
              textColor="#2e7d32"
              fontWeight={600}
              size="small"
              style={{ marginLeft: '8px' }}
            />
          )}
        </Box>
      );
    },
  },
  {
    type: 'custom',
    source: 'sub_contractors_count',
    label: 'Sub-contractors',
    render: (record: RaRecord) => (
      <Typography sx={{ fontWeight: 'bold' }}>
        {record.sub_contractors_count}
      </Typography>
    ),
  },
  {
    type: 'custom',
    source: 'disciplines_count',
    label: 'Safety files',
    render: (record: RaRecord) => (
      <Typography sx={{ fontWeight: 'bold' }}>
        {record.disciplines_count}
      </Typography>
    ),
  },
  // {
  //   type: 'custom',
  //   source: 'files_completed',
  //   label: 'File completion rate',
  //   render: (record: RaRecord) => (
  //     <Typography sx={{ fontWeight: 'bold' }}>
  //       {record.files_completed}
  //     </Typography>
  //   ),
  // },
];

// Define the fields configuration for the recent contractors grid
const recentContractorFields: DataGridField[] = [
  {
    type: 'custom',
    source: 'name',
    label: 'Name',
    render: (record: RaRecord) => {
      const createdAt = new Date(record.created_at);
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const isNew = createdAt > oneWeekAgo;

      return (
        <Box display="flex" alignItems="center">
          <Typography sx={{ color: '#1a1a26' }}>{record.name}</Typography>
          {isNew && (
            <Chip
              label="New"
              backgroundColor="#e8f5e9"
              textColor="#2e7d32"
              fontWeight={600}
              size="small"
              style={{ marginLeft: '8px' }}
            />
          )}
        </Box>
      );
    },
  },
  {
    type: 'custom',
    source: 'contractor_type.name',
    label: 'Contractor Type',
    render: (record: any) => {
      const value = record.contractor_type?.name;
      const baseStyle: ChipStyle = {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.8rem',
        fontWeight: 600,
        backgroundColor: '#ddebf7',
        color: 'red',
      };

      let style: ChipStyle;
      switch (value?.toLowerCase().trim()) {
        case 'contractor':
          style = { ...baseStyle, backgroundColor: '#ddebf7', color: '#228bc8', fontWeight: 800 };
          break;
        case 'sub-contractor':
          style = { ...baseStyle, backgroundColor: '#e4e9ee', color: '#228bc8', fontWeight: 800 };
          break;
          case 'principle contractor':
            style = {  ...baseStyle, backgroundColor: '#ddebf6', color: '#206390', fontWeight: 800 };
            break;
        default:
          style = { ...baseStyle };
      }

      return <span style={style}>{value}</span>;
    },
  },
];

// Empty component to remove default actions
const EmptyActions = () => null;

const isNewDiscipline = (createdAt: string) => {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return createdDate > oneWeekAgo;
};

const Home = () => {
  const navigate = useNavigate();
  const [contractorsCount, setContractorsCount] = useState<number | null>(null);
  const [projectsCount, setProjectsCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [documentsCount, setDocumentsCount] = useState<number | null>(null);
  const [openPopup, setOpenPopup] = useState(false);
  const [openContractorCreatePopup, setOpenContractorCreatePopup] = useState(false);
  const [openProjectCreatePopup, setOpenProjectCreatePopup] = useState(false);
  const [openPersonCreatePopup, setOpenPersonCreatePopup] = useState(false);
  const [openMasterFolderCreatePopup, setOpenMasterFolderCreatePopup] = useState(false);
  const [openDisciplineCreatePopup, setOpenDisciplineCreatePopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentContractors, setRecentContractors] = useState<any[] | null>(null);
  const [recentDisciplines, setRecentDisciplines] = useState<any[] | null>(null);
  const [projects, setProjects] = useState<any[] | null>(null); // Added state for projects
  const [masterFiles, setMasterFiles] = useState<any[] | null>(null); // Added state for master files

  useEffect(() => {
    const fetchContractorsCount = async () => {
      const { count, error } = await supabaseClient
        .from('contractors')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching contractors count:', error);
      } else {
        setContractorsCount(count || 0);
      }
    };

    fetchContractorsCount();
  }, []);

  useEffect(() => {
    const fetchProjectsCount = async () => {
      const { count, error } = await supabaseClient
        .from('projects')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching projects count:', error);
      } else {
        setProjectsCount(count || 0);
      }
    };

    fetchProjectsCount();
  }, []);

  useEffect(() => {
    const fetchUsersCount = async () => {
      const { count, error } = await supabaseClient
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching users count:', error);
      } else {
        setUsersCount(count || 0);
      }
    };

    fetchUsersCount();
  }, []);

  useEffect(() => {
    const fetchDocumentsCount = async () => {
      const { count, error } = await supabaseClient
        .from('documents')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching documents count:', error);
      } else {
        setDocumentsCount(count || 0);
      }
    };

    fetchDocumentsCount();
  }, []);

  useEffect(() => {
    const fetchRecentContractors = async () => {
      const { data, error } = await supabaseClient
        .from('contractors')
        .select(`
          id, 
          name,
          created_at,
          contractor_type:contractor_type_id (id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching recent contractors:', error);
      } else {
        setRecentContractors(data || []);
      }
    };

    fetchRecentContractors();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("vw_project_contractor_details")
          .select(`
            id,
            name,
            created_at,
            contractor_logo_url,
            users,
            status,
            assigned_contractor_id
          `)
          .order("created_at", { ascending: false })
          .limit(5) // Add this line to limit to 4 entries
  
        if (error) throw error
  
        const projectsWithCounts = data?.map((project) => ({
          ...project,
          contractor_logo_url: project.contractor_logo_url || "https://via.placeholder.com/80",
          sub_contractors_count: project.users
            ? project.users.filter((user: any) => user.role_name === "Sub-contractor").length
            : 0,
          disciplines_count: project.users ? [...new Set(project.users.map((user: any) => user.discipline))].length : 0,
          files_completed: "⭐ 0", // Placeholder - you may want to calculate this based on actual data
        }))
        setProjects(projectsWithCounts || [])
      } catch (err) {
        console.error("Error fetching projects:", err)
      } finally {
        // setLoading(false)
      }
    }
  
    fetchProjects()
  }, [])


  useEffect(() => {
    const fetchRecentDisciplines = async () => {
      const { data, error } = await supabaseClient
        .from('disciplines')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) {
        console.error('Error fetching recent disciplines:', error);
      } else {
        setRecentDisciplines(data || []);
      }
    };

    fetchRecentDisciplines();
  }, []);

  useEffect(() => {
    const fetchMasterFiles = async () => {
      const { data, error } = await supabaseClient
        .from('master_files')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

    if (error) {
      console.error('Error fetching master files:', error);
    } else {
      setMasterFiles(data || []);
    }
  };

  fetchMasterFiles();
}, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleAddButtonClick = () => {
    setOpenPopup(true);
  };

  const handleClosePopup = () => {
    setOpenPopup(false);
  };

  const handleOpenContractorCreate = () => {
    setOpenPopup(false);
    setOpenContractorCreatePopup(true);
  };

  const handleCloseContractorCreatePopup = () => {
    setOpenContractorCreatePopup(false);
  };

  const handleOpenProjectCreate = () => {
    setOpenPopup(false);
    setOpenProjectCreatePopup(true);
  };

  const handleCloseProjectCreatePopup = () => {
    setOpenProjectCreatePopup(false);
  };

  const handleOpenPersonCreate = () => {
    setOpenPopup(false);
    setOpenPersonCreatePopup(true);
  };

  const handleClosePersonCreatePopup = () => {
    setOpenPersonCreatePopup(false);
  };

  const handleOpenMasterFolderCreate = () => {
    setOpenPopup(false);
    setOpenMasterFolderCreatePopup(true);
  };

  const handleCloseMasterFolderCreatePopup = () => {
    setOpenMasterFolderCreatePopup(false);
  };

  const handleOpenDisciplineCreate = () => {
    setOpenPopup(false);
    setOpenDisciplineCreatePopup(true);
  };

  const handleCloseDisciplineCreatePopup = () => {
    setOpenDisciplineCreatePopup(false);
  };

  const handleProjectClick = (id: string) => {
    navigate(`/projects/${id}`);
  };

  return (
    <Grow in={true} timeout={500}>
      <Box sx={{ padding: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <Typography variant="h6">Home</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* <SearchBox onSearch={handleSearch} placeholder="Search" fullWidth={false} /> */}
            <Box sx={{ marginLeft: 2 }}>
              <AddButton onClick={handleAddButtonClick} />
            </Box>
          </Box>
        </Box>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Section - 9/12 width */}
          <Grid item xs={12} md={8}>
            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ marginBottom: 4 }}>
              <Grid item xs={6} sm={4}>
                {contractorsCount === null ? (
                  <SkeletonCode height={100} />
                ) : (
                  <MiniCard
                    title="Contractors"
                    value={contractorsCount}
                    icon={<CorporateFareRoundedIcon />}
                    onClick={() => navigate('/contractors')}
                  />
                )}
              </Grid>
              <Grid item xs={6} sm={4}>
                {projectsCount === null ? (
                  <SkeletonCode height={100} />
                ) : (
                  <MiniCard
                    title="Projects"
                    value={projectsCount}
                    icon={<AssignmentIcon />}
                    onClick={() => navigate('/projects')}
                  />
                )}
              </Grid>
              <Grid item xs={6} sm={4}>
                {usersCount === null ? (
                  <SkeletonCode height={100} />
                ) : (
                  <MiniCard
                    title="People"
                    value={usersCount}
                    icon={<PeopleIcon />}
                    onClick={() => navigate('/users')}
                  />
                )}
              </Grid>
            </Grid>

            {/* Recent Projects */}
            <Box>
              <Typography variant="h6" sx={{ marginBottom: 2, color: '#7e7e8a' }}>
                RECENT PROJECTS
              </Typography>
              <Card elevation={0} sx={{ backgroundColor: 'transparent' }}>
                <CardContent>
                  {projects === null ? (
                    <SkeletonCode count={5} height={50} />
                  ) : (
                    <List
                      basePath="/projects"
                      resource="projects"
                      filters={null}
                      actions={<EmptyActions />}
                      exporter={false}
                      sort={{ field: 'created_at', order: 'DESC' }}
                      perPage={5}
                      pagination={false}
                      sx={{
                        "& .RaList-main": {
                          margin: 0,
                          padding: 0,
                          boxShadow: "none",
                          backgroundColor: "transparent",
                        },
                        "& .MuiPaper-root": {
                          boxShadow: "none",
                          backgroundColor: "transparent",
                        },
                      }}
                    >
                      <DataGrid 
                        hidePagination={true} 
                        fields={projectFields} 
                        disableRowClick={false}
                        onRowClick={(id) => handleProjectClick(id)}
                        data={projects || []}
                      />
                    </List>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Right Section - 3/12 width */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ backgroundColor: '#f6f7fc', borderRadius: '3px', height: '100%' }}>
              <CardContent sx={{ padding: 2 }}>
                <Typography variant="h6" sx={{ marginBottom: 2, color: '#7e7e8a' }}>
                  RECENT CONTRACTORS
                </Typography>
                {recentContractors === null ? (
                  <SkeletonCode count={5} height={30} />
                ) : (
                  <List
                    resource="contractors"
                    filters={null}
                    actions={<EmptyActions />}
                    exporter={false}
                    sort={{ field: 'created_at', order: 'DESC' }}
                    perPage={5}
                    pagination={false}
                    sx={{
                      "& .RaList-main": {
                        margin: 0,
                        padding: 0,
                        boxShadow: "none",
                        backgroundColor: "transparent",
                      },
                      "& .MuiPaper-root": {
                        boxShadow: "none",
                        backgroundColor: "transparent",
                      },
                    }}
                  >
                    <DataGrid 
                      fields={recentContractorFields}
                      disableRowClick={false}
                      hidePagination={true}
                      hideColumnNames={true}
                      data={recentContractors || []}
                    />
                  </List>
                )}
                <Box sx={{ marginTop: 2 }}>
                  <Typography variant="h6" sx={{ marginBottom: 2, color: '#7e7e8a' }}>
                    MASTER FILES
                  </Typography>
                  <Grid container spacing={2} sx={{ marginBottom: 3 }}>
                    {masterFiles === null ? (
                      <SkeletonCode count={2} height={80} />
                    ) : (
                      (masterFiles || []).map((file) => (
                        <Grid item xs={6} key={file.id}>
                          <IconCard
                            icon={<InsertDriveFileIcon />}
                            text={file.name}
                            onClick={() => navigate(`/master-files/${file.id}`)}
                            chip={
                              isNewDiscipline(file.created_at)
                                ? {
                                    label: "New",
                                    backgroundColor: "#e8f5e9",
                                    textColor: "#2e7d32",
                                    fontWeight: 600,
                                  }
                                : undefined
                            }
                          />
                        </Grid>
                      ))
                    )}
                  </Grid>
                  <Typography variant="h6" sx={{ marginBottom: 2, color: '#7e7e8a' }}>
                    RECENTLY CREATED SAFETY FILES
                  </Typography>
                  <Grid container spacing={2}>
                    {recentDisciplines === null ? (
                      <SkeletonCode count={2} height={80} />
                    ) : (
                      (recentDisciplines || []).map((discipline) => (
                        <Grid item xs={6} key={discipline.id}>
                          <IconCard
                            icon={<FolderIcon />}
                            text={discipline.name}
                            onClick={() => navigate(`/disciplines/${discipline.id}`)}
                            chip={
                              isNewDiscipline(discipline.created_at)
                                ? {
                                    label: "New",
                                    backgroundColor: "#e8f5e9",
                                    textColor: "#2e7d32",
                                    fontWeight: 600,
                                  }
                                : undefined
                            }
                          />
                        </Grid>
                      ))
                    )}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Popups */}
        <MainPopup open={openPopup} onClose={handleClosePopup} title="What would you like to add?">
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <PopupButton
                text="New Contractor"
                fullWidth={true}
                onClick={handleOpenContractorCreate}
              />
            </Grid>
            <Grid item xs={12}>
              <PopupButton
                text="New Project"
                fullWidth={true}
                onClick={handleOpenProjectCreate}
              />
            </Grid>
            <Grid item xs={12}>
              <PopupButton
                text="New Person"
                fullWidth={true}
                onClick={handleOpenPersonCreate}
              />
            </Grid>
            <Grid item xs={12}>
              <PopupButton
                text="New Master Folder"
                fullWidth={true}
                onClick={handleOpenMasterFolderCreate}
              />
            </Grid>
            <Grid item xs={12}>
              <PopupButton
                text="New Safety File"
                fullWidth={true}
                onClick={handleOpenDisciplineCreate}
              />
            </Grid>
          </Grid>
        </MainPopup>

        <EmbeddedComponentPopup open={openContractorCreatePopup} onClose={handleCloseContractorCreatePopup} title="">
          <ContractorCreate />
        </EmbeddedComponentPopup>

        <EmbeddedComponentPopup open={openProjectCreatePopup} onClose={handleCloseProjectCreatePopup} title="">
          <ProjectCreate />
        </EmbeddedComponentPopup>

        <EmbeddedComponentPopup open={openPersonCreatePopup} onClose={handleClosePersonCreatePopup} title="">
          <UserCreate />
        </EmbeddedComponentPopup>

        <EmbeddedComponentPopup open={openMasterFolderCreatePopup} onClose={handleCloseMasterFolderCreatePopup} title="">
          <MasterFileCreate setIsPopupOpen={function (isOpen: boolean): void {
            throw new Error('Function not implemented.');
          } } />
        </EmbeddedComponentPopup>

        <EmbeddedComponentPopup open={openDisciplineCreatePopup} onClose={handleCloseDisciplineCreatePopup} title="">
          <DisciplineCreate setIsPopupOpen={function (isOpen: boolean): void {
            throw new Error('Function not implemented.');
          } } />
        </EmbeddedComponentPopup>
      </Box>
    </Grow>
  );
};

export default Home;


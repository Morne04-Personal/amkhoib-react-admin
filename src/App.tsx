// app.tsx
// import './global.css';
import React from 'react';
import { Admin, Resource, CustomRoutes } from 'react-admin';
import { BrowserRouter, Route } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import {
    CreateGuesser,
    EditGuesser,
    ListGuesser,
    SetPasswordPage,
    ShowGuesser,
    defaultI18nProvider,
    supabaseDataProvider,
    supabaseAuthProvider,
  } from "ra-supabase"
import { CustomForgotPasswordPage } from './Auth-Components/CustomForgotPassword';
import { Category_documentList } from './Supabase-Pages/Category_documentList';
import { Placeholder_typeList } from './Supabase-Pages/Placeholder_typeList';
import { Document_placeholderList } from './Supabase-Pages/Document_placeholderList';
import { PlaceholderList } from './Supabase-Pages/PlaceholderList';
// import { ClientList } from './Supabase-Components/ClientList';
// import { ClientList } from './Pages/Contractors/ContractorList';
import { Zzz_documentList } from './Supabase-Pages/Zzz_documentList';
import ContractorList from './Pages/Contractors/ContractorList';
// import { ProjectList } from './Supabase-Pages/ProjectList';
import { Field_typeList } from './Supabase-Pages/Field_typeList';
import { User_roleList } from './Supabase-Pages/User_roleList';
import { Contractor_disciplineList } from './Supabase-Pages/Contractor_disciplineList';
import { Contractor_typeList } from './Supabase-Pages/Contractor_typeList';
// import { DocumentList, DocumentShow } from './Supabase-Pages/DocumentList';
import { StatusList } from './Supabase-Pages/StatusList';
// import { UserList } from './Supabase-Pages/UserList';
import { Project_documentList } from './Supabase-Pages/Project_documentList';
// import { DisciplineList, DisciplineShow } from './Supabase-Pages/DisciplineList';
import { Discipline_documentList } from './Supabase-Pages/Discipline_documentList';
import { CategoryList } from './Supabase-Pages/CategoryList';
import { NotificationList } from './Supabase-Pages/NotificationList';
import { defaultLightTheme, defaultDarkTheme } from './themes';
import CustomLayout from './Components/CustomLayout';
import Home from './Pages/Home/Home';
import CustomLogin from './Auth-Components/CustomLogin';
import { ProjectCreate } from './Pages/Projects/ProjectCreate';
import {ProjectList} from './Pages/Projects/ProjectList';
import { ToastProvider } from './Components/Toast/ToastContext';
import ProjectEdit from './Pages/Projects/ProjectEdit';
import { CustomResetPasswordPage } from './Auth-Components/CustomResetPassword';
import { DisciplineList } from './Pages/Disciplines/DisciplineList';
import DocumentList from './Pages/Documents/DocumentList';
import DisciplineDetailView from './Pages/Disciplines/DisciplineDetailView';
import MasterFileList from './Pages/MasterFiles/MasterFileList';
import MasterFileDocuments from './Pages/MasterFiles/MasterFileDocuments';
import MasterFileCreate from './Pages/MasterFiles/MasterFileCreate';
import ProjectDetailView from './Pages/Projects/ProjectDetailView';
import ProjectDocumentLinkView from './Pages/Projects/ProjectDocumentLinkView';
import { ResetPasswordHandler } from './ResetPasswordHandler';
import ContractorDetailView from './Pages/Contractors/ContractorDetailView';
import ContractorEdit from './Pages/Contractors/ContractorEdit';
import ContractorCreate from './Pages/Contractors/ContractorCreate';
import { UserList } from './Pages/Users 2.0/UserList';
import UserCreate from './Pages/Users 2.0/UserCreate';
import UserEdit from './Pages/Users 2.0/UserEdit';


// Initialize Supabase client
const instanceUrl = import.meta.env.VITE_SUPABASE_URL
const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseClient = createClient(instanceUrl, apiKey)

const authProvider = supabaseAuthProvider(supabaseClient, {
  getIdentity: async (user) => {
    // Get the user's metadata from Supabase
    const {
      data: { user: currentUser },
      error,
    } = await supabaseClient.auth.getUser()

    if (error || !currentUser) {
      throw error || new Error("User not found")
    }

    // Return a properly structured identity object
    return {
      id: currentUser.id,
      fullName: currentUser.user_metadata?.full_name || "",
      email: currentUser.email,
      avatar: currentUser.user_metadata?.avatar_url,
    }
  },
})

const dataProvider = supabaseDataProvider({ instanceUrl, apiKey, supabaseClient })


export const App: React.FC = () => (
    <BrowserRouter>
    {/* <ThemeToggler /> */}
    <ToastProvider>
        <Admin
            layout={CustomLayout} // Use custom layout  // Use your custom layout
            theme={defaultLightTheme}  // Start theme
            // darkTheme={defaultDarkTheme}
            dataProvider={dataProvider}
            authProvider={authProvider}
            i18nProvider={defaultI18nProvider}
            loginPage={CustomLogin}
            dashboard={Home}
        >

            <Resource name="documents" list={DocumentList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="master_files" list={MasterFileList} edit={EditGuesser} create={MasterFileCreate} show={ShowGuesser} />
            <Resource name="category_documents" list={Category_documentList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="placeholder_types" list={Placeholder_typeList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="document_placeholders" list={Document_placeholderList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="placeholders" list={PlaceholderList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="contractors" list={ContractorList} edit={ContractorEdit} create={ContractorCreate} show={ContractorDetailView} />
            <Resource name="zzz_documents" list={Zzz_documentList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="contractors" list={ContractorList} edit={ContractorEdit} create={ContractorCreate} show={ShowGuesser} />
            <Resource name="projects" list={ProjectList} edit={ProjectEdit} create={ProjectCreate} show={ProjectDetailView} />
            <Resource name="field_types" list={Field_typeList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="user_roles" list={User_roleList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="contractor_disciplines" list={Contractor_disciplineList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="contractor_types" list={Contractor_typeList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="statuses" list={StatusList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="users" list={UserList} edit={UserEdit} create={UserCreate} show={ShowGuesser} />
            <Resource name="project_documents" list={Project_documentList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="disciplines" list={DisciplineList} edit={EditGuesser} create={CreateGuesser} show={DisciplineDetailView} />
            <Resource name="discipline_documents" list={Discipline_documentList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="notifications" list={NotificationList} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />
            <Resource name="test" list={ListGuesser} edit={EditGuesser} create={CreateGuesser} show={ShowGuesser} />

            {/* <Resource name="manyToMany" create={ManyToMany} /> */}

            <CustomRoutes>
                <Route path="/MasterFiles/:id/documents" element={<MasterFileDocuments />} />
                <Route path="/projects/:projectId/contractors/:contractorId/disciplines/:disciplineId" element={<ProjectDocumentLinkView />} />
            </CustomRoutes>

            <CustomRoutes noLayout>
                <Route path={SetPasswordPage.path} element={<SetPasswordPage />} />
                <Route path="/forgot-password" element={<CustomForgotPasswordPage />} />
                <Route path="/reset-password" element={<CustomResetPasswordPage />} />
                <Route path="/auth/reset-password" element={<ResetPasswordHandler />} />
            </CustomRoutes>

            
        </Admin>
    </ToastProvider>
    </BrowserRouter>
);

export default App;

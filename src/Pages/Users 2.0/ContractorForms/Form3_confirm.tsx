import React, { useState, useEffect } from "react";
import { Grid, Box } from "@mui/material";
import { TextField } from "../../../Components/TextField";
import { ButtonShowHide } from "../../../Components/Buttons/ButtonShowHide";
import MultiSelectDropDown from "../../../Components/MultiSelectDropDown";
import supabaseClient from "../../../supabaseClient";

interface Discipline {
  id: string;
  name: string;
}

interface Form3ConfirmProps {
  contractor: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    contact_number: string;
    company_name: string;
    disciplines: Discipline[];
  };
  onCancel: () => void;
  onLink: () => void;
  mainContractorType: string;
  assignableCompanies: { value: string; label: string }[];
  updateAssignedCompany: (companyId: string) => void;
  assignedCompanyId: string;
}

export const Form3Confirm: React.FC<Form3ConfirmProps> = ({
  contractor,
  onCancel,
  onLink,
  mainContractorType,
  assignableCompanies,
  updateAssignedCompany,
  assignedCompanyId,
}) => {
  const [allDisciplines, setAllDisciplines] = useState<{ value: string; label: string }[]>([]);
  const [selectedDisciplineIds, setSelectedDisciplineIds] = useState<string[]>(contractor.disciplines.map(d => d.id));
  const [projectId, setProjectId] = useState<string | null>(null);
  
  // Get project ID from localStorage on component mount
  useEffect(() => {
    const storedProjectId = localStorage.getItem("UserCreateProjectIdAttachment");
    setProjectId(storedProjectId);
    
    // If we have a project ID, we need to fetch the user's disciplines for this specific project
    if (storedProjectId) {
      fetchUserDisciplinesForProject(contractor.id, storedProjectId);
    }
  }, [contractor.id]);
  
// Function to fetch user disciplines for a specific project
const fetchUserDisciplinesForProject = async (userId: string, projectId: string) => {
  try {
    const { data, error } = await supabaseClient
      .from("user_disciplines")
      .select("discipline_id")
      .eq("user_id", userId)
      .eq("project_id", projectId);
    
    if (error) throw error;
    
    // Always set the disciplines based on the project-specific query result
    // If no data is found, this will be an empty array
    setSelectedDisciplineIds(data && data.length > 0 ? data.map(d => d.discipline_id) : []);
    
    console.log("Project-specific disciplines:", data ? data.map(d => d.discipline_id) : []);
  } catch (error) {
    console.error("Error fetching user disciplines for project:", error);
    // In case of error, set to empty array to be safe
    setSelectedDisciplineIds([]);
  }
};

  useEffect(() => {
    const fetchDisciplines = async () => {
      try {
        const { data, error } = await supabaseClient.from("disciplines").select("id, name");
        if (error) throw error;

        const formattedDisciplines = data.map((d: Discipline) => ({
          value: d.id,
          label: d.name,
        }));

        setAllDisciplines(formattedDisciplines);
      } catch (error) {
        console.error("Error fetching disciplines:", error);
      }
    };

    fetchDisciplines();
  }, []);

  const handleDisciplineChange = async (event: React.ChangeEvent<{ value: unknown }>) => {
    const updatedIds = event.target.value as string[];

    // Insert new disciplines
    const newDisciplineIds = updatedIds.filter(id => !selectedDisciplineIds.includes(id));
    for (const id of newDisciplineIds) {
      await insertDiscipline(id);
    }

    // Remove unselected disciplines
    const removedDisciplineIds = selectedDisciplineIds.filter(id => !updatedIds.includes(id));
    for (const id of removedDisciplineIds) {
      await deleteDiscipline(id);
    }

    setSelectedDisciplineIds(updatedIds);
  };

  const insertDiscipline = async (disciplineId: string) => {
    // Only proceed if we have a project ID
    if (!projectId) {
      console.error("No project ID available");
      return;
    }
    
    try {
      const { error } = await supabaseClient.from("user_disciplines").insert({
        user_id: contractor.id,
        discipline_id: disciplineId,
        project_id: projectId, // Include the project ID
      });

      if (error) {
        console.error("Error inserting discipline:", error);
      } else {
        console.log(`Inserted discipline ID: ${disciplineId} for project: ${projectId}`);
      }
    } catch (error) {
      console.error("Insert error:", error);
    }
  };

  const deleteDiscipline = async (disciplineId: string) => {
    // Only proceed if we have a project ID
    if (!projectId) {
      console.error("No project ID available");
      return;
    }
    
    try {
      const { error } = await supabaseClient
        .from("user_disciplines")
        .delete()
        .eq("user_id", contractor.id)
        .eq("discipline_id", disciplineId)
        .eq("project_id", projectId); // Include project ID in the filter

      if (error) {
        console.error("Error deleting discipline:", error);
      } else {
        console.log(`Deleted discipline ID: ${disciplineId} from project: ${projectId}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField source="first_name" label="First Name" value={contractor.first_name} readonly={true} />
        </Grid>
        <Grid item xs={12}>
          <TextField source="last_name" label="Last Name" value={contractor.last_name} readonly={true} />
        </Grid>
        <Grid item xs={12}>
          <TextField source="email" label="Email address" value={contractor.email} readonly={true} />
        </Grid>
        <Grid item xs={12}>
          <TextField source="contact_number" label="Contact number" value={contractor.contact_number} readonly={true} />
        </Grid>
        <Grid item xs={6}>
          <MultiSelectDropDown
            label="Assign safety files"
            value={selectedDisciplineIds}
            onChange={handleDisciplineChange}
            options={allDisciplines}
            multiple
          />
        </Grid>
        {mainContractorType !== "Sub-Contractor" && mainContractorType !== "Contractor" && (
          <Grid item xs={6}>
            <MultiSelectDropDown
              label="Assign to company"
              value={assignedCompanyId}
              onChange={(event) => updateAssignedCompany(event.target.value as string)}
              options={assignableCompanies}
              multiple={false}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 2, gap: 2 }}>
            <ButtonShowHide text="Cancel" onClick={onCancel} />
            {/* You may add back the link button if necessary */}
            {/* <ButtonShowHide text="Link Contractor" onClick={onLink} /> */}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
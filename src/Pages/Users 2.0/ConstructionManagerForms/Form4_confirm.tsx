"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Grid, Box } from "@mui/material"
import { TextField } from "../../../Components/TextField"
import { ButtonShowHide } from "../../../Components/Buttons/ButtonShowHide"
import MultiSelectDropDown from "../../../Components/MultiSelectDropDown"
import supabaseClient from "../../../supabaseClient";

interface Discipline {
  id: string;
  name: string;
}

interface Form4ConfirmProps {
  user: {
    id: string;
    firstName: string
    lastName: string
    email: string
    contactNumber: string
  }
  onCancel: () => void
  onLink: () => void
}

export const Form4Confirm: React.FC<Form4ConfirmProps> = ({ user, onCancel, onLink }) => {
  const [allDisciplines, setAllDisciplines] = useState<{ value: string; label: string }[]>([]);
  const [selectedDisciplineIds, setSelectedDisciplineIds] = useState<string[]>([]); // Initialize as empty array
  const [projectId, setProjectId] = useState<string | null>(null);

  // Get project ID from localStorage on component mount
  useEffect(() => {
    const storedProjectId = localStorage.getItem("UserCreateProjectIdAttachment");
    setProjectId(storedProjectId);
  }, []);

  // Fetch disciplines and user's associated disciplines on component mount
  useEffect(() => {
    const fetchDisciplinesAndUserAssociations = async () => {
      try {
        // Fetch all available disciplines
        const { data: allData, error: allError } = await supabaseClient.from("disciplines").select("id, name");
        if (allError) throw allError;
        
        setAllDisciplines(allData.map((d: Discipline) => ({
          value: d.id,
          label: d.name,
        })));

        // Only fetch user disciplines if we have a project ID
        if (projectId) {
          // Fetch disciplines associated with this user and project
          const { data: userDisciplines, error: userDisciplinesError } = await supabaseClient
            .from("user_disciplines")
            .select("discipline_id")
            .eq("user_id", user.id)
            .eq("project_id", projectId); // Filter by project_id

          if (userDisciplinesError) throw userDisciplinesError;
          
          // Set initial state with user-specific disciplines
          setSelectedDisciplineIds(userDisciplines.map(d => d.discipline_id));
        }
      } catch (error) {
        console.error("Error fetching disciplines:", error);
      }
    };

    if (user.id) {
      fetchDisciplinesAndUserAssociations();
    }
  }, [user.id, projectId]); // Add projectId as dependency

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
        user_id: user.id,
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
        .eq("user_id", user.id)
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
          <TextField source="first_name" label="Name" value={user.firstName} readonly={true} />
        </Grid>
        <Grid item xs={12}>
          <TextField source="last_name" label="Surname" value={user.lastName} readonly={true} />
        </Grid>
        <Grid item xs={12}>
          <TextField source="email" label="Email address" value={user.email} readonly={true} />
        </Grid>
        <Grid item xs={6}>
          <TextField source="contact_number" label="Contact number" value={user.contactNumber} readonly={true} />
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
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <ButtonShowHide text="Cancel" onClick={onCancel} />
            {/* <ButtonShowHide text="Link Construction Manager" onClick={onLink} /> */}
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
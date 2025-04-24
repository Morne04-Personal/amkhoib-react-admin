"use client"

import type React from "react"
import { Grid, Box } from "@mui/material"
import { TextField } from "../../../Components/TextField"
import { ButtonShowHide } from "../../../Components/Buttons/ButtonShowHide"
import MultiSelectDropDown from "../../../Components/MultiSelectDropDown"
import supabaseClient from "../../../supabaseClient";
import { useEffect, useState } from "react"

interface Discipline {
  id: string;
  name: string;
}

interface Form5ConfirmProps {
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

export const Form5Confirm: React.FC<Form5ConfirmProps> = ({ user, onCancel }) => {
  const [allDisciplines, setAllDisciplines] = useState<{ value: string; label: string }[]>([]);
  const [selectedDisciplineIds, setSelectedDisciplineIds] = useState<string[]>([]); // Initialize as empty array
  const [projectId, setProjectId] = useState<string | null>(null);
  
  // Get project ID from localStorage on component mount
  useEffect(() => {
    const storedProjectId = localStorage.getItem("UserCreateProjectIdAttachment");
    console.log("Retrieved projectId from localStorage:", storedProjectId);
    setProjectId(storedProjectId);
  }, []);

  // Fetch all available disciplines once
  useEffect(() => {
    const fetchAllDisciplines = async () => {
      try {
        const { data, error } = await supabaseClient.from("disciplines").select("id, name");
        if (error) throw error;
        
        setAllDisciplines(data.map((d: Discipline) => ({
          value: d.id,
          label: d.name,
        })));
      } catch (error) {
        console.error("Error fetching all disciplines:", error);
      }
    };

    fetchAllDisciplines();
  }, []);

  // Fetch user's disciplines when projectId changes
  useEffect(() => {
    const fetchUserDisciplines = async () => {
      // Only proceed if we have both user.id and projectId
      if (!user.id || !projectId) {
        console.log("Skipping discipline fetch - missing user.id or projectId", { userId: user.id, projectId });
        return;
      }
      
      try {
        console.log("Fetching disciplines for user and project:", { userId: user.id, projectId });
        
        const { data, error } = await supabaseClient
          .from("user_disciplines")
          .select("discipline_id")
          .eq("user_id", user.id)
          .eq("project_id", projectId);
        
        if (error) throw error;
        
        console.log("User disciplines result:", data);
        
        // Always set the disciplines based on the project-specific query result
        // If no data is found, this will be an empty array
        setSelectedDisciplineIds(data && data.length > 0 ? data.map(d => d.discipline_id) : []);
      } catch (error) {
        console.error("Error fetching user disciplines:", error);
        setSelectedDisciplineIds([]);
      }
    };

    fetchUserDisciplines();
  }, [user.id, projectId]); // Include projectId as a dependency

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
    if (!projectId) {
      console.error("Cannot insert discipline: No project ID available");
      return;
    }
    
    try {
      const { error } = await supabaseClient.from("user_disciplines").insert({
        user_id: user.id,
        discipline_id: disciplineId,
        project_id: projectId,
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
    if (!projectId) {
      console.error("Cannot delete discipline: No project ID available");
      return;
    }
    
    try {
      const { error } = await supabaseClient
        .from("user_disciplines")
        .delete()
        .eq("user_id", user.id)
        .eq("discipline_id", disciplineId)
        .eq("project_id", projectId);

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
          <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 2 }}>
            <ButtonShowHide text="Cancel" onClick={onCancel} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
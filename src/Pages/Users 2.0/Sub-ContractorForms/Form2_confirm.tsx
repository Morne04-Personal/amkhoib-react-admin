"use client";

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

interface Form2ConfirmProps {
  subContractor: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    contact_number: string;
    company_name: string;
  };
  onCancel: () => void;
  onLink: () => void;
  mainContractorType: string;
  assignableCompanies: { value: string; label: string }[];
  updateAssignedCompany: (companyId: string) => void;
  assignedCompanyId: string;
}

export const Form2Confirm: React.FC<Form2ConfirmProps> = ({
  subContractor,
  onCancel,
  onLink,
  mainContractorType,
  assignableCompanies,
  updateAssignedCompany,
  assignedCompanyId,
}) => {
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

  // Fetch subcontractor's disciplines when projectId changes
  useEffect(() => {
    const fetchSubcontractorDisciplines = async () => {
      // Only proceed if we have both subContractor.id and projectId
      if (!subContractor.id || !projectId) {
        console.log("Skipping discipline fetch - missing subContractor.id or projectId", { 
          subContractorId: subContractor.id, 
          projectId 
        });
        return;
      }
      
      try {
        console.log("Fetching disciplines for subcontractor and project:", { 
          subContractorId: subContractor.id, 
          projectId 
        });
        
        const { data, error } = await supabaseClient
          .from("user_disciplines")
          .select("discipline_id")
          .eq("user_id", subContractor.id)
          .eq("project_id", projectId);
        
        if (error) throw error;
        
        console.log("Subcontractor disciplines result:", data);
        
        // Always set the disciplines based on the project-specific query result
        // If no data is found, this will be an empty array
        setSelectedDisciplineIds(data && data.length > 0 ? data.map(d => d.discipline_id) : []);
      } catch (error) {
        console.error("Error fetching subcontractor disciplines:", error);
        setSelectedDisciplineIds([]);
      }
    };

    fetchSubcontractorDisciplines();
  }, [subContractor.id, projectId]); // Include projectId as a dependency

  const handleDisciplineChange = async (event: React.ChangeEvent<{ value: unknown }>) => {
    const updatedIds = event.target.value as string[];
  
    console.log("Discipline change detected", updatedIds);
  
    // Insert new disciplines
    const newDisciplineIds = updatedIds.filter(id => !selectedDisciplineIds.includes(id));
    for (const id of newDisciplineIds) {
      console.log(`Inserting discipline ID: ${id}`);
      await insertDiscipline(id);
    }
  
    // Remove unselected disciplines
    const removedDisciplineIds = selectedDisciplineIds.filter(id => !updatedIds.includes(id));
    for (const id of removedDisciplineIds) {
      console.log(`Removing discipline ID: ${id}`);
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
        user_id: subContractor.id,
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
        .eq("user_id", subContractor.id)
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
          <TextField source="first_name" label="First Name" value={subContractor.first_name} readonly={true} />
        </Grid>
        <Grid item xs={12}>
          <TextField source="last_name" label="Last Name" value={subContractor.last_name} readonly={true} />
        </Grid>
        <Grid item xs={12}>
          <TextField source="email" label="Email address" value={subContractor.email} readonly={true} />
        </Grid>
        <Grid item xs={12}>
          <TextField source="contact_number" label="Contact number" value={subContractor.contact_number} readonly={true} />
        </Grid>
        <Grid item xs={6}>
          <MultiSelectDropDown
            label="Assign safety file"
            value={selectedDisciplineIds}
            onChange={handleDisciplineChange}
            options={allDisciplines}
            // multiple={false}
          />
        </Grid>
        {mainContractorType !== "Sub-Contractor" && (
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
            {/* <ButtonShowHide text="Link Sub-Contractor" onClick={onLink} /> */}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
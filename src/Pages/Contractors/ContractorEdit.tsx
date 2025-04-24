import React, { useEffect, useState, useRef } from "react";
import { Edit, SimpleForm } from "react-admin";
import { Box, Grow, Typography, Grid } from "@mui/material";
import { ButtonRadioSelect } from "../../Components/Buttons/ButtonRadioSelect";
import { UploadImageButton } from "../../Components/Buttons/UploadImageButton";
import { PageNav } from "../../Components/PageNav";
import { useParams, useNavigate } from 'react-router-dom';
import supabaseClient from "../../supabaseClient";
import { useToast } from "../../Components/Toast/ToastContext";
import DropDown from "../../Components/DropDown";
import CachedIcon from "@mui/icons-material/Cached";
import TextBox from "../../Components/TextBox";
import { TextField } from "../../Components/TextField";
import { ButtonShowHide } from "../../Components/Buttons/ButtonShowHide";
import DataGrid from "../../Components/DataGrid";
import { ListContextProvider, useListController } from "react-admin";

interface Province {
  id: string;
  province_name: string;
}

const CustomListWrapper = ({ children, data }: { children: React.ReactNode; data: any[] }) => {
  const listContext = useListController({
    resource: "users",
    data,
    perPage: 10,
    sort: { field: "first_name", order: "ASC" },
  });

  return <ListContextProvider value={listContext}>{children}</ListContextProvider>;
}

const ContractorEdit = ({ onUserSelected }: { onUserSelected: () => void }) => {
  const { id } = useParams<{ id: string }>();
  const { showMessage } = useToast();
  const navigate = useNavigate();
  const originalContractorId = useRef(id);

  const [contractorTypeId, setContractorTypeId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [physicalAddress, setPhysicalAddress] = useState<string>("");
  const [suburb, setSuburb] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [province, setProvince] = useState<string>("");
  const [contractorDescription, setContractorDescription] = useState<string>("");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [contractors, setContractors] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchContractorData = async () => {
      if (originalContractorId.current) {
        const { data, error } = await supabaseClient
          .from("contractors")
          .select("*, contractor_representative_id")
          .eq("id", originalContractorId.current)
          .single();

        if (error) {
          console.error("Error fetching contractor:", error);
          showMessage("Error fetching contractor data", "error");
        } else if (data) {
          setContractorTypeId(data.contractor_type_id || "");
          setName(data.name || "");
          setPhysicalAddress(data.physical_address || "");
          setSuburb(data.suburb || "");
          setCity(data.city || "");
          setProvince(data.province || "");
          setContractorDescription(data.contractor_description || "");
          setLogoUrl(data.logo_url || null);
          setUploadedImage(data.logo_url || null);

          if (data.contractor_representative_id) {
            const { data: userData, error: userError } = await supabaseClient
              .from("users")
              .select("*")
              .eq("id", data.contractor_representative_id)
              .single();

            if (userError) {
              console.error("Error fetching user:", userError);
            } else {
              setUserData(userData);
            }
          }
        }
      }
    };

    const fetchProvinces = async () => {
      const { data, error } = await supabaseClient.from("provinces").select("id, province_name");

      if (error) {
        console.error("Error fetching provinces:", error);
        return;
      }

      setProvinces(data);
    };

    const fetchContractors = async () => {
      const { data, error } = await supabaseClient
        .from("users")
        .select(`
          *,
          user_roles!inner (
            id,
            role_name
          )
        `)
        .eq("user_roles.role_name", "Contractor");

      if (error) {
        console.error("Error fetching contractors:", error);
      } else {
        setContractors(data || []);
      }
    };

    fetchContractorData();
    fetchProvinces();
    fetchContractors();
  }, [showMessage]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setUploadedImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleOnSave = async () => {
    const contractorUpdate = supabaseClient
      .from("contractors")
      .update({
        contractor_type_id: contractorTypeId,
        name,
        physical_address: physicalAddress,
        suburb,
        city,
        province,
        contractor_description: contractorDescription,
        logo_url: uploadedImage,
      })
      .eq("id", originalContractorId.current);

    const userUpdate = userData
      ? supabaseClient
          .from("users")
          .update({
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            contact_number: userData.contact_number,
            nickname: userData.nickname,
            company_name: userData.company_name,
          })
          .eq("id", userData.id)
      : null;

    const [contractorResult, userResult] = await Promise.all([contractorUpdate, userUpdate]);

    if (contractorResult.error || (userResult && userResult.error)) {
      console.error("Error updating contractor or user:", contractorResult.error || userResult?.error);
      showMessage("Error updating contractor or user", "error");
    } else {
      showMessage("Your contractor and representative have been updated successfully", "success");
      onUserSelected();
    }
  };

  const handleUserSelection = async (selectedUserId: string) => {
    const selectedUser = contractors.find((contractor) => contractor.id === selectedUserId);
    
    if (selectedUser && originalContractorId.current) {
      const { error } = await supabaseClient
        .from("contractors")
        .update({ contractor_representative_id: selectedUser.id })
        .eq("id", originalContractorId.current);
  
      if (error) {
        console.error("Error updating contractor representative:", error);
        showMessage("Error updating contractor representative", "error");
      } else {
        setUserData(selectedUser);
        showMessage("Contractor representative updated successfully", "success");
        navigate(`/contractors/${originalContractorId.current}/show`);
      }
    }
  };

  const dataGridFields = [
    { source: "first_name", label: "First Name", type: "text" },
    { source: "last_name", label: "Last Name", type: "text" },
    { source: "email", label: "Email", type: "text" },
    { source: "contact_number", label: "Contact Number", type: "text" },
  ];

  return (
    <Grow in={true} timeout={500}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f0f2f5",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "700px",
            // backgroundColor: "white",
            borderRadius: "8px",
            // boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            padding: "24px",
          }}
        >
          <PageNav
            title="Edit Contractor Details"
            onBack={handleBack}
            onSave={handleOnSave}
            saveButtonText="Update contractor"
          />
          <SimpleForm toolbar={false}>
            {/* <ButtonRadioSelect
              source="contractor_type_id"
              reference="contractor_types"
              value={contractorTypeId}
              onChange={(newValue) => setContractorTypeId(newValue)}
            /> */}
            <TextField
              source="name"
              label="Company legal name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextBox
              source="contractor_description"
              label="Contractor Description"
              value={contractorDescription}
              onChange={(e) => setContractorDescription(e.target.value)}
            />
            <TextField
              source="physical_address"
              label="Street"
              value={physicalAddress}
              onChange={(e) => setPhysicalAddress(e.target.value)}
            />
            <TextField source="suburb" label="Suburb" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
            <TextField source="city" label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <DropDown
              label="Province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              options={provinces.map((p) => ({ value: p.id, label: p.province_name }))}
              sx={{ width: "50%" }}
            />
            <Box sx={{ marginTop: "16px", textAlign: "center" }}>
              {uploadedImage ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <Box
                    sx={{
                      width: "150px",
                      height: "150px",
                      borderRadius: "50%",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Uploaded"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#1976d2",
                    }}
                    onClick={() => document.getElementById("image-upload-input")?.click()}
                  >
                    <CachedIcon sx={{ fontSize: "32px" }} />
                  </Box>

                  <input
                    type="file"
                    id="image-upload-input"
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageUpload(e.target.files[0]);
                      }
                    }}
                  />
                </Box>
              ) : (
                <UploadImageButton onImageUpload={handleImageUpload} />
              )}
            </Box>
          </SimpleForm>
          {/* User Details Form */}
          {/* <Box sx={{ mt: 4, borderTop: "1px solid #e0e0e0", pt: 4 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Representative Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-start", mb: 2, mt: 3 }}>
                <ButtonShowHide
                  text={showSearch ? "Back to representative details" : "Change representative"}
                  onClick={() => setShowSearch(!showSearch)}
                  readonly={false}
                  sx={{
                    backgroundColor: "#DBEAFE",
                    color: "#235e84",
                    "&:hover": {
                      backgroundColor: "#e0effa",
                    },
                  }}
                />
              </Grid>
            </Grid>
            {showSearch ? (
              <CustomListWrapper data={contractors}>
                <DataGrid
                  fields={dataGridFields}
                  data={contractors.filter(contractor => contractor.id !== userData?.id)} // Filtering out the current representative
                  onRowClick={(id) => {
                    console.log(`Selected User ID: ${id}`);
                    handleUserSelection(id);
                  }}
                  hidePagination={false}
                  hideColumnNames={false}
                />
              </CustomListWrapper>
            ) : !userData ? (
              <Typography color="text.secondary">No representative assigned to this contractor</Typography>
            ) : (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <TextField
                    source="first_name"
                    label="First Name"
                    readonly="true"
                    value={userData.first_name}
                    onChange={(e) => setUserData({ ...userData, first_name: e.target.value })}
                  />
                  <TextField
                    source="last_name"
                    label="Last Name"
                    readonly="true"
                    value={userData.last_name}
                    onChange={(e) => setUserData({ ...userData, last_name: e.target.value })}
                  />
                </Box>
                {userData.company_name !== undefined && (
                  <TextField
                    source="company_name"
                    label="Company Name"
                    readonly="true"
                    value={userData.company_name}
                    onChange={(e) => setUserData({ ...userData, company_name: e.target.value })}
                  />
                )}
                <TextField
                  source="email"
                  label="Email"
                  readonly="true"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                />
                <TextField
                  source="contact_number"
                  label="Contact Number"
                  readonly="true"
                  value={userData.contact_number}
                  onChange={(e) => setUserData({ ...userData, contact_number: e.target.value })}
                  sx={{ width: "50%" }}
                />
              </Box>
            )}
          </Box> */}
        </Box>
      </Box>
    </Grow>
  );
};

export default ContractorEdit;
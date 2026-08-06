import React, { useState, useEffect } from 'react';
import axiosInstance from "../axiosConfig";
import { getParishId } from '../utils/parishAuth';
import { 
  Container, 
  Typography, 
  Box, 
  Select, 
  MenuItem, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Grid, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
// import { LoadingButton } from '@mui/lab';

const ManagerForm = () => {
  const [formData, setFormData] = useState({
    parish: '',
    section: '',
    managers: [
      { name: '', contactNumber: '' },
      { name: '', contactNumber: '' }
    ]
  });
  
  const [parishes, setParishes] = useState([]);
  const [sections, setSections] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedManagers, setSavedManagers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Load parishes when component mounts
  useEffect(() => {
    fetchParishes();
  }, []);
useEffect(() => {
  const pid = getParishId();
  if (pid) setFormData(prev => ({ ...prev, parish: pid }));
}, []);
  // Load managers when parish changes
  useEffect(() => {
    if (formData.parish) {
      fetchManagersByParish(formData.parish);
    } else {
      setSavedManagers([]);
    }
  }, [formData.parish]);

  // Function to fetch parishes from the database
  // const fetchParishes = async () => {
  //   try {
  //     setIsLoading(true);
  //     const response = await axiosInstance.get("/parish");
  //     setParishes(response.data || []);
  //     setIsLoading(false);
  //   } catch (err) {
  //     console.error("Failed to fetch Parishes");
  //     setIsLoading(false);
  //   }
  // };
const fetchParishes = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/parish");
      const filtered = (response.data || []).filter(
        (p) => p.forane === "673799a3cb9b4aa181e53fa2" || p.forane?._id === "673799a3cb9b4aa181e53fa2"
      );
      setParishes(filtered);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch Parishes");
      setIsLoading(false);
    }
  };
  // Function to fetch managers by parish
  const fetchManagersByParish = async (parishId) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/managers/parish/${parishId}`);
      setSavedManagers(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching managers:', error);
      setMessage('Failed to load saved managers');
      setIsLoading(false);
    }
  };

  // Load sections based on selected parish
  useEffect(() => {
    if (formData.parish) {
      const sectionsByParish = {
        // Use parish IDs as keys instead of names
        // Populate this based on your needs
      };
      
      // Get selected parish object
      const selectedParish = parishes.find(p => p._id === formData.parish);
     
      // If parish is found and has sections data
      if (selectedParish && sectionsByParish[selectedParish._id]) {
        setSections(sectionsByParish[selectedParish._id]);
      } else {
        setSections([ "Dominic Savio", "Alphonsa", "Saint Thomas"]);
      }
    } else {
      setSections([]);
    }
  }, [formData.parish, parishes]);

  const handleParishChange = (e) => {
    setFormData({
      ...formData,
      parish: e.target.value,
      section: ''
    });
    
    // Reset editing mode when parish changes
    if (isEditing) {
      setIsEditing(false);
      setEditingId(null);
    }
  };

  const handleSectionChange = (e) => {
    setFormData({
      ...formData,
      section: e.target.value
    });
  };

  const handleManagerChange = (index, field, value) => {
    const updatedManagers = [...formData.managers];
    updatedManagers[index] = {
      ...updatedManagers[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      managers: updatedManagers
    });
  };

  const handleEdit = (record) => {
    setIsEditing(true);
    setEditingId(record._id);
    
    // Populate form with record data
    setFormData({
      parish: typeof record.parish === 'object' ? record.parish._id : record.parish,
      section: record.section,
      managers: [...record.managers]
    });
    
    // If managers array is less than 2, fill it with empty objects
    if (record.managers.length < 2) {
      const updatedManagers = [...record.managers];
      while (updatedManagers.length < 2) {
        updatedManagers.push({ name: '', contactNumber: '' });
      }
      setFormData(prev => ({
        ...prev,
        managers: updatedManagers
      }));
    }
    
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteConfirmation = (id) => {
    setRecordToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/managers/${recordToDelete}`);
      setMessage('Manager record deleted successfully');
      
      // Refresh the manager list for current parish
      if (formData.parish) {
        fetchManagersByParish(formData.parish);
      }
      
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Error deleting manager:', error);
      setMessage('Failed to delete manager record');
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.parish || !formData.section) {
      setMessage('Please select both parish and section');
      return;
    }
    
    // Validate managers data
    const isValid = formData.managers.every(manager => 
      manager.name.trim() !== '' && manager.contactNumber.trim() !== ''
    );
    
    if (!isValid) {
      setMessage('Please enter both name and contact number for all managers');
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (isEditing) {
        // Update existing record
        await axiosInstance.put(`/managers/${editingId}`, formData);
        setMessage('Managers updated successfully!');
      } else {
        // Create new record
        await axiosInstance.post("/managers", formData);
        setMessage('Managers saved successfully!');
      }
      
      // Reset form
      setFormData({
        parish: formData.parish, // Keep the parish selected
        section: '',
        managers: [
          { name: '', contactNumber: '' },
          { name: '', contactNumber: '' }
        ]
      });
      
      // Reset editing mode
      setIsEditing(false);
      setEditingId(null);
      
      // Refresh the manager list for current parish
      fetchManagersByParish(formData.parish);
      setIsLoading(false);
    } catch (error) {
      console.error('Error saving managers:', error);
      setMessage('Failed to save managers. Please try again.');
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      parish: formData.parish, // Keep the parish selected
      section: '',
      managers: [
        { name: '', contactNumber: '' },
        { name: '', contactNumber: '' }
      ]
    });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditing ? 'Edit Managers' : 'Manager Registration'}
        </Typography>
        
        {message && (
          <Box sx={{ 
            bgcolor: 'info.light', 
            color: 'info.contrastText', 
            p: 2, 
            borderRadius: 1,
            mb: 2 
          }}>
            {message}
          </Box>
        )}
        
        <Paper elevation={3} sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {!getParishId() && (
  <Grid item xs={12} md={6}>
    <FormControl fullWidth required>
      <InputLabel>Parish</InputLabel>
      <Select
        value={formData.parish}
        label="Parish"
        onChange={handleParishChange}
        disabled={isEditing}
      >
        <MenuItem value="">Select Parish</MenuItem>
        {parishes.map((parish) => (
          <MenuItem key={parish._id} value={parish._id}>
            {parish.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>
)}
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={formData.section}
                    label="Section"
                    onChange={handleSectionChange}
                    disabled={!formData.parish}
                  >
                    <MenuItem value="">Select Section</MenuItem>
                    {sections.map((section) => (
                      <MenuItem key={section} value={section}>
                        {section}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {formData.managers.map((manager, index) => (
                <React.Fragment key={index}>
                  <Grid item xs={12}>
                    <Typography variant="h6" component="h2">
                      Manager {index + 1}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={manager.name}
                      onChange={(e) => handleManagerChange(index, 'name', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contact Number"
                      value={manager.contactNumber}
                      onChange={(e) => handleManagerChange(index, 'contactNumber', e.target.value)}
                      required
                      type="tel"
                      inputProps={{ pattern: "[0-9]*" }}
                    />
                  </Grid>
                </React.Fragment>
              ))}
              
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  mt: 2 
                }}>
                  {isEditing && (
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                 
                  <Button
                    type="submit"
                    variant="contained"
                    loading={isLoading}
                    loadingIndicator="Saving..."
                  >
                    {isEditing ? 'Update Managers' : 'Save Managers'}
                  </Button> 
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
        
        {formData.parish && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Managers for Selected Parish
            </Typography>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress />
              </Box>
            ) : savedManagers.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Parish</TableCell>
                      <TableCell>Section</TableCell>
                      <TableCell>Manager 1</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Manager 2</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {savedManagers.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>
                          {typeof record.parish === 'object' ? record.parish.name : record.parish}
                        </TableCell>
                        <TableCell>{record.section}</TableCell>
                        <TableCell>{record.managers[0]?.name || '-'}</TableCell>
                        <TableCell>{record.managers[0]?.contactNumber || '-'}</TableCell>
                        <TableCell>{record.managers[1]?.name || '-'}</TableCell>
                        <TableCell>{record.managers[1]?.contactNumber || '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                              variant="outlined" 
                              color="primary" 
                              size="small"
                              onClick={() => handleEdit(record)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outlined" 
                              color="error" 
                              size="small"
                              onClick={() => handleDeleteConfirmation(record._id)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1">No managers saved for this parish</Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this manager record?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManagerForm;
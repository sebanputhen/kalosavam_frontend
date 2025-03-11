import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid, 
  Paper, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Pencil, Trash2, Plus, RefreshCw, FileDown } from 'lucide-react';
import axiosInstance from "../axiosConfig";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

// Theme configuration
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB',
      light: '#3B82F6',
      dark: '#1E40AF'
    },
    secondary: {
      main: '#10B981',
      light: '#34D399',
      dark: '#047857'
    }
  }
});

const VenueRegistration = () => {
  // State variables
  const [venues, setVenues] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [selectedParish, setSelectedParish] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Venue form state
  const [venueForm, setVenueForm] = useState({
    name: '',
    address: '',
    capacity: '',
    parish: '',
    contactPerson: '',
    contactNumber: ''
  });

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentVenueId, setCurrentVenueId] = useState(null);

  // Fetch parishes on component mount
  useEffect(() => {
    fetchParishes();
  }, []);

  // Fetch venues when parish is selected
  useEffect(() => {
    if (selectedParish) {
      fetchVenuesByParish();
    }
  }, [selectedParish]);

  // Fetch parishes
  const fetchParishes = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/Forane");
      setParishes(response.data || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch Parishes", err);
      setMessage("Error fetching parishes");
      setIsLoading(false);
    }
  };

  // Fetch venues for selected parish
  const fetchVenuesByParish = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/venues/parish/${selectedParish}`);
      setVenues(response.data.data || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch Venues", err);
      setMessage("Error fetching venues");
      setIsLoading(false);
    }
  };

  // Handle input changes in venue form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVenueForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open dialog for new venue
  const handleOpenDialog = () => {
    setIsEditMode(false);
    setCurrentVenueId(null);
    setVenueForm({
      name: '',
      address: '',
      capacity: '',
      parish: selectedParish,
      contactPerson: '',
      contactNumber: ''
    });
    setOpenDialog(true);
  };

  // Open dialog for editing venue
  const handleEditVenue = (venue) => {
    setIsEditMode(true);
    setCurrentVenueId(venue._id);
    setVenueForm({
      name: venue.name,
      address: venue.address,
      capacity: venue.capacity,
      parish: venue.parish,
      contactPerson: venue.contactPerson || '',
      contactNumber: venue.contactNumber || ''
    });
    setOpenDialog(true);
  };

  // Submit venue form
  const handleSubmitVenue = async () => {
    try {
      setIsLoading(true);
      
      // Validate form
      if (!venueForm.name || !venueForm.address || !venueForm.capacity) {
        setMessage("Please fill all required fields");
        setIsLoading(false);
        return;
      }

      const venueData = {
        ...venueForm,
        parish: selectedParish
      };

      if (isEditMode) {
        // Update existing venue
        await axiosInstance.put(`/venues/${currentVenueId}`, venueData);
        setMessage("Venue updated successfully");
      } else {
        // Create new venue
        await axiosInstance.post("/venues", venueData);
        setMessage("Venue created successfully");
      }

      // Refresh venues and close dialog
      fetchVenuesByParish();
      setOpenDialog(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Error submitting venue:', error);
      setMessage(error.response?.data?.message || "Error submitting venue");
      setIsLoading(false);
    }
  };

  // Delete venue
  const handleDeleteVenue = async (venueId) => {
    if (window.confirm("Are you sure you want to delete this venue?")) {
      try {
        await axiosInstance.delete(`/venues/${venueId}`);
        setMessage("Venue deleted successfully");
        fetchVenuesByParish();
      } catch (error) {
        console.error("Error deleting venue:", error);
        setMessage(error.response?.data?.message || "Error deleting venue");
      }
    }
  };

  // Export venues to PDF
  const handleExportPDF = () => {
    if (!venues.length) return;
    
    const doc = new jsPDF();
    const tableData = venues.map((venue, index) => [
      index + 1,
      venue.name,
      venue.address,
      venue.capacity,
      venue.contactPerson || 'N/A',
      venue.contactNumber || 'N/A'
    ]);
    
    const parishName = parishes.find(p => p._id === selectedParish)?.name || 'Parish';
    
    doc.text(`Venues - ${parishName}`, 14, 15);
    
    autoTable(doc, {
      head: [['No.', 'Venue Name', 'Address', 'Capacity', 'Contact Person', 'Contact Number']],
      body: tableData,
      startY: 25,
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: { 
        fillColor: [37, 99, 235], 
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      }
    });
    
    doc.save(`${parishName}-venues.pdf`);
  };

  // Filtered venues based on search query
  const filteredVenues = venues.filter(venue => 
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (venue.address && venue.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (venue.contactPerson && venue.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ThemeProvider theme={theme}>
    <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Venue Registration
          </Typography>
          
          {message && (
            <Paper 
              sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: message.includes('Error') ? '#FFEBEE' : '#E8F5E9',
                borderRadius: 2
              }}
            >
              <Typography>{message}</Typography>
            </Paper>
          )}

          {/* Parish Selection */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Forane</InputLabel>
                <Select
                  value={selectedParish}
                  onChange={(e) => setSelectedParish(e.target.value)}
                  label="Select Parish"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {parishes.map((parish) => (
                    <MenuItem key={parish._id} value={parish._id}>
                      {parish.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Button
                            variant="contained"
                            startIcon={<Plus size={18} />}
                            onClick={handleOpenDialog}
                            disabled={!selectedParish}
                        >
                            Add New Venue
                        </Button>
                        <Box>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshCw size={18} />}
                                onClick={fetchVenuesByParish}
                                disabled={!selectedParish}
                                sx={{ mr: 1 }}
                            >
                                Refresh
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<FileDown size={18} />}
                                onClick={handleExportPDF}
                                disabled={!venues.length}
                            >
                                Export to PDF
                            </Button>
                        </Box>
                    </Box>

          {/* Venues Table */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : selectedParish ? (
            <>
              {/* Search Input */}
              <TextField
                fullWidth
                variant="outlined"
                label="Search Venues"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: searchQuery && (
                    <IconButton 
                      size="small" 
                      onClick={() => setSearchQuery('')}
                      sx={{ p: 0.5 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </IconButton>
                  )
                }}
              />

              {filteredVenues.length === 0 ? (
                <Alert severity="info">
                  No venues found. Click "Add New Venue" to register a venue.
                </Alert>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>No.</TableCell>
                        <TableCell>Venue Name</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>Capacity</TableCell>
                        <TableCell>Contact Person</TableCell>
                        <TableCell>Contact Number</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredVenues.map((venue, index) => (
                        <TableRow key={venue._id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Chip 
                              label={venue.name} 
                              color="primary" 
                              variant="outlined" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{venue.address}</TableCell>
                          <TableCell>
                            <Chip 
                              label={venue.capacity} 
                              color="secondary" 
                              variant="outlined" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{venue.contactPerson || 'N/A'}</TableCell>
                          <TableCell>{venue.contactNumber || 'N/A'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => handleEditVenue(venue)}
                              >
                                <Pencil size={16} />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => handleDeleteVenue(venue._id)}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          ) : (
            <Alert severity="warning">
              Please select a parish to view and manage venues.
            </Alert>
          )}
        </Paper>

        {/* Venue Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle>
            {isEditMode ? 'Edit Venue' : 'Add New Venue'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ pt: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Venue Name"
                  name="name"
                  value={venueForm.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={venueForm.address}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Capacity"
                  name="capacity"
                  type="number"
                  value={venueForm.capacity}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    inputProps: { 
                      min: 1 
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  name="contactPerson"
                  value={venueForm.contactPerson}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="contactNumber"
                  value={venueForm.contactNumber}
                  onChange={handleInputChange}
                  type="tel"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenDialog(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button  
              onClick={handleSubmitVenue}
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isEditMode ? 'Update Venue' : 'Add Venue'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default VenueRegistration;
                  
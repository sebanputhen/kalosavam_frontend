import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  CircularProgress
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axiosInstance from "../axiosConfig";

// Theme configuration
const theme = createTheme({
  typography: {
    fontFamily: 'Arial, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          '@media print': {
            boxShadow: 'none',
            border: 'none',
          }
        }
      }
    }
  }
});

// Print styles
const printStyles = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    body {
      zoom: 0.85;
    }
    .print-section {
      display: block !important;
    }
    .no-print {
      display: none !important;
    }
  }
`;

const ForaneEventRegistration = () => {
  const [foranes, setForanes] = useState([]);
  const [selectedForane, setSelectedForane] = useState('');
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState({});
  
  // Loading states
  const [loadingForanes, setLoadingForanes] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Fetch foranes
  useEffect(() => {
    const fetchForanes = async () => {
      setLoadingForanes(true);
      try {
        const response = await axiosInstance.get('/forane');
        setForanes(response.data || []);
      } catch (error) {
        console.error('Error fetching foranes:', error);
      } finally {
        setLoadingForanes(false);
      }
    };

    fetchForanes();
  }, []);

  // Fetch venues when forane is selected
  useEffect(() => {
    const fetchVenues = async () => {
      if (!selectedForane) return;

      setLoadingVenues(true);
      try {
        const response = await axiosInstance.get(`/venues/parish/${selectedForane}`);
        const venuesList = response.data.data || [];
        setVenues(venuesList);
        
        // Reset venue and events
        setSelectedVenue('');
        setEvents([]);
        setRegistrations({});
      } catch (error) {
        console.error('Error fetching venues:', error);
        setVenues([]);
      } finally {
        setLoadingVenues(false);
      }
    };

    fetchVenues();
  }, [selectedForane]);

  // Fetch events when venue is selected
  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedForane || !selectedVenue) return;
  
      setLoadingEvents(true);
      try {
        // Fetch events for the selected forane and venue
        const eventsResponse = await axiosInstance.get(`/allocations/forane/${selectedForane}/venue/${selectedVenue}`);
        const allocatedEvents = eventsResponse.data?.data || [];
  
        // Detailed event fetching
        const detailedEvents = [];
        const registrationsMap = {};
  
        for (const allocation of allocatedEvents) {
          try {
            // The event is already in the allocation object
            const eventDetails = {
              _id: allocation._id,
              eventName: allocation.eventName,
              section: allocation.section,
              gender: allocation.gender,
              eventType: allocation.eventType
            };
  
            // Fetch registrations 
            const registrationsResponse = await axiosInstance.get(`/registrations/forane/${selectedForane}/event/${allocation._id}`);
            const eventRegistrations = registrationsResponse.data?.data?.registrations || [];
  
            // Store registrations
            registrationsMap[allocation._id] = eventRegistrations;
  
            // Store event details
            detailedEvents.push(eventDetails);
          } catch (registrationError) {
            console.error(`Error processing event ${allocation._id}:`, registrationError);
          }
        }
  
        setEvents(detailedEvents);
        setRegistrations(registrationsMap);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
        setRegistrations({});
      } finally {
        setLoadingEvents(false);
      }
    };
  
    fetchEvents();
  }, [selectedForane, selectedVenue]);

  // Render print view for participant registrations
  const renderPrintView = () => {
    const forane = foranes.find(f => f._id === selectedForane);
    const venue = venues.find(v => v._id === selectedVenue);

    return (
      <Box className="print-section hidden absolute top-0 left-0 w-full p-4">
        <Box textAlign="center" mb={4}>
          <Typography variant="h5" fontWeight="bold">
            SUNDAY SCHOOL BIBLE KALOLSAVAM - 2023
          </Typography>
          <Typography variant="h6">
            {forane?.name} FORANE
          </Typography>
          <Typography variant="subtitle1">
              Venue: {venue?.name}
            </Typography>
            <Typography variant="subtitle2" className="mb-4">
              Participant Registration Numbers
            </Typography>
        </Box>

        {events.map((event) => {
          const eventRegistrations = registrations[event._id] || [];
          
          // Extract only the numeric part of registration numbers
          const extractRegistrationNumbers = (registrations, isGroup) => {
            return [...new Set(registrations.map(r => {
              // For group events
              if (isGroup && r.groupRegistrationNumber) {
                return r.groupRegistrationNumber.split('-').pop();
              }
              // For individual events
              if (!isGroup && r.registrationNumber) {
                return r.registrationNumber.split('-').pop();
              }
              return '';
            }))].filter(num => num !== '');
          };

          const registrationNumbers = extractRegistrationNumbers(
            eventRegistrations, 
            event.eventType === 'group'
          );

          return (
            <Box key={event._id} mb={4}>
              <Typography variant="h6" gutterBottom>
                {event.eventName}
              </Typography>
              
              <Box border={1} p={2}>
                {registrationNumbers.length > 0 ? (
                  <Grid container>
                    {registrationNumbers.map((number, index) => (
                      <Grid item key={index} xs={4} sm={3} md={2} sx={{ 
                        borderRight: index % 4 !== 3 ? '1px solid #ddd' : 'none',
                        borderBottom: index < registrationNumbers.length - 4 ? '1px solid #ddd' : 'none', 
                        p: 1,
                        textAlign: 'center'
                      }}>
                        <Typography>{number}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography>
                    {event.eventType === 'group' 
                      ? 'No group registrations' 
                      : 'No individual registrations'}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}

        <Box mt={2} display="flex" justifyContent="space-between">
          <Typography variant="body2">
            {forane?.name}
          </Typography>
          <Typography variant="body2">
            {new Date().toLocaleDateString()}
          </Typography>
        </Box>

        <Box mt={4}>
         
        </Box>
      </Box>
    );
  };

  // Loading indicator component
  const LoadingIndicator = () => (
    <Box display="flex" justifyContent="center" alignItems="center" p={3}>
      <CircularProgress size={24} sx={{ mr: 1 }} />
      <Typography variant="body2">Loading...</Typography>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <style>{printStyles}</style>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Forane</InputLabel>
                <Select
                  value={selectedForane}
                  label="Select Forane"
                  onChange={(e) => {
                    setSelectedForane(e.target.value);
                    setSelectedVenue('');
                    setEvents([]);
                    setRegistrations({});
                  }}
                  disabled={loadingForanes}
                  endAdornment={loadingForanes && <CircularProgress size={20} sx={{ mr: 2 }} />}
                >
                  {foranes.map((forane) => (
                    <MenuItem key={forane._id} value={forane._id}>
                      {forane.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Venue</InputLabel>
                <Select
                  value={selectedVenue}
                  label="Select Venue"
                  onChange={(e) => setSelectedVenue(e.target.value)}
                  disabled={!selectedForane || loadingVenues}
                  endAdornment={loadingVenues && <CircularProgress size={20} sx={{ mr: 2 }} />}
                >
                  {venues.map((venue) => (
                    <MenuItem key={venue._id} value={venue._id}>
                      {venue.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {selectedVenue && (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box textAlign="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                  SUNDAY SCHOOL BIBLE KALOLSAVAM - 2024
                </Typography>
                <Typography variant="subtitle1">
                  {foranes.find(f => f._id === selectedForane)?.name} Forane
                </Typography>
                <Typography variant="subtitle2">
                  Venue: {venues.find(v => v._id === selectedVenue)?.name}
                </Typography>
              </Box>

              {loadingEvents ? (
                <LoadingIndicator />
              ) : events.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Event Name</TableCell>
                      <TableCell>Section</TableCell>
                      <TableCell>Event Type</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Registration Numbers</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.map((event) => {
                      const eventRegistrations = registrations[event._id] || [];
                      
                      // Extract only the numeric part of registration numbers
                      const extractRegistrationNumbers = (registrations, isGroup) => {
                        return [...new Set(registrations.map(r => {
                          // For group events
                          if (isGroup && r.groupRegistrationNumber) {
                            return r.groupRegistrationNumber.split('-').pop();
                          }
                          // For individual events
                          if (!isGroup && r.registrationNumber) {
                            return r.registrationNumber.split('-').pop();
                          }
                          return '';
                        }))].filter(num => num !== '');
                      };

                      const registrationNumbers = extractRegistrationNumbers(
                        eventRegistrations, 
                        event.eventType === 'group'
                      );

                      return (
                        <TableRow key={event._id}>
                          <TableCell>
                            {event.eventName}
                          </TableCell>
                          <TableCell>
                            {event.section || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {event.eventType}
                          </TableCell>
                          <TableCell>
                            {event.gender}
                          </TableCell>
                          <TableCell>
                            {registrationNumbers.length > 0
                              ? (
                                <Grid container spacing={1}>
                                  {registrationNumbers.map((number, index) => (
                                    <Grid item key={index} xs={4} sm={3} md={2}>
                                      <Box sx={{ 
                                        border: '1px solid #ddd',
                                        p: 0.5,
                                        textAlign: 'center',
                                        borderRadius: '4px'
                                      }}>
                                        <Typography variant="body2">
                                          {number}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  ))}
                                </Grid>
                              )
                              : (event.eventType === 'group' 
                                  ? 'No group registrations' 
                                  : 'No individual registrations')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="textSecondary" align="center">
                  No events found for this venue.
                </Typography>
              )}

              <Box mt={2} display="flex" justifyContent="center">
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => window.print()}
                  disabled={events.length === 0 || loadingEvents}
                >
                  Print Participant Registrations
                </Button>
              </Box>
            </Paper>
          )}

          {/* Render print view */}
          {renderPrintView()}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default ForaneEventRegistration;
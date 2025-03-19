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
  Button,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TextField
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
  }
`;

const JudgeMarkEntrySheet = () => {
  const [foranes, setForanes] = useState([]);
  const [selectedForane, setSelectedForane] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState('');

  // Fetch foranes
  useEffect(() => {
    const fetchForanes = async () => {
      try {
        const response = await axiosInstance.get('/forane');
        setForanes(response.data || []);
      } catch (error) {
        console.error('Error fetching foranes:', error);
      }
    };

    fetchForanes();
  }, []);

  // Fetch venues when forane is selected
  useEffect(() => {
    const fetchVenues = async () => {
      if (!selectedForane) return;

      try {
        const response = await axiosInstance.get(`/venues/parish/${selectedForane}`);
        setVenues(response.data.data || []);
        // Reset dependent selections
        setSelectedVenue('');
        setSelectedEvent('');
        setEvents([]);
      } catch (error) {
        console.error('Error fetching venues:', error);
      }
    };

    fetchVenues();
  }, [selectedForane]);

  // Fetch events when venue is selected
  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedForane || !selectedVenue) return;

      try {
        const response = await axiosInstance.get(`/allocations/forane/${selectedForane}/venue/${selectedVenue}`);
        // Handle the specific response structure
        const eventsData = response.data?.data || [];
        setEvents(eventsData);
        // Reset event selection
        setSelectedEvent('');
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]); // Ensure events is an empty array on error
      }
    };

    fetchEvents();
  }, [selectedForane, selectedVenue]);

  // Number of entries (rows) to show
  const numberOfEntries = 16;

  return (
    <ThemeProvider theme={theme}>
      <style>{printStyles}</style>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Forane</InputLabel>
                <Select
                  value={selectedForane}
                  label="Select Forane"
                  onChange={(e) => setSelectedForane(e.target.value)}
                >
                  {foranes.map((forane) => (
                    <MenuItem key={forane._id} value={forane._id}>
                      {forane.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Venue</InputLabel>
                <Select
                  value={selectedVenue}
                  label="Select Venue"
                  onChange={(e) => setSelectedVenue(e.target.value)}
                  disabled={!selectedForane}
                >
                  {venues.map((venue) => (
                    <MenuItem key={venue._id} value={venue._id}>
                      {venue.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Event</InputLabel>
                <Select
                  value={selectedEvent}
                  label="Select Event"
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  disabled={!selectedVenue}
                >
                  {events.length > 0 ? (
                    events.map((event) => {
                      // Construct a descriptive event name
                      const eventName = `${event.eventName} (${event.section}, ${event.gender}, ${event.eventType})`;
                      
                      return (
                        <MenuItem 
                          key={event._id} 
                          value={event._id}
                        >
                          {eventName}
                        </MenuItem>
                      );
                    })
                  ) : (
                    <MenuItem disabled>No events available</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {selectedEvent && (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box textAlign="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                  SUNDAY SCHOOL BIBLE KALOLSAVAM - 2024
                </Typography>
                <Typography variant="subtitle1">
                  {foranes.find(f => f._id === selectedForane)?.name} Forane
                </Typography>
              </Box>

              <Box mb={2} display="flex" justifyContent="space-between">
                <Typography variant="body1">
                  <strong>Venue:</strong> {venues.find(v => v._id === selectedVenue)?.name}
                </Typography>
                <Typography variant="body1">
                  <strong>Section:</strong> {events.find(e => e._id === selectedEvent)?.section}
                </Typography>
                <Typography variant="body1">
                  <strong>Item:</strong> {events.find(e => e._id === selectedEvent)?.eventName} 
                 
                </Typography>
              </Box>

              <Table sx={{ 
                minWidth: 650, 
                border: '1px solid black',
                '& th, & td': { 
                  border: '1px solid black', 
                  padding: '8px', 
                  textAlign: 'center' 
                }
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Sl. No</TableCell>
                    <TableCell>CH. No</TableCell>
                    <TableCell>Remarks</TableCell>
                    <TableCell>Mark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...Array(numberOfEntries)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <TextField 
                          fullWidth 
                          variant="standard" 
                        //   placeholder="Name"
                          InputProps={{ disableUnderline: true }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField 
                          fullWidth 
                          variant="standard" 
                        //   placeholder="Remarks"
                          InputProps={{ disableUnderline: true }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField 
                          fullWidth 
                          type="number"
                          variant="standard" 
                        //   placeholder="Mark"
                          InputProps={{ disableUnderline: true }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Box mt={2} display="flex" justifyContent="space-between">
                <Typography variant="body2">
                  {foranes.find(f => f._id === selectedForane)?.name}
                </Typography>
                <Typography variant="body2">
                  {new Date().toLocaleDateString()}
                </Typography>
              </Box>

              <Box mt={4} display="flex" justifyContent="space-between">
                <Typography variant="body2" sx={{ flex: 1 }}>
                  Name & Signature (Judge)
                </Typography>
              </Box>

              <Box mt={2} display="flex" justifyContent="center">
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => window.print()}
                  disabled={!selectedForane || !selectedVenue || !selectedEvent}
                >
                  Print Mark Sheet
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default JudgeMarkEntrySheet;
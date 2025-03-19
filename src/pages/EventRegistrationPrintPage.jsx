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
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axiosInstance from "../axiosConfig";
import { useFinancialYear } from './FinancialYearContext';

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

// Style for print media
const printStyles = `
  @media print {
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    body {
      zoom: 0.85;
    }
    .vertical-text {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      transform: rotate(180deg);
      white-space: nowrap;
    }
  }
`;

// Configuration Constants
const SECTION_CONFIG = {
  'Dominic Savio': { 
    label: 'Classes IV-VI',
    section: 'Dominic Savio Section'
  },
  'Alphonsa': { 
    label: 'Classes VII-IX',
    section: 'Alphonsa Section'
  },
  'Saint Thomas': { 
    label: 'Classes X-XII',
    section: 'Saint Thomas  Section'
  }
};

const EventRegistrationPrintPage = () => {
  const [parishes, setParishes] = useState([]);
  const [selectedParish, setSelectedParish] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [participants, setParticipants] = useState([]);
  const [sectionDetails, setSectionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedYear1: currentYear } = useFinancialYear();
  const [managers, setManagers] = useState([]);
  const [parishDetails, setParishDetails] = useState(null);
  const [eventColumns, setEventColumns] = useState([]);

  useEffect(() => {
    // Fetch parishes on component mount
    const fetchParishes = async () => {
      try {
        const response = await axiosInstance.get("/parish");
        setParishes(response.data || []);
      } catch (error) {
        console.error("Error fetching parishes:", error);
      }
    };

    fetchParishes();
  }, []);

  // Fetch parish details when a parish is selected
  useEffect(() => {
    const fetchParishDetails = async () => {
      if (!selectedParish) return;

      try {
        const response = await axiosInstance.get(`/parish/${selectedParish}`);
        setParishDetails(response.data);
      } catch (error) {
        console.error("Error fetching parish details:", error);
        setParishDetails(null);
      }
    };

    fetchParishDetails();
  }, [selectedParish]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedParish) return;
    
      try {
        setIsLoading(true);
    
        // Fetch section details with new route pattern
        const encodedSection = selectedSection 
          ? encodeURIComponent(selectedSection)
          : 'all';
        
        const sectionApiPath = `/registrations/parish/${selectedParish}/sections/${encodedSection}`;
        
        const sectionResponse = await axiosInstance.get(sectionApiPath);
        const sectionDetails = sectionResponse.data.data.sectionDetails;
        setSectionDetails(sectionDetails);
    
        // Fetch all registrations
        const registrationsResponse = await axiosInstance.get(`/registrations/parish/${selectedParish}`);
        const registrations = registrationsResponse.data.data.registrations || [];
    
        const processedParticipants = processRegistrations(registrations);
        setParticipants(processedParticipants);

        // Extract event columns dynamically
        const extractedEventColumns = extractEventColumns(registrations);
        setEventColumns(extractedEventColumns);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching registration data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedParish, selectedSection]);

  // Function to extract event columns dynamically
  const extractEventColumns = (registrations) => {
    // Group registrations by event name
    const eventColumnMap = registrations.reduce((acc, reg) => {
      if (reg.event && reg.event.eventName) {
        acc[reg.event.eventName] = reg.event;
      }
      return acc;
    }, {});

    // Convert to array of event column objects
    return Object.values(eventColumnMap).map(event => ({
      id: event._id,
      name: event.eventName
    }));
  };

  useEffect(() => {
    const fetchManagerData = async () => {
      if (!selectedParish || !selectedSection) return;
    
      try {
        const response = await axiosInstance.get(`/managers/parish/${selectedParish}/section/${selectedSection}`);
     
        
        // Directly access the first item in the response.data array
        const sectionData = response.data[0];
        
        if (sectionData && sectionData.managers && sectionData.managers.length > 0) {
          // Set all managers
          setManagers(sectionData.managers);
        } else {
          setManagers([]);
        }
      } catch (error) {
        console.error("Error fetching manager:", error);
        setManagers([]);
      }
    };

    fetchManagerData();
  }, [selectedParish, selectedSection]);

  const processRegistrations = (registrations) => {
    const groupedParticipants = {};

    registrations.forEach(reg => {
      const participantKey = `${reg.name}|${reg.standard}|${reg.gender}|${new Date(reg.dob).toISOString().split('T')[0]}`;
      
      if (!groupedParticipants[participantKey]) {
        groupedParticipants[participantKey] = {
          name: reg.name,
          standard: reg.standard,
          gender: reg.gender,
          dob: reg.dob,
          section: reg.section,
          events: []
        };
      }

      groupedParticipants[participantKey].events.push({
        eventId: reg.event._id,
        eventName: reg.event.eventName
      });
    });

    return Object.values(groupedParticipants)
      .filter(participant => {
        if (selectedSection && participant.section !== selectedSection) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get the current section text
  const getCurrentSectionText = () => {
    if (!selectedSection) return 'സെന്റ് തോമസ്  വിഭാഗം';
    
    return SECTION_CONFIG[selectedSection]?.section || 'സെന്റ് തോമസ്  വിഭാഗം';
  };

  return (
    <ThemeProvider theme={theme}>
      <style>{printStyles}</style>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Parish</InputLabel>
                <Select
                  value={selectedParish}
                  label="Select Parish"
                  onChange={(e) => setSelectedParish(e.target.value)}
                >
                  {parishes.map((parish) => (
                    <MenuItem key={parish._id} value={parish._id}>
                      {parish.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Section</InputLabel>
                <Select
                  value={selectedSection}
                  label="Filter by Section"
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  <MenuItem value="">All Sections</MenuItem>
                  {Object.keys(SECTION_CONFIG).map((section) => (
                    <MenuItem key={section} value={section}>
                      {section} ({SECTION_CONFIG[section].label})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                sx={{ height: '100%' }}
                onClick={() => window.print()}
                disabled={!selectedParish}
              >
                Print Registration
              </Button>
            </Grid>
          </Grid>

          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
              <CircularProgress />
            </Box>
          ) : selectedParish ? (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box textAlign="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                  Forane Kalolsavam {currentYear}
                </Typography>
                <Typography variant="subtitle1">
                  {getCurrentSectionText()}
                </Typography>
              </Box>
              
              {/* Parish, Forane, and Manager Details */}
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" sx={{ flex: 1, textAlign: 'left' }}>
                 Parish: {parishDetails?.name || 'ELANGOI'}
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, textAlign: 'center' }}>
                 Forane: {parishDetails?.forane.name || 'PONKUNNAM'}
                </Typography>
                
                <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}>
                  {managers.length > 0 
                    ? managers.map((manager, index) => (
                        `${manager.name} (${manager.contactNumber})`
                      )).join(', ')
                    : 'Managers'}
                </Typography>
              </Box>

              <TableContainer>
                <Table sx={{ 
                  minWidth: 650, 
                  border: '1px solid black',
                  '& th, & td': { 
                    border: '1px solid black', 
                    padding: '4px', 
                    textAlign: 'center' 
                  }
                }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sl No.</TableCell>
                      <TableCell>Chess No.</TableCell>
                      <TableCell>Name & house Name in Sunday School Register</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Gender (M/F)</TableCell>
                      <TableCell>Dob</TableCell>
                      {eventColumns.map((event, index) => (
                        <TableCell key={event.id} sx={{ width: '50px', padding: '0' }}>
                          <div className="vertical-text" style={{ 
                            writingMode: 'vertical-rl', 
                            textOrientation: 'mixed',
                            transform: 'rotate(180deg)',
                            whiteSpace: 'nowrap',
                            padding: '4px',
                            height: '150px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {event.name}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {participants.map((participant, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell></TableCell>
                        <TableCell>{participant.name}</TableCell>
                        <TableCell>{participant.standard}</TableCell>
                        <TableCell>{participant.gender}</TableCell>
                        <TableCell>
                          {new Date(participant.dob).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </TableCell>
                        {eventColumns.map((event) => (
                          <TableCell key={event.id}>
                            {participant.events.some(e => e.eventName === event.name) ? 'X' : ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box mt={2} display="flex" justifyContent="space-between">
                <Typography variant="body2">
                  <strong>നിബന്ധനകൾ:</strong>
                  <ol style={{ paddingLeft: '20px' }}>
                    <li>പ്രവേശന ഫോം മാതൃകാപരമായി തികച്ചും യഥാർഥ വിവരങ്ങൾ പൂരിപ്പിക്കണം.</li>
                    <li>മാതാപിതാക്കൾ അറിയിക്കുന്ന വിവരങ്ങൾക്ക് കൈക്കൊപ്പം ചേർക്കണം.</li>
                    <li>കൂടുതൽ വിവരങ്ങൾക്ക് ENGLISH CAPITAL ഉപയോഗിക്കണം.</li>
                  </ol>
                </Typography>
              </Box>

              <Box mt={2} display="flex" justifyContent="space-between">
                <Typography variant="body2">തിയ്തി:</Typography>
                <Typography variant="body2"> സെക്രട്ടറി</Typography>
              </Box>
            </Paper>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="textSecondary">
                Select a parish to view registration details
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default EventRegistrationPrintPage;
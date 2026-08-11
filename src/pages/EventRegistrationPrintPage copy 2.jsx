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
import { getParishId } from '../utils/parishAuth';
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

const printStyles = `
  @media print {
    @page {
      size: A4 landscape;
      margin: 5mm;
    }
    .no-print {
      display: none !important;
    }
    nav, header, footer, aside,
    .MuiDrawer-root, .MuiAppBar-root,
    .sidebar, .navbar, .topbar,
    [class*="Sidebar"], [class*="Navbar"], [class*="AppBar"],
    [class*="drawer"], [class*="header"] {
      display: none !important;
    }
    .print-area {
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 5px !important;
      box-shadow: none !important;
      font-size: 10px !important;
    }
    .print-area * {
      visibility: visible !important;
    }
    .print-area table {
      font-size: 9px !important;
    }
    .print-area td, .print-area th {
      padding: 2px !important;
      white-space: nowrap !important;
    }
    .print-area h4 {
      font-size: 18px !important;
      margin: 0 !important;
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
  const [allSectionEvents, setAllSectionEvents] = useState([]);

  useEffect(() => {
    const fetchParishes = async () => {
      try {
        const response = await axiosInstance.get("/parish");
        const filtered = (response.data || []).filter(
          (p) => p.forane === "673799a3cb9b4aa181e53fa2" || p.forane?._id === "673799a3cb9b4aa181e53fa2"
        );
        setParishes(filtered);
      } catch (error) {
        console.error("Error fetching parishes:", error);
      }
    };

    fetchParishes();
  }, []);
useEffect(() => {
  const pid = getParishId();
  if (pid) setSelectedParish(pid);
}, []);
  useEffect(() => {
    const fetchSectionEvents = async () => {
      if (!selectedSection) {
        setAllSectionEvents([]);
        return;
      }

      try {
        const response = await axiosInstance.get(`/events/section/${encodeURIComponent(selectedSection)}`);
        const events = response.data.data.events || [];
        setAllSectionEvents(events.map(event => ({
          id: event._id,
          name: event.eventName
        })));
      } catch (error) {
        console.error("Error fetching section events:", error);
        setAllSectionEvents([]);
      }
    };

    fetchSectionEvents();
  }, [selectedSection]);

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
    
        const encodedSection = selectedSection 
          ? encodeURIComponent(selectedSection)
          : 'all';
        
        const sectionApiPath = `/registrations/parish/${selectedParish}/sections/${encodedSection}`;
        
        const sectionResponse = await axiosInstance.get(sectionApiPath);
        const sectionDetails = sectionResponse.data.data.sectionDetails;
        setSectionDetails(sectionDetails);
    
        const registrationsResponse = await axiosInstance.get(`/registrations/parish/${selectedParish}`);
        const registrations = registrationsResponse.data.data.registrations || [];
    
        const processedParticipants = processRegistrations(registrations);
        setParticipants(processedParticipants);

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

  const extractEventColumns = (registrations) => {
    const eventColumnMap = registrations.reduce((acc, reg) => {
      if (reg.event && reg.event.eventName) {
        acc[reg.event.eventName] = reg.event;
      }
      return acc;
    }, {});

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
        const sectionData = response.data[0];
        
        if (sectionData && sectionData.managers && sectionData.managers.length > 0) {
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

  const getCurrentSectionText = () => {
    if (!selectedSection) return 'സെന്റ് തോമസ്  വിഭാഗം';
    return SECTION_CONFIG[selectedSection]?.section || 'സെന്റ് തോമസ്  വിഭാഗം';
  };

  // Use allSectionEvents when section is selected, fallback to eventColumns
  const displayEventColumns = allSectionEvents.length > 0 ? allSectionEvents : eventColumns;

  return (
    <ThemeProvider theme={theme}>
      <style>{printStyles}</style>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Grid container spacing={2} sx={{ mb: 3 }} className="no-print">
            {!getParishId() && (
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
)}
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
                disabled={!selectedParish || !selectedSection}
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
            <Paper elevation={3} sx={{ p: 3 }} className="print-area">
              {/* Header with title and managers side by side */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                {/* Left spacer */}
                <Box sx={{ flex: 1 }} />
                
                {/* Center - Title */}
                <Box textAlign="center" sx={{ flex: 2 }}>
                  <Typography variant="h4" fontWeight="bold">
                    ഫൊറോന കലോത്സവം {currentYear}
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      display: 'inline-block',
                      border: '2px solid black',
                      borderRadius: '20px',
                      px: 3,
                      py: 0.5,
                      mt: 1,
                      fontWeight: 'bold'
                    }}
                  >
                    {getCurrentSectionText()}
                  </Typography>
                </Box>

                {/* Right - Team Managers */}
                <Box sx={{ flex: 1, textAlign: 'left' }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>
                    TEAM MANAGERS
                  </Typography>
                  <Box sx={{ textAlign: 'left', display: 'inline-block' }}>
                    {managers.length > 0 
                      ? managers.map((manager, index) => (
                          <Typography key={index} variant="body2" sx={{ lineHeight: 1.6 }}>
                            {index + 1}) {manager.name}<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;{manager.contactNumber}
                          </Typography>
                        ))
                      : <Typography variant="body2">-</Typography>
                    }
                  </Box>
                </Box>
              </Box>
              
              {/* Parish and Forane Details */}
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" sx={{ flex: 1, textAlign: 'left' }}>
                  PARISH: {parishDetails?.name || '_______________'}
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, textAlign: 'center' }}>
                  FORANE: PONKUNNAM
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}>
                
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
                      <TableCell sx={{ width: '30px', padding: '0' }}>
                        <div style={{ 
                          writingMode: 'vertical-rl', 
                          textOrientation: 'mixed',
                          transform: 'rotate(180deg)',
                          whiteSpace: 'nowrap',
                          padding: '4px',
                          height: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          Sl No.
                        </div>
                      </TableCell>
                      <TableCell sx={{ width: '30px', padding: '0' }}>
                        <div style={{ 
                          writingMode: 'vertical-rl', 
                          textOrientation: 'mixed',
                          transform: 'rotate(180deg)',
                          whiteSpace: 'nowrap',
                          padding: '4px',
                          height: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '60px'
                        }}>
                          Chess No.
                        </div>
                      </TableCell>
                      <TableCell>Name & house Name in Sunday School Register</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Gender (M/F)</TableCell>
                      <TableCell>Dob</TableCell>
                      {displayEventColumns.map((event, index) => (
                        <TableCell key={event.id} sx={{ width: '50px', padding: '0' }}>
                          <div className="vertical-text" style={{ 
                            writingMode: 'vertical-rl', 
                            textOrientation: 'mixed',
                            transform: 'rotate(180deg)',
                            whiteSpace: 'nowrap',
                            padding: '4px',
                            height: '100px',
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
                    {Array.from({ length: Math.max(14, participants.length) }).map((_, index) => {
                      const participant = participants[index];
                      return (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell></TableCell>
                          <TableCell>{participant?.name || ''}</TableCell>
                          <TableCell>{participant?.standard || ''}</TableCell>
                          <TableCell>{participant?.gender || ''}</TableCell>
                          <TableCell>
                            {participant 
                              ? new Date(participant.dob).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })
                              : ''
                            }
                          </TableCell>
                          {displayEventColumns.map((event) => (
                            <TableCell key={event.id}>
                              {participant?.events?.some(e => e.eventName === event.name) ? 'X' : ''}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

               <Box className="footer-section">
                <Box mt={1}>
                  {/* <Typography variant="body2">
                    <strong>നിബന്ധനകൾ:</strong>
                    <ol style={{ paddingLeft: '20px', margin: '4px 0' }}>
                      <li>പ്രവേശന ഫോം മാതൃകാപരമായി തികച്ചും യഥാർഥ വിവരങ്ങൾ പൂരിപ്പിക്കണം.</li>
                      <li>മാതാപിതാക്കൾ അറിയിക്കുന്ന വിവരങ്ങൾക്ക് കൈക്കൊപ്പം ചേർക്കണം.</li>
                      <li>കൂടുതൽ വിവരങ്ങൾക്ക് ENGLISH CAPITAL ഉപയോഗിക്കണം.</li>
                    </ol>
                  </Typography> */}
                </Box>

                <Box mt={1} display="flex" justifyContent="space-between">
                  <Typography variant="body2">തിയ്യതി: _______________</Typography>
                  <Typography variant="body2">സ്റ്റാഫ് സെക്രട്ടറി: _______________</Typography>
                  <Typography variant="body2">ഡയറക്ടർ: _______________</Typography>
                </Box>
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
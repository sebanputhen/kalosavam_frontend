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
  TableContainer,
  Button,
  CircularProgress,
  Chip,
  TextField
} from '@mui/material';
import axiosInstance from "../axiosConfig";

const printStyles = `
  @media print {
    @page { size: A4 landscape; margin: 8mm; }
    .no-print { display: none !important; }
    nav, header, footer, aside,
    .MuiDrawer-root, .MuiAppBar-root,
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
    .print-area * { visibility: visible !important; }
    .print-area table { font-size: 9px !important; }
    .print-area td, .print-area th { padding: 3px !important; }
  }
`;

const SECTION_CONFIG = {
  'Dominic Savio': 'Classes IV-VI',
  'Alphonsa': 'Classes VII-IX',
  'Saint Thomas': 'Classes X-XII'
};

const ParticipantList = () => {
  const [parishes, setParishes] = useState([]);
  const [selectedParish, setSelectedParish] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parishDetails, setParishDetails] = useState(null);
const [allEvents, setAllEvents] = useState([]);
  // Fetch parishes (filtered by forane)
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
  const fetchAllEvents = async () => {
    try {
      const response = await axiosInstance.get('/events');
      const evts = response.data?.data?.events || response.data || [];
      setAllEvents(evts.map(e => ({
        _id: e._id,
        eventName: e.eventName,
        eventType: e.eventType,
        section: e.section,
        gender: e.gender
      })).sort((a, b) => a.eventName.localeCompare(b.eventName)));
    } catch (error) {
      console.error("Error fetching all events:", error);
    }
  };
  fetchAllEvents();
}, []);
  // Fetch registrations when parish/section/event/gender changes
  useEffect(() => {
    const fetchRegistrations = async () => {
      setIsLoading(true);
      try {
        let allRegs = [];

        if (selectedParish) {
          // Fetch for selected parish
          const response = await axiosInstance.get(`/registrations/parish/${selectedParish}`);
          allRegs = response.data?.data?.registrations || [];
        } else if (selectedSection || selectedEvent || selectedGender) {
          // Fetch for ALL parishes in forane
          const promises = parishes.map(p =>
            axiosInstance.get(`/registrations/parish/${p._id}`).catch(() => ({ data: { data: { registrations: [] } } }))
          );
          const responses = await Promise.all(promises);
          responses.forEach(res => {
            allRegs.push(...(res.data?.data?.registrations || []));
          });
        } else {
          setRegistrations([]);
          setEvents([]);
          setIsLoading(false);
          return;
        }

        setRegistrations(allRegs);

        // Extract unique events
        const uniqueEvents = {};
        allRegs.forEach(reg => {
          if (reg.event && reg.event._id) {
            uniqueEvents[reg.event._id] = {
              _id: reg.event._id,
              eventName: reg.event.eventName,
              eventType: reg.event.eventType,
              section: reg.event.section,
              gender: reg.event.gender
            };
          }
        });
        setEvents(Object.values(uniqueEvents).sort((a, b) => a.eventName.localeCompare(b.eventName)));
      } catch (error) {
        console.error("Error fetching registrations:", error);
        setRegistrations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegistrations();
  }, [selectedParish, selectedSection, selectedEvent, selectedGender, parishes]);

  // Fetch parish details
  useEffect(() => {
    const fetchParishDetails = async () => {
      if (!selectedParish) { setParishDetails(null); return; }
      try {
        const response = await axiosInstance.get(`/parish/${selectedParish}`);
        setParishDetails(response.data);
      } catch (error) {
        console.error("Error fetching parish details:", error);
      }
    };
    fetchParishDetails();
  }, [selectedParish]);

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    if (selectedSection && reg.section !== selectedSection) return false;
    if (selectedEvent && reg.event?._id !== selectedEvent) return false;
    if (selectedGender && reg.gender !== selectedGender) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!reg.name?.toLowerCase().includes(q) &&
        !reg.registrationNumber?.toLowerCase().includes(q) &&
        !reg.groupRegistrationNumber?.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Group participants (unique by name+standard+gender+dob)
  const getUniqueParticipants = () => {
    const grouped = {};
    filteredRegistrations.forEach(reg => {
      const key = `${reg.name}|${reg.standard}|${reg.gender}|${reg.dob}|${reg.parish?._id || reg.parish}`;
      if (!grouped[key]) {
        grouped[key] = {
          name: reg.name,
          standard: reg.standard,
          gender: reg.gender,
          dob: reg.dob,
          section: reg.section,
          parish: reg.parish?.name || '',
          events: [],
          registrationNumbers: []
        };
      }
      grouped[key].events.push({
        name: reg.event?.eventName,
        type: reg.event?.eventType
      });
      if (reg.registrationNumber) grouped[key].registrationNumbers.push(reg.registrationNumber);
      if (reg.groupRegistrationNumber) grouped[key].registrationNumbers.push(reg.groupRegistrationNumber);
    });
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  };

  const uniqueParticipants = getUniqueParticipants();

  // Filtered events for dropdown based on selected section
 const filteredEvents = selectedSection
  ? allEvents.filter(e => e.section === selectedSection)
  : allEvents;

  // Stats
  const stats = {
    total: filteredRegistrations.length,
    unique: uniqueParticipants.length,
    boys: uniqueParticipants.filter(p => p.gender === 'M').length,
    girls: uniqueParticipants.filter(p => p.gender === 'F').length,
  };

  return (
    <>
      <style>{printStyles}</style>
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom className="no-print">
            Participant List
          </Typography>

          {/* Filters */}
          <Paper elevation={2} sx={{ p: 2, mb: 3 }} className="no-print">
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Parish</InputLabel>
                  <Select
                    value={selectedParish}
                    label="Parish"
                    onChange={(e) => {
                      setSelectedParish(e.target.value);
                      setSelectedEvent('');
                      setSearchQuery('');
                    }}
                  >
                    <MenuItem value="">All Parishes</MenuItem>
                    {parishes.map((p) => (
                      <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={selectedSection}
                    label="Section"
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      setSelectedEvent('');
                    }}
                  >
                    <MenuItem value="">All Sections</MenuItem>
                    {Object.keys(SECTION_CONFIG).map((sec) => (
                      <MenuItem key={sec} value={sec}>{sec} ({SECTION_CONFIG[sec]})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Event</InputLabel>
                  <Select
                    value={selectedEvent}
                    label="Event"
                    onChange={(e) => setSelectedEvent(e.target.value)}
                  >
                    <MenuItem value="">All Events</MenuItem>
                    {filteredEvents.map((ev) => (
                      <MenuItem key={ev._id} value={ev._id}>
                        {ev.eventName} ({ev.eventType})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={selectedGender}
                    label="Gender"
                    onChange={(e) => setSelectedGender(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="M">Boys</MenuItem>
                    <MenuItem value="F">Girls</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Name/Reg No"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Grid>
            </Grid>

            {/* Stats */}
            {(selectedParish || selectedSection || selectedEvent || selectedGender) && !isLoading && (
              <Box display="flex" gap={2} mt={2} flexWrap="wrap">
                <Chip label={`Unique Participants: ${stats.unique}`} color="primary" variant="outlined" />
                <Chip label={`Total Registrations: ${stats.total}`} color="secondary" variant="outlined" />
                <Chip label={`Boys: ${stats.boys}`} color="info" variant="outlined" />
                <Chip label={`Girls: ${stats.girls}`} color="success" variant="outlined" />
              </Box>
            )}

            {(selectedParish || selectedSection || selectedEvent || selectedGender) && (
              <Box mt={2} textAlign="right">
                <Button variant="contained" onClick={() => window.print()} disabled={uniqueParticipants.length === 0}>
                  Print List
                </Button>
              </Box>
            )}
          </Paper>

          {/* Table */}
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (selectedParish || selectedSection || selectedEvent || selectedGender) ? (
            <Paper elevation={3} sx={{ p: 2 }} className="print-area">
              {/* Print Header */}
              <Box textAlign="center" mb={2} sx={{ display: 'none', '@media print': { display: 'block' } }}>
                <Typography variant="h5" fontWeight="bold">ഫൊറോന കലോത്സവം 2026</Typography>
                <Typography variant="subtitle1">
                  {selectedParish ? `Parish: ${parishDetails?.name || ''}` : 'All Parishes'}
                  {selectedSection && ` | Section: ${selectedSection}`}
                  {selectedEvent && ` | Event: ${events.find(e => e._id === selectedEvent)?.eventName || ''}`}
                </Typography>
                <Typography variant="body2">
                  Total Participants: {stats.unique} | Boys: {stats.boys} | Girls: {stats.girls}
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small" sx={{
                  border: '1px solid #ddd',
                  '& th, & td': { border: '1px solid #ddd', padding: '6px 8px' }
                }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ width: 40 }}>Sl</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Parish</TableCell>
                      <TableCell sx={{ width: 60 }}>Class</TableCell>
                      <TableCell sx={{ width: 50 }}>Gender</TableCell>
                      <TableCell sx={{ width: 90 }}>DOB</TableCell>
                      <TableCell>Section</TableCell>
                      <TableCell>Events</TableCell>
                      <TableCell>Reg No</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uniqueParticipants.length > 0 ? uniqueParticipants.map((participant, index) => (
                      <TableRow key={index} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{participant.name}</TableCell>
                        <TableCell>{participant.parish}</TableCell>
                        <TableCell>{participant.standard}</TableCell>
                        <TableCell>{participant.gender === 'M' ? 'Boy' : 'Girl'}</TableCell>
                        <TableCell>
                          {new Date(participant.dob).toLocaleDateString('en-GB', {
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>{participant.section}</TableCell>
                        <TableCell>
                          {participant.events.map((ev, i) => (
                            <Chip
                              key={i}
                              label={ev.name}
                              size="small"
                              color={ev.type === 'group' ? 'secondary' : 'default'}
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5, fontSize: '11px', height: 22 }}
                            />
                          ))}
                        </TableCell>
                        <TableCell sx={{ fontSize: '11px' }}>
                          {[...new Set(participant.registrationNumbers)].join(', ')}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <Typography variant="body2" color="textSecondary" py={2}>
                            No participants found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="textSecondary">
                Select a parish, section, event or gender to view participant list
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
};

export default ParticipantList;
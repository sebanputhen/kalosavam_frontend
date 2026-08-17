import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, Grid, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer, Button,
  CircularProgress, Chip, TextField, Card, CardContent
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { Printer, Users, UserCheck, Search } from 'lucide-react';
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

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', light: '#3B82F6', dark: '#1E40AF' },
    secondary: { main: '#10B981', light: '#34D399', dark: '#047857' },
    info: { main: '#6366F1', light: '#818CF8', dark: '#4F46E5' },
    warning: { main: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
    error: { main: '#EF4444', light: '#F87171', dark: '#DC2626' },
    background: { default: '#F0F4F8', paper: '#FFFFFF' }
  },
  typography: { fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif' },
  shape: { borderRadius: 12 }
});

const DashboardContainer = styled(Box)({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
  paddingTop: 24,
  paddingBottom: 40,
});

const StyledCard = styled(Card)({
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.06)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.06)',
  }
});

const StyledCardContent = styled(CardContent)({ padding: '24px !important' });

const StatWrapper = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const StatValue = styled(Typography)({
  fontSize: '2rem',
  fontWeight: 700,
  lineHeight: 1.2,
  marginTop: 4,
  color: '#1a202c',
});

const IconBox = styled(Box)(({ color }) => ({
  width: 52,
  height: 52,
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${color}22, ${color}11)`,
  border: `1px solid ${color}33`,
  color: color,
}));

const ChartCard = styled(Card)({
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.06)',
  padding: 24,
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 32,
  flexWrap: 'wrap',
  gap: 16,
});

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

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [parishRes, eventsRes] = await Promise.allSettled([
          axiosInstance.get('/parish'),
          axiosInstance.get('/events')
        ]);
        if (parishRes.status === 'fulfilled') {
          const filtered = (parishRes.value.data || []).filter(
            p => p.forane === '673799a3cb9b4aa181e53fa2' || p.forane?._id === '673799a3cb9b4aa181e53fa2'
          );
          setParishes(filtered);
        }
        if (eventsRes.status === 'fulfilled') {
          const evts = eventsRes.value.data?.data?.events || eventsRes.value.data || [];
          setAllEvents(evts.map(e => ({
            _id: e._id, eventName: e.eventName, eventType: e.eventType,
            section: e.section, gender: e.gender
          })).sort((a, b) => a.eventName.localeCompare(b.eventName)));
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    const fetchRegistrations = async () => {
      setIsLoading(true);
      try {
        let allRegs = [];
        if (selectedParish) {
          const response = await axiosInstance.get(`/registrations/parish/${selectedParish}`);
          allRegs = response.data?.data?.registrations || [];
        } else if (selectedSection || selectedEvent || selectedGender) {
          const results = await Promise.allSettled(
            parishes.map(p => axiosInstance.get(`/registrations/parish/${p._id}`))
          );
          results.forEach(r => {
            if (r.status === 'fulfilled') allRegs.push(...(r.value.data?.data?.registrations || []));
          });
        } else {
          setRegistrations([]); setEvents([]); setIsLoading(false); return;
        }
        setRegistrations(allRegs);
        const uniqueEvents = {};
        allRegs.forEach(reg => {
          if (reg.event?._id) {
            uniqueEvents[reg.event._id] = {
              _id: reg.event._id, eventName: reg.event.eventName,
              eventType: reg.event.eventType, section: reg.event.section, gender: reg.event.gender
            };
          }
        });
        setEvents(Object.values(uniqueEvents).sort((a, b) => a.eventName.localeCompare(b.eventName)));
      } catch (error) {
        console.error('Error fetching registrations:', error);
        setRegistrations([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRegistrations();
  }, [selectedParish, selectedSection, selectedEvent, selectedGender, parishes]);

  useEffect(() => {
    if (!selectedParish) { setParishDetails(null); return; }
    axiosInstance.get(`/parish/${selectedParish}`)
      .then(res => setParishDetails(res.data))
      .catch(err => console.error('Error fetching parish details:', err));
  }, [selectedParish]);

  const filteredRegistrations = useMemo(() =>
    registrations.filter(reg => {
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
    }).sort((a, b) => a.name.localeCompare(b.name)),
    [registrations, selectedSection, selectedEvent, selectedGender, searchQuery]
  );

  const uniqueParticipants = useMemo(() => {
    const grouped = {};
    filteredRegistrations.forEach(reg => {
      const key = `${reg.name}|${reg.standard}|${reg.gender}|${reg.dob}|${reg.parish?._id || reg.parish}`;
      if (!grouped[key]) {
        grouped[key] = {
          name: reg.name, standard: reg.standard, gender: reg.gender,
          dob: reg.dob, section: reg.section, parish: reg.parish?.name || '',
          events: [], registrationNumbers: []
        };
      }
      grouped[key].events.push({ name: reg.event?.eventName, type: reg.event?.eventType });
      if (reg.registrationNumber) grouped[key].registrationNumbers.push(reg.registrationNumber);
      if (reg.groupRegistrationNumber) grouped[key].registrationNumbers.push(reg.groupRegistrationNumber);
    });
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredRegistrations]);

  const filteredEvents = selectedSection
    ? allEvents.filter(e => e.section === selectedSection)
    : allEvents;

  const stats = useMemo(() => ({
    total: filteredRegistrations.length,
    unique: uniqueParticipants.length,
    boys: uniqueParticipants.filter(p => p.gender === 'M').length,
    girls: uniqueParticipants.filter(p => p.gender === 'F').length,
  }), [filteredRegistrations, uniqueParticipants]);

  const hasFilter = selectedParish || selectedSection || selectedEvent || selectedGender;

  const statisticsCards = [
    { title: 'Unique Participants', value: stats.unique, color: '#2563EB', icon: <UserCheck size={24} /> },
    { title: 'Total Registrations', value: stats.total, color: '#10B981', icon: <Users size={24} /> },
    { title: 'Boys', value: stats.boys, color: '#6366F1', icon: <Users size={24} /> },
    { title: 'Girls', value: stats.girls, color: '#F59E0B', icon: <Users size={24} /> },
  ];

  return (
    <>
      <style>{printStyles}</style>
      <ThemeProvider theme={theme}>
        <DashboardContainer>
          <Container maxWidth="xl">
            <Grid container spacing={3}>
              {/* Header */}
              <Grid item xs={12} className="no-print">
                <PageHeader>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c', mb: 0.5 }}>
                      Participant List
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      View and print participant lists for Forane Kalolsavam
                    </Typography>
                  </Box>
                  {hasFilter && uniqueParticipants.length > 0 && (
                    <Button variant="contained" startIcon={<Printer size={18} />}
                      onClick={() => window.print()}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                      Print List
                    </Button>
                  )}
                </PageHeader>
              </Grid>

              {/* Filters */}
              <Grid item xs={12} className="no-print">
                <ChartCard>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c', mb: 2.5 }}>
                    Filters
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Parish</InputLabel>
                        <Select value={selectedParish} label="Parish"
                          onChange={(e) => { setSelectedParish(e.target.value); setSelectedEvent(''); setSearchQuery(''); }}>
                          <MenuItem value="">All Parishes</MenuItem>
                          {parishes.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Section</InputLabel>
                        <Select value={selectedSection} label="Section"
                          onChange={(e) => { setSelectedSection(e.target.value); setSelectedEvent(''); }}>
                          <MenuItem value="">All Sections</MenuItem>
                          {Object.keys(SECTION_CONFIG).map(sec => (
                            <MenuItem key={sec} value={sec}>{sec} ({SECTION_CONFIG[sec]})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Event</InputLabel>
                        <Select value={selectedEvent} label="Event"
                          onChange={(e) => setSelectedEvent(e.target.value)}>
                          <MenuItem value="">All Events</MenuItem>
                          {filteredEvents.map(ev => (
                            <MenuItem key={ev._id} value={ev._id}>{ev.eventName} ({ev.eventType})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Gender</InputLabel>
                        <Select value={selectedGender} label="Gender"
                          onChange={(e) => setSelectedGender(e.target.value)}>
                          <MenuItem value="">All</MenuItem>
                          <MenuItem value="M">Boys</MenuItem>
                          <MenuItem value="F">Girls</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField fullWidth size="small" label="Search Name/Reg No"
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </Grid>
                  </Grid>
                </ChartCard>
              </Grid>

              {/* Stat Cards */}
              {hasFilter && !isLoading && statisticsCards.map((stat, i) => (
                <Grid item xs={6} sm={3} key={i} className="no-print">
                  <StyledCard>
                    <StyledCardContent>
                      <StatWrapper>
                        <Box>
                          <Typography variant="subtitle1" sx={{
                            color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.1em'
                          }}>{stat.title}</Typography>
                          <StatValue sx={{ fontSize: '1.75rem' }}>{stat.value}</StatValue>
                        </Box>
                        <IconBox color={stat.color} sx={{ width: 44, height: 44, borderRadius: 12 }}>
                          {stat.icon}
                        </IconBox>
                      </StatWrapper>
                    </StyledCardContent>
                  </StyledCard>
                </Grid>
              ))}

              {/* Table */}
              {isLoading ? (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                </Grid>
              ) : hasFilter ? (
                <Grid item xs={12}>
                  <ChartCard className="print-area">
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

                    <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                      <Table size="small" sx={{
                        '& th, & td': { border: '1px solid rgba(0,0,0,0.08)', padding: '6px 8px' }
                      }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <TableCell sx={{ fontWeight: 600, width: 40 }}>Sl</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Parish</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 60 }}>Class</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 50 }}>Gender</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 90 }}>DOB</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Section</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Events</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Reg No</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {uniqueParticipants.length > 0 ? uniqueParticipants.map((participant, index) => (
                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>{participant.name}</TableCell>
                              <TableCell>
                                <Chip size="small" label={participant.parish} sx={{
                                  bgcolor: '#2563EB15', color: '#2563EB',
                                  border: '1px solid #2563EB30', fontWeight: 600, fontSize: '0.7rem'
                                }} />
                              </TableCell>
                              <TableCell>{participant.standard}</TableCell>
                              <TableCell>{participant.gender === 'M' ? 'Boy' : 'Girl'}</TableCell>
                              <TableCell>
                                {new Date(participant.dob).toLocaleDateString('en-GB', {
                                  day: '2-digit', month: '2-digit', year: 'numeric'
                                })}
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const sColor = participant.section === 'Dominic Savio' ? '#2563EB'
                                    : participant.section === 'Alphonsa' ? '#10B981' : '#6366F1';
                                  return (
                                    <Chip size="small" label={participant.section} sx={{
                                      bgcolor: `${sColor}15`, color: sColor,
                                      border: `1px solid ${sColor}30`, fontWeight: 600, fontSize: '0.7rem'
                                    }} />
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {participant.events.map((ev, i) => (
                                    <Chip key={i} label={ev.name} size="small"
                                      variant="outlined" sx={{
                                        fontSize: '0.65rem', height: 22,
                                        borderColor: ev.type === 'group' ? '#10B981' : 'rgba(0,0,0,0.15)',
                                        color: ev.type === 'group' ? '#10B981' : 'inherit',
                                      }} />
                                  ))}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.7rem' }}>
                                {[...new Set(participant.registrationNumbers)].join(', ')}
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                                <Search size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                                <Typography color="textSecondary">No participants found</Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </ChartCard>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <ChartCard>
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                      <Users size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                      <Typography color="textSecondary" sx={{ fontSize: '1.05rem' }}>
                        Select a parish, section, event or gender to view participant list
                      </Typography>
                    </Box>
                  </ChartCard>
                </Grid>
              )}
            </Grid>
          </Container>
        </DashboardContainer>
      </ThemeProvider>
    </>
  );
};

export default ParticipantList;
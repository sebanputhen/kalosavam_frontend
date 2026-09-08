import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Grid, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer, Button,
  CircularProgress, Chip, Card, CardContent
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { Printer, Layers, MapPin, Users, Calendar } from 'lucide-react';
import axiosInstance from "../axiosConfig";

const printStyles = `
  @media print {
    @page { size: A4 portrait; margin: 10mm; }
    body { zoom: 0.85; }
    .no-print { display: none !important; }
    nav, header, footer, aside,
    .MuiDrawer-root, .MuiAppBar-root,
    [class*="Sidebar"], [class*="Navbar"], [class*="AppBar"],
    [class*="drawer"], [class*="header"] {
      display: none !important;
    }
    .print-area {
      position: fixed !important;
      left: 0 !important; top: 0 !important;
      width: 100% !important; margin: 0 !important;
      padding: 10px !important; box-shadow: none !important;
    }
    .print-area * { visibility: visible !important; }
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
  paddingTop: 24, paddingBottom: 40,
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

const StatWrapper = styled(Box)({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' });

const StatValue = styled(Typography)({
  fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, marginTop: 4, color: '#1a202c',
});

const IconBox = styled(Box)(({ color }) => ({
  width: 52, height: 52, borderRadius: 14,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: `linear-gradient(135deg, ${color}22, ${color}11)`,
  border: `1px solid ${color}33`, color: color,
}));

const ChartCard = styled(Card)({
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.06)', padding: 24,
});

const PageHeader = styled(Box)({
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 32, flexWrap: 'wrap', gap: 16,
});

const SECTION_COLORS = {
  'Dominic Savio': '#2563EB', 'Alphonsa': '#10B981', 'Saint Thomas': '#6366F1',
};

const ForaneEventRegistration = () => {
  const [foranes, setForanes] = useState([]);
  const [selectedForane, setSelectedForane] = useState('');
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState({});
  const [loadingForanes, setLoadingForanes] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingForanes(true);
      try {
        const res = await axiosInstance.get('/forane');
        setForanes(res.data || []);
      } catch (err) { console.error('Error fetching foranes:', err); }
      finally { setLoadingForanes(false); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedForane) return;
    (async () => {
      setLoadingVenues(true);
      try {
        const res = await axiosInstance.get(`/venues/parish/${selectedForane}`);
        setVenues(res.data.data || []);
        setSelectedVenue(''); setEvents([]); setRegistrations({});
      } catch (err) { console.error('Error fetching venues:', err); setVenues([]); }
      finally { setLoadingVenues(false); }
    })();
  }, [selectedForane]);

  useEffect(() => {
    if (!selectedForane || !selectedVenue) return;
    (async () => {
      setLoadingEvents(true);
      try {
        const eventsRes = await axiosInstance.get(`/allocations/forane/${selectedForane}/venue/${selectedVenue}`);
        const allocatedEvents = eventsRes.data?.data || [];

        const detailedEvents = allocatedEvents.map(a => ({
          _id: a._id, eventName: a.eventName, section: a.section,
          gender: a.gender, eventType: a.eventType
        }));

        // Parallel fetch all registrations
        const regResults = await Promise.allSettled(
          allocatedEvents.map(a =>
            axiosInstance.get(`/registrations/forane/${selectedForane}/event/${a._id}`)
              .then(res => ({ eventId: a._id, regs: res.data?.data?.registrations || [] }))
          )
        );

        const regMap = {};
        regResults.forEach(r => {
          if (r.status === 'fulfilled') regMap[r.value.eventId] = r.value.regs;
        });

        setEvents(detailedEvents);
        setRegistrations(regMap);
      } catch (err) {
        console.error('Error fetching events:', err);
        setEvents([]); setRegistrations({});
      } finally { setLoadingEvents(false); }
    })();
  }, [selectedForane, selectedVenue]);

  const extractRegNumbers = (regs, isGroup) => {
    return [...new Set(regs.map(r => {
      if (isGroup && r.groupRegistrationNumber) return r.groupRegistrationNumber.split('-').pop();
      if (!isGroup && r.registrationNumber) return r.registrationNumber.split('-').pop();
      return '';
    }))].filter(n => n !== '').sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  };

  const foraneName = foranes.find(f => f._id === selectedForane)?.name || '';
  const venueName = venues.find(v => v._id === selectedVenue)?.name || '';
  const totalRegs = Object.values(registrations).reduce((t, r) => t + r.length, 0);

  const statisticsCards = [
    { title: 'Total Events', value: events.length, color: '#2563EB', icon: <Layers size={24} /> },
    { title: 'Total Registrations', value: totalRegs, color: '#10B981', icon: <Users size={24} /> },
    { title: 'Venues', value: venues.length, color: '#6366F1', icon: <MapPin size={24} /> },
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
                      Event Registrations by Venue
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      View and print participant registration numbers per venue
                    </Typography>
                  </Box>
                  {selectedVenue && events.length > 0 && (
                    <Button variant="contained" startIcon={<Printer size={18} />}
                      onClick={() => window.print()} disabled={loadingEvents}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                      Print
                    </Button>
                  )}
                </PageHeader>
              </Grid>

              {/* Selectors */}
              <Grid item xs={12} sm={6} md={4} className="no-print">
                <StyledCard>
                  <StyledCardContent>
                    <FormControl fullWidth>
                      <InputLabel>Select Forane</InputLabel>
                      <Select value={selectedForane} label="Select Forane"
                        disabled={loadingForanes}
                        onChange={(e) => {
                          setSelectedForane(e.target.value); setSelectedVenue('');
                          setEvents([]); setRegistrations({});
                        }}>
                        {foranes.map(f => <MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </StyledCardContent>
                </StyledCard>
              </Grid>

              {selectedForane && (
                <Grid item xs={12} sm={6} md={4} className="no-print">
                  <StyledCard>
                    <StyledCardContent>
                      <FormControl fullWidth>
                        <InputLabel>Select Venue</InputLabel>
                        <Select value={selectedVenue} label="Select Venue"
                          disabled={loadingVenues}
                          onChange={(e) => setSelectedVenue(e.target.value)}>
                          {venues.map(v => <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </StyledCardContent>
                  </StyledCard>
                </Grid>
              )}

              {/* Stat Cards */}
              {selectedVenue && !loadingEvents && statisticsCards.map((stat, i) => (
                <Grid item xs={12} sm={6} md={4} key={i} className="no-print">
                  <StyledCard>
                    <StyledCardContent>
                      <StatWrapper>
                        <Box>
                          <Typography variant="subtitle1" sx={{
                            color: 'text.secondary', fontSize: '0.875rem', fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.1em'
                          }}>{stat.title}</Typography>
                          <StatValue>{stat.value}</StatValue>
                        </Box>
                        <IconBox color={stat.color}>{stat.icon}</IconBox>
                      </StatWrapper>
                    </StyledCardContent>
                  </StyledCard>
                </Grid>
              ))}

              {/* Content */}
              {loadingEvents ? (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                </Grid>
              ) : selectedVenue ? (
                <Grid item xs={12}>
                  <ChartCard className="print-area">
                    {/* Print Header */}
                    <Box textAlign="center" mb={3} sx={{ '@media print': { display: 'block' } }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a202c' }}>
                        SUNDAY SCHOOL BIBLE KALOLSAVAM - 2026
                      </Typography>
                      <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                        {foraneName} Forane — Venue: {venueName}
                      </Typography>
                    </Box>

                    {events.length > 0 ? (
                      <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                              <TableCell sx={{ fontWeight: 600 }}>No.</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Event Name</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Section</TableCell>
                              {/* <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell> */}
                              <TableCell sx={{ fontWeight: 600 }}>Registration Numbers</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {events.map((event, idx) => {
                              const eventRegs = registrations[event._id] || [];
                              const regNumbers = extractRegNumbers(eventRegs, event.eventType === 'group');
                              const sColor = SECTION_COLORS[event.section] || '#6366F1';

                              return (
                                <TableRow key={event._id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                  <TableCell>{idx + 1}</TableCell>
                                  <TableCell sx={{ fontWeight: 500,height: 50, fontSize: '1.0rem', }}>{event.eventName}</TableCell>
                                  <TableCell>
                                    <Chip size="small" label={event.section || 'N/A'} sx={{
                                      bgcolor: `${sColor}15`, color: sColor,
                                      border: `1px solid ${sColor}30`, fontWeight: 600,  height: 50, fontSize: '1.0rem',
                                    }} />
                                  </TableCell>
                                  {/* <TableCell>
                                    <Chip size="small" label={event.eventType === 'single' ? 'Individual' : 'Group'}
                                      variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                  </TableCell>
                                  <TableCell>
                                    <Chip size="small"
                                      label={event.gender === 'male' ? 'Boys' : event.gender === 'female' ? 'Girls' : 'Mixed'}
                                      variant="outlined" sx={{ fontSize: '0.7rem' }}
                                      color={event.gender === 'male' ? 'primary' : event.gender === 'female' ? 'error' : 'success'} />
                                  </TableCell> */}
                                  <TableCell>
                                    {regNumbers.length > 0 ? (
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {regNumbers.map((num, i) => (
                                         <Chip key={i} size="small" label={num} sx={{
                                        height: 50, fontSize: '2.5rem', fontWeight: 700,
                                        bgcolor: 'rgba(37,99,235,0.06)',
                                        border: '1px solid rgba(37,99,235,0.15)',
                                        color: '#2563EB',
                                      }} />
                                        ))}
                                      </Box>
                                    ) : (
                                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                                        {event.eventType === 'group' ? 'No group registrations' : 'No individual registrations'}
                                      </Typography>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Calendar size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                        <Typography color="textSecondary">No events found for this venue</Typography>
                      </Box>
                    )}

                    {/* Print footer */}
                    <Box mt={3} display="flex" justifyContent="space-between"
                      sx={{ display: 'none', '@media print': { display: 'flex' } }}>
                      <Typography variant="body2" color="textSecondary">{foraneName}</Typography>
                      <Typography variant="body2" color="textSecondary">{new Date().toLocaleDateString()}</Typography>
                    </Box>
                  </ChartCard>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <ChartCard>
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                      <MapPin size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                      <Typography color="textSecondary" sx={{ fontSize: '1.05rem' }}>
                        {selectedForane
                          ? 'Select a venue to view event registrations'
                          : 'Select a forane to begin'}
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

export default ForaneEventRegistration;
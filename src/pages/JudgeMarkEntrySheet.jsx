import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Grid, Select, MenuItem, FormControl, InputLabel,
  Button, Table, TableBody, TableHead, TableRow, TableCell, TextField,
  Card, CardContent, CircularProgress
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { Printer, FileText, MapPin, Calendar } from 'lucide-react';
import axiosInstance from "../axiosConfig";

const printStyles = `
  @media print {
    @page { size: A4 portrait; margin: 10mm; }
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
      border: none !important;
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

const ChartCard = styled(Card)({
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.06)', padding: 24,
});

const PageHeader = styled(Box)({
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 32, flexWrap: 'wrap', gap: 16,
});

const JudgeMarkEntrySheet = () => {
  const [foranes, setForanes] = useState([]);
  const [selectedForane, setSelectedForane] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get('/forane');
        setForanes(res.data || []);
      } catch (err) { console.error('Error fetching foranes:', err); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedForane) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(`/venues/parish/${selectedForane}`);
        setVenues(res.data.data || []);
        setSelectedVenue(''); setSelectedEvent(''); setEvents([]);
      } catch (err) { console.error('Error fetching venues:', err); }
      finally { setIsLoading(false); }
    })();
  }, [selectedForane]);

  useEffect(() => {
    if (!selectedForane || !selectedVenue) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(`/allocations/forane/${selectedForane}/venue/${selectedVenue}`);
        setEvents(res.data?.data || []);
        setSelectedEvent('');
      } catch (err) { console.error('Error fetching events:', err); setEvents([]); }
      finally { setIsLoading(false); }
    })();
  }, [selectedForane, selectedVenue]);

  const numberOfEntries = 14;
  const selectedEventData = events.find(e => e._id === selectedEvent);
  const foraneName = foranes.find(f => f._id === selectedForane)?.name || '';
  const venueName = venues.find(v => v._id === selectedVenue)?.name || '';

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
                      Judge Mark Entry Sheet
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Generate and print mark entry sheets for judges
                    </Typography>
                  </Box>
                  {selectedEvent && (
                    <Button variant="contained" startIcon={<Printer size={18} />}
                      onClick={() => window.print()}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                      Print Sheet
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
                        onChange={(e) => setSelectedForane(e.target.value)}>
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
                          disabled={isLoading}
                          onChange={(e) => setSelectedVenue(e.target.value)}>
                          {venues.map(v => <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </StyledCardContent>
                  </StyledCard>
                </Grid>
              )}

              {selectedVenue && (
                <Grid item xs={12} sm={6} md={4} className="no-print">
                  <StyledCard>
                    <StyledCardContent>
                      <FormControl fullWidth>
                        <InputLabel>Select Event</InputLabel>
                        <Select value={selectedEvent} label="Select Event"
                          disabled={isLoading}
                          onChange={(e) => setSelectedEvent(e.target.value)}>
                          {events.length > 0 ? events.map(event => (
                            <MenuItem key={event._id} value={event._id}>
                              {event.eventName} ({event.section}, {event.gender}, {event.eventType})
                            </MenuItem>
                          )) : (
                            <MenuItem disabled>No events available</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </StyledCardContent>
                  </StyledCard>
                </Grid>
              )}

              {/* Loading */}
              {isLoading && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                </Grid>
              )}

              {/* Mark Entry Sheet */}
              {selectedEvent ? (
                <Grid item xs={12}>
                  <ChartCard className="print-area">
                    {/* Sheet Header */}
                    <Box textAlign="center" mb={3}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a202c' }}>
                        BIBLE KALOLSAVAM - 2026
                      </Typography>
                      <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                        {foraneName} FORANE
                      </Typography>
                    </Box>

                    {/* Event Info Bar */}
                    <Box sx={{
                      p: 2, mb: 3, borderRadius: 3,
                      bgcolor: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)',
                      display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        <span style={{ color: '#64748b' }}>Venue:</span> {venueName}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        <span style={{ color: '#64748b' }}>Section:</span> {selectedEventData?.section}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        <span style={{ color: '#64748b' }}>Item:</span> {selectedEventData?.eventName}
                      </Typography>
                    </Box>

                    {/* Table */}
                    <Table sx={{
                      border: '1px solid #1a202c',
                      '& th, & td': { border: '1px solid #1a202c', padding: '8px', textAlign: 'center' }
                    }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
                          <TableCell sx={{ fontWeight: 700, width: 60 }}>Sl. No</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>CH. No</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 100 }}>Mark</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[...Array(numberOfEntries)].map((_, index) => (
                          <TableRow key={index} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.01)' } }}>
                            <TableCell sx={{ fontWeight: 500 }}>{index + 1}</TableCell>
                            <TableCell>
                              <TextField fullWidth variant="standard"
                                InputProps={{ disableUnderline: true }} />
                            </TableCell>
                            <TableCell>
                              <TextField fullWidth variant="standard"
                                InputProps={{ disableUnderline: true }} />
                            </TableCell>
                            <TableCell>
                              <TextField fullWidth type="number" variant="standard"
                                InputProps={{ disableUnderline: true }} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Footer */}
                    <Box mt={3} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">{foraneName}</Typography>
                      <Typography variant="body2" color="textSecondary">{new Date().toLocaleDateString()}</Typography>
                    </Box>

                    <Box mt={4}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                        Name & Signature (Judge)
                      </Typography>
                    </Box>
                  </ChartCard>
                </Grid>
              ) : !isLoading && (
                <Grid item xs={12}>
                  <ChartCard>
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                      <FileText size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                      <Typography color="textSecondary" sx={{ fontSize: '1.05rem' }}>
                        {!selectedForane ? 'Select a forane to begin'
                          : !selectedVenue ? 'Select a venue to continue'
                          : 'Select an event to generate mark entry sheet'}
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

export default JudgeMarkEntrySheet;
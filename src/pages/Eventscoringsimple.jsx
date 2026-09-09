import React, { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, Award, Users, Layers, Trophy } from 'lucide-react';
import {
  Box, Container, Typography, Button, FormControl, InputLabel, Select, MenuItem,
  Grid, CircularProgress, Chip, Alert, TextField, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Card, CardContent
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import axiosInstance from '../axiosConfig';

const theme = createTheme({
  palette: {
    primary: { main: '#2563EB', light: '#3B82F6', dark: '#1E40AF' },
    secondary: { main: '#10B981', light: '#34D399', dark: '#047857' },
    info: { main: '#6366F1', light: '#818CF8', dark: '#4F46E5' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    background: { default: '#F0F4F8', paper: '#FFFFFF' }
  },
  typography: { fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif' },
  shape: { borderRadius: 12 }
});

const DashboardContainer = styled(Box)({ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', paddingTop: 24, paddingBottom: 40 });
const StyledCard = styled(Card)({ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.06)' } });
const StyledCardContent = styled(CardContent)({ padding: '24px !important' });
const StatWrapper = styled(Box)({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
const StatValue = styled(Typography)({ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, marginTop: 4, color: '#1a202c' });
const IconBox = styled(Box)(({ color }) => ({ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${color}22, ${color}11)`, border: `1px solid ${color}33`, color }));
const ChartCard = styled(Card)({ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', padding: 24 });
const PageHeader = styled(Box)({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 });

const SECTION_COLORS = { 'Dominic Savio': '#2563EB', 'Alphonsa': '#10B981', 'Saint Thomas': '#6366F1' };
const FORANE_ID = '673799a3cb9b4aa181e53fa2';

const GRADE_STYLE = {
  A: { bgcolor: '#10B98115', color: '#10B981' },
  B: { bgcolor: '#2563EB15', color: '#2563EB' },
  C: { bgcolor: '#F59E0B15', color: '#D97706' },
};

const EventScoringSimple = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [eventNameFilter, setEventNameFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [eventParticipants, setEventParticipants] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [scoredEvents, setScoredEvents] = useState([]);

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    if (selectedEvent) fetchEventParticipants();
    else setEventParticipants([]);
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const [onRes, offRes, scoredRes] = await Promise.allSettled([
        axiosInstance.get('/events/stage/On Stage'),
        axiosInstance.get('/events/stage/Off Stage'),
        axiosInstance.get(`/event-scoring/forane/${FORANE_ID}`)
      ]);
      setEvents([
        ...(onRes.status === 'fulfilled' ? onRes.value.data.data?.events || [] : []),
        ...(offRes.status === 'fulfilled' ? offRes.value.data.data?.events || [] : [])
      ]);
      if (scoredRes.status === 'fulfilled' && scoredRes.value.data?.success) {
        setScoredEvents(scoredRes.value.data.data.eventScorings.map(s => s.eventId._id || s.eventId));
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load events.', type: 'error' });
    } finally { setIsLoading(false); }
  };

  const fetchEventParticipants = async () => {
    if (!selectedEvent) return;
    try {
      setIsLoading(true);
      const [scoringRes, regRes] = await Promise.allSettled([
        axiosInstance.get(`/event-scoring/forane/${FORANE_ID}/event/${selectedEvent}`),
        axiosInstance.get(`/registrations/forane/${FORANE_ID}/event/${selectedEvent}`)
      ]);

      let existingScoring = null;
      if (scoringRes.status === 'fulfilled') {
        const sd = scoringRes.value.data;
        if (sd?.success && sd.data.eventScoring) {
          existingScoring = sd.data.eventScoring;
          if (existingScoring.maxMarks) setMaxMarks(existingScoring.maxMarks);
        }
      }
      if (regRes.status !== 'fulfilled') throw new Error('Failed to fetch registrations');

      const registrations = regRes.value.data.data.registrations;
      const selectedEventData = events.find(e => e._id === selectedEvent);
      const isGroup = selectedEventData?.eventType === 'group';

      let processed;
      if (isGroup) {
        const pMap = new Map();
        for (const reg of registrations) {
          const parish = reg.parish?.name || 'Unknown';
          if (!pMap.has(parish)) {
            pMap.set(parish, {
              _id: reg._id, name: parish, participantType: 'Group', parish,
              parishId: reg.parish?._id || null,
              registrationNumber: reg.groupRegistrationNumber || '',
              totalMarks: 0, grade: '', position: '', gradePoints: 0, positionPoints: 0, totalPoints: 0
            });
          }
        }
        processed = [...pMap.values()];
      } else {
        processed = registrations.map(reg => ({
          _id: reg._id, name: reg.name, participantType: 'Individual',
          parish: reg.parish?.name || 'Unknown', parishId: reg.parish?._id || null,
          standard: reg.standard, gender: reg.gender,
          registrationNumber: reg.registrationNumber || '',
          totalMarks: 0, grade: '', position: '', gradePoints: 0, positionPoints: 0, totalPoints: 0
        }));
      }

      if (existingScoring?.participants?.length) {
        const sMap = new Map();
        for (const p of existingScoring.participants) {
          sMap.set(p.participantId, p);
          if (isGroup && p.parish) sMap.set(`parish:${p.parish}`, p);
        }
        processed = processed.map(p => {
          const ex = sMap.get(p._id) || (isGroup ? sMap.get(`parish:${p.parish}`) : null);
          return ex ? { ...p, totalMarks: ex.totalMarks || 0, grade: ex.grade || '', position: ex.position || '', gradePoints: ex.gradePoints || 0, positionPoints: ex.positionPoints || 0, totalPoints: ex.totalPoints || 0 } : p;
        });
      }
      setEventParticipants(processed);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load participants.', type: 'error' });
    } finally { setIsLoading(false); }
  };

  const updateTotalMarks = useCallback((idx, marks) => {
    setEventParticipants(prev => {
      const updated = [...prev];
      let val = Number(marks);
      if (val > maxMarks) val = maxMarks;
      updated[idx] = { ...updated[idx], totalMarks: val };

      const pct = maxMarks > 0 ? (val / maxMarks) * 100 : 0;
      const grade = pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : '';
      const gradePoints = grade === 'A' ? 5 : grade === 'B' ? 3 : grade === 'C' ? 1 : 0;
      updated[idx].grade = grade;
      updated[idx].gradePoints = gradePoints;

      // Positions
      const sorted = [...updated].sort((a, b) => b.totalMarks - a.totalMarks);
      for (let i = 0; i < updated.length; i++) { updated[i].position = ''; updated[i].positionPoints = 0; }
      for (let i = 0; i < Math.min(3, sorted.length); i++) {
        if (sorted[i].totalMarks <= 0) continue;
        const pi = updated.findIndex(p => p._id === sorted[i]._id);
        if (pi < 0) continue;
        const pos = String(i + 1);
        updated[pi].position = pos;
        const isGrp = updated[pi].participantType === 'Group';
        updated[pi].positionPoints = pos === '1' ? (isGrp ? 10 : 5) : pos === '2' ? (isGrp ? 5 : 3) : pos === '3' ? (isGrp ? 3 : 1) : 0;
      }
      for (let i = 0; i < updated.length; i++) updated[i].totalPoints = (updated[i].gradePoints || 0) + (updated[i].positionPoints || 0);
      return updated;
    });
  }, [maxMarks]);

  const saveScoring = async () => {
    try {
      await axiosInstance.post('/event-scoring', {
        foraneId: FORANE_ID, eventId: selectedEvent, section: selectedSection, maxMarks,
        participants: eventParticipants.map(p => ({
          participantId: p._id,
          participantName: p.participantType === 'Group' ? p.parish : p.name,
          participantType: p.participantType, registrationNumber: p.registrationNumber,
          parish: p.parish, parishId: p.parishId || null,
          totalMarks: p.totalMarks, grade: p.grade || '', position: p.position || '',
          gradePoints: p.gradePoints || 0, positionPoints: p.positionPoints || 0, totalPoints: p.totalPoints || 0
        }))
      });
      setMessage({ text: 'Scoring saved!', type: 'success' });
      fetchEvents();
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Error saving scoring.', type: 'error' });
    }
  };

  const filteredEvents = events.filter(e =>
    (!sectionFilter || e.section === sectionFilter) &&
    (!eventNameFilter || e.eventName.toLowerCase().includes(eventNameFilter.toLowerCase())) &&
    (!stageFilter || e.stage === stageFilter)
  );

  const availableSections = [...new Set(events.map(e => e.section))].filter(Boolean).sort();
  const availableStages = [...new Set(events.map(e => e.stage))].filter(Boolean).sort();
  const isGroup = eventParticipants.length > 0 && eventParticipants[0]?.participantType === 'Group';
  const posSuffix = p => !p ? '–' : p === '1' ? '1st' : p === '2' ? '2nd' : p === '3' ? '3rd' : p;
  const selectedEventData = events.find(e => e._id === selectedEvent);

  return (
    <ThemeProvider theme={theme}>
      <DashboardContainer>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            {/* Header */}
            <Grid item xs={12}>
              <PageHeader>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c', mb: 0.5 }}>Event Scoring</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Score participants by registration number</Typography>
                </Box>
                {selectedEvent && (
                  <Button variant="outlined" startIcon={<RefreshCw size={18} />} onClick={fetchEventParticipants} disabled={isLoading}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Refresh</Button>
                )}
              </PageHeader>
            </Grid>

            {message.text && (
              <Grid item xs={12}>
                <Alert severity={message.type === 'error' ? 'error' : message.type} sx={{ borderRadius: 2 }} onClose={() => setMessage({ text: '', type: '' })}>{message.text}</Alert>
              </Grid>
            )}

            {/* Stat Cards */}
            {[
              { title: 'Total Events', value: events.length, color: '#2563EB', icon: <Layers size={24} /> },
              { title: 'Scored', value: scoredEvents.length, color: '#10B981', icon: <Award size={24} /> },
              { title: 'Participants', value: eventParticipants.length, color: '#6366F1', icon: <Users size={24} /> },
            ].map((stat, i) => (
              <Grid item xs={4} sm={4} md={4} key={i}>
                <StyledCard><StyledCardContent>
                  <StatWrapper>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.title}</Typography>
                      <StatValue sx={{ fontSize: '1.75rem' }}>{stat.value}</StatValue>
                    </Box>
                    <IconBox color={stat.color}>{stat.icon}</IconBox>
                  </StatWrapper>
                </StyledCardContent></StyledCard>
              </Grid>
            ))}

            {/* Events List */}
            <Grid item xs={12}>
              <ChartCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>Events</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <TextField size="small" label="Search" value={eventNameFilter} onChange={e => setEventNameFilter(e.target.value)} sx={{ width: 160 }} />
                    <FormControl size="small" sx={{ minWidth: 130 }}><InputLabel>Section</InputLabel>
                      <Select value={sectionFilter} label="Section" onChange={e => setSectionFilter(e.target.value)}>
                        <MenuItem value="">All</MenuItem>
                        {availableSections.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 130 }}><InputLabel>Stage</InputLabel>
                      <Select value={stageFilter} label="Stage" onChange={e => setStageFilter(e.target.value)}>
                        <MenuItem value="">All</MenuItem>
                        {availableStages.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <Button variant="outlined" size="small" onClick={() => { setEventNameFilter(''); setSectionFilter(''); setStageFilter(''); }}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Clear</Button>
                  </Box>
                </Box>

                {isLoading && !selectedEvent ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                ) : (
                  <Grid container spacing={1.5}>
                    {filteredEvents.map(event => {
                      const isScored = scoredEvents.includes(event._id);
                      const isSel = selectedEvent === event._id;
                      const sColor = SECTION_COLORS[event.section] || '#6366F1';
                      return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={event._id}>
                          <Box onClick={() => { setSelectedEvent(event._id); setSelectedSection(event.section); }}
                            sx={{
                              p: 2, borderRadius: 2.5, cursor: 'pointer',
                              border: isSel ? '2px solid #2563EB' : isScored ? '2px solid #10B981' : '1px solid rgba(0,0,0,0.08)',
                              bgcolor: isSel ? 'rgba(37,99,235,0.05)' : isScored ? 'rgba(16,185,129,0.03)' : 'white',
                              transition: 'all 0.15s ease',
                              '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
                            }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a202c', lineHeight: 1.3 }}>{event.eventName}</Typography>
                              {isScored && <Chip label="✓" size="small" sx={{ bgcolor: '#10B98120', color: '#10B981', fontWeight: 700, minWidth: 28 }} />}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip label={event.section} size="small" sx={{ bgcolor: `${sColor}15`, color: sColor, fontWeight: 600, fontSize: '0.65rem', height: 22 }} />
                              <Chip label={event.eventType === 'single' ? 'Ind' : 'Grp'} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 22 }} />
                              <Chip label={event.stage || '–'} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 22 }} />
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                    {filteredEvents.length === 0 && (
                      <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="textSecondary">No events match filters</Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                )}
              </ChartCard>
            </Grid>

            {/* Scoring Table */}
            {selectedEvent && (
              <Grid item xs={12}>
                <ChartCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                        {selectedEventData?.eventName || 'Scoring'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        {selectedEventData && (
                          <>
                            <Chip label={selectedEventData.section} size="small" sx={{ bgcolor: `${SECTION_COLORS[selectedEventData.section] || '#6366F1'}15`, color: SECTION_COLORS[selectedEventData.section] || '#6366F1', fontWeight: 600, fontSize: '0.7rem' }} />
                            <Chip label={selectedEventData.eventType === 'single' ? 'Individual' : 'Group'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                            <Chip label={selectedEventData.stage || '–'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          </>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      <TextField size="small" type="number" label="Max Marks" value={maxMarks}
                        onChange={e => setMaxMarks(Number(e.target.value))} sx={{ width: 110 }} />
                      <Button variant="contained" startIcon={<Save size={16} />} onClick={saveScoring}
                        disabled={!selectedEvent || eventParticipants.length === 0}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                        Save
                      </Button>
                    </Box>
                  </Box>

                  {/* Grading ref */}
                  <Box sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.secondary"><strong>Grade:</strong> A ≥80% (5pt) · B ≥60% (3pt) · C ≥40% (1pt)</Typography>
                    <Typography variant="caption" color="text.secondary"><strong>Position {isGroup ? '(Group)' : '(Ind)'}:</strong> 1st: {isGroup ? 10 : 5}pt · 2nd: {isGroup ? 5 : 3}pt · 3rd: {isGroup ? 3 : 1}pt</Typography>
                  </Box>

                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                  ) : (
                    <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <TableCell sx={{ fontWeight: 600, width: 50 }}>No.</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Reg. No.</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Total Marks</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Position</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Points</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {eventParticipants.map((p, idx) => {
                            const gs = GRADE_STYLE[p.grade] || { bgcolor: 'rgba(0,0,0,0.04)', color: '#94a3b8' };
                            return (
                              <TableRow key={p._id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.registrationNumber || '—'}</TableCell>
                                <TableCell>
                                  <TextField type="number" size="small" variant="outlined"
                                    inputProps={{ min: 0, max: maxMarks }}
                                    value={p.totalMarks}
                                    onChange={e => updateTotalMarks(idx, e.target.value)}
                                    sx={{ width: 100 }} />
                                </TableCell>
                                <TableCell>
                                  <Chip size="small" label={p.grade || '–'} sx={{ fontWeight: 600, bgcolor: gs.bgcolor, color: gs.color }} />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{posSuffix(p.position)}</TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: p.totalPoints > 0 ? '#1a202c' : '#94a3b8' }}>
                                    {p.totalPoints || 0}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {eventParticipants.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                <Trophy size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                                <Typography color="textSecondary">No participants found</Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </ChartCard>
              </Grid>
            )}
          </Grid>
        </Container>
      </DashboardContainer>
    </ThemeProvider>
  );
};

export default EventScoringSimple;
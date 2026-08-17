import React, { useState, useEffect } from 'react';
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

const SECTION_COLORS = {
  'Dominic Savio': '#2563EB',
  'Alphonsa': '#10B981',
  'Saint Thomas': '#6366F1',
};

const EventScoringPage = () => {
  const [foranes, setForanes] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedForane, setSelectedForane] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [eventNameFilter, setEventNameFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [availableSections, setAvailableSections] = useState([]);
  const [availableStages, setAvailableStages] = useState([]);

  const [maxMarks, setMaxMarks] = useState(100);
  const [eventParticipants, setEventParticipants] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [scoredEvents, setScoredEvents] = useState([]);

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => {
    if (selectedForane) fetchEvents();
    else setEvents([]);
  }, [selectedForane]);

  useEffect(() => {
    if (selectedEvent) fetchEventParticipants();
    else setEventParticipants([]);
  }, [selectedEvent]);

  useEffect(() => {
    const sections = [...new Set(events.map(event => event.section))].filter(Boolean).sort();
    const stages = [...new Set(events.map(event => event.stage))].filter(Boolean).sort();
    setAvailableSections(sections);
    setAvailableStages(stages);
  }, [events]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const foraneResponse = await axiosInstance.get('/forane');
      const allForanes = foraneResponse.data || [];
      setForanes(allForanes.filter(f => f._id === '673799a3cb9b4aa181e53fa2'));
      const categoriesResponse = await axiosInstance.get('/categories');
      setCategories(categoriesResponse.data.data.categories || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setMessage({ text: 'Failed to load initial data. Please try again.', type: 'error' });
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!selectedForane) return;
    try {
      setIsLoading(true);
      const [onStageResponse, offStageResponse, scoredEventsResponse] = await Promise.allSettled([
        axiosInstance.get(`/events/stage/On Stage`),
        axiosInstance.get(`/events/stage/Off Stage`),
        axiosInstance.get(`/event-scoring/forane/${selectedForane}`)
      ]);
      const allEvents = [
        ...(onStageResponse.status === 'fulfilled' ? onStageResponse.value.data.data?.events || [] : []),
        ...(offStageResponse.status === 'fulfilled' ? offStageResponse.value.data.data?.events || [] : [])
      ];
      setEvents(allEvents);
      if (scoredEventsResponse.status === 'fulfilled' && scoredEventsResponse.value.data?.success) {
        const ids = scoredEventsResponse.value.data.data.eventScorings.map(s => s.eventId._id || s.eventId);
        setScoredEvents(ids);
      } else { setScoredEvents([]); }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setMessage({ text: 'Failed to load events.', type: 'error' });
      setIsLoading(false);
    }
  };

  const fetchEventParticipants = async () => {
    if (!selectedForane || !selectedEvent) return;
    try {
      setIsLoading(true);
      const [scoringResult, regResult] = await Promise.allSettled([
        axiosInstance.get(`/event-scoring/forane/${selectedForane}/event/${selectedEvent}`),
        axiosInstance.get(`/registrations/forane/${selectedForane}/event/${selectedEvent}`)
      ]);
      let existingScoring = null;
      if (scoringResult.status === 'fulfilled') {
        const sd = scoringResult.value.data;
        if (sd?.success && sd.data.eventScoring) {
          existingScoring = sd.data.eventScoring;
          if (existingScoring.maxMarks) setMaxMarks(existingScoring.maxMarks);
        }
      }
      if (regResult.status !== 'fulfilled') throw new Error('Failed to fetch registrations');
      const registrations = regResult.value.data.data.registrations;
      const selectedEventData = events.find(e => e._id === selectedEvent);
      const isGroupEvent = selectedEventData?.eventType === 'group';
      let processedParticipants;
      if (isGroupEvent) {
        const parishMap = new Map();
        for (const reg of registrations) {
          const parishName = reg.parish?.name || 'Unknown Parish';
          if (!parishMap.has(parishName)) {
            parishMap.set(parishName, {
              _id: reg._id, name: parishName, participantType: 'Group',
              parish: parishName, parishId: reg.parish?._id || null,
              registrationNumber: reg.groupRegistrationNumber || '',
              totalMarks: 0, grade: '', position: '',
              gradePoints: 0, positionPoints: 0, totalPoints: 0
            });
          }
        }
        processedParticipants = [...parishMap.values()];
      } else {
        processedParticipants = registrations.map(reg => ({
          _id: reg._id, name: reg.name, participantType: 'Individual',
          parish: reg.parish?.name || 'Unknown Parish', parishId: reg.parish?._id || null,
          standard: reg.standard, gender: reg.gender,
          registrationNumber: reg.registrationNumber || '',
          totalMarks: 0, grade: '', position: '',
          gradePoints: 0, positionPoints: 0, totalPoints: 0
        }));
      }
      if (existingScoring?.participants?.length) {
        const scoringMap = new Map();
        for (const p of existingScoring.participants) {
          scoringMap.set(p.participantId, p);
          if (isGroupEvent && p.parish) scoringMap.set(`parish:${p.parish}`, p);
        }
        processedParticipants = processedParticipants.map(participant => {
          const existing = scoringMap.get(participant._id) ||
            (isGroupEvent ? scoringMap.get(`parish:${participant.parish}`) : null);
          return existing ? {
            ...participant,
            totalMarks: existing.totalMarks || 0, grade: existing.grade || '',
            position: existing.position || '', gradePoints: existing.gradePoints || 0,
            positionPoints: existing.positionPoints || 0, totalPoints: existing.totalPoints || 0
          } : participant;
        });
        setMessage({ text: 'Existing scoring data loaded successfully!', type: 'info' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
      setEventParticipants(processedParticipants);
      if (processedParticipants.length === 0) {
        setMessage({ text: 'No participants found for this event in the selected forane.', type: 'info' });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching event participants:', error);
      setMessage({ text: 'Failed to load event participants. Please try again.', type: 'error' });
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    (!sectionFilter || event.section === sectionFilter) &&
    (!eventNameFilter || event.eventName.toLowerCase().includes(eventNameFilter.toLowerCase())) &&
    (!stageFilter || event.stage === stageFilter)
  );

  const updateTotalMarks = (participantIndex, marks) => {
    const updatedParticipants = [...eventParticipants];
    let markValue = Number(marks);
    if (markValue > maxMarks) {
      markValue = maxMarks;
      setMessage({ text: `Total marks cannot exceed maximum marks (${maxMarks}). Value has been adjusted.`, type: 'warning' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
    updatedParticipants[participantIndex].totalMarks = markValue;
    const percentage = maxMarks > 0 ? (markValue / maxMarks) * 100 : 0;
    let grade = '';
    if (percentage >= 80) grade = 'A';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 40) grade = 'C';
    updatedParticipants[participantIndex].grade = grade;
    let gradePoints = 0;
    switch (grade) { case 'A': gradePoints = 5; break; case 'B': gradePoints = 3; break; case 'C': gradePoints = 1; break; default: gradePoints = 0; }
    updatedParticipants[participantIndex].gradePoints = gradePoints;
    const sortedParticipants = [...updatedParticipants].sort((a, b) => b.totalMarks - a.totalMarks);
    updatedParticipants.forEach(p => { p.position = ''; p.positionPoints = 0; });
    for (let i = 0; i < Math.min(3, sortedParticipants.length); i++) {
      const topParticipant = sortedParticipants[i];
      if (topParticipant.totalMarks > 0) {
        const posIndex = updatedParticipants.findIndex(p => p._id === topParticipant._id);
        if (posIndex >= 0) {
          const position = (i + 1).toString();
          updatedParticipants[posIndex].position = position;
          let positionPoints = 0;
          const isGroupParticipant = updatedParticipants[posIndex].participantType === 'Group';
          if (isGroupParticipant) {
            switch (position) { case '1': positionPoints = 10; break; case '2': positionPoints = 5; break; case '3': positionPoints = 3; break; default: positionPoints = 0; }
          } else {
            switch (position) { case '1': positionPoints = 5; break; case '2': positionPoints = 3; break; case '3': positionPoints = 1; break; default: positionPoints = 0; }
          }
          updatedParticipants[posIndex].positionPoints = positionPoints;
        }
      }
    }
    updatedParticipants.forEach(p => { p.totalPoints = (p.gradePoints || 0) + (p.positionPoints || 0); });
    setEventParticipants(updatedParticipants);
  };

  const saveScoring = async () => {
    try {
      const payload = {
        foraneId: selectedForane, eventId: selectedEvent, section: selectedSection, maxMarks: maxMarks,
        participants: eventParticipants.map(participant => ({
          participantId: participant._id,
          participantName: participant.participantType === 'Group' ? participant.parish : participant.name,
          participantType: participant.participantType, registrationNumber: participant.registrationNumber,
          parish: participant.parish, parishId: participant.parishId || null,
          totalMarks: participant.totalMarks, grade: participant.grade || '',
          position: participant.position || '', gradePoints: participant.gradePoints || 0,
          positionPoints: participant.positionPoints || 0, totalPoints: participant.totalPoints || 0
        }))
      };
      await axiosInstance.post('/event-scoring', payload);
      setMessage({ text: 'Scoring saved successfully!', type: 'success' });
    } catch (error) {
      console.error('Error saving scoring:', error);
      setMessage({ text: 'Error saving scoring. Please try again.', type: 'error' });
    }
  };

  const resetFilters = () => { setEventNameFilter(''); setSectionFilter(''); setStageFilter(''); };

  const positionSuffix = (pos) => {
    if (!pos) return '-';
    return pos === '1' ? '1st' : pos === '2' ? '2nd' : pos === '3' ? '3rd' : pos;
  };

  const isGroupEvent = eventParticipants.length > 0 && eventParticipants[0].participantType === 'Group';
  const scoredCount = scoredEvents.length;

  const statisticsCards = [
    { title: 'Total Events', value: events.length, color: '#2563EB', icon: <Layers size={24} /> },
    { title: 'Scored Events', value: scoredCount, color: '#10B981', icon: <Award size={24} /> },
    { title: 'Participants', value: eventParticipants.length, color: '#6366F1', icon: <Users size={24} /> },
  ];

  return (
    <ThemeProvider theme={theme}>
      <DashboardContainer>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            {/* Header */}
            <Grid item xs={12}>
              <PageHeader>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c', mb: 0.5 }}>
                    Event Scoring
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Score participants for Forane Kalolsavam events
                  </Typography>
                </Box>
                {selectedEvent && (
                  <Button variant="outlined" startIcon={<RefreshCw size={18} />}
                    onClick={fetchEventParticipants} disabled={isLoading}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                    Refresh
                  </Button>
                )}
              </PageHeader>
            </Grid>

            {/* Message */}
            {message.text && (
              <Grid item xs={12}>
                <Alert severity={message.type === 'error' ? 'error' : message.type}
                  sx={{ borderRadius: 2 }} onClose={() => setMessage({ text: '', type: '' })}>
                  {message.text}
                </Alert>
              </Grid>
            )}

            {/* Forane Selector */}
            <Grid item xs={12} sm={6} md={4}>
              <StyledCard>
                <StyledCardContent>
                  <FormControl fullWidth>
                    <InputLabel>Select Forane</InputLabel>
                    <Select value={selectedForane} label="Select Forane"
                      onChange={(e) => { setSelectedForane(e.target.value); setSelectedEvent(''); }}>
                      <MenuItem value=""><em>Select Forane</em></MenuItem>
                      {foranes.map(f => (
                        <MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </StyledCardContent>
              </StyledCard>
            </Grid>

            {/* Stat Cards */}
            {selectedForane && !isLoading && statisticsCards.map((stat, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
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

            {/* Events List */}
            {selectedForane && (
              <Grid item xs={12}>
                <ChartCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                      Available Events
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <TextField size="small" label="Search Event" value={eventNameFilter}
                        onChange={(e) => setEventNameFilter(e.target.value)} sx={{ minWidth: 180 }} />
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Section</InputLabel>
                        <Select value={sectionFilter} label="Section"
                          onChange={(e) => setSectionFilter(e.target.value)}>
                          <MenuItem value=""><em>All Sections</em></MenuItem>
                          {availableSections.map(s => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button variant="outlined" color="secondary" onClick={resetFilters}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                        Clear
                      </Button>
                    </Box>
                  </Box>

                  {isLoading && !selectedEvent ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                  ) : (
                    <Grid container spacing={2}>
                      {filteredEvents.map(event => {
                        const isScored = scoredEvents.includes(event._id);
                        const isSelected = selectedEvent === event._id;
                        const sColor = SECTION_COLORS[event.section] || '#6366F1';
                        return (
                          <Grid item xs={12} sm={6} md={4} key={event._id}>
                            <Box
                              onClick={() => { setSelectedEvent(event._id); setSelectedSection(event.section); }}
                              sx={{
                                p: 2.5, borderRadius: 3, cursor: 'pointer',
                                border: isSelected ? '2px solid #2563EB'
                                  : isScored ? '2px solid #10B981'
                                  : '1px solid rgba(0,0,0,0.08)',
                                bgcolor: isSelected ? 'rgba(37,99,235,0.05)'
                                  : isScored ? 'rgba(16,185,129,0.03)' : 'white',
                                transition: 'all 0.2s ease',
                                '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
                              }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a202c' }}>
                                  {event.eventName}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {isScored && (
                                    <Chip label="Scored" size="small" sx={{
                                      bgcolor: '#10B98115', color: '#10B981',
                                      border: '1px solid #10B98130', fontWeight: 600
                                    }} />
                                  )}
                                  {isSelected && (
                                    <Chip label="Selected" size="small" sx={{
                                      bgcolor: '#2563EB15', color: '#2563EB',
                                      border: '1px solid #2563EB30', fontWeight: 600
                                    }} />
                                  )}
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip label={event.section} size="small" sx={{
                                  bgcolor: `${sColor}15`, color: sColor,
                                  border: `1px solid ${sColor}30`, fontWeight: 600
                                }} />
                                <Chip
                                  label={event.gender === 'male' ? 'Boys' : event.gender === 'female' ? 'Girls' : 'Mixed'}
                                  size="small" variant="outlined"
                                  color={event.gender === 'male' ? 'primary' : event.gender === 'female' ? 'error' : 'success'}
                                />
                                <Chip label={event.eventType === 'single' ? 'Individual' : 'Group'}
                                  size="small" variant="outlined" />
                              </Box>
                            </Box>
                          </Grid>
                        );
                      })}
                      {filteredEvents.length === 0 && !isLoading && (
                        <Grid item xs={12}>
                          <Box sx={{ textAlign: 'center', py: 5 }}>
                            <Layers size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                            <Typography color="textSecondary">No events found matching filters</Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  )}
                </ChartCard>
              </Grid>
            )}

            {/* Scoring Section */}
            {selectedEvent && (
              <Grid item xs={12}>
                <ChartCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                      Event Scoring Details
                    </Typography>
                    <TextField size="small" type="number" label="Max Marks" value={maxMarks}
                      onChange={(e) => setMaxMarks(Number(e.target.value))} sx={{ width: 140 }} />
                  </Box>

                  {/* Grading Info */}
                  <Box sx={{
                    p: 2.5, mb: 3, borderRadius: 3,
                    bgcolor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)'
                  }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#1a202c' }}>
                      Grading & Points System (Auto-calculated)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#4F46E5' }}>
                          Grade Criteria (% of Max Marks)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">A: 80%+ (5 pts) · B: 60-79% (3 pts) · C: 40-59% (1 pt)</Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#2563EB' }}>
                          Individual Position Points
                        </Typography>
                        <Typography variant="body2" color="text.secondary">1st: 5 pts · 2nd: 3 pts · 3rd: 1 pt</Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#10B981' }}>
                          Group Position Points
                        </Typography>
                        <Typography variant="body2" color="text.secondary">1st: 10 pts · 2nd: 5 pts · 3rd: 3 pts</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                  ) : (
                    <>
                      <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', mb: 3 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                              <TableCell sx={{ fontWeight: 600 }}>No.</TableCell>
                              {isGroupEvent ? (
                                <>
                                  <TableCell sx={{ fontWeight: 600 }}>Parish</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Reg. No.</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Total Marks</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Position</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Points</TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Reg. No.</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Parish</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Total Marks</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Position</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Points</TableCell>
                                </>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {eventParticipants.map((p, idx) => (
                              <TableRow key={p._id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                <TableCell>{idx + 1}</TableCell>
                                {isGroupEvent ? (
                                  <>
                                    <TableCell>
                                      <Chip size="small" label={p.parish} sx={{
                                        bgcolor: '#10B98115', color: '#10B981',
                                        border: '1px solid #10B98130', fontWeight: 600
                                      }} />
                                    </TableCell>
                                    <TableCell>{p.registrationNumber || 'N/A'}</TableCell>
                                    <TableCell>
                                      <TextField type="number" size="small" variant="outlined"
                                        inputProps={{ min: 0, max: maxMarks }}
                                        value={p.totalMarks}
                                        onChange={(e) => updateTotalMarks(idx, e.target.value)}
                                        sx={{ width: 100 }} />
                                    </TableCell>
                                    <TableCell>
                                      <Chip size="small" label={p.grade || '-'} sx={{
                                        fontWeight: 600,
                                        bgcolor: p.grade === 'A' ? '#10B98115' : p.grade === 'B' ? '#2563EB15' : p.grade === 'C' ? '#F59E0B15' : 'rgba(0,0,0,0.04)',
                                        color: p.grade === 'A' ? '#10B981' : p.grade === 'B' ? '#2563EB' : p.grade === 'C' ? '#D97706' : '#94a3b8',
                                      }} />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{positionSuffix(p.position)}</TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a202c' }}>
                                        {p.totalPoints || 0}
                                      </Typography>
                                    </TableCell>
                                  </>
                                ) : (
                                  <>
                                    <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                                    <TableCell>{p.registrationNumber || 'N/A'}</TableCell>
                                    <TableCell>
                                      <Chip size="small" label={p.parish} sx={{
                                        bgcolor: '#2563EB15', color: '#2563EB',
                                        border: '1px solid #2563EB30', fontWeight: 600
                                      }} />
                                    </TableCell>
                                    <TableCell>{p.standard}</TableCell>
                                    <TableCell>
                                      <TextField type="number" size="small" variant="outlined"
                                        inputProps={{ min: 0, max: maxMarks }}
                                        value={p.totalMarks}
                                        onChange={(e) => updateTotalMarks(idx, e.target.value)}
                                        sx={{ width: 100 }} />
                                    </TableCell>
                                    <TableCell>
                                      <Chip size="small" label={p.grade || '-'} sx={{
                                        fontWeight: 600,
                                        bgcolor: p.grade === 'A' ? '#10B98115' : p.grade === 'B' ? '#2563EB15' : p.grade === 'C' ? '#F59E0B15' : 'rgba(0,0,0,0.04)',
                                        color: p.grade === 'A' ? '#10B981' : p.grade === 'B' ? '#2563EB' : p.grade === 'C' ? '#D97706' : '#94a3b8',
                                      }} />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{positionSuffix(p.position)}</TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a202c' }}>
                                        {p.totalPoints || 0}
                                      </Typography>
                                    </TableCell>
                                  </>
                                )}
                              </TableRow>
                            ))}
                            {eventParticipants.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={isGroupEvent ? 7 : 8} align="center" sx={{ py: 5 }}>
                                  <Trophy size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                                  <Typography color="textSecondary">No participants found for this event</Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" startIcon={<Save size={18} />}
                          onClick={saveScoring}
                          disabled={!selectedForane || !selectedEvent || !selectedSection || eventParticipants.length === 0}
                          sx={{
                            borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 4,
                            boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
                          }}>
                          Save Scoring
                        </Button>
                      </Box>
                    </>
                  )}
                </ChartCard>
              </Grid>
            )}

            {/* Empty state */}
            {!selectedForane && (
              <Grid item xs={12}>
                <ChartCard>
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Award size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                    <Typography color="textSecondary" sx={{ fontSize: '1.05rem' }}>
                      Select a forane to begin scoring events
                    </Typography>
                  </Box>
                </ChartCard>
              </Grid>
            )}
          </Grid>
        </Container>
      </DashboardContainer>
    </ThemeProvider>
  );
};

export default EventScoringPage;
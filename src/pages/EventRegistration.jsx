import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axiosInstance from "../axiosConfig";
import { getParishId } from '../utils/parishAuth';
import {
  Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Grid, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  FormHelperText, Chip, FormControlLabel, Checkbox, Alert, Stepper, Step, StepLabel, Badge
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Trash2, Plus, RefreshCw, Info, ChevronDown, User, Users } from 'lucide-react';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', light: '#3B82F6', dark: '#1E40AF' },
    secondary: { main: '#10B981', light: '#34D399', dark: '#047857' },
    info: { main: '#6366F1', light: '#818CF8', dark: '#4F46E5' }
  }
});

const SECTION_CONFIG = {
  'Dominic Savio': { classes: ['IV', 'V', 'VI'], label: 'Classes IV-VI' },
  'Alphonsa': { classes: ['VII', 'VIII', 'IX'], label: 'Classes VII-IX' },
  'Saint Thomas': { classes: ['X', 'XI', 'XII'], label: 'Classes X-XII' }
};
const SECTION_REGNO_START = { 'Dominic Savio': 301, 'Alphonsa': 501, 'Saint Thomas': 701 };

const getParticipantSection = (standard) => {
  if (!standard) return null;
  for (const [section, config] of Object.entries(SECTION_CONFIG)) {
    if (config.classes.includes(standard)) return section;
  }
  return null;
};

const EventRegistration = () => {
  const [events, setEvents] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [selectedParish, setSelectedParish] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [eventParticipantCounts, setEventParticipantCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [sectionFilter, setSectionFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [crossSectionFilter, setCrossSectionFilter] = useState('all');
  const [sectionInDialog, setSectionInDialog] = useState('');
  const [availableClasses, setAvailableClasses] = useState(['IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']);
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
  const [summarySection, setSummarySection] = useState('');
  const [eventNameFilter, setEventNameFilter] = useState('');
  const [uniqueEventNames, setUniqueEventNames] = useState([]);
  const [crossSectionSelections, setCrossSectionSelections] = useState({});
  const [participantForm, setParticipantForm] = useState({ name: '', standard: '', gender: '', dob: '', parish: '' });

  // Derived data
  const singleEvents = useMemo(() => events.filter(e => e.eventType === 'single').map(e => ({
    ...e, allowCrossSectionParticipation: e.allowCrossSectionParticipation || false,
    crossSectionAllowedSections: e.crossSectionAllowedSections || [], crossSectionMaxParticipants: e.crossSectionMaxParticipants || 0
  })), [events]);

  const groupEvents = useMemo(() => events.filter(e => e.eventType === 'group').map(e => ({
    ...e, allowCrossSectionParticipation: e.allowCrossSectionParticipation || false,
    crossSectionAllowedSections: e.crossSectionAllowedSections || [], crossSectionMaxParticipants: e.crossSectionMaxParticipants || 0
  })), [events]);

  // ====== PROCESS REGISTRATIONS (reusable) ======
  const processRegistrations = useCallback((registrations) => {
    const grouped = {};
    registrations.forEach(reg => {
      const key = `${reg.name}|${reg.standard}|${reg.gender}|${new Date(reg.dob).toISOString().split('T')[0]}`;
      if (!grouped[key]) {
        grouped[key] = {
          _id: reg._id, name: reg.name, standard: reg.standard,
          gender: reg.gender, dob: reg.dob, parish: selectedParish,
          registrationNumber: reg.registrationNumber || null, events: []
        };
      }
      grouped[key].events.push({
        eventId: reg.event._id, eventName: reg.event.eventName,
        eventType: reg.event.eventType, section: reg.event.section,
        category: reg.event.category?.name || '', registrationId: reg._id,
        isCrossSectionParticipation: reg.isCrossSectionParticipation || false
      });
    });
    return Object.values(grouped);
  }, [selectedParish]);

  const processStats = (statsData) => {
    const m = {};
    (statsData || []).forEach(s => { m[s.eventId] = s.participantCount; });
    return m;
  };

  // ====== INITIAL LOAD — parallel ======
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [parishRes, eventRes] = await Promise.all([
          axiosInstance.get("/parish"),
          axiosInstance.get("/events")
        ]);
        setParishes((parishRes.data || []).filter(
          p => p.forane === "673799a3cb9b4aa181e53fa2" || p.forane?._id === "673799a3cb9b4aa181e53fa2"
        ));
        setEvents(eventRes.data.data.events || []);
      } catch (err) { console.error("Init failed", err); }
      finally { setIsLoading(false); }
    };
    init();
    const pid = getParishId();
    if (pid) setSelectedParish(pid);
  }, []);

  // ====== PARISH CHANGE — parallel fetch ======
  useEffect(() => {
    if (!selectedParish) { setParticipants([]); setEventParticipantCounts({}); return; }
    const load = async () => {
      setIsLoading(true);
      try {
        const [regRes, statsRes] = await Promise.all([
          axiosInstance.get(`/registrations/parish/${selectedParish}`),
          axiosInstance.get(`/api/event-stats/parish/${selectedParish}`).catch(() => ({ data: { data: { stats: [] } } }))
        ]);
        setParticipants(processRegistrations(regRes.data.data.registrations || []));
        const countsMap = processStats(statsRes.data.data.stats);
        try {
          const crossRes = await axiosInstance.get(`/api/event-stats/parish/${selectedParish}/cross-section`);
          (crossRes.data.data.stats || []).forEach(s => { countsMap[`${s.eventId}_cross`] = s.participantCount; });
        } catch (e) { /* ok */ }
        setEventParticipantCounts(countsMap);
      } catch (err) { console.error("Parish load failed", err); setMessage("Error loading data"); }
      finally { setIsLoading(false); }
    };
    load();
  }, [selectedParish, processRegistrations]);

  // ====== SECTION/CLASS EFFECTS ======
  useEffect(() => {
    setAvailableClasses(sectionInDialog ? (SECTION_CONFIG[sectionInDialog]?.classes || []) : ['IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']);
  }, [sectionInDialog]);

  useEffect(() => {
    if (sectionInDialog && participantForm.standard) {
      const classes = SECTION_CONFIG[sectionInDialog]?.classes || [];
      if (!classes.includes(participantForm.standard)) setParticipantForm(prev => ({ ...prev, standard: '' }));
    }
  }, [sectionInDialog, participantForm.standard]);

  // ====== UNIQUE EVENT NAMES ======
  useEffect(() => {
    setUniqueEventNames([...new Set(participants.flatMap(p => p.events.map(e => e.eventName)))].sort());
  }, [participants]);

  // ====== FILTERING ======
  useEffect(() => {
    let filtered = participants;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) || p.standard.toLowerCase().includes(q) ||
        (getParticipantSection(p.standard) || '').toLowerCase().includes(q) ||
        p.events.some(e => e.eventName.toLowerCase().includes(q))
      );
    }
    if (sectionFilter !== 'all') filtered = filtered.filter(p => getParticipantSection(p.standard) === sectionFilter);
    if (eventTypeFilter !== 'all') filtered = filtered.filter(p => p.events.some(e => e.eventType === eventTypeFilter));
    if (crossSectionFilter !== 'all') {
      filtered = filtered.filter(p => crossSectionFilter === 'home'
        ? p.events.some(e => !e.isCrossSectionParticipation)
        : p.events.some(e => e.isCrossSectionParticipation));
    }
    if (eventNameFilter) filtered = filtered.filter(p => p.events.some(e => e.eventName === eventNameFilter));
    setFilteredParticipants(filtered);
  }, [participants, searchQuery, sectionFilter, eventTypeFilter, crossSectionFilter, eventNameFilter]);

  // ====== HANDLERS ======
  const handleRefresh = async () => {
    if (!selectedParish) return;
    setIsLoading(true);
    try {
      const [regRes, statsRes] = await Promise.all([
        axiosInstance.get(`/registrations/parish/${selectedParish}`),
        axiosInstance.get(`/api/event-stats/parish/${selectedParish}`).catch(() => ({ data: { data: { stats: [] } } }))
      ]);
      setParticipants(processRegistrations(regRes.data.data.registrations || []));
      setEventParticipantCounts(processStats(statsRes.data.data.stats));
    } catch (err) { console.error("Refresh failed", err); }
    finally { setIsLoading(false); }
  };

  const handleEventToggle = (eventId, isCrossSection = false) => {
    const eventKey = isCrossSection ? `${eventId}|cross` : eventId;
    setSelectedEvents(prev => {
      const isSelected = prev.includes(eventKey);
      if (isSelected) return prev.filter(id => id !== eventKey);
      const event = events.find(e => e._id === eventId);
      if (!event) return prev;
      if (event.eventType === 'single') {
        const currentSingle = prev.filter(id => { const [sid] = id.toString().split('|'); return events.find(e => e._id === sid)?.eventType === 'single'; });
        if (currentSingle.length >= 2) { setMessage("Max 2 individual events"); return prev; }
      } else {
        const without = prev.filter(id => { const [sid] = id.toString().split('|'); return events.find(e => e._id === sid)?.eventType !== 'group'; });
        return [...without, eventKey];
      }
      return [...prev, eventKey];
    });
    setCrossSectionSelections(prev => ({ ...prev, [eventId]: isCrossSection }));
  };

  const handleOpenDialog = (participant = null) => {
    if (participant) {
      setParticipantForm({ name: participant.name, standard: participant.standard, gender: participant.gender, dob: participant.dob ? new Date(participant.dob).toISOString().split('T')[0] : '', parish: selectedParish });
      setSectionInDialog(getParticipantSection(participant.standard) || '');
      const selections = []; const crossMap = {};
      participant.events.forEach(e => {
        selections.push(e.isCrossSectionParticipation ? `${e.eventId}|cross` : e.eventId);
        crossMap[e.eventId] = e.isCrossSectionParticipation;
      });
      setSelectedEvents(selections); setCrossSectionSelections(crossMap);
    } else {
      setParticipantForm({ name: '', standard: '', gender: '', dob: '', parish: selectedParish });
      setSectionInDialog(''); setSelectedEvents([]); setCrossSectionSelections({});
    }
    setActiveStep(0); setOpenDialog(true);
  };

  const handleCloseDialog = () => { setOpenDialog(false); setMessage(''); };
  const handleNext = () => {
    if (activeStep === 0) {
      if (!participantForm.name || !participantForm.standard || !participantForm.gender || !participantForm.dob) { setMessage("Please fill all fields"); return; }
      if (!sectionInDialog) { setMessage("Please select a section"); return; }
      if (!getParticipantSection(participantForm.standard)) { setMessage("Invalid class selection"); return; }
    }
    setActiveStep(s => s + 1);
  };
  const handleBack = () => setActiveStep(s => s - 1);
  const handleInputChange = (e) => { const { name, value } = e.target; setParticipantForm(prev => ({ ...prev, [name]: value })); };

  // ====== BATCH SUBMIT — single API call ======
  const handleSubmitRegistrations = async () => {
    try {
      setIsLoading(true); setMessage('');
      const eventSelections = selectedEvents.map(key => {
        const [eventId, crossFlag] = key.toString().split('|');
        return { eventId, isCrossSectionParticipation: crossFlag === 'cross' };
      });

      const response = await axiosInstance.post('/registrations/batch', {
        participant: { name: participantForm.name, standard: participantForm.standard, gender: participantForm.gender, dob: new Date(participantForm.dob).toISOString() },
        events: eventSelections, parish: selectedParish
      });

      const { created, failed } = response.data.data;
      let msg = '';
      if (created.length > 0) msg = `Registered ${participantForm.name} for ${created.length} event(s)`;
      if (failed.length > 0) { const errs = failed.map(f => `${f.eventName || f.eventId}: ${f.error}`).join(', '); msg += msg ? `\nFailed: ${errs}` : `Failed: ${errs}`; }
      if (!msg) msg = 'No new events to register';
      setMessage(msg);
      handleCloseDialog();

      // Parallel refresh
      const [regRes, statsRes] = await Promise.all([
        axiosInstance.get(`/registrations/parish/${selectedParish}`),
        axiosInstance.get(`/api/event-stats/parish/${selectedParish}`).catch(() => ({ data: { data: { stats: [] } } }))
      ]);
      setParticipants(processRegistrations(regRes.data.data.registrations || []));
      setEventParticipantCounts(processStats(statsRes.data.data.stats));
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error.response?.data?.message || 'Registration failed');
    } finally { setIsLoading(false); }
  };

  const handleDeleteRegistration = async (registrationId) => {
    if (!window.confirm("Delete this registration?")) return;
    try {
      await axiosInstance.delete(`/registrations/${registrationId}`);
      setMessage("Deleted successfully");
      handleRefresh();
    } catch (error) { console.error(error); setMessage("Error deleting"); }
  };

  // ====== HELPER FUNCTIONS ======
  const filterEventsBySection = (evts, standard) => {
    const sec = getParticipantSection(standard);
    if (!sec) return [];
    return evts.filter(e => e.section === sec || (e.allowCrossSectionParticipation && e.crossSectionAllowedSections?.includes(sec)));
  };

  const filterEventsByGenderAndSection = (evts, gender, standard) => {
    return filterEventsBySection(evts, standard).filter(e =>
      e.gender === 'common' || (gender === 'M' && e.gender === 'male') || (gender === 'F' && e.gender === 'female')
    );
  };

  const countEventTypes = (evts) => {
    if (!evts?.length) return { single: 0, group: 0 };
    return evts.reduce((c, e) => { if (e.eventType === 'single') c.single++; else if (e.eventType === 'group') c.group++; return c; }, { single: 0, group: 0 });
  };

  // ====== EVENT PARTICIPATION SUMMARY ======
  const EventParticipationSummary = ({ section = '' }) => {
    const sectionsToShow = section ? [[section, SECTION_CONFIG[section]]] : Object.entries(SECTION_CONFIG);
    return (<>
      {sectionsToShow.map(([sectionName, config]) => {
        const homeEvents = events.filter(e => e.section === sectionName);
        const crossEvents = events.filter(e => e.section !== sectionName && e.allowCrossSectionParticipation && e.crossSectionAllowedSections?.includes(sectionName));
        if (!homeEvents.length && !crossEvents.length) return null;
        return (
          <Box key={sectionName} sx={{ mb: section ? 0 : 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="600">{sectionName} Section ({config.label})</Typography>
            {homeEvents.length > 0 && (<>
              <Typography variant="subtitle2" gutterBottom>Home Section Events</Typography>
              <TableContainer sx={{ mb: 3 }}><Table size="small"><TableHead><TableRow>
                <TableCell>Event Name</TableCell><TableCell>Type</TableCell><TableCell>Gender</TableCell><TableCell>Category</TableCell><TableCell align="right">Participants</TableCell>
              </TableRow></TableHead><TableBody>
                {homeEvents.map(event => (
                  <TableRow key={event._id}><TableCell>{event.eventName}</TableCell>
                    <TableCell><Chip size="small" label={event.eventType === 'single' ? 'Individual' : 'Group'} color={event.eventType === 'single' ? 'primary' : 'secondary'} /></TableCell>
                    <TableCell>{event.gender === 'male' ? 'Boys Only' : event.gender === 'female' ? 'Girls Only' : 'Boys & Girls'}</TableCell>
                    <TableCell>{event.category?.name || '-'}</TableCell>
                    <TableCell align="right"><Badge badgeContent={eventParticipantCounts[event._id] || 0} color={event.eventType === 'single' ? 'primary' : 'secondary'} showZero>{event.eventType === 'single' ? <User size={18} /> : <Users size={18} />}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody></Table></TableContainer>
            </>)}
            {crossEvents.length > 0 && (<>
              <Typography variant="subtitle2" gutterBottom>Cross-Section Participation</Typography>
              <TableContainer><Table size="small"><TableHead><TableRow>
                <TableCell>Event Name</TableCell><TableCell>Home Section</TableCell><TableCell>Type</TableCell><TableCell>Gender</TableCell><TableCell align="right">Participants</TableCell>
              </TableRow></TableHead><TableBody>
                {crossEvents.map(event => (
                  <TableRow key={`cross_${event._id}`}><TableCell>{event.eventName}</TableCell><TableCell>{event.section}</TableCell>
                    <TableCell><Chip size="small" label={event.eventType === 'single' ? 'Individual' : 'Group'} color={event.eventType === 'single' ? 'primary' : 'secondary'} /></TableCell>
                    <TableCell>{event.gender === 'male' ? 'Boys Only' : event.gender === 'female' ? 'Girls Only' : 'Boys & Girls'}</TableCell>
                    <TableCell align="right"><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Typography variant="caption" sx={{ mr: 1 }}>{eventParticipantCounts[`${event._id}_cross`] || 0}/{event.crossSectionMaxParticipants || 0}</Typography>
                      <Badge badgeContent={eventParticipantCounts[`${event._id}_cross`] || 0} color="info" showZero>{event.eventType === 'single' ? <User size={18} /> : <Users size={18} />}</Badge>
                    </Box></TableCell>
                  </TableRow>
                ))}
              </TableBody></Table></TableContainer>
            </>)}
          </Box>
        );
      })}
    </>);
  };

  // ====== RENDER EVENT CARDS ======
  const renderEventCards = (eligibleEvents, type, selectedCount, maxCount) => {
    const participantSection = getParticipantSection(participantForm.standard);
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
          {type === 'single' ? 'Individual' : 'Group'} Events ({selectedCount}/{maxCount})
        </Typography>
        <Grid container spacing={2}>
          {eligibleEvents.map(event => {
            const isCross = event.section !== participantSection;
            const eventKey = isCross ? `${event._id}|cross` : event._id;
            const isSelected = selectedEvents.includes(eventKey);
            const pCount = isCross ? (eventParticipantCounts[`${event._id}_cross`] || 0) : (eventParticipantCounts[event._id] || 0);
            const maxP = isCross ? event.crossSectionMaxParticipants : event.maxParticipants;
            const isFull = pCount >= maxP;
            const isDisabled = (selectedCount >= maxCount && !isSelected) || (isFull && !isSelected);

            return (
              <Grid item xs={12} sm={6} md={4} key={`${event._id}${isCross ? '-cross' : ''}`}>
                <Paper elevation={isSelected ? 3 : 1} sx={{
                  p: 2, border: isSelected ? `2px solid ${type === 'single' ? theme.palette.primary.main : theme.palette.secondary.main}` : '1px solid #e0e0e0',
                  borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
                  bgcolor: isDisabled ? 'rgba(0,0,0,0.04)' : isSelected ? (type === 'single' ? 'rgba(37,99,235,0.05)' : 'rgba(16,185,129,0.05)') : 'white',
                  opacity: isDisabled ? 0.7 : 1
                }}>
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <Badge badgeContent={pCount} color={isCross ? 'info' : type === 'single' ? 'primary' : 'secondary'} max={99} overlap="circular">
                      {type === 'single' ? <User size={18} /> : <Users size={18} />}
                    </Badge>
                  </Box>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>{event.eventName}</Typography>
                  <Box sx={{ mb: 1 }}>
                    <Chip size="small" label={event.gender === 'male' ? 'Boys Only' : event.gender === 'female' ? 'Girls Only' : 'Boys & Girls'}
                      color={event.gender === 'male' ? 'primary' : event.gender === 'female' ? 'secondary' : 'default'} sx={{ mr: 0.5 }} />
                    <Chip size="small" label={isFull && !isSelected ? 'Full' : `${pCount}/${maxP}`} variant="outlined" color={isFull && !isSelected ? 'error' : 'default'} />
                    {isCross && <Chip size="small" label="Cross-Section" color="info" sx={{ ml: 0.5 }} />}
                  </Box>
                  {event.category && <Typography variant="caption" color="textSecondary">Category: {event.category.name}</Typography>}
                  {isCross && <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 1 }}>Home Section: {event.section}</Typography>}
                  <Box sx={{ flexGrow: 1 }} />
                  {isFull && !isSelected ? (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>Maximum limit reached</Typography>
                  ) : (
                    <FormControlLabel control={<Checkbox checked={isSelected} onChange={() => handleEventToggle(event._id, isCross)} disabled={isDisabled} />} label="Select" sx={{ mt: 1 }} />
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  // ====== STEP CONTENT ======
  const getStepContent = (step) => {
    if (step === 0) return (
      <Grid container spacing={3}>
        <Grid item xs={12}><TextField fullWidth label="Full Name" name="name" value={participantForm.name} onChange={handleInputChange} required /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required><InputLabel>Section</InputLabel>
            <Select value={sectionInDialog} onChange={e => setSectionInDialog(e.target.value)} label="Section">
              <MenuItem value=""><em>Select Section</em></MenuItem>
              {Object.entries(SECTION_CONFIG).map(([s, c]) => <MenuItem key={s} value={s}>{s} ({c.label})</MenuItem>)}
            </Select><FormHelperText>Select a section to see available classes</FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required disabled={!sectionInDialog}><InputLabel>Class/Standard</InputLabel>
            <Select name="standard" value={participantForm.standard} onChange={handleInputChange} label="Class/Standard">
              <MenuItem value=""><em>Select</em></MenuItem>
              {availableClasses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
            {participantForm.standard && <FormHelperText>Section: <strong>{getParticipantSection(participantForm.standard) || 'N/A'}</strong></FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required><InputLabel>Gender</InputLabel>
            <Select name="gender" value={participantForm.gender} onChange={handleInputChange} label="Gender">
              <MenuItem value=""><em>Select</em></MenuItem><MenuItem value="M">Male</MenuItem><MenuItem value="F">Female</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Date of Birth" name="dob" type="date" value={participantForm.dob} onChange={handleInputChange} InputLabelProps={{ shrink: true }} required />
        </Grid>
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>Section Assignment:</Typography>
            <Typography variant="body2">• Dominic Savio: IV-VI · Alphonsa: VII-IX · Saint Thomas: X-XII</Typography>
          </Alert>
        </Grid>
      </Grid>
    );

    if (step === 1) {
      const sec = getParticipantSection(participantForm.standard);
      if (!sec) return <Alert severity="error">Invalid class. Go back.</Alert>;
      const eligSingle = filterEventsByGenderAndSection(singleEvents, participantForm.gender, participantForm.standard);
      const eligGroup = filterEventsByGenderAndSection(groupEvents, participantForm.gender, participantForm.standard);
      const selSingle = selectedEvents.filter(id => { const [eid] = id.toString().split('|'); return events.find(e => e._id === eid)?.eventType === 'single'; }).length;
      const selGroup = selectedEvents.filter(id => { const [eid] = id.toString().split('|'); return events.find(e => e._id === eid)?.eventType === 'group'; }).length;
      return (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>Up to 2 individual + 1 group event for <strong>{sec}</strong> ({SECTION_CONFIG[sec].label})</Alert>
          {!eligSingle.length && !eligGroup.length ? <Alert severity="warning">No eligible events for this participant.</Alert> : (<>
            {eligSingle.length > 0 && renderEventCards(eligSingle, 'single', selSingle, 2)}
            {eligGroup.length > 0 && renderEventCards(eligGroup, 'group', selGroup, 1)}
          </>)}
        </Box>
      );
    }

    if (step === 2) {
      if (!selectedEvents.length) return <Alert severity="warning">No events selected. Go back.</Alert>;
      const details = selectedEvents.map(key => {
        const [eid, cf] = key.toString().split('|');
        const ev = events.find(e => e._id === eid);
        return ev ? { ...ev, isCrossSection: cf === 'cross' } : null;
      }).filter(Boolean);
      const sec = getParticipantSection(participantForm.standard);
      return (
        <Box>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>Participant Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="body2"><strong>Name:</strong> {participantForm.name}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2"><strong>Class:</strong> {participantForm.standard}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2"><strong>Gender:</strong> {participantForm.gender === 'M' ? 'Male' : 'Female'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2"><strong>Section:</strong> {sec}</Typography></Grid>
            </Grid>
          </Paper>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>Selected Events ({details.length})</Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            {details.map((ev, i) => (
              <Box key={`${ev._id}${ev.isCrossSection ? '_c' : ''}`} sx={{ mb: i < details.length - 1 ? 1.5 : 0, pb: i < details.length - 1 ? 1.5 : 0, borderBottom: i < details.length - 1 ? '1px solid #eee' : 'none' }}>
                <Typography variant="body2" fontWeight="500">
                  {ev.eventName}
                  <Chip size="small" label={ev.eventType === 'single' ? 'Individual' : 'Group'} color={ev.eventType === 'single' ? 'primary' : 'secondary'} sx={{ ml: 1 }} />
                  {ev.isCrossSection && <Chip size="small" label="Cross-Section" color="info" sx={{ ml: 0.5 }} />}
                </Typography>
                <Typography variant="caption" color="textSecondary">{ev.section} · {ev.gender === 'male' ? 'Boys' : ev.gender === 'female' ? 'Girls' : 'All'}</Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      );
    }
    return null;
  };

  // ====== FILTER STATS ======
  const getFilterStats = () => {
    if (!filteredParticipants.length) return null;
    const total = filteredParticipants.length;
    const singles = filteredParticipants.filter(p => p.events.some(e => e.eventType === 'single')).length;
    const groups = filteredParticipants.filter(p => p.events.some(e => e.eventType === 'group')).length;
    const cross = filteredParticipants.filter(p => p.events.some(e => e.isCrossSectionParticipation)).length;
    return (
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip label={`${total} Participants`} variant="outlined" />
        <Chip label={`${singles} Individual`} color="primary" variant="outlined" />
        <Chip label={`${groups} Group`} color="secondary" variant="outlined" />
        {cross > 0 && <Chip label={`${cross} Cross-Section`} color="info" variant="outlined" />}
      </Box>
    );
  };

  const resetFilters = () => { setSearchQuery(''); setSectionFilter('all'); setEventTypeFilter('all'); setEventNameFilter(''); setCrossSectionFilter('all'); };

  // ====== RENDER ======
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Event Registration</Typography>

          {message && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: message.includes('Error') || message.includes('Failed') || message.includes('failed') ? '#FFEBEE' : '#E8F5E9', borderRadius: 2 }}>
              <Typography sx={{ whiteSpace: 'pre-line' }}>{message}</Typography>
            </Paper>
          )}

          {!getParishId() && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <FormControl fullWidth><InputLabel>Select Parish</InputLabel>
                  <Select value={selectedParish} onChange={e => setSelectedParish(e.target.value)} label="Select Parish">
                    <MenuItem value=""><em>None</em></MenuItem>
                    {parishes.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => handleOpenDialog()} disabled={!selectedParish}>Register New Participant</Button>
            <Button variant="outlined" startIcon={<RefreshCw size={18} />} onClick={handleRefresh} disabled={!selectedParish}>Refresh</Button>
          </Box>

          {/* Summary */}
          {selectedParish && events.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Event Participation Summary</Typography>
                <Button variant="outlined" onClick={() => { setSummarySection(''); setOpenSummaryDialog(true); }} startIcon={<Info size={18} />}>View All Events</Button>
              </Box>
              <Grid container spacing={2}>
                {Object.entries(SECTION_CONFIG).map(([section, config]) => {
                  const secEvents = events.filter(e => e.section === section);
                  const singles = secEvents.filter(e => e.eventType === 'single');
                  const groups = secEvents.filter(e => e.eventType === 'group');
                  const crossEvents = events.filter(e => e.section !== section && e.allowCrossSectionParticipation && e.crossSectionAllowedSections?.includes(section));
                  if (!secEvents.length && !crossEvents.length) return null;
                  return (
                    <Grid item xs={12} sm={4} key={section}>
                      <Paper sx={{ p: 2, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="600">{section} Section</Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>{config.label}</Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" gutterBottom><strong>Events:</strong> {secEvents.length}{crossEvents.length > 0 && ` + ${crossEvents.length} Cross`}</Typography>
                          <Typography variant="body2" gutterBottom><strong>Total Participants:</strong> {
                            Object.entries(eventParticipantCounts)
                              .filter(([eid]) => secEvents.some(e => e._id === eid))
                              .reduce((sum, [, c]) => sum + c, 0)
                          }{(() => {
                            const crossCount = Object.entries(eventParticipantCounts)
                              .filter(([eid]) => eid.endsWith('_cross') && crossEvents.some(e => `${e._id}_cross` === eid))
                              .reduce((sum, [, c]) => sum + c, 0);
                            return crossCount > 0 ? ` + ${crossCount} Cross-Section` : '';
                          })()}</Typography>
                          <Grid container spacing={1} sx={{ mt: 1 }}>
                            <Grid item xs={6}><Paper variant="outlined" sx={{ p: 1, textAlign: 'center', borderColor: theme.palette.primary.main, bgcolor: 'rgba(37,99,235,0.05)' }}>
                              <Typography variant="body2" fontWeight="600" color="primary">Individual</Typography><Typography variant="h6" color="primary">{singles.length}</Typography>
                            </Paper></Grid>
                            <Grid item xs={6}><Paper variant="outlined" sx={{ p: 1, textAlign: 'center', borderColor: theme.palette.secondary.main, bgcolor: 'rgba(16,185,129,0.05)' }}>
                              <Typography variant="body2" fontWeight="600" color="secondary">Group</Typography><Typography variant="h6" color="secondary">{groups.length}</Typography>
                            </Paper></Grid>
                          </Grid>
                        </Box>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button variant="text" size="small" onClick={() => { setSummarySection(section); setOpenSummaryDialog(true); }} endIcon={<ChevronDown size={16} />} sx={{ mt: 2, alignSelf: 'center' }}>View Details</Button>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {/* Participants Table */}
          {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box> : participants.length > 0 ? (<>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Registered Participants</Typography>
              <Button variant="outlined" startIcon={<RefreshCw size={18} />} onClick={resetFilters} size="small">Reset Filters</Button>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Section</InputLabel>
                <Select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} label="Section">
                  <MenuItem value="all">All Sections</MenuItem>
                  {Object.keys(SECTION_CONFIG).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Event Type</InputLabel>
                <Select value={eventTypeFilter} onChange={e => setEventTypeFilter(e.target.value)} label="Event Type">
                  <MenuItem value="all">All Types</MenuItem><MenuItem value="single">Individual</MenuItem><MenuItem value="group">Group</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Participation</InputLabel>
                <Select value={crossSectionFilter} onChange={e => setCrossSectionFilter(e.target.value)} label="Participation">
                  <MenuItem value="all">All</MenuItem><MenuItem value="home">Home Only</MenuItem><MenuItem value="cross">Cross Only</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200 }}><InputLabel>Event Name</InputLabel>
                <Select value={eventNameFilter} onChange={e => setEventNameFilter(e.target.value)} label="Event Name">
                  <MenuItem value="">All Events</MenuItem>
                  {uniqueEventNames.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField placeholder="Search..." size="small" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} sx={{ ml: 'auto', width: 250 }} />
            </Box>

            {getFilterStats()}

            {filteredParticipants.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <Typography color="textSecondary">No participants match filters.</Typography>
                <Button variant="text" onClick={resetFilters} sx={{ mt: 1 }}>Clear Filters</Button>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead><TableRow>
                    <TableCell>No.</TableCell><TableCell>Name</TableCell><TableCell>Class</TableCell><TableCell>Section</TableCell><TableCell>Gender</TableCell><TableCell>Events</TableCell><TableCell>Actions</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {filteredParticipants.map((p, i) => {
                      const ec = countEventTypes(p.events);
                      const canAdd = ec.single < 2 || ec.group < 1;
                      const sec = getParticipantSection(p.standard);
                      const crossEvts = p.events.filter(e => e.isCrossSectionParticipation);
                      return (
                        <TableRow key={p._id || i}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{p.standard}</TableCell>
                          <TableCell><Chip size="small" label={sec || 'N/A'} color={sec === 'Dominic Savio' ? 'primary' : sec === 'Alphonsa' ? 'secondary' : sec === 'Saint Thomas' ? 'info' : 'default'} variant="outlined" /></TableCell>
                          <TableCell>{p.gender === 'M' ? 'Male' : 'Female'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Chip size="small" label={`${ec.single}/2 Ind`} color={ec.single > 0 ? 'primary' : 'default'} />
                                <Chip size="small" label={`${ec.group}/1 Grp`} color={ec.group > 0 ? 'secondary' : 'default'} />
                                {crossEvts.length > 0 && <Chip size="small" label={`${crossEvts.length} Cross`} color="info" />}
                              </Box>
                              {p.events.map((ev, j) => (
                                <Box key={j} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Box>
                                    <Typography variant="body2" component="span">{ev.eventName}</Typography>
                                    {ev.eventType === 'group' && <Chip size="small" label="Group" color="secondary" sx={{ ml: 0.5 }} />}
                                    {ev.isCrossSectionParticipation && <Chip size="small" label="Cross" color="info" sx={{ ml: 0.5 }} />}
                                  </Box>
                                  <IconButton size="small" onClick={() => handleDeleteRegistration(ev.registrationId)} sx={{ ml: 1, p: 0.5 }}>
                                    <Trash2 size={16} color="rgb(220,38,38)" />
                                  </IconButton>
                                </Box>
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {canAdd && sec && <Button size="small" variant="outlined" onClick={() => handleOpenDialog(p)} startIcon={<Plus size={16} />}>Add Events</Button>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>) : selectedParish ? (
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}><Typography color="textSecondary">No participants registered yet.</Typography></Paper>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}><Typography color="textSecondary">Select a parish to begin.</Typography></Paper>
          )}
        </Paper>

        {/* Summary Dialog */}
        <Dialog open={openSummaryDialog} onClose={() => setOpenSummaryDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
            {summarySection ? `Event Summary — ${summarySection}` : "Event Participation Summary"}
            <IconButton onClick={() => setOpenSummaryDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>✕</IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}><EventParticipationSummary section={summarySection} /></DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}><Button onClick={() => setOpenSummaryDialog(false)} variant="outlined">Close</Button></DialogActions>
        </Dialog>

        {/* Registration Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
            {participantForm.name ? `Register Events for ${participantForm.name}` : "Register New Participant"}
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 1 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              <Step><StepLabel>Personal Details</StepLabel></Step>
              <Step><StepLabel>Select Events</StepLabel></Step>
              <Step><StepLabel>Confirm</StepLabel></Step>
            </Stepper>
            {getStepContent(activeStep)}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={handleCloseDialog} variant="outlined">Cancel</Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {activeStep > 0 && <Button onClick={handleBack} variant="outlined" sx={{ mr: 1 }}>Back</Button>}
            {activeStep === 2 ? (
              <Button onClick={handleSubmitRegistrations} variant="contained" disabled={isLoading || !selectedEvents.length}>
                {isLoading ? <CircularProgress size={24} /> : "Submit"}
              </Button>
            ) : <Button onClick={handleNext} variant="contained" disabled={isLoading}>Next</Button>}
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default EventRegistration;
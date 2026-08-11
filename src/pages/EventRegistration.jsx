import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axiosInstance from "../axiosConfig";
import { getParishId } from '../utils/parishAuth';
import {
  Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Grid, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  FormHelperText, Chip, FormControlLabel, Checkbox, Alert, Stepper, Step, StepLabel, Badge,
  Card, CardContent, Container
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { Trash2, Plus, RefreshCw, Info, ChevronDown, User, Users, Calendar, Award, Layers } from 'lucide-react';

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
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
  },
  shape: { borderRadius: 12 }
});

// ====== STYLED COMPONENTS (matching Home page) ======
const DashboardContainer = styled(Box)({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
  paddingTop: 24,
  paddingBottom: 40,
});

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.06)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.06)',
  }
}));

const StyledCardContent = styled(CardContent)({
  padding: '24px !important',
});

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

const ChartCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.06)',
  padding: 24,
}));

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 32,
  flexWrap: 'wrap',
  gap: 16,
});

const SectionTitle = styled(Typography)({
  fontWeight: 600,
  color: '#1a202c',
  marginBottom: 20,
  fontSize: '1.15rem',
});

// ====== CONSTANTS ======
const SECTION_CONFIG = {
  'Dominic Savio': { classes: ['IV', 'V', 'VI'], label: 'Classes IV-VI' },
  'Alphonsa': { classes: ['VII', 'VIII', 'IX'], label: 'Classes VII-IX' },
  'Saint Thomas': { classes: ['X', 'XI', 'XII'], label: 'Classes X-XII' }
};
const SECTION_REGNO_START = { 'Dominic Savio': 301, 'Alphonsa': 501, 'Saint Thomas': 701 };

const SECTION_COLORS = {
  'Dominic Savio': '#2563EB',
  'Alphonsa': '#10B981',
  'Saint Thomas': '#6366F1',
};

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

  const processRegistrations = useCallback((registrations) => {
    const grouped = {};
    registrations.forEach(reg => {
      if (!reg.event) return;
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

  // ====== COMPUTED STATISTICS ======
  const statisticsCards = useMemo(() => {
    const totalParticipants = participants.length;
    const totalEvents = events.length;
    const singleCount = events.filter(e => e.eventType === 'single').length;
    const groupCount = events.filter(e => e.eventType === 'group').length;
    const crossParticipants = participants.filter(p => p.events.some(e => e.isCrossSectionParticipation)).length;

    return [
      { title: 'Total Participants', value: totalParticipants, color: '#2563EB', icon: <Users size={24} /> },
      { title: 'Total Events', value: totalEvents, color: '#10B981', icon: <Calendar size={24} /> },
      { title: 'Individual Events', value: singleCount, color: '#6366F1', icon: <User size={24} /> },
      { title: 'Group Events', value: groupCount, color: '#F59E0B', icon: <Layers size={24} /> },
    ];
  }, [participants, events]);

  // ====== INITIAL LOAD ======
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

  // ====== PARISH CHANGE ======
  useEffect(() => {
    if (!selectedParish) { setParticipants([]); setEventParticipantCounts({}); return; }
    const load = async () => {
      setIsLoading(true);
      try {
        const [regRes, statsRes] = await Promise.all([
          axiosInstance.get(`/registrations/parish/${selectedParish}`),
          axiosInstance.get(`/api/event-stats/parish/${selectedParish}`).catch(() => ({ data: { data: { stats: [] } } }))
        ]);
        const registrations = regRes.data?.data?.registrations || regRes.data?.registrations || [];
        if (!registrations.length) {
          console.warn('Registration response shape:', JSON.stringify(Object.keys(regRes.data || {})));
        }
        setParticipants(processRegistrations(registrations));
        const countsMap = processStats(statsRes.data?.data?.stats || []);
        try {
          const crossRes = await axiosInstance.get(`/api/event-stats/parish/${selectedParish}/cross-section`);
          (crossRes.data?.data?.stats || []).forEach(s => { countsMap[`${s.eventId}_cross`] = s.participantCount; });
        } catch (e) { /* ok */ }
        setEventParticipantCounts(countsMap);
        setMessage('');
      } catch (err) {
        console.error("Parish load failed:", err.response?.status, err.response?.data || err.message);
        setMessage(`Error loading data: ${err.response?.data?.message || err.message}`);
      } finally { setIsLoading(false); }
    };
    load();
  }, [selectedParish, processRegistrations]);

  useEffect(() => {
    setAvailableClasses(sectionInDialog ? (SECTION_CONFIG[sectionInDialog]?.classes || []) : ['IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']);
  }, [sectionInDialog]);

  useEffect(() => {
    if (sectionInDialog && participantForm.standard) {
      const classes = SECTION_CONFIG[sectionInDialog]?.classes || [];
      if (!classes.includes(participantForm.standard)) setParticipantForm(prev => ({ ...prev, standard: '' }));
    }
  }, [sectionInDialog, participantForm.standard]);

  useEffect(() => {
    setUniqueEventNames([...new Set(participants.flatMap(p => p.events.map(e => e.eventName)))].sort());
  }, [participants]);

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

      const currentSingle = prev.filter(id => { const [sid] = id.toString().split('|'); return events.find(e => e._id === sid)?.eventType === 'single'; }).length;
      const currentGroup = prev.filter(id => { const [sid] = id.toString().split('|'); return events.find(e => e._id === sid)?.eventType === 'group'; }).length;
      const total = currentSingle + currentGroup;

      if (total >= 3) { setMessage("Max 3 events total"); return prev; }
      if (event.eventType === 'single' && currentSingle >= 2) { setMessage("Max 2 individual events"); return prev; }
      if (event.eventType === 'group' && currentGroup >= 2) { setMessage("Max 2 group events"); return prev; }
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

  // ====== HELPERS ======
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
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>Home Section Events</Typography>
              <TableContainer sx={{ mb: 3, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}><Table size="small"><TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Event Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  {/* <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell> */}
                  {/* <TableCell sx={{ fontWeight: 600 }}>Category</TableCell> */}
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Participants</TableCell>
                </TableRow>
              </TableHead><TableBody>
                {homeEvents.map(event => (
                  <TableRow key={event._id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                    <TableCell>{event.eventName}</TableCell>
                    <TableCell><Chip size="small" label={event.eventType === 'single' ? 'Individual' : 'Group'} color={event.eventType === 'single' ? 'primary' : 'secondary'} /></TableCell>
                    {/* <TableCell>{event.gender === 'male' ? 'Boys Only' : event.gender === 'female' ? 'Girls Only' : 'Boys & Girls'}</TableCell> */}
                    {/* <TableCell>{event.category?.name || '-'}</TableCell> */}
                    <TableCell align="right"><Badge badgeContent={eventParticipantCounts[event._id] || 0} color={event.eventType === 'single' ? 'primary' : 'secondary'} showZero>{event.eventType === 'single' ? <User size={18} /> : <Users size={18} />}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody></Table></TableContainer>
            </>)}
            {crossEvents.length > 0 && (<>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>Cross-Section Participation</Typography>
              <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}><Table size="small"><TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Event Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Home Section</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Participants</TableCell>
                </TableRow>
              </TableHead><TableBody>
                {crossEvents.map(event => (
                  <TableRow key={`cross_${event._id}`} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                    <TableCell>{event.eventName}</TableCell>
                    <TableCell>{event.section}</TableCell>
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
        <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1.5 }}>
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
                <StyledCard sx={{
                  border: isSelected
                    ? `2px solid ${type === 'single' ? theme.palette.primary.main : theme.palette.secondary.main}`
                    : '1px solid rgba(0,0,0,0.08)',
                  bgcolor: isDisabled ? 'rgba(0,0,0,0.03)' : isSelected
                    ? (type === 'single' ? 'rgba(37,99,235,0.04)' : 'rgba(16,185,129,0.04)')
                    : 'white',
                  opacity: isDisabled ? 0.65 : 1,
                  transform: isDisabled ? 'none' : undefined,
                  '&:hover': { transform: isDisabled ? 'none' : 'translateY(-2px)' }
                }}>
                  <StyledCardContent sx={{ position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                      <Badge badgeContent={pCount} color={isCross ? 'info' : type === 'single' ? 'primary' : 'secondary'} max={99} overlap="circular">
                        {type === 'single' ? <User size={18} /> : <Users size={18} />}
                      </Badge>
                    </Box>
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ pr: 4 }}>{event.eventName}</Typography>
                    <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip size="small" label={event.gender === 'male' ? 'Boys Only' : event.gender === 'female' ? 'Girls Only' : 'Boys & Girls'}
                        color={event.gender === 'male' ? 'primary' : event.gender === 'female' ? 'secondary' : 'default'} />
                      <Chip size="small" label={isFull && !isSelected ? 'Full' : `${pCount}/${maxP}`} variant="outlined" color={isFull && !isSelected ? 'error' : 'default'} />
                      {isCross && <Chip size="small" label="Cross-Section" color="info" />}
                    </Box>
                    {event.category && <Typography variant="caption" color="textSecondary">Category: {event.category.name}</Typography>}
                    {isCross && <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.5 }}>Home Section: {event.section}</Typography>}
                    <Box sx={{ mt: 1.5 }}>
                      {isFull && !isSelected ? (
                        <Typography variant="caption" color="error">Maximum limit reached</Typography>
                      ) : (
                        <FormControlLabel control={<Checkbox checked={isSelected} onChange={() => handleEventToggle(event._id, isCross)} disabled={isDisabled} />} label="Select" />
                      )}
                    </Box>
                  </StyledCardContent>
                </StyledCard>
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
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Section Assignment:</Typography>
            <Typography variant="body2">Dominic Savio: IV-VI · Alphonsa: VII-IX · Saint Thomas: X-XII</Typography>
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
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>Max 3 events: up to 2 individual + 1 group OR 1 individual + 2 group for <strong>{sec}</strong> ({SECTION_CONFIG[sec].label})</Alert>
          {!eligSingle.length && !eligGroup.length ? <Alert severity="warning">No eligible events for this participant.</Alert> : (<>
            {eligSingle.length > 0 && renderEventCards(eligSingle, 'single', selSingle, selGroup >= 2 ? 1 : 2)}
            {eligGroup.length > 0 && renderEventCards(eligGroup, 'group', selGroup, selSingle >= 2 ? 1 : 2)}
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
          <StyledCard sx={{ mb: 3 }}>
            <StyledCardContent>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>Participant Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="body2"><strong>Name:</strong> {participantForm.name}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2"><strong>Class:</strong> {participantForm.standard}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2"><strong>Gender:</strong> {participantForm.gender === 'M' ? 'Male' : 'Female'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2"><strong>Section:</strong> {sec}</Typography></Grid>
              </Grid>
            </StyledCardContent>
          </StyledCard>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>Selected Events ({details.length})</Typography>
          <StyledCard variant="outlined">
            <StyledCardContent>
              {details.map((ev, i) => (
                <Box key={`${ev._id}${ev.isCrossSection ? '_c' : ''}`} sx={{ mb: i < details.length - 1 ? 1.5 : 0, pb: i < details.length - 1 ? 1.5 : 0, borderBottom: i < details.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none' }}>
                  <Typography variant="body2" fontWeight="500">
                    {ev.eventName}
                    <Chip size="small" label={ev.eventType === 'single' ? 'Individual' : 'Group'} color={ev.eventType === 'single' ? 'primary' : 'secondary'} sx={{ ml: 1 }} />
                    {ev.isCrossSection && <Chip size="small" label="Cross-Section" color="info" sx={{ ml: 0.5 }} />}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">{ev.section} · {ev.gender === 'male' ? 'Boys' : ev.gender === 'female' ? 'Girls' : 'All'}</Typography>
                </Box>
              ))}
            </StyledCardContent>
          </StyledCard>
        </Box>
      );
    }
    return null;
  };

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
      <DashboardContainer>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            {/* Page Header */}
            <Grid item xs={12}>
              <PageHeader>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c', mb: 0.5 }}>
                    Event Registration
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Manage participant registrations for Forane Kalolsavam
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => handleOpenDialog()}
                    disabled={!selectedParish}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}
                  >
                    Register Participant
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshCw size={18} />}
                    onClick={handleRefresh}
                    disabled={!selectedParish}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    Refresh
                  </Button>
                </Box>
              </PageHeader>
            </Grid>

            {/* Error/Success Message */}
            {message && (
              <Grid item xs={12}>
                <Alert
                  severity={message.includes('Error') || message.includes('Failed') || message.includes('failed') ? 'error' : 'success'}
                  sx={{ borderRadius: 2, mb: 1 }}
                  onClose={() => setMessage('')}
                >
                  <Typography sx={{ whiteSpace: 'pre-line' }}>{message}</Typography>
                </Alert>
              </Grid>
            )}

            {/* Parish Selector (admin only) */}
            {!getParishId() && (
              <Grid item xs={12} sm={6} md={4}>
                <StyledCard>
                  <StyledCardContent>
                    <FormControl fullWidth><InputLabel>Select Parish</InputLabel>
                      <Select value={selectedParish} onChange={e => setSelectedParish(e.target.value)} label="Select Parish">
                        <MenuItem value=""><em>None</em></MenuItem>
                        {parishes.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </StyledCardContent>
                </StyledCard>
              </Grid>
            )}

            {/* Statistics Cards */}
            {statisticsCards.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <StyledCard>
                  <StyledCardContent>
                    <StatWrapper>
                      <Box>
                        <Typography variant="subtitle1" sx={{
                          color: 'text.secondary',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em'
                        }}>
                          {stat.title}
                        </Typography>
                        <StatValue>
                          {stat.value}
                        </StatValue>
                      </Box>
                      <IconBox color={stat.color}>
                        {stat.icon}
                      </IconBox>
                    </StatWrapper>
                  </StyledCardContent>
                </StyledCard>
              </Grid>
            ))}

            {/* Section Summary Cards */}
            {selectedParish && events.length > 0 && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <SectionTitle variant="h6">Section Overview</SectionTitle>
                    <Button
                      variant="outlined"
                      onClick={() => { setSummarySection(''); setOpenSummaryDialog(true); }}
                      startIcon={<Info size={18} />}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      View All Events
                    </Button>
                  </Box>
                </Grid>
                {Object.entries(SECTION_CONFIG).map(([section, config]) => {
                  const secEvents = events.filter(e => e.section === section);
                  const singles = secEvents.filter(e => e.eventType === 'single');
                  const groups = secEvents.filter(e => e.eventType === 'group');
                  const crossEvents = events.filter(e => e.section !== section && e.allowCrossSectionParticipation && e.crossSectionAllowedSections?.includes(section));
                  const sectionParticipants = participants.filter(p => getParticipantSection(p.standard) === section).length;
                  if (!secEvents.length && !crossEvents.length) return null;
                  const sColor = SECTION_COLORS[section];
                  return (
                    <Grid item xs={12} sm={6} md={4} key={section}>
                      <ChartCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>{section}</Typography>
                            <Typography variant="body2" color="textSecondary">{config.label}</Typography>
                          </Box>
                          <IconBox color={sColor}>
                            <Award size={22} />
                          </IconBox>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: `${sColor}08`, border: `1px solid ${sColor}22` }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: sColor }}>{sectionParticipants}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participants</Typography>
                          </Box>
                          <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a202c' }}>{secEvents.length}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Events</Typography>
                          </Box>
                        </Box>

                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Box sx={{ p: 1, textAlign: 'center', borderRadius: 1.5, bgcolor: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)' }}>
                              <Typography variant="body2" fontWeight="600" color="primary">{singles.length} Individual</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ p: 1, textAlign: 'center', borderRadius: 1.5, bgcolor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                              <Typography variant="body2" fontWeight="600" color="secondary">{groups.length} Group</Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {crossEvents.length > 0 && (
                          <Typography variant="caption" color="info.main" sx={{ mb: 1 }}>+ {crossEvents.length} Cross-Section events available</Typography>
                        )}

                        <Box sx={{ flexGrow: 1 }} />
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => { setSummarySection(section); setOpenSummaryDialog(true); }}
                          endIcon={<ChevronDown size={16} />}
                          sx={{ alignSelf: 'center', mt: 1, textTransform: 'none', fontWeight: 600 }}
                        >
                          View Details
                        </Button>
                      </ChartCard>
                    </Grid>
                  );
                })}
              </>
            )}

            {/* Participants Table */}
            <Grid item xs={12}>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
              ) : participants.length > 0 ? (
                <ChartCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>Registered Participants</Typography>
                    <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={resetFilters} size="small" sx={{ borderRadius: 2, textTransform: 'none' }}>Reset Filters</Button>
                  </Box>

                  {/* Filters */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
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
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography color="textSecondary" sx={{ mb: 1 }}>No participants match filters.</Typography>
                      <Button variant="text" onClick={resetFilters}>Clear Filters</Button>
                    </Box>
                  ) : (
                    <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <TableCell sx={{ fontWeight: 600 }}>No.</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Section</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Events</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredParticipants.map((p, i) => {
                            const ec = countEventTypes(p.events);
                            const canAdd = (ec.single + ec.group) < 3;
                            const sec = getParticipantSection(p.standard);
                            const crossEvts = p.events.filter(e => e.isCrossSectionParticipation);
                            return (
                              <TableRow key={p._id || i} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                <TableCell>{i + 1}</TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                                <TableCell>{p.standard}</TableCell>
                                <TableCell><Chip size="small" label={sec || 'N/A'} sx={{
                                  bgcolor: sec ? `${SECTION_COLORS[sec]}15` : undefined,
                                  color: sec ? SECTION_COLORS[sec] : undefined,
                                  border: sec ? `1px solid ${SECTION_COLORS[sec]}30` : undefined,
                                  fontWeight: 600
                                }} /></TableCell>
                                <TableCell>{p.gender === 'M' ? 'Male' : 'Female'}</TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      <Chip size="small" label={`${ec.single}/2 Ind`} color={ec.single > 0 ? 'primary' : 'default'} />
                                      <Chip size="small" label={`${ec.group}/2 Grp`} color={ec.group > 0 ? 'secondary' : 'default'} />
                                      {crossEvts.length > 0 && <Chip size="small" label={`${crossEvts.length} Cross`} color="info" />}
                                    </Box>
                                    {p.events.map((ev, j) => (
                                      <Box key={j} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                          <Typography variant="body2" component="span">{ev.eventName}</Typography>
                                          {ev.eventType === 'group' && <Chip size="small" label="Group" color="secondary" sx={{ ml: 0.5 }} />}
                                          {ev.isCrossSectionParticipation && <Chip size="small" label="Cross" color="info" sx={{ ml: 0.5 }} />}
                                        </Box>
                                        <IconButton size="small" onClick={() => handleDeleteRegistration(ev.registrationId)} sx={{ ml: 1, p: 0.5, color: '#EF4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}>
                                          <Trash2 size={16} />
                                        </IconButton>
                                      </Box>
                                    ))}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  {canAdd && sec && (
                                    <Button size="small" variant="outlined" onClick={() => handleOpenDialog(p)} startIcon={<Plus size={16} />}
                                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                                      Add Events
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </ChartCard>
              ) : selectedParish ? (
                <ChartCard sx={{ textAlign: 'center', py: 6 }}>
                  <Users size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                  <Typography color="textSecondary" sx={{ fontSize: '1.05rem' }}>No participants registered yet.</Typography>
                  <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => handleOpenDialog()} sx={{ mt: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                    Register First Participant
                  </Button>
                </ChartCard>
              ) : (
                <ChartCard sx={{ textAlign: 'center', py: 6 }}>
                  <Info size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                  <Typography color="textSecondary" sx={{ fontSize: '1.05rem' }}>Select a parish to begin.</Typography>
                </ChartCard>
              )}
            </Grid>
          </Grid>
        </Container>

        {/* Summary Dialog */}
        <Dialog open={openSummaryDialog} onClose={() => setOpenSummaryDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)', pb: 2, fontWeight: 600 }}>
            {summarySection ? `Event Summary — ${summarySection}` : "Event Participation Summary"}
            <IconButton onClick={() => setOpenSummaryDialog(false)} sx={{ position: 'absolute', right: 12, top: 12 }}>✕</IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}><EventParticipationSummary section={summarySection} /></DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <Button onClick={() => setOpenSummaryDialog(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Registration Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)', pb: 2, fontWeight: 600 }}>
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
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <Button onClick={handleCloseDialog} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {activeStep > 0 && <Button onClick={handleBack} variant="outlined" sx={{ mr: 1, borderRadius: 2, textTransform: 'none' }}>Back</Button>}
            {activeStep === 2 ? (
              <Button onClick={handleSubmitRegistrations} variant="contained" disabled={isLoading || !selectedEvents.length}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 4 }}>
                {isLoading ? <CircularProgress size={24} /> : "Submit"}
              </Button>
            ) : <Button onClick={handleNext} variant="contained" disabled={isLoading} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 4 }}>Next</Button>}
          </DialogActions>
        </Dialog>
      </DashboardContainer>
    </ThemeProvider>
  );
};

export default EventRegistration;
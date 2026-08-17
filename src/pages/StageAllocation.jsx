import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Container, Typography, Button, FormControl, InputLabel, Select, MenuItem,
  Grid, CircularProgress, Chip, Alert, Snackbar, TextField, Switch,
  FormControlLabel, IconButton, Tooltip, Card, CardContent
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { Save, RefreshCw, Download, Info, Clock, Users, GripVertical,
  ArrowUp, ArrowDown, Filter, X, Layers, MapPin } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import axiosInstance from "../axiosConfig";

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

const GENDER_COLORS = {
  male: '#2563EB',
  female: '#DB2777',
  mixed: '#059669',
};

const StageAllocation = () => {
  const [foranes, setForanes] = useState([]);
  const [selectedForane, setSelectedForane] = useState('');
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showMessage, setShowMessage] = useState(false);
  const [allocations, setAllocations] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});

  const [sectionFilter, setSectionFilter] = useState('');
  const [eventNameFilter, setEventNameFilter] = useState('');
  const [showWithParticipantsOnly, setShowWithParticipantsOnly] = useState(false);

  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragSourceVenue, setDragSourceVenue] = useState(null);
  const [dragSourceIndex, setDragSourceIndex] = useState(null);

  // Initial load: parallel fetch foranes, events, categories
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const [foraneRes, eventsRes, catRes] = await Promise.allSettled([
          axiosInstance.get('/forane'),
          axiosInstance.get('/events/stage/On Stage'),
          axiosInstance.get('/categories')
        ]);
        if (foraneRes.status === 'fulfilled') {
          setForanes((foraneRes.value.data || []).filter(f => f._id === '673799a3cb9b4aa181e53fa2'));
        }
        if (eventsRes.status === 'fulfilled') {
          setEvents(eventsRes.value.data.data.events || []);
        }
        if (catRes.status === 'fulfilled') {
          setCategories(catRes.value.data.data.categories || []);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // When forane selected: parallel fetch venues, allocations, participant counts
  useEffect(() => {
    if (!selectedForane) { setVenues([]); setAllocations([]); return; }
    (async () => {
      try {
        setIsLoading(true);
        const [venueRes, allocRes, parishRes] = await Promise.allSettled([
          axiosInstance.get(`/venues/parish/${selectedForane}`),
          axiosInstance.get(`/allocations/forane/${selectedForane}`),
          axiosInstance.get(`/parish/forane/${selectedForane}`)
        ]);

        if (venueRes.status === 'fulfilled') setVenues(venueRes.value.data.data || []);
        if (allocRes.status === 'fulfilled') setAllocations(allocRes.value.data.data || []);
        else setAllocations([]);

        // Fetch participant counts in parallel per parish
        if (parishRes.status === 'fulfilled') {
          const parishes = parishRes.value.data || [];
          const eventTypesMap = {};
          events.forEach(e => { eventTypesMap[e._id] = e.eventType; });

          const statsResults = await Promise.allSettled(
            parishes.map(p => axiosInstance.get(`/api/event-stats/parish/${p._id}`))
          );

          const counts = {};
          const parishesPerEvent = {};

          statsResults.forEach(result => {
            if (result.status !== 'fulfilled') return;
            const stats = result.value.data.data.stats || [];
            const parishId = result.value.config?.url?.split('/').pop();

            stats.forEach(stat => {
              const eventId = stat.eventId;
              const eventType = eventTypesMap[eventId] || 'single';
              if (!counts[eventId]) counts[eventId] = 0;
              if (!parishesPerEvent[eventId]) parishesPerEvent[eventId] = new Set();

              if (eventType === 'single') {
                counts[eventId] += stat.participantCount;
              } else if (stat.participantCount > 0) {
                parishesPerEvent[eventId].add(parishId);
              }
            });
          });

          Object.keys(parishesPerEvent).forEach(eventId => {
            if (eventTypesMap[eventId] === 'group') {
              counts[eventId] = parishesPerEvent[eventId].size;
            }
          });

          setParticipantCounts(counts);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedForane, events]);

  const availableSections = useMemo(() =>
    [...new Set(events.map(e => e.section))].filter(Boolean).sort(),
    [events]
  );

  const categoryMinutesMap = useMemo(() => {
    const map = {};
    categories.forEach(cat => { map[cat._id] = cat.minutes || null; });
    return map;
  }, [categories]);

  const getEventMinutes = useCallback((event) => {
    if (!event?.category) return null;
    const categoryId = typeof event.category === 'object' ? event.category._id : event.category;
    return categoryMinutesMap[categoryId] || null;
  }, [categoryMinutesMap]);

  const getEventParticipantCount = useCallback((eventId) => participantCounts[eventId] || 0, [participantCounts]);

  const allocatedEventIds = useMemo(() => new Set(allocations.flatMap(a => a.eventIds)), [allocations]);

  const unallocatedEvents = useMemo(() => {
    let filtered = events.filter(e => !allocatedEventIds.has(e._id));
    if (sectionFilter) filtered = filtered.filter(e => e.section === sectionFilter);
    if (eventNameFilter) {
      const term = eventNameFilter.toLowerCase();
      filtered = filtered.filter(e => e.eventName.toLowerCase().includes(term));
    }
    if (showWithParticipantsOnly) filtered = filtered.filter(e => getEventParticipantCount(e._id) > 0);
    return filtered;
  }, [events, allocatedEventIds, sectionFilter, eventNameFilter, showWithParticipantsOnly, getEventParticipantCount]);

  const allocatedCount = useMemo(() => allocations.reduce((t, a) => t + a.eventIds.length, 0), [allocations]);

  const moveEventUp = (venueId, index) => {
    if (index === 0) return;
    const va = allocations.find(a => a.venueId === venueId);
    if (!va) return;
    const ids = [...va.eventIds];
    [ids[index], ids[index - 1]] = [ids[index - 1], ids[index]];
    setAllocations(allocations.map(a => a.venueId === venueId ? { ...a, eventIds: ids } : a));
  };

  const moveEventDown = (venueId, index) => {
    const va = allocations.find(a => a.venueId === venueId);
    if (!va || index >= va.eventIds.length - 1) return;
    const ids = [...va.eventIds];
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    setAllocations(allocations.map(a => a.venueId === venueId ? { ...a, eventIds: ids } : a));
  };

  const handleDragStart = (e, eventId, venueId, index) => {
    setDraggedEvent(eventId); setDragSourceVenue(venueId); setDragSourceIndex(index);
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const handleDrop = (e, targetVenueId, targetIndex) => {
    e.preventDefault();
    if (!draggedEvent) return;

    if (dragSourceVenue === targetVenueId) {
      const va = allocations.find(a => a.venueId === targetVenueId) || { venueId: targetVenueId, eventIds: [] };
      const ids = [...va.eventIds];
      ids.splice(dragSourceIndex, 1);
      ids.splice(targetIndex, 0, draggedEvent);
      setAllocations(prev => {
        const rest = prev.filter(a => a.venueId !== targetVenueId);
        return [...rest, { ...va, eventIds: ids }];
      });
    } else {
      const src = allocations.find(a => a.venueId === dragSourceVenue) || { venueId: dragSourceVenue, eventIds: [] };
      const dst = allocations.find(a => a.venueId === targetVenueId) || { venueId: targetVenueId, eventIds: [] };
      const srcIds = [...src.eventIds]; const dstIds = [...dst.eventIds];
      srcIds.splice(dragSourceIndex, 1);
      targetIndex !== undefined ? dstIds.splice(targetIndex, 0, draggedEvent) : dstIds.push(draggedEvent);
      setAllocations(prev => {
        const rest = prev.filter(a => a.venueId !== dragSourceVenue && a.venueId !== targetVenueId);
        return [...rest, { ...src, eventIds: srcIds }, { ...dst, eventIds: dstIds }];
      });
    }
    setDraggedEvent(null); setDragSourceVenue(null); setDragSourceIndex(null);
  };

  const handleDropToUnallocated = (e) => {
    e.preventDefault();
    if (!draggedEvent || !dragSourceVenue) return;
    const src = allocations.find(a => a.venueId === dragSourceVenue);
    if (!src) return;
    const ids = [...src.eventIds];
    ids.splice(dragSourceIndex, 1);
    setAllocations(prev => {
      const rest = prev.filter(a => a.venueId !== dragSourceVenue);
      return ids.length > 0 ? [...rest, { ...src, eventIds: ids }] : rest;
    });
    setDraggedEvent(null); setDragSourceVenue(null); setDragSourceIndex(null);
  };

  const saveAllocations = async () => {
    try {
      setIsLoading(true);
      await axiosInstance.post('/allocations', { foraneId: selectedForane, allocations });
      setMessage({ text: 'Allocations saved successfully', type: 'success' });
      setShowMessage(true);
    } catch (err) {
      console.error('Failed to save allocations', err);
      setMessage({ text: 'Error saving allocations', type: 'error' });
      setShowMessage(true);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!venues.length || !allocations.length) {
      setMessage({ text: 'No allocations to export', type: 'error' }); setShowMessage(true); return;
    }
    const doc = new jsPDF();
    const foraneName = foranes.find(f => f._id === selectedForane)?.name || 'Forane';
    doc.setFontSize(16); doc.text(`Stage Allocations - ${foraneName}`, 14, 20);
    doc.setFontSize(10); doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
    let yPos = 40;
    venues.forEach(venue => {
      const va = allocations.find(a => a.venueId === venue._id);
      if (!va || !va.eventIds.length) return;
      doc.setFontSize(14); doc.text(`Venue: ${venue.name}`, 14, yPos);
      doc.setFontSize(10); doc.text(`Capacity: ${venue.capacity}`, 14, yPos + 7);
      yPos += 15;
      const tableData = va.eventIds.map((eventId, i) => {
        const ev = events.find(e => e._id === eventId);
        if (!ev) return [i + 1, 'Unknown', 'N/A', 'N/A'];
        return [i + 1, ev.eventName,
          ev.gender === 'male' ? 'Boys' : ev.gender === 'female' ? 'Girls' : 'Mixed',
          ev.eventType === 'single' ? 'Single' : 'Group'];
      });
      autoTable(doc, {
        startY: yPos,
        head: [['No.', 'Event Name', 'Gender', 'Type']],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 10, fontStyle: 'bold' }
      });
      yPos = doc.lastAutoTable.finalY + 20;
      if (yPos > 250) { doc.addPage(); yPos = 20; }
    });
    doc.save(`${foraneName}-stage-allocations.pdf`);
  };

  const clearFilters = () => { setSectionFilter(''); setEventNameFilter(''); setShowWithParticipantsOnly(false); };

  const statisticsCards = [
    { title: 'Total Venues', value: venues.length, color: '#2563EB', icon: <MapPin size={24} /> },
    { title: 'Allocated Events', value: allocatedCount, color: '#10B981', icon: <Layers size={24} /> },
    { title: 'Unallocated', value: events.length - allocatedCount, color: '#EF4444', icon: <Filter size={24} /> },
  ];

  const renderEventCard = (event, venueId, index, showReorder, totalInVenue) => {
    const minutes = getEventMinutes(event);
    const count = getEventParticipantCount(event._id);
    const isGroup = event.eventType === 'group';
    const sColor = SECTION_COLORS[event.section] || '#6366F1';
    const gColor = GENDER_COLORS[event.gender] || '#059669';

    return (
      <Box
        key={event._id}
        draggable
        onDragStart={(e) => handleDragStart(e, event._id, venueId, index)}
        onDragOver={handleDragOver}
        onDrop={venueId !== 'unallocated' ? (e) => handleDrop(e, venueId, index) : undefined}
        sx={{
          p: 2, borderRadius: 3, cursor: 'grab',
          borderLeft: `4px solid ${gColor}`,
          bgcolor: draggedEvent === event._id ? 'rgba(37,99,235,0.05)' : 'white',
          boxShadow: draggedEvent === event._id
            ? '0 4px 12px rgba(0,0,0,0.12)'
            : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
          '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
          '&:active': { cursor: 'grabbing' },
          display: 'flex', alignItems: 'center', gap: 1,
          minWidth: venueId === 'unallocated' ? 220 : 'auto',
        }}
      >
        {showReorder && (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <IconButton size="small" onClick={() => moveEventUp(venueId, index)}
              disabled={index === 0} sx={{ p: 0.25 }}>
              <ArrowUp size={14} />
            </IconButton>
            <IconButton size="small" onClick={() => moveEventDown(venueId, index)}
              disabled={index >= totalInVenue - 1} sx={{ p: 0.25 }}>
              <ArrowDown size={14} />
            </IconButton>
          </Box>
        )}
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a202c', fontSize: '0.8rem' }}>
              {event.section} — {event.eventName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {minutes && (
                <Tooltip title={isGroup ? `${minutes} min/group` : `${minutes} min/participant`}>
                  <Chip size="small" icon={<Clock size={12} />} label={`${minutes}m`}
                    variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                </Tooltip>
              )}
              <Tooltip title={isGroup ? 'Participating Parishes' : 'Total Participants'}>
                <Chip size="small" icon={<Users size={12} />} label={count}
                  sx={{
                    height: 22, fontSize: '0.7rem', fontWeight: 600,
                    bgcolor: count > 0 ? '#10B98115' : 'rgba(0,0,0,0.04)',
                    color: count > 0 ? '#10B981' : '#94a3b8',
                    border: count > 0 ? '1px solid #10B98130' : '1px solid rgba(0,0,0,0.08)',
                  }} />
              </Tooltip>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Chip size="small"
              label={event.gender === 'male' ? 'Boys' : event.gender === 'female' ? 'Girls' : 'Mixed'}
              variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }}
              color={event.gender === 'male' ? 'primary' : event.gender === 'female' ? 'error' : 'success'} />
            <Chip size="small" label={isGroup ? 'Group' : 'Individual'}
              variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
          </Box>
        </Box>
      </Box>
    );
  };

  const renderVenueCard = (venue) => {
    const va = allocations.find(a => a.venueId === venue._id) || { venueId: venue._id, eventIds: [] };
    const totalMinutes = va.eventIds.reduce((total, eventId) => {
      const ev = events.find(e => e._id === eventId);
      if (!ev) return total;
      return total + ((getEventMinutes(ev) || 0) * getEventParticipantCount(eventId));
    }, 0);
    const timeLabel = totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
      : `${totalMinutes}m`;

    return (
      <Grid item xs={12} md={6} lg={4} key={venue._id}>
        <Box sx={{
          borderRadius: 4, overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
          height: '100%', display: 'flex', flexDirection: 'column',
        }}>
          <Box sx={{
            p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(135deg, #2563EB, #1E40AF)', color: 'white',
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{venue.name}</Typography>
            <Chip label={`Total: ${timeLabel}`} size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)' }} />
          </Box>
          <Box
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, venue._id)}
            sx={{ p: 2, minHeight: 180, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1 }}
          >
            {va.eventIds.length > 0 ? (
              va.eventIds.map((eventId, index) => {
                const ev = events.find(e => e._id === eventId);
                if (!ev) return null;
                return renderEventCard(ev, venue._id, index, true, va.eventIds.length);
              })
            ) : (
              <Box sx={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                height: 100, border: '2px dashed rgba(0,0,0,0.1)', borderRadius: 3, color: '#94a3b8'
              }}>
                <Typography variant="body2">Drag events here</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Grid>
    );
  };

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
                    Stage Allocation
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Drag and drop events to allocate them to venues
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {selectedForane && (
                    <>
                      <Button variant="outlined" startIcon={<Download size={18} />}
                        onClick={exportToPDF} disabled={!venues.length || !allocations.length}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                        Export PDF
                      </Button>
                      <Button variant="contained" startIcon={<Save size={18} />}
                        onClick={saveAllocations} disabled={isLoading}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                        Save
                      </Button>
                    </>
                  )}
                </Box>
              </PageHeader>
            </Grid>

            <Snackbar open={showMessage} autoHideDuration={6000}
              onClose={() => setShowMessage(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
              <Alert onClose={() => setShowMessage(false)} severity={message.type} variant="filled"
                sx={{ width: '100%', borderRadius: 2 }}>{message.text}</Alert>
            </Snackbar>

            {/* Forane Selector */}
            <Grid item xs={12} sm={6} md={4}>
              <StyledCard>
                <StyledCardContent>
                  <FormControl fullWidth>
                    <InputLabel>Select Forane</InputLabel>
                    <Select value={selectedForane} label="Select Forane"
                      onChange={(e) => setSelectedForane(e.target.value)}>
                      <MenuItem value=""><em>Select Forane</em></MenuItem>
                      {foranes.map(f => <MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </StyledCardContent>
              </StyledCard>
            </Grid>

            {/* Stat Cards */}
            {selectedForane && !isLoading && statisticsCards.map((stat, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
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

            {isLoading ? (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
              </Grid>
            ) : !selectedForane ? (
              <Grid item xs={12}>
                <ChartCard>
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <MapPin size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                    <Typography color="textSecondary" sx={{ fontSize: '1.05rem' }}>
                      Select a forane to begin stage allocation
                    </Typography>
                  </Box>
                </ChartCard>
              </Grid>
            ) : (
              <>
                {/* Unallocated Events */}
                <Grid item xs={12}>
                  <ChartCard>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                          Unallocated Events
                        </Typography>
                        <Chip label={`${unallocatedEvents.length} events`} size="small" sx={{
                          bgcolor: '#2563EB15', color: '#2563EB', border: '1px solid #2563EB30', fontWeight: 600
                        }} />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField size="small" label="Search Event" value={eventNameFilter}
                          onChange={(e) => setEventNameFilter(e.target.value)} sx={{ minWidth: 160 }}
                          InputProps={{
                            endAdornment: eventNameFilter && (
                              <IconButton size="small" onClick={() => setEventNameFilter('')}><X size={14} /></IconButton>
                            )
                          }} />
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <InputLabel>Section</InputLabel>
                          <Select value={sectionFilter} label="Section"
                            onChange={(e) => setSectionFilter(e.target.value)}>
                            <MenuItem value=""><em>All</em></MenuItem>
                            {availableSections.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <FormControlLabel
                          control={<Switch checked={showWithParticipantsOnly} size="small"
                            onChange={(e) => setShowWithParticipantsOnly(e.target.checked)} />}
                          label={<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>With Participants</Typography>}
                        />
                        {(sectionFilter || eventNameFilter || showWithParticipantsOnly) && (
                          <Button size="small" variant="outlined" onClick={clearFilters}
                            startIcon={<X size={14} />}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                            Clear
                          </Button>
                        )}
                      </Box>
                    </Box>

                    <Box
                      onDragOver={handleDragOver}
                      onDrop={handleDropToUnallocated}
                      sx={{
                        display: 'flex', flexWrap: 'wrap', gap: 1.5, p: 2.5,
                        bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3,
                        border: '1px solid rgba(0,0,0,0.06)',
                        minHeight: 100, maxHeight: 400, overflowY: 'auto'
                      }}
                    >
                      {unallocatedEvents.length > 0 ? (
                        unallocatedEvents.map((event, i) => renderEventCard(event, 'unallocated', i, false, 0))
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', py: 3 }}>
                          <Typography color="textSecondary">
                            {(sectionFilter || eventNameFilter || showWithParticipantsOnly)
                              ? 'No events match the current filters'
                              : 'All events have been allocated'}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </ChartCard>
                </Grid>

                {/* Venues */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                      Venues & Allocated Events
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Info size={14} /> Drag and drop to reorder
                    </Typography>
                  </Box>
                  <Grid container spacing={3}>
                    {venues.map(venue => renderVenueCard(venue))}
                  </Grid>
                </Grid>
              </>
            )}
          </Grid>
        </Container>
      </DashboardContainer>
    </ThemeProvider>
  );
};

export default StageAllocation;
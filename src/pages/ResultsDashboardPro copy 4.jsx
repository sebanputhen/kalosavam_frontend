import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, Grid, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer,
  CircularProgress, Chip, Button, IconButton, TextField, InputAdornment, Paper, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { Award, Users, Target, BarChart3, RefreshCw, Trophy, MapPin, Layers, Music, Search, Filter, Grid3x3, X } from 'lucide-react';
import axiosInstance from "../axiosConfig";

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', light: '#3B82F6', dark: '#1E40AF' },
    secondary: { main: '#10B981', light: '#34D399', dark: '#047857' },
    info: { main: '#6366F1', light: '#818CF8', dark: '#4F46E5' },
    warning: { main: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
    background: { default: '#F0F4F8', paper: '#FFFFFF' }
  },
  typography: { fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif' },
  shape: { borderRadius: 12 }
});

// ====== STYLED COMPONENTS ======
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

// ====== CONSTANTS ======
const COLORS = ['#2563EB', '#10B981', '#6366F1', '#D97706', '#EC4899', '#0891B2', '#EA580C', '#8B5CF6', '#14B8A6', '#F43F5E'];
const SECTION_CONFIG = { 'Dominic Savio': 'Classes IV-VI', 'Alphonsa': 'Classes VII-IX', 'Saint Thomas': 'Classes X-XII' };
const DIVISION_CONFIG = [
  { key: 'A', label: 'Division A', desc: '> 500 Families', color: '#2563EB', check: n => n > 500 },
  { key: 'B', label: 'Division B', desc: '200 – 500 Families', color: '#6366F1', check: n => n >= 200 && n <= 500 },
  { key: 'C', label: 'Division C', desc: '< 200 Families', color: '#D97706', check: n => n < 200 }
];
const getParishDivision = (fc) => { const n = parseInt(fc) || 0; for (const d of DIVISION_CONFIG) { if (d.check(n)) return d.key; } return 'C'; };
const getDivConfig = (key) => DIVISION_CONFIG.find(d => d.key === key) || DIVISION_CONFIG[2];
const getEventStage = (event) => event.category?.stage || event.stage || 'Unknown';
const FORANE_ID = '673799a3cb9b4aa181e53fa2';

const printStyles = `@media print { @page{size:A4 landscape;margin:8mm} .no-print{display:none!important} nav,header,footer,aside,.MuiDrawer-root,.MuiAppBar-root,[class*="Sidebar"],[class*="Navbar"],[class*="AppBar"],[class*="drawer"],[class*="header"]{display:none!important} .print-area{position:fixed!important;left:0;top:0;width:100%;margin:0;padding:5px;box-shadow:none;background:#fff;color:#000;border:none!important;border-radius:0!important} .print-area *{visibility:visible!important;color:#000!important} }`;

const tableStyles = {
  '& th': { color: '#64748B', fontWeight: 700, borderBottom: '2px solid #E2E8F0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.5, background: '#F8FAFC' },
  '& td': { color: '#1E293B', borderBottom: '1px solid #F1F5F9', py: 1.3 }
};

const POSITION_EMOJI = { '1': '🥇', '2': '🥈', '3': '🥉' };
const POSITION_LABEL = { '1': 'First', '2': 'Second', '3': 'Third' };

const ResultsDashboardPro = () => {
  const [activeView, setActiveView] = useState('overview');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scorings, setScorings] = useState([]);
  const [events, setEvents] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [stageAllocation, setStageAllocation] = useState(null);

  // Parish detail modal state
  const [parishModalOpen, setParishModalOpen] = useState(false);
  const [selectedParishName, setSelectedParishName] = useState('');

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/event-scoring/event-scoring/forane/${FORANE_ID}/dashboard`);
      const { eventScorings, events: allEvents, parishes: allParishes, stageAllocation: sa } = res.data.data;
      setScorings(eventScorings || []); setEvents(allEvents || []); setParishes(allParishes || []); setStageAllocation(sa || null);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const parishDivisionMap = useMemo(() => { const m = {}; parishes.forEach(p => { m[p.name] = getParishDivision(p.phone); }); return m; }, [parishes]);
  const parishFamilyMap = useMemo(() => { const m = {}; parishes.forEach(p => { m[p.name] = parseInt(p.phone) || 0; }); return m; }, [parishes]);

  const allResults = useMemo(() => {
    const r = [];
    for (const s of scorings) {
      const ev = s.eventId || {};
      const eventName = ev.eventName || 'Unknown';
      const section = ev.section || s.section || '';
      const eventType = ev.eventType || '';
      if (!s.participants) continue;
      for (const p of s.participants) r.push({ ...p, eventName, section, eventType });
    }
    return r;
  }, [scorings]);

  const filteredResults = useMemo(() => {
    let r = allResults;
    if (selectedSection) r = r.filter(x => x.section === selectedSection);
    if (selectedEvent) r = r.filter(x => x.eventName === selectedEvent);
    if (selectedDivision) r = r.filter(x => parishDivisionMap[x.parish] === selectedDivision);
    return r;
  }, [allResults, selectedSection, selectedEvent, selectedDivision, parishDivisionMap]);

  const filteredUniqueEvents = useMemo(() => {
    const base = selectedSection ? allResults.filter(r => r.section === selectedSection) : allResults;
    return [...new Set(base.map(r => r.eventName))].sort();
  }, [allResults, selectedSection]);

  const availableStages = useMemo(() => [...new Set(events.map(e => getEventStage(e)))].filter(s => s !== 'Unknown').sort(), [events]);

  const buildStandings = (results) => {
    const map = {};
    for (const r of results) {
      const p = r.parish || 'Unknown';
      let m = map[p];
      if (!m) { m = { parish: p, totalPoints: 0, firsts: 0, seconds: 0, thirds: 0, gradeA: 0, gradeB: 0, gradeC: 0, eventsSet: new Set() }; map[p] = m; }
      m.totalPoints += r.totalPoints || 0;
      if (r.position === '1') m.firsts++; else if (r.position === '2') m.seconds++; else if (r.position === '3') m.thirds++;
      if (r.grade === 'A') m.gradeA++; else if (r.grade === 'B') m.gradeB++; else if (r.grade === 'C') m.gradeC++;
      m.eventsSet.add(r.eventName);
    }
    return Object.values(map).map(p => ({ ...p, eventsCount: p.eventsSet.size, division: parishDivisionMap[p.parish] || 'C', families: parishFamilyMap[p.parish] || 0 })).sort((a, b) => b.totalPoints - a.totalPoints);
  };

  const parishStandings = useMemo(() => buildStandings(filteredResults), [filteredResults, parishDivisionMap, parishFamilyMap]);

  const divisionStandings = useMemo(() => {
    let base = allResults;
    if (selectedSection) base = base.filter(x => x.section === selectedSection);
    if (selectedEvent) base = base.filter(x => x.eventName === selectedEvent);
    const all = buildStandings(base); const result = {};
    DIVISION_CONFIG.forEach(d => { result[d.key] = all.filter(p => p.division === d.key); });
    return result;
  }, [allResults, selectedSection, selectedEvent, parishDivisionMap, parishFamilyMap]);

  const eventResults = useMemo(() => {
    if (activeView !== 'events') return [];
    const map = {};
    filteredResults.forEach(r => {
      if (!map[r.eventName]) map[r.eventName] = { eventName: r.eventName, section: r.section, eventType: r.eventType, winners: [] };
      if (r.position && ['1', '2', '3'].includes(r.position))
        map[r.eventName].winners.push({ position: r.position, name: r.participantType === 'Group' ? r.parish : r.participantName, parish: r.parish, grade: r.grade, totalPoints: r.totalPoints });
    });
    let result = Object.values(map).map(e => ({ ...e, winners: e.winners.sort((a, b) => +a.position - +b.position) }));
    if (searchQuery) { const q = searchQuery.toLowerCase(); result = result.filter(e => e.eventName.toLowerCase().includes(q) || e.winners.some(w => w.name.toLowerCase().includes(q) || w.parish.toLowerCase().includes(q))); }
    return result.sort((a, b) => a.section.localeCompare(b.section) || a.eventName.localeCompare(b.eventName));
  }, [filteredResults, searchQuery, activeView]);

  const sectionSummary = useMemo(() => {
    if (activeView !== 'overview' && activeView !== 'sections') return [];
    const map = {};
    allResults.forEach(r => { const s = r.section || 'Unknown'; if (!map[s]) map[s] = { section: s, scoredEvents: new Set(), totalEvents: new Set(), participants: 0, parishes: {} }; map[s].participants++; map[s].scoredEvents.add(r.eventName); if (!map[s].parishes[r.parish]) map[s].parishes[r.parish] = { parish: r.parish, totalPoints: 0 }; map[s].parishes[r.parish].totalPoints += r.totalPoints || 0; });
    events.forEach(e => { if (map[e.section]) map[e.section].totalEvents.add(e.eventName); });
    return Object.values(map).map(s => ({ ...s, totalEventsCount: s.totalEvents.size, scoredEventsCount: s.scoredEvents.size, parishStandings: Object.values(s.parishes).sort((a, b) => b.totalPoints - a.totalPoints) }));
  }, [allResults, events, activeView]);

  const stageGroupedEvents = useMemo(() => {
    if (activeView !== 'stages') return {};
    const grouped = {};
    events.forEach(e => { const stage = getEventStage(e); if (!grouped[stage]) grouped[stage] = []; grouped[stage].push(e); });
    Object.values(grouped).forEach(arr => arr.sort((a, b) => (a.section || '').localeCompare(b.section || '') || (a.eventName || '').localeCompare(b.eventName || '')));
    return grouped;
  }, [events, activeView]);

  const stageWinnersMap = useMemo(() => {
    if (activeView !== 'stages') return {};
    const eventStageMap = {};
    events.forEach(e => { eventStageMap[e.eventName] = getEventStage(e); });
    const map = {};
    allResults.forEach(r => {
      const stage = eventStageMap[r.eventName] || 'Unknown';
      if (selectedStage && stage !== selectedStage) return;
      if (r.position && ['1', '2', '3'].includes(r.position)) {
        const key = `${stage}|${r.eventName}`;
        if (!map[key]) map[key] = [];
        map[key].push({ position: r.position, name: r.participantType === 'Group' ? r.parish : r.participantName, parish: r.parish, grade: r.grade, totalPoints: r.totalPoints });
      }
    });
    return map;
  }, [allResults, events, selectedStage, activeView]);

  const venueData = useMemo(() => {
    if (activeView !== 'venues' || !stageAllocation?.venues) return [];
    const winnersLookup = {};
    allResults.forEach(r => {
      if (r.position && ['1', '2', '3'].includes(r.position)) {
        if (!winnersLookup[r.eventName]) winnersLookup[r.eventName] = [];
        winnersLookup[r.eventName].push({ position: r.position, name: r.participantType === 'Group' ? r.parish : r.participantName, parish: r.parish, grade: r.grade, totalPoints: r.totalPoints });
      }
    });
    return stageAllocation.venues.filter(v => v.venueId).map(v => {
      const venue = v.venueId;
      const venueEvents = (v.eventIds || []).filter(Boolean);
      const scoredCount = venueEvents.filter(e => winnersLookup[e.eventName]?.length > 0).length;
      const filtered = venueEvents.filter(e => (!selectedSection || e.section === selectedSection) && (!searchQuery || e.eventName?.toLowerCase().includes(searchQuery.toLowerCase())));
      return { venueId: venue._id, venueName: venue.name || 'Unknown Venue', capacity: venue.capacity || 0, totalEvents: venueEvents.length, scoredCount, events: filtered.sort((a, b) => (a.section || '').localeCompare(b.section || '') || (a.eventName || '').localeCompare(b.eventName || '')), winnersLookup };
    }).filter(v => !selectedVenue || v.venueId === selectedVenue).sort((a, b) => a.venueName.localeCompare(b.venueName));
  }, [stageAllocation, allResults, activeView, selectedSection, searchQuery, selectedVenue]);

  const availableVenues = useMemo(() => {
    if (!stageAllocation?.venues) return [];
    return stageAllocation.venues.filter(v => v.venueId).map(v => ({ id: v.venueId._id, name: v.venueId.name || 'Unknown' })).sort((a, b) => a.name.localeCompare(b.name));
  }, [stageAllocation]);

  // ====== PARISH DETAIL DATA ======
  const parishDetailData = useMemo(() => {
    if (!selectedParishName) return null;
    const results = allResults.filter(r => r.parish === selectedParishName);
    const division = parishDivisionMap[selectedParishName] || 'C';
    const families = parishFamilyMap[selectedParishName] || 0;
    const dc = getDivConfig(division);

    let totalPoints = 0, firsts = 0, seconds = 0, thirds = 0, gradeA = 0, gradeB = 0, gradeC = 0;
    const prizeList = [];
    const sectionPoints = {};

    results.forEach(r => {
      totalPoints += r.totalPoints || 0;
      if (r.position === '1') firsts++;
      else if (r.position === '2') seconds++;
      else if (r.position === '3') thirds++;
      if (r.grade === 'A') gradeA++;
      else if (r.grade === 'B') gradeB++;
      else if (r.grade === 'C') gradeC++;

      if (!sectionPoints[r.section]) sectionPoints[r.section] = 0;
      sectionPoints[r.section] += r.totalPoints || 0;

      if (r.position && ['1', '2', '3'].includes(r.position)) {
        prizeList.push({
          eventName: r.eventName,
          section: r.section,
          eventType: r.eventType,
          position: r.position,
          participantName: r.participantType === 'Group' ? 'Group' : (r.participantName || '—'),
          grade: r.grade,
          totalPoints: r.totalPoints || 0,
        });
      }
    });

    prizeList.sort((a, b) => +a.position - +b.position || a.section.localeCompare(b.section) || a.eventName.localeCompare(b.eventName));

    // Also include graded (non-prize) entries
    const gradedList = results.filter(r => !r.position || !['1', '2', '3'].includes(r.position)).map(r => ({
      eventName: r.eventName,
      section: r.section,
      eventType: r.eventType,
      participantName: r.participantType === 'Group' ? 'Group' : (r.participantName || '—'),
      grade: r.grade,
      totalPoints: r.totalPoints || 0,
    })).sort((a, b) => a.section.localeCompare(b.section) || a.eventName.localeCompare(b.eventName));

    return { division, families, dc, totalPoints, firsts, seconds, thirds, gradeA, gradeB, gradeC, prizeList, gradedList, sectionPoints, totalEntries: results.length };
  }, [selectedParishName, allResults, parishDivisionMap, parishFamilyMap]);

  const openParishModal = (parishName) => {
    setSelectedParishName(parishName);
    setParishModalOpen(true);
  };

  const closeParishModal = () => {
    setParishModalOpen(false);
    setSelectedParishName('');
  };

  // Clickable parish name component
  const ParishName = ({ name, sx = {} }) => (
    <Typography
      component="span"
      onClick={(e) => { e.stopPropagation(); openParishModal(name); }}
      sx={{
        cursor: 'pointer',
        fontWeight: 'inherit',
        fontSize: 'inherit',
        color: 'inherit',
        '&:hover': { color: '#2563EB', textDecoration: 'underline' },
        ...sx,
      }}
    >
      {name}
    </Typography>
  );

  // ====== PARISH-WISE PRIZE LIST DATA ======
  const parishPrizeListData = useMemo(() => {
    if (activeView !== 'parishes') return [];
    const map = {};
    allResults.forEach(r => {
      const p = r.parish || 'Unknown';
      if (!map[p]) map[p] = { parish: p, division: parishDivisionMap[p] || 'C', families: parishFamilyMap[p] || 0, totalPoints: 0, firsts: 0, seconds: 0, thirds: 0, prizes: [], graded: [] };
      map[p].totalPoints += r.totalPoints || 0;
      const pos = String(r.position || '');
      if (pos === '1') map[p].firsts++;
      else if (pos === '2') map[p].seconds++;
      else if (pos === '3') map[p].thirds++;
      if (['1', '2', '3'].includes(pos)) {
        map[p].prizes.push({ eventName: r.eventName, section: r.section, eventType: r.eventType, position: pos, participantName: r.participantType === 'Group' ? 'Group' : (r.participantName || '—'), grade: r.grade, totalPoints: r.totalPoints || 0 });
      } else {
        map[p].graded.push({ eventName: r.eventName, section: r.section, eventType: r.eventType, participantName: r.participantType === 'Group' ? 'Group' : (r.participantName || '—'), grade: r.grade, totalPoints: r.totalPoints || 0 });
      }
    });
    let list = Object.values(map).sort((a, b) => b.totalPoints - a.totalPoints);
    list.forEach(p => {
      p.prizes.sort((a, b) => +a.position - +b.position || (a.section || '').localeCompare(b.section || '') || (a.eventName || '').localeCompare(b.eventName || ''));
      p.graded.sort((a, b) => (a.section || '').localeCompare(b.section || '') || (a.eventName || '').localeCompare(b.eventName || ''));
    });
    // Apply filters
    if (selectedSection) list = list.map(p => ({ ...p, prizes: p.prizes.filter(r => r.section === selectedSection), graded: p.graded.filter(r => r.section === selectedSection) })).filter(p => p.prizes.length > 0 || p.graded.length > 0);
    if (selectedDivision) list = list.filter(p => p.division === selectedDivision);
    if (searchQuery) { const q = searchQuery.toLowerCase(); list = list.filter(p => p.parish.toLowerCase().includes(q)); }
    return list;
  }, [allResults, activeView, parishDivisionMap, parishFamilyMap, selectedSection, selectedDivision, searchQuery]);

  const maxPoints = parishStandings[0]?.totalPoints || 1;
  const totalEvents_n = events.length;
  const scoredEventsCount = scorings.length;
  const totalParticipants = filteredResults.length;
  const totalMedals = useMemo(() => filteredResults.filter(r => r.position && ['1', '2', '3'].includes(r.position)).length, [filteredResults]);

  const views = [
    { key: 'overview', label: '📊 Overview' }, { key: 'standings', label: '🏆 Standings' },
    { key: 'events', label: '🎭 Events' }, { key: 'sections', label: '📋 Sections' },
    { key: 'stages', label: '🎤 Stages' }, { key: 'venues', label: '📍 Venues' },
    { key: 'parishes', label: '⛪ Parishes' }
  ];

  const resetFilters = () => { setSelectedSection(''); setSelectedEvent(''); setSelectedDivision(''); setSearchQuery(''); setSelectedStage(''); setSelectedVenue(''); };

  // ====== FILTER BAR ======
  const filterSelectSx = (color = '#2563EB') => ({
    minWidth: 160,
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px', background: '#fff', fontSize: '13px', fontWeight: 600,
      '& fieldset': { borderColor: `${color}30`, borderWidth: '1.5px' },
      '&:hover fieldset': { borderColor: `${color}60` },
      '&.Mui-focused fieldset': { borderColor: color, borderWidth: '2px' },
    },
    '& .MuiInputLabel-root': { fontSize: '13px', fontWeight: 600, color: '#94A3B8' },
    '& .MuiInputLabel-root.Mui-focused': { color },
    '& .MuiSelect-icon': { color: `${color}80` },
  });

  const FilterBar = ({ showSearch = false, showDivision = true, showStage = false, showVenue = false }) => (
    <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center" sx={{ mb: 2.5, p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)', backdropFilter: 'blur(8px)' }}>
      <FormControl size="small" sx={filterSelectSx('#2563EB')}>
        <InputLabel><Box display="flex" alignItems="center" gap={0.5}><Layers size={14} /> Section</Box></InputLabel>
        <Select value={selectedSection} label="⬜ Section" onChange={e => { setSelectedSection(e.target.value); setSelectedEvent(''); }}>
          <MenuItem value="">All Sections</MenuItem>
          {Object.keys(SECTION_CONFIG).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
      </FormControl>

      {showStage && (
        <FormControl size="small" sx={filterSelectSx('#10B981')}>
          <InputLabel><Box display="flex" alignItems="center" gap={0.5}><Music size={14} /> Stage</Box></InputLabel>
          <Select value={selectedStage} label="⬜ Stage" onChange={e => setSelectedStage(e.target.value)}>
            <MenuItem value="">All Stages</MenuItem>
            {availableStages.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      )}

      {showVenue && availableVenues.length > 0 && (
        <FormControl size="small" sx={filterSelectSx('#6366F1')}>
          <InputLabel><Box display="flex" alignItems="center" gap={0.5}><MapPin size={14} /> Venue</Box></InputLabel>
          <Select value={selectedVenue} label="⬜ Venue" onChange={e => setSelectedVenue(e.target.value)}>
            <MenuItem value="">All Venues</MenuItem>
            {availableVenues.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
          </Select>
        </FormControl>
      )}

      {!showStage && !showVenue && (
        <FormControl size="small" sx={filterSelectSx('#D97706')}>
          <InputLabel><Box display="flex" alignItems="center" gap={0.5}><Grid3x3 size={14} /> Event</Box></InputLabel>
          <Select value={selectedEvent} label="⬜ Event" onChange={e => setSelectedEvent(e.target.value)}>
            <MenuItem value="">All Events</MenuItem>
            {filteredUniqueEvents.map(ev => <MenuItem key={ev} value={ev}>{ev}</MenuItem>)}
          </Select>
        </FormControl>
      )}

      {showDivision && !showStage && !showVenue && (
        <FormControl size="small" sx={filterSelectSx('#EC4899')}>
          <InputLabel><Box display="flex" alignItems="center" gap={0.5}><Filter size={14} /> Division</Box></InputLabel>
          <Select value={selectedDivision} label="⬜ Division" onChange={e => setSelectedDivision(e.target.value)}>
            <MenuItem value="">All Divisions</MenuItem>
            {DIVISION_CONFIG.map(d => <MenuItem key={d.key} value={d.key}>{d.label}</MenuItem>)}
          </Select>
        </FormControl>
      )}

      {showSearch && (
        <TextField size="small" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          sx={{
            minWidth: 200,
            '& .MuiOutlinedInput-root': { borderRadius: '12px', background: '#fff', fontSize: '13px', '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' }, '&:hover fieldset': { borderColor: '#94A3B8' }, '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: '2px' } }
          }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} color="#94A3B8" /></InputAdornment> }}
        />
      )}

      {(selectedSection || selectedEvent || searchQuery || selectedDivision || selectedStage || selectedVenue) && (
        <Button size="small" onClick={resetFilters} sx={{ textTransform: 'none', color: '#EF4444', fontWeight: 600, fontSize: '12px', borderRadius: '10px', border: '1.5px solid #EF444430', px: 1.5, '&:hover': { bgcolor: '#FEF2F2', borderColor: '#EF4444' } }}>
          ✕ Clear
        </Button>
      )}

      <Box sx={{ ml: 'auto' }}>
        <IconButton onClick={fetchAllData} size="small" sx={{ border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '10px', p: 1, '&:hover': { bgcolor: '#EFF6FF', borderColor: '#2563EB' } }}><RefreshCw size={16} /></IconButton>
      </Box>
    </Box>
  );

  // ====== DIVISION BLOCK ======
  const DivisionBlock = ({ divKey, standings }) => {
    const conf = getDivConfig(divKey); const dMax = standings[0]?.totalPoints || 1; const top3 = standings.slice(0, 3);
    return (
      <ChartCard sx={{ mb: 2.5, p: 0 }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <IconBox color={conf.color} sx={{ width: 36, height: 36, borderRadius: 10 }}><Layers size={18} /></IconBox>
            <Box><Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#1a202c' }}>{conf.label}</Typography><Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{conf.desc} · {standings.length} parishes</Typography></Box>
          </Box>
          {top3[0] && <Box display="flex" alignItems="center" gap={1}><Trophy size={16} color={conf.color} /><ParishName name={top3[0].parish} sx={{ fontWeight: 700, fontSize: '14px', color: conf.color }} /></Box>}
        </Box>
        {top3.length > 0 && (
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
            <Grid container spacing={1.5}>{top3.map((p, idx) => (
              <Grid item xs={4} key={p.parish}>
                <Box onClick={() => openParishModal(p.parish)} sx={{ textAlign: 'center', p: 1.5, borderRadius: 3, cursor: 'pointer', background: idx === 0 ? `${conf.color}08` : 'rgba(0,0,0,0.02)', border: idx === 0 ? `1px solid ${conf.color}25` : '1px solid rgba(0,0,0,0.04)', '&:hover': { borderColor: conf.color, background: `${conf.color}10` } }}>
                  <Typography sx={{ fontSize: '20px', mb: 0.3 }}>{['🥇', '🥈', '🥉'][idx]}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{p.parish}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '20px', color: conf.color }}>{p.totalPoints}</Typography>
                  <Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>{p.families} families · {p.firsts}🥇{p.seconds}🥈{p.thirds}🥉</Typography>
                </Box>
              </Grid>
            ))}</Grid>
          </Box>
        )}
        <Box sx={{ p: 2.5 }}>{standings.map((p, idx) => {
          const pct = dMax > 0 ? (p.totalPoints / dMax) * 100 : 0;
          return (
            <Box key={p.parish} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.8 }}>
              <Typography sx={{ width: 22, fontWeight: 700, fontSize: '12px', color: idx < 3 ? conf.color : '#94A3B8', textAlign: 'right' }}>{idx + 1}</Typography>
              <ParishName name={p.parish} sx={{ width: 130, fontWeight: idx < 3 ? 700 : 500, fontSize: '12px', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} />
              <Box sx={{ flex: 1, height: 20, background: 'rgba(0,0,0,0.04)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: idx < 3 ? conf.color : '#CBD5E1', transition: 'width 0.8s', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 0.8 }}>
                  {pct > 25 && <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{p.totalPoints}</Typography>}
                </Box>
                {pct <= 25 && <Typography sx={{ position: 'absolute', left: `${Math.max(pct + 1, 2)}%`, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 600, color: '#64748B' }}>{p.totalPoints}</Typography>}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.3, minWidth: 60 }}>
                {p.firsts > 0 && <Typography sx={{ fontSize: '10px' }}>🥇{p.firsts}</Typography>}
                {p.seconds > 0 && <Typography sx={{ fontSize: '10px' }}>🥈{p.seconds}</Typography>}
                {p.thirds > 0 && <Typography sx={{ fontSize: '10px' }}>🥉{p.thirds}</Typography>}
              </Box>
            </Box>
          );
        })}{standings.length === 0 && <Typography sx={{ textAlign: 'center', py: 3, color: '#CBD5E1' }}>No parishes</Typography>}</Box>
      </ChartCard>
    );
  };

  // ====== EVENT TABLE ROW HELPER ======
  const EventTableRow = ({ event, idx, winnersData }) => {
    const winners = (winnersData || []).sort((a, b) => +a.position - +b.position);
    const w = pos => winners.find(x => x.position === pos);
    const isScored = winners.length > 0;
    return (
      <TableRow sx={{ bgcolor: isScored ? 'rgba(16,185,129,0.02)' : 'transparent', '&:hover': { background: 'rgba(0,0,0,0.02)' } }}>
        <TableCell sx={{ color: '#94A3B8' }}>{idx + 1}</TableCell>
        <TableCell><Box display="flex" alignItems="center" gap={0.5}><Typography sx={{ fontWeight: 600 }}>{event.eventName}</Typography>{isScored && <Chip label="✓" size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, height: 18, minWidth: 18, '& .MuiChip-label': { px: 0.5 } }} />}</Box></TableCell>
        <TableCell><Chip label={event.section} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: 600 }} /></TableCell>
        <TableCell><Chip label={event.eventType === 'group' ? 'Group' : 'Individual'} size="small" sx={{ bgcolor: event.eventType === 'group' ? '#FDF2F8' : '#ECFDF5', color: event.eventType === 'group' ? '#EC4899' : '#059669', fontSize: '11px', fontWeight: 600 }} /></TableCell>
        <TableCell><Chip label={event.gender === 'male' ? 'Boys' : event.gender === 'female' ? 'Girls' : 'All'} size="small" sx={{ fontSize: '11px', fontWeight: 600, bgcolor: event.gender === 'male' ? '#EFF6FF' : event.gender === 'female' ? '#FDF2F8' : '#F1F5F9', color: event.gender === 'male' ? '#2563EB' : event.gender === 'female' ? '#EC4899' : '#64748B' }} /></TableCell>
        {['1', '2', '3'].map(pos => { const wn = w(pos); return (
          <TableCell key={pos} align="center">{wn ? (<Box><Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{wn.name}</Typography><ParishName name={wn.parish} sx={{ fontSize: '11px', color: '#94A3B8' }} /></Box>) : <Typography sx={{ color: '#E2E8F0' }}>—</Typography>}</TableCell>
        ); })}
      </TableRow>
    );
  };

  // ====== PARISH DETAIL MODAL ======
  const ParishDetailModal = () => {
    if (!parishDetailData) return null;
    const d = parishDetailData;
    return (
      <Dialog open={parishModalOpen} onClose={closeParishModal} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 4, maxHeight: '90vh' } }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ background: `linear-gradient(135deg, ${d.dc.color} 0%, ${d.dc.color}CC 100%)`, p: 3, color: '#fff', position: 'relative' }}>
            <IconButton onClick={closeParishModal} sx={{ position: 'absolute', right: 12, top: 12, color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}><X size={18} /></IconButton>
            <Typography sx={{ fontWeight: 900, fontSize: '24px' }}>{selectedParishName}</Typography>
            <Box display="flex" gap={2} mt={1} flexWrap="wrap">
              <Chip label={d.dc.label} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }} />
              {d.families > 0 && <Typography sx={{ fontSize: '13px', opacity: 0.9 }}>{d.families} Families</Typography>}
            </Box>
            {/* Summary stats row */}
            <Box display="flex" gap={3} mt={2} flexWrap="wrap">
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 900, fontSize: '28px' }}>{d.totalPoints}</Typography>
                <Typography sx={{ fontSize: '11px', opacity: 0.8 }}>Total Points</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 900, fontSize: '28px' }}>{d.firsts + d.seconds + d.thirds}</Typography>
                <Typography sx={{ fontSize: '11px', opacity: 0.8 }}>Medals</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 900, fontSize: '28px' }}>{d.totalEntries}</Typography>
                <Typography sx={{ fontSize: '11px', opacity: 0.8 }}>Entries</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', ml: 'auto' }}>
                {d.firsts > 0 && <Typography sx={{ fontSize: '16px' }}>🥇 {d.firsts}</Typography>}
                {d.seconds > 0 && <Typography sx={{ fontSize: '16px' }}>🥈 {d.seconds}</Typography>}
                {d.thirds > 0 && <Typography sx={{ fontSize: '16px' }}>🥉 {d.thirds}</Typography>}
              </Box>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {/* Grade summary & section breakdown */}
          <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box display="flex" gap={1}>
              <Chip label={`Grade A: ${d.gradeA}`} size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700 }} />
              <Chip label={`Grade B: ${d.gradeB}`} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700 }} />
              <Chip label={`Grade C: ${d.gradeC}`} size="small" sx={{ bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700 }} />
            </Box>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {Object.entries(d.sectionPoints).sort((a, b) => b[1] - a[1]).map(([sec, pts]) => (
                <Typography key={sec} sx={{ fontSize: '12px', color: '#64748B' }}><strong>{sec}:</strong> {pts} pts</Typography>
              ))}
            </Box>
          </Box>

          {/* Prize Winners Table */}
          {d.prizeList.length > 0 && (
            <Box sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#1a202c', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Trophy size={18} color="#D97706" /> Prize Winners ({d.prizeList.length})
              </Typography>
              <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                <Table size="small" sx={tableStyles}>
                  <TableHead>
                    <TableRow>
                      <TableCell width={40}>#</TableCell>
                      <TableCell>Event</TableCell>
                      <TableCell>Section</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="center">Position</TableCell>
                      <TableCell>Participant</TableCell>
                      <TableCell align="center">Grade</TableCell>
                      <TableCell align="right">Points</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {d.prizeList.map((r, idx) => (
                      <TableRow key={idx} sx={{ '&:hover': { background: 'rgba(0,0,0,0.02)' } }}>
                        <TableCell sx={{ color: '#94A3B8' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{r.eventName}</TableCell>
                        <TableCell><Chip label={r.section} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                        <TableCell><Chip label={r.eventType === 'group' ? 'Group' : 'Individual'} size="small" sx={{ bgcolor: r.eventType === 'group' ? '#FDF2F8' : '#ECFDF5', color: r.eventType === 'group' ? '#EC4899' : '#059669', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                        <TableCell align="center">
                          <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                            <Typography sx={{ fontSize: '16px' }}>{POSITION_EMOJI[r.position]}</Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#1a202c' }}>{POSITION_LABEL[r.position]}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{r.participantName}</TableCell>
                        <TableCell align="center">
                          <Chip label={r.grade || '—'} size="small" sx={{
                            fontWeight: 700, minWidth: 28,
                            bgcolor: r.grade === 'A' ? '#ECFDF5' : r.grade === 'B' ? '#EFF6FF' : '#FFFBEB',
                            color: r.grade === 'A' ? '#059669' : r.grade === 'B' ? '#2563EB' : '#D97706',
                          }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#2563EB' }}>{r.totalPoints}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Other Graded Entries */}
          {d.gradedList.length > 0 && (
            <Box sx={{ p: 2.5, pt: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#1a202c', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Award size={18} color="#6366F1" /> Other Entries ({d.gradedList.length})
              </Typography>
              <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                <Table size="small" sx={tableStyles}>
                  <TableHead>
                    <TableRow>
                      <TableCell width={40}>#</TableCell>
                      <TableCell>Event</TableCell>
                      <TableCell>Section</TableCell>
                      <TableCell>Participant</TableCell>
                      <TableCell align="center">Grade</TableCell>
                      <TableCell align="right">Points</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {d.gradedList.map((r, idx) => (
                      <TableRow key={idx} sx={{ '&:hover': { background: 'rgba(0,0,0,0.02)' } }}>
                        <TableCell sx={{ color: '#94A3B8' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{r.eventName}</TableCell>
                        <TableCell><Chip label={r.section} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                        <TableCell>{r.participantName}</TableCell>
                        <TableCell align="center">
                          <Chip label={r.grade || '—'} size="small" sx={{
                            fontWeight: 700, minWidth: 28,
                            bgcolor: r.grade === 'A' ? '#ECFDF5' : r.grade === 'B' ? '#EFF6FF' : '#FFFBEB',
                            color: r.grade === 'A' ? '#059669' : r.grade === 'B' ? '#2563EB' : '#D97706',
                          }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{r.totalPoints}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {d.prizeList.length === 0 && d.gradedList.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ color: '#94A3B8', fontSize: '15px' }}>No results recorded yet for this parish.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={closeParishModal} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <style>{printStyles}</style>
      <DashboardContainer>
        <Container maxWidth="xl">

          {/* ====== HEADER ====== */}
          <Box className="no-print">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <StyledCard sx={{
                  background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #6366F1 100%)',
                  border: 'none', position: 'relative', overflow: 'hidden',
                }}>
                  <StyledCardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', opacity: 0.08 }}><Trophy size={120} /></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
                          <Typography sx={{ fontSize: '12px', fontWeight: 600, opacity: 0.9, letterSpacing: '1px', color: '#fff' }}>LIVE RESULTS</Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1, color: '#fff' }}>ഫൊറോന കലോത്സവം 2026</Typography>
                        <Typography sx={{ fontSize: '14px', opacity: 0.8, mt: 0.5, color: '#fff' }}>Forane Kalolsavam — Results & Analytics Dashboard</Typography>
                      </Box>
                      <IconButton onClick={fetchAllData} sx={{ color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 2 }}><RefreshCw size={18} /></IconButton>
                    </Box>
                  </StyledCardContent>
                </StyledCard>
              </Grid>

              {/* Tab Navigation */}
              <Grid item xs={12}>
                <StyledCard sx={{ p: 0.5, '&:hover': { transform: 'none' } }}>
                  <Box display="flex" gap={0.5} sx={{ overflowX: 'auto', p: 0.5 }}>
                    {views.map(v => (
                      <Button key={v.key} onClick={() => setActiveView(v.key)} disableRipple sx={{
                        flex: 1, minWidth: 'auto', px: 1.5, py: 1, borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '13px',
                        color: activeView === v.key ? '#fff' : '#64748B',
                        background: activeView === v.key ? '#2563EB' : 'transparent',
                        boxShadow: activeView === v.key ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
                        '&:hover': { background: activeView === v.key ? '#1E40AF' : 'rgba(0,0,0,0.04)' }
                      }}>{v.label}</Button>
                    ))}
                  </Box>
                </StyledCard>
              </Grid>
            </Grid>
          </Box>

          {isLoading ? <Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box> : (
            <Box className="print-area" sx={{ mt: 3 }}>

              {/* ===== OVERVIEW ===== */}
              {activeView === 'overview' && (
                <Grid container spacing={3}>
                  <Grid item xs={12}><FilterBar /></Grid>

                  {/* Stat Cards */}
                  <Grid item xs={6} md={3}>
                    <StyledCard><StyledCardContent><StatWrapper><Box>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Events</Typography>
                      <StatValue>{totalEvents_n}</StatValue>
                      <Typography variant="caption" color="textSecondary">{scoredEventsCount} scored</Typography>
                    </Box><IconBox color="#2563EB"><Target size={24} /></IconBox></StatWrapper></StyledCardContent></StyledCard>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <StyledCard><StyledCardContent><StatWrapper><Box>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Participants</Typography>
                      <StatValue>{totalParticipants}</StatValue>
                      <Typography variant="caption" color="textSecondary">entries recorded</Typography>
                    </Box><IconBox color="#6366F1"><Users size={24} /></IconBox></StatWrapper></StyledCardContent></StyledCard>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <StyledCard><StyledCardContent><StatWrapper><Box>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Parishes</Typography>
                      <StatValue>{parishStandings.length}</StatValue>
                      <Typography variant="caption" color="textSecondary">competing</Typography>
                    </Box><IconBox color="#10B981"><BarChart3 size={24} /></IconBox></StatWrapper></StyledCardContent></StyledCard>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <StyledCard><StyledCardContent><StatWrapper><Box>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Medals</Typography>
                      <StatValue>{totalMedals}</StatValue>
                      <Typography variant="caption" color="textSecondary">gold · silver · bronze</Typography>
                    </Box><IconBox color="#D97706"><Award size={24} /></IconBox></StatWrapper></StyledCardContent></StyledCard>
                  </Grid>

                  {/* Overall Rankings */}
                  <Grid item xs={12}>
                    <ChartCard>
                      <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#1a202c', mb: 2.5 }}>Overall Parish Rankings</Typography>
                      {parishStandings.map((p, idx) => {
                        const pct = maxPoints > 0 ? (p.totalPoints / maxPoints) * 100 : 0; const dc = getDivConfig(p.division);
                        return (
                          <Box key={p.parish} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <Typography sx={{ width: 22, fontWeight: 700, fontSize: '12px', color: idx < 3 ? '#2563EB' : '#94A3B8', textAlign: 'right' }}>{idx + 1}</Typography>
                            <ParishName name={p.parish} sx={{ width: 130, fontWeight: idx < 3 ? 700 : 500, fontSize: '13px', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} />
                            <Chip label={dc.label.replace('Division ', '')} size="small" sx={{ fontWeight: 700, fontSize: '10px', bgcolor: `${dc.color}12`, color: dc.color, height: 20, minWidth: 24 }} />
                            <Box sx={{ flex: 1, height: 24, background: 'rgba(0,0,0,0.04)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                              <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '6px', background: idx === 0 ? 'linear-gradient(90deg, #2563EB, #3B82F6)' : idx === 1 ? 'linear-gradient(90deg, #6366F1, #818CF8)' : idx === 2 ? 'linear-gradient(90deg, #10B981, #34D399)' : '#CBD5E1', transition: 'width 0.8s', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1 }}>
                                {pct > 20 && <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{p.totalPoints}</Typography>}
                              </Box>
                              {pct <= 20 && <Typography sx={{ position: 'absolute', left: `${pct + 1}%`, top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>{p.totalPoints}</Typography>}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5, minWidth: 65 }}>
                              {p.firsts > 0 && <Typography sx={{ fontSize: '11px' }}>🥇{p.firsts}</Typography>}
                              {p.seconds > 0 && <Typography sx={{ fontSize: '11px' }}>🥈{p.seconds}</Typography>}
                              {p.thirds > 0 && <Typography sx={{ fontSize: '11px' }}>🥉{p.thirds}</Typography>}
                            </Box>
                          </Box>
                        );
                      })}
                    </ChartCard>
                  </Grid>

                  {/* Section Progress */}
                  <Grid item xs={12}>
                    <ChartCard>
                      <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#1a202c', mb: 2.5 }}>Section Progress</Typography>
                      {sectionSummary.map((sec, i) => {
                        const pct = sec.totalEventsCount > 0 ? Math.round((sec.scoredEventsCount / sec.totalEventsCount) * 100) : 0; const topP = sec.parishStandings[0];
                        return (
                          <Box key={sec.section} sx={{ mb: 2.5 }}>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                              <Box><Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#1a202c' }}>{sec.section}</Typography><Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{SECTION_CONFIG[sec.section]}</Typography></Box>
                              <Chip label={`${pct}%`} size="small" sx={{ fontWeight: 700, bgcolor: `${COLORS[i]}15`, color: COLORS[i] }} />
                            </Box>
                            <Box sx={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.04)', mb: 0.8 }}><Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: COLORS[i], transition: 'width 1s' }} /></Box>
                            <Box display="flex" justifyContent="space-between"><Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{sec.scoredEventsCount}/{sec.totalEventsCount} events</Typography>{topP && <Typography sx={{ fontSize: '11px', fontWeight: 600, color: COLORS[i] }}>🏆 <ParishName name={topP.parish} sx={{ fontSize: '11px', fontWeight: 600, color: COLORS[i], display: 'inline' }} /></Typography>}</Box>
                          </Box>
                        );
                      })}
                    </ChartCard>
                  </Grid>
                </Grid>
              )}

              {/* ===== STANDINGS ===== */}
              {activeView === 'standings' && (
                <Box>
                  <FilterBar />
                  <ChartCard sx={{ p: 0, overflow: 'hidden' }}>
                    <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}><Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#1a202c' }}>Parish Standings {selectedDivision && `— ${getDivConfig(selectedDivision).label}`}</Typography></Box>
                    <TableContainer><Table size="small" sx={tableStyles}><TableHead><TableRow>
                      <TableCell width={50}>#</TableCell><TableCell>Parish</TableCell><TableCell>Division</TableCell><TableCell sx={{ width: '30%' }}>Points</TableCell>
                      <TableCell align="center">🥇</TableCell><TableCell align="center">🥈</TableCell><TableCell align="center">🥉</TableCell>
                      <TableCell align="center">A</TableCell><TableCell align="center">B</TableCell><TableCell align="center">C</TableCell><TableCell align="center">Events</TableCell>
                    </TableRow></TableHead><TableBody>
                      {parishStandings.map((p, idx) => {
                        const pct = maxPoints > 0 ? (p.totalPoints / maxPoints) * 100 : 0; const dc = getDivConfig(p.division);
                        return (
                          <TableRow key={p.parish} sx={{ cursor: 'pointer', '&:hover': { background: 'rgba(37,99,235,0.04)' } }} onClick={() => openParishModal(p.parish)}>
                            <TableCell><Box display="flex" alignItems="center" gap={0.5}><Typography sx={{ fontWeight: 700, fontSize: '13px', color: idx < 3 ? '#2563EB' : '#94A3B8' }}>{idx + 1}</Typography>{idx < 3 && <span>{['🥇', '🥈', '🥉'][idx]}</span>}</Box></TableCell>
                            <TableCell sx={{ fontWeight: idx < 3 ? 700 : 500, color: '#2563EB' }}>{p.parish}</TableCell>
                            <TableCell><Chip label={dc.label.replace('Division ', 'Div ')} size="small" sx={{ fontWeight: 700, fontSize: '10px', bgcolor: `${dc.color}12`, color: dc.color }} /></TableCell>
                            <TableCell><Box display="flex" alignItems="center" gap={1}><Box sx={{ flex: 1, height: 16, background: 'rgba(0,0,0,0.04)', borderRadius: '3px', overflow: 'hidden' }}><Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: idx < 3 ? '#2563EB' : '#CBD5E1' }} /></Box><Typography sx={{ fontWeight: 800, fontSize: '14px', color: '#2563EB', minWidth: 35, textAlign: 'right' }}>{p.totalPoints}</Typography></Box></TableCell>
                            <TableCell align="center" sx={{ color: '#EAB308', fontWeight: 600 }}>{p.firsts || '-'}</TableCell><TableCell align="center" sx={{ color: '#94A3B8', fontWeight: 600 }}>{p.seconds || '-'}</TableCell><TableCell align="center" sx={{ color: '#B45309', fontWeight: 600 }}>{p.thirds || '-'}</TableCell>
                            <TableCell align="center"><Chip label={p.gradeA} size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, minWidth: 28 }} /></TableCell>
                            <TableCell align="center"><Chip label={p.gradeB} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700, minWidth: 28 }} /></TableCell>
                            <TableCell align="center"><Chip label={p.gradeC} size="small" sx={{ bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700, minWidth: 28 }} /></TableCell>
                            <TableCell align="center">{p.eventsCount}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody></Table></TableContainer>
                  </ChartCard>
                </Box>
              )}

              {/* ===== EVENTS ===== */}
              {activeView === 'events' && (
                <Box>
                  <FilterBar showSearch />
                  <ChartCard sx={{ p: 0, overflow: 'hidden' }}>
                    <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#1a202c' }}>Event Results</Typography>
                      <Chip label={`${eventResults.length} events`} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 600 }} />
                    </Box>
                    <TableContainer><Table size="small" sx={tableStyles}><TableHead><TableRow>
                      <TableCell>Sl</TableCell><TableCell>Event</TableCell><TableCell>Section</TableCell><TableCell>Type</TableCell>
                      <TableCell align="center">🥇 First</TableCell><TableCell align="center">🥈 Second</TableCell><TableCell align="center">🥉 Third</TableCell>
                    </TableRow></TableHead><TableBody>
                      {eventResults.map((ev, idx) => { const w = pos => ev.winners.find(x => x.position === pos);
                        return (
                          <TableRow key={idx} sx={{ '&:hover': { background: 'rgba(0,0,0,0.02)' } }}>
                            <TableCell sx={{ color: '#94A3B8' }}>{idx + 1}</TableCell><TableCell sx={{ fontWeight: 600 }}>{ev.eventName}</TableCell>
                            <TableCell><Chip label={ev.section} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                            <TableCell><Chip label={ev.eventType === 'group' ? 'Group' : 'Individual'} size="small" sx={{ bgcolor: ev.eventType === 'group' ? '#FDF2F8' : '#ECFDF5', color: ev.eventType === 'group' ? '#EC4899' : '#059669', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                            {['1', '2', '3'].map(pos => { const wn = w(pos); return (<TableCell key={pos} align="center">{wn ? (<Box><Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{wn.name}</Typography><ParishName name={wn.parish} sx={{ fontSize: '11px', color: '#94A3B8' }} /></Box>) : <Typography sx={{ color: '#E2E8F0' }}>—</Typography>}</TableCell>); })}
                          </TableRow>
                        );
                      })}
                      {eventResults.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: '#CBD5E1' }}>No results found</TableCell></TableRow>}
                    </TableBody></Table></TableContainer>
                  </ChartCard>
                </Box>
              )}

              {/* ===== SECTIONS ===== */}
              {activeView === 'sections' && (
                <Box>
                  <Grid container spacing={3} sx={{ mb: 3 }}>{sectionSummary.map((sec, i) => {
                    const pct = sec.totalEventsCount > 0 ? Math.round((sec.scoredEventsCount / sec.totalEventsCount) * 100) : 0; const top = sec.parishStandings.slice(0, 3);
                    return (
                      <Grid item xs={12} md={4} key={sec.section}>
                        <ChartCard sx={{ height: '100%' }}>
                          <Box display="flex" justifyContent="space-between" mb={1.5}>
                            <Box><Typography sx={{ fontWeight: 800, fontSize: '18px', color: COLORS[i] }}>{sec.section}</Typography><Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{SECTION_CONFIG[sec.section]}</Typography></Box>
                            <Box sx={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${COLORS[i]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography sx={{ fontWeight: 800, fontSize: '14px', color: COLORS[i] }}>{pct}%</Typography></Box>
                          </Box>
                          <Typography sx={{ fontSize: '12px', color: '#64748B', mb: 1.5 }}>{sec.scoredEventsCount}/{sec.totalEventsCount} events · {sec.participants} participants</Typography>
                          {top.map((p, pi) => (
                            <Box key={p.parish} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                              <Typography sx={{ fontSize: '14px', width: 20 }}>{['🥇', '🥈', '🥉'][pi]}</Typography>
                              <ParishName name={p.parish} sx={{ flex: 1, fontWeight: pi === 0 ? 700 : 500, fontSize: '13px' }} />
                              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: COLORS[i] }}>{p.totalPoints}</Typography>
                            </Box>
                          ))}
                        </ChartCard>
                      </Grid>
                    );
                  })}</Grid>
                  {sectionSummary.map((sec, si) => (
                    <ChartCard key={sec.section} sx={{ p: 0, overflow: 'hidden', mb: 3 }}>
                      <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}><Typography sx={{ fontWeight: 700, color: COLORS[si], fontSize: '15px' }}>{sec.section} — Full Rankings</Typography></Box>
                      <TableContainer><Table size="small" sx={tableStyles}><TableHead><TableRow><TableCell width={60}>Rank</TableCell><TableCell>Parish</TableCell><TableCell sx={{ width: '40%' }}>Points</TableCell></TableRow></TableHead><TableBody>
                        {sec.parishStandings.map((p, idx) => { const sMax = sec.parishStandings[0]?.totalPoints || 1;
                          return (
                            <TableRow key={p.parish} sx={{ cursor: 'pointer', '&:hover': { background: 'rgba(0,0,0,0.02)' } }} onClick={() => openParishModal(p.parish)}>
                              <TableCell><Typography sx={{ fontWeight: 700, fontSize: '13px' }}>{idx + 1} {idx < 3 && ['🥇', '🥈', '🥉'][idx]}</Typography></TableCell>
                              <TableCell sx={{ fontWeight: idx < 3 ? 700 : 400, color: '#2563EB' }}>{p.parish}</TableCell>
                              <TableCell><Box display="flex" alignItems="center" gap={1}><Box sx={{ flex: 1, height: 14, background: 'rgba(0,0,0,0.04)', borderRadius: '3px', overflow: 'hidden' }}><Box sx={{ width: `${(p.totalPoints / sMax) * 100}%`, height: '100%', borderRadius: '3px', background: COLORS[si] }} /></Box><Typography sx={{ fontWeight: 700, fontSize: '13px', color: COLORS[si], minWidth: 30, textAlign: 'right' }}>{p.totalPoints}</Typography></Box></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody></Table></TableContainer>
                    </ChartCard>
                  ))}
                </Box>
              )}

              {/* ===== STAGES ===== */}
              {activeView === 'stages' && (
                <Box>
                  <FilterBar showStage showSearch />
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    {availableStages.map((stage) => {
                      const stageEvents = stageGroupedEvents[stage] || [];
                      const scoredCount = stageEvents.filter(e => stageWinnersMap[`${stage}|${e.eventName}`]?.length > 0).length;
                      const pct = stageEvents.length > 0 ? Math.round((scoredCount / stageEvents.length) * 100) : 0;
                      const stageColor = stage === 'On Stage' ? '#2563EB' : '#10B981';
                      return (
                        <Grid item xs={12} sm={6} key={stage}>
                          <StyledCard sx={{ cursor: 'pointer', border: selectedStage === stage ? `2px solid ${stageColor}` : undefined }}
                            onClick={() => setSelectedStage(selectedStage === stage ? '' : stage)}>
                            <StyledCardContent>
                              <StatWrapper>
                                <Box display="flex" alignItems="center" gap={1.5}>
                                  <IconBox color={stageColor}><Music size={22} /></IconBox>
                                  <Box><Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#1a202c' }}>{stage}</Typography><Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>{stageEvents.length} events · {scoredCount} scored</Typography></Box>
                                </Box>
                                <Box sx={{ width: 52, height: 52, borderRadius: '50%', border: `3px solid ${stageColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography sx={{ fontWeight: 800, fontSize: '15px', color: stageColor }}>{pct}%</Typography></Box>
                              </StatWrapper>
                            </StyledCardContent>
                          </StyledCard>
                        </Grid>
                      );
                    })}
                  </Grid>
                  {Object.entries(stageGroupedEvents).filter(([stage]) => !selectedStage || stage === selectedStage).map(([stage, stageEvents]) => {
                    const filtered = stageEvents.filter(e => (!selectedSection || e.section === selectedSection) && (!searchQuery || e.eventName.toLowerCase().includes(searchQuery.toLowerCase())));
                    if (!filtered.length) return null;
                    const scoredCount = filtered.filter(e => stageWinnersMap[`${stage}|${e.eventName}`]?.length > 0).length;
                    const stageColor = stage === 'On Stage' ? '#2563EB' : '#10B981';
                    return (
                      <ChartCard key={stage} sx={{ p: 0, overflow: 'hidden', mb: 3 }}>
                        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box display="flex" alignItems="center" gap={1.5}><IconBox color={stageColor} sx={{ width: 36, height: 36, borderRadius: 10 }}><Music size={18} /></IconBox><Box><Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a202c' }}>{stage}</Typography><Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{filtered.length} events · {scoredCount} scored</Typography></Box></Box>
                          <Box sx={{ display: 'flex', gap: 1 }}><Chip label={`${filtered.length} events`} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 600 }} /><Chip label={`${scoredCount} scored`} size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 600 }} /></Box>
                        </Box>
                        <TableContainer><Table size="small" sx={tableStyles}><TableHead><TableRow>
                          <TableCell>Sl</TableCell><TableCell>Event</TableCell><TableCell>Section</TableCell><TableCell>Type</TableCell><TableCell>Gender</TableCell>
                          <TableCell align="center">🥇 First</TableCell><TableCell align="center">🥈 Second</TableCell><TableCell align="center">🥉 Third</TableCell>
                        </TableRow></TableHead><TableBody>
                          {filtered.map((event, idx) => <EventTableRow key={event._id} event={event} idx={idx} winnersData={stageWinnersMap[`${stage}|${event.eventName}`]} />)}
                        </TableBody></Table></TableContainer>
                      </ChartCard>
                    );
                  })}
                </Box>
              )}

              {/* ===== VENUES ===== */}
              {activeView === 'venues' && (
                <Box>
                  <FilterBar showVenue showSearch />
                  {!stageAllocation?.venues?.length ? (
                    <ChartCard sx={{ textAlign: 'center', py: 6 }}>
                      <MapPin size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '17px', color: '#64748B', mb: 0.5 }}>No Venue Allocations</Typography>
                      <Typography sx={{ fontSize: '13px', color: '#94A3B8' }}>Stage allocations have not been set up yet.</Typography>
                    </ChartCard>
                  ) : (<>
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      {(selectedVenue ? venueData : (stageAllocation?.venues || []).filter(v => v.venueId).map((v) => {
                        const venue = v.venueId;
                        const venueEvents = (v.eventIds || []).filter(Boolean);
                        const winnersLookup = {};
                        allResults.forEach(r => { if (r.position && ['1', '2', '3'].includes(r.position)) { if (!winnersLookup[r.eventName]) winnersLookup[r.eventName] = []; winnersLookup[r.eventName].push(r); } });
                        const scoredCount = venueEvents.filter(e => winnersLookup[e.eventName]?.length > 0).length;
                        return { venueId: venue._id, venueName: venue.name, totalEvents: venueEvents.length, scoredCount, capacity: venue.capacity || 0 };
                      }).sort((a, b) => a.venueName.localeCompare(b.venueName))).map((v, i) => {
                        const pct = v.totalEvents > 0 ? Math.round((v.scoredCount / v.totalEvents) * 100) : 0;
                        const venueColor = COLORS[i % COLORS.length];
                        return (
                          <Grid item xs={12} sm={6} md={4} key={v.venueId}>
                            <StyledCard sx={{ cursor: 'pointer', border: selectedVenue === v.venueId ? `2px solid ${venueColor}` : undefined }}
                              onClick={() => setSelectedVenue(selectedVenue === v.venueId ? '' : v.venueId)}>
                              <StyledCardContent>
                                <StatWrapper>
                                  <Box display="flex" alignItems="center" gap={1.5}>
                                    <IconBox color={venueColor}><MapPin size={22} /></IconBox>
                                    <Box><Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#1a202c' }}>{v.venueName}</Typography><Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{v.totalEvents} events · {v.scoredCount} scored</Typography></Box>
                                  </Box>
                                  <Box sx={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${venueColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography sx={{ fontWeight: 800, fontSize: '14px', color: venueColor }}>{pct}%</Typography></Box>
                                </StatWrapper>
                              </StyledCardContent>
                            </StyledCard>
                          </Grid>
                        );
                      })}
                    </Grid>

                    {venueData.map((v, vi) => {
                      if (!v.events.length) return null;
                      const venueColor = COLORS[vi % COLORS.length];
                      const scoredInView = v.events.filter(e => v.winnersLookup[e.eventName]?.length > 0).length;
                      return (
                        <ChartCard key={v.venueId} sx={{ p: 0, overflow: 'hidden', mb: 3 }}>
                          <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box display="flex" alignItems="center" gap={1.5}><IconBox color={venueColor} sx={{ width: 36, height: 36, borderRadius: 10 }}><MapPin size={18} /></IconBox><Box><Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a202c' }}>{v.venueName}</Typography><Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{v.events.length} events · {scoredInView} scored{v.capacity > 0 && ` · Capacity: ${v.capacity}`}</Typography></Box></Box>
                            <Box sx={{ display: 'flex', gap: 1 }}><Chip label={`${v.events.length} events`} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 600 }} /><Chip label={`${scoredInView} scored`} size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 600 }} /></Box>
                          </Box>
                          <TableContainer><Table size="small" sx={tableStyles}><TableHead><TableRow>
                            <TableCell>Sl</TableCell><TableCell>Event</TableCell><TableCell>Section</TableCell><TableCell>Type</TableCell><TableCell>Gender</TableCell>
                            <TableCell align="center">🥇 First</TableCell><TableCell align="center">🥈 Second</TableCell><TableCell align="center">🥉 Third</TableCell>
                          </TableRow></TableHead><TableBody>
                            {v.events.map((event, idx) => <EventTableRow key={event._id} event={event} idx={idx} winnersData={v.winnersLookup[event.eventName]} />)}
                          </TableBody></Table></TableContainer>
                        </ChartCard>
                      );
                    })}
                  </>)}
                </Box>
              )}

              {/* ===== PARISHES ===== */}
              {activeView === 'parishes' && (
                <Box>
                  <FilterBar showSearch showDivision />
                  {parishPrizeListData.map((p, pi) => {
                    const dc = getDivConfig(p.division);
                    const totalMedalsP = p.firsts + p.seconds + p.thirds;
                    return (
                      <ChartCard key={p.parish} sx={{ p: 0, overflow: 'hidden', mb: 3 }}>
                        {/* Parish Header */}
                        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)', background: `linear-gradient(135deg, ${dc.color}08, ${dc.color}03)` }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: `${dc.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ fontWeight: 900, fontSize: '14px', color: dc.color }}>{pi + 1}</Typography>
                              </Box>
                              <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '17px', color: '#1a202c' }}>{p.parish}</Typography>
                                <Box display="flex" gap={1} alignItems="center">
                                  <Chip label={dc.label} size="small" sx={{ fontWeight: 700, fontSize: '10px', bgcolor: `${dc.color}12`, color: dc.color, height: 20 }} />
                                  {p.families > 0 && <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{p.families} families</Typography>}
                                </Box>
                              </Box>
                            </Box>
                            <Box display="flex" gap={2.5} alignItems="center" flexWrap="wrap">
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography sx={{ fontWeight: 900, fontSize: '22px', color: dc.color }}>{p.totalPoints}</Typography>
                                <Typography sx={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>POINTS</Typography>
                              </Box>
                              <Box display="flex" gap={1} alignItems="center">
                                {p.firsts > 0 && <Typography sx={{ fontSize: '14px' }}>🥇{p.firsts}</Typography>}
                                {p.seconds > 0 && <Typography sx={{ fontSize: '14px' }}>🥈{p.seconds}</Typography>}
                                {p.thirds > 0 && <Typography sx={{ fontSize: '14px' }}>🥉{p.thirds}</Typography>}
                              </Box>
                            </Box>
                          </Box>
                        </Box>

                        {/* Prize Winners */}
                        {p.prizes.length > 0 && (
                          <Box>
                            <Box sx={{ px: 2.5, pt: 2, pb: 0.5 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Trophy size={14} color="#D97706" /> Prize Winners ({p.prizes.length})
                              </Typography>
                            </Box>
                            <TableContainer>
                              <Table size="small" sx={tableStyles}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell width={40}>#</TableCell>
                                    <TableCell>Event</TableCell>
                                    <TableCell>Section</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell align="center">Position</TableCell>
                                    <TableCell>Participant</TableCell>
                                    <TableCell align="center">Grade</TableCell>
                                    <TableCell align="right">Points</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {p.prizes.map((r, idx) => (
                                    <TableRow key={idx} sx={{ '&:hover': { background: 'rgba(0,0,0,0.02)' } }}>
                                      <TableCell sx={{ color: '#94A3B8' }}>{idx + 1}</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>{r.eventName}</TableCell>
                                      <TableCell><Chip label={r.section} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                                      <TableCell><Chip label={r.eventType === 'group' ? 'Group' : 'Individual'} size="small" sx={{ bgcolor: r.eventType === 'group' ? '#FDF2F8' : '#ECFDF5', color: r.eventType === 'group' ? '#EC4899' : '#059669', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                                      <TableCell align="center">
                                        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                          <Typography sx={{ fontSize: '16px' }}>{POSITION_EMOJI[r.position]}</Typography>
                                          <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#1a202c' }}>{POSITION_LABEL[r.position]}</Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 500 }}>{r.participantName}</TableCell>
                                      <TableCell align="center">
                                        <Chip label={r.grade || '—'} size="small" sx={{ fontWeight: 700, minWidth: 28, bgcolor: r.grade === 'A' ? '#ECFDF5' : r.grade === 'B' ? '#EFF6FF' : '#FFFBEB', color: r.grade === 'A' ? '#059669' : r.grade === 'B' ? '#2563EB' : '#D97706' }} />
                                      </TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700, color: '#2563EB' }}>{r.totalPoints}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )}

                        {/* Other Graded Entries */}
                        {p.graded.length > 0 && (
                          <Box>
                            <Box sx={{ px: 2.5, pt: 2, pb: 0.5, borderTop: p.prizes.length > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Award size={14} color="#6366F1" /> Other Entries ({p.graded.length})
                              </Typography>
                            </Box>
                            <TableContainer>
                              <Table size="small" sx={tableStyles}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell width={40}>#</TableCell>
                                    <TableCell>Event</TableCell>
                                    <TableCell>Section</TableCell>
                                    <TableCell>Participant</TableCell>
                                    <TableCell align="center">Grade</TableCell>
                                    <TableCell align="right">Points</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {p.graded.map((r, idx) => (
                                    <TableRow key={idx} sx={{ '&:hover': { background: 'rgba(0,0,0,0.02)' } }}>
                                      <TableCell sx={{ color: '#94A3B8' }}>{idx + 1}</TableCell>
                                      <TableCell sx={{ fontWeight: 500 }}>{r.eventName}</TableCell>
                                      <TableCell><Chip label={r.section} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                                      <TableCell>{r.participantName}</TableCell>
                                      <TableCell align="center">
                                        <Chip label={r.grade || '—'} size="small" sx={{ fontWeight: 700, minWidth: 28, bgcolor: r.grade === 'A' ? '#ECFDF5' : r.grade === 'B' ? '#EFF6FF' : '#FFFBEB', color: r.grade === 'A' ? '#059669' : r.grade === 'B' ? '#2563EB' : '#D97706' }} />
                                      </TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 600 }}>{r.totalPoints}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )}
                      </ChartCard>
                    );
                  })}
                  {parishPrizeListData.length === 0 && (
                    <ChartCard sx={{ textAlign: 'center', py: 6 }}>
                      <Typography sx={{ color: '#94A3B8', fontSize: '15px' }}>No results found.</Typography>
                    </ChartCard>
                  )}
                </Box>
              )}

            </Box>
          )}
        </Container>
      </DashboardContainer>

      {/* Parish Detail Modal */}
      <ParishDetailModal />
    </ThemeProvider>
  );
};

export default ResultsDashboardPro;
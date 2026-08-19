import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Container, Typography, Grid, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer,
  CircularProgress, Chip, Button, IconButton, TextField, InputAdornment, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, Drawer, useMediaQuery, Fade, Slide
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { Award, Users, Target, BarChart3, RefreshCw, Trophy, MapPin, Layers, Music, Search, Filter, Grid3x3, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
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
  background: 'linear-gradient(160deg, #f0f4f8 0%, #e2e8f0 50%, #dbeafe 100%)',
  paddingBottom: 80, // space for bottom nav
});

const StyledCard = styled(Card)({
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.05)',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.05)',
  }
});

const GlassCard = styled(Box)({
  borderRadius: 16,
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  overflow: 'hidden',
});

const IconBox = styled(Box)(({ color }) => ({
  width: 44, height: 44, borderRadius: 12,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: `linear-gradient(135deg, ${color}20, ${color}10)`,
  border: `1px solid ${color}25`, color: color,
}));

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

const POSITION_EMOJI = { '1': '🥇', '2': '🥈', '3': '🥉' };
const POSITION_BG = { '1': 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', '2': 'linear-gradient(135deg, #F8FAFC, #F1F5F9)', '3': 'linear-gradient(135deg, #FFF7ED, #FFEDD5)' };
const POSITION_BORDER = { '1': '#FCD34D', '2': '#CBD5E1', '3': '#FDBA74' };

const printStyles = `@media print { @page{size:A4 landscape;margin:8mm} .no-print{display:none!important} .bottom-nav{display:none!important} nav,header,footer,aside,.MuiDrawer-root,.MuiAppBar-root{display:none!important} .print-area{position:fixed!important;left:0;top:0;width:100%;margin:0;padding:5px;box-shadow:none;background:#fff} }`;

const tableStyles = {
  '& th': { color: '#64748B', fontWeight: 700, borderBottom: '2px solid #E2E8F0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.5, background: '#F8FAFC', whiteSpace: 'nowrap' },
  '& td': { color: '#1E293B', borderBottom: '1px solid #F1F5F9', py: 1.2 }
};

// ====== MOBILE PRIZE CARD ======
const PrizeCard = ({ r, showParish = false, onParishClick }) => (
  <Box sx={{
    display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5,
    borderBottom: '1px solid rgba(0,0,0,0.04)',
    background: POSITION_BG[r.position] || 'transparent',
    '&:active': { background: 'rgba(0,0,0,0.03)' },
  }}>
    <Box sx={{
      minWidth: 40, height: 40, borderRadius: 10,
      background: '#fff', border: `2px solid ${POSITION_BORDER[r.position] || '#E2E8F0'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <Typography sx={{ fontSize: '16px', lineHeight: 1 }}>{POSITION_EMOJI[r.position]}</Typography>
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1a202c', lineHeight: 1.3 }}>{r.eventName}</Typography>
      <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.4}>
        <Chip label={r.section} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '9px', fontWeight: 600, height: 18 }} />
        <Chip label={r.eventType === 'group' ? 'Group' : 'Individual'} size="small" sx={{ bgcolor: r.eventType === 'group' ? '#FDF2F8' : '#ECFDF5', color: r.eventType === 'group' ? '#EC4899' : '#059669', fontSize: '9px', fontWeight: 600, height: 18 }} />
        {r.grade && <Chip label={`Grade ${r.grade}`} size="small" sx={{ fontWeight: 700, fontSize: '9px', height: 18, bgcolor: r.grade === 'A' ? '#ECFDF5' : r.grade === 'B' ? '#EFF6FF' : '#FFFBEB', color: r.grade === 'A' ? '#059669' : r.grade === 'B' ? '#2563EB' : '#D97706' }} />}
      </Box>
      {r.participantName && r.participantName !== 'Group' && (
        <Typography sx={{ fontSize: '11px', color: '#64748B', mt: 0.3 }}>{r.participantName}</Typography>
      )}
      {showParish && r.parish && onParishClick && (
        <Typography
          component="span"
          onClick={(e) => { e.stopPropagation(); onParishClick(r.parish); }}
          sx={{ fontSize: '11px', color: '#2563EB', cursor: 'pointer', '&:hover': { textDecoration: 'underline' }, mt: 0.2, display: 'inline-block' }}
        >{r.parish}</Typography>
      )}
    </Box>
    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
      <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#2563EB' }}>{r.totalPoints}</Typography>
      <Typography sx={{ fontSize: '9px', color: '#94A3B8', fontWeight: 600 }}>pts</Typography>
    </Box>
  </Box>
);

// ====== GRADED ROW ======
const GradedRow = ({ r, idx }) => (
  <Box sx={{
    display: 'flex', alignItems: 'flex-start', gap: 1.2, px: 1.5, py: 1,
    borderBottom: '1px solid rgba(0,0,0,0.03)',
    '&:active': { background: 'rgba(0,0,0,0.02)' },
  }}>
    <Typography sx={{ minWidth: 20, fontWeight: 600, fontSize: '11px', color: '#94A3B8', pt: 0.2 }}>{idx + 1}</Typography>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 600, fontSize: '12px', color: '#1a202c', lineHeight: 1.3 }}>{r.eventName}</Typography>
      <Box display="flex" gap={0.4} flexWrap="wrap" mt={0.2}>
        <Chip label={r.section} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '9px', fontWeight: 600, height: 16 }} />
        {r.grade && <Chip label={`Grade ${r.grade}`} size="small" sx={{ fontWeight: 700, fontSize: '9px', height: 16, bgcolor: r.grade === 'A' ? '#ECFDF5' : r.grade === 'B' ? '#EFF6FF' : '#FFFBEB', color: r.grade === 'A' ? '#059669' : r.grade === 'B' ? '#2563EB' : '#D97706' }} />}
      </Box>
      {r.participantName && r.participantName !== 'Group' && (
        <Typography sx={{ fontSize: '10px', color: '#64748B', mt: 0.1 }}>{r.participantName}</Typography>
      )}
    </Box>
    <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#64748B', flexShrink: 0 }}>{r.totalPoints}</Typography>
  </Box>
);

// ====== MOBILE EVENT CARD (replaces table rows on mobile) ======
const EventCard = ({ event, winners, onParishClick }) => {
  const w = pos => (winners || []).find(x => x.position === pos);
  const isScored = (winners || []).length > 0;
  return (
    <Box sx={{
      p: 1.5, borderBottom: '1px solid rgba(0,0,0,0.04)',
      background: isScored ? 'rgba(16,185,129,0.02)' : 'transparent',
      '&:active': { background: 'rgba(0,0,0,0.02)' },
    }}>
      <Box display="flex" alignItems="center" gap={1} mb={0.8}>
        <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1a202c', flex: 1 }}>{event.eventName || event.name}</Typography>
        {isScored && <Chip label="✓" size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, height: 18, minWidth: 18, '& .MuiChip-label': { px: 0.4 } }} />}
      </Box>
      <Box display="flex" gap={0.5} flexWrap="wrap" mb={isScored ? 1 : 0}>
        <Chip label={event.section} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '9px', fontWeight: 600, height: 18 }} />
        <Chip label={event.eventType === 'group' ? 'Group' : 'Individual'} size="small" sx={{ bgcolor: event.eventType === 'group' ? '#FDF2F8' : '#ECFDF5', color: event.eventType === 'group' ? '#EC4899' : '#059669', fontSize: '9px', fontWeight: 600, height: 18 }} />
        {event.gender && <Chip label={event.gender === 'male' ? 'Boys' : event.gender === 'female' ? 'Girls' : 'All'} size="small" sx={{ fontSize: '9px', fontWeight: 600, height: 18, bgcolor: '#F1F5F9', color: '#64748B' }} />}
      </Box>
      {isScored && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {['1', '2', '3'].map(pos => {
            const wn = w(pos);
            if (!wn) return null;
            return (
              <Box key={pos} sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 0.5 }}>
                <Typography sx={{ fontSize: '14px', width: 20 }}>{POSITION_EMOJI[pos]}</Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '12px', color: '#1a202c' }}>{wn.name}</Typography>
                  <Typography
                    component="span"
                    onClick={() => onParishClick?.(wn.parish)}
                    sx={{ fontSize: '10px', color: '#2563EB', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  >{wn.parish}</Typography>
                </Box>
                {wn.grade && <Chip label={wn.grade} size="small" sx={{ height: 16, fontSize: '9px', fontWeight: 700, bgcolor: wn.grade === 'A' ? '#ECFDF5' : wn.grade === 'B' ? '#EFF6FF' : '#FFFBEB', color: wn.grade === 'A' ? '#059669' : wn.grade === 'B' ? '#2563EB' : '#D97706' }} />}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

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
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [parishModalOpen, setParishModalOpen] = useState(false);
  const [selectedParishName, setSelectedParishName] = useState('');
  const [modalSectionFilter, setModalSectionFilter] = useState('');

  const isMobile = useMediaQuery('(max-width:768px)');
  const isSmall = useMediaQuery('(max-width:480px)');

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

  const buildStandings = useCallback((results) => {
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
  }, [parishDivisionMap, parishFamilyMap]);

  const parishStandings = useMemo(() => buildStandings(filteredResults), [filteredResults, buildStandings]);

  const divisionStandings = useMemo(() => {
    let base = allResults;
    if (selectedSection) base = base.filter(x => x.section === selectedSection);
    if (selectedEvent) base = base.filter(x => x.eventName === selectedEvent);
    const all = buildStandings(base); const result = {};
    DIVISION_CONFIG.forEach(d => { result[d.key] = all.filter(p => p.division === d.key); });
    return result;
  }, [allResults, selectedSection, selectedEvent, buildStandings]);

  const eventResults = useMemo(() => {
    if (activeView !== 'events') return [];
    const map = {};
    filteredResults.forEach(r => {
      if (!map[r.eventName]) map[r.eventName] = { eventName: r.eventName, section: r.section, eventType: r.eventType, winners: [] };
      if (r.position && ['1', '2', '3'].includes(r.position))
        map[r.eventName].winners.push({ position: r.position, name: r.participantType === 'Group' ? r.parish : r.participantName, parish: r.parish, grade: r.grade, totalPoints: r.totalPoints });
    });
    let result = Object.values(map).map(e => ({ ...e, winners: e.winners.sort((a, b) => +a.position - +b.position) }));
    if (searchQuery) { const q = searchQuery.toLowerCase(); result = result.filter(e => e.eventName.toLowerCase().includes(q) || e.winners.some(w => w.name?.toLowerCase().includes(q) || w.parish?.toLowerCase().includes(q))); }
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
    let results = allResults.filter(r => r.parish === selectedParishName);
    // When modal is opened with a section filter, only show that section's data
    if (modalSectionFilter) results = results.filter(r => r.section === modalSectionFilter);
    const division = parishDivisionMap[selectedParishName] || 'C';
    const families = parishFamilyMap[selectedParishName] || 0;
    const dc = getDivConfig(division);

    let totalPoints = 0, firsts = 0, seconds = 0, thirds = 0, gradeA = 0, gradeB = 0, gradeC = 0;
    const prizeList = []; const sectionPoints = {};

    results.forEach(r => {
      totalPoints += r.totalPoints || 0;
      if (r.position === '1') firsts++; else if (r.position === '2') seconds++; else if (r.position === '3') thirds++;
      if (r.grade === 'A') gradeA++; else if (r.grade === 'B') gradeB++; else if (r.grade === 'C') gradeC++;
      if (!sectionPoints[r.section]) sectionPoints[r.section] = 0;
      sectionPoints[r.section] += r.totalPoints || 0;
      if (r.position && ['1', '2', '3'].includes(r.position)) {
        prizeList.push({ eventName: r.eventName, section: r.section, eventType: r.eventType, position: r.position, participantName: r.participantType === 'Group' ? 'Group' : (r.participantName || '—'), grade: r.grade, totalPoints: r.totalPoints || 0 });
      }
    });

    prizeList.sort((a, b) => +a.position - +b.position || a.section.localeCompare(b.section) || a.eventName.localeCompare(b.eventName));

    const gradedList = results.filter(r => !r.position || !['1', '2', '3'].includes(r.position)).map(r => ({
      eventName: r.eventName, section: r.section, eventType: r.eventType, participantName: r.participantType === 'Group' ? 'Group' : (r.participantName || '—'), grade: r.grade, totalPoints: r.totalPoints || 0,
    })).sort((a, b) => a.section.localeCompare(b.section) || a.eventName.localeCompare(b.eventName));

    return { division, families, dc, totalPoints, firsts, seconds, thirds, gradeA, gradeB, gradeC, prizeList, gradedList, sectionPoints, totalEntries: results.length, filteredBySection: modalSectionFilter };
  }, [selectedParishName, allResults, parishDivisionMap, parishFamilyMap, modalSectionFilter]);

  const openParishModal = (parishName, section = '') => { setSelectedParishName(parishName); setModalSectionFilter(section); setParishModalOpen(true); };
  const closeParishModal = () => { setParishModalOpen(false); setSelectedParishName(''); setModalSectionFilter(''); };

  const ParishName = ({ name, sx = {} }) => (
    <Typography
      component="span"
      onClick={(e) => { e.stopPropagation(); openParishModal(name); }}
      sx={{ cursor: 'pointer', fontWeight: 'inherit', fontSize: 'inherit', color: 'inherit', '&:hover': { color: '#2563EB', textDecoration: 'underline' }, ...sx }}
    >{name}</Typography>
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
      if (pos === '1') map[p].firsts++; else if (pos === '2') map[p].seconds++; else if (pos === '3') map[p].thirds++;
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
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'standings', label: 'Standings', icon: '🏆' },
    { key: 'events', label: 'Events', icon: '🎭' },
    { key: 'sections', label: 'Sections', icon: '📋' },
    { key: 'stages', label: 'Stages', icon: '🎤' },
    { key: 'venues', label: 'Venues', icon: '📍' },
    { key: 'parishes', label: 'Parishes', icon: '⛪' }
  ];

  const resetFilters = () => { setSelectedSection(''); setSelectedEvent(''); setSelectedDivision(''); setSearchQuery(''); setSelectedStage(''); setSelectedVenue(''); };
  const hasFilters = selectedSection || selectedEvent || searchQuery || selectedDivision || selectedStage || selectedVenue;
  const filterCount = [selectedSection, selectedEvent, searchQuery, selectedDivision, selectedStage, selectedVenue].filter(Boolean).length;

  // ====== FILTER DRAWER (Mobile) & INLINE (Desktop) ======
  const filterSelectSx = (color = '#2563EB') => ({
    width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px', background: '#fff', fontSize: '13px', fontWeight: 600,
      '& fieldset': { borderColor: `${color}25`, borderWidth: '1.5px' },
      '&:hover fieldset': { borderColor: `${color}50` },
      '&.Mui-focused fieldset': { borderColor: color, borderWidth: '2px' },
    },
    '& .MuiInputLabel-root': { fontSize: '13px', fontWeight: 600, color: '#94A3B8' },
    '& .MuiInputLabel-root.Mui-focused': { color },
  });

  const renderFilterContent = (showSearch = false, showDivision = true, showStage = false, showVenue = false) => (
    <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1.5, flexWrap: 'wrap' }}>
      <Box sx={{ minWidth: isMobile ? '100%' : 160 }}>
        <FormControl size="small" sx={filterSelectSx('#2563EB')}>
          <InputLabel>Section</InputLabel>
          <Select value={selectedSection} label="Section" onChange={e => { setSelectedSection(e.target.value); setSelectedEvent(''); }}>
            <MenuItem value="">All Sections</MenuItem>
            {Object.keys(SECTION_CONFIG).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {showStage && (
        <Box sx={{ minWidth: isMobile ? '100%' : 160 }}>
          <FormControl size="small" sx={filterSelectSx('#10B981')}>
            <InputLabel>Stage</InputLabel>
            <Select value={selectedStage} label="Stage" onChange={e => setSelectedStage(e.target.value)}>
              <MenuItem value="">All Stages</MenuItem>
              {availableStages.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      )}

      {showVenue && availableVenues.length > 0 && (
        <Box sx={{ minWidth: isMobile ? '100%' : 160 }}>
          <FormControl size="small" sx={filterSelectSx('#6366F1')}>
            <InputLabel>Venue</InputLabel>
            <Select value={selectedVenue} label="Venue" onChange={e => setSelectedVenue(e.target.value)}>
              <MenuItem value="">All Venues</MenuItem>
              {availableVenues.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      )}

      {!showStage && !showVenue && (
        <Box sx={{ minWidth: isMobile ? '100%' : 160 }}>
          <FormControl size="small" sx={filterSelectSx('#D97706')}>
            <InputLabel>Event</InputLabel>
            <Select value={selectedEvent} label="Event" onChange={e => setSelectedEvent(e.target.value)}>
              <MenuItem value="">All Events</MenuItem>
              {filteredUniqueEvents.map(ev => <MenuItem key={ev} value={ev}>{ev}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      )}

      {showDivision && !showStage && !showVenue && (
        <Box sx={{ minWidth: isMobile ? '100%' : 160 }}>
          <FormControl size="small" sx={filterSelectSx('#EC4899')}>
            <InputLabel>Division</InputLabel>
            <Select value={selectedDivision} label="Division" onChange={e => setSelectedDivision(e.target.value)}>
              <MenuItem value="">All Divisions</MenuItem>
              {DIVISION_CONFIG.map(d => <MenuItem key={d.key} value={d.key}>{d.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      )}

      {showSearch && (
        <Box sx={{ minWidth: isMobile ? '100%' : 200 }}>
          <TextField size="small" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', background: '#fff', fontSize: '13px', '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' }, '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: '2px' } } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} color="#94A3B8" /></InputAdornment> }}
          />
        </Box>
      )}

      {hasFilters && (
        <Button size="small" onClick={resetFilters} sx={{ textTransform: 'none', color: '#EF4444', fontWeight: 600, fontSize: '12px', borderRadius: '10px', border: '1.5px solid #EF444430', px: 1.5, minHeight: 40, '&:hover': { bgcolor: '#FEF2F2', borderColor: '#EF4444' } }}>
          ✕ Clear All
        </Button>
      )}
    </Box>
  );

  const renderFilterBar = (showSearch = false, showDivision = true, showStage = false, showVenue = false) => {
    if (isMobile) {
      return (
        <Box sx={{ mb: 2 }}>
          <Box display="flex" gap={1} alignItems="center">
            <Button
              onClick={() => setFilterDrawerOpen(true)}
              size="small"
              startIcon={<SlidersHorizontal size={16} />}
              sx={{
                textTransform: 'none', fontWeight: 600, fontSize: '13px', borderRadius: '12px',
                border: hasFilters ? '1.5px solid #2563EB' : '1.5px solid rgba(0,0,0,0.1)',
                color: hasFilters ? '#2563EB' : '#64748B', px: 2, py: 0.8,
                bgcolor: hasFilters ? '#EFF6FF' : '#fff',
                '&:hover': { bgcolor: '#EFF6FF' },
              }}
            >
              Filters {filterCount > 0 && <Chip label={filterCount} size="small" sx={{ ml: 0.5, height: 18, fontSize: '10px', fontWeight: 700, bgcolor: '#2563EB', color: '#fff' }} />}
            </Button>
            {showSearch && (
              <TextField size="small" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px', background: '#fff', fontSize: '13px', height: 38, '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' }, '&.Mui-focused fieldset': { borderColor: '#2563EB' } } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search size={14} color="#94A3B8" /></InputAdornment> }}
              />
            )}
            <IconButton onClick={fetchAllData} size="small" sx={{ border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '10px', width: 38, height: 38, bgcolor: '#fff' }}><RefreshCw size={16} /></IconButton>
          </Box>
          {hasFilters && (
            <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
              {selectedSection && <Chip label={selectedSection} size="small" onDelete={() => setSelectedSection('')} sx={{ height: 24, fontSize: '11px', fontWeight: 600, bgcolor: '#EFF6FF', color: '#2563EB' }} />}
              {selectedEvent && <Chip label={selectedEvent} size="small" onDelete={() => setSelectedEvent('')} sx={{ height: 24, fontSize: '11px', fontWeight: 600, bgcolor: '#FFFBEB', color: '#D97706' }} />}
              {selectedDivision && <Chip label={getDivConfig(selectedDivision).label} size="small" onDelete={() => setSelectedDivision('')} sx={{ height: 24, fontSize: '11px', fontWeight: 600, bgcolor: '#FDF2F8', color: '#EC4899' }} />}
              {selectedStage && <Chip label={selectedStage} size="small" onDelete={() => setSelectedStage('')} sx={{ height: 24, fontSize: '11px', fontWeight: 600, bgcolor: '#ECFDF5', color: '#10B981' }} />}
              {selectedVenue && <Chip label="Venue" size="small" onDelete={() => setSelectedVenue('')} sx={{ height: 24, fontSize: '11px', fontWeight: 600, bgcolor: '#F3E8FF', color: '#7C3AED' }} />}
            </Box>
          )}

          <Drawer anchor="bottom" open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}
            PaperProps={{ sx: { borderRadius: '20px 20px 0 0', maxHeight: '70vh', p: 3 } }}>
            <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: '#CBD5E1', mx: 'auto', mb: 3 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '17px', mb: 2 }}>Filters</Typography>
            {renderFilterContent(showSearch, showDivision, showStage, showVenue)}
            <Button fullWidth variant="contained" onClick={() => setFilterDrawerOpen(false)}
              sx={{ mt: 3, textTransform: 'none', fontWeight: 600, borderRadius: '12px', py: 1.2, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1E40AF' } }}>
              Apply Filters
            </Button>
          </Drawer>
        </Box>
      );
    }

    return (
      <GlassCard sx={{ mb: 2.5, p: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <Box sx={{ flex: 1, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {renderFilterContent(showSearch, showDivision, showStage, showVenue)}
          </Box>
          <IconButton onClick={fetchAllData} size="small" sx={{ border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '10px', p: 1, '&:hover': { bgcolor: '#EFF6FF', borderColor: '#2563EB' } }}><RefreshCw size={16} /></IconButton>
        </Box>
      </GlassCard>
    );
  };

  // ====== DIVISION BLOCK ======
  const DivisionBlock = ({ divKey, standings }) => {
    const conf = getDivConfig(divKey); const dMax = standings[0]?.totalPoints || 1; const top3 = standings.slice(0, 3);
    return (
      <GlassCard sx={{ mb: 2.5 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={1.2}>
            <IconBox color={conf.color} sx={{ width: 34, height: 34, borderRadius: 9 }}><Layers size={16} /></IconBox>
            <Box><Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#1a202c' }}>{conf.label}</Typography><Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>{conf.desc} · {standings.length} parishes</Typography></Box>
          </Box>
          {top3[0] && <Typography sx={{ fontWeight: 700, fontSize: '12px', color: conf.color }}>🏆 {top3[0].parish}</Typography>}
        </Box>
        {top3.length > 0 && (
          <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
            <Grid container spacing={1}>{top3.map((p, idx) => (
              <Grid item xs={4} key={p.parish}>
                <Box onClick={() => openParishModal(p.parish)} sx={{
                  textAlign: 'center', p: 1.2, borderRadius: 3, cursor: 'pointer',
                  background: idx === 0 ? `${conf.color}08` : 'rgba(0,0,0,0.02)',
                  border: idx === 0 ? `1.5px solid ${conf.color}25` : '1px solid rgba(0,0,0,0.04)',
                  '&:active': { transform: 'scale(0.97)' }, transition: 'transform 0.1s',
                }}>
                  <Typography sx={{ fontSize: '18px', mb: 0.2 }}>{['🥇', '🥈', '🥉'][idx]}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: isSmall ? '11px' : '12px', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.parish}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '18px', color: conf.color }}>{p.totalPoints}</Typography>
                  <Typography sx={{ fontSize: '9px', color: '#94A3B8' }}>{p.firsts}🥇 {p.seconds}🥈 {p.thirds}🥉</Typography>
                </Box>
              </Grid>
            ))}</Grid>
          </Box>
        )}
        <Box sx={{ p: 2 }}>{standings.map((p, idx) => {
          const pct = dMax > 0 ? (p.totalPoints / dMax) * 100 : 0;
          return (
            <Box key={p.parish} onClick={() => openParishModal(p.parish)} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.7, cursor: 'pointer', '&:active': { opacity: 0.7 } }}>
              <Typography sx={{ width: 20, fontWeight: 700, fontSize: '11px', color: idx < 3 ? conf.color : '#94A3B8', textAlign: 'right' }}>{idx + 1}</Typography>
              <Typography sx={{ width: isSmall ? 90 : 120, fontWeight: idx < 3 ? 700 : 500, fontSize: '11px', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.parish}</Typography>
              <Box sx={{ flex: 1, height: 18, background: 'rgba(0,0,0,0.04)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: idx < 3 ? conf.color : '#CBD5E1', transition: 'width 0.6s', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 0.6 }}>
                  {pct > 28 && <Typography sx={{ fontSize: '9px', fontWeight: 700, color: '#fff' }}>{p.totalPoints}</Typography>}
                </Box>
                {pct <= 28 && <Typography sx={{ position: 'absolute', left: `${Math.max(pct + 2, 2)}%`, top: '50%', transform: 'translateY(-50%)', fontSize: '9px', fontWeight: 600, color: '#64748B' }}>{p.totalPoints}</Typography>}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.2, minWidth: isSmall ? 40 : 55 }}>
                {p.firsts > 0 && <Typography sx={{ fontSize: '9px' }}>🥇{p.firsts}</Typography>}
                {p.seconds > 0 && <Typography sx={{ fontSize: '9px' }}>🥈{p.seconds}</Typography>}
                {p.thirds > 0 && <Typography sx={{ fontSize: '9px' }}>🥉{p.thirds}</Typography>}
              </Box>
            </Box>
          );
        })}{standings.length === 0 && <Typography sx={{ textAlign: 'center', py: 3, color: '#CBD5E1', fontSize: '13px' }}>No parishes</Typography>}</Box>
      </GlassCard>
    );
  };

  // ====== PARISH DETAIL MODAL ======
  const ParishDetailModal = () => {
    if (!parishDetailData) return null;
    const d = parishDetailData;
    return (
      <Dialog open={parishModalOpen} onClose={closeParishModal} maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, maxHeight: isMobile ? '100%' : '90vh' } }}
        TransitionComponent={isMobile ? Slide : Fade}
        TransitionProps={isMobile ? { direction: 'up' } : {}}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{
            background: `linear-gradient(135deg, ${d.dc.color} 0%, ${d.dc.color}BB 100%)`,
            p: isMobile ? 2.5 : 3, color: '#fff', position: 'relative',
            paddingTop: isMobile ? 'calc(env(safe-area-inset-top) + 20px)' : 3,
          }}>
            <IconButton onClick={closeParishModal} sx={{ position: 'absolute', right: 12, top: isMobile ? 'calc(env(safe-area-inset-top) + 8px)' : 12, color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}><X size={18} /></IconButton>
            <Typography sx={{ fontWeight: 900, fontSize: isMobile ? '20px' : '24px', pr: 5 }}>{selectedParishName}</Typography>
            <Box display="flex" gap={1.5} mt={0.8} flexWrap="wrap" alignItems="center">
              <Chip label={d.dc.label} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, height: 22 }} />
              {d.families > 0 && <Typography sx={{ fontSize: '12px', opacity: 0.85 }}>{d.families} Families</Typography>}
              {d.filteredBySection && <Chip label={`Section: ${d.filteredBySection}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700, height: 22 }} />}
            </Box>
            <Box display="flex" gap={isSmall ? 2 : 3} mt={2} flexWrap="wrap">
              {[
                { val: d.totalPoints, label: 'Points' },
                { val: d.firsts + d.seconds + d.thirds, label: 'Medals' },
                { val: d.totalEntries, label: 'Entries' },
              ].map(s => (
                <Box key={s.label} sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 900, fontSize: isSmall ? '22px' : '28px' }}>{s.val}</Typography>
                  <Typography sx={{ fontSize: '10px', opacity: 0.75, fontWeight: 600 }}>{s.label}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                {d.firsts > 0 && <Typography sx={{ fontSize: '14px' }}>🥇{d.firsts}</Typography>}
                {d.seconds > 0 && <Typography sx={{ fontSize: '14px' }}>🥈{d.seconds}</Typography>}
                {d.thirds > 0 && <Typography sx={{ fontSize: '14px' }}>🥉{d.thirds}</Typography>}
              </Box>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`A: ${d.gradeA}`} size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, height: 22 }} />
            <Chip label={`B: ${d.gradeB}`} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700, height: 22 }} />
            <Chip label={`C: ${d.gradeC}`} size="small" sx={{ bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700, height: 22 }} />
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(d.sectionPoints).sort((a, b) => b[1] - a[1]).map(([sec, pts]) => (
                <Typography key={sec} sx={{ fontSize: '11px', color: '#64748B' }}><strong>{sec}:</strong> {pts}</Typography>
              ))}
            </Box>
          </Box>

          {d.prizeList.length > 0 && (
            <Box sx={{ p: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#1a202c', mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Trophy size={16} color="#D97706" /> Prize Winners ({d.prizeList.length})
              </Typography>
              <Box sx={{ borderRadius: 2.5, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                {d.prizeList.map((r, idx) => <PrizeCard key={idx} r={r} />)}
              </Box>
            </Box>
          )}

          {d.gradedList.length > 0 && (
            <Box sx={{ p: 2, pt: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#1a202c', mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Award size={16} color="#6366F1" /> Other Entries ({d.gradedList.length})
              </Typography>
              <Box sx={{ borderRadius: 2.5, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                {d.gradedList.map((r, idx) => <GradedRow key={idx} r={r} idx={idx} />)}
              </Box>
            </Box>
          )}

          {d.prizeList.length === 0 && d.gradedList.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ color: '#94A3B8', fontSize: '14px' }}>No results recorded yet.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)', paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 12px)' : undefined }}>
          <Button onClick={closeParishModal} fullWidth={isMobile} variant={isMobile ? 'contained' : 'text'} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2.5, py: isMobile ? 1.2 : undefined, bgcolor: isMobile ? '#2563EB' : undefined, '&:hover': isMobile ? { bgcolor: '#1E40AF' } : undefined }}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ====== STAT CARD COMPONENT ======
  const StatCard = ({ label, value, sub, color, icon }) => (
    <StyledCard>
      <Box sx={{ p: isMobile ? 2 : 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography sx={{ color: '#94A3B8', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</Typography>
            <Typography sx={{ fontSize: isMobile ? '1.6rem' : '2rem', fontWeight: 800, lineHeight: 1.2, mt: 0.3, color: '#1a202c' }}>{value}</Typography>
            <Typography sx={{ fontSize: '11px', color: '#94A3B8', mt: 0.2 }}>{sub}</Typography>
          </Box>
          <IconBox color={color}>{icon}</IconBox>
        </Box>
      </Box>
    </StyledCard>
  );

  return (
    <ThemeProvider theme={theme}>
      <style>{printStyles}</style>
      <DashboardContainer>
        <Container maxWidth="xl" sx={{ px: isMobile ? 1.5 : 3, pt: isMobile ? 1.5 : 3 }}>

          {/* ====== HEADER ====== */}
          <Box className="no-print">
            <StyledCard sx={{
              background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 40%, #6366F1 100%)',
              border: 'none', position: 'relative', overflow: 'hidden', mb: 2,
            }}>
              <Box sx={{ p: isMobile ? 2 : 3, position: 'relative', zIndex: 1 }}>
                <Box sx={{ position: 'absolute', right: isMobile ? -10 : 20, top: '50%', transform: 'translateY(-50%)', opacity: 0.06 }}><Trophy size={isMobile ? 80 : 120} /></Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={0.8} mb={0.3}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
                      <Typography sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', color: 'rgba(255,255,255,0.85)' }}>LIVE RESULTS</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 900, fontSize: isMobile ? '18px' : '28px', lineHeight: 1.15, color: '#fff' }}>ഫൊറോന കലോത്സവം 2026</Typography>
                    {!isMobile && <Typography sx={{ fontSize: '13px', opacity: 0.75, mt: 0.3, color: '#fff' }}>Forane Kalolsavam — Results & Analytics</Typography>}
                  </Box>
                  <IconButton onClick={fetchAllData} sx={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 2.5, width: 40, height: 40 }}><RefreshCw size={16} /></IconButton>
                </Box>
              </Box>
            </StyledCard>

            {/* Desktop Tab Navigation */}
            {!isMobile && (
              <GlassCard sx={{ p: 0.5, mb: 2 }}>
                <Box display="flex" gap={0.4}>
                  {views.map(v => (
                    <Button key={v.key} onClick={() => setActiveView(v.key)} disableRipple sx={{
                      flex: 1, minWidth: 'auto', px: 1.5, py: 0.9, borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '13px',
                      color: activeView === v.key ? '#fff' : '#64748B',
                      background: activeView === v.key ? '#2563EB' : 'transparent',
                      boxShadow: activeView === v.key ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                      '&:hover': { background: activeView === v.key ? '#1E40AF' : 'rgba(0,0,0,0.04)' }
                    }}>{v.icon} {v.label}</Button>
                  ))}
                </Box>
              </GlassCard>
            )}
          </Box>

          {isLoading ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={12} gap={2}>
              <CircularProgress size={36} sx={{ color: '#2563EB' }} />
              <Typography sx={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>Loading results...</Typography>
            </Box>
          ) : (
            <Box className="print-area">

              {/* ===== OVERVIEW ===== */}
              {activeView === 'overview' && (
                <Box>
                  {renderFilterBar()}
                  <Grid container spacing={isMobile ? 1.5 : 2.5} sx={{ mb: isMobile ? 2 : 3 }}>
                    <Grid item xs={6} md={3}><StatCard label="Events" value={totalEvents_n} sub={`${scoredEventsCount} scored`} color="#2563EB" icon={<Target size={22} />} /></Grid>
                    <Grid item xs={6} md={3}><StatCard label="Participants" value={totalParticipants} sub="entries" color="#6366F1" icon={<Users size={22} />} /></Grid>
                    <Grid item xs={6} md={3}><StatCard label="Parishes" value={parishStandings.length} sub="competing" color="#10B981" icon={<BarChart3 size={22} />} /></Grid>
                    <Grid item xs={6} md={3}><StatCard label="Medals" value={totalMedals} sub="🥇🥈🥉" color="#D97706" icon={<Award size={22} />} /></Grid>
                  </Grid>

                  {/* Overall Rankings */}
                  <GlassCard sx={{ p: isMobile ? 1.5 : 2.5, mb: isMobile ? 2 : 3 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#1a202c', mb: 2 }}>Overall Parish Rankings</Typography>
                    {parishStandings.map((p, idx) => {
                      const pct = maxPoints > 0 ? (p.totalPoints / maxPoints) * 100 : 0; const dc = getDivConfig(p.division);
                      return (
                        <Box key={p.parish} onClick={() => openParishModal(p.parish)} sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.8 : 1.5, mb: 0.8, cursor: 'pointer', '&:active': { opacity: 0.7 } }}>
                          <Typography sx={{ width: 20, fontWeight: 700, fontSize: '11px', color: idx < 3 ? '#2563EB' : '#94A3B8', textAlign: 'right' }}>{idx + 1}</Typography>
                          <Typography sx={{ width: isSmall ? 80 : 120, fontWeight: idx < 3 ? 700 : 500, fontSize: isSmall ? '11px' : '12px', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.parish}</Typography>
                          {!isSmall && <Chip label={dc.label.replace('Division ', '')} size="small" sx={{ fontWeight: 700, fontSize: '9px', bgcolor: `${dc.color}10`, color: dc.color, height: 18, minWidth: 22 }} />}
                          <Box sx={{ flex: 1, height: 20, background: 'rgba(0,0,0,0.04)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                            <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: idx === 0 ? 'linear-gradient(90deg, #2563EB, #3B82F6)' : idx === 1 ? 'linear-gradient(90deg, #6366F1, #818CF8)' : idx === 2 ? 'linear-gradient(90deg, #10B981, #34D399)' : '#CBD5E1', transition: 'width 0.6s', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 0.8 }}>
                              {pct > 22 && <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{p.totalPoints}</Typography>}
                            </Box>
                            {pct <= 22 && <Typography sx={{ position: 'absolute', left: `${pct + 2}%`, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 600, color: '#64748B' }}>{p.totalPoints}</Typography>}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.3, minWidth: isSmall ? 35 : 55 }}>
                            {p.firsts > 0 && <Typography sx={{ fontSize: '10px' }}>🥇{p.firsts}</Typography>}
                            {p.seconds > 0 && <Typography sx={{ fontSize: '10px' }}>🥈{p.seconds}</Typography>}
                            {p.thirds > 0 && <Typography sx={{ fontSize: '10px' }}>🥉{p.thirds}</Typography>}
                          </Box>
                        </Box>
                      );
                    })}
                  </GlassCard>

                  {/* Section Progress */}
                  <GlassCard sx={{ p: isMobile ? 1.5 : 2.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#1a202c', mb: 2 }}>Section Progress</Typography>
                    {sectionSummary.map((sec, i) => {
                      const pct = sec.totalEventsCount > 0 ? Math.round((sec.scoredEventsCount / sec.totalEventsCount) * 100) : 0; const topP = sec.parishStandings[0];
                      return (
                        <Box key={sec.section} sx={{ mb: 2.5 }}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Box><Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{sec.section}</Typography><Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>{SECTION_CONFIG[sec.section]}</Typography></Box>
                            <Chip label={`${pct}%`} size="small" sx={{ fontWeight: 700, height: 22, bgcolor: `${COLORS[i]}12`, color: COLORS[i] }} />
                          </Box>
                          <Box sx={{ width: '100%', height: 7, borderRadius: 4, background: 'rgba(0,0,0,0.04)', mb: 0.6 }}><Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${COLORS[i]}, ${COLORS[i]}AA)`, transition: 'width 0.8s' }} /></Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>{sec.scoredEventsCount}/{sec.totalEventsCount} events</Typography>
                            {topP && <Typography sx={{ fontSize: '10px', fontWeight: 600, color: COLORS[i] }}>🏆 {topP.parish}</Typography>}
                          </Box>
                        </Box>
                      );
                    })}
                  </GlassCard>
                </Box>
              )}

              {/* ===== STANDINGS ===== */}
              {activeView === 'standings' && (
                <Box>
                  {renderFilterBar()}
                  {isMobile ? (
                    /* Mobile: card layout */
                    <Box>
                      <GlassCard sx={{ p: 1.5, mb: 2 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#1a202c', mb: 0.5 }}>
                          Parish Standings {selectedDivision && `— ${getDivConfig(selectedDivision).label}`}
                        </Typography>
                      </GlassCard>
                      {parishStandings.map((p, idx) => {
                        const pct = maxPoints > 0 ? (p.totalPoints / maxPoints) * 100 : 0; const dc = getDivConfig(p.division);
                        return (
                          <GlassCard key={p.parish} sx={{ mb: 1, p: 0 }} onClick={() => openParishModal(p.parish)}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, p: 1.5, cursor: 'pointer', '&:active': { opacity: 0.8 } }}>
                              <Box sx={{ minWidth: 32, height: 32, borderRadius: 8, bgcolor: idx < 3 ? '#2563EB' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {idx < 3 ? <Typography sx={{ fontSize: '14px' }}>{['🥇', '🥈', '🥉'][idx]}</Typography> : <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#94A3B8' }}>{idx + 1}</Typography>}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Typography sx={{ fontWeight: idx < 3 ? 700 : 500, fontSize: '13px', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.parish}</Typography>
                                  <Chip label={dc.label.replace('Division ', '')} size="small" sx={{ fontWeight: 700, fontSize: '8px', bgcolor: `${dc.color}10`, color: dc.color, height: 16 }} />
                                </Box>
                                <Box sx={{ width: '100%', height: 5, background: 'rgba(0,0,0,0.04)', borderRadius: 3, mt: 0.5, overflow: 'hidden' }}>
                                  <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: idx < 3 ? '#2563EB' : '#CBD5E1' }} />
                                </Box>
                                <Box display="flex" gap={0.5} mt={0.3}>
                                  <Typography sx={{ fontSize: '9px', color: '#94A3B8' }}>{p.eventsCount} events</Typography>
                                  <Typography sx={{ fontSize: '9px', color: '#94A3B8' }}>· A:{p.gradeA} B:{p.gradeB} C:{p.gradeC}</Typography>
                                </Box>
                              </Box>
                              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#2563EB' }}>{p.totalPoints}</Typography>
                                <Box display="flex" gap={0.2} justifyContent="flex-end">
                                  {p.firsts > 0 && <Typography sx={{ fontSize: '9px' }}>🥇{p.firsts}</Typography>}
                                  {p.seconds > 0 && <Typography sx={{ fontSize: '9px' }}>🥈{p.seconds}</Typography>}
                                  {p.thirds > 0 && <Typography sx={{ fontSize: '9px' }}>🥉{p.thirds}</Typography>}
                                </Box>
                              </Box>
                            </Box>
                          </GlassCard>
                        );
                      })}
                    </Box>
                  ) : (
                    /* Desktop: table */
                    <GlassCard sx={{ overflow: 'hidden' }}>
                      <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.05)' }}><Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#1a202c' }}>Parish Standings {selectedDivision && `— ${getDivConfig(selectedDivision).label}`}</Typography></Box>
                      <TableContainer><Table size="small" sx={tableStyles}><TableHead><TableRow>
                        <TableCell width={50}>#</TableCell><TableCell>Parish</TableCell><TableCell>Division</TableCell><TableCell sx={{ width: '25%' }}>Points</TableCell>
                        <TableCell align="center">🥇</TableCell><TableCell align="center">🥈</TableCell><TableCell align="center">🥉</TableCell>
                        <TableCell align="center">A</TableCell><TableCell align="center">B</TableCell><TableCell align="center">C</TableCell><TableCell align="center">Events</TableCell>
                      </TableRow></TableHead><TableBody>
                        {parishStandings.map((p, idx) => {
                          const pct = maxPoints > 0 ? (p.totalPoints / maxPoints) * 100 : 0; const dc = getDivConfig(p.division);
                          return (
                            <TableRow key={p.parish} sx={{ cursor: 'pointer', '&:hover': { background: 'rgba(37,99,235,0.03)' } }} onClick={() => openParishModal(p.parish)}>
                              <TableCell><Box display="flex" alignItems="center" gap={0.5}><Typography sx={{ fontWeight: 700, fontSize: '13px', color: idx < 3 ? '#2563EB' : '#94A3B8' }}>{idx + 1}</Typography>{idx < 3 && <span>{['🥇', '🥈', '🥉'][idx]}</span>}</Box></TableCell>
                              <TableCell sx={{ fontWeight: idx < 3 ? 700 : 500, color: '#2563EB' }}>{p.parish}</TableCell>
                              <TableCell><Chip label={dc.label.replace('Division ', 'Div ')} size="small" sx={{ fontWeight: 700, fontSize: '10px', bgcolor: `${dc.color}10`, color: dc.color }} /></TableCell>
                              <TableCell><Box display="flex" alignItems="center" gap={1}><Box sx={{ flex: 1, height: 14, background: 'rgba(0,0,0,0.04)', borderRadius: 2, overflow: 'hidden' }}><Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: idx < 3 ? '#2563EB' : '#CBD5E1' }} /></Box><Typography sx={{ fontWeight: 800, fontSize: '14px', color: '#2563EB', minWidth: 32, textAlign: 'right' }}>{p.totalPoints}</Typography></Box></TableCell>
                              <TableCell align="center" sx={{ color: '#EAB308', fontWeight: 600 }}>{p.firsts || '-'}</TableCell><TableCell align="center" sx={{ color: '#94A3B8', fontWeight: 600 }}>{p.seconds || '-'}</TableCell><TableCell align="center" sx={{ color: '#B45309', fontWeight: 600 }}>{p.thirds || '-'}</TableCell>
                              <TableCell align="center"><Chip label={p.gradeA} size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, minWidth: 26 }} /></TableCell>
                              <TableCell align="center"><Chip label={p.gradeB} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700, minWidth: 26 }} /></TableCell>
                              <TableCell align="center"><Chip label={p.gradeC} size="small" sx={{ bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700, minWidth: 26 }} /></TableCell>
                              <TableCell align="center">{p.eventsCount}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody></Table></TableContainer>
                    </GlassCard>
                  )}
                </Box>
              )}

              {/* ===== EVENTS ===== */}
              {activeView === 'events' && (
                <Box>
                  {renderFilterBar(true)}
                  <GlassCard sx={{ overflow: 'hidden' }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#1a202c' }}>Event Results</Typography>
                      <Chip label={`${eventResults.length}`} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700, height: 22 }} />
                    </Box>
                    {isMobile ? (
                      <Box>
                        {eventResults.map((ev, idx) => (
                          <EventCard key={idx} event={ev} winners={ev.winners} onParishClick={openParishModal} />
                        ))}
                        {eventResults.length === 0 && <Box sx={{ textAlign: 'center', py: 5, color: '#CBD5E1' }}>No results found</Box>}
                      </Box>
                    ) : (
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
                    )}
                  </GlassCard>
                </Box>
              )}

              {/* ===== SECTIONS ===== */}
              {activeView === 'sections' && (
                <Box>
                  <Grid container spacing={isMobile ? 1.5 : 2.5} sx={{ mb: isMobile ? 2 : 3 }}>{sectionSummary.map((sec, i) => {
                    const pct = sec.totalEventsCount > 0 ? Math.round((sec.scoredEventsCount / sec.totalEventsCount) * 100) : 0; const top = sec.parishStandings.slice(0, 3);
                    return (
                      <Grid item xs={12} md={4} key={sec.section}>
                        <GlassCard sx={{ p: isMobile ? 1.5 : 2, height: '100%' }}>
                          <Box display="flex" justifyContent="space-between" mb={1.2}>
                            <Box><Typography sx={{ fontWeight: 800, fontSize: isMobile ? '15px' : '17px', color: COLORS[i] }}>{sec.section}</Typography><Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>{SECTION_CONFIG[sec.section]}</Typography></Box>
                            <Box sx={{ width: 42, height: 42, borderRadius: '50%', border: `3px solid ${COLORS[i]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography sx={{ fontWeight: 800, fontSize: '13px', color: COLORS[i] }}>{pct}%</Typography></Box>
                          </Box>
                          <Typography sx={{ fontSize: '11px', color: '#64748B', mb: 1.2 }}>{sec.scoredEventsCount}/{sec.totalEventsCount} events · {sec.participants} entries</Typography>
                          {top.map((p, pi) => (
                            <Box key={p.parish} onClick={() => openParishModal(p.parish, sec.section)} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.6, cursor: 'pointer', '&:active': { opacity: 0.7 } }}>
                              <Typography sx={{ fontSize: '14px', width: 18 }}>{['🥇', '🥈', '🥉'][pi]}</Typography>
                              <Typography sx={{ flex: 1, fontWeight: pi === 0 ? 700 : 500, fontSize: '12px', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.parish}</Typography>
                              <Typography sx={{ fontWeight: 700, fontSize: '12px', color: COLORS[i] }}>{p.totalPoints}</Typography>
                            </Box>
                          ))}
                        </GlassCard>
                      </Grid>
                    );
                  })}</Grid>
                  {sectionSummary.map((sec, si) => (
                    <GlassCard key={sec.section} sx={{ overflow: 'hidden', mb: isMobile ? 2 : 3 }}>
                      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)' }}><Typography sx={{ fontWeight: 700, color: COLORS[si], fontSize: '14px' }}>{sec.section} — Full Rankings</Typography></Box>
                      {isMobile ? (
                        <Box>
                          {sec.parishStandings.map((p, idx) => {
                            const sMax = sec.parishStandings[0]?.totalPoints || 1; const pct = (p.totalPoints / sMax) * 100;
                            return (
                              <Box key={p.parish} onClick={() => openParishModal(p.parish, sec.section)} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.8, cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.03)', '&:active': { opacity: 0.7 } }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '12px', width: 24, textAlign: 'right', color: idx < 3 ? COLORS[si] : '#94A3B8' }}>{idx + 1}</Typography>
                                {idx < 3 && <Typography sx={{ fontSize: '13px', width: 16 }}>{['🥇', '🥈', '🥉'][idx]}</Typography>}
                                <Typography sx={{ flex: 1, fontWeight: idx < 3 ? 700 : 400, fontSize: '12px', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.parish}</Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: '13px', color: COLORS[si] }}>{p.totalPoints}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      ) : (
                        <TableContainer><Table size="small" sx={tableStyles}><TableHead><TableRow><TableCell width={60}>Rank</TableCell><TableCell>Parish</TableCell><TableCell sx={{ width: '40%' }}>Points</TableCell></TableRow></TableHead><TableBody>
                          {sec.parishStandings.map((p, idx) => { const sMax = sec.parishStandings[0]?.totalPoints || 1;
                            return (
                              <TableRow key={p.parish} sx={{ cursor: 'pointer', '&:hover': { background: 'rgba(0,0,0,0.02)' } }} onClick={() => openParishModal(p.parish, sec.section)}>
                                <TableCell><Typography sx={{ fontWeight: 700, fontSize: '13px' }}>{idx + 1} {idx < 3 && ['🥇', '🥈', '🥉'][idx]}</Typography></TableCell>
                                <TableCell sx={{ fontWeight: idx < 3 ? 700 : 400, color: '#2563EB' }}>{p.parish}</TableCell>
                                <TableCell><Box display="flex" alignItems="center" gap={1}><Box sx={{ flex: 1, height: 14, background: 'rgba(0,0,0,0.04)', borderRadius: 2, overflow: 'hidden' }}><Box sx={{ width: `${(p.totalPoints / sMax) * 100}%`, height: '100%', borderRadius: 2, background: COLORS[si] }} /></Box><Typography sx={{ fontWeight: 700, fontSize: '13px', color: COLORS[si], minWidth: 30, textAlign: 'right' }}>{p.totalPoints}</Typography></Box></TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody></Table></TableContainer>
                      )}
                    </GlassCard>
                  ))}
                </Box>
              )}

              {/* ===== STAGES ===== */}
              {activeView === 'stages' && (
                <Box>
                  {renderFilterBar(true, true, true)}
                  <Grid container spacing={isMobile ? 1.5 : 2.5} sx={{ mb: isMobile ? 2 : 3 }}>
                    {availableStages.map((stage) => {
                      const stageEvents = stageGroupedEvents[stage] || [];
                      const scoredCount = stageEvents.filter(e => stageWinnersMap[`${stage}|${e.eventName}`]?.length > 0).length;
                      const pct = stageEvents.length > 0 ? Math.round((scoredCount / stageEvents.length) * 100) : 0;
                      const stageColor = stage === 'On Stage' ? '#2563EB' : '#10B981';
                      return (
                        <Grid item xs={6} key={stage}>
                          <StyledCard sx={{ cursor: 'pointer', border: selectedStage === stage ? `2px solid ${stageColor}` : undefined }}
                            onClick={() => setSelectedStage(selectedStage === stage ? '' : stage)}>
                            <Box sx={{ p: isMobile ? 1.5 : 2 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <IconBox color={stageColor} sx={{ width: isMobile ? 36 : 44, height: isMobile ? 36 : 44 }}><Music size={isMobile ? 18 : 22} /></IconBox>
                                  <Box><Typography sx={{ fontWeight: 700, fontSize: isMobile ? '13px' : '15px', color: '#1a202c' }}>{stage}</Typography><Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>{stageEvents.length} events</Typography></Box>
                                </Box>
                                <Box sx={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: '50%', border: `3px solid ${stageColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography sx={{ fontWeight: 800, fontSize: isMobile ? '12px' : '14px', color: stageColor }}>{pct}%</Typography></Box>
                              </Box>
                            </Box>
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
                      <GlassCard key={stage} sx={{ overflow: 'hidden', mb: isMobile ? 2 : 3 }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box display="flex" alignItems="center" gap={1}><IconBox color={stageColor} sx={{ width: 32, height: 32, borderRadius: 8 }}><Music size={16} /></IconBox><Box><Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#1a202c' }}>{stage}</Typography><Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>{filtered.length} events · {scoredCount} scored</Typography></Box></Box>
                        </Box>
                        {isMobile ? (
                          <Box>
                            {filtered.map((event, idx) => (
                              <EventCard key={event._id} event={event} winners={stageWinnersMap[`${stage}|${event.eventName}`]} onParishClick={openParishModal} />
                            ))}
                          </Box>
                        ) : (
                          <TableContainer><Table size="small" sx={tableStyles}><TableHead><TableRow>
                            <TableCell>Sl</TableCell><TableCell>Event</TableCell><TableCell>Section</TableCell><TableCell>Type</TableCell><TableCell>Gender</TableCell>
                            <TableCell align="center">🥇 First</TableCell><TableCell align="center">🥈 Second</TableCell><TableCell align="center">🥉 Third</TableCell>
                          </TableRow></TableHead><TableBody>
                            {filtered.map((event, idx) => {
                              const winners = (stageWinnersMap[`${stage}|${event.eventName}`] || []).sort((a, b) => +a.position - +b.position);
                              const w = pos => winners.find(x => x.position === pos);
                              const isScored = winners.length > 0;
                              return (
                                <TableRow key={event._id} sx={{ bgcolor: isScored ? 'rgba(16,185,129,0.02)' : 'transparent', '&:hover': { background: 'rgba(0,0,0,0.02)' } }}>
                                  <TableCell sx={{ color: '#94A3B8' }}>{idx + 1}</TableCell>
                                  <TableCell><Box display="flex" alignItems="center" gap={0.5}><Typography sx={{ fontWeight: 600 }}>{event.eventName}</Typography>{isScored && <Chip label="✓" size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, height: 18, minWidth: 18, '& .MuiChip-label': { px: 0.5 } }} />}</Box></TableCell>
                                  <TableCell><Chip label={event.section} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                                  <TableCell><Chip label={event.eventType === 'group' ? 'Group' : 'Individual'} size="small" sx={{ bgcolor: event.eventType === 'group' ? '#FDF2F8' : '#ECFDF5', color: event.eventType === 'group' ? '#EC4899' : '#059669', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                                  <TableCell><Chip label={event.gender === 'male' ? 'Boys' : event.gender === 'female' ? 'Girls' : 'All'} size="small" sx={{ fontSize: '11px', fontWeight: 600 }} /></TableCell>
                                  {['1', '2', '3'].map(pos => { const wn = w(pos); return (
                                    <TableCell key={pos} align="center">{wn ? (<Box><Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{wn.name}</Typography><ParishName name={wn.parish} sx={{ fontSize: '11px', color: '#94A3B8' }} /></Box>) : <Typography sx={{ color: '#E2E8F0' }}>—</Typography>}</TableCell>
                                  ); })}
                                </TableRow>
                              );
                            })}
                          </TableBody></Table></TableContainer>
                        )}
                      </GlassCard>
                    );
                  })}
                </Box>
              )}

              {/* ===== VENUES ===== */}
              {activeView === 'venues' && (
                <Box>
                  {renderFilterBar(true, true, false, true)}
                  {!stageAllocation?.venues?.length ? (
                    <GlassCard sx={{ textAlign: 'center', py: 6, px: 3 }}>
                      <MapPin size={40} style={{ color: '#94a3b8', marginBottom: 12 }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#64748B', mb: 0.5 }}>No Venue Allocations</Typography>
                      <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>Stage allocations have not been set up yet.</Typography>
                    </GlassCard>
                  ) : (<>
                    <Grid container spacing={isMobile ? 1 : 2.5} sx={{ mb: isMobile ? 2 : 3 }}>
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
                          <Grid item xs={6} sm={4} key={v.venueId}>
                            <StyledCard sx={{ cursor: 'pointer', border: selectedVenue === v.venueId ? `2px solid ${venueColor}` : undefined }}
                              onClick={() => setSelectedVenue(selectedVenue === v.venueId ? '' : v.venueId)}>
                              <Box sx={{ p: isMobile ? 1.5 : 2 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                  <IconBox color={venueColor} sx={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}><MapPin size={isMobile ? 16 : 20} /></IconBox>
                                  <Typography sx={{ fontWeight: 700, fontSize: isMobile ? '12px' : '14px', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.venueName}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>{v.totalEvents} events · {v.scoredCount} done</Typography>
                                  <Typography sx={{ fontWeight: 800, fontSize: '13px', color: venueColor }}>{pct}%</Typography>
                                </Box>
                              </Box>
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
                        <GlassCard key={v.venueId} sx={{ overflow: 'hidden', mb: isMobile ? 2 : 3 }}>
                          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box display="flex" alignItems="center" gap={1}><IconBox color={venueColor} sx={{ width: 32, height: 32, borderRadius: 8 }}><MapPin size={16} /></IconBox><Box><Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#1a202c' }}>{v.venueName}</Typography><Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>{v.events.length} events · {scoredInView} scored</Typography></Box></Box>
                          </Box>
                          {isMobile ? (
                            <Box>{v.events.map((event, idx) => <EventCard key={event._id} event={event} winners={v.winnersLookup[event.eventName]} onParishClick={openParishModal} />)}</Box>
                          ) : (
                            <TableContainer><Table size="small" sx={tableStyles}><TableHead><TableRow>
                              <TableCell>Sl</TableCell><TableCell>Event</TableCell><TableCell>Section</TableCell><TableCell>Type</TableCell><TableCell>Gender</TableCell>
                              <TableCell align="center">🥇 First</TableCell><TableCell align="center">🥈 Second</TableCell><TableCell align="center">🥉 Third</TableCell>
                            </TableRow></TableHead><TableBody>
                              {v.events.map((event, idx) => {
                                const winners = (v.winnersLookup[event.eventName] || []).sort((a, b) => +a.position - +b.position);
                                const w = pos => winners.find(x => x.position === pos); const isScored = winners.length > 0;
                                return (
                                  <TableRow key={event._id} sx={{ bgcolor: isScored ? 'rgba(16,185,129,0.02)' : 'transparent', '&:hover': { background: 'rgba(0,0,0,0.02)' } }}>
                                    <TableCell sx={{ color: '#94A3B8' }}>{idx + 1}</TableCell>
                                    <TableCell><Box display="flex" alignItems="center" gap={0.5}><Typography sx={{ fontWeight: 600 }}>{event.eventName}</Typography>{isScored && <Chip label="✓" size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, height: 18, '& .MuiChip-label': { px: 0.5 } }} />}</Box></TableCell>
                                    <TableCell><Chip label={event.section} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                                    <TableCell><Chip label={event.eventType === 'group' ? 'Group' : 'Individual'} size="small" sx={{ fontSize: '11px', fontWeight: 600 }} /></TableCell>
                                    <TableCell><Chip label={event.gender === 'male' ? 'Boys' : event.gender === 'female' ? 'Girls' : 'All'} size="small" sx={{ fontSize: '11px', fontWeight: 600 }} /></TableCell>
                                    {['1', '2', '3'].map(pos => { const wn = w(pos); return (
                                      <TableCell key={pos} align="center">{wn ? (<Box><Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{wn.name}</Typography><ParishName name={wn.parish} sx={{ fontSize: '11px', color: '#94A3B8' }} /></Box>) : <Typography sx={{ color: '#E2E8F0' }}>—</Typography>}</TableCell>
                                    ); })}
                                  </TableRow>
                                );
                              })}
                            </TableBody></Table></TableContainer>
                          )}
                        </GlassCard>
                      );
                    })}
                  </>)}
                </Box>
              )}

              {/* ===== PARISHES ===== */}
              {activeView === 'parishes' && (
                <Box>
                  {renderFilterBar(true, true)}
                  {parishPrizeListData.map((p, pi) => {
                    const dc = getDivConfig(p.division);
                    return (
                      <GlassCard key={p.parish} sx={{ overflow: 'hidden', mb: isMobile ? 1.5 : 3 }}>
                        <Box sx={{ p: isMobile ? 1.5 : 2.5, borderBottom: '1px solid rgba(0,0,0,0.05)', background: `linear-gradient(135deg, ${dc.color}06, transparent)` }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{ width: 32, height: 32, borderRadius: '50%', background: `${dc.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ fontWeight: 900, fontSize: '12px', color: dc.color }}>{pi + 1}</Typography>
                              </Box>
                              <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: isMobile ? '14px' : '16px', color: '#1a202c' }}>{p.parish}</Typography>
                                <Box display="flex" gap={0.8} alignItems="center">
                                  <Chip label={dc.label} size="small" sx={{ fontWeight: 700, fontSize: '9px', bgcolor: `${dc.color}10`, color: dc.color, height: 18 }} />
                                  {p.families > 0 && <Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>{p.families} families</Typography>}
                                </Box>
                              </Box>
                            </Box>
                            <Box display="flex" gap={isMobile ? 1.5 : 2.5} alignItems="center">
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography sx={{ fontWeight: 900, fontSize: isMobile ? '18px' : '22px', color: dc.color }}>{p.totalPoints}</Typography>
                                <Typography sx={{ fontSize: '9px', color: '#94A3B8', fontWeight: 600 }}>PTS</Typography>
                              </Box>
                              <Box display="flex" gap={0.5}>
                                {p.firsts > 0 && <Typography sx={{ fontSize: '12px' }}>🥇{p.firsts}</Typography>}
                                {p.seconds > 0 && <Typography sx={{ fontSize: '12px' }}>🥈{p.seconds}</Typography>}
                                {p.thirds > 0 && <Typography sx={{ fontSize: '12px' }}>🥉{p.thirds}</Typography>}
                              </Box>
                            </Box>
                          </Box>
                        </Box>

                        {p.prizes.length > 0 && (
                          <Box>
                            <Box sx={{ px: isMobile ? 1.5 : 2.5, pt: 1.5, pb: 0.5 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Trophy size={13} color="#D97706" /> Prize Winners ({p.prizes.length})
                              </Typography>
                            </Box>
                            <Box sx={{ mx: isMobile ? 1 : 2.5, mb: 1.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                              {p.prizes.map((r, idx) => <PrizeCard key={idx} r={r} />)}
                            </Box>
                          </Box>
                        )}

                        {p.graded.length > 0 && (
                          <Box>
                            <Box sx={{ px: isMobile ? 1.5 : 2.5, pt: p.prizes.length > 0 ? 0 : 1.5, pb: 0.5, borderTop: p.prizes.length > 0 ? '1px solid rgba(0,0,0,0.03)' : 'none' }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Award size={13} color="#6366F1" /> Other Entries ({p.graded.length})
                              </Typography>
                            </Box>
                            <Box sx={{ mx: isMobile ? 1 : 2.5, mb: 1.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                              {p.graded.map((r, idx) => <GradedRow key={idx} r={r} idx={idx} />)}
                            </Box>
                          </Box>
                        )}
                      </GlassCard>
                    );
                  })}
                  {parishPrizeListData.length === 0 && (
                    <GlassCard sx={{ textAlign: 'center', py: 6 }}>
                      <Typography sx={{ color: '#94A3B8', fontSize: '14px' }}>No results found.</Typography>
                    </GlassCard>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Container>

        {/* ====== MOBILE BOTTOM NAV ====== */}
        {isMobile && (
          <Box className="no-print bottom-nav" sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            display: 'flex', justifyContent: 'space-around',
            paddingBottom: 'env(safe-area-inset-bottom)',
            boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
          }}>
            {views.map(v => (
              <Box
                key={v.key}
                onClick={() => setActiveView(v.key)}
                sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  py: 0.8, px: 0.5, cursor: 'pointer', flex: 1, minWidth: 0,
                  color: activeView === v.key ? '#2563EB' : '#94A3B8',
                  transition: 'color 0.15s',
                  '&:active': { transform: 'scale(0.92)' },
                }}
              >
                <Typography sx={{ fontSize: '16px', lineHeight: 1 }}>{v.icon}</Typography>
                <Typography sx={{ fontSize: '9px', fontWeight: activeView === v.key ? 700 : 500, mt: 0.2, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{v.label}</Typography>
                {activeView === v.key && <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#2563EB', mt: 0.3 }} />}
              </Box>
            ))}
          </Box>
        )}
      </DashboardContainer>

      <ParishDetailModal />
    </ThemeProvider>
  );
};

export default ResultsDashboardPro;
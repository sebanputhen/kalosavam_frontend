import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, Grid, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer,
  CircularProgress, Chip, Button, IconButton, TextField, InputAdornment, Tabs, Tab
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Award, Users, Target, BarChart3, RefreshCw, Search, Trophy } from 'lucide-react';
import axiosInstance from "../axiosConfig";

const theme = createTheme({
  palette: {
    primary: { main: '#2563EB', light: '#3B82F6', dark: '#1E40AF' },
    secondary: { main: '#10B981', light: '#34D399', dark: '#047857' },
    info: { main: '#6366F1' }
  },
  typography: { fontFamily: '"Inter", "Segoe UI", sans-serif' }
});

const COLORS = ['#2563EB', '#10B981', '#6366F1', '#D97706', '#EC4899', '#0891B2', '#EA580C', '#8B5CF6', '#14B8A6', '#F43F5E'];
const MEDAL_COLORS = { '1': '#EAB308', '2': '#94A3B8', '3': '#B45309' };
const SECTION_CONFIG = { 'Dominic Savio': 'Classes IV-VI', 'Alphonsa': 'Classes VII-IX', 'Saint Thomas': 'Classes X-XII' };

const DIVISION_CONFIG = [
  { key: 'A', label: 'Division A', desc: '> 500 Families', color: '#2563EB', check: n => n > 500 },
  { key: 'B', label: 'Division B', desc: '200 – 500 Families', color: '#6366F1', check: n => n >= 200 && n <= 500 },
  { key: 'C', label: 'Division C', desc: '< 200 Families', color: '#D97706', check: n => n < 200 }
];

const getParishDivision = (familyCount) => {
  const n = parseInt(familyCount) || 0;
  for (const d of DIVISION_CONFIG) { if (d.check(n)) return d.key; }
  return 'C';
};

const printStyles = `
  @media print {
    @page { size: A4 landscape; margin: 8mm; }
    .no-print { display: none !important; }
    nav,header,footer,aside,.MuiDrawer-root,.MuiAppBar-root,[class*="Sidebar"],[class*="Navbar"],[class*="AppBar"],[class*="drawer"],[class*="header"]{display:none!important}
    .print-area{position:fixed!important;left:0;top:0;width:100%;margin:0;padding:5px;box-shadow:none;background:#fff;color:#000}
    .print-area *{visibility:visible!important;color:#000!important}
  }
`;

const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const tableStyles = { '& th': { color: '#64748B', fontWeight: 700, borderBottom: '2px solid #E2E8F0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.5, background: '#F8FAFC' }, '& td': { color: '#1E293B', borderBottom: '1px solid #F1F5F9', py: 1.3 } };

const ResultsDashboardPro = () => {
  const [activeView, setActiveView] = useState('overview');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scorings, setScorings] = useState([]);
  const [events, setEvents] = useState([]);
  const [parishes, setParishes] = useState([]);

  const FORANE_ID = '673799a3cb9b4aa181e53fa2';
  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [scoringsRes, eventsOnRes, eventsOffRes, parishesRes] = await Promise.all([
        axiosInstance.get(`/event-scoring/forane/${FORANE_ID}`),
        axiosInstance.get('/events/stage/On Stage').catch(() => ({ data: { data: { events: [] } } })),
        axiosInstance.get('/events/stage/Off Stage').catch(() => ({ data: { data: { events: [] } } })),
        axiosInstance.get('/parish')
      ]);
      setScorings(scoringsRes.data?.data?.eventScorings || []);
      setEvents([...(eventsOnRes.data?.data?.events || []), ...(eventsOffRes.data?.data?.events || [])]);
      setParishes((parishesRes.data || []).filter(p => p.forane === FORANE_ID || p.forane?._id === FORANE_ID));
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  // Parish division map
  const parishDivisionMap = useMemo(() => {
    const m = {};
    parishes.forEach(p => { m[p.name] = getParishDivision(p.phone); });
    return m;
  }, [parishes]);

  const parishFamilyMap = useMemo(() => {
    const m = {};
    parishes.forEach(p => { m[p.name] = parseInt(p.phone) || 0; });
    return m;
  }, [parishes]);

  const allResults = useMemo(() => {
    const r = [];
    scorings.forEach(s => {
      const ev = s.eventId || {};
      (s.participants || []).forEach(p => r.push({ ...p, eventName: ev.eventName || 'Unknown', section: ev.section || s.section || '', eventType: ev.eventType || '' }));
    });
    return r;
  }, [scorings]);

  const filteredResults = useMemo(() => {
    let r = allResults;
    if (selectedSection) r = r.filter(x => x.section === selectedSection);
    if (selectedEvent) r = r.filter(x => x.eventName === selectedEvent);
    if (selectedDivision) r = r.filter(x => parishDivisionMap[x.parish] === selectedDivision);
    return r;
  }, [allResults, selectedSection, selectedEvent, selectedDivision, parishDivisionMap]);

  const uniqueEvents = useMemo(() => [...new Set(allResults.map(r => r.eventName))].sort(), [allResults]);
  const filteredUniqueEvents = useMemo(() => {
    if (!selectedSection) return uniqueEvents;
    return [...new Set(allResults.filter(r => r.section === selectedSection).map(r => r.eventName))].sort();
  }, [allResults, selectedSection, uniqueEvents]);

  const buildStandings = (results) => {
    const map = {};
    results.forEach(r => {
      const p = r.parish || 'Unknown';
      if (!map[p]) map[p] = { parish: p, totalPoints: 0, firsts: 0, seconds: 0, thirds: 0, gradeA: 0, gradeB: 0, gradeC: 0, eventsSet: new Set() };
      const m = map[p];
      m.totalPoints += r.totalPoints || 0;
      if (r.position === '1') m.firsts++;
      if (r.position === '2') m.seconds++;
      if (r.position === '3') m.thirds++;
      if (r.grade === 'A') m.gradeA++;
      if (r.grade === 'B') m.gradeB++;
      if (r.grade === 'C') m.gradeC++;
      m.eventsSet.add(r.eventName);
    });
    return Object.values(map).map(p => ({
      ...p, eventsCount: p.eventsSet.size,
      division: parishDivisionMap[p.parish] || 'C',
      families: parishFamilyMap[p.parish] || 0
    })).sort((a, b) => b.totalPoints - a.totalPoints);
  };

  const parishStandings = useMemo(() => buildStandings(filteredResults), [filteredResults, parishDivisionMap, parishFamilyMap]);

  // Division-wise standings (always from allResults, respecting section/event filter but not division filter)
  const divisionStandings = useMemo(() => {
    let base = allResults;
    if (selectedSection) base = base.filter(x => x.section === selectedSection);
    if (selectedEvent) base = base.filter(x => x.eventName === selectedEvent);
    const all = buildStandings(base);
    const result = {};
    DIVISION_CONFIG.forEach(d => { result[d.key] = all.filter(p => p.division === d.key); });
    return result;
  }, [allResults, selectedSection, selectedEvent, parishDivisionMap, parishFamilyMap]);

  const eventResults = useMemo(() => {
    const map = {};
    filteredResults.forEach(r => {
      if (!map[r.eventName]) map[r.eventName] = { eventName: r.eventName, section: r.section, eventType: r.eventType, winners: [] };
      if (r.position && ['1', '2', '3'].includes(r.position))
        map[r.eventName].winners.push({ position: r.position, name: r.participantType === 'Group' ? r.parish : r.participantName, parish: r.parish, grade: r.grade, totalPoints: r.totalPoints });
    });
    let result = Object.values(map).map(e => ({ ...e, winners: e.winners.sort((a, b) => +a.position - +b.position) }));
    if (searchQuery) { const q = searchQuery.toLowerCase(); result = result.filter(e => e.eventName.toLowerCase().includes(q) || e.winners.some(w => w.name.toLowerCase().includes(q) || w.parish.toLowerCase().includes(q))); }
    return result.sort((a, b) => a.section.localeCompare(b.section) || a.eventName.localeCompare(b.eventName));
  }, [filteredResults, searchQuery]);

  const sectionSummary = useMemo(() => {
    const map = {};
    allResults.forEach(r => {
      const s = r.section || 'Unknown';
      if (!map[s]) map[s] = { section: s, scoredEvents: new Set(), totalEvents: new Set(), participants: 0, parishes: {} };
      map[s].participants++;
      map[s].scoredEvents.add(r.eventName);
      if (!map[s].parishes[r.parish]) map[s].parishes[r.parish] = { parish: r.parish, totalPoints: 0 };
      map[s].parishes[r.parish].totalPoints += r.totalPoints || 0;
    });
    events.forEach(e => { if (map[e.section]) map[e.section].totalEvents.add(e.eventName); });
    return Object.values(map).map(s => ({ ...s, totalEventsCount: s.totalEvents.size, scoredEventsCount: s.scoredEvents.size, parishStandings: Object.values(s.parishes).sort((a, b) => b.totalPoints - a.totalPoints) }));
  }, [allResults, events]);

  const topScorers = useMemo(() => {
    let r = filteredResults.filter(r => r.participantType !== 'Group' && r.totalMarks > 0).sort((a, b) => b.totalPoints - a.totalPoints || b.totalMarks - a.totalMarks);
    if (searchQuery) { const q = searchQuery.toLowerCase(); r = r.filter(x => x.participantName?.toLowerCase().includes(q) || x.parish?.toLowerCase().includes(q) || x.eventName?.toLowerCase().includes(q)); }
    return r.slice(0, 20);
  }, [filteredResults, searchQuery]);

  const maxPoints = parishStandings[0]?.totalPoints || 1;
  const totalEvents_n = events.length;
  const scoredEventsCount = scorings.length;
  const totalParticipants = filteredResults.length;
  const totalMedals = filteredResults.filter(r => r.position && ['1', '2', '3'].includes(r.position)).length;

  const medalsChartData = useMemo(() => parishStandings.filter(p => p.firsts + p.seconds + p.thirds > 0).slice(0, 8).map(p => ({ name: p.parish.length > 12 ? p.parish.substring(0, 12) + '..' : p.parish, Gold: p.firsts, Silver: p.seconds, Bronze: p.thirds })), [parishStandings]);

  const views = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'standings', label: '🏆 Standings' },
    { key: 'divisions', label: '🏅 Divisions' },
    { key: 'events', label: '🎭 Events' },
    { key: 'sections', label: '📋 Sections' },
    { key: 'topscorers', label: '⭐ Top Scorers' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <Box sx={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, p: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', mb: 0.5 }}>{label}</Typography>
        {payload.map((e, i) => <Typography key={i} sx={{ color: e.color, fontWeight: 600, fontSize: '12px' }}>{e.name}: {e.value}</Typography>)}
      </Box>
    );
  };

  const resetFilters = () => { setSelectedSection(''); setSelectedEvent(''); setSelectedDivision(''); setSearchQuery(''); };

  const getDivConfig = (key) => DIVISION_CONFIG.find(d => d.key === key) || DIVISION_CONFIG[2];

  const FilterBar = ({ showSearch = false, showDivision = true }) => (
    <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center" sx={{ mb: 2.5 }}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Section</InputLabel>
        <Select value={selectedSection} label="Section" onChange={e => { setSelectedSection(e.target.value); setSelectedEvent(''); }}>
          <MenuItem value="">All Sections</MenuItem>
          {Object.keys(SECTION_CONFIG).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Event</InputLabel>
        <Select value={selectedEvent} label="Event" onChange={e => setSelectedEvent(e.target.value)}>
          <MenuItem value="">All Events</MenuItem>
          {filteredUniqueEvents.map(ev => <MenuItem key={ev} value={ev}>{ev}</MenuItem>)}
        </Select>
      </FormControl>
      {showDivision && (
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Division</InputLabel>
          <Select value={selectedDivision} label="Division" onChange={e => setSelectedDivision(e.target.value)}>
            <MenuItem value="">All Divisions</MenuItem>
            {DIVISION_CONFIG.map(d => <MenuItem key={d.key} value={d.key}>{d.label} ({d.desc})</MenuItem>)}
          </Select>
        </FormControl>
      )}
      {showSearch && (
        <TextField size="small" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} sx={{ minWidth: 200 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} color="#94A3B8" /></InputAdornment> }} />
      )}
      {(selectedSection || selectedEvent || searchQuery || selectedDivision) && (
        <Button size="small" onClick={resetFilters} sx={{ textTransform: 'none', color: '#64748B' }}>Clear</Button>
      )}
      <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
        <IconButton onClick={fetchAllData} size="small" sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}><RefreshCw size={16} /></IconButton>
        <Button size="small" variant="outlined" onClick={() => window.print()} sx={{ textTransform: 'none', borderColor: '#E2E8F0', color: '#64748B', borderRadius: 2 }}>Print</Button>
      </Box>
    </Box>
  );

  // Renders a division standings block
  const DivisionBlock = ({ divKey, standings, showTitle = true }) => {
    const conf = getDivConfig(divKey);
    const dMax = standings[0]?.totalPoints || 1;
    const top3 = standings.slice(0, 3);
    return (
      <Box sx={{ ...card, mb: 2.5 }}>
        {showTitle && (
          <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: conf.color }} />
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#0F172A' }}>{conf.label}</Typography>
                <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{conf.desc} · {standings.length} parishes</Typography>
              </Box>
            </Box>
            {top3[0] && (
              <Box display="flex" alignItems="center" gap={1}>
                <Trophy size={16} color={conf.color} />
                <Typography sx={{ fontWeight: 700, fontSize: '14px', color: conf.color }}>{top3[0].parish}</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Top 3 podium row */}
        {top3.length > 0 && (
          <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9' }}>
            <Grid container spacing={1.5}>
              {top3.map((p, idx) => (
                <Grid item xs={4} key={p.parish}>
                  <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: '10px', background: idx === 0 ? `${conf.color}08` : '#F8FAFC', border: idx === 0 ? `1px solid ${conf.color}25` : '1px solid #F1F5F9' }}>
                    <Typography sx={{ fontSize: '20px', mb: 0.3 }}>{['🥇', '🥈', '🥉'][idx]}</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{p.parish}</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '20px', color: conf.color }}>{p.totalPoints}</Typography>
                    <Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>{p.families} families · {p.firsts}🥇{p.seconds}🥈{p.thirds}🥉</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Full bar list */}
        <Box sx={{ p: 2 }}>
          {standings.map((p, idx) => {
            const pct = dMax > 0 ? (p.totalPoints / dMax) * 100 : 0;
            return (
              <Box key={p.parish} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.8 }}>
                <Typography sx={{ width: 22, fontWeight: 700, fontSize: '12px', color: idx < 3 ? conf.color : '#94A3B8', textAlign: 'right' }}>{idx + 1}</Typography>
                <Typography sx={{ width: 130, fontWeight: idx < 3 ? 700 : 500, fontSize: '12px', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.parish}</Typography>
                <Box sx={{ flex: 1, height: 20, background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                  <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: idx < 3 ? conf.color : '#CBD5E1', transition: 'width 0.8s', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 0.8 }}>
                    {pct > 25 && <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{p.totalPoints}</Typography>}
                  </Box>
                  {pct <= 25 && <Typography sx={{ position: 'absolute', left: `${Math.max(pct + 1, 2)}%`, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 600, color: '#64748B' }}>{p.totalPoints}</Typography>}
                </Box>
                <Typography sx={{ fontSize: '10px', color: '#94A3B8', minWidth: 55, textAlign: 'right' }}>{p.families} fam</Typography>
                <Box sx={{ display: 'flex', gap: 0.3, minWidth: 60 }}>
                  {p.firsts > 0 && <Typography sx={{ fontSize: '10px' }}>🥇{p.firsts}</Typography>}
                  {p.seconds > 0 && <Typography sx={{ fontSize: '10px' }}>🥈{p.seconds}</Typography>}
                  {p.thirds > 0 && <Typography sx={{ fontSize: '10px' }}>🥉{p.thirds}</Typography>}
                </Box>
              </Box>
            );
          })}
          {standings.length === 0 && <Typography sx={{ textAlign: 'center', py: 3, color: '#CBD5E1' }}>No parishes in this division</Typography>}
        </Box>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <style>{printStyles}</style>
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', color: '#1E293B' }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>

          {/* HEADER */}
          <Box className="no-print" sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap={2} mb={2.5}>
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.3}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
                  <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#10B981' }}>Live Results</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>ഫൊറോന കലോത്സവം 2026</Typography>
                <Typography sx={{ color: '#94A3B8', fontSize: '13px', mt: 0.3 }}>Forane Kalolsavam — Results & Analytics</Typography>
              </Box>
            </Box>

            <Box display="flex" gap={0.5} sx={{ background: '#fff', borderRadius: '10px', p: 0.5, border: '1px solid #E2E8F0', overflowX: 'auto', mb: 2 }}>
              {views.map(v => (
                <Button key={v.key} onClick={() => setActiveView(v.key)} disableRipple sx={{
                  flex: 1, minWidth: 'auto', px: 1.5, py: 0.9, borderRadius: '8px', textTransform: 'none',
                  fontWeight: 600, fontSize: '13px',
                  color: activeView === v.key ? '#fff' : '#64748B',
                  background: activeView === v.key ? '#2563EB' : 'transparent',
                  boxShadow: activeView === v.key ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                  '&:hover': { background: activeView === v.key ? '#1E40AF' : '#F1F5F9' }
                }}>{v.label}</Button>
              ))}
            </Box>
          </Box>

          {isLoading ? <Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box> : (
            <Box className="print-area">

              {/* OVERVIEW */}
              {activeView === 'overview' && (
                <Box>
                  <FilterBar />

                  <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                    {[
                      { label: 'Total Events', value: totalEvents_n, sub: `${scoredEventsCount} scored`, icon: <Target size={22} />, color: '#2563EB' },
                      { label: 'Participants', value: totalParticipants, sub: 'entries', icon: <Users size={22} />, color: '#6366F1' },
                      { label: 'Parishes', value: parishStandings.length, sub: 'competing', icon: <BarChart3 size={22} />, color: '#10B981' },
                      { label: 'Medals', value: totalMedals, sub: 'awarded', icon: <Award size={22} />, color: '#D97706' }
                    ].map((s, i) => (
                      <Grid item xs={6} md={3} key={i}>
                        <Box sx={{ ...card, p: 2.5 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography sx={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</Typography>
                              <Typography sx={{ fontSize: '32px', fontWeight: 900, color: s.color, lineHeight: 1, mt: 0.5 }}>{s.value}</Typography>
                              <Typography sx={{ fontSize: '11px', color: '#CBD5E1', mt: 0.3 }}>{s.sub}</Typography>
                            </Box>
                            <Box sx={{ color: s.color, opacity: 0.15 }}>{s.icon}</Box>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Division-wise winners summary */}
                  <Box sx={{ ...card, p: 2.5, mb: 2.5 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Trophy size={18} color="#D97706" />
                      <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#0F172A' }}>Division Champions</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      {DIVISION_CONFIG.map(d => {
                        const top = divisionStandings[d.key]?.[0];
                        const count = divisionStandings[d.key]?.length || 0;
                        return (
                          <Grid item xs={12} md={4} key={d.key}>
                            <Box sx={{ p: 2, borderRadius: '10px', background: `${d.color}06`, border: `1px solid ${d.color}20` }}>
                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Box>
                                  <Typography sx={{ fontWeight: 700, fontSize: '15px', color: d.color }}>{d.label}</Typography>
                                  <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{d.desc} · {count} parishes</Typography>
                                </Box>
                                <Typography sx={{ fontSize: '24px' }}>🏆</Typography>
                              </Box>
                              {top ? (
                                <Box>
                                  <Typography sx={{ fontWeight: 800, fontSize: '18px', color: '#0F172A' }}>{top.parish}</Typography>
                                  <Box display="flex" gap={1.5} mt={0.3}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '22px', color: d.color }}>{top.totalPoints} <span style={{ fontSize: '12px', fontWeight: 500, color: '#94A3B8' }}>pts</span></Typography>
                                    <Typography sx={{ fontSize: '12px', color: '#64748B', alignSelf: 'flex-end', mb: 0.3 }}>{top.firsts}🥇 {top.seconds}🥈 {top.thirds}🥉</Typography>
                                  </Box>
                                </Box>
                              ) : <Typography sx={{ color: '#CBD5E1', fontSize: '13px' }}>No results yet</Typography>}
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>

                  {/* Overall election-style bars */}
                  <Box sx={{ ...card, p: 2.5, mb: 2.5 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#0F172A', mb: 2 }}>Overall Parish Rankings</Typography>
                    {parishStandings.map((p, idx) => {
                      const pct = maxPoints > 0 ? (p.totalPoints / maxPoints) * 100 : 0;
                      const dc = getDivConfig(p.division);
                      return (
                        <Box key={p.parish} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          <Typography sx={{ width: 22, fontWeight: 700, fontSize: '12px', color: idx < 3 ? '#2563EB' : '#94A3B8', textAlign: 'right' }}>{idx + 1}</Typography>
                          <Typography sx={{ width: 130, fontWeight: idx < 3 ? 700 : 500, fontSize: '13px', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.parish}</Typography>
                          <Chip label={dc.label.replace('Division ', '')} size="small" sx={{ fontWeight: 700, fontSize: '10px', bgcolor: `${dc.color}12`, color: dc.color, minWidth: 24, height: 20 }} />
                          <Box sx={{ flex: 1, height: 24, background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                            <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: idx === 0 ? 'linear-gradient(90deg, #2563EB, #3B82F6)' : idx === 1 ? 'linear-gradient(90deg, #6366F1, #818CF8)' : idx === 2 ? 'linear-gradient(90deg, #10B981, #34D399)' : '#CBD5E1', transition: 'width 0.8s', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1 }}>
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
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={7}>
                      <Box sx={{ ...card, p: 2.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0F172A', mb: 2 }}>Medal Tally</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={medalsChartData} layout="vertical" margin={{ left: 5, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" tick={{ fill: '#334155', fontSize: 11 }} width={100} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="Gold" fill="#EAB308" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="Silver" fill="#94A3B8" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="Bronze" fill="#B45309" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <Box sx={{ ...card, p: 2.5, height: '100%' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0F172A', mb: 2 }}>Section Progress</Typography>
                        {sectionSummary.map((sec, i) => {
                          const pct = sec.totalEventsCount > 0 ? Math.round((sec.scoredEventsCount / sec.totalEventsCount) * 100) : 0;
                          const topP = sec.parishStandings[0];
                          return (
                            <Box key={sec.section} sx={{ mb: 2.5 }}>
                              <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Box><Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{sec.section}</Typography><Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{SECTION_CONFIG[sec.section]}</Typography></Box>
                                <Chip label={`${pct}%`} size="small" sx={{ fontWeight: 700, bgcolor: `${COLORS[i]}15`, color: COLORS[i] }} />
                              </Box>
                              <Box sx={{ width: '100%', height: 8, borderRadius: 4, background: '#F1F5F9', mb: 0.8 }}>
                                <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: COLORS[i], transition: 'width 1s' }} />
                              </Box>
                              <Box display="flex" justifyContent="space-between">
                                <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{sec.scoredEventsCount}/{sec.totalEventsCount} events</Typography>
                                {topP && <Typography sx={{ fontSize: '11px', fontWeight: 600, color: COLORS[i] }}>🏆 {topP.parish}</Typography>}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* STANDINGS */}
              {activeView === 'standings' && (
                <Box>
                  <FilterBar />
                  <Box sx={{ ...card }}>
                    <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '17px', color: '#0F172A' }}>Parish Standings {selectedDivision && `— ${getDivConfig(selectedDivision).label}`}</Typography>
                    </Box>
                    <TableContainer>
                      <Table size="small" sx={tableStyles}>
                        <TableHead><TableRow>
                          <TableCell width={50}>#</TableCell><TableCell>Parish</TableCell><TableCell>Division</TableCell><TableCell sx={{ width: '30%' }}>Points</TableCell>
                          <TableCell align="center">🥇</TableCell><TableCell align="center">🥈</TableCell><TableCell align="center">🥉</TableCell>
                          <TableCell align="center">A</TableCell><TableCell align="center">B</TableCell><TableCell align="center">C</TableCell><TableCell align="center">Events</TableCell>
                        </TableRow></TableHead>
                        <TableBody>
                          {parishStandings.map((p, idx) => {
                            const pct = maxPoints > 0 ? (p.totalPoints / maxPoints) * 100 : 0;
                            const dc = getDivConfig(p.division);
                            return (
                              <TableRow key={p.parish} sx={{ '&:hover': { background: '#F8FAFC' } }}>
                                <TableCell><Box display="flex" alignItems="center" gap={0.5}><Typography sx={{ fontWeight: 700, fontSize: '13px', color: idx < 3 ? '#2563EB' : '#94A3B8' }}>{idx + 1}</Typography>{idx < 3 && <span>{['🥇', '🥈', '🥉'][idx]}</span>}</Box></TableCell>
                                <TableCell sx={{ fontWeight: idx < 3 ? 700 : 500 }}>{p.parish}</TableCell>
                                <TableCell><Chip label={dc.label.replace('Division ', 'Div ')} size="small" sx={{ fontWeight: 700, fontSize: '10px', bgcolor: `${dc.color}12`, color: dc.color }} /></TableCell>
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Box sx={{ flex: 1, height: 16, background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                                      <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: idx < 3 ? '#2563EB' : '#CBD5E1', transition: 'width 0.6s' }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: '14px', color: '#2563EB', minWidth: 35, textAlign: 'right' }}>{p.totalPoints}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center" sx={{ color: '#EAB308', fontWeight: 600 }}>{p.firsts || '-'}</TableCell>
                                <TableCell align="center" sx={{ color: '#94A3B8', fontWeight: 600 }}>{p.seconds || '-'}</TableCell>
                                <TableCell align="center" sx={{ color: '#B45309', fontWeight: 600 }}>{p.thirds || '-'}</TableCell>
                                <TableCell align="center"><Chip label={p.gradeA} size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, minWidth: 28 }} /></TableCell>
                                <TableCell align="center"><Chip label={p.gradeB} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700, minWidth: 28 }} /></TableCell>
                                <TableCell align="center"><Chip label={p.gradeC} size="small" sx={{ bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700, minWidth: 28 }} /></TableCell>
                                <TableCell align="center">{p.eventsCount}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              )}

              {/* DIVISIONS — dedicated tab */}
              {activeView === 'divisions' && (
                <Box>
                  <FilterBar showDivision={false} />
                  {DIVISION_CONFIG.map(d => (
                    <DivisionBlock key={d.key} divKey={d.key} standings={divisionStandings[d.key] || []} />
                  ))}
                </Box>
              )}

              {/* EVENTS */}
              {activeView === 'events' && (
                <Box>
                  <FilterBar showSearch />
                  <Box sx={{ ...card }}>
                    <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '17px', color: '#0F172A' }}>Event Results</Typography>
                      <Chip label={`${eventResults.length} events`} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 600 }} />
                    </Box>
                    <TableContainer>
                      <Table size="small" sx={tableStyles}>
                        <TableHead><TableRow>
                          <TableCell>Sl</TableCell><TableCell>Event</TableCell><TableCell>Section</TableCell><TableCell>Type</TableCell>
                          <TableCell align="center">🥇 First</TableCell><TableCell align="center">🥈 Second</TableCell><TableCell align="center">🥉 Third</TableCell>
                        </TableRow></TableHead>
                        <TableBody>
                          {eventResults.map((ev, idx) => {
                            const w = pos => ev.winners.find(x => x.position === pos);
                            return (
                              <TableRow key={idx} sx={{ '&:hover': { background: '#F8FAFC' } }}>
                                <TableCell sx={{ color: '#94A3B8' }}>{idx + 1}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{ev.eventName}</TableCell>
                                <TableCell><Chip label={ev.section} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                                <TableCell><Chip label={ev.eventType === 'group' ? 'Group' : 'Individual'} size="small" sx={{ bgcolor: ev.eventType === 'group' ? '#FDF2F8' : '#ECFDF5', color: ev.eventType === 'group' ? '#EC4899' : '#059669', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                                {['1', '2', '3'].map(pos => { const wn = w(pos); return (
                                  <TableCell key={pos} align="center">{wn ? (<Box><Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{wn.name}</Typography><Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{wn.parish}</Typography></Box>) : <Typography sx={{ color: '#E2E8F0' }}>—</Typography>}</TableCell>
                                ); })}
                              </TableRow>
                            );
                          })}
                          {eventResults.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: '#CBD5E1' }}>No results found</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              )}

              {/* SECTIONS */}
              {activeView === 'sections' && (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 2.5 }}>
                    {sectionSummary.map((sec, i) => {
                      const pct = sec.totalEventsCount > 0 ? Math.round((sec.scoredEventsCount / sec.totalEventsCount) * 100) : 0;
                      const top = sec.parishStandings.slice(0, 3);
                      return (
                        <Grid item xs={12} md={4} key={sec.section}>
                          <Box sx={{ ...card, p: 2.5, height: '100%' }}>
                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                              <Box><Typography sx={{ fontWeight: 800, fontSize: '18px', color: COLORS[i] }}>{sec.section}</Typography><Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{SECTION_CONFIG[sec.section]}</Typography></Box>
                              <Box sx={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${COLORS[i]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ fontWeight: 800, fontSize: '14px', color: COLORS[i] }}>{pct}%</Typography>
                              </Box>
                            </Box>
                            <Typography sx={{ fontSize: '12px', color: '#64748B', mb: 1.5 }}>{sec.scoredEventsCount}/{sec.totalEventsCount} events · {sec.participants} participants</Typography>
                            {top.map((p, pi) => (
                              <Box key={p.parish} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                                <Typography sx={{ fontSize: '14px', width: 20 }}>{['🥇', '🥈', '🥉'][pi]}</Typography>
                                <Typography sx={{ flex: 1, fontWeight: pi === 0 ? 700 : 500, fontSize: '13px', color: '#0F172A' }}>{p.parish}</Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: '13px', color: COLORS[i] }}>{p.totalPoints}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                  {sectionSummary.map((sec, si) => (
                    <Box key={sec.section} sx={{ ...card, mb: 2 }}>
                      <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0' }}><Typography sx={{ fontWeight: 700, color: COLORS[si], fontSize: '15px' }}>{sec.section} — Full Rankings</Typography></Box>
                      <TableContainer>
                        <Table size="small" sx={tableStyles}>
                          <TableHead><TableRow><TableCell width={60}>Rank</TableCell><TableCell>Parish</TableCell><TableCell sx={{ width: '40%' }}>Points</TableCell></TableRow></TableHead>
                          <TableBody>
                            {sec.parishStandings.map((p, idx) => {
                              const sMax = sec.parishStandings[0]?.totalPoints || 1;
                              return (
                                <TableRow key={p.parish} sx={{ '&:hover': { background: '#F8FAFC' } }}>
                                  <TableCell><Typography sx={{ fontWeight: 700, fontSize: '13px' }}>{idx + 1} {idx < 3 && ['🥇', '🥈', '🥉'][idx]}</Typography></TableCell>
                                  <TableCell sx={{ fontWeight: idx < 3 ? 700 : 400 }}>{p.parish}</TableCell>
                                  <TableCell>
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <Box sx={{ flex: 1, height: 14, background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                                        <Box sx={{ width: `${(p.totalPoints / sMax) * 100}%`, height: '100%', borderRadius: '3px', background: COLORS[si], transition: 'width 0.6s' }} />
                                      </Box>
                                      <Typography sx={{ fontWeight: 700, fontSize: '13px', color: COLORS[si], minWidth: 30, textAlign: 'right' }}>{p.totalPoints}</Typography>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ))}
                </Box>
              )}

              {/* TOP SCORERS */}
              {activeView === 'topscorers' && (
                <Box>
                  <FilterBar showSearch />
                  <Box sx={{ ...card }}>
                    <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0' }}><Typography sx={{ fontWeight: 800, fontSize: '17px', color: '#0F172A' }}>Top Individual Scorers</Typography></Box>
                    <TableContainer>
                      <Table size="small" sx={tableStyles}>
                        <TableHead><TableRow>
                          <TableCell>#</TableCell><TableCell>Name</TableCell><TableCell>Parish</TableCell><TableCell>Event</TableCell>
                          <TableCell>Section</TableCell><TableCell align="center">Grade</TableCell><TableCell align="center">Position</TableCell><TableCell align="center">Points</TableCell>
                        </TableRow></TableHead>
                        <TableBody>
                          {topScorers.map((p, idx) => (
                            <TableRow key={idx} sx={{ background: idx < 3 ? '#FAFBFE' : 'transparent', '&:hover': { background: '#F8FAFC' } }}>
                              <TableCell><Typography sx={{ fontWeight: 700, fontSize: '13px', color: idx < 3 ? '#2563EB' : '#94A3B8' }}>{idx + 1} {idx < 3 && ['🥇', '🥈', '🥉'][idx]}</Typography></TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{p.participantName}</TableCell>
                              <TableCell>{p.parish}</TableCell>
                              <TableCell>{p.eventName}</TableCell>
                              <TableCell><Chip label={p.section} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: 600 }} /></TableCell>
                              <TableCell align="center"><Chip label={p.grade || '-'} size="small" sx={{ fontWeight: 700, minWidth: 28, bgcolor: p.grade === 'A' ? '#ECFDF5' : p.grade === 'B' ? '#EFF6FF' : p.grade === 'C' ? '#FFFBEB' : '#F1F5F9', color: p.grade === 'A' ? '#059669' : p.grade === 'B' ? '#2563EB' : p.grade === 'C' ? '#D97706' : '#94A3B8' }} /></TableCell>
                              <TableCell align="center">{p.position ? <Typography sx={{ fontWeight: 700, color: MEDAL_COLORS[p.position] || '#64748B', fontSize: '13px' }}>{['1st', '2nd', '3rd'][+p.position - 1]}</Typography> : <Typography sx={{ color: '#E2E8F0' }}>—</Typography>}</TableCell>
                              <TableCell align="center"><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#2563EB' }}>{p.totalPoints}</Typography></TableCell>
                            </TableRow>
                          ))}
                          {topScorers.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5, color: '#CBD5E1' }}>No scores available</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default ResultsDashboardPro;
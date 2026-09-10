import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box, Container, Typography, Grid, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer, Button,
  CircularProgress, Chip, TextField, Card, CardContent
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { Printer, Users, UserCheck, Search } from 'lucide-react';
import axiosInstance from "../axiosConfig";
import { getParishId } from '../utils/parishAuth';

const printStyles = `
  @media print {
    @page { size: A4 landscape; margin: 5mm; }
    html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
    * { margin-left: 0 !important; padding-left: 0 !important; }
    .no-print, nav, header, footer, aside,
    .MuiDrawer-root, .MuiAppBar-root,
    [class*="Sidebar"], [class*="sidebar"],
    [class*="Navbar"], [class*="navbar"],
    [class*="AppBar"], [class*="drawer"], [class*="Drawer"] {
      display: none !important; width: 0 !important; height: 0 !important; overflow: hidden !important;
    }
    .MuiContainer-root { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
    .print-area {
      position: static !important; width: 100% !important; margin: 0 !important;
      padding: 5px !important; box-shadow: none !important;
      border-radius: 0 !important; border: none !important; background: white !important;
    }
    .print-area td, .print-area th { padding: 3px 6px !important; font-size: 13px !important; }
    .print-area table { font-size: 13px !important; width: 100% !important; }
    .print-page-break { page-break-before: always !important; break-before: page !important; }
  }
`;

const ROWS_PER_PAGE = 20;

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
  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.06)' }
});
const StyledCardContent = styled(CardContent)({ padding: '24px !important' });
const StatWrapper = styled(Box)({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
const StatValue = styled(Typography)({ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, marginTop: 4, color: '#1a202c' });
const IconBox = styled(Box)(({ color }) => ({
  width: 52, height: 52, borderRadius: 14,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: `linear-gradient(135deg, ${color}22, ${color}11)`,
  border: `1px solid ${color}33`, color,
}));
const ChartCard = styled(Card)({
  borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.06)', padding: 24,
});
const PageHeader = styled(Box)({
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 32, flexWrap: 'wrap', gap: 16,
});

const SECTION_CONFIG = {
  'Dominic Savio': 'Classes IV-VI',
  'Alphonsa': 'Classes VII-IX',
  'Saint Thomas': 'Classes X-XII'
};
const FORANE_ID = '673799a3cb9b4aa181e53fa2';
const SECTION_COLORS = { 'Dominic Savio': '#2563EB', 'Alphonsa': '#10B981', 'Saint Thomas': '#6366F1' };

const ParticipantList = () => {
  const [parishes, setParishes] = useState([]);
  const [selectedParish, setSelectedParish] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [categoryMap, setCategoryMap] = useState({});
  const [eventStageMap, setEventStageMap] = useState({});
  const debounceRef = useRef(null);
  const parishMapRef = useRef({});

  const loggedParishId = getParishId();
  const isParishMode = !!loggedParishId;

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 250);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [parishRes, eventsRes, categoriesRes] = await Promise.all([
          axiosInstance.get('/parish'),
          axiosInstance.get('/events'),
          axiosInstance.get('/categories')
        ]);

        const allParishes = (parishRes.data || []).filter(
          p => p.forane === FORANE_ID || p.forane?._id === FORANE_ID
        );
        setParishes(allParishes);

        const pMap = {};
        allParishes.forEach(p => { pMap[p._id] = p.name; });
        parishMapRef.current = pMap;

        // Auto-select parish for parish users
        if (loggedParishId) {
          setSelectedParish(loggedParishId);
        }

        const cats = categoriesRes.data?.data?.categories || categoriesRes.data?.categories || categoriesRes.data || [];
        const cMap = {};
        for (const c of cats) { cMap[String(c._id)] = c; }
        setCategoryMap(cMap);

        const evts = eventsRes.data?.data?.events || eventsRes.data?.events || eventsRes.data || [];

        const esMap = {};
        for (const e of evts) {
          let catId = '';
          if (e.category && typeof e.category === 'object' && e.category._id) {
            catId = String(e.category._id);
            if (e.category.stage) { esMap[String(e._id)] = e.category.stage; continue; }
          } else { catId = String(e.category || ''); }
          esMap[String(e._id)] = cMap[catId]?.stage || '';
        }
        setEventStageMap(esMap);

        setAllEvents(evts.map(e => ({
          _id: e._id, eventName: e.eventName, eventType: e.eventType,
          section: e.section, gender: e.gender, category: e.category
        })).sort((a, b) => a.eventName.localeCompare(b.eventName)));

        // For parish mode, only fetch that parish's registrations
        const parishesToFetch = loggedParishId
          ? allParishes.filter(p => p._id === loggedParishId)
          : allParishes;

        const regResults = await Promise.allSettled(
          parishesToFetch.map(p => axiosInstance.get(`/registrations/parish/${p._id}`))
        );
        const regs = [];
        regResults.forEach(r => {
          if (r.status === 'fulfilled') {
            const items = r.value.data?.data?.registrations || [];
            regs.push(...items);
          }
        });
        setAllRegistrations(regs);
        setDataLoaded(true);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally { setIsLoading(false); }
    };
    fetchAll();
  }, [loggedParishId]);

  const getRegStage = useCallback((reg) => {
    const evtId = typeof reg.event === 'object' ? String(reg.event?._id || '') : String(reg.event || '');
    return eventStageMap[evtId] || '';
  }, [eventStageMap]);

  const filteredRegistrations = useMemo(() => {
    if (!dataLoaded) return [];
    const q = debouncedSearch.toLowerCase();
    return allRegistrations.filter(reg => {
      if (selectedParish && (reg.parish?._id || reg.parish) !== selectedParish) return false;
      if (selectedSection && (reg.event?.section !== selectedSection)) return false;
      if (selectedEvent && reg.event?._id !== selectedEvent) return false;
      if (selectedGender && reg.gender !== selectedGender) return false;
      if (selectedStage) { if (getRegStage(reg) !== selectedStage) return false; }
      if (q) {
        if (!reg.name?.toLowerCase().includes(q) &&
          !reg.registrationNumber?.toLowerCase().includes(q) &&
          !reg.groupRegistrationNumber?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allRegistrations, selectedParish, selectedSection, selectedEvent, selectedGender, selectedStage, debouncedSearch, dataLoaded, getRegStage]);

  const uniqueParticipants = useMemo(() => {
    const grouped = {};
    for (let i = 0; i < filteredRegistrations.length; i++) {
      const reg = filteredRegistrations[i];
      const eventSection = reg.event?.section || reg.section;
      const key = `${reg.name}|${reg.standard}|${reg.gender}|${reg.dob}|${reg.parish?._id || reg.parish}|${eventSection}`;
      let entry = grouped[key];
      if (!entry) {
        const isCross = reg.section !== eventSection;
        entry = {
          name: reg.name, standard: reg.standard, gender: reg.gender,
          dob: reg.dob, section: eventSection, originalSection: reg.section,
          isCrossSectionParticipation: isCross,
          parish: reg.parish?.name || parishMapRef.current[reg.parish] || '',
          events: [], regNums: new Set()
        };
        grouped[key] = entry;
      }
      entry.events.push({ name: reg.event?.eventName, type: reg.event?.eventType });
      if (reg.registrationNumber) entry.regNums.add(reg.registrationNumber);
      if (reg.groupRegistrationNumber) entry.regNums.add(reg.groupRegistrationNumber);
    }
    return Object.values(grouped).sort((a, b) => {
      switch (sortBy) {
        case 'parish':
          return a.parish.localeCompare(b.parish) || a.name.localeCompare(b.name);
        case 'regNo': {
          const aVal = parseInt([...a.regNums][0] || '') || 999999;
          const bVal = parseInt([...b.regNums][0] || '') || 999999;
          return aVal - bVal || a.name.localeCompare(b.name);
        }
        case 'class':
          return (a.standard || '').localeCompare(b.standard || '') || a.name.localeCompare(b.name);
        case 'section':
          return (a.section || '').localeCompare(b.section || '') || a.name.localeCompare(b.name);
        case 'events': {
          const aEv = a.events.map(e => e.name).sort().join(',');
          const bEv = b.events.map(e => e.name).sort().join(',');
          return aEv.localeCompare(bEv) || a.name.localeCompare(b.name);
        }
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [filteredRegistrations, sortBy]);

  const filteredEvents = useMemo(() => {
    let evts = allEvents;
    if (selectedSection) evts = evts.filter(e => e.section === selectedSection);
    if (selectedStage) evts = evts.filter(e => eventStageMap[String(e._id)] === selectedStage);
    return evts;
  }, [allEvents, selectedSection, selectedStage, eventStageMap]);

  const stats = useMemo(() => {
    let boys = 0, girls = 0;
    for (const p of uniqueParticipants) { if (p.gender === 'M') boys++; else girls++; }
    return { total: filteredRegistrations.length, unique: uniqueParticipants.length, boys, girls };
  }, [filteredRegistrations.length, uniqueParticipants]);

  const parishName = useMemo(() =>
    selectedParish ? parishMapRef.current[selectedParish] || '' : '',
    [selectedParish]
  );

  const hasFilter = selectedParish || selectedSection || selectedEvent || selectedGender || selectedStage;

  // In parish mode: hide Reg No column when "On Stage" is selected
  // In admin mode: always show Reg No
  const showRegNo = isParishMode ? selectedStage !== 'On Stage' : true;

  // In parish mode: hide Parish column since it's always their own parish
  const showParishCol = !isParishMode;

  const totalCols = 7 + (showRegNo ? 1 : 0) + (showParishCol ? 1 : 0);

  const buildPrintHTML = () => {
    let html = '';
    const totalPages = Math.max(1, Math.ceil(uniqueParticipants.length / ROWS_PER_PAGE));

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const startRow = pageIdx * ROWS_PER_PAGE;
      const pageParticipants = uniqueParticipants.slice(startRow, startRow + ROWS_PER_PAGE);

      html += `${pageIdx > 0 ? '<div style="page-break-before: always; break-before: page;"></div>' : ''}`;
      html += `
        <div style="text-align: center; margin-bottom: 10px;">
          <h4 style="font-size: 18px; font-weight: bold; margin: 0;">ഫൊറോന കലോത്സവം 2026</h4>
          <div style="font-size: 14px; margin-top: 4px;">
            ${selectedParish ? `Parish: ${parishName}` : 'All Parishes'}
            ${selectedSection ? ` | Section: ${selectedSection}` : ''}
            ${selectedStage ? ` | ${selectedStage}` : ''}
            ${selectedEvent ? ` | Event: ${allEvents.find(e => e._id === selectedEvent)?.eventName || ''}` : ''}
            ${selectedGender ? ` | Gender: ${selectedGender === 'M' ? 'Boys' : 'Girls'}` : ''}
          </div>
          <div style="font-size: 13px; margin-top: 2px;">
            Total Participants: ${stats.unique} | Boys: ${stats.boys} | Girls: ${stats.girls} | Page ${pageIdx + 1} of ${totalPages}
          </div>
        </div>
      `;

      html += `<table style="font-size: 13px; width: 100%; border-collapse: collapse;">`;
      html += `<thead><tr>
        <th style="border: 1px solid black; padding: 5px 6px; text-align: center; width: 30px;">Sl</th>
        <th style="border: 1px solid black; padding: 5px 6px; text-align: left;">Name</th>
        ${showParishCol ? '<th style="border: 1px solid black; padding: 5px 6px; text-align: left;">Parish</th>' : ''}
        <th style="border: 1px solid black; padding: 5px 6px; text-align: center; width: 50px;">Class</th>
        <th style="border: 1px solid black; padding: 5px 6px; text-align: center; width: 55px;">Gender</th>
        <th style="border: 1px solid black; padding: 5px 6px; text-align: center; width: 85px;">DOB</th>
        <th style="border: 1px solid black; padding: 5px 6px; text-align: left;">Section</th>
        <th style="border: 1px solid black; padding: 5px 6px; text-align: left;">Events</th>
        ${showRegNo ? '<th style="border: 1px solid black; padding: 5px 6px; text-align: left;">Reg No</th>' : ''}
      </tr></thead>`;

      html += `<tbody>`;
      pageParticipants.forEach((p, rowIdx) => {
        const globalIdx = startRow + rowIdx;
        const dob = new Date(p.dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const events = p.events.map(e => e.name).join(', ');
        const regNums = [...p.regNums].join(', ');
        const crossBadge = p.isCrossSectionParticipation
          ? ` <span style="background: #FEF3C7; color: #D97706; border: 1px solid #F59E0B; border-radius: 4px; padding: 1px 5px; font-size: 10px; margin-left: 4px;">From ${p.originalSection}</span>`
          : '';
        html += `<tr style="height: 26px;">
          <td style="border: 1px solid black; padding: 4px 6px; text-align: center;">${globalIdx + 1}</td>
          <td style="border: 1px solid black; padding: 4px 6px;">${p.name}${crossBadge}</td>
          ${showParishCol ? `<td style="border: 1px solid black; padding: 4px 6px;">${p.parish}</td>` : ''}
          <td style="border: 1px solid black; padding: 4px 6px; text-align: center;">${p.standard}</td>
          <td style="border: 1px solid black; padding: 4px 6px; text-align: center;">${p.gender === 'M' ? 'Boy' : 'Girl'}</td>
          <td style="border: 1px solid black; padding: 4px 6px; text-align: center;">${dob}</td>
          <td style="border: 1px solid black; padding: 4px 6px;">${p.section}</td>
          <td style="border: 1px solid black; padding: 4px 6px;">${events}</td>
          ${showRegNo ? `<td style="border: 1px solid black; padding: 4px 6px;">${regNums}</td>` : ''}
        </tr>`;
      });
      html += `</tbody></table>`;
    }
    return html;
  };

  const handlePrint = () => {
    const content = buildPrintHTML();
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
      <head>
        <title>Participant List</title>
        <style>
          @page { size: A4 landscape; margin: 5mm; }
          * { font-family: Arial, sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 100%; }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const statisticsCards = [
    { title: 'Unique Participants', value: stats.unique, color: '#2563EB', icon: <UserCheck size={24} /> },
    { title: 'Total Registrations', value: stats.total, color: '#10B981', icon: <Users size={24} /> },
    { title: 'Boys', value: stats.boys, color: '#6366F1', icon: <Users size={24} /> },
    { title: 'Girls', value: stats.girls, color: '#F59E0B', icon: <Users size={24} /> },
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
                      Participant List
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {dataLoaded
                        ? isParishMode
                          ? `${allRegistrations.length} registrations loaded for ${parishName}`
                          : `${allRegistrations.length} registrations loaded — filter instantly`
                        : 'Loading all registrations…'}
                    </Typography>
                  </Box>
                  {hasFilter && uniqueParticipants.length > 0 && (
                    <Button variant="contained" startIcon={<Printer size={24} />}
                      onClick={handlePrint}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                      Print List
                    </Button>
                  )}
                </PageHeader>
              </Grid>

              {/* Filters */}
              <Grid item xs={12} className="no-print">
                <ChartCard>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c', mb: 2.5 }}>Filters</Typography>
                  <Grid container spacing={2}>
                    {/* Parish filter — only for admin */}
                    {!isParishMode && (
                      <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small"><InputLabel>Parish</InputLabel>
                          <Select value={selectedParish} label="Parish"
                            onChange={(e) => { setSelectedParish(e.target.value); setSelectedEvent(''); setSearchQuery(''); setDebouncedSearch(''); }}>
                            <MenuItem value="">All Parishes</MenuItem>
                            {parishes.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    <Grid item xs={6} md={2}>
                      <FormControl fullWidth size="small"><InputLabel>Section</InputLabel>
                        <Select value={selectedSection} label="Section"
                          onChange={(e) => { setSelectedSection(e.target.value); setSelectedEvent(''); }}>
                          <MenuItem value="">All Sections</MenuItem>
                          {Object.keys(SECTION_CONFIG).map(sec => (
                            <MenuItem key={sec} value={sec}>{sec} ({SECTION_CONFIG[sec]})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} md={1.5}>
                      <FormControl fullWidth size="small"><InputLabel>Stage</InputLabel>
                        <Select value={selectedStage} label="Stage"
                          onChange={(e) => { setSelectedStage(e.target.value); setSelectedEvent('Off Stage'); }}>
                          {!isParishMode && ( <MenuItem value="">All</MenuItem>)}
                          <MenuItem value="On Stage">On Stage</MenuItem>
                          <MenuItem value="Off Stage">Off Stage</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <FormControl fullWidth size="small"><InputLabel>Event</InputLabel>
                        <Select value={selectedEvent} label="Event"
                          onChange={(e) => setSelectedEvent(e.target.value)}>
                          <MenuItem value="">All Events</MenuItem>
                          {filteredEvents.map(ev => (
                            <MenuItem key={ev._id} value={ev._id}>{ev.eventName} ({ev.eventType})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} md={1.5}>
                      <FormControl fullWidth size="small"><InputLabel>Gender</InputLabel>
                        <Select value={selectedGender} label="Gender"
                          onChange={(e) => setSelectedGender(e.target.value)}>
                          <MenuItem value="">All</MenuItem>
                          <MenuItem value="M">Boys</MenuItem>
                          <MenuItem value="F">Girls</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} md={1.5}>
                      <TextField fullWidth size="small" label="Search" value={searchQuery} onChange={handleSearchChange} />
                    </Grid>
                    <Grid item xs={6} md={1.5}>
                      <FormControl fullWidth size="small"><InputLabel>Order By</InputLabel>
                        <Select value={sortBy} label="Order By" onChange={(e) => setSortBy(e.target.value)}>
                          <MenuItem value="name">Name</MenuItem>
                          {!isParishMode && <MenuItem value="parish">Parish</MenuItem>}
                          <MenuItem value="regNo">Reg No</MenuItem>
                          <MenuItem value="section">Section</MenuItem>
                          <MenuItem value="events">Events</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </ChartCard>
              </Grid>

              {/* Stat Cards */}
              {(hasFilter || isParishMode) && !isLoading && statisticsCards.map((stat, i) => (
                <Grid item xs={6} sm={3} key={i} className="no-print">
                  <StyledCard><StyledCardContent>
                    <StatWrapper>
                      <Box>
                        <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.title}</Typography>
                        <StatValue sx={{ fontSize: '1.75rem' }}>{stat.value}</StatValue>
                      </Box>
                      <IconBox color={stat.color} sx={{ width: 44, height: 44, borderRadius: 12 }}>{stat.icon}</IconBox>
                    </StatWrapper>
                  </StyledCardContent></StyledCard>
                </Grid>
              ))}

              {/* Table */}
              {isLoading ? (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 5, gap: 1.5 }}>
                    <CircularProgress size={32} />
                    <Typography sx={{ fontSize: '13px', color: '#94A3B8' }}>Loading all registrations (one-time)…</Typography>
                  </Box>
                </Grid>
              ) : (hasFilter || isParishMode) ? (
                <Grid item xs={12}>
                  <ChartCard className="print-area">
                    {(() => {
                      const totalPages = Math.max(1, Math.ceil(uniqueParticipants.length / ROWS_PER_PAGE));
                      return Array.from({ length: totalPages }).map((_, pageIdx) => {
                        const startRow = pageIdx * ROWS_PER_PAGE;
                        const pageParticipants = uniqueParticipants.slice(startRow, startRow + ROWS_PER_PAGE);
                        const isLastPage = pageIdx === totalPages - 1;

                        return (
                          <Box key={pageIdx} className={pageIdx > 0 ? 'print-page-break' : ''}>
                            {/* Print Header */}
                            <Box textAlign="center" mb={1} sx={{ display: 'none', '@media print': { display: 'block' } }}>
                              <Typography variant="h5" fontWeight="bold">ഫൊറോന കലോത്സവം 2026</Typography>
                              <Typography variant="subtitle1">
                                {selectedParish ? `Parish: ${parishName}` : 'All Parishes'}
                                {selectedSection && ` | Section: ${selectedSection}`}
                                {selectedStage && ` | ${selectedStage}`}
                                {selectedEvent && ` | Event: ${allEvents.find(e => e._id === selectedEvent)?.eventName || ''}`}
                              </Typography>
                              <Typography variant="body2">
                                Total Participants: {stats.unique} | Boys: {stats.boys} | Girls: {stats.girls}
                              </Typography>
                            </Box>

                            <Box className="no-print" sx={{ mb: 1 }}>
                              <Chip label={`Page ${pageIdx + 1} of ${totalPages}`} size="small"
                                sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 600 }} />
                            </Box>

                            <TableContainer sx={{ borderRadius: pageIdx === 0 ? 2 : 0, border: '1px solid rgba(0,0,0,0.08)' }}>
                              <Table size="medium" sx={{
                                '& th, & td': { border: '1px solid rgba(0,0,0,0.08)', padding: '8px 10px', fontSize: '0.9rem' }
                              }}>
                                <TableHead>
                                  <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                                    <TableCell sx={{ fontWeight: 700, width: 40, fontSize: '0.9rem' }}>Sl</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Name</TableCell>
                                    {showParishCol && <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Parish</TableCell>}
                                    <TableCell sx={{ fontWeight: 700, width: 60, fontSize: '0.9rem' }}>Class</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: 60, fontSize: '0.9rem' }}>Gender</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: 100, fontSize: '0.9rem' }}>DOB</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Section</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Events</TableCell>
                                    {showRegNo && <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Reg No</TableCell>}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {pageParticipants.length > 0 ? pageParticipants.map((participant, rowIdx) => {
                                    const globalIdx = startRow + rowIdx;
                                    const sColor = SECTION_COLORS[participant.section] || '#6366F1';
                                    return (
                                      <TableRow key={globalIdx} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                        <TableCell sx={{ fontSize: '0.9rem' }}>{globalIdx + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                          {participant.name}
                                          {participant.isCrossSectionParticipation && (
                                            <Chip size="small" label={`From ${participant.originalSection}`}
                                              sx={{ ml: 1, fontSize: '0.7rem', height: 20, bgcolor: '#F59E0B15', color: '#D97706', border: '1px solid #F59E0B30', fontWeight: 600 }} />
                                          )}
                                        </TableCell>
                                        {showParishCol && (
                                          <TableCell>
                                            <Chip size="small" label={participant.parish} sx={{
                                              bgcolor: '#2563EB15', color: '#2563EB', border: '1px solid #2563EB30',
                                              fontWeight: 600, fontSize: '0.8rem', height: 26
                                            }} />
                                          </TableCell>
                                        )}
                                        <TableCell sx={{ fontSize: '0.9rem' }}>{participant.standard}</TableCell>
                                        <TableCell sx={{ fontSize: '0.9rem' }}>{participant.gender === 'M' ? 'Boy' : 'Girl'}</TableCell>
                                        <TableCell sx={{ fontSize: '0.85rem' }}>
                                          {new Date(participant.dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell>
                                          <Chip size="small" label={participant.section} sx={{
                                            bgcolor: `${sColor}15`, color: sColor, border: `1px solid ${sColor}30`,
                                            fontWeight: 600, fontSize: '0.8rem', height: 26
                                          }} />
                                        </TableCell>
                                        <TableCell>
                                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {participant.events.map((ev, i) => (
                                              <Chip key={i} label={ev.name} size="small" variant="outlined" sx={{
                                                fontSize: '0.75rem', height: 24,
                                                borderColor: ev.type === 'group' ? '#10B981' : 'rgba(0,0,0,0.15)',
                                                color: ev.type === 'group' ? '#10B981' : 'inherit',
                                              }} />
                                            ))}
                                          </Box>
                                        </TableCell>
                                        {showRegNo && (
                                          <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                            {[...participant.regNums].join(', ')}
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    );
                                  }) : (
                                    <TableRow>
                                      <TableCell colSpan={totalCols} align="center" sx={{ py: 5 }}>
                                        <Search size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                                        <Typography color="textSecondary">No participants found</Typography>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>

                            {!isLastPage && (
                              <Box className="no-print" sx={{ my: 3, borderTop: '3px dashed #ccc', position: 'relative' }}>
                                <Chip label="Page Break" size="small" sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', bgcolor: '#f0f0f0', fontSize: '11px' }} />
                              </Box>
                            )}
                          </Box>
                        );
                      });
                    })()}
                  </ChartCard>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <ChartCard>
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                      <Users size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                      <Typography color="textSecondary" sx={{ fontSize: '1.05rem' }}>
                        {dataLoaded ? 'Select a parish, section, event or gender to view participant list' : 'Loading registrations…'}
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

export default ParticipantList;
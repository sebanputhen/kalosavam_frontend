import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Container, Typography, Grid, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer,
  CircularProgress, Chip, Button, IconButton, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Drawer, useMediaQuery, Fade, Slide,
  LinearProgress
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import {
  Award, Users, Target, RefreshCw, Trophy, MapPin, Layers, Music, Search, X,
  SlidersHorizontal, ChevronRight, Clock, Menu as MenuIcon, LayoutDashboard,
  ListOrdered, CalendarDays, Mic, Church
} from 'lucide-react';
import axiosInstance from "../axiosConfig";

const theme = createTheme({
  palette: {
    primary: { main: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
    secondary: { main: '#1E293B' },
    background: { default: '#F5F5F5', paper: '#FFFFFF' },
    text: { primary: '#1E293B', secondary: '#64748B' },
  },
  typography: { fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif' },
  shape: { borderRadius: 4 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
  }
});

// ====== STYLED ======
const HeaderBar = styled(Box)({
  background: '#fff', borderBottom: '3px solid #DC2626',
  position: 'sticky', top: 0, zIndex: 1100,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
});

const NavBar = styled(Box)({
  background: '#1a1a2e', color: '#fff', overflowX: 'auto',
  '&::-webkit-scrollbar': { display: 'none' },
  scrollbarWidth: 'none',
});

const NavItem = styled(Box, { shouldForwardProp: p => p !== 'active' })(({ active }) => ({
  padding: '10px 16px', fontSize: '13px', fontWeight: active ? 700 : 500,
  cursor: 'pointer', whiteSpace: 'nowrap',
  borderBottom: active ? '3px solid #DC2626' : '3px solid transparent',
  color: active ? '#fff' : 'rgba(255,255,255,0.65)',
  transition: 'all 0.15s',
  '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.05)' },
}));

const SectionCard = styled(Box)({
  background: '#fff', border: '1px solid #e5e7eb', overflow: 'hidden',
  '& .card-header': {
    padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  '& .card-title': { fontWeight: 800, fontSize: '14px', color: '#1e293b' },
});

const KpiCard = styled(Box)(({ accentcolor = '#DC2626' }) => ({
  background: '#fff', border: '1px solid #e5e7eb', padding: '14px 16px',
  position: 'relative', overflow: 'hidden',
  '&::before': {
    content: '""', position: 'absolute', top: 0, left: 0,
    width: '4px', height: '100%', background: accentcolor,
  },
}));

const LiveBadge = styled(Box)({
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: '#DC2626', color: '#fff', padding: '3px 10px',
  fontWeight: 800, fontSize: '11px', letterSpacing: '1px',
  '& .pulse': {
    width: 7, height: 7, borderRadius: '50%', background: '#fff',
    animation: 'livePulse 1.5s ease-in-out infinite',
  },
  '@keyframes livePulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
});

const SidebarCard = styled(Box)({
  background: '#fff', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '12px',
  '& .sb-header': {
    padding: '10px 14px', borderBottom: '1px solid #e5e7eb',
    fontWeight: 700, fontSize: '12px', color: '#1e293b',
    textTransform: 'uppercase', letterSpacing: '0.5px', background: '#fafafa',
  },
});

const tblSx = {
  '& th': { color: '#64748B', fontWeight: 700, borderBottom: '2px solid #e5e7eb', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1, background: '#fafafa', whiteSpace: 'nowrap' },
  '& td': { color: '#1E293B', borderBottom: '1px solid #f1f5f9', py: 1, fontSize: '12px' },
  '& tr:hover td': { background: '#fafafa' },
};

const printStyles = `@media print{@page{size:A4 landscape;margin:8mm}.no-print{display:none!important}.bottom-nav{display:none!important}}`;

// ====== CONSTANTS ======
const COLORS = ['#DC2626','#2563EB','#16A34A','#EA580C','#7C3AED','#0891B2','#D97706','#EC4899'];
const SECTION_CONFIG = { 'Dominic Savio': 'Classes IV-VI', 'Alphonsa': 'Classes VII-IX', 'Saint Thomas': 'Classes X-XII' };
const SECTION_COLORS = { 'Dominic Savio': '#DC2626', 'Alphonsa': '#2563EB', 'Saint Thomas': '#16A34A' };
const DIVISION_CONFIG = [
  { key: 'A', label: 'Division A', desc: '> 500 Families', color: '#2563EB', check: n => n > 500 },
  { key: 'B', label: 'Division B', desc: '200–500 Families', color: '#7C3AED', check: n => n >= 200 && n <= 500 },
  { key: 'C', label: 'Division C', desc: '< 200 Families', color: '#EA580C', check: n => n < 200 },
];
const getParishDivision = fc => { const n = parseInt(fc)||0; for (const d of DIVISION_CONFIG) if (d.check(n)) return d.key; return 'C'; };
const getDivConfig = key => DIVISION_CONFIG.find(d => d.key === key) || DIVISION_CONFIG[2];
const getEventStage = e => e.category?.stage || e.stage || 'Unknown';
const FORANE_ID = '673799a3cb9b4aa181e53fa2';
const POS_EMOJI = { '1':'🥇','2':'🥈','3':'🥉' };

const MiniBar = ({ value, max, color = '#DC2626', height = 6 }) => (
  <Box sx={{ width: '100%', height, background: '#f1f5f9', borderRadius: 0.5, overflow: 'hidden' }}>
    <Box sx={{ width: `${max > 0 ? (value/max)*100 : 0}%`, height: '100%', background: color, transition: 'width 0.6s' }} />
  </Box>
);

const DonutChart = ({ data, size = 160, stroke = 24 }) => {
  const total = data.reduce((s,d) => s + d.value, 0);
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  let off = 0;
  return (
    <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const pct = total > 0 ? d.value/total : 0, dash = pct*circ, doff = -off;
          off += dash;
          return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={d.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={doff}
            transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dasharray 0.6s' }} />;
        })}
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontWeight: 900, fontSize: '24px', color: '#1e293b', lineHeight: 1 }}>{total}</Typography>
        <Typography sx={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>TOTAL POINTS</Typography>
      </Box>
    </Box>
  );
};

// ====== COMPONENT ======
const ResultsDashboardPro = () => {
  const [activeView, setActiveView] = useState('dashboard');
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [parishModalOpen, setParishModalOpen] = useState(false);
  const [selectedParishName, setSelectedParishName] = useState('');
  const [modalSectionFilter, setModalSectionFilter] = useState('');
  const [venueModalOpen, setVenueModalOpen] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [now, setNow] = useState(new Date());

  const isMobile = useMediaQuery('(max-width:768px)');
  const isSmall = useMediaQuery('(max-width:480px)');
  const isDesktop = useMediaQuery('(min-width:1024px)');

  useEffect(() => { fetchAllData(); }, []);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/event-scoring/event-scoring/forane/${FORANE_ID}/dashboard`);
      const { eventScorings, events: ev, parishes: pa, stageAllocation: sa } = res.data.data;
      setScorings(eventScorings||[]); setEvents(ev||[]); setParishes(pa||[]); setStageAllocation(sa||null);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  // ====== DATA (all from API) ======
  const parishDivisionMap = useMemo(() => { const m={}; parishes.forEach(p => { m[p.name]=getParishDivision(p.phone); }); return m; }, [parishes]);
  const parishFamilyMap = useMemo(() => { const m={}; parishes.forEach(p => { m[p.name]=parseInt(p.phone)||0; }); return m; }, [parishes]);

  const allResults = useMemo(() => {
    const r=[];
    for (const s of scorings) {
      const ev=s.eventId||{}, eventName=ev.eventName||'Unknown', section=ev.section||s.section||'', eventType=ev.eventType||'';
      if (!s.participants) continue;
      for (const p of s.participants) r.push({ ...p, eventName, section, eventType });
    }
    return r;
  }, [scorings]);

  const filteredResults = useMemo(() => {
    let r=allResults;
    if (selectedSection) r=r.filter(x=>x.section===selectedSection);
    if (selectedEvent) r=r.filter(x=>x.eventName===selectedEvent);
    if (selectedDivision) r=r.filter(x=>parishDivisionMap[x.parish]===selectedDivision);
    return r;
  }, [allResults, selectedSection, selectedEvent, selectedDivision, parishDivisionMap]);

  const filteredUniqueEvents = useMemo(() => {
    const base=selectedSection ? allResults.filter(r=>r.section===selectedSection) : allResults;
    return [...new Set(base.map(r=>r.eventName))].sort();
  }, [allResults, selectedSection]);

  const availableStages = useMemo(() => [...new Set(events.map(e=>getEventStage(e)))].filter(s=>s!=='Unknown').sort(), [events]);

  const buildStandings = useCallback((results) => {
    const map={};
    for (const r of results) {
      const p=r.parish||'Unknown'; let m=map[p];
      if (!m) { m={parish:p,totalPoints:0,
        ind:{firsts:0,seconds:0,thirds:0,gradeA:0,gradeB:0,gradeC:0,firstsPts:0,secondsPts:0,thirdsPts:0,gradeAPts:0,gradeBPts:0,gradeCPts:0},
        grp:{firsts:0,seconds:0,thirds:0,gradeA:0,gradeB:0,gradeC:0,firstsPts:0,secondsPts:0,thirdsPts:0,gradeAPts:0,gradeBPts:0,gradeCPts:0},
        eventsSet:new Set()}; map[p]=m; }
      m.totalPoints+=r.totalPoints||0;
      const t=r.eventType==='group'?m.grp:m.ind;
      if (r.position==='1'){t.firsts++;t.firstsPts+=(r.totalPoints||0);} else if (r.position==='2'){t.seconds++;t.secondsPts+=(r.totalPoints||0);} else if (r.position==='3'){t.thirds++;t.thirdsPts+=(r.totalPoints||0);}
      if (r.grade==='A'){t.gradeA++;t.gradeAPts+=(r.totalPoints||0);} else if (r.grade==='B'){t.gradeB++;t.gradeBPts+=(r.totalPoints||0);} else if (r.grade==='C'){t.gradeC++;t.gradeCPts+=(r.totalPoints||0);}
      m.eventsSet.add(r.eventName);
    }
    return Object.values(map).map(p=>{
      const i=p.ind,g=p.grp;
      return {...p, eventsCount:p.eventsSet.size, division:parishDivisionMap[p.parish]||'C', families:parishFamilyMap[p.parish]||0,
        firsts:i.firsts+g.firsts, seconds:i.seconds+g.seconds, thirds:i.thirds+g.thirds,
        gradeA:i.gradeA+g.gradeA, gradeB:i.gradeB+g.gradeB, gradeC:i.gradeC+g.gradeC};
    }).sort((a,b)=>b.totalPoints-a.totalPoints);
  }, [parishDivisionMap, parishFamilyMap]);

  const parishStandings = useMemo(() => buildStandings(filteredResults), [filteredResults, buildStandings]);

  const eventResults = useMemo(() => {
    if (activeView!=='events' && activeView!=='dashboard') return [];
    const map={};
    const src = activeView==='dashboard' ? allResults : filteredResults;
    src.forEach(r => {
      const key=`${r.eventName}|${r.section}`;
      if (!map[key]) map[key]={eventName:r.eventName, section:r.section, eventType:r.eventType, winners:[]};
      if (r.position && ['1','2','3'].includes(r.position))
        map[key].winners.push({position:r.position, name:r.participantType==='Group'?r.parish:r.participantName, parish:r.parish, grade:r.grade, totalPoints:r.totalPoints});
    });
    let result=Object.values(map).map(e=>({...e, winners:e.winners.sort((a,b)=>+a.position - +b.position)}));
    if (searchQuery && activeView==='events') { const q=searchQuery.toLowerCase(); result=result.filter(e=>e.eventName.toLowerCase().includes(q)||e.winners.some(w=>w.name?.toLowerCase().includes(q)||w.parish?.toLowerCase().includes(q))); }
    return result.sort((a,b)=>a.section.localeCompare(b.section)||a.eventName.localeCompare(b.eventName));
  }, [allResults, filteredResults, searchQuery, activeView]);

  const sectionSummary = useMemo(() => {
    const map={};
    allResults.forEach(r => {
      const s=r.section||'Unknown';
      if (!map[s]) map[s]={section:s,scoredEvents:new Set(),totalEvents:new Set(),participants:0,totalPoints:0,parishes:{}};
      map[s].participants++; map[s].totalPoints+=r.totalPoints||0; map[s].scoredEvents.add(r.eventName);
      if (!map[s].parishes[r.parish]) map[s].parishes[r.parish]={parish:r.parish,totalPoints:0};
      map[s].parishes[r.parish].totalPoints+=r.totalPoints||0;
    });
    events.forEach(e => { if (map[e.section]) map[e.section].totalEvents.add(e.eventName); });
    return Object.values(map).map(s=>({...s, totalEventsCount:s.totalEvents.size, scoredEventsCount:s.scoredEvents.size, parishStandings:Object.values(s.parishes).sort((a,b)=>b.totalPoints-a.totalPoints)}));
  }, [allResults, events]);

  const stageGroupedEvents = useMemo(() => {
    if (activeView!=='stages') return {};
    const g={}; events.forEach(e => { const st=getEventStage(e); if (!g[st]) g[st]=[]; g[st].push(e); });
    Object.values(g).forEach(a=>a.sort((a,b)=>(a.section||'').localeCompare(b.section||'')||(a.eventName||'').localeCompare(b.eventName||'')));
    return g;
  }, [events, activeView]);

  const stageWinnersMap = useMemo(() => {
    if (activeView!=='stages') return {};
    const esm={}; events.forEach(e=>{esm[`${e.eventName}|${e.section}`]=getEventStage(e);});
    const map={};
    allResults.forEach(r => {
      const stage=esm[`${r.eventName}|${r.section}`]||'Unknown';
      if (selectedStage && stage!==selectedStage) return;
      if (r.position && ['1','2','3'].includes(r.position)) {
        const key=`${stage}|${r.eventName}|${r.section}`;
        if (!map[key]) map[key]=[];
        map[key].push({position:r.position, name:r.participantType==='Group'?r.parish:r.participantName, parish:r.parish, grade:r.grade, totalPoints:r.totalPoints});
      }
    });
    return map;
  }, [allResults, events, selectedStage, activeView]);

  const venueData = useMemo(() => {
    if (activeView!=='venues'||!stageAllocation?.venues) return [];
    const wl={};
    allResults.forEach(r => {
      if (r.position&&['1','2','3'].includes(r.position)) {
        const k=`${r.eventName}|${r.section}`; if (!wl[k]) wl[k]=[]; wl[k].push({position:r.position, name:r.participantType==='Group'?r.parish:r.participantName, parish:r.parish, grade:r.grade, totalPoints:r.totalPoints});
      }
    });
    return stageAllocation.venues.filter(v=>v.venueId).map(v => {
      const venue=v.venueId, ve=(v.eventIds||[]).filter(Boolean);
      const sc=ve.filter(e=>wl[`${e.eventName}|${e.section}`]?.length>0).length;
      const filtered=ve.filter(e=>(!selectedSection||e.section===selectedSection)&&(!searchQuery||e.eventName?.toLowerCase().includes(searchQuery.toLowerCase())));
      return {venueId:venue._id, venueName:venue.name||'Unknown Venue', totalEvents:ve.length, scoredCount:sc, events:filtered.sort((a,b)=>(a.section||'').localeCompare(b.section||'')||(a.eventName||'').localeCompare(b.eventName||'')), winnersLookup:wl};
    }).filter(v=>!selectedVenue||v.venueId===selectedVenue).sort((a,b)=>a.venueName.localeCompare(b.venueName));
  }, [stageAllocation, allResults, activeView, selectedSection, searchQuery, selectedVenue]);

  const availableVenues = useMemo(() => {
    if (!stageAllocation?.venues) return [];
    return stageAllocation.venues.filter(v=>v.venueId).map(v=>({id:v.venueId._id, name:v.venueId.name||'Unknown'})).sort((a,b)=>a.name.localeCompare(b.name));
  }, [stageAllocation]);

  const parishDetailData = useMemo(() => {
    if (!selectedParishName) return null;
    let results=allResults.filter(r=>r.parish===selectedParishName);
    if (modalSectionFilter) results=results.filter(r=>r.section===modalSectionFilter);
    const dc=getDivConfig(parishDivisionMap[selectedParishName]||'C');
    let totalPoints=0, firsts=0, seconds=0, thirds=0, gradeA=0, gradeB=0, gradeC=0;
    const prizeList=[], sectionPoints={};
    results.forEach(r => {
      totalPoints+=r.totalPoints||0;
      if (r.position==='1') firsts++; else if (r.position==='2') seconds++; else if (r.position==='3') thirds++;
      if (r.grade==='A') gradeA++; else if (r.grade==='B') gradeB++; else if (r.grade==='C') gradeC++;
      if (!sectionPoints[r.section]) sectionPoints[r.section]=0;
      sectionPoints[r.section]+=r.totalPoints||0;
      if (r.position&&['1','2','3'].includes(r.position))
        prizeList.push({eventName:r.eventName, section:r.section, eventType:r.eventType, position:r.position, participantName:r.participantType==='Group'?'Group':(r.participantName||'—'), grade:r.grade, totalPoints:r.totalPoints||0});
    });
    prizeList.sort((a,b)=>+a.position - +b.position||a.section.localeCompare(b.section));
    const gradedList=results.filter(r=>!r.position||!['1','2','3'].includes(r.position)).map(r=>({eventName:r.eventName, section:r.section, participantName:r.participantType==='Group'?'Group':(r.participantName||'—'), grade:r.grade, totalPoints:r.totalPoints||0})).sort((a,b)=>a.section.localeCompare(b.section));
    return {dc,totalPoints,firsts,seconds,thirds,gradeA,gradeB,gradeC,prizeList,gradedList,sectionPoints,totalEntries:results.length,filteredBySection:modalSectionFilter};
  }, [selectedParishName, allResults, parishDivisionMap, modalSectionFilter]);

  const parishPrizeListData = useMemo(() => {
    if (activeView!=='parishes') return [];
    const map={};
    allResults.forEach(r => {
      const p=r.parish||'Unknown';
      if (!map[p]) map[p]={parish:p, totalPoints:0, firsts:0, seconds:0, thirds:0, prizes:[], graded:[]};
      map[p].totalPoints+=r.totalPoints||0;
      const pos=String(r.position||'');
      if (pos==='1') map[p].firsts++; else if (pos==='2') map[p].seconds++; else if (pos==='3') map[p].thirds++;
      if (['1','2','3'].includes(pos)) map[p].prizes.push({eventName:r.eventName, section:r.section, position:pos, participantName:r.participantType==='Group'?'Group':(r.participantName||'—'), grade:r.grade, totalPoints:r.totalPoints||0});
      else map[p].graded.push({eventName:r.eventName, section:r.section, participantName:r.participantType==='Group'?'Group':(r.participantName||'—'), grade:r.grade, totalPoints:r.totalPoints||0});
    });
    let list=Object.values(map).sort((a,b)=>b.totalPoints-a.totalPoints);
    list.forEach(p => { p.prizes.sort((a,b)=>+a.position - +b.position); p.graded.sort((a,b)=>a.section.localeCompare(b.section)); });
    if (selectedSection) list=list.map(p=>({...p, prizes:p.prizes.filter(r=>r.section===selectedSection), graded:p.graded.filter(r=>r.section===selectedSection)})).filter(p=>p.prizes.length>0||p.graded.length>0);
    if (selectedDivision) list=list.filter(p=>(parishDivisionMap[p.parish]||'C')===selectedDivision);
    if (searchQuery) { const q=searchQuery.toLowerCase(); list=list.filter(p=>p.parish.toLowerCase().includes(q)); }
    return list;
  }, [allResults, activeView, parishDivisionMap, selectedSection, selectedDivision, searchQuery]);

  const maxPoints = parishStandings[0]?.totalPoints||1;
  const totalEvents_n = events.length;
  const scoredEventsCount = scorings.length;
  const totalParticipants = allResults.length;
  const totalMedals = useMemo(() => allResults.filter(r=>r.position&&['1','2','3'].includes(r.position)).length, [allResults]);
  const completionPct = totalEvents_n>0 ? Math.round((scoredEventsCount/totalEvents_n)*100) : 0;
  const recentUpdates = useMemo(() => eventResults.filter(e=>e.winners.length>0).slice(-6).reverse(), [eventResults]);

  const openParishModal = (name, sec='') => { setSelectedParishName(name); setModalSectionFilter(sec); setParishModalOpen(true); };
  const closeParishModal = () => { setParishModalOpen(false); setSelectedParishName(''); setModalSectionFilter(''); };
  const ParishLink = ({ name, sx={} }) => (
    <Typography component="span" onClick={e=>{e.stopPropagation();openParishModal(name);}}
      sx={{ cursor:'pointer', color:'#2563EB', fontSize:'inherit', fontWeight:'inherit', '&:hover':{textDecoration:'underline'}, ...sx }}>{name}</Typography>
  );

  const views = [
    { key:'dashboard', label:'Dashboard', icon:<LayoutDashboard size={16}/> },
    { key:'standings', label:'Standings', icon:<ListOrdered size={16}/> },
    { key:'events', label:'Events', icon:<CalendarDays size={16}/> },
    { key:'sections', label:'Sections', icon:<Layers size={16}/> },
    { key:'stages', label:'Stages', icon:<Mic size={16}/> },
    { key:'venues', label:'Venues', icon:<MapPin size={16}/> },
    { key:'parishes', label:'Parishes', icon:<Church size={16}/> },
  ];

  const resetFilters = () => { setSelectedSection(''); setSelectedEvent(''); setSelectedDivision(''); setSearchQuery(''); setSelectedStage(''); setSelectedVenue(''); };
  const hasFilters = selectedSection||selectedEvent||searchQuery||selectedDivision||selectedStage||selectedVenue;
  const filterCount = [selectedSection,selectedEvent,searchQuery,selectedDivision,selectedStage,selectedVenue].filter(Boolean).length;

  // ====== MOBILE FILTER DRAWER ======
  const renderFilterDrawerContent = (showSearch, showStage, showVenue, showDivision) => (
    <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
      <FormControl size="small" fullWidth>
        <InputLabel sx={{fontSize:'13px'}}>Section</InputLabel>
        <Select value={selectedSection} label="Section" onChange={e=>{setSelectedSection(e.target.value);setSelectedEvent('');}}>
          <MenuItem value="">All Sections</MenuItem>
          {Object.keys(SECTION_CONFIG).map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
      </FormControl>
      {showStage && <FormControl size="small" fullWidth><InputLabel sx={{fontSize:'13px'}}>Stage</InputLabel><Select value={selectedStage} label="Stage" onChange={e=>setSelectedStage(e.target.value)}><MenuItem value="">All Stages</MenuItem>{availableStages.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>}
      {showVenue && availableVenues.length>0 && <FormControl size="small" fullWidth><InputLabel sx={{fontSize:'13px'}}>Venue</InputLabel><Select value={selectedVenue} label="Venue" onChange={e=>setSelectedVenue(e.target.value)}><MenuItem value="">All Venues</MenuItem>{availableVenues.map(v=><MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}</Select></FormControl>}
      {!showStage && !showVenue && <FormControl size="small" fullWidth><InputLabel sx={{fontSize:'13px'}}>Event</InputLabel><Select value={selectedEvent} label="Event" onChange={e=>setSelectedEvent(e.target.value)}><MenuItem value="">All Events</MenuItem>{filteredUniqueEvents.map(ev=><MenuItem key={ev} value={ev}>{ev}</MenuItem>)}</Select></FormControl>}
      {showDivision && !showStage && !showVenue && <FormControl size="small" fullWidth><InputLabel sx={{fontSize:'13px'}}>Division</InputLabel><Select value={selectedDivision} label="Division" onChange={e=>setSelectedDivision(e.target.value)}><MenuItem value="">All Divisions</MenuItem>{DIVISION_CONFIG.map(d=><MenuItem key={d.key} value={d.key}>{d.label}</MenuItem>)}</Select></FormControl>}
      {showSearch && <TextField size="small" placeholder="Search..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} fullWidth InputProps={{startAdornment:<InputAdornment position="start"><Search size={14} color="#94A3B8"/></InputAdornment>}} />}
      {hasFilters && <Button onClick={resetFilters} sx={{color:'#DC2626',fontWeight:700}}>Clear All Filters</Button>}
      <Button fullWidth variant="contained" onClick={()=>setFilterDrawerOpen(false)} sx={{bgcolor:'#1a1a2e','&:hover':{bgcolor:'#2d2d4a'},borderRadius:1,py:1.2}}>Apply</Button>
    </Box>
  );

  const FilterBar = ({ showSearch=false, showStage=false, showVenue=false, showDivision=false }) => {
    if (isMobile) return (
      <Box sx={{ px:1.5, py:1, borderBottom:'1px solid #e5e7eb', display:'flex', gap:1, alignItems:'center', background:'#fafafa' }}>
        <Button size="small" startIcon={<SlidersHorizontal size={14}/>} onClick={()=>setFilterDrawerOpen(true)}
          sx={{ fontSize:'12px', border: hasFilters?'1.5px solid #DC2626':'1.5px solid #e5e7eb', color: hasFilters?'#DC2626':'#64748b', borderRadius:1, px:1.5, bgcolor:'#fff' }}>
          Filters {filterCount>0 && <Chip label={filterCount} size="small" sx={{ml:0.5,height:16,fontSize:'9px',fontWeight:700,bgcolor:'#DC2626',color:'#fff'}}/>}
        </Button>
        {showSearch && <TextField size="small" placeholder="Search..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
          sx={{ flex:1, '& .MuiOutlinedInput-root':{fontSize:'12px',height:34,borderRadius:1,bgcolor:'#fff'} }}
          InputProps={{startAdornment:<InputAdornment position="start"><Search size={12} color="#94A3B8"/></InputAdornment>}} />}
        <IconButton size="small" onClick={fetchAllData} sx={{border:'1px solid #e5e7eb',borderRadius:1,width:34,height:34,bgcolor:'#fff'}}><RefreshCw size={14}/></IconButton>
        <Drawer anchor="bottom" open={filterDrawerOpen} onClose={()=>setFilterDrawerOpen(false)} PaperProps={{sx:{borderRadius:'16px 16px 0 0',p:3,maxHeight:'70vh'}}}>
          <Box sx={{width:36,height:4,borderRadius:2,bgcolor:'#cbd5e1',mx:'auto',mb:2.5}}/>
          <Typography sx={{fontWeight:700,fontSize:'16px',mb:2}}>Filters</Typography>
          {renderFilterDrawerContent(showSearch, showStage, showVenue, showDivision)}
        </Drawer>
      </Box>
    );
    return (
      <Box sx={{ px:2, py:1.2, background:'#fafafa', borderBottom:'1px solid #e5e7eb', display:'flex', gap:1.5, flexWrap:'wrap', alignItems:'center' }}>
        <FormControl size="small" sx={{minWidth:140}}><InputLabel sx={{fontSize:'12px'}}>Section</InputLabel><Select value={selectedSection} label="Section" onChange={e=>{setSelectedSection(e.target.value);setSelectedEvent('');}} sx={{fontSize:'12px',bgcolor:'#fff'}}><MenuItem value="">All Sections</MenuItem>{Object.keys(SECTION_CONFIG).map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>
        {showStage && <FormControl size="small" sx={{minWidth:140}}><InputLabel sx={{fontSize:'12px'}}>Stage</InputLabel><Select value={selectedStage} label="Stage" onChange={e=>setSelectedStage(e.target.value)} sx={{fontSize:'12px',bgcolor:'#fff'}}><MenuItem value="">All Stages</MenuItem>{availableStages.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>}
        {showVenue && availableVenues.length>0 && <FormControl size="small" sx={{minWidth:140}}><InputLabel sx={{fontSize:'12px'}}>Venue</InputLabel><Select value={selectedVenue} label="Venue" onChange={e=>setSelectedVenue(e.target.value)} sx={{fontSize:'12px',bgcolor:'#fff'}}><MenuItem value="">All Venues</MenuItem>{availableVenues.map(v=><MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}</Select></FormControl>}
        {!showStage && !showVenue && <FormControl size="small" sx={{minWidth:140}}><InputLabel sx={{fontSize:'12px'}}>Event</InputLabel><Select value={selectedEvent} label="Event" onChange={e=>setSelectedEvent(e.target.value)} sx={{fontSize:'12px',bgcolor:'#fff'}}><MenuItem value="">All Events</MenuItem>{filteredUniqueEvents.map(ev=><MenuItem key={ev} value={ev}>{ev}</MenuItem>)}</Select></FormControl>}
        {showDivision && !showStage && !showVenue && <FormControl size="small" sx={{minWidth:140}}><InputLabel sx={{fontSize:'12px'}}>Division</InputLabel><Select value={selectedDivision} label="Division" onChange={e=>setSelectedDivision(e.target.value)} sx={{fontSize:'12px',bgcolor:'#fff'}}><MenuItem value="">All Divisions</MenuItem>{DIVISION_CONFIG.map(d=><MenuItem key={d.key} value={d.key}>{d.label}</MenuItem>)}</Select></FormControl>}
        {showSearch && <TextField size="small" placeholder="Search..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} sx={{minWidth:180,'& .MuiOutlinedInput-root':{fontSize:'12px',bgcolor:'#fff'}}} InputProps={{startAdornment:<InputAdornment position="start"><Search size={14} color="#94A3B8"/></InputAdornment>}} />}
        {hasFilters && <Button size="small" onClick={resetFilters} sx={{color:'#DC2626',fontSize:'11px',fontWeight:700}}>Clear</Button>}
        <Box sx={{ml:'auto'}}><IconButton size="small" onClick={fetchAllData} sx={{border:'1px solid #e5e7eb',borderRadius:1}}><RefreshCw size={14}/></IconButton></Box>
      </Box>
    );
  };

  // ====== SIDEBAR ======
  const Sidebar = () => (
    <Box sx={{ width: isDesktop?280:'100%', flexShrink:0 }}>
      <SidebarCard>
        <Box className="sb-header" sx={{display:'flex',alignItems:'center',gap:1}}>
          <LiveBadge><Box className="pulse"/>LIVE</LiveBadge>
          <Typography sx={{fontSize:'11px',color:'#64748b',ml:'auto'}}>Status</Typography>
        </Box>
        <Box sx={{p:'12px 14px'}}>
          <Box sx={{display:'flex',justifyContent:'space-between',mb:0.5}}>
            <Typography sx={{fontSize:'11px',color:'#64748b'}}>Events Completed</Typography>
            <Typography sx={{fontSize:'12px',fontWeight:700}}>{scoredEventsCount} / {totalEvents_n}</Typography>
          </Box>
          <LinearProgress variant="determinate" value={completionPct} sx={{height:6,borderRadius:0.5,bgcolor:'#f1f5f9','& .MuiLinearProgress-bar':{bgcolor:'#DC2626',borderRadius:0.5}}}/>
          <Typography sx={{fontSize:'11px',color:'#DC2626',fontWeight:700,mt:0.3,textAlign:'right'}}>{completionPct}%</Typography>
        </Box>
      </SidebarCard>
      <SidebarCard>
        <Box className="sb-header">Section Progress</Box>
        <Box sx={{p:'12px 14px'}}>
          {sectionSummary.map((sec,i)=>{
            const pct=sec.totalEventsCount>0?Math.round((sec.scoredEventsCount/sec.totalEventsCount)*100):0;
            const col=SECTION_COLORS[sec.section]||COLORS[i];
            return (
              <Box key={sec.section} sx={{mb:1.2}}>
                <Box sx={{display:'flex',justifyContent:'space-between',mb:0.2}}>
                  <Typography sx={{fontSize:'11px',fontWeight:600}}>{sec.section}</Typography>
                  <Typography sx={{fontSize:'10px',fontWeight:700,color:col}}>{pct}%</Typography>
                </Box>
                <MiniBar value={sec.scoredEventsCount} max={sec.totalEventsCount} color={col}/>
                <Typography sx={{fontSize:'9px',color:'#94a3b8',mt:0.1}}>{sec.scoredEventsCount}/{sec.totalEventsCount} events</Typography>
              </Box>
            );
          })}
        </Box>
      </SidebarCard>
      {stageAllocation?.venues?.length > 0 && <SidebarCard>
        <Box className="sb-header">Venue Progress</Box>
        <Box sx={{p:'12px 14px'}}>
          {(() => {
            const wl = {};
            allResults.forEach(r => {
              if (r.position && ['1','2','3'].includes(r.position)) {
                const k = `${r.eventName}|${r.section}`;
                if (!wl[k]) wl[k] = true;
              }
            });
            const venueList = stageAllocation.venues.filter(v => v.venueId).map((v, i) => {
              const venue = v.venueId;
              const ve = (v.eventIds || []).filter(Boolean);
              const sc = ve.filter(e => wl[`${e.eventName}|${e.section}`]).length;
              const pct = ve.length > 0 ? Math.round((sc / ve.length) * 100) : 0;
              return { id: venue._id, name: venue.name || 'Unknown', sc, total: ve.length, pct };
            }).sort((a, b) => a.name.localeCompare(b.name));
            return venueList.map((v, i) => {
              const col = COLORS[i % COLORS.length];
              const isActive = venueModalOpen && selectedVenueId === v.id;
              return (
                <Box key={v.id} onClick={() => openVenueModal(v.id)}
                  sx={{mb:1.2, cursor:'pointer', p:0.8, mx:-0.8, borderRadius:0.5,
                    bgcolor: isActive ? `${col}08` : 'transparent',
                    border: isActive ? `1px solid ${col}30` : '1px solid transparent',
                    '&:hover':{ bgcolor: `${col}05` }, transition:'all 0.15s'}}>
                  <Box sx={{display:'flex',justifyContent:'space-between',mb:0.2}}>
                    <Typography sx={{fontSize:'11px',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,mr:1,color: isActive ? col : '#1e293b'}}>{v.name}</Typography>
                    <Typography sx={{fontSize:'10px',fontWeight:700,color:col,flexShrink:0}}>{v.pct}%</Typography>
                  </Box>
                  <MiniBar value={v.sc} max={v.total} color={col}/>
                  <Typography sx={{fontSize:'9px',color:'#94a3b8',mt:0.1}}>{v.sc}/{v.total} events</Typography>
                </Box>
              );
            });
          })()}
        </Box>
      </SidebarCard>}
    </Box>
  );

  // ====== PARISH MODAL ======
  const ParishModal = () => {
    if (!parishDetailData) return null;
    const d=parishDetailData;
    return (
      <Dialog open={parishModalOpen} onClose={closeParishModal} maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{sx:{borderRadius:isMobile?0:2,maxHeight:isMobile?'100%':'90vh'}}}
        TransitionComponent={isMobile?Slide:Fade} TransitionProps={isMobile?{direction:'up'}:{}}>
        <DialogTitle sx={{p:0}}>
          <Box sx={{background:'#1a1a2e',p:isMobile?2:2.5,color:'#fff',position:'relative',pt:isMobile?'calc(env(safe-area-inset-top) + 16px)':2.5}}>
            <IconButton onClick={closeParishModal} sx={{position:'absolute',right:10,top:isMobile?'calc(env(safe-area-inset-top) + 6px)':10,color:'#fff'}}><X size={18}/></IconButton>
            <Typography sx={{fontWeight:900,fontSize:isMobile?'18px':'22px',pr:5}}>{selectedParishName}</Typography>
            {d.filteredBySection && <Chip label={d.filteredBySection} size="small" sx={{bgcolor:'rgba(255,255,255,0.15)',color:'#fff',fontWeight:700,height:20,mt:0.5,fontSize:'10px'}}/>}
            <Box sx={{display:'flex',gap:isSmall?2:3,mt:1.5}}>
              {[{val:d.totalPoints,label:'Points'},{val:d.firsts+d.seconds+d.thirds,label:'Prizes'},{val:d.totalEntries,label:'Entries'}].map(s=>(
                <Box key={s.label} sx={{textAlign:'center'}}>
                  <Typography sx={{fontWeight:900,fontSize:isSmall?'20px':'26px'}}>{s.val}</Typography>
                  <Typography sx={{fontSize:'9px',opacity:0.6,fontWeight:600}}>{s.label}</Typography>
                </Box>
              ))}
              <Box sx={{display:'flex',gap:0.5,alignItems:'center',ml:'auto'}}>
                {d.firsts>0&&<Typography sx={{fontSize:'13px'}}>🥇{d.firsts}</Typography>}
                {d.seconds>0&&<Typography sx={{fontSize:'13px'}}>🥈{d.seconds}</Typography>}
                {d.thirds>0&&<Typography sx={{fontSize:'13px'}}>🥉{d.thirds}</Typography>}
              </Box>
            </Box>
          </Box>
          <Box sx={{height:3,bgcolor:'#DC2626'}}/>
        </DialogTitle>
        <DialogContent sx={{p:0}}>
          <Box sx={{p:1.5,borderBottom:'1px solid #e5e7eb',display:'flex',gap:0.8,flexWrap:'wrap'}}>
            <Chip label={`A: ${d.gradeA}`} size="small" sx={{bgcolor:'#DCFCE7',color:'#16A34A',fontWeight:700,height:20,fontSize:'10px'}}/>
            <Chip label={`B: ${d.gradeB}`} size="small" sx={{bgcolor:'#DBEAFE',color:'#2563EB',fontWeight:700,height:20,fontSize:'10px'}}/>
            <Chip label={`C: ${d.gradeC}`} size="small" sx={{bgcolor:'#FEF3C7',color:'#D97706',fontWeight:700,height:20,fontSize:'10px'}}/>
            <Box sx={{ml:'auto',display:'flex',gap:1,flexWrap:'wrap'}}>
              {Object.entries(d.sectionPoints).sort((a,b)=>b[1]-a[1]).map(([sec,pts])=>(
                <Typography key={sec} sx={{fontSize:'10px',color:'#64748B'}}><strong>{sec}:</strong> {pts}</Typography>
              ))}
            </Box>
          </Box>
          {d.prizeList.length>0 && (
            <Box sx={{p:1.5}}>
              <Typography sx={{fontWeight:800,fontSize:'13px',mb:0.8}}>Prize Winners ({d.prizeList.length})</Typography>
              {d.prizeList.map((r,idx)=>(
                <Box key={idx} sx={{display:'flex',alignItems:'center',gap:1,py:0.6,borderBottom:'1px solid #f8fafc'}}>
                  <Typography sx={{fontSize:'15px',width:22}}>{POS_EMOJI[r.position]}</Typography>
                  <Box sx={{flex:1,minWidth:0}}>
                    <Typography sx={{fontWeight:600,fontSize:'12px'}}>{r.eventName}</Typography>
                    <Box sx={{display:'flex',gap:0.5}}><Chip label={r.section} size="small" sx={{height:14,fontSize:'8px'}}/>{r.grade&&<Chip label={r.grade} size="small" sx={{height:14,fontSize:'8px',fontWeight:700,bgcolor:r.grade==='A'?'#DCFCE7':r.grade==='B'?'#DBEAFE':'#FEF3C7',color:r.grade==='A'?'#16A34A':r.grade==='B'?'#2563EB':'#D97706'}}/>}</Box>
                    {r.participantName!=='Group'&&<Typography sx={{fontSize:'10px',color:'#94a3b8'}}>{r.participantName}</Typography>}
                  </Box>
                  <Typography sx={{fontWeight:800,fontSize:'13px',color:'#DC2626'}}>{r.totalPoints}</Typography>
                </Box>
              ))}
            </Box>
          )}
          {d.gradedList.length>0 && (
            <Box sx={{p:1.5,pt:d.prizeList.length>0?0:1.5}}>
              <Typography sx={{fontWeight:800,fontSize:'13px',mb:0.8,color:'#64748b'}}>Other Entries ({d.gradedList.length})</Typography>
              {d.gradedList.map((r,idx)=>(
                <Box key={idx} sx={{display:'flex',alignItems:'center',gap:1,py:0.4,borderBottom:'1px solid #f8fafc'}}>
                  <Typography sx={{width:18,fontSize:'10px',color:'#94a3b8',textAlign:'right'}}>{idx+1}</Typography>
                  <Box sx={{flex:1}}><Typography sx={{fontSize:'11px',fontWeight:600}}>{r.eventName}</Typography>{r.participantName!=='Group'&&<Typography sx={{fontSize:'9px',color:'#94a3b8'}}>{r.participantName}</Typography>}</Box>
                  {r.grade&&<Chip label={r.grade} size="small" sx={{height:16,fontSize:'9px',fontWeight:700}}/>}
                  <Typography sx={{fontWeight:700,fontSize:'11px',color:'#64748b'}}>{r.totalPoints}</Typography>
                </Box>
              ))}
            </Box>
          )}
          {d.prizeList.length===0&&d.gradedList.length===0 && <Box sx={{textAlign:'center',py:6}}><Typography sx={{color:'#94a3b8',fontSize:'13px'}}>No results recorded yet.</Typography></Box>}
        </DialogContent>
        <DialogActions sx={{p:1.5,borderTop:'1px solid #e5e7eb',pb:isMobile?'calc(env(safe-area-inset-bottom) + 12px)':1.5}}>
          <Button onClick={closeParishModal} fullWidth={isMobile} variant="contained" sx={{borderRadius:1,bgcolor:'#1a1a2e','&:hover':{bgcolor:'#2d2d4a'}}}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ====== VENUE MODAL ======
  const openVenueModal = (venueId) => { setSelectedVenueId(venueId); setVenueModalOpen(true); };
  const closeVenueModal = () => { setVenueModalOpen(false); setSelectedVenueId(null); };

  const venueModalData = useMemo(() => {
    if (!selectedVenueId || !stageAllocation?.venues) return null;
    const v = stageAllocation.venues.find(x => x.venueId?._id === selectedVenueId);
    if (!v || !v.venueId) return null;
    const venue = v.venueId;
    const ve = (v.eventIds || []).filter(Boolean);
    const wl = {};
    allResults.forEach(r => {
      if (r.position && ['1','2','3'].includes(r.position)) {
        const k = `${r.eventName}|${r.section}`;
        if (!wl[k]) wl[k] = [];
        wl[k].push({ position: r.position, name: r.participantType === 'Group' ? r.parish : r.participantName, parish: r.parish, grade: r.grade, totalPoints: r.totalPoints });
      }
    });
    const scoredCount = ve.filter(e => wl[`${e.eventName}|${e.section}`]?.length > 0).length;
    const sorted = [...ve].sort((a, b) => (a.section || '').localeCompare(b.section || '') || (a.eventName || '').localeCompare(b.eventName || ''));
    return { venueName: venue.name || 'Unknown', totalEvents: ve.length, scoredCount, events: sorted, winnersLookup: wl };
  }, [selectedVenueId, stageAllocation, allResults]);

  const VenueModal = () => {
    if (!venueModalData) return null;
    const vm = venueModalData;
    const pct = vm.totalEvents > 0 ? Math.round((vm.scoredCount / vm.totalEvents) * 100) : 0;
    return (
      <Dialog open={venueModalOpen} onClose={closeVenueModal} maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2, maxHeight: isMobile ? '100%' : '90vh' } }}
        TransitionComponent={isMobile ? Slide : Fade} TransitionProps={isMobile ? { direction: 'up' } : {}}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ background: '#1a1a2e', p: isMobile ? 2 : 2.5, color: '#fff', position: 'relative', pt: isMobile ? 'calc(env(safe-area-inset-top) + 16px)' : 2.5 }}>
            <IconButton onClick={closeVenueModal} sx={{ position: 'absolute', right: 10, top: isMobile ? 'calc(env(safe-area-inset-top) + 6px)' : 10, color: '#fff' }}><X size={18} /></IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <MapPin size={18} />
              <Typography sx={{ fontWeight: 900, fontSize: isMobile ? '18px' : '22px', pr: 5 }}>{vm.venueName}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, mt: 1.5 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 900, fontSize: '22px' }}>{vm.totalEvents}</Typography>
                <Typography sx={{ fontSize: '9px', opacity: 0.6, fontWeight: 600 }}>Events</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 900, fontSize: '22px' }}>{vm.scoredCount}</Typography>
                <Typography sx={{ fontSize: '9px', opacity: 0.6, fontWeight: 600 }}>Scored</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 900, fontSize: '22px' }}>{pct}%</Typography>
                <Typography sx={{ fontSize: '9px', opacity: 0.6, fontWeight: 600 }}>Complete</Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ height: 3, bgcolor: '#DC2626' }} />
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: isMobile ? 1.5 : 2, display: 'flex', flexDirection: 'column', gap: isMobile ? 1.5 : 2 }}>
            {vm.events.map((event, idx) => {
              const winners = (vm.winnersLookup[`${event.eventName}|${event.section}`] || []).sort((a, b) => +a.position - +b.position);
              const w = pos => winners.find(x => x.position === pos);
              const scored = winners.length > 0;
              return (
                <Box key={event._id || idx} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, overflow: 'hidden', bgcolor: scored ? '#fafffe' : '#fff' }}>
                  <Box sx={{ px: isMobile ? 1.5 : 2, py: 1.2, borderBottom: scored ? '1px solid #e5e7eb' : 'none', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: isMobile ? '14px' : '15px', flex: 1, color: '#1e293b' }}>{event.eventName}</Typography>
                    <Chip label={event.section} size="small" sx={{ height: 22, fontSize: '10px', fontWeight: 600, bgcolor: '#f1f5f9', color: '#1e293b' }} />
                    <Chip label={event.eventType === 'group' ? 'Group' : 'Individual'} size="small" sx={{ height: 22, fontSize: '10px', fontWeight: 600 }} />
                    {event.gender && <Chip label={event.gender === 'male' ? 'Boys' : event.gender === 'female' ? 'Girls' : 'All'} size="small" sx={{ height: 22, fontSize: '10px', fontWeight: 600, bgcolor: '#f1f5f9' }} />}
                    {scored && <Chip label="Scored" size="small" sx={{ bgcolor: '#DCFCE7', color: '#16A34A', fontWeight: 700, height: 22, fontSize: '10px' }} />}
                  </Box>
                  {scored && (
                    <Box sx={{ px: isMobile ? 1.5 : 2, py: 1 }}>
                      {['1', '2', '3'].map(pos => { const wn = w(pos); if (!wn) return null; return (
                        <Box key={pos} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                          <Typography sx={{ fontSize: '18px', width: 24, textAlign: 'center' }}>{POS_EMOJI[pos]}</Typography>
                          <Typography sx={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, flex: 1, color: '#1e293b' }}>{wn.name}</Typography>
                          <ParishLink name={wn.parish} sx={{ fontSize: isMobile ? '12px' : '13px' }} />
                          {wn.grade && <Chip label={`Grade ${wn.grade}`} size="small" sx={{ height: 20, fontSize: '10px', fontWeight: 700, bgcolor: wn.grade === 'A' ? '#DCFCE7' : wn.grade === 'B' ? '#DBEAFE' : '#FEF3C7', color: wn.grade === 'A' ? '#16A34A' : wn.grade === 'B' ? '#2563EB' : '#D97706' }} />}
                        </Box>
                      ); })}
                    </Box>
                  )}
                  {!scored && <Box sx={{ px: isMobile ? 1.5 : 2, py: 1 }}><Typography sx={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Result pending</Typography></Box>}
                </Box>
              );
            })}
            {vm.events.length === 0 && <Box sx={{ textAlign: 'center', py: 5 }}><Typography sx={{ color: '#94a3b8', fontSize: '13px' }}>No events allocated</Typography></Box>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 1.5, borderTop: '1px solid #e5e7eb', pb: isMobile ? 'calc(env(safe-area-inset-bottom) + 12px)' : 1.5 }}>
          <Button onClick={closeVenueModal} fullWidth={isMobile} variant="contained" sx={{ borderRadius: 1, bgcolor: '#1a1a2e', '&:hover': { bgcolor: '#2d2d4a' } }}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ====== RENDER ======
  return (
    <ThemeProvider theme={theme}>
      <style>{printStyles}</style>
      <Box sx={{ minHeight:'100vh', bgcolor:'#f5f5f5', pb: isMobile?'calc(60px + env(safe-area-inset-bottom))':4 }}>

        {/* HEADER */}
        <HeaderBar className="no-print">
          <Container maxWidth="xl" sx={{px:isMobile?1.5:3}}>
            <Box sx={{display:'flex',alignItems:'center',py:1,gap:1.5}}>
              {isMobile && <IconButton size="small" onClick={()=>setMobileMenuOpen(true)}><MenuIcon size={20}/></IconButton>}
              <Box sx={{flex:1,minWidth:0}}>
                <Typography sx={{fontWeight:900,fontSize:isMobile?'14px':'18px',color:'#1a1a2e',lineHeight:1.1,letterSpacing:'-0.02em'}}>ഫൊറോന കലോത്സവം</Typography>
                <Typography sx={{fontSize:isMobile?'9px':'10px',color:'#DC2626',fontWeight:600,letterSpacing:'0.5px'}}>FORANE KALOLSAVAM 2026</Typography>
              </Box>
              {!isMobile && <TextField size="small" placeholder="Search parish, event..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                sx={{width:240,'& .MuiOutlinedInput-root':{fontSize:'12px',borderRadius:1,bgcolor:'#f5f5f5','& fieldset':{borderColor:'#e5e7eb'}}}}
                InputProps={{startAdornment:<InputAdornment position="start"><Search size={14} color="#94A3B8"/></InputAdornment>}} />}
              <Box sx={{display:'flex',alignItems:'center',gap:0.8}}>
                {!isSmall && <Typography sx={{fontSize:'10px',color:'#64748b'}}>{now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</Typography>}
                <IconButton size="small" onClick={fetchAllData} sx={{border:'1px solid #e5e7eb',borderRadius:1}}><RefreshCw size={15}/></IconButton>
              </Box>
            </Box>
          </Container>
        </HeaderBar>

        {/* NAV - desktop */}
        {!isMobile && <NavBar className="no-print"><Container maxWidth="xl" sx={{px:3}}><Box sx={{display:'flex'}}>{views.map(v=><NavItem key={v.key} active={activeView===v.key} onClick={()=>setActiveView(v.key)}>{v.label}</NavItem>)}</Box></Container></NavBar>}

        {/* MOBILE MENU DRAWER */}
        <Drawer anchor="left" open={mobileMenuOpen} onClose={()=>setMobileMenuOpen(false)} PaperProps={{sx:{width:250,bgcolor:'#1a1a2e',color:'#fff'}}}>
          <Box sx={{p:2.5}}>
            <Typography sx={{fontWeight:900,fontSize:'15px',mb:2.5}}>ഫൊറോന കലോത്സവം</Typography>
            {views.map(v=>(
              <Box key={v.key} onClick={()=>{setActiveView(v.key);setMobileMenuOpen(false);}}
                sx={{py:1,px:1,display:'flex',alignItems:'center',gap:1,cursor:'pointer',fontWeight:activeView===v.key?700:400,fontSize:'13px',color:activeView===v.key?'#fff':'rgba(255,255,255,0.6)',bgcolor:activeView===v.key?'rgba(220,38,38,0.15)':'transparent',borderLeft:activeView===v.key?'3px solid #DC2626':'3px solid transparent',borderRadius:'0 4px 4px 0',mb:0.3,'&:hover':{bgcolor:'rgba(255,255,255,0.05)'}}}>
                {v.icon}<span>{v.label}</span>
              </Box>
            ))}
          </Box>
        </Drawer>

        {/* CONTENT */}
        <Container maxWidth="xl" sx={{px:isMobile?1:3,pt:isMobile?1:2}}>
          {isLoading ? (
            <Box sx={{display:'flex',flexDirection:'column',alignItems:'center',py:12,gap:2}}>
              <CircularProgress size={28} sx={{color:'#DC2626'}}/><Typography sx={{fontSize:'12px',color:'#94a3b8'}}>Loading...</Typography>
            </Box>
          ) : (
            <Box sx={{display:'flex',gap:2,alignItems:'flex-start'}}>
              <Box sx={{flex:1,minWidth:0}}>

                {/* ===== DASHBOARD ===== */}
                {activeView==='dashboard' && (<Box>
                  {/* LIVE Banner */}
                  <SectionCard sx={{mb:isMobile?1.5:2}}>
                    <Box sx={{p:isMobile?1.5:2.5,background:'linear-gradient(135deg,#1a1a2e 0%,#2d2d4a 100%)',color:'#fff'}}>
                      <Box sx={{display:'flex',alignItems:'center',gap:1,mb:0.8}}>
                        <LiveBadge><Box className="pulse"/>LIVE</LiveBadge>
                        <Typography sx={{fontSize:'10px',color:'rgba(255,255,255,0.45)'}}>Updated {now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</Typography>
                      </Box>
                      <Typography sx={{fontWeight:900,fontSize:isMobile?'18px':'28px',letterSpacing:'-0.02em',lineHeight:1.1}}>ഫൊറോന കലോത്സവം 2026</Typography>
                      <Typography sx={{fontSize:'11px',color:'rgba(255,255,255,0.45)',mt:0.3}}>Ponkunnam Forane Kalolsavam — Live Results</Typography>
                      <Box sx={{display:'flex',gap:isMobile?1.5:3,mt:1.5,flexWrap:'wrap'}}>
                        {[{l:'Events',v:totalEvents_n},{l:'Completed',v:scoredEventsCount},{l:'Pending',v:totalEvents_n-scoredEventsCount},{l:'Parishes',v:parishStandings.length}].map(s=>(
                          <Box key={s.l}><Typography sx={{fontWeight:900,fontSize:isMobile?'18px':'24px'}}>{s.v}</Typography><Typography sx={{fontSize:'9px',color:'rgba(255,255,255,0.45)'}}>{s.l}</Typography></Box>
                        ))}
                      </Box>
                    </Box>
                  </SectionCard>

                  {/* KPIs */}
                  <Grid container spacing={isMobile?1:2} sx={{mb:isMobile?1.5:2}}>
                    {[
                      {l:'Total Entries',v:totalParticipants,c:'#DC2626',icon:<Users size={16}/>},
                      {l:'Prizes Awarded',v:totalMedals,c:'#EAB308',icon:<Award size={16}/>},
                      {l:'Completion',v:`${completionPct}%`,c:'#16A34A',icon:<Target size={16}/>},
                      {l:'Leading',v:parishStandings[0]?.parish||'—',c:'#2563EB',icon:<Trophy size={16}/>,sm:true},
                    ].map((k,i)=>(
                      <Grid item xs={6} md={3} key={i}>
                        <KpiCard accentcolor={k.c}>
                          <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                            <Box sx={{minWidth:0,flex:1}}>
                              <Typography sx={{fontSize:'10px',color:'#94a3b8',fontWeight:600,mb:0.2}}>{k.l}</Typography>
                              <Typography sx={{fontWeight:900,fontSize:k.sm?(isMobile?'12px':'14px'):(isMobile?'20px':'26px'),color:'#1e293b',lineHeight:1.1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{k.v}</Typography>
                            </Box>
                            <Box sx={{color:k.c,opacity:0.25}}>{k.icon}</Box>
                          </Box>
                        </KpiCard>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Section Donut + Summary */}
                  <Grid container spacing={isMobile?1.5:2} sx={{mb:isMobile?1.5:2}}>
                  </Grid>

                  {/* Parish Rankings */}
                  <SectionCard sx={{mb:isMobile?1.5:2}}>
                    <Box className="card-header"><Typography className="card-title">Parish Rankings</Typography><Button size="small" onClick={()=>setActiveView('standings')} endIcon={<ChevronRight size={12}/>} sx={{fontSize:'11px',color:'#DC2626'}}>View All</Button></Box>
                    {parishStandings.slice(0,isMobile?8:12).map((p,idx)=>(
                      <Box key={p.parish} onClick={()=>openParishModal(p.parish)} sx={{display:'flex',alignItems:'center',gap:isMobile?0.8:1.5,px:isMobile?1.5:2,py:0.8,borderBottom:'1px solid #f8fafc',cursor:'pointer','&:hover':{bgcolor:'#fafafa'}}}>
                        <Typography sx={{width:22,fontWeight:800,fontSize:'12px',color:idx<3?'#DC2626':'#94a3b8',textAlign:'right'}}>{idx<3?POS_EMOJI[String(idx+1)]:idx+1}</Typography>
                        <Box sx={{flex:1,minWidth:0}}>
                          <Typography sx={{fontWeight:idx<3?700:500,fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.parish}</Typography>
                          <MiniBar value={p.totalPoints} max={maxPoints} color={idx===0?'#DC2626':idx===1?'#2563EB':idx===2?'#16A34A':'#cbd5e1'} height={4}/>
                        </Box>
                        <Typography sx={{fontWeight:800,fontSize:'14px',color:idx<3?'#DC2626':'#1e293b',flexShrink:0}}>{p.totalPoints}</Typography>
                        <Box sx={{display:'flex',gap:0.2,minWidth:40,flexShrink:0,justifyContent:'flex-end'}}>
                          {p.firsts>0&&<Typography sx={{fontSize:'9px'}}>🥇{p.firsts}</Typography>}
                          {p.seconds>0&&<Typography sx={{fontSize:'9px'}}>🥈{p.seconds}</Typography>}
                          {p.thirds>0&&<Typography sx={{fontSize:'9px'}}>🥉{p.thirds}</Typography>}
                        </Box>
                      </Box>
                    ))}
                  </SectionCard>
                </Box>)}

                {/* ===== STANDINGS ===== */}
                {activeView==='standings' && (<SectionCard>
                  <Box className="card-header">
                    <Typography className="card-title">Parish Standings {selectedDivision && `— ${getDivConfig(selectedDivision).label}`}</Typography>
                    <Typography sx={{fontSize:'11px',color:'#94a3b8'}}>{parishStandings.length} parishes</Typography>
                  </Box>
                  <FilterBar showDivision/>
                  {isMobile ? (
                    /* Mobile: detailed cards */
                    <Box>
                      {parishStandings.map((p,idx)=>{
                        return (
                          <Box key={p.parish} onClick={()=>openParishModal(p.parish)} sx={{display:'flex',alignItems:'center',gap:1,px:1.5,py:1.2,borderBottom:'1px solid #f1f5f9',cursor:'pointer','&:active':{bgcolor:'#fafafa'}}}>
                            <Box sx={{minWidth:30,height:30,borderRadius:1,bgcolor:idx<3?'#DC2626':'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                              {idx<3?<Typography sx={{fontSize:'13px',lineHeight:1}}>{POS_EMOJI[String(idx+1)]}</Typography>:<Typography sx={{fontWeight:700,fontSize:'11px',color:'#94a3b8'}}>{idx+1}</Typography>}
                            </Box>
                            <Box sx={{flex:1,minWidth:0}}>
                              <Typography sx={{fontWeight:idx<3?700:500,fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.parish}</Typography>
                              <Box sx={{width:'100%',mt:0.3,mb:0.3}}><MiniBar value={p.totalPoints} max={maxPoints} color={idx<3?'#DC2626':'#cbd5e1'} height={4}/></Box>
                              <Box sx={{display:'flex',gap:0.8,alignItems:'center',flexWrap:'wrap'}}>
                                <Box sx={{display:'flex',gap:0.3}}>
                                  <Chip label={`A:${p.ind.gradeAPts}+${p.grp.gradeAPts}`} size="small" sx={{height:16,fontSize:'8px',fontWeight:700,bgcolor:'#DCFCE7',color:'#16A34A'}}/>
                                  <Chip label={`B:${p.ind.gradeBPts}+${p.grp.gradeBPts}`} size="small" sx={{height:16,fontSize:'8px',fontWeight:700,bgcolor:'#DBEAFE',color:'#2563EB'}}/>
                                  <Chip label={`C:${p.ind.gradeCPts}+${p.grp.gradeCPts}`} size="small" sx={{height:16,fontSize:'8px',fontWeight:700,bgcolor:'#FEF3C7',color:'#D97706'}}/>
                                </Box>
                                <Typography sx={{fontSize:'9px',color:'#94a3b8'}}>{p.eventsCount} events</Typography>
                              </Box>
                            </Box>
                            <Box sx={{textAlign:'right',flexShrink:0}}>
                              <Typography sx={{fontWeight:800,fontSize:'15px',color:'#DC2626'}}>{p.totalPoints}</Typography>
                              <Box sx={{display:'flex',gap:0.2,justifyContent:'flex-end'}}>
                                {p.firsts>0&&<Typography sx={{fontSize:'9px'}}>🥇{p.firsts}</Typography>}
                                {p.seconds>0&&<Typography sx={{fontSize:'9px'}}>🥈{p.seconds}</Typography>}
                                {p.thirds>0&&<Typography sx={{fontSize:'9px'}}>🥉{p.thirds}</Typography>}
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    /* Desktop: full detailed table */
                    <TableContainer>
                      <Table size="small" sx={tblSx}>
                        <TableHead><TableRow>
                          <TableCell width={50}>#</TableCell>
                          <TableCell>Parish</TableCell>
                          <TableCell sx={{width:'18%'}}>Points</TableCell>
                          <TableCell align="center">🥇<br/><span style={{fontSize:'7px',color:'#94a3b8'}}>I / G</span></TableCell>
                          <TableCell align="center">🥈<br/><span style={{fontSize:'7px',color:'#94a3b8'}}>I / G</span></TableCell>
                          <TableCell align="center">🥉<br/><span style={{fontSize:'7px',color:'#94a3b8'}}>I / G</span></TableCell>
                          <TableCell align="center">A<br/><span style={{fontSize:'7px',color:'#94a3b8'}}>I / G</span></TableCell>
                          <TableCell align="center">B<br/><span style={{fontSize:'7px',color:'#94a3b8'}}>I / G</span></TableCell>
                          <TableCell align="center">C<br/><span style={{fontSize:'7px',color:'#94a3b8'}}>I / G</span></TableCell>
                          <TableCell align="center">Events</TableCell>
                        </TableRow></TableHead>
                        <TableBody>
                          {parishStandings.map((p,idx)=>{
                            return (
                              <TableRow key={p.parish} sx={{cursor:'pointer','&:hover':{background:'rgba(220,38,38,0.02)'}}} onClick={()=>openParishModal(p.parish)}>
                                <TableCell>
                                  <Box sx={{display:'flex',alignItems:'center',gap:0.5}}>
                                    <Typography sx={{fontWeight:800,fontSize:'13px',color:idx<3?'#DC2626':'#94a3b8'}}>{idx+1}</Typography>
                                    {idx<3&&<span>{POS_EMOJI[String(idx+1)]}</span>}
                                  </Box>
                                </TableCell>
                                <TableCell sx={{fontWeight:idx<3?700:500}}><ParishLink name={p.parish}/></TableCell>
                                <TableCell>
                                  <Box sx={{display:'flex',alignItems:'center',gap:1}}>
                                    <Box sx={{flex:1}}><MiniBar value={p.totalPoints} max={maxPoints} color={idx<3?'#DC2626':'#cbd5e1'} height={10}/></Box>
                                    <Typography sx={{fontWeight:800,fontSize:'14px',color:'#DC2626',minWidth:32,textAlign:'right'}}>{p.totalPoints}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center"><Box><Typography sx={{fontWeight:700,fontSize:'11px',color:'#EAB308'}}>{p.ind.firsts>0||p.grp.firsts>0?`${p.ind.firstsPts} / ${p.grp.firstsPts}`:'-'}</Typography><Typography sx={{fontSize:'8px',color:'#b0b0b0'}}>{p.ind.firsts}×5 / {p.grp.firsts}×10</Typography></Box></TableCell>
                                <TableCell align="center"><Box><Typography sx={{fontWeight:700,fontSize:'11px',color:'#94A3B8'}}>{p.ind.seconds>0||p.grp.seconds>0?`${p.ind.secondsPts} / ${p.grp.secondsPts}`:'-'}</Typography><Typography sx={{fontSize:'8px',color:'#b0b0b0'}}>{p.ind.seconds}×3 / {p.grp.seconds}×5</Typography></Box></TableCell>
                                <TableCell align="center"><Box><Typography sx={{fontWeight:700,fontSize:'11px',color:'#D97706'}}>{p.ind.thirds>0||p.grp.thirds>0?`${p.ind.thirdsPts} / ${p.grp.thirdsPts}`:'-'}</Typography><Typography sx={{fontSize:'8px',color:'#b0b0b0'}}>{p.ind.thirds}×1 / {p.grp.thirds}×3</Typography></Box></TableCell>
                                <TableCell align="center"><Box><Typography sx={{fontWeight:700,fontSize:'11px',color:'#16A34A'}}>{p.ind.gradeAPts>0||p.grp.gradeAPts>0?`${p.ind.gradeAPts} / ${p.grp.gradeAPts}`:'-'}</Typography><Typography sx={{fontSize:'8px',color:'#b0b0b0'}}>{p.ind.gradeA}×5 / {p.grp.gradeA}×10</Typography></Box></TableCell>
                                <TableCell align="center"><Box><Typography sx={{fontWeight:700,fontSize:'11px',color:'#2563EB'}}>{p.ind.gradeBPts>0||p.grp.gradeBPts>0?`${p.ind.gradeBPts} / ${p.grp.gradeBPts}`:'-'}</Typography><Typography sx={{fontSize:'8px',color:'#b0b0b0'}}>{p.ind.gradeB}×3 / {p.grp.gradeB}×5</Typography></Box></TableCell>
                                <TableCell align="center"><Box><Typography sx={{fontWeight:700,fontSize:'11px',color:'#D97706'}}>{p.ind.gradeCPts>0||p.grp.gradeCPts>0?`${p.ind.gradeCPts} / ${p.grp.gradeCPts}`:'-'}</Typography><Typography sx={{fontSize:'8px',color:'#b0b0b0'}}>{p.ind.gradeC}×1 / {p.grp.gradeC}×3</Typography></Box></TableCell>
                                <TableCell align="center" sx={{fontWeight:600,color:'#64748b'}}>{p.eventsCount}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </SectionCard>)}

                {/* ===== EVENTS ===== */}
                {activeView==='events' && (<SectionCard>
                  <Box className="card-header"><Typography className="card-title">Event Results</Typography><Chip label={eventResults.length} size="small" sx={{bgcolor:'#DC2626',color:'#fff',fontWeight:700,height:20,fontSize:'10px'}}/></Box>
                  <FilterBar showSearch/>
                  {eventResults.map((ev,idx)=>{
                    const w=pos=>ev.winners.find(x=>x.position===pos); const scored=ev.winners.length>0;
                    return (
                      <Box key={idx} sx={{px:isMobile?1.5:2,py:1,borderBottom:'1px solid #f1f5f9'}}>
                        <Box sx={{display:'flex',alignItems:'center',gap:0.5,mb:scored?0.5:0}}>
                          <Typography sx={{fontWeight:700,fontSize:'12px',flex:1}}>{ev.eventName}</Typography>
                          <Chip label={ev.section} size="small" sx={{height:16,fontSize:'8px',bgcolor:'#f1f5f9'}}/>
                          <Chip label={ev.eventType==='group'?'Grp':'Ind'} size="small" sx={{height:16,fontSize:'8px'}}/>
                          {scored&&<Chip label="✓" size="small" sx={{bgcolor:'#DCFCE7',color:'#16A34A',fontWeight:700,height:16,minWidth:16,'& .MuiChip-label':{px:0.3}}}/>}
                        </Box>
                        {scored&&['1','2','3'].map(pos=>{const wn=w(pos); if (!wn) return null; return (
                          <Box key={pos} sx={{display:'flex',alignItems:'center',gap:0.8,py:0.2,pl:0.5}}>
                            <Typography sx={{fontSize:'13px',width:18}}>{POS_EMOJI[pos]}</Typography>
                            <Typography sx={{flex:1,fontSize:'11px',fontWeight:600}}>{wn.name}</Typography>
                            <ParishLink name={wn.parish} sx={{fontSize:'10px'}}/>
                            {wn.grade&&<Chip label={wn.grade} size="small" sx={{height:14,fontSize:'8px',fontWeight:700}}/>}
                          </Box>
                        );})}
                      </Box>
                    );
                  })}
                  {eventResults.length===0&&<Box sx={{py:5,textAlign:'center',color:'#94a3b8',fontSize:'13px'}}>No results found</Box>}
                </SectionCard>)}

                {/* ===== SECTIONS ===== */}
                {activeView==='sections' && (<Box>
                  <Grid container spacing={isMobile?1:2} sx={{mb:isMobile?1.5:2}}>
                    {sectionSummary.map((sec,i)=>{
                      const pct=sec.totalEventsCount>0?Math.round((sec.scoredEventsCount/sec.totalEventsCount)*100):0;
                      const col=SECTION_COLORS[sec.section]||COLORS[i]; const top3=sec.parishStandings.slice(0,3);
                      return (
                        <Grid item xs={12} md={4} key={sec.section}>
                          <SectionCard>
                            <Box sx={{p:isMobile?1.5:2,borderBottom:`3px solid ${col}`}}>
                              <Box sx={{display:'flex',justifyContent:'space-between',mb:0.8}}>
                                <Box><Typography sx={{fontWeight:800,fontSize:'15px',color:col}}>{sec.section}</Typography><Typography sx={{fontSize:'9px',color:'#94a3b8'}}>{SECTION_CONFIG[sec.section]}</Typography></Box>
                                <Typography sx={{fontWeight:900,fontSize:'22px',color:col}}>{pct}%</Typography>
                              </Box>
                              <Typography sx={{fontSize:'10px',color:'#64748b',mb:1}}>{sec.scoredEventsCount}/{sec.totalEventsCount} events · {sec.participants} entries · {sec.totalPoints} pts</Typography>
                              {top3.map((p,pi)=>(
                                <Box key={p.parish} onClick={()=>openParishModal(p.parish,sec.section)} sx={{display:'flex',alignItems:'center',gap:0.6,py:0.3,cursor:'pointer','&:hover':{bgcolor:'#fafafa'}}}>
                                  <Typography sx={{fontSize:'13px',width:16}}>{POS_EMOJI[String(pi+1)]}</Typography>
                                  <Typography sx={{flex:1,fontWeight:pi===0?700:500,fontSize:'11px'}}>{p.parish}</Typography>
                                  <Typography sx={{fontWeight:700,fontSize:'11px',color:col}}>{p.totalPoints}</Typography>
                                </Box>
                              ))}
                            </Box>
                          </SectionCard>
                        </Grid>
                      );
                    })}
                  </Grid>
                  {sectionSummary.map((sec,si)=>{const col=SECTION_COLORS[sec.section]||COLORS[si]; return (
                    <SectionCard key={sec.section} sx={{mb:isMobile?1.5:2}}>
                      <Box className="card-header" sx={{borderLeft:`4px solid ${col}`}}><Typography className="card-title" sx={{color:col}}>{sec.section} — Full Rankings</Typography></Box>
                      {sec.parishStandings.map((p,idx)=>{const sMax=sec.parishStandings[0]?.totalPoints||1; return (
                        <Box key={p.parish} onClick={()=>openParishModal(p.parish,sec.section)} sx={{display:'flex',alignItems:'center',gap:1,px:isMobile?1.5:2,py:0.6,borderBottom:'1px solid #f8fafc',cursor:'pointer','&:hover':{bgcolor:'#fafafa'}}}>
                          <Typography sx={{width:22,fontWeight:700,fontSize:'11px',color:idx<3?col:'#94a3b8',textAlign:'right'}}>{idx<3?POS_EMOJI[String(idx+1)]:idx+1}</Typography>
                          <Typography sx={{flex:1,fontWeight:idx<3?700:400,fontSize:'11px'}}>{p.parish}</Typography>
                          <Box sx={{width:80}}><MiniBar value={p.totalPoints} max={sMax} color={col} height={5}/></Box>
                          <Typography sx={{fontWeight:700,fontSize:'12px',color:col,minWidth:28,textAlign:'right'}}>{p.totalPoints}</Typography>
                        </Box>
                      );})}
                    </SectionCard>
                  );})}
                </Box>)}

                {/* ===== STAGES ===== */}
                {activeView==='stages' && (<Box>
                  <SectionCard sx={{mb:isMobile?1.5:2}}><Box className="card-header"><Typography className="card-title">Stage Results</Typography></Box><FilterBar showSearch showStage/></SectionCard>
                  {Object.entries(stageGroupedEvents).filter(([stage])=>!selectedStage||stage===selectedStage).map(([stage, stageEvts])=>{
                    const filtered=stageEvts.filter(e=>(!selectedSection||e.section===selectedSection)&&(!searchQuery||e.eventName.toLowerCase().includes(searchQuery.toLowerCase())));
                    if (!filtered.length) return null;
                    return (
                      <SectionCard key={stage} sx={{mb:isMobile?1.5:2}}>
                        <Box className="card-header" sx={{borderLeft:'4px solid #DC2626'}}><Typography className="card-title">{stage}</Typography><Typography sx={{fontSize:'11px',color:'#94a3b8'}}>{filtered.length} events</Typography></Box>
                        <Box sx={{p:isMobile?1.5:2,display:'flex',flexDirection:'column',gap:isMobile?1.5:2}}>
                          {filtered.map((event,idx)=>{
                            const winners=stageWinnersMap[`${stage}|${event.eventName}|${event.section}`]||[];
                            const w=pos=>winners.find(x=>x.position===pos);
                            const scored=winners.length>0;
                            return (
                              <Box key={event._id} sx={{border:'1px solid #e5e7eb',borderRadius:1,overflow:'hidden',bgcolor:scored?'#fafffe':'#fff'}}>
                                <Box sx={{px:isMobile?1.5:2,py:1.2,borderBottom:scored?'1px solid #e5e7eb':'none',display:'flex',alignItems:'center',gap:1,flexWrap:'wrap'}}>
                                  <Typography sx={{fontWeight:700,fontSize:isMobile?'14px':'15px',flex:1,color:'#1e293b'}}>{event.eventName}</Typography>
                                  <Chip label={event.section} size="small" sx={{height:22,fontSize:'10px',fontWeight:600,bgcolor:'#f1f5f9',color:'#1e293b'}}/>
                                  <Chip label={event.eventType==='group'?'Group':'Individual'} size="small" sx={{height:22,fontSize:'10px',fontWeight:600}}/>
                                  {event.gender&&<Chip label={event.gender==='male'?'Boys':event.gender==='female'?'Girls':'All'} size="small" sx={{height:22,fontSize:'10px',fontWeight:600,bgcolor:'#f1f5f9'}}/>}
                                  {scored&&<Chip label="Scored" size="small" sx={{bgcolor:'#DCFCE7',color:'#16A34A',fontWeight:700,height:22,fontSize:'10px'}}/>}
                                </Box>
                                {scored&&(
                                  <Box sx={{px:isMobile?1.5:2,py:1}}>
                                    {['1','2','3'].map(pos=>{const wn=w(pos); if(!wn) return null; return (
                                      <Box key={pos} sx={{display:'flex',alignItems:'center',gap:1,py:0.5}}>
                                        <Typography sx={{fontSize:'18px',width:24,textAlign:'center'}}>{POS_EMOJI[pos]}</Typography>
                                        <Typography sx={{fontSize:isMobile?'13px':'14px',fontWeight:600,flex:1,color:'#1e293b'}}>{wn.name}</Typography>
                                        <ParishLink name={wn.parish} sx={{fontSize:isMobile?'12px':'13px'}}/>
                                        {wn.grade&&<Chip label={`Grade ${wn.grade}`} size="small" sx={{height:20,fontSize:'10px',fontWeight:700,bgcolor:wn.grade==='A'?'#DCFCE7':wn.grade==='B'?'#DBEAFE':'#FEF3C7',color:wn.grade==='A'?'#16A34A':wn.grade==='B'?'#2563EB':'#D97706'}}/>}
                                      </Box>
                                    );})}
                                  </Box>
                                )}
                                {!scored&&<Box sx={{px:isMobile?1.5:2,py:1}}><Typography sx={{fontSize:'12px',color:'#94a3b8',fontStyle:'italic'}}>Result pending</Typography></Box>}
                              </Box>
                            );
                          })}
                        </Box>
                      </SectionCard>
                    );
                  })}
                </Box>)}

                {/* ===== VENUES ===== */}
                {activeView==='venues' && (<Box>
                  <SectionCard sx={{mb:isMobile?1.5:2}}><Box className="card-header"><Typography className="card-title">Venue Results</Typography></Box><FilterBar showSearch showVenue/></SectionCard>
                  {!stageAllocation?.venues?.length ? <SectionCard sx={{textAlign:'center',py:6}}><MapPin size={36} style={{color:'#94a3b8',marginBottom:8}}/><Typography sx={{fontWeight:700,color:'#64748b',fontSize:'13px'}}>No Venue Allocations</Typography></SectionCard> :
                  venueData.map((v,vi)=>{
                    if (!v.events.length) return null;
                    const scoredInView=v.events.filter(e=>v.winnersLookup[`${e.eventName}|${e.section}`]?.length>0).length;
                    return (
                      <SectionCard key={v.venueId} sx={{mb:isMobile?1.5:2}}>
                        <Box className="card-header" sx={{borderLeft:'4px solid #DC2626'}}><Box sx={{display:'flex',alignItems:'center',gap:0.5}}><MapPin size={14}/><Typography className="card-title">{v.venueName}</Typography></Box><Typography sx={{fontSize:'11px',color:'#94a3b8'}}>{v.events.length} events · {scoredInView} scored</Typography></Box>
                        <Box sx={{p:isMobile?1.5:2,display:'flex',flexDirection:'column',gap:isMobile?1.5:2}}>
                          {v.events.map((event,idx)=>{
                            const winners=(v.winnersLookup[`${event.eventName}|${event.section}`]||[]).sort((a,b)=>+a.position - +b.position);
                            const w=pos=>winners.find(x=>x.position===pos);
                            const scored=winners.length>0;
                            return (
                              <Box key={event._id} sx={{border:'1px solid #e5e7eb',borderRadius:1,overflow:'hidden',bgcolor:scored?'#fafffe':'#fff'}}>
                                <Box sx={{px:isMobile?1.5:2,py:1.2,borderBottom:scored?'1px solid #e5e7eb':'none',display:'flex',alignItems:'center',gap:1,flexWrap:'wrap'}}>
                                  <Typography sx={{fontWeight:700,fontSize:isMobile?'14px':'15px',flex:1,color:'#1e293b'}}>{event.eventName}</Typography>
                                  <Chip label={event.section} size="small" sx={{height:22,fontSize:'10px',fontWeight:600,bgcolor:'#f1f5f9',color:'#1e293b'}}/>
                                  <Chip label={event.eventType==='group'?'Group':'Individual'} size="small" sx={{height:22,fontSize:'10px',fontWeight:600}}/>
                                  {event.gender&&<Chip label={event.gender==='male'?'Boys':event.gender==='female'?'Girls':'All'} size="small" sx={{height:22,fontSize:'10px',fontWeight:600,bgcolor:'#f1f5f9'}}/>}
                                  {scored&&<Chip label="Scored" size="small" sx={{bgcolor:'#DCFCE7',color:'#16A34A',fontWeight:700,height:22,fontSize:'10px'}}/>}
                                </Box>
                                {scored&&(
                                  <Box sx={{px:isMobile?1.5:2,py:1}}>
                                    {['1','2','3'].map(pos=>{const wn=w(pos);if(!wn)return null;return(
                                      <Box key={pos} sx={{display:'flex',alignItems:'center',gap:1,py:0.5}}>
                                        <Typography sx={{fontSize:'18px',width:24,textAlign:'center'}}>{POS_EMOJI[pos]}</Typography>
                                        <Typography sx={{fontSize:isMobile?'13px':'14px',fontWeight:600,flex:1,color:'#1e293b'}}>{wn.name}</Typography>
                                        <ParishLink name={wn.parish} sx={{fontSize:isMobile?'12px':'13px'}}/>
                                        {wn.grade&&<Chip label={`Grade ${wn.grade}`} size="small" sx={{height:20,fontSize:'10px',fontWeight:700,bgcolor:wn.grade==='A'?'#DCFCE7':wn.grade==='B'?'#DBEAFE':'#FEF3C7',color:wn.grade==='A'?'#16A34A':wn.grade==='B'?'#2563EB':'#D97706'}}/>}
                                      </Box>
                                    );})}
                                  </Box>
                                )}
                                {!scored&&<Box sx={{px:isMobile?1.5:2,py:1}}><Typography sx={{fontSize:'12px',color:'#94a3b8',fontStyle:'italic'}}>Result pending</Typography></Box>}
                              </Box>
                            );
                          })}
                        </Box>
                      </SectionCard>
                    );
                  })}
                </Box>)}

                {/* ===== PARISHES ===== */}
                {activeView==='parishes' && (<Box>
                  <SectionCard sx={{mb:isMobile?1.5:2}}><Box className="card-header"><Typography className="card-title">Parish-wise Results</Typography></Box><FilterBar showSearch showDivision/></SectionCard>
                  {parishPrizeListData.map((p,pi)=>(
                    <SectionCard key={p.parish} sx={{mb:isMobile?1.5:2}}>
                      <Box sx={{px:isMobile?1.5:2,py:1,borderBottom:'1px solid #e5e7eb',borderLeft:'4px solid #DC2626',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:0.5}}>
                        <Box sx={{display:'flex',alignItems:'center',gap:0.8}}>
                          <Typography sx={{fontWeight:900,fontSize:'13px',color:'#DC2626',width:22,textAlign:'center'}}>{pi+1}</Typography>
                          <Typography sx={{fontWeight:800,fontSize:isMobile?'13px':'15px'}}>{p.parish}</Typography>
                        </Box>
                        <Box sx={{display:'flex',gap:1.5,alignItems:'center'}}>
                          <Typography sx={{fontWeight:900,fontSize:'18px',color:'#DC2626'}}>{p.totalPoints}<Typography component="span" sx={{fontSize:'9px',color:'#94a3b8',ml:0.3}}>pts</Typography></Typography>
                          <Box sx={{display:'flex',gap:0.2}}>{p.firsts>0&&<Typography sx={{fontSize:'11px'}}>🥇{p.firsts}</Typography>}{p.seconds>0&&<Typography sx={{fontSize:'11px'}}>🥈{p.seconds}</Typography>}{p.thirds>0&&<Typography sx={{fontSize:'11px'}}>🥉{p.thirds}</Typography>}</Box>
                        </Box>
                      </Box>
                      {p.prizes.length>0&&<Box>
                        <Box sx={{px:isMobile?1.5:2,pt:1,pb:0.3}}><Typography sx={{fontWeight:700,fontSize:'11px',color:'#DC2626'}}>Prize Winners ({p.prizes.length})</Typography></Box>
                        {p.prizes.map((r,idx)=>(
                          <Box key={idx} sx={{display:'flex',alignItems:'center',gap:0.8,px:isMobile?1.5:2,py:0.5,borderBottom:'1px solid #f8fafc'}}>
                            <Typography sx={{fontSize:'14px',width:20}}>{POS_EMOJI[r.position]}</Typography>
                            <Box sx={{flex:1,minWidth:0}}>
                              <Typography sx={{fontWeight:600,fontSize:'11px'}}>{r.eventName}</Typography>
                              <Box sx={{display:'flex',gap:0.4}}><Chip label={r.section} size="small" sx={{height:14,fontSize:'7px'}}/>{r.grade&&<Chip label={r.grade} size="small" sx={{height:14,fontSize:'7px',fontWeight:700,bgcolor:r.grade==='A'?'#DCFCE7':r.grade==='B'?'#DBEAFE':'#FEF3C7'}}/>}</Box>
                              {r.participantName!=='Group'&&<Typography sx={{fontSize:'9px',color:'#94a3b8'}}>{r.participantName}</Typography>}
                            </Box>
                            <Typography sx={{fontWeight:800,fontSize:'12px',color:'#DC2626'}}>{r.totalPoints}</Typography>
                          </Box>
                        ))}
                      </Box>}
                      {p.graded.length>0&&<Box>
                        <Box sx={{px:isMobile?1.5:2,pt:0.8,pb:0.3,borderTop:p.prizes.length>0?'1px solid #f1f5f9':'none'}}><Typography sx={{fontWeight:700,fontSize:'11px',color:'#64748b'}}>Other Entries ({p.graded.length})</Typography></Box>
                        {p.graded.map((r,idx)=>(
                          <Box key={idx} sx={{display:'flex',alignItems:'center',gap:0.8,px:isMobile?1.5:2,py:0.4,borderBottom:'1px solid #f8fafc'}}>
                            <Typography sx={{width:16,fontSize:'9px',color:'#94a3b8',textAlign:'right'}}>{idx+1}</Typography>
                            <Box sx={{flex:1}}><Typography sx={{fontSize:'10px',fontWeight:600}}>{r.eventName}</Typography>{r.participantName!=='Group'&&<Typography sx={{fontSize:'8px',color:'#94a3b8'}}>{r.participantName}</Typography>}</Box>
                            {r.grade&&<Chip label={r.grade} size="small" sx={{height:14,fontSize:'8px',fontWeight:700}}/>}
                            <Typography sx={{fontWeight:700,fontSize:'10px',color:'#64748b'}}>{r.totalPoints}</Typography>
                          </Box>
                        ))}
                      </Box>}
                    </SectionCard>
                  ))}
                  {parishPrizeListData.length===0&&<SectionCard sx={{textAlign:'center',py:5}}><Typography sx={{color:'#94a3b8',fontSize:'12px'}}>No results found.</Typography></SectionCard>}
                </Box>)}

              </Box>

              {/* SIDEBAR desktop */}
              {isDesktop && <Sidebar/>}
            </Box>
          )}

          {/* Sidebar on mobile - below content on dashboard */}
          {!isDesktop && !isLoading && activeView==='dashboard' && <Box sx={{mt:1.5}}><Sidebar/></Box>}
        </Container>

        {/* MOBILE BOTTOM NAV */}
        {isMobile && (
          <Box className="no-print bottom-nav" sx={{
            position:'fixed',bottom:0,left:0,right:0,zIndex:1200,
            background:'#1a1a2e',
            display:'flex',justifyContent:'space-around',
            pb:'env(safe-area-inset-bottom)',
            boxShadow:'0 -2px 12px rgba(0,0,0,0.2)',
          }}>
            {views.map(v=>(
              <Box key={v.key} onClick={()=>setActiveView(v.key)}
                sx={{
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                  py:0.8,cursor:'pointer',flex:1,minWidth:0,
                  color:activeView===v.key?'#DC2626':'rgba(255,255,255,0.45)',
                  borderTop:activeView===v.key?'2px solid #DC2626':'2px solid transparent',
                  '&:active':{transform:'scale(0.93)'},transition:'color 0.15s',
                }}>
                <Box sx={{mb:0.1}}>{v.icon}</Box>
                <Typography sx={{fontSize:'8px',fontWeight:activeView===v.key?700:500,lineHeight:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%'}}>{v.label}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      <ParishModal/>
      <VenueModal/>
    </ThemeProvider>
  );
};

export default ResultsDashboardPro; 
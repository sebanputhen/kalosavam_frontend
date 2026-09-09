import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Container, Grid, Card, CardContent, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, LinearProgress
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Users, Calendar, User, Layers, Award, TrendingUp, Mic, FileText } from 'lucide-react';
import axiosInstance from "../axiosConfig";
import { getParishId } from '../utils/parishAuth';

const SECTION_CONFIG = {
  'Dominic Savio': { classes: ['IV', 'V', 'VI'], label: 'Classes IV–VI' },
  'Alphonsa': { classes: ['VII', 'VIII', 'IX'], label: 'Classes VII–IX' },
  'Saint Thomas': { classes: ['X', 'XI', 'XII'], label: 'Classes X–XII' }
};
const SECTION_COLORS = { 'Dominic Savio': '#2563EB', 'Alphonsa': '#10B981', 'Saint Thomas': '#6366F1' };
const CLASS_TO_SECTION = {};
Object.entries(SECTION_CONFIG).forEach(([sec, cfg]) => cfg.classes.forEach(c => { CLASS_TO_SECTION[c] = sec; }));

// ====== STYLED ======
const DashboardContainer = styled(Box)({ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', paddingTop: 24, paddingBottom: 40 });
const StyledCard = styled(Card)({ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.06)' } });
const StyledCardContent = styled(CardContent)({ padding: '24px !important' });
const StatWrapper = styled(Box)({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
const StatValue = styled(Typography)({ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, marginTop: 4, color: '#1a202c' });
const IconBox = styled(Box)(({ color }) => ({ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${color}22, ${color}11)`, border: `1px solid ${color}33`, color }));
const ChartCard = styled(Card)({ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', padding: 24 });
const SectionTitle = styled(Typography)({ fontWeight: 600, color: '#1a202c', marginBottom: 20, fontSize: '1.15rem' });

const FORANE_ID = "673799a3cb9b4aa181e53fa2";
const BATCH_SIZE = 8;

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [eventStageMap, setEventStageMap] = useState({});

  const parishId = getParishId();

  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      setIsLoading(true);
      try {
        // Fetch events + categories (+ parish-specific or parish list) in parallel
        const [evtRes, catRes, thirdRes] = await Promise.all([
          axiosInstance.get("/events", { signal: ctrl.signal }),
          axiosInstance.get("/categories", { signal: ctrl.signal }).catch(() => ({ data: [] })),
          parishId
            ? axiosInstance.get(`/registrations/parish/${parishId}`, { signal: ctrl.signal })
            : axiosInstance.get("/parish", { signal: ctrl.signal })
        ]);

        const eventsData = evtRes.data?.data?.events || [];
        setEvents(eventsData);

        // Build stage map in one pass
        const cats = catRes.data?.data?.categories || catRes.data?.categories || catRes.data || [];
        const cMap = {};
        for (let i = 0; i < cats.length; i++) cMap[String(cats[i]._id)] = cats[i];
        const esMap = {};
        for (let i = 0; i < eventsData.length; i++) {
          const e = eventsData[i];
          if (e.category?.stage) { esMap[String(e._id)] = e.category.stage; continue; }
          const catId = typeof e.category === 'object' ? String(e.category?._id || '') : String(e.category || '');
          esMap[String(e._id)] = cMap[catId]?.stage || '';
        }
        setEventStageMap(esMap);

        // Process registrations
        const processRegs = (registrations, pId) => {
          const grouped = {};
          for (let i = 0; i < registrations.length; i++) {
            const reg = registrations[i];
            if (!reg.event) continue;
            const dobStr = reg.dob ? new Date(reg.dob).toISOString().slice(0, 10) : '';
            const key = `${reg.name}|${reg.standard}|${reg.gender}|${dobStr}`;
            if (!grouped[key]) {
              grouped[key] = { _id: reg._id, name: reg.name, standard: reg.standard, gender: reg.gender, dob: reg.dob, parish: pId, events: [] };
            }
            const evtId = String(reg.event._id || reg.event || '');
            grouped[key].events.push({
              eventId: reg.event._id, eventName: reg.event.eventName,
              eventType: reg.event.eventType, section: reg.event.section,
              category: reg.event.category?.name || '',
              stage: esMap[evtId] || '',
              isCrossSectionParticipation: reg.isCrossSectionParticipation || false
            });
          }
          return Object.values(grouped);
        };

        if (parishId) {
          const regs = thirdRes.data?.data?.registrations || thirdRes.data?.registrations || [];
          setParticipants(processRegs(regs, parishId));
        } else {
          const allParishes = (thirdRes.data || []).filter(p => p.forane === FORANE_ID || p.forane?._id === FORANE_ID);
          setParishes(allParishes);

          // Batch parish registration fetches
          const allParticipants = [];
          for (let i = 0; i < allParishes.length; i += BATCH_SIZE) {
            const batch = allParishes.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(
              batch.map(p => axiosInstance.get(`/registrations/parish/${p._id}`, { signal: ctrl.signal }))
            );
            for (let j = 0; j < results.length; j++) {
              if (results[j].status !== 'fulfilled') continue;
              const regs = results[j].value.data?.data?.registrations || results[j].value.data?.registrations || [];
              const pId = batch[j]._id;
              allParticipants.push(...processRegs(regs, pId));
            }
          }
          setParticipants(allParticipants);
        }
      } catch (err) {
        if (err.name !== 'CanceledError') console.error("Dashboard load failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    return () => ctrl.abort();
  }, [parishId]);

  // ====== SINGLE-PASS COMPUTED DATA ======
  const computed = useMemo(() => {
    let totalRegs = 0, maleCount = 0, femaleCount = 0, crossCount = 0, onStageRegs = 0, offStageRegs = 0;
    const eventMap = {};
    const stageGroupMap = {};
    const parishMap = {};
    const sectionMap = {};

    // Init sections
    for (const [sec, cfg] of Object.entries(SECTION_CONFIG)) {
      sectionMap[sec] = { section: sec, config: cfg, participantCount: 0, singles: 0, groups: 0, crossEvents: 0, totalRegs: 0, males: 0, females: 0 };
    }

    // Single pass over participants
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const isMale = p.gender === 'M';
      if (isMale) maleCount++; else femaleCount++;

      const sec = CLASS_TO_SECTION[p.standard] || null;
      if (sec && sectionMap[sec]) {
        sectionMap[sec].participantCount++;
        if (isMale) sectionMap[sec].males++; else sectionMap[sec].females++;
      }

      // Parish
      if (!parishMap[p.parish]) parishMap[p.parish] = { parishId: p.parish, count: 0, males: 0, females: 0, totalRegs: 0 };
      parishMap[p.parish].count++;
      if (isMale) parishMap[p.parish].males++; else parishMap[p.parish].females++;

      const hasCross = p.events.some(e => e.isCrossSectionParticipation);
      if (hasCross) crossCount++;

      totalRegs += p.events.length;
      parishMap[p.parish].totalRegs += p.events.length;
      if (sec && sectionMap[sec]) sectionMap[sec].totalRegs += p.events.length;

      for (let j = 0; j < p.events.length; j++) {
        const ev = p.events[j];
        const isOff = ev.stage === 'Off Stage';
        if (isOff) offStageRegs++; else onStageRegs++;

        // Event map
        if (!eventMap[ev.eventId]) {
          eventMap[ev.eventId] = { name: ev.eventName, type: ev.eventType, section: ev.section, stage: ev.stage || '', category: ev.category || '', count: 0, crossCount: 0 };
        }
        if (ev.isCrossSectionParticipation) eventMap[ev.eventId].crossCount++;
        else eventMap[ev.eventId].count++;

        // Stage group map (On Stage / Off Stage breakdown by section)
        const stageLabel = isOff ? 'Off Stage' : 'On Stage';
        const sgKey = `${stageLabel}|${ev.section || 'Unknown'}`;
        if (!stageGroupMap[sgKey]) stageGroupMap[sgKey] = { stage: stageLabel, section: ev.section || 'Unknown', pSet: new Set(), eSet: new Set(), singles: 0, groups: 0 };
        stageGroupMap[sgKey].pSet.add(`${p.name}|${p.standard}`);
        stageGroupMap[sgKey].eSet.add(ev.eventId);
        if (ev.eventType === 'single') stageGroupMap[sgKey].singles++; else stageGroupMap[sgKey].groups++;
      }
    }

    // Section event counts from events array (not from participants)
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (sectionMap[e.section]) {
        if (e.eventType === 'single') sectionMap[e.section].singles++;
        else sectionMap[e.section].groups++;
      }
      // Cross-section availability
      if (e.allowCrossSectionParticipation && e.crossSectionAllowedSections) {
        for (const s of e.crossSectionAllowedSections) {
          if (s !== e.section && sectionMap[s]) sectionMap[s].crossEvents++;
        }
      }
    }

    const eventWise = Object.values(eventMap).sort((a, b) => (b.count + b.crossCount) - (a.count + a.crossCount));
    const stageWise = Object.values(stageGroupMap).map(c => ({ ...c, participantCount: c.pSet.size, eventCount: c.eSet.size }))
      .sort((a, b) => a.stage.localeCompare(b.stage) || a.section.localeCompare(b.section));
    const parishWise = Object.values(parishMap).map(ps => {
      const par = parishes.find(p => p._id === ps.parishId);
      return { ...ps, name: par?.name || ps.parishId };
    }).sort((a, b) => b.count - a.count);
    const sectionArr = Object.values(sectionMap);

    return {
      totalParticipants: participants.length, totalEvents: events.length,
      singleCount: events.filter(e => e.eventType === 'single').length,
      groupCount: events.filter(e => e.eventType === 'group').length,
      totalRegs, maleCount, femaleCount, crossCount, onStageRegs, offStageRegs,
      eventWise, stageWise, parishWise, sectionArr
    };
  }, [participants, events, parishes]);

  const topCards = [
    { title: 'Total Participants', value: computed.totalParticipants, color: '#2563EB', icon: <Users size={24} /> },
    { title: 'Total Events', value: computed.totalEvents, color: '#10B981', icon: <Calendar size={24} /> },
    { title: 'Individual Events', value: computed.singleCount, color: '#6366F1', icon: <User size={24} /> },
    { title: 'Group Events', value: computed.groupCount, color: '#F59E0B', icon: <Layers size={24} /> },
  ];

  if (isLoading) {
    return (
      <DashboardContainer>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress /></Box>
        </Container>
      </DashboardContainer>
    );
  }

  const maxP = Math.max(...computed.sectionArr.map(s => s.participantCount), 1);

  // Reusable stage chip
  const StageChip = ({ stage }) => stage ? (
    <Chip size="small" icon={stage === 'Off Stage' ? <FileText size={12} /> : <Mic size={12} />} label={stage}
      sx={{ bgcolor: stage === 'Off Stage' ? 'rgba(99,102,241,0.1)' : 'rgba(37,99,235,0.1)', color: stage === 'Off Stage' ? '#6366F1' : '#2563EB', fontWeight: 600, fontSize: '0.7rem', '& .MuiChip-icon': { color: 'inherit' } }} />
  ) : <Typography variant="caption" color="textSecondary">–</Typography>;

  return (
    <DashboardContainer>
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c', mb: 0.5 }}>Dashboard</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Forane Kalolsavam — Registration Overview</Typography>
            </Box>
          </Grid>

          {/* Top Stat Cards */}
          {topCards.map((stat, index) => (
            <Grid item xs={6} sm={6} md={3} key={index}>
              <StyledCard>
                <StyledCardContent>
                  <StatWrapper>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>{stat.title}</Typography>
                      <StatValue>{stat.value}</StatValue>
                    </Box>
                    <IconBox color={stat.color}>{stat.icon}</IconBox>
                  </StatWrapper>
                </StyledCardContent>
              </StyledCard>
            </Grid>
          ))}

          {/* Secondary Stats Row */}
          <Grid item xs={12} sm={6} md={3}>
            <StyledCard><StyledCardContent>
              <StatWrapper>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Total Registrations</Typography>
                  <StatValue sx={{ fontSize: '1.75rem' }}>{computed.totalRegs}</StatValue>
                </Box>
                <IconBox color="#8B5CF6"><TrendingUp size={22} /></IconBox>
              </StatWrapper>
            </StyledCardContent></StyledCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StyledCard><StyledCardContent>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', mb: 1.5 }}>On Stage / Off Stage</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2563EB' }}>{computed.onStageRegs}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>On Stage</Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#6366F1' }}>{computed.offStageRegs}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Off Stage</Typography>
                </Box>
              </Box>
            </StyledCardContent></StyledCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StyledCard><StyledCardContent>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', mb: 1.5 }}>Gender Split</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2563EB' }}>{computed.maleCount}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Boys</Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.15)' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#EC4899' }}>{computed.femaleCount}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Girls</Typography>
                </Box>
              </Box>
            </StyledCardContent></StyledCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StyledCard><StyledCardContent>
              <StatWrapper>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Cross-Section</Typography>
                  <StatValue sx={{ fontSize: '1.75rem' }}>{computed.crossCount}</StatValue>
                </Box>
                <IconBox color="#0EA5E9"><Award size={22} /></IconBox>
              </StatWrapper>
            </StyledCardContent></StyledCard>
          </Grid>

          {/* Section Overview */}
          <Grid item xs={12}><SectionTitle variant="h6">Section Overview</SectionTitle></Grid>
          {computed.sectionArr.map(({ section, config, participantCount, singles, groups, crossEvents, totalRegs, males, females }) => {
            const sColor = SECTION_COLORS[section];
            return (
              <Grid item xs={12} md={4} key={section}>
                <ChartCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>{section}</Typography>
                      <Typography variant="body2" color="textSecondary">{config.label}</Typography>
                    </Box>
                    <IconBox color={sColor}><Award size={22} /></IconBox>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Participants</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: sColor }}>{participantCount}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={(participantCount / maxP) * 100}
                      sx={{ height: 8, borderRadius: 4, bgcolor: `${sColor}15`, '& .MuiLinearProgress-bar': { bgcolor: sColor, borderRadius: 4 } }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <Box sx={{ flex: 1, textAlign: 'center', p: 1, borderRadius: 1.5, bgcolor: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.12)' }}>
                      <Typography variant="body2" fontWeight="700" color="primary">{males}</Typography>
                      <Typography variant="caption" color="textSecondary">Boys</Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center', p: 1, borderRadius: 1.5, bgcolor: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.12)' }}>
                      <Typography variant="body2" fontWeight="700" sx={{ color: '#EC4899' }}>{females}</Typography>
                      <Typography variant="caption" color="textSecondary">Girls</Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center', p: 1, borderRadius: 1.5, bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <Typography variant="body2" fontWeight="700">{totalRegs}</Typography>
                      <Typography variant="caption" color="textSecondary">Regs</Typography>
                    </Box>
                  </Box>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1, textAlign: 'center', borderRadius: 1.5, bgcolor: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)' }}>
                        <Typography variant="body2" fontWeight="600" color="primary">{singles} Individual</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1, textAlign: 'center', borderRadius: 1.5, bgcolor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <Typography variant="body2" fontWeight="600" color="secondary">{groups} Group</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  {crossEvents > 0 && <Typography variant="caption" color="info.main" sx={{ mt: 1.5 }}>+ {crossEvents} cross-section events available</Typography>}
                </ChartCard>
              </Grid>
            );
          })}

          {/* Event-wise Registrations */}
          <Grid item xs={12}>
            <ChartCard>
              <SectionTitle variant="h6">Event-wise Registrations</SectionTitle>
              <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', maxHeight: 480 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['Event','Section','Type','Stage'].map(h => <TableCell key={h} sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>{h}</TableCell>)}
                      {['Total'].map(h => <TableCell key={h} align="center" sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {computed.eventWise.map((ev, i) => (
                      <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                        <TableCell sx={{ fontWeight: 500 }}>{ev.name}</TableCell>
                        <TableCell>
                          <Chip size="small" label={ev.section} sx={{ bgcolor: SECTION_COLORS[ev.section] ? `${SECTION_COLORS[ev.section]}15` : undefined, color: SECTION_COLORS[ev.section] || undefined, fontWeight: 600, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell><Chip size="small" label={ev.type === 'single' ? 'Individual' : 'Group'} color={ev.type === 'single' ? 'primary' : 'secondary'} /></TableCell>
                        <TableCell><StageChip stage={ev.stage} /></TableCell>
                        {/* <TableCell><Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{ev.category || '–'}</Typography></TableCell> */}
                        {/* <TableCell align="center">{ev.count}</TableCell> */}
                        {/* <TableCell align="center">{ev.crossCount > 0 ? ev.crossCount : '–'}</TableCell> */}
                        <TableCell align="center" sx={{ fontWeight: 600 }}>{ev.count + ev.crossCount}</TableCell>
                      </TableRow>
                    ))}
                    {computed.eventWise.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>No registrations yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
            </ChartCard>
          </Grid>

          {/* Category-wise */}
          <Grid item xs={12} md={6}>
            <ChartCard>
              <SectionTitle variant="h6">On Stage / Off Stage Summary</SectionTitle>
              <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Stage</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Section</TableCell>
                      {['Events','Individual','Group','Participants'].map(h => <TableCell key={h} align="center" sx={{ fontWeight: 600 }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {computed.stageWise.map((row, i) => (
                      <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                        <TableCell><StageChip stage={row.stage} /></TableCell>
                        <TableCell>
                          <Chip size="small" label={row.section} sx={{ bgcolor: SECTION_COLORS[row.section] ? `${SECTION_COLORS[row.section]}15` : undefined, color: SECTION_COLORS[row.section] || undefined, fontWeight: 600, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell align="center">{row.eventCount}</TableCell>
                        <TableCell align="center">{row.singles}</TableCell>
                        <TableCell align="center">{row.groups}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>{row.participantCount}</TableCell>
                      </TableRow>
                    ))}
                    {computed.stageWise.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>No data</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
            </ChartCard>
          </Grid>

          {/* Parish-wise */}
          <Grid item xs={12} md={6}>
            <ChartCard>
              <SectionTitle variant="h6">Parish-wise Registrations</SectionTitle>
              <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Parish</TableCell>
                      {['Boys','Girls','Participants','Registrations'].map(h => <TableCell key={h} align="center" sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {computed.parishWise.map((row, i) => (
                      <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                        <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                        <TableCell align="center">{row.males}</TableCell>
                        <TableCell align="center">{row.females}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>{row.count}</TableCell>
                        <TableCell align="center"><Chip size="small" label={row.totalRegs} color="primary" variant="outlined" /></TableCell>
                      </TableRow>
                    ))}
                    {computed.parishWise.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>No data</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
            </ChartCard>
          </Grid>
        </Grid>
      </Container>
    </DashboardContainer>
  );
};

export default Home;
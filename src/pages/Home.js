import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Container, Grid, Card, CardContent, Typography, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, LinearProgress
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Users, Calendar, User, Layers, Award, TrendingUp, Mic, FileText } from 'lucide-react';
import axiosInstance from "../axiosConfig";
import { getParishId } from '../utils/parishAuth';

// ====== CONSTANTS ======
const SECTION_CONFIG = {
  'Dominic Savio': { classes: ['IV', 'V', 'VI'], label: 'Classes IV–VI' },
  'Alphonsa': { classes: ['VII', 'VIII', 'IX'], label: 'Classes VII–IX' },
  'Saint Thomas': { classes: ['X', 'XI', 'XII'], label: 'Classes X–XII' }
};

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

// ====== STYLED COMPONENTS ======
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

const ChartCard = styled(Card)({
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.06)',
  padding: 24,
});

const SectionTitle = styled(Typography)({
  fontWeight: 600,
  color: '#1a202c',
  marginBottom: 20,
  fontSize: '1.15rem',
});

// ====== COMPONENT ======
const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [eventParticipantCounts, setEventParticipantCounts] = useState({});
  const [eventStageMap, setEventStageMap] = useState({});

  const parishId = getParishId();

  // Build event → stage map from categories
  const buildEventStageMap = (eventsData, categoriesData) => {
    const cats = categoriesData?.data?.categories || categoriesData?.categories || categoriesData || [];
    const cMap = {};
    for (const c of cats) { cMap[String(c._id)] = c; }

    const esMap = {};
    for (const e of eventsData) {
      let catId = '';
      if (e.category && typeof e.category === 'object' && e.category._id) {
        catId = String(e.category._id);
        if (e.category.stage) { esMap[String(e._id)] = e.category.stage; continue; }
      } else {
        catId = String(e.category || '');
      }
      esMap[String(e._id)] = cMap[catId]?.stage || '';
    }
    return esMap;
  };

  // Process registrations into grouped participants
  const processRegistrations = (registrations, parishIdVal, stageMap = {}) => {
    const grouped = {};
    registrations.forEach(reg => {
      if (!reg.event) return;
      const key = `${reg.name}|${reg.standard}|${reg.gender}|${new Date(reg.dob).toISOString().split('T')[0]}`;
      if (!grouped[key]) {
        grouped[key] = {
          _id: reg._id, name: reg.name, standard: reg.standard,
          gender: reg.gender, dob: reg.dob, parish: parishIdVal,
          registrationNumber: reg.registrationNumber || null, events: []
        };
      }
      const evtId = typeof reg.event === 'object' ? String(reg.event._id || '') : String(reg.event || '');
      grouped[key].events.push({
        eventId: reg.event._id, eventName: reg.event.eventName,
        eventType: reg.event.eventType, section: reg.event.section,
        category: reg.event.category?.name || '',
        stage: stageMap[evtId] || '',
        isCrossSectionParticipation: reg.isCrossSectionParticipation || false
      });
    });
    return Object.values(grouped);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const baseRequests = [
          axiosInstance.get("/events"),
          axiosInstance.get("/categories").catch(() => ({ data: [] }))
        ];

        if (parishId) {
          baseRequests.push(
            axiosInstance.get(`/registrations/parish/${parishId}`),
            axiosInstance.get(`/api/event-stats/parish/${parishId}`).catch(() => ({ data: { data: { stats: [] } } }))
          );
        } else {
          baseRequests.push(axiosInstance.get("/parish"));
        }

        const results = await Promise.all(baseRequests);
        const eventsData = results[0].data.data.events || [];
        setEvents(eventsData);

        const stageMap = buildEventStageMap(eventsData, results[1].data);
        setEventStageMap(stageMap);

        if (parishId) {
          const registrations = results[2].data?.data?.registrations || results[2].data?.registrations || [];
          setParticipants(processRegistrations(registrations, parishId, stageMap));
          const countsMap = {};
          (results[3].data?.data?.stats || []).forEach(s => { countsMap[s.eventId] = s.participantCount; });
          setEventParticipantCounts(countsMap);
        } else {
          const allParishes = (results[2].data || []).filter(
            p => p.forane === "673799a3cb9b4aa181e53fa2" || p.forane?._id === "673799a3cb9b4aa181e53fa2"
          );
          setParishes(allParishes);

          // Load all parish registrations for admin view
          const allParticipants = [];
          const parishRequests = allParishes.map(p =>
            axiosInstance.get(`/registrations/parish/${p._id}`).catch(() => ({ data: { data: { registrations: [] } } }))
          );
          const parishResults = await Promise.all(parishRequests);
          parishResults.forEach((res, idx) => {
            const regs = res.data?.data?.registrations || res.data?.registrations || [];
            allParticipants.push(...processRegistrations(regs, allParishes[idx]._id, stageMap));
          });
          setParticipants(allParticipants);
        }
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [parishId]);

  // ====== COMPUTED DATA ======
  const stats = useMemo(() => {
    const totalParticipants = participants.length;
    const totalEvents = events.length;
    const singleCount = events.filter(e => e.eventType === 'single').length;
    const groupCount = events.filter(e => e.eventType === 'group').length;
    const totalRegistrations = participants.reduce((sum, p) => sum + p.events.length, 0);
    const crossParticipants = participants.filter(p => p.events.some(e => e.isCrossSectionParticipation)).length;
    const maleCount = participants.filter(p => p.gender === 'M').length;
    const femaleCount = participants.filter(p => p.gender === 'F').length;

    // On/Off stage from event-level stage data
    let onStageRegs = 0, offStageRegs = 0;
    participants.forEach(p => {
      p.events.forEach(ev => {
        if (ev.stage === 'Off Stage') offStageRegs++;
        else onStageRegs++;
      });
    });

    return { totalParticipants, totalEvents, singleCount, groupCount, totalRegistrations, crossParticipants, maleCount, femaleCount, onStageRegs, offStageRegs };
  }, [participants, events]);

  const sectionStats = useMemo(() => {
    return Object.entries(SECTION_CONFIG).map(([section, config]) => {
      const secParticipants = participants.filter(p => getParticipantSection(p.standard) === section);
      const secEvents = events.filter(e => e.section === section);
      const singles = secEvents.filter(e => e.eventType === 'single').length;
      const groups = secEvents.filter(e => e.eventType === 'group').length;
      const crossEvents = events.filter(e =>
        e.section !== section && e.allowCrossSectionParticipation && e.crossSectionAllowedSections?.includes(section)
      ).length;
      const totalRegs = secParticipants.reduce((sum, p) => sum + p.events.length, 0);
      const males = secParticipants.filter(p => p.gender === 'M').length;
      const females = secParticipants.filter(p => p.gender === 'F').length;

      return { section, config, participantCount: secParticipants.length, eventCount: secEvents.length, singles, groups, crossEvents, totalRegs, males, females };
    });
  }, [participants, events]);

  const eventWiseStats = useMemo(() => {
    const eventMap = {};
    participants.forEach(p => {
      p.events.forEach(ev => {
        if (!eventMap[ev.eventId]) {
          eventMap[ev.eventId] = { name: ev.eventName, type: ev.eventType, section: ev.section, stage: ev.stage || '', category: ev.category || '', count: 0, crossCount: 0 };
        }
        if (ev.isCrossSectionParticipation) eventMap[ev.eventId].crossCount++;
        else eventMap[ev.eventId].count++;
      });
    });
    return Object.values(eventMap).sort((a, b) => (b.count + b.crossCount) - (a.count + a.crossCount));
  }, [participants]);

  const categoryWiseStats = useMemo(() => {
    const catMap = {};
    participants.forEach(p => {
      p.events.forEach(ev => {
        const cat = ev.category || 'Uncategorized';
        if (!catMap[cat]) catMap[cat] = { category: cat, stage: ev.stage || '', participants: new Set(), events: new Set(), singles: 0, groups: 0, onStage: 0, offStage: 0 };
        catMap[cat].participants.add(`${p.name}|${p.standard}`);
        catMap[cat].events.add(ev.eventId);
        if (ev.eventType === 'single') catMap[cat].singles++;
        else catMap[cat].groups++;
        if (ev.stage === 'Off Stage') catMap[cat].offStage++;
        else catMap[cat].onStage++;
      });
    });
    return Object.values(catMap)
      .map(c => ({ ...c, participantCount: c.participants.size, eventCount: c.events.size }))
      .sort((a, b) => b.participantCount - a.participantCount);
  }, [participants]);

  const parishWiseStats = useMemo(() => {
    const pMap = {};
    participants.forEach(p => {
      const pid = p.parish;
      if (!pMap[pid]) pMap[pid] = { parishId: pid, count: 0, males: 0, females: 0, totalRegs: 0 };
      pMap[pid].count++;
      if (p.gender === 'M') pMap[pid].males++;
      else pMap[pid].females++;
      pMap[pid].totalRegs += p.events.length;
    });
    return Object.values(pMap)
      .map(ps => {
        const parish = parishes.find(p => p._id === ps.parishId);
        return { ...ps, name: parish?.name || ps.parishId };
      })
      .sort((a, b) => b.count - a.count);
  }, [participants, parishes]);

  const topCards = [
    { title: 'Total Participants', value: stats.totalParticipants, color: '#2563EB', icon: <Users size={24} /> },
    { title: 'Total Events', value: stats.totalEvents, color: '#10B981', icon: <Calendar size={24} /> },
    { title: 'Individual Events', value: stats.singleCount, color: '#6366F1', icon: <User size={24} /> },
    { title: 'Group Events', value: stats.groupCount, color: '#F59E0B', icon: <Layers size={24} /> },
  ];

  if (isLoading) {
    return (
      <DashboardContainer>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress />
          </Box>
        </Container>
      </DashboardContainer>
    );
  }

  const maxParticipants = Math.max(...sectionStats.map(s => s.participantCount), 1);

  return (
    <DashboardContainer>
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c', mb: 0.5 }}>
                Dashboard
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Forane Kalolsavam — Registration Overview
              </Typography>
            </Box>
          </Grid>

          {/* Top Stat Cards */}
          {topCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StyledCard>
                <StyledCardContent>
                  <StatWrapper>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                        {stat.title}
                      </Typography>
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
            <StyledCard>
              <StyledCardContent>
                <StatWrapper>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                      Total Registrations
                    </Typography>
                    <StatValue sx={{ fontSize: '1.75rem' }}>{stats.totalRegistrations}</StatValue>
                  </Box>
                  <IconBox color="#8B5CF6"><TrendingUp size={22} /></IconBox>
                </StatWrapper>
              </StyledCardContent>
            </StyledCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StyledCard>
              <StyledCardContent>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', mb: 1.5 }}>
                  On Stage / Off Stage
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#2563EB' }}>{stats.onStageRegs}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>On Stage</Typography>
                  </Box>
                  <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#6366F1' }}>{stats.offStageRegs}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Off Stage</Typography>
                  </Box>
                </Box>
              </StyledCardContent>
            </StyledCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StyledCard>
              <StyledCardContent>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', mb: 1.5 }}>
                  Gender Split
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#2563EB' }}>{stats.maleCount}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Boys</Typography>
                  </Box>
                  <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.15)' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#EC4899' }}>{stats.femaleCount}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Girls</Typography>
                  </Box>
                </Box>
              </StyledCardContent>
            </StyledCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StyledCard>
              <StyledCardContent>
                <StatWrapper>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                      Cross-Section
                    </Typography>
                    <StatValue sx={{ fontSize: '1.75rem' }}>{stats.crossParticipants}</StatValue>
                  </Box>
                  <IconBox color="#0EA5E9"><Award size={22} /></IconBox>
                </StatWrapper>
              </StyledCardContent>
            </StyledCard>
          </Grid>

          {/* Section Overview Cards */}
          <Grid item xs={12}>
            <SectionTitle variant="h6">Section Overview</SectionTitle>
          </Grid>
          {sectionStats.map(({ section, config, participantCount, eventCount, singles, groups, crossEvents, totalRegs, males, females }) => {
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

                  {/* Participant bar */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Participants</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: sColor }}>{participantCount}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(participantCount / maxParticipants) * 100}
                      sx={{ height: 8, borderRadius: 4, bgcolor: `${sColor}15`, '& .MuiLinearProgress-bar': { bgcolor: sColor, borderRadius: 4 } }}
                    />
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
                  {crossEvents > 0 && (
                    <Typography variant="caption" color="info.main" sx={{ mt: 1.5 }}>+ {crossEvents} cross-section events available</Typography>
                  )}
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
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Event</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Section</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Stage</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Category</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Home</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Cross</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {eventWiseStats.map((ev, i) => (
                      <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                        <TableCell sx={{ fontWeight: 500 }}>{ev.name}</TableCell>
                        <TableCell>
                          <Chip size="small" label={ev.section} sx={{
                            bgcolor: ev.section && SECTION_COLORS[ev.section] ? `${SECTION_COLORS[ev.section]}15` : undefined,
                            color: ev.section && SECTION_COLORS[ev.section] ? SECTION_COLORS[ev.section] : undefined,
                            fontWeight: 600, fontSize: '0.7rem'
                          }} />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={ev.type === 'single' ? 'Individual' : 'Group'}
                            color={ev.type === 'single' ? 'primary' : 'secondary'} />
                        </TableCell>
                        <TableCell>
                          {ev.stage ? (
                            <Chip size="small"
                              icon={ev.stage === 'Off Stage' ? <FileText size={12} /> : <Mic size={12} />}
                              label={ev.stage}
                              sx={{
                                bgcolor: ev.stage === 'Off Stage' ? 'rgba(99,102,241,0.1)' : 'rgba(37,99,235,0.1)',
                                color: ev.stage === 'Off Stage' ? '#6366F1' : '#2563EB',
                                fontWeight: 600, fontSize: '0.7rem',
                                '& .MuiChip-icon': { color: 'inherit' }
                              }}
                            />
                          ) : <Typography variant="caption" color="textSecondary">–</Typography>}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{ev.category || '–'}</Typography>
                        </TableCell>
                        <TableCell align="center">{ev.count}</TableCell>
                        <TableCell align="center">{ev.crossCount > 0 ? ev.crossCount : '–'}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>{ev.count + ev.crossCount}</TableCell>
                      </TableRow>
                    ))}
                    {eventWiseStats.length === 0 && (
                      <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>No registrations yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </ChartCard>
          </Grid>

          {/* Category-wise Breakdown */}
          <Grid item xs={12} md={6}>
            <ChartCard>
              <SectionTitle variant="h6">Category-wise Summary</SectionTitle>
              <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Stage</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Events</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Individual</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Group</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Participants</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoryWiseStats.map((row, i) => (
                      <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                        <TableCell sx={{ fontWeight: 500 }}>{row.category}</TableCell>
                        <TableCell>
                          {row.stage ? (
                            <Chip size="small"
                              icon={row.stage === 'Off Stage' ? <FileText size={12} /> : <Mic size={12} />}
                              label={row.stage}
                              sx={{
                                bgcolor: row.stage === 'Off Stage' ? 'rgba(99,102,241,0.1)' : 'rgba(37,99,235,0.1)',
                                color: row.stage === 'Off Stage' ? '#6366F1' : '#2563EB',
                                fontWeight: 600, fontSize: '0.7rem',
                                '& .MuiChip-icon': { color: 'inherit' }
                              }}
                            />
                          ) : '–'}
                        </TableCell>
                        <TableCell align="center">{row.eventCount}</TableCell>
                        <TableCell align="center">{row.singles}</TableCell>
                        <TableCell align="center">{row.groups}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>{row.participantCount}</TableCell>
                      </TableRow>
                    ))}
                    {categoryWiseStats.length === 0 && (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>No data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </ChartCard>
          </Grid>

          {/* Parish-wise Breakdown */}
          <Grid item xs={12} md={6}>
            <ChartCard>
              <SectionTitle variant="h6">Parish-wise Registrations</SectionTitle>
              <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Parish</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Boys</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Girls</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Participants</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Registrations</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parishWiseStats.map((row, i) => (
                      <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                        <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                        <TableCell align="center">{row.males}</TableCell>
                        <TableCell align="center">{row.females}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>{row.count}</TableCell>
                        <TableCell align="center">
                          <Chip size="small" label={row.totalRegs} color="primary" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                    {parishWiseStats.length === 0 && (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>No data</TableCell></TableRow>
                    )}
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
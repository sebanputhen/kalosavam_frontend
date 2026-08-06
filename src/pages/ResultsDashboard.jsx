import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableContainer,
  CircularProgress,
  Chip,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent
} from '@mui/material';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import axiosInstance from "../axiosConfig";

const printStyles = `
  @media print {
    @page { size: A4 portrait; margin: 8mm; }
    .no-print { display: none !important; }
    nav, header, footer, aside,
    .MuiDrawer-root, .MuiAppBar-root,
    [class*="Sidebar"], [class*="Navbar"], [class*="AppBar"],
    [class*="drawer"], [class*="header"] {
      display: none !important;
    }
    .print-area {
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 5px !important;
      box-shadow: none !important;
      font-size: 10px !important;
    }
    .print-area * { visibility: visible !important; }
    .print-area table { font-size: 9px !important; }
    .print-area td, .print-area th { padding: 3px !important; }
  }
`;

const SECTION_CONFIG = {
  'Dominic Savio': 'Classes IV-VI',
  'Alphonsa': 'Classes VII-IX',
  'Saint Thomas': 'Classes X-XII'
};

const POSITION_LABELS = { '1': '1st', '2': '2nd', '3': '3rd' };
const MEDAL_COLORS = { '1': '#FFD700', '2': '#C0C0C0', '3': '#CD7F32' };

const ResultsDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSection, setSelectedSection] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scorings, setScorings] = useState([]);
  const [events, setEvents] = useState([]);
  const [parishes, setParishes] = useState([]);

  const FORANE_ID = '673799a3cb9b4aa181e53fa2';

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

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

      const allEvents = [
        ...(eventsOnRes.data?.data?.events || []),
        ...(eventsOffRes.data?.data?.events || [])
      ];
      setEvents(allEvents);

      const filtered = (parishesRes.data || []).filter(
        (p) => p.forane === FORANE_ID || p.forane?._id === FORANE_ID
      );
      setParishes(filtered);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== DATA PROCESSING ==========

  // Get all participants with positions/grades from scorings
  const getAllResults = () => {
    const results = [];
    scorings.forEach(scoring => {
      const event = scoring.eventId || {};
      const eventName = event.eventName || 'Unknown';
      const section = event.section || scoring.section || '';
      const eventType = event.eventType || '';

      (scoring.participants || []).forEach(p => {
        results.push({
          ...p,
          eventName,
          section,
          eventType,
          eventId: event._id || scoring.eventId
        });
      });
    });
    return results;
  };

  const allResults = getAllResults();

  // Filter by section
  const filteredResults = selectedSection
    ? allResults.filter(r => r.section === selectedSection)
    : allResults;

  // ===== 1. PARISH OVERALL STANDINGS =====
  const getParishStandings = () => {
    const parishMap = {};

    filteredResults.forEach(r => {
      const parish = r.parish || 'Unknown';
      if (!parishMap[parish]) {
        parishMap[parish] = {
          parish,
          totalPoints: 0,
          gradePoints: 0,
          positionPoints: 0,
          firsts: 0,
          seconds: 0,
          thirds: 0,
          gradeA: 0,
          gradeB: 0,
          gradeC: 0,
          eventsParticipated: new Set()
        };
      }
      parishMap[parish].totalPoints += r.totalPoints || 0;
      parishMap[parish].gradePoints += r.gradePoints || 0;
      parishMap[parish].positionPoints += r.positionPoints || 0;
      if (r.position === '1') parishMap[parish].firsts++;
      if (r.position === '2') parishMap[parish].seconds++;
      if (r.position === '3') parishMap[parish].thirds++;
      if (r.grade === 'A') parishMap[parish].gradeA++;
      if (r.grade === 'B') parishMap[parish].gradeB++;
      if (r.grade === 'C') parishMap[parish].gradeC++;
      parishMap[parish].eventsParticipated.add(r.eventName);
    });

    return Object.values(parishMap)
      .map(p => ({ ...p, eventsCount: p.eventsParticipated.size }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  };

  // ===== 2. EVENT-WISE RESULTS =====
  const getEventResults = () => {
    const eventMap = {};

    filteredResults.forEach(r => {
      if (!eventMap[r.eventName]) {
        eventMap[r.eventName] = {
          eventName: r.eventName,
          section: r.section,
          eventType: r.eventType,
          winners: []
        };
      }
      if (r.position && ['1', '2', '3'].includes(r.position)) {
        eventMap[r.eventName].winners.push({
          position: r.position,
          name: r.participantType === 'Group' ? r.parish : r.participantName,
          parish: r.parish,
          marks: r.totalMarks,
          grade: r.grade,
          totalPoints: r.totalPoints,
          participantType: r.participantType
        });
      }
    });

    return Object.values(eventMap)
      .map(e => ({
        ...e,
        winners: e.winners.sort((a, b) => Number(a.position) - Number(b.position))
      }))
      .sort((a, b) => a.section.localeCompare(b.section) || a.eventName.localeCompare(b.eventName));
  };

  // ===== 3. SECTION-WISE SUMMARY =====
  const getSectionSummary = () => {
    const sectionMap = {};

    allResults.forEach(r => {
      const sec = r.section || 'Unknown';
      if (!sectionMap[sec]) {
        sectionMap[sec] = {
          section: sec,
          totalEvents: new Set(),
          scoredEvents: new Set(),
          totalParticipants: 0,
          parishes: {},
          firsts: 0,
          seconds: 0,
          thirds: 0
        };
      }
      sectionMap[sec].totalParticipants++;
      sectionMap[sec].scoredEvents.add(r.eventName);
      if (r.position === '1') sectionMap[sec].firsts++;
      if (r.position === '2') sectionMap[sec].seconds++;
      if (r.position === '3') sectionMap[sec].thirds++;

      if (!sectionMap[sec].parishes[r.parish]) {
        sectionMap[sec].parishes[r.parish] = { totalPoints: 0, parish: r.parish };
      }
      sectionMap[sec].parishes[r.parish].totalPoints += r.totalPoints || 0;
    });

    // Count total events per section from events list
    events.forEach(e => {
      if (sectionMap[e.section]) {
        sectionMap[e.section].totalEvents.add(e.eventName);
      }
    });

    return Object.values(sectionMap).map(s => ({
      ...s,
      totalEventsCount: s.totalEvents.size,
      scoredEventsCount: s.scoredEvents.size,
      topParish: Object.values(s.parishes).sort((a, b) => b.totalPoints - a.totalPoints)[0] || null,
      parishStandings: Object.values(s.parishes).sort((a, b) => b.totalPoints - a.totalPoints)
    }));
  };

  // ===== 4. INDIVIDUAL TOP SCORERS =====
  const getTopScorers = () => {
    return filteredResults
      .filter(r => r.participantType !== 'Group' && r.totalMarks > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints || b.totalMarks - a.totalMarks)
      .slice(0, 20);
  };

  // ===== 5. GRADE SUMMARY =====
  const getGradeSummary = () => {
    const parishMap = {};

    filteredResults.forEach(r => {
      const parish = r.parish || 'Unknown';
      if (!parishMap[parish]) {
        parishMap[parish] = { parish, A: 0, B: 0, C: 0, none: 0, total: 0 };
      }
      if (r.grade === 'A') parishMap[parish].A++;
      else if (r.grade === 'B') parishMap[parish].B++;
      else if (r.grade === 'C') parishMap[parish].C++;
      else parishMap[parish].none++;
      parishMap[parish].total++;
    });

    return Object.values(parishMap).sort((a, b) => b.A - a.A || b.B - a.B);
  };

  const parishStandings = getParishStandings();
  const eventResults = getEventResults();
  const sectionSummary = getSectionSummary();
  const topScorers = getTopScorers();
  const gradeSummary = getGradeSummary();

  // Top 3 overall
  const top3 = parishStandings.slice(0, 3);

  return (
    <>
      <style>{printStyles}</style>
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} className="no-print">
            <Typography variant="h5" fontWeight="bold">
              Results Dashboard — ഫൊറോന കലോത്സവം 2026
            </Typography>
            <Box display="flex" gap={1}>
              <Button variant="outlined" onClick={fetchAllData} disabled={isLoading}>Refresh</Button>
              <Button variant="contained" onClick={() => window.print()}>Print</Button>
            </Box>
          </Box>

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }} className="no-print">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Section</InputLabel>
                  <Select
                    value={selectedSection}
                    label="Filter by Section"
                    onChange={(e) => setSelectedSection(e.target.value)}
                  >
                    <MenuItem value="">All Sections</MenuItem>
                    {Object.keys(SECTION_CONFIG).map(sec => (
                      <MenuItem key={sec} value={sec}>{sec} ({SECTION_CONFIG[sec]})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={9}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
                  <Tab label="Overall Standings" />
                  <Tab label="Event Results" />
                  <Tab label="Section Summary" />
                  <Tab label="Top Scorers" />
                  <Tab label="Grade Summary" />
                </Tabs>
              </Grid>
            </Grid>
          </Paper>

          {isLoading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : (
            <Box className="print-area">
              {/* Print Header */}
              <Box textAlign="center" mb={2} sx={{ display: 'none', '@media print': { display: 'block' } }}>
                <Typography variant="h5" fontWeight="bold">ഫൊറോന കലോത്സവം 2026 — Results</Typography>
                {selectedSection && <Typography variant="subtitle1">Section: {selectedSection}</Typography>}
              </Box>

              {/* ===== TOP 3 CARDS ===== */}
              {activeTab === 0 && top3.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {top3.map((parish, idx) => (
                    <Grid item xs={12} md={4} key={parish.parish}>
                      <Card sx={{
                        background: idx === 0
                          ? 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)'
                          : idx === 1
                            ? 'linear-gradient(135deg, #E0E0E0 0%, #9E9E9E 100%)'
                            : 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
                        color: idx === 0 ? '#333' : '#fff'
                      }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="caption" fontWeight="bold">
                                {POSITION_LABELS[String(idx + 1)]} Place
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">{parish.parish}</Typography>
                              <Typography variant="body2">
                                {parish.totalPoints} Points | {parish.firsts}🥇 {parish.seconds}🥈 {parish.thirds}🥉
                              </Typography>
                            </Box>
                            <Trophy size={40} />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* ===== TAB 0: OVERALL STANDINGS ===== */}
              {activeTab === 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Parish Overall Standings {selectedSection && `— ${selectedSection}`}
                  </Typography>
                  <TableContainer>
                    <Table size="small" sx={{ '& th, & td': { border: '1px solid #ddd', padding: '6px 8px' } }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell>Rank</TableCell>
                          <TableCell>Parish</TableCell>
                          <TableCell align="center">Total Points</TableCell>
                          <TableCell align="center">Grade Pts</TableCell>
                          <TableCell align="center">Position Pts</TableCell>
                          <TableCell align="center">🥇</TableCell>
                          <TableCell align="center">🥈</TableCell>
                          <TableCell align="center">🥉</TableCell>
                          <TableCell align="center">A</TableCell>
                          <TableCell align="center">B</TableCell>
                          <TableCell align="center">C</TableCell>
                          <TableCell align="center">Events</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parishStandings.map((p, idx) => (
                          <TableRow key={p.parish} sx={{
                            backgroundColor: idx < 3 ? `${MEDAL_COLORS[String(idx + 1)]}15` : 'inherit'
                          }}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                {idx + 1}
                                {idx < 3 && <Typography>{['🥇', '🥈', '🥉'][idx]}</Typography>}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: idx < 3 ? 700 : 400 }}>{p.parish}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '15px' }}>{p.totalPoints}</TableCell>
                            <TableCell align="center">{p.gradePoints}</TableCell>
                            <TableCell align="center">{p.positionPoints}</TableCell>
                            <TableCell align="center">{p.firsts || '-'}</TableCell>
                            <TableCell align="center">{p.seconds || '-'}</TableCell>
                            <TableCell align="center">{p.thirds || '-'}</TableCell>
                            <TableCell align="center">{p.gradeA || '-'}</TableCell>
                            <TableCell align="center">{p.gradeB || '-'}</TableCell>
                            <TableCell align="center">{p.gradeC || '-'}</TableCell>
                            <TableCell align="center">{p.eventsCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* ===== TAB 1: EVENT RESULTS ===== */}
              {activeTab === 1 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Event-wise Results {selectedSection && `— ${selectedSection}`}
                  </Typography>
                  <TableContainer>
                    <Table size="small" sx={{ '& th, & td': { border: '1px solid #ddd', padding: '6px 8px' } }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell>Sl</TableCell>
                          <TableCell>Event</TableCell>
                          <TableCell>Section</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="center">🥇 1st</TableCell>
                          <TableCell align="center">🥈 2nd</TableCell>
                          <TableCell align="center">🥉 3rd</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {eventResults.map((event, idx) => {
                          const first = event.winners.find(w => w.position === '1');
                          const second = event.winners.find(w => w.position === '2');
                          const third = event.winners.find(w => w.position === '3');

                          return (
                            <TableRow key={idx}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>{event.eventName}</TableCell>
                              <TableCell>
                                <Chip label={event.section} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={event.eventType === 'group' ? 'Group' : 'Individual'}
                                  size="small"
                                  color={event.eventType === 'group' ? 'secondary' : 'default'}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell align="center">
                                {first ? (
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">{first.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{first.parish} ({first.marks})</Typography>
                                  </Box>
                                ) : '-'}
                              </TableCell>
                              <TableCell align="center">
                                {second ? (
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">{second.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{second.parish} ({second.marks})</Typography>
                                  </Box>
                                ) : '-'}
                              </TableCell>
                              <TableCell align="center">
                                {third ? (
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">{third.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{third.parish} ({third.marks})</Typography>
                                  </Box>
                                ) : '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {eventResults.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center">No results available</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* ===== TAB 2: SECTION SUMMARY ===== */}
              {activeTab === 2 && (
                <Box>
                  {sectionSummary.map(sec => (
                    <Paper sx={{ p: 2, mb: 3 }} key={sec.section}>
                      <Typography variant="h6" fontWeight="bold" mb={1}>
                        {sec.section} ({SECTION_CONFIG[sec.section] || ''})
                      </Typography>
                      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                        <Chip label={`Events Scored: ${sec.scoredEventsCount} / ${sec.totalEventsCount}`} color="primary" variant="outlined" />
                        <Chip label={`Total Participants: ${sec.totalParticipants}`} color="secondary" variant="outlined" />
                        {sec.topParish && (
                          <Chip label={`Top Parish: ${sec.topParish.parish} (${sec.topParish.totalPoints} pts)`} color="success" />
                        )}
                      </Box>
                      <TableContainer>
                        <Table size="small" sx={{ '& th, & td': { border: '1px solid #ddd', padding: '6px 8px' } }}>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                              <TableCell>Rank</TableCell>
                              <TableCell>Parish</TableCell>
                              <TableCell align="center">Total Points</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {sec.parishStandings.map((p, idx) => (
                              <TableRow key={p.parish} sx={{
                                backgroundColor: idx < 3 ? `${MEDAL_COLORS[String(idx + 1)]}15` : 'inherit'
                              }}>
                                <TableCell>
                                  {idx + 1} {idx < 3 && ['🥇', '🥈', '🥉'][idx]}
                                </TableCell>
                                <TableCell sx={{ fontWeight: idx < 3 ? 700 : 400 }}>{p.parish}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>{p.totalPoints}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  ))}
                  {sectionSummary.length === 0 && (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">No section data available</Typography>
                    </Paper>
                  )}
                </Box>
              )}

              {/* ===== TAB 3: TOP SCORERS ===== */}
              {activeTab === 3 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Top Individual Scorers {selectedSection && `— ${selectedSection}`}
                  </Typography>
                  <TableContainer>
                    <Table size="small" sx={{ '& th, & td': { border: '1px solid #ddd', padding: '6px 8px' } }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell>Rank</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Parish</TableCell>
                          <TableCell>Event</TableCell>
                          <TableCell>Section</TableCell>
                          <TableCell align="center">Marks</TableCell>
                          <TableCell align="center">Grade</TableCell>
                          <TableCell align="center">Position</TableCell>
                          <TableCell align="center">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topScorers.map((p, idx) => (
                          <TableRow key={idx} sx={{
                            backgroundColor: idx < 3 ? `${MEDAL_COLORS[String(idx + 1)]}15` : 'inherit'
                          }}>
                            <TableCell>
                              {idx + 1} {idx < 3 && ['🥇', '🥈', '🥉'][idx]}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{p.participantName}</TableCell>
                            <TableCell>{p.parish}</TableCell>
                            <TableCell>{p.eventName}</TableCell>
                            <TableCell>
                              <Chip label={p.section} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="center">{p.totalMarks}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={p.grade || '-'}
                                size="small"
                                color={p.grade === 'A' ? 'success' : p.grade === 'B' ? 'primary' : p.grade === 'C' ? 'warning' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {p.position ? POSITION_LABELS[p.position] || p.position : '-'}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>{p.totalPoints}</TableCell>
                          </TableRow>
                        ))}
                        {topScorers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} align="center">No individual scores available</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* ===== TAB 4: GRADE SUMMARY ===== */}
              {activeTab === 4 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Grade Summary by Parish {selectedSection && `— ${selectedSection}`}
                  </Typography>
                  <TableContainer>
                    <Table size="small" sx={{ '& th, & td': { border: '1px solid #ddd', padding: '6px 8px' } }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell>Sl</TableCell>
                          <TableCell>Parish</TableCell>
                          <TableCell align="center">Grade A</TableCell>
                          <TableCell align="center">Grade B</TableCell>
                          <TableCell align="center">Grade C</TableCell>
                          <TableCell align="center">No Grade</TableCell>
                          <TableCell align="center">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {gradeSummary.map((p, idx) => (
                          <TableRow key={p.parish}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{p.parish}</TableCell>
                            <TableCell align="center">
                              <Chip label={p.A} size="small" color="success" variant={p.A > 0 ? 'filled' : 'outlined'} />
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={p.B} size="small" color="primary" variant={p.B > 0 ? 'filled' : 'outlined'} />
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={p.C} size="small" color="warning" variant={p.C > 0 ? 'filled' : 'outlined'} />
                            </TableCell>
                            <TableCell align="center">{p.none}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>{p.total}</TableCell>
                          </TableRow>
                        ))}
                        {gradeSummary.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center">No grade data available</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
};

export default ResultsDashboard;
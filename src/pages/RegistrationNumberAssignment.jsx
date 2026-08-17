import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, Grid, FormControl, InputLabel, Select, MenuItem,
  Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, CircularProgress, Alert, Chip, Tabs, Tab, Card, CardContent
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { Save, RefreshCw, Hash, Users, Layers } from 'lucide-react';
import axiosInstance from '../axiosConfig';

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

const SECTION_CONFIG = {
  'Dominic Savio': { classes: ['IV', 'V', 'VI'], label: 'Classes IV-VI' },
  'Alphonsa': { classes: ['VII', 'VIII', 'IX'], label: 'Classes VII-IX' },
  'Saint Thomas': { classes: ['X', 'XI', 'XII'], label: 'Classes X-XII' }
};

const FORANE_ID = '673799a3cb9b4aa181e53fa2';

const CLASS_TO_SECTION = {};
for (const [section, config] of Object.entries(SECTION_CONFIG)) {
  for (const cls of config.classes) {
    CLASS_TO_SECTION[cls] = section;
  }
}

const RegistrationNumberAssignment = () => {
  const [selectedSection, setSelectedSection] = useState('');
  const [parishes, setParishes] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [groupEntries, setGroupEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState(0);

  const [singleStart, setSingleStart] = useState(1);
  const [singleIncrement, setSingleIncrement] = useState(1);
  const [groupStart, setGroupStart] = useState(1);
  const [groupIncrement, setGroupIncrement] = useState(1);

  useEffect(() => { fetchParishes(); }, []);

  useEffect(() => {
    if (selectedSection && parishes.length > 0) fetchAllRegistrations();
  }, [selectedSection, parishes]);

  const fetchParishes = async () => {
    try {
      const response = await axiosInstance.get('/parish');
      const filtered = (response.data || []).filter(
        (p) => p.forane === FORANE_ID || p.forane?._id === FORANE_ID
      );
      setParishes(filtered);
    } catch (error) {
      console.error('Error fetching parishes:', error);
    }
  };

  const fetchAllRegistrations = async () => {
    try {
      setIsLoading(true);

      const results = await Promise.allSettled(
        parishes.map(parish =>
          axiosInstance.get(`/registrations/parish/${parish._id}`)
            .then(res => ({
              parishName: parish.name,
              parishId: parish._id,
              registrations: res.data.data.registrations || []
            }))
        )
      );

      const participantMap = {};
      const groupMap = {};

      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const { parishName, parishId, registrations } = result.value;

        for (const reg of registrations) {
          if (CLASS_TO_SECTION[reg.standard] !== selectedSection) continue;

          const eventType = reg.event?.eventType;
          if (eventType === 'single') {
            const dobStr = reg.dob ? new Date(reg.dob).toISOString().slice(0, 10) : '';
            const key = `${reg.name}|${reg.standard}|${reg.gender}|${dobStr}|${parishId}`;

            if (!participantMap[key]) {
              participantMap[key] = {
                name: reg.name, standard: reg.standard, gender: reg.gender,
                dob: reg.dob, parish: parishName, parishId,
                registrationNumber: reg.registrationNumber || '',
                events: [], registrationIds: []
              };
            }
            participantMap[key].events.push({ eventName: reg.event.eventName });
            participantMap[key].registrationIds.push(reg._id);
          } else if (eventType === 'group') {
            const groupKey = `${parishId}|${reg.event._id}`;
            if (!groupMap[groupKey]) {
              groupMap[groupKey] = {
                parish: parishName, parishId, eventName: reg.event.eventName,
                groupRegistrationNumber: reg.groupRegistrationNumber || '',
                participantCount: 0, registrationIds: []
              };
            }
            groupMap[groupKey].participantCount++;
            groupMap[groupKey].registrationIds.push(reg._id);
          }
        }
      }

      setParticipants(
        Object.values(participantMap).sort((a, b) =>
          a.parish.localeCompare(b.parish) || a.name.localeCompare(b.name)
        )
      );
      setGroupEntries(
        Object.values(groupMap).sort((a, b) =>
          a.parish.localeCompare(b.parish) || a.eventName.localeCompare(b.eventName)
        )
      );
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const autoAssignSingleNumbers = useCallback(() => {
    setParticipants(prev =>
      prev.map((p, i) => ({ ...p, registrationNumber: String(singleStart + i * singleIncrement) }))
    );
  }, [singleStart, singleIncrement]);

  const autoAssignGroupNumbers = useCallback(() => {
    setGroupEntries(prev =>
      prev.map((g, i) => ({ ...g, groupRegistrationNumber: String(groupStart + i * groupIncrement) }))
    );
  }, [groupStart, groupIncrement]);

  const updateSingleRegNo = useCallback((index, value) => {
    setParticipants(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], registrationNumber: value };
      return updated;
    });
  }, []);

  const updateGroupRegNo = useCallback((index, value) => {
    setGroupEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], groupRegistrationNumber: value };
      return updated;
    });
  }, []);

  const batchSave = async (items, field) => {
    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    const tasks = [];
    for (const item of items) {
      const value = item[field];
      if (!value) continue;
      for (const regId of item.registrationIds) {
        tasks.push({ regId, payload: { [field]: value } });
      }
    }

    const BATCH_SIZE = 10;
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(t => axiosInstance.put(`/registrations/${t.regId}`, t.payload))
      );
      for (const r of results) {
        if (r.status === 'fulfilled') successCount++;
        else errorCount++;
      }
    }

    const label = field === 'registrationNumber' ? 'Individual' : 'Group';
    setMessage({
      text: `${label}: ${successCount} updated${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      type: errorCount > 0 ? 'warning' : 'success'
    });
    setIsSaving(false);
  };

  const saveSingleNumbers = () => batchSave(participants, 'registrationNumber');
  const saveGroupNumbers = () => batchSave(groupEntries, 'groupRegistrationNumber');

  const busy = isLoading || isSaving;

  const uniqueParishes = new Set(participants.map(p => p.parish).concat(groupEntries.map(g => g.parish))).size;

  const statisticsCards = [
    { title: 'Individual Participants', value: participants.length, color: '#2563EB', icon: <Users size={24} /> },
    { title: 'Group Entries', value: groupEntries.length, color: '#10B981', icon: <Layers size={24} /> },
    { title: 'Parishes', value: uniqueParishes, color: '#6366F1', icon: <Hash size={24} /> },
  ];

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
                    Registration Number Assignment
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Assign registration numbers for Forane Kalolsavam participants
                  </Typography>
                </Box>
                {selectedSection && (
                  <Button variant="outlined" startIcon={<RefreshCw size={18} />}
                    onClick={fetchAllRegistrations} disabled={busy}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                    Refresh
                  </Button>
                )}
              </PageHeader>
            </Grid>

            {/* Message */}
            {message.text && (
              <Grid item xs={12}>
                <Alert severity={message.type} sx={{ borderRadius: 2 }}
                  onClose={() => setMessage({ text: '', type: '' })}>
                  {message.text}
                </Alert>
              </Grid>
            )}

            {/* Section Selector */}
            <Grid item xs={12} sm={6} md={4}>
              <StyledCard>
                <StyledCardContent>
                  <FormControl fullWidth>
                    <InputLabel>Select Section</InputLabel>
                    <Select value={selectedSection} label="Select Section"
                      onChange={(e) => setSelectedSection(e.target.value)}>
                      <MenuItem value="">Select Section</MenuItem>
                      {Object.entries(SECTION_CONFIG).map(([section, config]) => (
                        <MenuItem key={section} value={section}>
                          {section} ({config.label})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </StyledCardContent>
              </StyledCard>
            </Grid>

            {/* Stat Cards */}
            {selectedSection && !busy && statisticsCards.map((stat, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
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

            {/* Main Content */}
            {busy ? (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                  <CircularProgress />
                </Box>
              </Grid>
            ) : selectedSection ? (
              <Grid item xs={12}>
                <ChartCard>
                  <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}
                    sx={{ mb: 3, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <Tab label={`Individual (${participants.length})`}
                      sx={{ textTransform: 'none', fontWeight: 600 }} />
                    <Tab label={`Group (${groupEntries.length})`}
                      sx={{ textTransform: 'none', fontWeight: 600 }} />
                  </Tabs>

                  {/* Individual Tab */}
                  {activeTab === 0 && (
                    <>
                      <Box sx={{
                        p: 2.5, mb: 3, borderRadius: 3,
                        bgcolor: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)'
                      }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#1a202c' }}>
                          Auto-Assign Settings (Individual)
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={6} sm={3}>
                            <TextField fullWidth size="small" type="number" label="Starting Number"
                              value={singleStart} onChange={(e) => setSingleStart(Number(e.target.value))} />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField fullWidth size="small" type="number" label="Increment"
                              value={singleIncrement} onChange={(e) => setSingleIncrement(Number(e.target.value))} />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Button variant="outlined" fullWidth onClick={autoAssignSingleNumbers}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, height: 40 }}>
                              Auto Assign
                            </Button>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Button variant="contained" fullWidth startIcon={<Save size={18} />}
                              onClick={saveSingleNumbers} disabled={busy}
                              sx={{
                                borderRadius: 2, textTransform: 'none', fontWeight: 600, height: 40,
                                boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
                              }}>
                              Save Individual
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>

                      <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                              <TableCell sx={{ fontWeight: 600 }}>No.</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Reg. Number</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Parish</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Events</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {participants.map((p, index) => (
                              <TableRow key={`${p.parishId}-${p.name}-${index}`}
                                sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                  <TextField size="small" variant="outlined"
                                    value={p.registrationNumber}
                                    onChange={(e) => updateSingleRegNo(index, e.target.value)}
                                    sx={{ width: 120 }} />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                                <TableCell>{p.standard}</TableCell>
                                <TableCell>{p.gender === 'M' ? 'Male' : 'Female'}</TableCell>
                                <TableCell>
                                  <Chip size="small" label={p.parish} sx={{
                                    bgcolor: '#2563EB15', color: '#2563EB',
                                    border: '1px solid #2563EB30', fontWeight: 600
                                  }} />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {p.events.map((e, i) => (
                                      <Chip key={i} size="small" label={e.eventName}
                                        variant="outlined" sx={{ fontSize: '0.75rem' }} />
                                    ))}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                            {participants.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                  <Users size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                                  <Typography color="textSecondary">
                                    No individual participants found in this section
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}

                  {/* Group Tab */}
                  {activeTab === 1 && (
                    <>
                      <Box sx={{
                        p: 2.5, mb: 3, borderRadius: 3,
                        bgcolor: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)'
                      }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#1a202c' }}>
                          Auto-Assign Settings (Group)
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={6} sm={3}>
                            <TextField fullWidth size="small" type="number" label="Starting Number"
                              value={groupStart} onChange={(e) => setGroupStart(Number(e.target.value))} />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField fullWidth size="small" type="number" label="Increment"
                              value={groupIncrement} onChange={(e) => setGroupIncrement(Number(e.target.value))} />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Button variant="outlined" fullWidth onClick={autoAssignGroupNumbers}
                              color="secondary"
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, height: 40 }}>
                              Auto Assign
                            </Button>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Button variant="contained" fullWidth startIcon={<Save size={18} />}
                              onClick={saveGroupNumbers} disabled={busy} color="secondary"
                              sx={{
                                borderRadius: 2, textTransform: 'none', fontWeight: 600, height: 40,
                                boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                              }}>
                              Save Group
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>

                      <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                              <TableCell sx={{ fontWeight: 600 }}>No.</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Group Reg. Number</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Parish</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Event Name</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Participants</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {groupEntries.map((g, index) => (
                              <TableRow key={`${g.parishId}-${g.eventName}-${index}`}
                                sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                  <TextField size="small" variant="outlined"
                                    value={g.groupRegistrationNumber}
                                    onChange={(e) => updateGroupRegNo(index, e.target.value)}
                                    sx={{ width: 120 }} />
                                </TableCell>
                                <TableCell>
                                  <Chip size="small" label={g.parish} sx={{
                                    bgcolor: '#10B98115', color: '#10B981',
                                    border: '1px solid #10B98130', fontWeight: 600
                                  }} />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{g.eventName}</TableCell>
                                <TableCell>
                                  <Chip size="small" label={g.participantCount}
                                    sx={{ bgcolor: 'rgba(0,0,0,0.06)', fontWeight: 600 }} />
                                </TableCell>
                              </TableRow>
                            ))}
                            {groupEntries.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                  <Layers size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                                  <Typography color="textSecondary">
                                    No group entries found in this section
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </ChartCard>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <ChartCard>
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Hash size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                    <Typography color="textSecondary" sx={{ fontSize: '1.05rem' }}>
                      Select a section to view and assign registration numbers
                    </Typography>
                  </Box>
                </ChartCard>
              </Grid>
            )}
          </Grid>
        </Container>
      </DashboardContainer>
    </ThemeProvider>
  );
};

export default RegistrationNumberAssignment;
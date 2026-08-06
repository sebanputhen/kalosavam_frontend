import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, FormControl, InputLabel, Select, MenuItem,
  Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, CircularProgress, Alert, Chip, Divider, Tabs, Tab
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Save, RefreshCw } from 'lucide-react';
import axiosInstance from '../axiosConfig';

const theme = createTheme({
  palette: {
    primary: { main: '#2563EB' },
    secondary: { main: '#10B981' },
    info: { main: '#6366F1' }
  }
});

const SECTION_CONFIG = {
  'Dominic Savio': { classes: ['IV', 'V', 'VI'], label: 'Classes IV-VI' },
  'Alphonsa': { classes: ['VII', 'VIII', 'IX'], label: 'Classes VII-IX' },
  'Saint Thomas': { classes: ['X', 'XI', 'XII'], label: 'Classes X-XII' }
};

const FORANE_ID = '673799a3cb9b4aa181e53fa2';

const getParticipantSection = (standard) => {
  for (const [section, config] of Object.entries(SECTION_CONFIG)) {
    if (config.classes.includes(standard)) return section;
  }
  return null;
};

const RegistrationNumberAssignment = () => {
  const [selectedSection, setSelectedSection] = useState('');
  const [parishes, setParishes] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [groupEntries, setGroupEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState(0);

  // Config for numbering
  const [singleStart, setSingleStart] = useState(1);
  const [singleIncrement, setSingleIncrement] = useState(1);
  const [groupStart, setGroupStart] = useState(1);
  const [groupIncrement, setGroupIncrement] = useState(1);

  useEffect(() => {
    fetchParishes();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      fetchAllRegistrations();
    }
  }, [selectedSection]);

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
      // Fetch registrations from all parishes in this forane
      const allRegistrations = [];

      for (const parish of parishes) {
        try {
          const response = await axiosInstance.get(`/registrations/parish/${parish._id}`);
          const regs = response.data.data.registrations || [];
          regs.forEach(reg => {
            reg._parishName = parish.name;
            reg._parishId = parish._id;
          });
          allRegistrations.push(...regs);
        } catch (err) {
          console.error(`Error fetching for parish ${parish.name}:`, err);
        }
      }

      // Filter by selected section
      const sectionRegs = allRegistrations.filter(reg => {
        const section = getParticipantSection(reg.standard);
        return section === selectedSection;
      });

      // Process individual participants (unique by name+standard+gender+dob+parish)
      const participantMap = {};
      const groupMap = {};

      sectionRegs.forEach(reg => {
        const eventType = reg.event?.eventType;
        const key = `${reg.name}|${reg.standard}|${reg.gender}|${new Date(reg.dob).toISOString().split('T')[0]}|${reg._parishId}`;

        if (eventType === 'single') {
          if (!participantMap[key]) {
            participantMap[key] = {
              _id: reg._id,
              name: reg.name,
              standard: reg.standard,
              gender: reg.gender,
              dob: reg.dob,
              parish: reg._parishName,
              parishId: reg._parishId,
              registrationNumber: reg.registrationNumber || '',
              events: [],
              registrationIds: []
            };
          }
          participantMap[key].events.push({
            eventId: reg.event._id,
            eventName: reg.event.eventName,
            registrationId: reg._id
          });
          participantMap[key].registrationIds.push(reg._id);
        } else if (eventType === 'group') {
          // Group: one number per parish per event
          const groupKey = `${reg._parishId}|${reg.event._id}`;
          if (!groupMap[groupKey]) {
            groupMap[groupKey] = {
              parish: reg._parishName,
              parishId: reg._parishId,
              eventId: reg.event._id,
              eventName: reg.event.eventName,
              groupRegistrationNumber: reg.groupRegistrationNumber || '',
              participantCount: 0,
              registrationIds: []
            };
          }
          groupMap[groupKey].participantCount++;
          groupMap[groupKey].registrationIds.push(reg._id);
        }
      });

      // Sort participants by parish then name
      const sortedParticipants = Object.values(participantMap).sort((a, b) => {
        if (a.parish !== b.parish) return a.parish.localeCompare(b.parish);
        return a.name.localeCompare(b.name);
      });

      // Sort group entries by parish then event
      const sortedGroups = Object.values(groupMap).sort((a, b) => {
        if (a.parish !== b.parish) return a.parish.localeCompare(b.parish);
        return a.eventName.localeCompare(b.eventName);
      });

      setParticipants(sortedParticipants);
      setGroupEntries(sortedGroups);
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  const autoAssignSingleNumbers = () => {
    const updated = participants.map((p, index) => ({
      ...p,
      registrationNumber: String(singleStart + index * singleIncrement)
    }));
    setParticipants(updated);
  };

  const autoAssignGroupNumbers = () => {
    const updated = groupEntries.map((g, index) => ({
      ...g,
      groupRegistrationNumber: String(groupStart + index * groupIncrement)
    }));
    setGroupEntries(updated);
  };

  const updateSingleRegNo = (index, value) => {
    const updated = [...participants];
    updated[index].registrationNumber = value;
    setParticipants(updated);
  };

  const updateGroupRegNo = (index, value) => {
    const updated = [...groupEntries];
    updated[index].groupRegistrationNumber = value;
    setGroupEntries(updated);
  };

  const saveSingleNumbers = async () => {
    try {
      setIsLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const participant of participants) {
        if (!participant.registrationNumber) continue;
        for (const regId of participant.registrationIds) {
          try {
            await axiosInstance.put(`/registrations/${regId}`, {
              registrationNumber: participant.registrationNumber
            });
            successCount++;
          } catch (err) {
            errorCount++;
            console.error(`Error updating ${regId}:`, err);
          }
        }
      }

      setMessage({
        text: `Individual: ${successCount} updated${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        type: errorCount > 0 ? 'warning' : 'success'
      });
      setIsLoading(false);
    } catch (error) {
      setMessage({ text: 'Error saving individual numbers', type: 'error' });
      setIsLoading(false);
    }
  };

  const saveGroupNumbers = async () => {
    try {
      setIsLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const group of groupEntries) {
        if (!group.groupRegistrationNumber) continue;
        for (const regId of group.registrationIds) {
          try {
            await axiosInstance.put(`/registrations/${regId}`, {
              groupRegistrationNumber: group.groupRegistrationNumber
            });
            successCount++;
          } catch (err) {
            errorCount++;
            console.error(`Error updating ${regId}:`, err);
          }
        }
      }

      setMessage({
        text: `Group: ${successCount} updated${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        type: errorCount > 0 ? 'warning' : 'success'
      });
      setIsLoading(false);
    } catch (error) {
      setMessage({ text: 'Error saving group numbers', type: 'error' });
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
            Registration Number Assignment
          </Typography>

          {message.text && (
            <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ text: '', type: '' })}>
              {message.text}
            </Alert>
          )}

          {/* Section Selection */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Section</InputLabel>
                <Select
                  value={selectedSection}
                  label="Select Section"
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  <MenuItem value="">Select Section</MenuItem>
                  {Object.entries(SECTION_CONFIG).map(([section, config]) => (
                    <MenuItem key={section} value={section}>
                      {section} ({config.label})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                onClick={fetchAllRegistrations}
                disabled={!selectedSection || isLoading}
                sx={{ height: '56px' }}
                fullWidth
              >
                Refresh Data
              </Button>
            </Grid>
          </Grid>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : selectedSection ? (
            <>
              {/* Stats */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Chip label={`${participants.length} Individual Participants`} color="primary" variant="outlined" />
                <Chip label={`${groupEntries.length} Group Entries`} color="secondary" variant="outlined" />
              </Box>

              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
                <Tab label={`Individual (${participants.length})`} />
                <Tab label={`Group (${groupEntries.length})`} />
              </Tabs>

              {/* Individual Tab */}
              {activeTab === 0 && (
                <>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>Auto-Assign Settings (Individual)</Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth size="small" type="number" label="Starting Number"
                          value={singleStart}
                          onChange={(e) => setSingleStart(Number(e.target.value))}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth size="small" type="number" label="Increment"
                          value={singleIncrement}
                          onChange={(e) => setSingleIncrement(Number(e.target.value))}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Button variant="outlined" fullWidth onClick={autoAssignSingleNumbers}>
                          Auto Assign
                        </Button>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Button
                          variant="contained" fullWidth
                          startIcon={<Save size={18} />}
                          onClick={saveSingleNumbers}
                          disabled={isLoading}
                        >
                          Save Individual
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>No.</TableCell>
                          <TableCell>Reg. Number</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Class</TableCell>
                          <TableCell>Gender</TableCell>
                          <TableCell>Parish</TableCell>
                          <TableCell>Events</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {participants.map((p, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <TextField
                                size="small" variant="outlined"
                                value={p.registrationNumber}
                                onChange={(e) => updateSingleRegNo(index, e.target.value)}
                                sx={{ width: 120 }}
                              />
                            </TableCell>
                            <TableCell>{p.name}</TableCell>
                            <TableCell>{p.standard}</TableCell>
                            <TableCell>{p.gender === 'M' ? 'Male' : 'Female'}</TableCell>
                            <TableCell>
                              <Chip size="small" label={p.parish} variant="outlined" color="primary" />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {p.events.map((e, i) => (
                                  <Chip key={i} size="small" label={e.eventName} variant="outlined" />
                                ))}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                        {participants.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              No individual participants found in this section
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
                  <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>Auto-Assign Settings (Group)</Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth size="small" type="number" label="Starting Number"
                          value={groupStart}
                          onChange={(e) => setGroupStart(Number(e.target.value))}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth size="small" type="number" label="Increment"
                          value={groupIncrement}
                          onChange={(e) => setGroupIncrement(Number(e.target.value))}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Button variant="outlined" fullWidth onClick={autoAssignGroupNumbers}>
                          Auto Assign
                        </Button>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Button
                          variant="contained" fullWidth
                          startIcon={<Save size={18} />}
                          onClick={saveGroupNumbers}
                          disabled={isLoading}
                        >
                          Save Group
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>No.</TableCell>
                          <TableCell>Group Reg. Number</TableCell>
                          <TableCell>Parish</TableCell>
                          <TableCell>Event Name</TableCell>
                          <TableCell>Participants</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupEntries.map((g, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <TextField
                                size="small" variant="outlined"
                                value={g.groupRegistrationNumber}
                                onChange={(e) => updateGroupRegNo(index, e.target.value)}
                                sx={{ width: 120 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={g.parish} variant="outlined" color="secondary" />
                            </TableCell>
                            <TableCell>{g.eventName}</TableCell>
                            <TableCell>
                              <Chip size="small" label={g.participantCount} color="default" />
                            </TableCell>
                          </TableRow>
                        ))}
                        {groupEntries.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              No group entries found in this section
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          ) : (
            <Box textAlign="center" py={5}>
              <Typography color="textSecondary">Select a section to view and assign registration numbers</Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default RegistrationNumberAssignment;
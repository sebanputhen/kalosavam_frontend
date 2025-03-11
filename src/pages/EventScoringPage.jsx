import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Filter } from 'lucide-react';
import { 
  Box, 
  Typography, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid, 
  Paper, 
  CircularProgress,
  Chip,
  Alert,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Drawer,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axiosInstance from '../axiosConfig';

// Theme configuration
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB',
      light: '#3B82F6',
      dark: '#1E40AF'
    },
    secondary: {
      main: '#10B981',
      light: '#34D399',
      dark: '#047857'
    }
  }
});

const EventScoringPage = () => {
  // State for dropdowns and filters
  const [foranes, setForanes] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Selected values
  const [selectedForane, setSelectedForane] = useState('');
  const [selectedParish, setSelectedParish] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Filtering states
  const [eventNameFilter, setEventNameFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [availableSections, setAvailableSections] = useState([]);
  const [availableStages, setAvailableStages] = useState([]);

  // Scoring details
  const [maxMarks, setMaxMarks] = useState(100);
  const [eventParticipants, setEventParticipants] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [scoredEvents, setScoredEvents] = useState([]);
  // Filter drawer state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch parishes when forane is selected
  useEffect(() => {
    if (selectedForane) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [selectedForane]);

  // Fetch event participants when parish is selected
  useEffect(() => {
    if (selectedEvent) {
      fetchEventParticipants();
    } else {
      setEventParticipants([]);
    }
  }, [selectedEvent]);

  // Extract unique sections and stages from events
  useEffect(() => {
    const sections = [...new Set(events.map(event => event.section))].filter(Boolean).sort();
    const stages = [...new Set(events.map(event => event.stage))].filter(Boolean).sort();
    setAvailableSections(sections);
    setAvailableStages(stages);
  }, [events]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      // Fetch foranes
      const foraneResponse = await axiosInstance.get('/forane');
      setForanes(foraneResponse.data || []);

      // Fetch categories
      const categoriesResponse = await axiosInstance.get('/categories');
      setCategories(categoriesResponse.data.data.categories || []);

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setMessage({ 
        text: 'Failed to load initial data. Please try again.', 
        type: 'error' 
      });
      setIsLoading(false);
    }
  };

  const fetchParishes = async () => {
    try {
      setIsLoading(true);
      // Fetch parishes for selected forane
      const parishResponse = await axiosInstance.get(`/parish/forane/${selectedForane}`);
      setParishes(parishResponse.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching parishes:', error);
      setMessage({ 
        text: 'Failed to load parishes. Please try again.', 
        type: 'error' 
      });
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!selectedForane) return;
  
    try {
      setIsLoading(true);
      // Fetch On Stage events
      const onStageResponse = await axiosInstance.get(`/events/stage/On Stage`);
      const offStageResponse = await axiosInstance.get(`/events/stage/Off Stage`);
      
      // Combine On Stage and Off Stage events
      const allEvents = [
        ...(onStageResponse.data.data?.events || []),
        ...(offStageResponse.data.data?.events || [])
      ];
      
      setEvents(allEvents);
      
      // Fetch all scored events for this forane
      try {
        const scoredEventsResponse = await axiosInstance.get(`/event-scoring/forane/${selectedForane}`);
        if (scoredEventsResponse.data && scoredEventsResponse.data.success) {
          // Extract just the event IDs that have scores
          const eventIdsWithScores = scoredEventsResponse.data.data.eventScorings.map(
            scoring => scoring.eventId._id || scoring.eventId
          );
          setScoredEvents(eventIdsWithScores);
        }
      } catch (error) {
        console.log('Error fetching scored events:', error);
        // If there's an error, just assume no events are scored
        setScoredEvents([]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setMessage({ 
        text: 'Failed to load events. Please try again.', 
        type: 'error' 
      });
      setIsLoading(false);
    }
  };
  const fetchEventParticipants = async () => {
    if (!selectedForane || !selectedEvent) return;
  
    try {
      setIsLoading(true);
      
      // First, check if scoring already exists for this event and forane
      let existingScoring = null;
      try {
        const scoringResponse = await axiosInstance.get(`/event-scoring/forane/${selectedForane}/event/${selectedEvent}`);
        if (scoringResponse.data && scoringResponse.data.success && scoringResponse.data.data.eventScoring) {
          existingScoring = scoringResponse.data.data.eventScoring;
          
          // Update max marks from existing scoring data
          if (existingScoring.maxMarks) {
            setMaxMarks(existingScoring.maxMarks);
          }
        }
      } catch (error) {
        // No existing scoring data found, continue with regular flow
        console.log('No existing scoring found, creating new scoring record');
      }
      
      // Fetch registrations for the selected forane and event
      const response = await axiosInstance.get(`/registrations/forane/${selectedForane}/event/${selectedEvent}`);
      
      // Process registrations differently based on event type (individual vs group)
      const selectedEventData = events.find(event => event._id === selectedEvent);
      const isGroupEvent = selectedEventData?.eventType === 'group';
      
      let processedParticipants = [];
      
      if (isGroupEvent) {
        // For group events, get only unique parishes
        const uniqueParishes = [];
        const parishTracker = new Set();
        
        // First, collect all unique parish names
        response.data.data.registrations.forEach(reg => {
          const parishName = reg.parish?.name || 'Unknown Parish';
          const parishId = reg.parish?._id || null;
          
          // Use Set to track unique parish names
          if (!parishTracker.has(parishName)) {
            parishTracker.add(parishName);
            uniqueParishes.push({
              _id: reg._id,
              name: parishName,
              participantType: 'Group',
              parish: parishName,
              parishId: parishId, // Store the parish ID
              registrationNumber: reg.groupRegistrationNumber || '',
              totalMarks: 0,
              grade: '',
              position: '',
              gradePoints: 0,
              positionPoints: 0,
              totalPoints: 0
            });
          }
        });
        
        processedParticipants = uniqueParishes;
      } else {
        // For individual events, show all participants
        processedParticipants = response.data.data.registrations.map(reg => ({
          _id: reg._id,
          name: reg.name,
          participantType: 'Individual',
          parish: reg.parish?.name || 'Unknown Parish',
          parishId: reg.parish?._id || null, // Store the parish ID
          standard: reg.standard,
          gender: reg.gender,
          registrationNumber: reg.registrationNumber || '',
          totalMarks: 0,
          grade: '',
          position: '',
          gradePoints: 0,
          positionPoints: 0,
          totalPoints: 0
        }));
      }
      
      // If we have existing scoring data, merge it with the participants data
      if (existingScoring && existingScoring.participants && existingScoring.participants.length > 0) {
        processedParticipants = processedParticipants.map(participant => {
          // Try to find matching participant in existing scoring data
          const existingParticipant = existingScoring.participants.find(p => 
            p.participantId === participant._id || 
            // For group events, match by parish name
            (isGroupEvent && p.parish === participant.parish)
          );
          
          if (existingParticipant) {
            return {
              ...participant,
              totalMarks: existingParticipant.totalMarks || 0,
              grade: existingParticipant.grade || '',
              position: existingParticipant.position || '',
              gradePoints: existingParticipant.gradePoints || 0,
              positionPoints: existingParticipant.positionPoints || 0,
              totalPoints: existingParticipant.totalPoints || 0
            };
          }
          
          return participant;
        });
        
        // Show a message that existing data was loaded
        setMessage({ 
          text: 'Existing scoring data loaded successfully!', 
          type: 'info' 
        });
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
      
      setEventParticipants(processedParticipants);
      
      // Update message if no participants found
      if (processedParticipants.length === 0) {
        setMessage({ 
          text: 'No participants found for this event in the selected forane.', 
          type: 'info' 
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching event participants:', error);
      setMessage({ 
        text: 'Failed to load event participants. Please try again.', 
        type: 'error' 
      });
      setIsLoading(false);
    }
  };

  // Filtered events
  const filteredEvents = events.filter(event => 
    (!sectionFilter || event.section === sectionFilter) &&
    (!eventNameFilter || 
      event.eventName.toLowerCase().includes(eventNameFilter.toLowerCase())) &&
    (!stageFilter || event.stage === stageFilter)
  );

  // Update total marks for a participant and auto-calculate grade and points
  const updateTotalMarks = (participantIndex, marks) => {
    const updatedParticipants = [...eventParticipants];
    
    // Ensure marks don't exceed maxMarks
    let markValue = Number(marks);
    if (markValue > maxMarks) {
      markValue = maxMarks;
      // Show warning message
      setMessage({
        text: `Total marks cannot exceed maximum marks (${maxMarks}). Value has been adjusted.`,
        type: 'warning'
      });
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
    
    updatedParticipants[participantIndex].totalMarks = markValue;
    
    // Auto-calculate grade based on percentage of max marks
    let grade = '';
    const percentage = maxMarks > 0 ? (markValue / maxMarks) * 100 : 0;
    
    if (percentage >= 80) {
      grade = 'A';
    } else if (percentage >= 60) {
      grade = 'B';
    } else if (percentage >= 40) {
      grade = 'C';
    }
    
    updatedParticipants[participantIndex].grade = grade;
    
    // Calculate grade points
    const isGroupEvent = updatedParticipants[participantIndex].participantType === 'Group';
    let gradePoints = 0;
    
    switch(grade) {
      case 'A':
        gradePoints = 10;
        break;
      case 'B':
        gradePoints = 5;
        break;
      case 'C':
        gradePoints = 3;
        break;
      default:
        gradePoints = 0;
    }
    
    updatedParticipants[participantIndex].gradePoints = gradePoints;
    
    // Auto-sort participants by marks to determine positions
    const sortedParticipants = [...updatedParticipants].sort((a, b) => b.totalMarks - a.totalMarks);
    
    // Reset all positions
    updatedParticipants.forEach(p => {
      p.position = '';
      p.positionPoints = 0;
    });
    
    // Assign positions to top 3 participants
    for (let i = 0; i < Math.min(3, sortedParticipants.length); i++) {
      const topParticipant = sortedParticipants[i];
      if (topParticipant.totalMarks > 0) { // Only assign position if they have marks
        const posIndex = updatedParticipants.findIndex(p => p._id === topParticipant._id);
        
        if (posIndex >= 0) {
          const position = (i + 1).toString();
          updatedParticipants[posIndex].position = position;
          
          // Calculate position points
          let positionPoints = 0;
          const isGroupParticipant = updatedParticipants[posIndex].participantType === 'Group';
          
          if (isGroupParticipant) {
            // Group events points
            switch(position) {
              case '1':
                positionPoints = 10;
                break;
              case '2':
                positionPoints = 5;
                break;
              case '3':
                positionPoints = 3;
                break;
              default:
                positionPoints = 0;
            }
          } else {
            // Individual events points
            switch(position) {
              case '1':
                positionPoints = 5;
                break;
              case '2':
                positionPoints = 3;
                break;
              case '3':
                positionPoints = 1;
                break;
              default:
                positionPoints = 0;
            }
          }
          
          updatedParticipants[posIndex].positionPoints = positionPoints;
        }
      }
    }
    
    // Calculate total points for all participants
    updatedParticipants.forEach(p => {
      p.totalPoints = (p.gradePoints || 0) + (p.positionPoints || 0);
    });
    
    setEventParticipants(updatedParticipants);
  };

  // We no longer need this function as registration numbers come from the database
  // and are displayed as read-only values

  // Save scoring
  const saveScoring = async () => {
    try {
      const payload = {
        foraneId: selectedForane,
        eventId: selectedEvent,
        section: selectedSection,
        maxMarks: maxMarks,
        participants: eventParticipants.map(participant => ({
          participantId: participant._id,
          participantName: participant.participantType === 'Group' ? participant.parish : participant.name,
          participantType: participant.participantType,
          registrationNumber: participant.registrationNumber,
          parish: participant.parish,
          parishId: participant.parishId || null, // Include parishId from participant data
          totalMarks: participant.totalMarks,
          grade: participant.grade || '',
          position: participant.position || '',
          gradePoints: participant.gradePoints || 0,
          positionPoints: participant.positionPoints || 0,
          totalPoints: participant.totalPoints || 0
        }))
      };
  
      const response = await axiosInstance.post('/event-scoring', payload);
      
      // Handle successful save
      setMessage({ 
        text: 'Scoring saved successfully!', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error saving scoring:', error);
      setMessage({ 
        text: 'Error saving scoring. Please try again.', 
        type: 'error' 
      });
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setEventNameFilter('');
    setSectionFilter('');
    setStageFilter('');
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
            Event Scoring
          </Typography>

          {/* Error/Success Message */}
          {message.text && (
            <Alert 
              severity={message.type === 'error' ? 'error' : message.type}
              sx={{ mb: 3 }}
            >
              {message.text}
            </Alert>
          )}

          {/* Main Selection Grid */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Forane Selection */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Forane</InputLabel>
                <Select
                  value={selectedForane}
                  onChange={(e) => {
                    setSelectedForane(e.target.value);
                    setSelectedParish('');
                    setSelectedEvent('');
                  }}
                  label="Select Forane"
                >
                  <MenuItem value="">
                    <em>Select Forane</em>
                  </MenuItem>
                  {foranes.map((forane) => (
                    <MenuItem key={forane._id} value={forane._id}>
                      {forane.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Event Filters */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField sx={{ minWidth: 150 }}
                  fullWidth
                  label="Search Event Name"
                  value={eventNameFilter}
                  onChange={(e) => setEventNameFilter(e.target.value)}
                  variant="outlined"
                />
                {/* <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  sx={{ height: '56px' }}
                >
                  <Filter size={20} />
                </Button> */}
                {/* Section Filter */}
    <FormControl sx={{ minWidth: 150 }}>
      <InputLabel>Section</InputLabel>
      <Select
        value={sectionFilter}
        onChange={(e) => setSectionFilter(e.target.value)}
        label="Section"
      >
        <MenuItem value="">
          <em>All Sections</em>
        </MenuItem>
        {availableSections.map((section) => (
          <MenuItem key={section} value={section}>
            {section}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    
    {/* Stage Filter */}
    {/* <FormControl sx={{ minWidth: 150 }}>
      <InputLabel>Stage</InputLabel>
      <Select
        value={stageFilter}
        onChange={(e) => setStageFilter(e.target.value)}
        label="Stage"
      >
        <MenuItem value="">
          <em>All Stages</em>
        </MenuItem>
        {availableStages.map((stage) => (
          <MenuItem key={stage} value={stage}>
            {stage}
          </MenuItem>
        ))}
      </Select>
    </FormControl> */}
    
    {/* Reset Filters Button */}
    <Button
      variant="outlined"
      color="secondary"
      onClick={resetFilters}
      sx={{ height: '56px' }}
    >
      Clear
    </Button>
 

              </Box>

            </Grid>
          </Grid>

          {/* Events List */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Available Events
            </Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredEvents.map((event) => {
  const isScored = scoredEvents.includes(event._id);
  
  return (
    <Grid item xs={12} sm={6} md={4} key={event._id}>
      <Paper
        variant={selectedEvent === event._id ? 'elevation' : 'outlined'}
        sx={{
          p: 2,
          cursor: 'pointer',
          border: selectedEvent === event._id 
            ? `2px solid ${theme.palette.primary.main}` 
            : isScored 
              ? `2px solid ${theme.palette.secondary.main}` 
              : '1px solid rgba(0,0,0,0.12)',
          bgcolor: selectedEvent === event._id 
            ? 'rgba(37, 99, 235, 0.05)' 
            : isScored 
              ? 'rgba(16, 185, 129, 0.05)'
              : 'white'
        }}
        onClick={() => {
          setSelectedEvent(event._id);
          setSelectedSection(event.section);
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {event.eventName}
          </Typography>
          <Box>
            {isScored && (
              <Chip 
                label="Scored" 
                color="secondary" 
                size="small" 
                sx={{ mr: 0.5 }}
              />
            )}
            {selectedEvent === event._id && (
              <Chip 
                label="Selected" 
                color="primary" 
                size="small" 
                variant="outlined" 
              />
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Chip 
            label={event.section} 
            size="small" 
            color="secondary" 
            variant="outlined" 
          />
          <Chip 
            label={event.gender === 'male' ? 'Boys' : 
                   event.gender === 'female' ? 'Girls' : 'Mixed'} 
            size="small" 
            color={event.gender === 'male' ? 'primary' : 
                   event.gender === 'female' ? 'error' : 'success'}
            variant="outlined"
          />
          <Chip 
            label={event.eventType === 'single' ? 'Individual' : 'Group'} 
            size="small" 
            color="default" 
            variant="outlined"
          />
          {/* <Chip 
            label={event.stage || 'Unknown Stage'} 
            size="small" 
            color={event.stage === 'On Stage' ? 'primary' : 'secondary'} 
            variant="outlined"
          /> */}
        </Box>
      </Paper>
    </Grid>
  );
})}
              </Grid>
            )}
          </Box>

          {/* Participants Scoring Section */}
          {selectedEvent && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Event Scoring Details
                </Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshCw size={18} />}
                    onClick={fetchEventParticipants}
                    disabled={!selectedEvent}
                    sx={{ mr: 1 }}
                  >
                    Refresh Participants
                  </Button>
                </Box>
              </Box>

              {/* Max Marks Setting */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Marks"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
              
              {/* Explanation of Grading System */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(37, 99, 235, 0.05)' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Grading and Points System (Auto-calculated)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Grade Criteria (% of Max Marks):</strong>
                    </Typography>
                    <Typography variant="body2">• A: 80%+ (10 points)</Typography>
                    <Typography variant="body2">• B: 60-79% (5 points)</Typography>
                    <Typography variant="body2">• C: 40-59% (3 points)</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Individual Event Position Points:</strong>
                    </Typography>
                    <Typography variant="body2">• 1st: 5 points</Typography>
                    <Typography variant="body2">• 2nd: 3 points</Typography>
                    <Typography variant="body2">• 3rd: 1 point</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Group Event Position Points:</strong>
                    </Typography>
                    <Typography variant="body2">• 1st: 10 points</Typography>
                    <Typography variant="body2">• 2nd: 5 points</Typography>
                    <Typography variant="body2">• 3rd: 3 points</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Participants Scoring Table */}
              <Paper variant="outlined" sx={{ mb: 3 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>No.</TableCell>
                        {eventParticipants.length > 0 && eventParticipants[0].participantType === 'Group' ? (
                          // Headers for Group Events
                          <>
                            <TableCell>Parish</TableCell>
                            <TableCell>Registration Number</TableCell>
                            <TableCell>Total Marks</TableCell>
                            <TableCell>Grade</TableCell>
                            <TableCell>Position</TableCell>
                            <TableCell>Points</TableCell>
                          </>
                        ) : (
                          // Headers for Individual Events
                          <>
                            <TableCell>Participant Name</TableCell>
                            <TableCell>Registration Number</TableCell>
                            <TableCell>Parish</TableCell>
                            <TableCell>Class</TableCell>
                            <TableCell>Total Marks</TableCell>
                            <TableCell>Grade</TableCell>
                            <TableCell>Position</TableCell>
                            <TableCell>Points</TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {eventParticipants.map((participant, participantIndex) => (
                        <TableRow key={participant._id}>
                          <TableCell>{participantIndex + 1}</TableCell>
                          
                          {participant.participantType === 'Group' ? (
                            // Group Event Row Cells
                            <>
                              <TableCell>
                                <Chip 
                                  label={participant.parish} 
                                  size="small" 
                                  color="secondary" 
                                  variant="outlined" 
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {participant.registrationNumber || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  size="small"
                                  variant="outlined"
                                  inputProps={{
                                    min: 0,
                                    max: maxMarks
                                  }}
                                  value={participant.totalMarks}
                                  onChange={(e) => updateTotalMarks(
                                    participantIndex, 
                                    e.target.value
                                  )}
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {participant.grade || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {participant.position ? `${participant.position}${participant.position === '1' ? 'st' : participant.position === '2' ? 'nd' : 'rd'}` : '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {participant.totalPoints || 0}
                                </Typography>
                              </TableCell>
                            </>
                          ) : (
                            // Individual Event Row Cells
                            <>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {participant.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {participant.registrationNumber}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={participant.parish} 
                                  size="small" 
                                  color="secondary" 
                                  variant="outlined" 
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {participant.standard}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  size="small"
                                  variant="outlined"
                                  inputProps={{
                                    min: 0,
                                    max: maxMarks
                                  }}
                                  value={participant.totalMarks}
                                  onChange={(e) => updateTotalMarks(
                                    participantIndex, 
                                    e.target.value
                                  )}
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {participant.grade || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {participant.position ? `${participant.position}${participant.position === '1' ? 'st' : participant.position === '2' ? 'nd' : 'rd'}` : '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {participant.totalPoints || 0}
                                </Typography>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Save Scoring Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Save size={18} />}
                  onClick={saveScoring}
                                      disabled={
                    !selectedForane || 
                    !selectedEvent || 
                    !selectedSection || 
                    eventParticipants.length === 0
                  }
                >
                  Save Scoring
                </Button>
              </Box>
            </>
          )}

          {/* Filter Drawer */}
          <Drawer
            anchor="right"
            open={isFilterDrawerOpen}
            onClose={() => setIsFilterDrawerOpen(false)}
          >
            <Box sx={{ width: 300, p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Event Filters
              </Typography>

              {/* Section Filter */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  label="Section"
                >
                  <MenuItem value="">
                    <em>All Sections</em>
                  </MenuItem>
                  {availableSections.map((section) => (
                    <MenuItem key={section} value={section}>
                      {section}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Stage Filter */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Stage</InputLabel>
                <Select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  label="Stage"
                >
                  <MenuItem value="">
                    <em>All Stages</em>
                  </MenuItem>
                  {availableStages.map((stage) => (
                    <MenuItem key={stage} value={stage}>
                      {stage}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Filter Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={resetFilters}
                >
                  Clear Filters
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => setIsFilterDrawerOpen(false)}
                >
                  Apply
                </Button>
              </Box>
            </Box>
          </Drawer>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default EventScoringPage;
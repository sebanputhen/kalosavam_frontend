import React, { useState, useEffect } from 'react';
import axiosInstance from "../axiosConfig";
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid, 
  Paper, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  Divider,
  Chip,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Badge
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Pencil, Trash2, Plus, RefreshCw, FileDown, Info, ChevronDown, User, Users } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

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
    },
    info: {
      main: '#6366F1',
      light: '#818CF8',
      dark: '#4F46E5'
    }
  }
});

// Section configuration with class ranges
const SECTION_CONFIG = {
  'Dominic Savio': { classes: ['IV', 'V', 'VI'], label: 'Classes IV-VI' },
  'Alphonsa': { classes: ['VII', 'VIII', 'IX'], label: 'Classes VII-IX' },
  'Saint Thomas': { classes: ['X', 'XI', 'XII'], label: 'Classes X-XII' }
};
const SECTION_REGNO_START = {
  'Dominic Savio': 301,
  'Alphonsa': 501,
  'Saint Thomas': 701
};

const EventRegistration = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [selectedParish, setSelectedParish] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [singleEvents, setSingleEvents] = useState([]);
  const [groupEvents, setGroupEvents] = useState([]);
  const [message, setMessage] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [eventParticipantCounts, setEventParticipantCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  
  // Add new filters state
  const [sectionFilter, setSectionFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [crossSectionFilter, setCrossSectionFilter] = useState('all');
  const [sectionInDialog, setSectionInDialog] = useState('');
  const [availableClasses, setAvailableClasses] = useState(['IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']);
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
  const [summarySection, setSummarySection] = useState('');
  const [eventNameFilter, setEventNameFilter] = useState('');
  const [uniqueEventNames, setUniqueEventNames] = useState([]);
  const [foraneRegNos, setForaneRegNos] = useState({
    'Dominic Savio': 301,
    'Alphonsa': 501,
    'Saint Thomas': 701
  });
  // New state for tracking cross-section selections
  const [crossSectionSelections, setCrossSectionSelections] = useState({});
  
  useEffect(() => {
    const allEventNames = participants.flatMap(p => 
      p.events.map(e => e.eventName)
    );
    const unique = [...new Set(allEventNames)].sort();
    setUniqueEventNames(unique);
  }, [participants]);

  // Add handler functions for the summary dialog
  const handleOpenSummaryDialog = (section = '') => {
    setSummarySection(section);
    setOpenSummaryDialog(true);
  };

  const handleCloseSummaryDialog = () => {
    setOpenSummaryDialog(false);
  };
  const [participantForm, setParticipantForm] = useState({
    name: '',
    standard: '',
    gender: '',
    dob: '',
    parish: ''
  });
  const fetchForaneRegistrationNumbers = async () => {
    try {
      // Get the forane of the selected parish
      const parishResponse = await axiosInstance.get(`/parish/${selectedParish}`);
      const foraneId = parishResponse.data.forane._id;
  
      // Fetch the highest registration numbers for this forane
      const response = await axiosInstance.get(`/forane/${foraneId}/registration-numbers`);
      const regNumbers = response.data.data || {};
      
      // Update state with current highest numbers or use defaults
      setForaneRegNos({
        'Dominic Savio': Math.max(regNumbers['Dominic Savio'] || 0, 301),
        'Alphonsa': Math.max(regNumbers['Alphonsa'] || 0, 501),
        'Saint Thomas': Math.max(regNumbers['Saint Thomas'] || 0, 701)
      });
      
    } catch (err) {
      console.error("Failed to fetch forane registration numbers", err);
      // Keep using the default numbers if fetch fails
    }
  };
  // Add this useEffect to manage available classes based on selected section
  // Separate effect for setting available classes
useEffect(() => {
  if (sectionInDialog) {
    setAvailableClasses(SECTION_CONFIG[sectionInDialog]?.classes || []);
  } else {
    setAvailableClasses(['IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']);
  }
}, [sectionInDialog]);

// Separate effect for clearing participant's standard if needed
useEffect(() => {
  if (sectionInDialog && participantForm.standard) {
    const classes = SECTION_CONFIG[sectionInDialog]?.classes || [];
    if (!classes.includes(participantForm.standard)) {
      setParticipantForm(prev => ({
        ...prev,
        standard: ''
      }));
    }
  }
}, [sectionInDialog, participantForm.standard]);
  
  // Helper function to compare arrays
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  };
  
  // Personal details form

  
  useEffect(() => {
    fetchCategories();
    fetchParishes();
    fetchAllEvents();
  }, []);

  useEffect(() => {
    if (selectedParish) {
      fetchParticipantsByParish();
      fetchEventParticipantCounts();
      fetchForaneRegistrationNumbers();
    } else {
      setParticipants([]);
    }
  }, [selectedParish]);

  useEffect(() => {
    if (events.length > 0) {
      // Calculate derived state once
      const enrichedEvents = events.map(event => ({
        ...event,
        allowCrossSectionParticipation: event.allowCrossSectionParticipation || false,
        crossSectionAllowedSections: event.crossSectionAllowedSections || [],
        crossSectionMaxParticipants: event.crossSectionMaxParticipants || 0
      }));
      
      // Only update if there's a real difference to avoid loops
      // Set all derived states in one effect to minimize re-renders
      const singles = enrichedEvents.filter(event => event.eventType === 'single');
      const groups = enrichedEvents.filter(event => event.eventType === 'group');
      
      setSingleEvents(singles);
      setGroupEvents(groups);
      
      // Be careful with this - if you update the source state,
      // make sure it won't create an infinite loop
      // Consider using a different state name like "processedEvents"
      // instead of updating "events"
    }
  }, [events]);

  // Enhanced filtering useEffect with cross-section support
  useEffect(() => {
    // Start with all participants
    let filtered = participants;
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(participant => {
        // Search in name
        if (participant.name.toLowerCase().includes(query)) return true;
        
        // Search in class/standard
        if (participant.standard.toLowerCase().includes(query)) return true;
        
        // Search in section
        const section = getParticipantSection(participant.standard) || '';
        if (section.toLowerCase().includes(query)) return true;
        
        // Search in event names
        if (participant.events.some(event => 
          event.eventName.toLowerCase().includes(query)
        )) return true;
        
        // No match found
        return false;
      });
    }
    
    // Apply section filter
    if (sectionFilter !== 'all') {
      filtered = filtered.filter(participant => {
        const participantSection = getParticipantSection(participant.standard);
        return participantSection === sectionFilter;
      });
    }
    
    // Apply event type filter
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(participant => {
        // Check if participant has at least one event of the selected type
        return participant.events.some(event => event.eventType === eventTypeFilter);
      });
    }
    
    // Apply cross-section filter
    if (crossSectionFilter !== 'all') {
      filtered = filtered.filter(participant => {
        if (crossSectionFilter === 'home') {
          // Only show participants with home section events
          return participant.events.some(event => !event.isCrossSectionParticipation);
        } else if (crossSectionFilter === 'cross') {
          // Only show participants with cross-section events
          return participant.events.some(event => event.isCrossSectionParticipation);
        }
        return true;
      });
    }
    
    // Apply event name filter
    if (eventNameFilter) {
      filtered = filtered.filter(participant => {
        // Check if participant is registered for the selected event
        return participant.events.some(event => 
          event.eventName === eventNameFilter
        );
      });
    }
    
    setFilteredParticipants(filtered);
  }, [participants, searchQuery, sectionFilter, eventTypeFilter, crossSectionFilter, eventNameFilter]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/categories");
      setCategories(response.data.data.categories || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch Categories");
      setIsLoading(false);
    }
  };
  
  const EventParticipationSummary = ({ section = '' }) => {
    // If a specific section is selected, only show that section
    const sectionsToShow = section ? 
      [[section, SECTION_CONFIG[section]]] : 
      Object.entries(SECTION_CONFIG);
    
    return (
      <>
        {sectionsToShow.map(([sectionName, config]) => {
          // Get events where this is the home section
          const homeSectionEvents = events.filter(e => e.section === sectionName);
          
          // Get events where this section can participate as cross-section
          const crossSectionEvents = events.filter(e => 
            e.section !== sectionName && 
            e.allowCrossSectionParticipation && 
            e.crossSectionAllowedSections && 
            e.crossSectionAllowedSections.includes(sectionName)
          );
          
          if (homeSectionEvents.length === 0 && crossSectionEvents.length === 0) return null;
          
          return (
            <Box key={sectionName} sx={{ mb: section ? 0 : 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="600">
                {sectionName} Section ({config.label})
              </Typography>
              
              {homeSectionEvents.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Home Section Events
                  </Typography>
                  <TableContainer sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Event Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Gender</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Participants</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {homeSectionEvents.map(event => {
                          const participantCount = eventParticipantCounts[event._id] || 0;
                          
                          return (
                            <TableRow key={event._id}>
                              <TableCell>{event.eventName}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={event.eventType === 'single' ? 'Individual' : 'Group'}
                                  color={event.eventType === 'single' ? 'primary' : 'secondary'}
                                />
                              </TableCell>
                              <TableCell>
                                {event.gender === 'male' ? 'Boys Only' : 
                                event.gender === 'female' ? 'Girls Only' : 
                                'Boys & Girls'}
                              </TableCell>
                              <TableCell>{event.category?.name || '-'}</TableCell>
                              <TableCell align="right">
                                <Badge 
                                  badgeContent={participantCount} 
                                  color={event.eventType === 'single' ? 'primary' : 'secondary'}
                                  showZero
                                >
                                  {event.eventType === 'single' ? 
                                    <User size={18} /> : 
                                    <Users size={18} />}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
              
              {crossSectionEvents.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Cross-Section Participation
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Event Name</TableCell>
                          <TableCell>Home Section</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Gender</TableCell>
                          <TableCell align="right">Participants</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {crossSectionEvents.map(event => {
                          const participantCount = eventParticipantCounts[`${event._id}_cross`] || 0;
                          
                          return (
                            <TableRow key={`cross_${event._id}`}>
                              <TableCell>{event.eventName}</TableCell>
                              <TableCell>{event.section}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={event.eventType === 'single' ? 'Individual' : 'Group'}
                                  color={event.eventType === 'single' ? 'primary' : 'secondary'}
                                />
                              </TableCell>
                              <TableCell>
                                {event.gender === 'male' ? 'Boys Only' : 
                                event.gender === 'female' ? 'Girls Only' : 
                                'Boys & Girls'}
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                  <Typography variant="caption" sx={{ mr: 1 }}>
                                    {participantCount}/{event.crossSectionMaxParticipants}
                                  </Typography>
                                  <Badge 
                                    badgeContent={participantCount} 
                                    color="info"
                                    showZero
                                  >
                                    {event.eventType === 'single' ? 
                                      <User size={18} /> : 
                                      <Users size={18} />}
                                  </Badge>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          );
        })}
      </>
    );
  };
  
  const fetchAllEvents = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/events");
      setEvents(response.data.data.events || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch Events");
      setIsLoading(false);
    }
  };

  const fetchParishes = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/parish");
      setParishes(response.data || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch Parishes");
      setIsLoading(false);
    }
  };

  const fetchEventParticipantCounts = async () => {
    try {
      if (!selectedParish) return;
      
      setIsLoading(true);
      console.log(selectedParish);
      // Get regular participant counts
      const response = await axiosInstance.get(`/api/event-stats/parish/${selectedParish}`);
      console.log(response);
      const stats = response.data.data.stats || [];
      
      // Convert array to object with event IDs as keys
      const countsMap = {};
      
      // Add regular counts
      stats.forEach(stat => {
        countsMap[stat.eventId] = stat.participantCount;
      });
      
      try {
        // Get cross-section participant counts
        const crossSectionResponse = await axiosInstance.get(`/api/event-stats/parish/${selectedParish}/cross-section`);
        const crossSectionStats = crossSectionResponse.data.data.stats || [];
        
        // Add cross-section counts with special key
        crossSectionStats.forEach(stat => {
          countsMap[`${stat.eventId}_cross`] = stat.participantCount;
        });
      } catch (crossSectionError) {
        console.error("Failed to fetch cross-section stats, this feature may not be implemented yet:", crossSectionError);
        // Just continue with regular stats if cross-section endpoint isn't available
      }
      
      setEventParticipantCounts(countsMap);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch event participant counts", err);
      setIsLoading(false);
    }
  };

  const fetchParticipantsByParish = async () => {
    try {
      setIsLoading(true);
      
      // First, get the parish details to access forane
      const parishResponse = await axiosInstance.get(`/parish/${selectedParish}`);
      const parishDetails = parishResponse.data;
      const foraneShortCode = parishDetails.forane?.shortCode || 'UNK'; // Use forane shortcode
      
      // Then get registrations
      const response = await axiosInstance.get(`/registrations/parish/${selectedParish}`);
      
      const registrations = response.data.data.registrations || [];
      const groupedParticipants = {};
      const participantRegNos = {};
      
      // First pass: generate registration numbers for individual events
      registrations.forEach(reg => {
        const participantSection = getParticipantSection(reg.standard);
        
        // Create a unique participant key using all identity fields
        const participantKey = `${reg.name}|${reg.standard}|${reg.gender}|${new Date(reg.dob).toISOString().split('T')[0]}`;
        
        // Only generate registration number for individual events
        if (reg.event.eventType === 'single') {
          if (!participantRegNos[participantKey]) {
            // Use the existing registration number if it exists
            if (reg.registrationNumber) {
              participantRegNos[participantKey] = reg.registrationNumber;
            } else {
              // Otherwise use section ranges
              const sectionAbbr = participantSection ? participantSection.slice(0,3).toUpperCase() : 'UNK';
              const sectionStart = foraneRegNos[participantSection] || SECTION_REGNO_START[participantSection];
              
              // Find the next available number
              let regNo = sectionStart;
              while (Object.values(participantRegNos).some(no => 
                no === `${foraneShortCode}-${sectionAbbr}-${regNo}`)) {
                regNo++;
              }
              
              participantRegNos[participantKey] = `${foraneShortCode}-${sectionAbbr}-${regNo}`;
            }
          }
        }
      });
      
      // Second pass: group registrations
      registrations.forEach(reg => {
        const participantSection = getParticipantSection(reg.standard);
        const sectionAbbr = participantSection ? participantSection.slice(0,3).toUpperCase() : 'UNK';
        
        // Create the same unique participant key
        const participantKey = `${reg.name}|${reg.standard}|${reg.gender}|${new Date(reg.dob).toISOString().split('T')[0]}`;
        
        if (!groupedParticipants[participantKey]) {
          groupedParticipants[participantKey] = {
            _id: reg._id,
            name: reg.name,
            standard: reg.standard,
            gender: reg.gender,
            dob: reg.dob,
            parish: selectedParish, // Add the parish ID
            // Use the existing reg number or the one we generated
            registrationNumber: reg.registrationNumber || 
              (reg.event.eventType === 'single' ? participantRegNos[participantKey] : null),
            events: []
          };
        }
        
        groupedParticipants[participantKey].events.push({
          eventId: reg.event._id,
          eventName: reg.event.eventName,
          eventType: reg.event.eventType,
          section: reg.event.section,
          category: reg.event.category?.name || '',
          registrationId: reg._id,
          isCrossSectionParticipation: reg.isCrossSectionParticipation || false,
          // For group events, use a forane-level registration number
          registrationNumber: reg.event.eventType === 'group' 
            ? `${foraneShortCode}-${reg.event._id.slice(-4)}` 
            : null
        });
      });
      
      // Convert object to array
      const participantsArray = Object.values(groupedParticipants);
      setParticipants(participantsArray);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch Participants", err);
      setIsLoading(false);
      setMessage("Error loading participants");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setParticipantForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Determine which section the participant belongs to based on their class/standard
  const getParticipantSection = (standard) => {
    if (!standard) return null;
    
    for (const [section, config] of Object.entries(SECTION_CONFIG)) {
      if (config.classes.includes(standard)) {
        return section;
      }
    }
    
    return null;
  };

  const handleEventToggle = (eventId, isCrossSection = false) => {
    // Create a unique key that includes the cross-section status
    const eventKey = isCrossSection ? `${eventId}|cross` : eventId;
    
    setSelectedEvents(prev => {
      // Check if this specific event (with cross-section status) is already selected
      const isSelected = prev.includes(eventKey);
      
      // If already selected, remove it
      if (isSelected) {
        return prev.filter(id => id !== eventKey);
      }
      
      // Find the event
      const event = events.find(e => e._id === eventId);
      if (!event) return prev;
      
      if (event.eventType === 'single') {
        // Count existing single events (both regular and cross-section)
        const currentSingleEvents = prev.filter(id => {
          const [selectedId] = id.toString().split('|');
          return events.find(e => e._id === selectedId)?.eventType === 'single';
        });
        
        if (currentSingleEvents.length >= 2) {
          // Already have 2 single events, show message
          setMessage("You can only select up to 2 individual events");
          return prev;
        }
      } else {
        // For group events, remove any existing group event (both regular and cross-section)
        const withoutGroupEvents = prev.filter(id => {
          const [selectedId] = id.toString().split('|');
          return events.find(e => e._id === selectedId)?.eventType !== 'group';
        });
        return [...withoutGroupEvents, eventKey];
      }
      
      // Add the new event
      return [...prev, eventKey];
    });
    
    // Track cross-section selection for this event
    setCrossSectionSelections(prev => ({
      ...prev,
      [eventId]: isCrossSection
    }));
  };
  
  const handleSectionChange = (event) => {
    setSectionInDialog(event.target.value);
  };
  
  const handleOpenDialog = (participant = null) => {
    if (participant) {
      // Pre-fill with existing participant data for adding more events
      setParticipantForm({
        name: participant.name,
        standard: participant.standard,
        gender: participant.gender,
        dob: participant.dob ? new Date(participant.dob).toISOString().split('T')[0] : '',
        parish: selectedParish
      });
      
      // Pre-select the section based on the participant's standard
      setSectionInDialog(getParticipantSection(participant.standard) || '');
      
      // Pre-select any existing events and track cross-section status
      const eventSelections = [];
      const crossSectionMap = {};
      
      participant.events.forEach(event => {
        // Create the event key with cross-section status
        const eventKey = event.isCrossSectionParticipation ? `${event.eventId}|cross` : event.eventId;
        eventSelections.push(eventKey);
        
        // Track cross-section status for this event
        crossSectionMap[event.eventId] = event.isCrossSectionParticipation;
      });
      
      setSelectedEvents(eventSelections);
      setCrossSectionSelections(crossSectionMap);
    } else {
      // New participant
      setParticipantForm({
        name: '',
        standard: '',
        gender: '',
        dob: '',
        parish: selectedParish
      });
      setSectionInDialog(''); // Reset section selection
      setSelectedEvents([]);
      setCrossSectionSelections({});
    }
    
    setActiveStep(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setMessage('');
  };

  const handleNext = () => {
    // Validate current step
    if (activeStep === 0) {
      // Validate personal details
      if (!participantForm.name || !participantForm.standard || !participantForm.gender || !participantForm.dob) {
        setMessage("Please fill all required personal details");
        return;
      }
      
      // Validate section selection
      if (!sectionInDialog) {
        setMessage("Please select a section");
        return;
      }
      
      // Validate section assignment based on class
      const participantSection = getParticipantSection(participantForm.standard);
      if (!participantSection) {
        setMessage(`Invalid class selection. Please select a class in range: ${Object.values(SECTION_CONFIG).map(config => config.classes.join(', ')).join(' or ')}`);
        return;
      }
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  const generateParticipantRegistrationNumber = async (
    participants, 
    participantName, 
    participantSection, 
    foraneId,
    foraneShortCode
  ) => {
    try {
      // First, check if the participant already has a registration number
      const existingParticipant = participants.find(p => p.name === participantName);
      if (existingParticipant && existingParticipant.registrationNumber) {
        return existingParticipant.registrationNumber;
      }
  
      // Define section abbreviation and start number based on section
      const sectionAbbr = participantSection ? participantSection.slice(0,3).toUpperCase() : 'UNK';
      
      // Fetch the current highest registration number for this forane
      const response = await axiosInstance.get(`/forane/${foraneId}/registration-numbers`);
      const currentRegNumbers = response.data.data.stats || {}; // CHANGED: Use stats object
      
      // Determine the next number for this section
      let nextNumber = currentRegNumbers[participantSection] 
        ? currentRegNumbers[participantSection] + 1 
        : SECTION_REGNO_START[participantSection];
  
      // Format: ForaneShortCode-SectionAbbr-SequentialNumber
      const regNumber = `${foraneShortCode}-${sectionAbbr}-${nextNumber}`;
  
      // Update the registration number on the backend
      await axiosInstance.put(`/forane/${foraneId}/registration-numbers`, {
        section: participantSection,
        nextNumber: nextNumber
      });
  
      return regNumber;
    } catch (error) {
      console.error("Error generating registration number:", error);
      
      // Define fallback variables
      const sectionAbbr = participantSection ? participantSection.slice(0,3).toUpperCase() : 'UNK';
      const sectionStart = SECTION_REGNO_START[participantSection] || 301;
      
      // Fallback to a default numbering if backend update fails
      return `${foraneId}-${sectionAbbr}-${sectionStart}`;
    }
  };
  
  const generateGroupRegistrationNumber = async (event, foraneId, foraneShortCode) => {
    try {
      // Fetch the current highest group event registration number for this forane
      const response = await axiosInstance.get(`/forane/${foraneId}/group-registration-numbers`);
      const currentGroupRegNumber = response.data.data || 1001;
  
      // Generate group registration number
      const regNumber = `${foraneShortCode}-GRP-${currentGroupRegNumber}`;
  
      // Update the group registration number on the backend
      await axiosInstance.put(`/forane/${foraneId}/group-registration-numbers`, {
        nextNumber: currentGroupRegNumber + 1
      });
  
      return regNumber;
    } catch (error) {
      // Fallback generation
      return `${foraneShortCode}-GRP-1`;
    }
  };
  const handleSubmitRegistrations = async () => {
    try {
      // Set loading state
      setIsLoading(true);
      setMessage('');
  
      // Get parish and forane details
      const parishResponse = await axiosInstance.get(`/parish/${selectedParish}`);
      const parishDetails = parishResponse.data;
      const foraneId = parishDetails.forane._id;
      const foraneShortCode = parishDetails.forane?.shortCode || 'UNK';
  
      // Determine participant's section
      const participantSection = getParticipantSection(participantForm.standard);
  
      // Find existing participant if editing
      const existingParticipant = participants.find(
        p => p.name === participantForm.name && 
             p.standard === participantForm.standard
      );
  
      // Get existing event IDs to prevent duplicate registrations
      const existingEventIds = existingParticipant 
        ? existingParticipant.events.map(event => event.eventId) 
        : [];
  
      // Track group events to ensure unique registration
      const groupEventsToRegister = [];
  
      // Prepare registration promises
      const registrationPromises = await Promise.all(
        selectedEvents
          .filter(eventKey => {
            const [eventId] = eventKey.toString().split('|');
            return !existingEventIds.includes(eventId);
          })
          .map(async (eventKey) => {
            const [eventId, crossSectionFlag] = eventKey.toString().split('|');
            const isCrossSection = crossSectionFlag === 'cross';
            const event = events.find(e => e._id === eventId);
  
            // Generate registration number based on event type
            const regNumber = event.eventType === 'single'
              ? await generateParticipantRegistrationNumber(
                  participants, 
                  participantForm.name, 
                  participantSection, 
                  foraneId,
                  foraneShortCode
                )
              : await generateGroupRegistrationNumber(
                  event, 
                  foraneId, 
                  foraneShortCode
                );
  
            // Track group events to ensure unique registration
            if (event.eventType === 'group') {
              groupEventsToRegister.push({
                eventId,
                registrationNumber: regNumber
              });
            }
  
            // Prepare registration data
            const registrationData = {
              ...participantForm,
              dob: new Date(participantForm.dob).toISOString(),
              event: eventId,
              parish: selectedParish,
              isCrossSectionParticipation: isCrossSection,
              registrationNumber: regNumber
            };
  
            return axiosInstance.post("/registrations", registrationData);
          })
      );
  
      // Check if any new events to register
      if (registrationPromises.length === 0) {
        setMessage("No new events to register. This participant is already registered for the selected events.");
        setIsLoading(false);
        handleCloseDialog();
        return;
      }
  
      // Submit registrations
      const registrationResults = await Promise.allSettled(registrationPromises);
  
      // Process registration results
      const successfulRegistrations = [];
      const failedRegistrations = [];
  
      registrationResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulRegistrations.push(result.value.data.data.registration);
        } else {
          const eventKey = selectedEvents[index];
          const [eventId] = eventKey.toString().split('|');
          const event = events.find(e => e._id === eventId);
          
          failedRegistrations.push({
            eventName: event.eventName,
            error: result.reason.response?.data?.message || 'Unknown error'
          });
        }
      });
  
      // Prepare success/error message
      if (successfulRegistrations.length > 0) {
        const successMessage = `Successfully registered ${participantForm.name} for ${successfulRegistrations.length} event(s)`;
        setMessage(successMessage);
      }
  
      // Handle failed registrations
      if (failedRegistrations.length > 0) {
        const errorDetails = failedRegistrations
          .map(fail => `${fail.eventName}: ${fail.error}`)
          .join('\n');
        
        // Append error details to existing message or create a new error message
        setMessage(prev => 
          `${prev}\n\nFailed Registrations:\n${errorDetails}`
        );
      }
  
      // Close dialog and refresh data
      handleCloseDialog();
      fetchParticipantsByParish();
      fetchEventParticipantCounts();
      
      // Reset loading state
      setIsLoading(false);
  
    } catch (error) {
      // Catch any unexpected errors during the entire process
      console.error('Error registering participant:', error);
      
      setMessage(
        error.response?.data?.message || 
        "An unexpected error occurred while registering the participant."
      );
      setIsLoading(false);
    }
  };

  const handleDeleteRegistration = async (registrationId) => {
    if (window.confirm("Are you sure you want to delete this registration?")) {
      try {
        await axiosInstance.delete(`/registrations/${registrationId}`);
        setMessage("Registration deleted successfully");
        fetchParticipantsByParish();
        fetchEventParticipantCounts();
      } catch (error) {
        console.error("Error deleting registration:", error);
        setMessage("Error deleting registration");
      }
    }
  };

  const handleExportPDF = () => {
    if (!participants.length) return;
    
    const doc = new jsPDF();
    
    // Create data for participant-event table
    const tableData = [];
    
    participants.forEach(participant => {
      // Group events by type
      const singleEvents = participant.events.filter(e => e.eventType === 'single');
      const groupEvents = participant.events.filter(e => e.eventType === 'group');
      
      // Create event strings
      const singleEventsString = singleEvents.map(e => {
        let eventText = e.eventName;
        if (e.isCrossSectionParticipation) {
          eventText += ' (Cross)';
        }
        return eventText;
      }).join(", ");
      
      const groupEventsString = groupEvents.map(e => {
        let eventText = e.eventName;
        if (e.isCrossSectionParticipation) {
          eventText += ' (Cross)';
        }
        return eventText;
      }).join(", ");
      
      tableData.push([
        participant.registrationNumber || 'N/A',
        participant.name,
        participant.standard,
        participant.gender === 'M' ? 'Male' : 'Female',
        new Date(participant.dob).toLocaleDateString(),
        getParticipantSection(participant.standard) || 'N/A',
        singleEventsString,
        groupEventsString
      ]);
    });
    
    const tableHeaders = [
      'Reg. No.',
      'Name',
      'Class',
      'Gender',
      'Date of Birth',
      'Section',
      'Individual Events',
      'Group Events'
    ];
    
    // Get parish name for the title
    const parishName = parishes.find(p => p._id === selectedParish)?.name || 'Parish';
    
    doc.text(`Event Registrations - ${parishName}`, 14, 15);
    
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      styles: { 
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: { 
        fillColor: [66, 102, 242], 
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 30 },  // Registration Number
        1: { cellWidth: 40 },  // Name
        2: { cellWidth: 20 },  // Class
        3: { cellWidth: 25 },  // Gender
        4: { cellWidth: 30 },  // Date of Birth
        5: { cellWidth: 25 },  // Section
        6: { cellWidth: 50 },  // Individual Events
        7: { cellWidth: 50 }   // Group Events
      },
      startY: 25,
      margin: { horizontal: 10 }
    });
    
    doc.save(`${parishName}-registrations.pdf`);
  };

  // Updated to support cross-section events
  const filterEventsBySection = (events, standard) => {
    if (!events || !standard) return [];
    
    // Determine section based on standard/class
    const participantSection = getParticipantSection(standard);
    if (!participantSection) return [];
    
    // Filter events for this section
    return events.filter(event => {
      // Include events from participant's home section
      if (event.section === participantSection) return true;
      
      // Include cross-section events that allow this section
      if (event.allowCrossSectionParticipation && 
          event.crossSectionAllowedSections && 
          event.crossSectionAllowedSections.includes(participantSection)) {
        return true;
      }
      
      return false;
    });
  };

  // Updated to support cross-section events
  const filterEventsByGenderAndSection = (events, gender, standard) => {
    if (!events || !gender || !standard) return [];
    
    // First filter by section (including cross-section events)
    const sectionEvents = filterEventsBySection(events, standard);
    
    // Then filter by gender
    return sectionEvents.filter(event => {
      // Filter by gender
      return event.gender === 'common' || 
             (gender === 'M' && event.gender === 'male') || 
             (gender === 'F' && event.gender === 'female');
    });
  };

  const renderEventSelectionStep = () => {
    const participantSection = getParticipantSection(participantForm.standard);
    
    if (!participantSection) {
      return (
        <Alert severity="error">
          Invalid class selection. Please go back and select a valid class.
        </Alert>
      );
    }
    
    const eligibleSingleEvents = filterEventsByGenderAndSection(singleEvents, participantForm.gender, participantForm.standard);
    const eligibleGroupEvents = filterEventsByGenderAndSection(groupEvents, participantForm.gender, participantForm.standard);
    
    // Count already selected events by type
    const selectedSingleCount = selectedEvents.filter(id => {
      const [eventId] = id.toString().split('|');
      return events.find(e => e._id === eventId)?.eventType === 'single';
    }).length;
    
    const selectedGroupCount = selectedEvents.filter(id => {
      const [eventId] = id.toString().split('|');
      return events.find(e => e._id === eventId)?.eventType === 'group';
    }).length;
    
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          You can select up to 2 individual events and 1 group event from your section: <strong>{participantSection}</strong> ({SECTION_CONFIG[participantSection].label})
        </Alert>
        
        {eligibleSingleEvents.length === 0 && eligibleGroupEvents.length === 0 ? (
          <Alert severity="warning">
            No eligible events found for this participant in section {participantSection}.
          </Alert>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Available Events for {participantSection} Section
            </Typography>
            
            {eligibleSingleEvents.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                  Individual Events ({selectedSingleCount}/2)
                </Typography>
                <Grid container spacing={2}>
                  {eligibleSingleEvents.map(event => {
                    // Check if this is a cross-section event for the participant
                    const isCrossSectionEvent = event.section !== participantSection;
                    
                    // Create a unique key for this event that includes cross-section status
                    const eventKey = isCrossSectionEvent ? `${event._id}|cross` : event._id;
                    
                    // Check if this specific event (with cross-section status) is selected
                    const isSelected = selectedEvents.includes(eventKey);
                    
                    // Get appropriate participant count based on whether it's cross-section
                    const participantCount = isCrossSectionEvent
                      ? (eventParticipantCounts[`${event._id}_cross`] || 0)
                      : (eventParticipantCounts[event._id] || 0);
                    
                    // Get appropriate max participants based on whether it's cross-section
                    const maxParticipants = isCrossSectionEvent
                      ? event.crossSectionMaxParticipants
                      : event.maxParticipants;
                    
                    // Check if event has reached its maximum participant limit
                    const isLimitReached = participantCount >= maxParticipants;
                    
                    // Disable if already at 2 single events (and this one isn't selected)
                    // or if the event has reached its participant limit
                    const isDisabled = (selectedSingleCount >= 2 && !isSelected) || (isLimitReached && !isSelected);
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} key={`${event._id}${isCrossSectionEvent ? '-cross' : ''}`}>
                        <Paper
                          elevation={isSelected ? 3 : 1}
                          sx={{
                            p: 2,
                            border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                            borderRadius: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            bgcolor: isDisabled ? 'rgba(0, 0, 0, 0.04)' : 
                                    isSelected ? 'rgba(37, 99, 235, 0.05)' : 'white',
                            opacity: isDisabled ? 0.7 : 1
                          }}
                        >
                          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <Badge 
                              badgeContent={participantCount} 
                              color={isCrossSectionEvent ? "info" : "primary"}
                              max={99}
                              overlap="circular"
                            >
                              <User size={18} />
                            </Badge>
                          </Box>
                          
                          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                            {event.eventName}
                          </Typography>
                          
                          <Box sx={{ mb: 1 }}>
                            <Chip 
                              size="small" 
                              label={event.gender === 'male' ? 'Boys Only' : 
                                     event.gender === 'female' ? 'Girls Only' : 
                                     'Boys & Girls'}
                              color={event.gender === 'male' ? 'primary' : 
                                     event.gender === 'female' ? 'secondary' : 
                                     'default'}
                              sx={{ mr: 0.5 }}
                            />
                            <Chip 
                              size="small" 
                              label={isLimitReached && !isSelected ? 'Full' : `${participantCount}/${maxParticipants}`}
                              variant="outlined"
                              color={isLimitReached && !isSelected ? 'error' : 'default'}
                            />
                            {isCrossSectionEvent && (
                              <Chip 
                                size="small" 
                                label="Cross-Section"
                                color="info"
                                sx={{ ml: 0.5 }}
                              />
                            )}
                          </Box>
                          
                          {event.category && (
                            <Typography variant="caption" color="textSecondary">
                              Category: {event.category.name}
                            </Typography>
                          )}
                          
                          {isCrossSectionEvent && (
                            <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 1 }}>
                              Home Section: {event.section}
                            </Typography>
                          )}
                          
                          <Box sx={{ flexGrow: 1 }} />
                          
                          {isLimitReached && !isSelected ? (
                            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                              Maximum participants limit reached
                            </Typography>
                          ) : (
                            <FormControlLabel
                              control={
                                <Checkbox 
                                  checked={isSelected}
                                  onChange={() => handleEventToggle(event._id, isCrossSectionEvent)}
                                  disabled={isDisabled}
                                />
                              }
                              label="Select"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
            
            {eligibleGroupEvents.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                  Group Events ({selectedGroupCount}/1)
                </Typography>
                <Grid container spacing={2}>
                  {eligibleGroupEvents.map(event => {
                    // Check if this is a cross-section event for the participant
                    const isCrossSectionEvent = event.section !== participantSection;
                    
                    // Create a unique key for this event that includes cross-section status
                    const eventKey = isCrossSectionEvent ? `${event._id}|cross` : event._id;
                    
                    // Check if this specific event (with cross-section status) is selected
                    const isSelected = selectedEvents.includes(eventKey);
                    
                    // Get appropriate participant count based on whether it's cross-section
                    const participantCount = isCrossSectionEvent
                      ? (eventParticipantCounts[`${event._id}_cross`] || 0)
                      : (eventParticipantCounts[event._id] || 0);
                    
                    // Get appropriate max participants based on whether it's cross-section
                    const maxParticipants = isCrossSectionEvent
                      ? event.crossSectionMaxParticipants
                      : event.maxParticipants;
                    
                    // Check if event has reached its maximum participant limit
                    const isLimitReached = participantCount >= maxParticipants;
                    
                    // Disable if already selected a group event (and this one isn't selected)
                    // or if the event has reached its participant limit
                    const isDisabled = (selectedGroupCount >= 1 && !isSelected) || (isLimitReached && !isSelected);
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} key={`${event._id}${isCrossSectionEvent ? '-cross' : ''}`}>
                        <Paper
                          elevation={isSelected ? 3 : 1}
                          sx={{
                            p: 2,
                            border: isSelected ? `2px solid ${theme.palette.secondary.main}` : '1px solid #e0e0e0',
                            borderRadius: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            bgcolor: isDisabled ? 'rgba(0, 0, 0, 0.04)' : 
                                    isSelected ? 'rgba(16, 185, 129, 0.05)' : 'white',
                            opacity: isDisabled ? 0.7 : 1
                          }}
                        >
                          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <Badge 
                              badgeContent={participantCount} 
                              color={isCrossSectionEvent ? "info" : "secondary"}
                              max={99}
                              overlap="circular"
                            >
                              <Users size={18} />
                            </Badge>
                          </Box>
                          
                          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                            {event.eventName}
                          </Typography>
                          
                          <Box sx={{ mb: 1 }}>
                            <Chip 
                              size="small" 
                              label={event.gender === 'male' ? 'Boys Only' : 
                                     event.gender === 'female' ? 'Girls Only' : 
                                     'Boys & Girls'}
                              color={event.gender === 'male' ? 'primary' : 
                                     event.gender === 'female' ? 'secondary' : 
                                     'default'}
                              sx={{ mr: 0.5 }}
                            />
                            <Chip 
                              size="small" 
                              label={isLimitReached && !isSelected ? 'Full' : `${participantCount}/${maxParticipants}`}
                              variant="outlined"
                              color={isLimitReached && !isSelected ? 'error' : 'default'}
                            />
                            {isCrossSectionEvent && (
                              <Chip 
                                size="small" 
                                label="Cross-Section"
                                color="info"
                                sx={{ ml: 0.5 }}
                              />
                            )}
                          </Box>
                          
                          {event.category && (
                            <Typography variant="caption" color="textSecondary">
                              Category: {event.category.name}
                            </Typography>
                          )}
                          
                          {isCrossSectionEvent && (
                            <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 1 }}>
                              Home Section: {event.section}
                            </Typography>
                          )}
                          
                          <Box sx={{ flexGrow: 1 }} />
                          
                          {isLimitReached && !isSelected ? (
                            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                              Maximum participants limit reached
                            </Typography>
                          ) : (
                            <FormControlLabel
                              control={
                                <Checkbox 
                                  checked={isSelected}
                                  onChange={() => handleEventToggle(event._id, isCrossSectionEvent)}
                                  disabled={isDisabled}
                                />
                              }
                              label="Select"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
          </>
        )}
      </Box>
    );
  };

  // Update selected events summary to show cross-section status
  const renderSelectedEventsSummary = () => {
    if (selectedEvents.length === 0) {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No events selected. Please go back and select at least one event.
        </Alert>
      );
    }
    
    const selectedEventDetails = selectedEvents.map(eventKey => {
      // Parse the event key to get the ID and cross-section status
      const [eventId, crossSectionFlag] = eventKey.toString().split('|');
      const isCrossSection = crossSectionFlag === 'cross';
      
      // Find the event data
      const event = events.find(e => e._id === eventId);
      
      if (!event) return null;
      
      return {
        ...event,
        isCrossSection
      };
    }).filter(Boolean);
    
    const singleEventsSelected = selectedEventDetails.filter(e => e.eventType === 'single');
    const groupEventsSelected = selectedEventDetails.filter(e => e.eventType === 'group');
    
    // Generate registration number for display
    const participantSection = getParticipantSection(participantForm.standard);
    const sectionAbbr = participantSection ? participantSection.slice(0,3).toUpperCase() : 'UNK';
    const registrationNumber = participantSection 
      ? `${sectionAbbr}-${SECTION_REGNO_START[participantSection]}` 
      : 'N/A';
    
    return (
      <Box>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            Participant Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Name:</strong> {participantForm.name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Registration Number:</strong> 
                <Chip 
                  size="small" 
                  label={registrationNumber} 
                  color="primary" 
                  variant="outlined" 
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Class:</strong> {participantForm.standard}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Gender:</strong> {participantForm.gender === 'M' ? 'Male' : 'Female'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Date of Birth:</strong> {participantForm.dob ? new Date(participantForm.dob).toLocaleDateString() : ''}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Section:</strong> {participantSection} ({SECTION_CONFIG[participantSection]?.label})
              </Typography>
            </Grid>
          </Grid>
        </Paper>
        
        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
          Selected Events ({selectedEventDetails.length})
        </Typography>
        
        {singleEventsSelected.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Individual Events ({singleEventsSelected.length}/2)
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {singleEventsSelected.map((event, index) => (
                <Box key={`${event._id}${event.isCrossSection ? '_cross' : ''}`} sx={{ 
                  mb: index < singleEventsSelected.length - 1 ? 2 : 0,
                  pb: index < singleEventsSelected.length - 1 ? 2 : 0,
                  borderBottom: index < singleEventsSelected.length - 1 ? '1px solid #eee' : 'none'
                }}>
                  <Typography variant="body2" fontWeight="500">
                    {event.eventName}
                    {event.isCrossSection && (
                      <Chip 
                        size="small" 
                        label="Cross-Section"
                        color="info"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {event.section} | {event.category?.name || 'Category'} | 
                    {event.gender === 'male' ? ' Boys Only' : 
                     event.gender === 'female' ? ' Girls Only' : 
                     ' Boys & Girls'}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        )}
        
        {groupEventsSelected.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Group Events ({groupEventsSelected.length}/1)
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {groupEventsSelected.map((event, index) => (
                <Box key={`${event._id}${event.isCrossSection ? '_cross' : ''}`} sx={{ 
                  mb: index < groupEventsSelected.length - 1 ? 2 : 0,
                  pb: index < groupEventsSelected.length - 1 ? 2 : 0,
                  borderBottom: index < groupEventsSelected.length - 1 ? '1px solid #eee' : 'none'
                }}>
                  <Typography variant="body2" fontWeight="500">
                    {event.eventName}
                    {event.isCrossSection && (
                      <Chip 
                        size="small" 
                        label="Cross-Section"
                        color="info"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {event.section} | {event.category?.name || 'Category'} | 
                    {event.gender === 'male' ? ' Boys Only' : 
                     event.gender === 'female' ? ' Girls Only' : 
                     ' Boys & Girls'}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        )}
      </Box>
    );
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0: // Personal Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={participantForm.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Section</InputLabel>
                <Select
                  value={sectionInDialog}
                  onChange={handleSectionChange}
                  label="Section"
                >
                  <MenuItem value="">
                    <em>Select Section</em>
                  </MenuItem>
                  {Object.entries(SECTION_CONFIG).map(([section, config]) => (
                    <MenuItem key={section} value={section}>
                      {section} ({config.label})
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select a section to see available classes
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={!sectionInDialog}>
                <InputLabel>Class/Standard</InputLabel>
                <Select
                  name="standard"
                  value={participantForm.standard}
                  onChange={handleInputChange}
                  label="Class/Standard"
                >
                  <MenuItem value="">
                    <em>Select</em>
                  </MenuItem>
                  {availableClasses.map((std) => (
                    <MenuItem key={std} value={std}>
                      {std}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {participantForm.standard && (
                    <>
                      Section: <strong>{getParticipantSection(participantForm.standard) || 'Not Assigned'}</strong>
                    </>
                  )}
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={participantForm.gender}
                  onChange={handleInputChange}
                  label="Gender"
                >
                  <MenuItem value="">
                    <em>Select</em>
                  </MenuItem>
                  <MenuItem value="M">Male</MenuItem>
                  <MenuItem value="F">Female</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dob"
                type="date"
                value={participantForm.dob}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>Section Assignment by Class:</Typography>
                <Typography variant="body2">• Dominic Savio: Classes IV-VI</Typography>
                <Typography variant="body2">• Alphonsa: Classes VII-IX</Typography>
                <Typography variant="body2">• Saint Thomas: Classes X-XII</Typography>
              </Alert>
            </Grid>
          </Grid>
        );
      case 1: // Event Selection
        return renderEventSelectionStep();
      case 2: // Registration Summary
        return renderSelectedEventsSummary();
      default:
        return 'Unknown step';
    }
  };

  const countEventTypes = (events) => {
    if (!events || !events.length) return { single: 0, group: 0 };

    return events.reduce((counts, event) => {
      if (event.eventType === 'single') {
        counts.single += 1;
      } else if (event.eventType === 'group') {
        counts.group += 1;
      }
      return counts;
    }, { single: 0, group: 0 });
  };

  // New components for filtering with cross-section support
  const ParticipantFilters = () => {
    return (
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Section</InputLabel>
          <Select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            label="Section"
          >
            <MenuItem value="all">All Sections</MenuItem>
            {Object.keys(SECTION_CONFIG).map((section) => (
              <MenuItem key={section} value={section}>{section}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Event Type</InputLabel>
          <Select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            label="Event Type"
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="single">Individual Events</MenuItem>
            <MenuItem value="group">Group Events</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Participation</InputLabel>
          <Select
            value={crossSectionFilter}
            onChange={(e) => setCrossSectionFilter(e.target.value)}
            label="Participation"
          >
            <MenuItem value="all">All Participations</MenuItem>
            <MenuItem value="home">Home Section Only</MenuItem>
            <MenuItem value="cross">Cross-Section Only</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Event Name</InputLabel>
          <Select
            value={eventNameFilter}
            onChange={(e) => setEventNameFilter(e.target.value)}
            label="Event Name"
          >
            <MenuItem value="">All Events</MenuItem>
            {uniqueEventNames.map((eventName) => (
              <MenuItem key={eventName} value={eventName}>{eventName}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
          <TextField
            placeholder="Search participants..."
            size="small"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, color: 'text.secondary' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </Box>
              ),
              endAdornment: searchQuery && (
                <IconButton 
                  size="small" 
                  onClick={() => setSearchQuery('')}
                  sx={{ p: 0.5 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </IconButton>
              )
            }}
            sx={{ width: 300 }}
          />
        </Box>
      </Box>
    );
  };
  // Get filter statistics including cross-section events
  const getFilterStats = () => {
    if (!filteredParticipants.length) return null;

    const totalParticipants = filteredParticipants.length;
    const withSingleEvents = filteredParticipants.filter(p => 
      p.events.some(e => e.eventType === 'single')
    ).length;
    const withGroupEvents = filteredParticipants.filter(p => 
      p.events.some(e => e.eventType === 'group')
    ).length;
    const withCrossSectionEvents = filteredParticipants.filter(p => 
      p.events.some(e => e.isCrossSectionParticipation)
    ).length;

    return (
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Chip 
          label={`${totalParticipants} Participants`} 
          color="default" 
          variant="outlined"
        />
        <Chip 
          label={`${withSingleEvents} in Individual Events`} 
          color="primary" 
          variant="outlined"
        />
        <Chip 
          label={`${withGroupEvents} in Group Events`} 
          color="secondary" 
          variant="outlined"
        />
        {withCrossSectionEvents > 0 && (
          <Chip 
            label={`${withCrossSectionEvents} in Cross-Section Events`} 
            color="info" 
            variant="outlined"
          />
        )}
      </Box>
    );
  };

  // Render function for participants table with filtering
  const renderParticipantsTable = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    } else if (participants.length > 0) {
      return (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Registered Participants
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<RefreshCw size={18} />}
              onClick={() => {
                setSearchQuery('');
                setSectionFilter('all');
                setEventTypeFilter('all');
                setEventNameFilter('');
                setCrossSectionFilter('all');
              }}
              size="small"
            >
              Reset Filters
            </Button>
          </Box>
          
          <ParticipantFilters />
          
          {getFilterStats()}
  
          {filteredParticipants.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, mb: 3 }}>
              <Typography variant="body1" color="textSecondary">
                No participants found matching your filters.
              </Typography>
              <Button 
                variant="text" 
                onClick={() => {
                  setSearchQuery('');
                  setSectionFilter('all');
                  setEventTypeFilter('all');
                  setEventNameFilter('');
                  setCrossSectionFilter('all');
                }}
                sx={{ mt: 1 }}
              >
                Clear All Filters
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>No.</TableCell>
                    <TableCell>Reg. No.</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Section</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Registered Events</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredParticipants.map((participant, index) => {
                    // Count how many single and group events the participant is registered for
                    const eventCounts = countEventTypes(participant.events);
                    const canRegisterMore = eventCounts.single < 2 || eventCounts.group < 1;
                    const participantSection = getParticipantSection(participant.standard);
                    
                    // Count cross-section events
                    const crossSectionEvents = participant.events.filter(e => e.isCrossSectionParticipation);
                    const hasCrossSectionEvents = crossSectionEvents.length > 0;
                    
                    return (
                      <TableRow key={participant._id || index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {participant.registrationNumber ? (
                            <Chip 
                              size="small" 
                              label={participant.registrationNumber} 
                              variant="outlined" 
                              color="primary"
                            />
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>{participant.name}</TableCell>
                        <TableCell>{participant.standard}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={participantSection || 'N/A'}
                            color={
                              participantSection === 'Dominic Savio' ? 'primary' :
                              participantSection === 'Alphonsa' ? 'secondary' :
                              participantSection === 'Saint Thomas' ? 'info' : 'default'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{participant.gender === 'M' ? 'Male' : 'Female'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip 
                                size="small" 
                                label={`${eventCounts.single}/2 Individual`}
                                color={eventCounts.single > 0 ? "primary" : "default"}
                              />
                              <Chip 
                                size="small" 
                                label={`${eventCounts.group}/1 Group`}
                                color={eventCounts.group > 0 ? "secondary" : "default"}
                              />
                              {hasCrossSectionEvents && (
                                <Chip
                                  size="small"
                                  label={`${crossSectionEvents.length} Cross-Section`}
                                  color="info"
                                />
                              )}
                            </Box>
                            {participant.events.map((event, i) => (
                              <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                  <Typography variant="body2" component="span">
                                    {event.eventName}
                                  </Typography>
                                  {event.eventType === 'group' && (
                                    <Chip size="small" label="Group" color="secondary" sx={{ ml: 0.5 }} />
                                  )}
                                  {event.isCrossSectionParticipation && (
                                    <Chip size="small" label="Cross" color="info" sx={{ ml: 0.5 }} />
                                  )}
                                  {/* {event.registrationNumber && (
                                    <Chip 
                                      size="small" 
                                      label={event.registrationNumber} 
                                      variant="outlined" 
                                      color="default" 
                                      sx={{ ml: 0.5 }}
                                    />
                                  )} */}
                                </Box>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteRegistration(event.registrationId)}
                                  sx={{ ml: 1, p: 0.5 }}
                                >
                                  <Trash2 size={16} color="rgb(220, 38, 38)" />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {canRegisterMore && participantSection && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenDialog(participant)}
                              startIcon={<Plus size={16} />}
                            >
                              Add Events
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      );
    } else {
      return (
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" color="textSecondary">
            {selectedParish 
              ? "No participants registered yet." 
              : "Select a parish to view and register participants."}
          </Typography>
        </Paper>
      );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Event Registration
          </Typography>
          
          {message && (
            <Paper 
              sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: message.includes('Error') ? '#FFEBEE' : '#E8F5E9',
                borderRadius: 2
              }}
            >
              <Typography>{message}</Typography>
            </Paper>
          )}

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Parish</InputLabel>
                <Select
                  value={selectedParish}
                  onChange={(e) => setSelectedParish(e.target.value)}
                  label="Select Parish"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {parishes.map((parish) => (
                    <MenuItem key={parish._id} value={parish._id}>
                      {parish.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => handleOpenDialog()}
              disabled={!selectedParish}
            >
              Register New Participant
            </Button>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                onClick={() => {
                  fetchParticipantsByParish();
                  fetchEventParticipantCounts();
                }}
                disabled={!selectedParish}
                sx={{ mr: 1 }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDown size={18} />}
                onClick={handleExportPDF}
                disabled={!participants.length}
              >
                Export to PDF
              </Button>
            </Box>
          </Box>

          {/* Events Participation Summary */}
          {selectedParish && events.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Event Participation Summary
                </Typography>
                <Button 
                  variant="outlined"
                  onClick={() => handleOpenSummaryDialog()}
                  startIcon={<Info size={18} />}
                >
                  View All Events
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {Object.entries(SECTION_CONFIG).map(([section, config]) => {
                  const sectionEvents = events.filter(e => e.section === section);
                  const singleEvents = sectionEvents.filter(e => e.eventType === 'single');
                  const groupEvents = sectionEvents.filter(e => e.eventType === 'group');
                  
                  // Get cross-section events where this section can participate
                  const crossSectionEvents = events.filter(e => 
                    e.section !== section && 
                    e.allowCrossSectionParticipation && 
                    e.crossSectionAllowedSections && 
                    e.crossSectionAllowedSections.includes(section)
                  );
                  
                  // Count total participants in this section
                  const participantCount = Object.entries(eventParticipantCounts)
                    .filter(([eventId]) => sectionEvents.some(e => e._id === eventId))
                    .reduce((sum, [_, count]) => sum + count, 0);
                  
                  // Count cross-section participants
                  const crossSectionCount = Object.entries(eventParticipantCounts)
                    .filter(([eventId]) => eventId.endsWith('_cross') && 
                      crossSectionEvents.some(e => `${e._id}_cross` === eventId))
                    .reduce((sum, [_, count]) => sum + count, 0);
                  
                  if (sectionEvents.length === 0 && crossSectionEvents.length === 0) return null;
                  
                  return (
                    <Grid item xs={12} sm={4} key={section}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <Typography variant="subtitle1" gutterBottom fontWeight="600">
                          {section} Section
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {config.label}
                        </Typography>
                        
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" gutterBottom>
                            <strong>Total Events:</strong> {sectionEvents.length}
                            {crossSectionEvents.length > 0 && ` + ${crossSectionEvents.length} Cross-Section`}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Total Participants:</strong> {participantCount}
                            {crossSectionCount > 0 && ` + ${crossSectionCount} Cross-Section`}
                          </Typography>
                          
                          <Grid container spacing={1} sx={{ mt: 1 }}>
                            <Grid item xs={6}>
                              <Paper 
                                variant="outlined" 
                                sx={{ 
                                  p: 1, 
                                  textAlign: 'center',
                                  borderColor: theme.palette.primary.main,
                                  bgcolor: 'rgba(37, 99, 235, 0.05)'
                                }}
                              >
                                <Typography variant="body2" fontWeight="600" color="primary">
                                  Individual
                                </Typography>
                                <Typography variant="h6" color="primary">
                                  {singleEvents.length}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={6}>
                              <Paper 
                                variant="outlined" 
                                sx={{ 
                                  p: 1, 
                                  textAlign: 'center',
                                  borderColor: theme.palette.secondary.main,
                                  bgcolor: 'rgba(16, 185, 129, 0.05)'
                                }}
                              >
                                <Typography variant="body2" fontWeight="600" color="secondary">
                                  Group
                                </Typography>
                                <Typography variant="h6" color="secondary">
                                  {groupEvents.length}
                                </Typography>
                              </Paper>
                            </Grid>
                            {crossSectionEvents.length > 0 && (
                              <Grid item xs={12} sx={{ mt: 1 }}>
                                <Paper 
                                  variant="outlined" 
                                  sx={{ 
                                    p: 1, 
                                    textAlign: 'center',
                                    borderColor: theme.palette.info.main,
                                    bgcolor: 'rgba(99, 102, 241, 0.05)'
                                  }}
                                >
                                  <Typography variant="body2" fontWeight="600" color="info.main">
                                    Cross-Section
                                  </Typography>
                                  <Typography variant="h6" color="info.main">
                                    {crossSectionEvents.length}
                                  </Typography>
                                </Paper>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                        
                        <Box sx={{ flexGrow: 1 }} />
                        
                        <Button 
                          variant="text" 
                          size="small"
                          onClick={() => handleOpenSummaryDialog(section)}
                          endIcon={<ChevronDown size={16} />}
                          sx={{ mt: 2, alignSelf: 'center' }}
                        >
                          View Details
                        </Button>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {/* Participants Table with Filters */}
          {renderParticipantsTable()}
        </Paper>
        
        {/* Summary Dialog */}
        <Dialog
          open={openSummaryDialog}
          onClose={handleCloseSummaryDialog}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
            {summarySection ? 
              `Event Participation Summary - ${summarySection} Section` : 
              "Event Participation Summary"}
            <IconButton
              onClick={handleCloseSummaryDialog}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 1 }}>
            <EventParticipationSummary section={summarySection} />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={handleCloseSummaryDialog} variant="outlined">
              Close
            </Button>
          </DialogActions>
        </Dialog>
        {/* Multi-step Registration Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
            {participantForm.name ? `Register Events for ${participantForm.name}` : "Register New Participant"}
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 1 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              <Step>
                <StepLabel>Personal Details</StepLabel>
              </Step>
              <Step>
                <StepLabel>Select Events</StepLabel>
              </Step>
              <Step>
                <StepLabel>Confirm Registration</StepLabel>
              </Step>
            </Stepper>
            
            {getStepContent(activeStep)}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
            >
              Cancel
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {activeStep > 0 && (
              <Button 
                onClick={handleBack}
                variant="outlined"
                sx={{ mr: 1 }}
              >
                Back
              </Button>
            )}
            {activeStep === 2 ? (
              <Button
                onClick={handleSubmitRegistrations}
                variant="contained"
                disabled={isLoading || selectedEvents.length === 0}
              >
                {isLoading ? <CircularProgress size={24} /> : "Submit Registration"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={isLoading}
              >
                Next
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default EventRegistration;
import React, { useState, useEffect } from 'react';
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
  Divider,
  Snackbar,
  Tooltip,
  IconButton,
  TextField,
  Switch,
  FormControlLabel
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InfoIcon from '@mui/icons-material/Info';
import TimerIcon from '@mui/icons-material/Timer';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PeopleIcon from '@mui/icons-material/People';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import axiosInstance from "../axiosConfig";

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

const StageAllocation = () => {
  // State variables
  const [foranes, setForanes] = useState([]);
  const [selectedForane, setSelectedForane] = useState('');
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showMessage, setShowMessage] = useState(false);
  const [allocations, setAllocations] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  
  // State for filters
  const [sectionFilter, setSectionFilter] = useState('');
  const [eventNameFilter, setEventNameFilter] = useState('');
  const [availableSections, setAvailableSections] = useState([]);
  const [showWithParticipantsOnly, setShowWithParticipantsOnly] = useState(false);
  
  // Fetch foranes on component mount
  useEffect(() => {
    fetchForanes();
    fetchEvents();
    fetchCategories();
  }, []);

  // Fetch venues when forane is selected
  useEffect(() => {
    if (selectedForane) {
      fetchVenuesByForane();
      fetchAllocations();
      fetchParticipantCounts();
    } else {
      setVenues([]);
      setAllocations([]);
    }
  }, [selectedForane]);
  
  // Extract unique sections from events
  useEffect(() => {
    const sections = [...new Set(events.map(event => event.section))].filter(Boolean).sort();
    setAvailableSections(sections);
  }, [events]);
  
  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("/categories");
      setCategories(response.data.data.categories || []);
    } catch (err) {
      console.error("Failed to fetch Categories", err);
    }
  };
  // Fetch foranes
  const fetchForanes = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/forane");
      const allForanes = response.data || [];
      setForanes(allForanes.filter(f => f._id === '673799a3cb9b4aa181e53fa2'));
      
      // setForanes(response.data || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch Foranes", err);
      setMessage({ text: "Error fetching foranes", type: "error" });
      setShowMessage(true);
      setIsLoading(false);
    }
  };
  const getEventParticipantCount = (eventId) => {
    return participantCounts[eventId] || 0;
  };
  // Fetch venues for selected forane
  const fetchVenuesByForane = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/venues/parish/${selectedForane}`);
      setVenues(response.data.data || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch Venues", err);
      setMessage({ text: "Error fetching venues", type: "error" });
      setShowMessage(true);
      setIsLoading(false);
    }
  };

  // Fetch all events (independent of forane)
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/events/stage/On Stage");
      setEvents(response.data.data.events || []);
      setIsLoading(false);
      
    } catch (err) {
      console.error("Failed to fetch Events", err);
      setMessage({ text: "Error fetching events", type: "error" });
      setShowMessage(true);
      setIsLoading(false);
    }
  };
  const fetchParticipantCounts = async () => {
    try {
      setIsLoading(true);
      
      // First, get all parishes for this forane
      const parishesResponse = await axiosInstance.get(`/parish/forane/${selectedForane}`);
      const parishes = parishesResponse.data || [];
      
      // Create a map of event types for quick lookup
      const eventTypesMap = {};
      events.forEach(event => {
        eventTypesMap[event._id] = event.eventType;
      });
      
      // Initialize counts and parishes tracking objects
      const counts = {};
      const parishesPerEvent = {};
      
      // Fetch counts for each parish and aggregate
      for (const parish of parishes) {
        try {
          const response = await axiosInstance.get(`/api/event-stats/parish/${parish._id}`);
          const stats = response.data.data.stats || [];
          
          // Process each event stat based on event type
          stats.forEach(stat => {
            const eventId = stat.eventId;
            const eventType = eventTypesMap[eventId] || 'single'; // Default to single if not found
            
            // Initialize tracking objects if needed
            if (!counts[eventId]) {
              counts[eventId] = 0;
            }
            
            if (!parishesPerEvent[eventId]) {
              parishesPerEvent[eventId] = new Set();
            }
            
            if (eventType === 'single') {
              // For single events, count total participants
              counts[eventId] += stat.participantCount;
            } else {
              // For group events, only count the parish if there's participation
              if (stat.participantCount > 0) {
                parishesPerEvent[eventId].add(parish._id);
              }
            }
          });
        } catch (error) {
          console.error(`Failed to fetch stats for parish ${parish.name}`, error);
        }
      }
      
      // Update counts for group events to reflect parish count instead of participant count
      Object.keys(parishesPerEvent).forEach(eventId => {
        if (eventTypesMap[eventId] === 'group') {
          counts[eventId] = parishesPerEvent[eventId].size;
        }
      });
      
      setParticipantCounts(counts);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch participant counts", err);
      setIsLoading(false);
    }
  };
  // Fetch existing allocations for the selected forane
  const fetchAllocations = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/allocations/forane/${selectedForane}`);
      setAllocations(response.data.data || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch Allocations", err);
      // If no allocations exist yet, this is not an error
      if (err.response && err.response.status === 404) {
        setAllocations([]);
      } else {
        setMessage({ text: "Error fetching allocations", type: "error" });
        setShowMessage(true);
      }
      setIsLoading(false);
    }
  };

  // State for drag and drop
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragSourceVenue, setDragSourceVenue] = useState(null);
  const [dragSourceIndex, setDragSourceIndex] = useState(null);
  const moveEventUp = (venueId, index) => {
    if (index === 0) return; // Already at the top
    
    const venueAllocation = allocations.find(alloc => alloc.venueId === venueId);
    if (!venueAllocation) return;
    
    const newEventIds = Array.from(venueAllocation.eventIds);
    
    // Swap with the event above
    [newEventIds[index], newEventIds[index - 1]] = [newEventIds[index - 1], newEventIds[index]];
    
    // Update allocations
    const newAllocations = allocations.filter(alloc => alloc.venueId !== venueId);
    newAllocations.push({ ...venueAllocation, eventIds: newEventIds });
    
    setAllocations(newAllocations);
  };
  
  const moveEventDown = (venueId, index) => {
    const venueAllocation = allocations.find(alloc => alloc.venueId === venueId);
    if (!venueAllocation || index >= venueAllocation.eventIds.length - 1) return; // Already at the bottom
    
    const newEventIds = Array.from(venueAllocation.eventIds);
    
    // Swap with the event below
    [newEventIds[index], newEventIds[index + 1]] = [newEventIds[index + 1], newEventIds[index]];
    
    // Update allocations
    const newAllocations = allocations.filter(alloc => alloc.venueId !== venueId);
    newAllocations.push({ ...venueAllocation, eventIds: newEventIds });
    
    setAllocations(newAllocations);
  };
  // Handle drag start
  const handleDragStart = (event, eventId, venueId, index) => {
    setDraggedEvent(eventId);
    setDragSourceVenue(venueId);
    setDragSourceIndex(index);
    
    // Set data for HTML5 drag and drop
    event.dataTransfer.setData('text/plain', eventId);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };
  const getEventMinutes = (event) => {
    if (!event || !event.category) return null;
  
    // If category is an object, use its _id
    const categoryId = typeof event.category === 'object' 
      ? event.category._id 
      : event.category;
  
    const category = categories.find(cat => cat._id === categoryId);
  
    return category?.minutes || null;
  };
  // Handle drop
  const handleDrop = (event, targetVenueId, targetIndex) => {
    event.preventDefault();
    
    if (!draggedEvent) return;
    
    // Same venue, reordering events
    if (dragSourceVenue === targetVenueId) {
      const venueAllocation = allocations.find(alloc => alloc.venueId === targetVenueId) || 
        { venueId: targetVenueId, eventIds: [] };
      
      const newEventIds = Array.from(venueAllocation.eventIds);
      
      // Remove from source position and add to target position
      newEventIds.splice(dragSourceIndex, 1);
      newEventIds.splice(targetIndex, 0, draggedEvent);
      
      // Update allocations
      const newAllocations = allocations.filter(alloc => alloc.venueId !== targetVenueId);
      newAllocations.push({ ...venueAllocation, eventIds: newEventIds });
      
      setAllocations(newAllocations);
    } 
    // Different venues
    else {
      const sourceVenueAllocation = allocations.find(alloc => alloc.venueId === dragSourceVenue) || 
        { venueId: dragSourceVenue, eventIds: [] };
      const destVenueAllocation = allocations.find(alloc => alloc.venueId === targetVenueId) || 
        { venueId: targetVenueId, eventIds: [] };
      
      // Copy arrays
      const newSourceEventIds = Array.from(sourceVenueAllocation.eventIds);
      const newDestEventIds = Array.from(destVenueAllocation.eventIds);
      
      // Remove from source
      newSourceEventIds.splice(dragSourceIndex, 1);
      
      // Add to destination
      if (targetIndex !== undefined) {
        newDestEventIds.splice(targetIndex, 0, draggedEvent);
      } else {
        newDestEventIds.push(draggedEvent);
      }
      
      // Update allocations
      const newAllocations = allocations.filter(
        alloc => alloc.venueId !== dragSourceVenue && alloc.venueId !== targetVenueId
      );
      
      newAllocations.push(
        { ...sourceVenueAllocation, eventIds: newSourceEventIds },
        { ...destVenueAllocation, eventIds: newDestEventIds }
      );
      
      setAllocations(newAllocations);
    }
    
    // Reset drag state
    setDraggedEvent(null);
    setDragSourceVenue(null);
    setDragSourceIndex(null);
  };
  
  // Handle drop for unallocated events area
  const handleDropToUnallocated = (event) => {
    event.preventDefault();
    
    if (!draggedEvent || !dragSourceVenue) return;
    
    const sourceVenueAllocation = allocations.find(alloc => alloc.venueId === dragSourceVenue);
    if (!sourceVenueAllocation) return;
    
    // Copy array and remove event
    const newSourceEventIds = Array.from(sourceVenueAllocation.eventIds);
    newSourceEventIds.splice(dragSourceIndex, 1);
    
    // Update allocations
    const newAllocations = allocations.filter(alloc => alloc.venueId !== dragSourceVenue);
    if (newSourceEventIds.length > 0) {
      newAllocations.push({ ...sourceVenueAllocation, eventIds: newSourceEventIds });
    }
    
    setAllocations(newAllocations);
    
    // Reset drag state
    setDraggedEvent(null);
    setDragSourceVenue(null);
    setDragSourceIndex(null);
  };

  // Save allocations
  const saveAllocations = async () => {
    try {
      setIsLoading(true);
      await axiosInstance.post("/allocations", {
        foraneId: selectedForane,
        allocations: allocations
      });
      setMessage({ text: "Allocations saved successfully", type: "success" });
      setShowMessage(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to save allocations", err);
      setMessage({ text: "Error saving allocations", type: "error" });
      setShowMessage(true);
      setIsLoading(false);
    }
  };

  // Export allocations to PDF
  const exportToPDF = () => {
    if (!venues.length || !allocations.length) {
      setMessage({ text: "No allocations to export", type: "error" });
      setShowMessage(true);
      return;
    }
    
    const doc = new jsPDF();
    const foraneName = foranes.find(f => f._id === selectedForane)?.name || 'Forane';
    
    doc.setFontSize(16);
    doc.text(`Stage Allocations - ${foraneName}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
    
    let yPos = 40;
    
    venues.forEach(venue => {
      const venueAllocation = allocations.find(a => a.venueId === venue._id);
      if (!venueAllocation || !venueAllocation.eventIds.length) return;
      
      doc.setFontSize(14);
      doc.text(`Venue: ${venue.name}`, 14, yPos);
      doc.setFontSize(10);
      doc.text(`Capacity: ${venue.capacity}`, 14, yPos + 7);
      yPos += 15;
      
      const tableData = venueAllocation.eventIds.map((eventId, index) => {
        const event = events.find(e => e._id === eventId);
        if (!event) return [index + 1, 'Unknown Event', 'N/A', 'N/A'];
        
        return [
          index + 1,
          event.eventName,
          event.gender === 'male' ? 'Boys' : event.gender === 'female' ? 'Girls' : 'Mixed',
          event.eventType === 'single' ? 'Single' : 'Group'
        ];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['No.', 'Event Name', 'Gender', 'Type']],
        body: tableData,
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: { 
          fillColor: [37, 99, 235], 
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 20;
      
      // Add new page if needed
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    doc.save(`${foraneName}-stage-allocations.pdf`);
  };

  // Get unallocated events with filters
  const getUnallocatedEvents = () => {
    const allocatedEventIds = allocations.flatMap(a => a.eventIds);
    let filteredEvents = events.filter(event => !allocatedEventIds.includes(event._id));
    
    // Apply section filter if set
    if (sectionFilter) {
      filteredEvents = filteredEvents.filter(event => event.section === sectionFilter);
    }
    
    // Apply event name filter if set
    if (eventNameFilter) {
      const searchTerm = eventNameFilter.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.eventName.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply participants filter if enabled
    if (showWithParticipantsOnly) {
      filteredEvents = filteredEvents.filter(event => 
        getEventParticipantCount(event._id) > 0
      );
    }
    
    return filteredEvents;
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSectionFilter('');
    setEventNameFilter('');
    setShowWithParticipantsOnly(false);
  };

  // Render venue card with allocated events
  const renderVenueCard = (venue) => {
    const venueAllocation = allocations.find(a => a.venueId === venue._id) || { venueId: venue._id, eventIds: [] };
    
    // Calculate total time for this venue (participants * minutes per event)
    const totalTimeInMinutes = venueAllocation.eventIds.reduce((total, eventId) => {
      const event = events.find(e => e._id === eventId);
      if (!event) return total;
      
      const minutes = getEventMinutes(event) || 0;
      const participantCount = getEventParticipantCount(eventId);
      
      // For BOTH group and individual events, multiply minutes by number of participants/parishes
      return total + (minutes * participantCount);
    }, 0);
    
    // Format total time (convert to hours and minutes if over 60 minutes)
    const formattedTotalTime = totalTimeInMinutes >= 60 
      ? `${Math.floor(totalTimeInMinutes / 60)}h ${totalTimeInMinutes % 60}m` 
      : `${totalTimeInMinutes}m`;
    
    return (
      <Grid item xs={12} md={6} lg={4} key={venue._id}>
        <Paper variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'primary.light',
            color: 'white',
            borderRadius: '8px 8px 0 0'
          }}>
            <Typography variant="h6">{venue.name}</Typography>
            <Chip 
              label={`Total: ${formattedTotalTime}`} 
              color="primary"
              variant="outlined"
              sx={{ bgcolor: 'white' }}
            />
          </Box>
          
          <Box
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, venue._id)}
            sx={{ 
              p: 2, 
              minHeight: 200,
              transition: 'background-color 0.2s ease'
            }}
          >
            {venueAllocation.eventIds.length > 0 ? (
              venueAllocation.eventIds.map((eventId, index) => {
                const event = events.find(e => e._id === eventId);
                if (!event) return null;
                
                const minutes = getEventMinutes(event);
                const participantCount = getEventParticipantCount(event._id);
                const isGroupEvent = event.eventType === 'group';
                
                return (
                  <Paper
                    key={event._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, event._id, venue._id, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, venue._id, index)}
                    elevation={draggedEvent === event._id ? 6 : 1}
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      display: 'flex',
                      alignItems: 'center',
                      borderLeft: '4px solid',
                      borderLeftColor: event.gender === 'male' ? '#2563EB' : 
                                       event.gender === 'female' ? '#DB2777' : '#059669',
                      bgcolor: draggedEvent === event._id ? 'rgba(37, 99, 235, 0.05)' : 'white',
                      transition: 'box-shadow 0.2s ease',
                      cursor: 'grab',
                      '&:active': {
                        cursor: 'grabbing'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {/* <Box sx={{ mr: 1, color: 'text.secondary' }}>
                        <DragIndicatorIcon />
                      </Box> */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', mr: 1, color: 'text.secondary' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => moveEventUp(venue._id, index)}
                          disabled={index === 0}
                          sx={{ p: 0.5 }}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => moveEventDown(venue._id, index)}
                          disabled={index === venueAllocation.eventIds.length - 1}
                          sx={{ p: 0.5 }}
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: 12 }}>
                          {event.section}-{event.eventName}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {minutes && (
                            <Tooltip title={isGroupEvent 
                              ? `${minutes} minutes per group` 
                              : `${minutes} minutes per participant`
                            }>
                              <Chip
                                size="small"
                                icon={<TimerIcon />}
                                label={`${minutes} mins`}
                                color="default"
                                variant="outlined"
                                sx={{ height: 24 }}
                              />
                            </Tooltip>
                          )}
                          <Tooltip title={isGroupEvent 
                            ? "Participating Parishes" 
                            : "Total Participants"
                          }>
                            <Chip
                              size="small"
                              icon={<PeopleIcon />}
                              label={isGroupEvent ? `${participantCount}` : participantCount}
                              color={participantCount > 0 ? "secondary" : "default"}
                              variant="outlined"
                              sx={{ height: 24 }}
                            />
                          </Tooltip>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          size="small" 
                          label={event.gender === 'male' ? 'Boys' : 
                                 event.gender === 'female' ? 'Girls' : 'Mixed'} 
                          color={event.gender === 'male' ? 'primary' : 
                                 event.gender === 'female' ? 'error' : 'success'}
                          variant="outlined"
                        />
                        <Chip 
                          size="small" 
                          label={event.eventType === 'single' ? 'Single' : 'Group'} 
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Paper>
                );
              })
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: 100, 
                border: '2px dashed #e0e0e0',
                borderRadius: 2,
                color: 'text.secondary'
              }}>
                <Typography>Drag events here</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Grid>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Stage Allocation
          </Typography>
          
          <Snackbar
            open={showMessage}
            autoHideDuration={6000}
            onClose={() => setShowMessage(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setShowMessage(false)} 
              severity={message.type} 
              variant="filled"
              sx={{ width: '100%' }}
            >
              {message.text}
            </Alert>
          </Snackbar>

          {/* Forane Selection */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Forane</InputLabel>
                <Select
                  value={selectedForane}
                  onChange={(e) => setSelectedForane(e.target.value)}
                  label="Select Forane"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {foranes.map((forane) => (
                    <MenuItem key={forane._id} value={forane._id}>
                      {forane.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {selectedForane && (
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Forane Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Venues
                        </Typography>
                        <Typography variant="h6">
                          {venues.length}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Events
                        </Typography>
                        <Typography variant="h6">
                          {events.length}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Allocated Events
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {allocations.reduce((total, alloc) => total + alloc.eventIds.length, 0)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Unallocated Events
                        </Typography>
                        <Typography variant="h6" color="error">
                          {getUnallocatedEvents().length}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tooltip title="Events distribution across venues">
                      <Chip 
                        label={`Utilization: ${venues.length > 0 
                          ? ((allocations.reduce((total, alloc) => total + alloc.eventIds.length, 0) / events.length) * 100).toFixed(1) 
                          : 0}%`} 
                        color={
                          allocations.reduce((total, alloc) => total + alloc.eventIds.length, 0) === events.length 
                            ? 'success' 
                            : 'warning'
                        }
                        variant="outlined"
                      />
                    </Tooltip>
                    <Tooltip title="Total Venue Capacity">
                      <Chip 
                        label={`Total Capacity: ${venues.reduce((total, venue) => total + venue.capacity, 0)}`}
                        color="secondary"
                        variant="outlined"
                      />
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveAllocations}
              disabled={!selectedForane || isLoading}
            >
              Save Allocations
            </Button>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  fetchVenuesByForane();
                  fetchAllocations();
                  fetchParticipantCounts();
                }}
                disabled={!selectedForane || isLoading}
                sx={{ mr: 1 }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={exportToPDF}
                disabled={!selectedForane || !venues.length || !allocations.length}
              >
                Export to PDF
              </Button>
            </Box>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : !selectedForane ? (
            <Alert severity="info">
              Please select a forane to begin stage allocation.
            </Alert>
          ) : venues.length === 0 ? (
            <Alert severity="warning" sx={{ mb: 3 }}>
              No venues found for this forane. Please add venues first.
            </Alert>
          ) : (
            <Box sx={{ mb: 4 }}>
              <Paper 
                sx={{ 
                  p: 2, 
                  mb: 3,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'primary.light',
                  bgcolor: 'primary.light',
                  color: 'white'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Unallocated Events
                  </Typography>
                  
                  {/* Filter buttons display active filter count */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {(sectionFilter || eventNameFilter || showWithParticipantsOnly) && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={clearFilters}
                        sx={{ 
                          bgcolor: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.8)'
                          }
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                    <Chip 
                      icon={<FilterListIcon />}
                      label={`Filters: ${(sectionFilter ? 1 : 0) + (eventNameFilter ? 1 : 0) + (showWithParticipantsOnly ? 1 : 0)}`}
                      color="default"
                      variant="outlined"
                      sx={{ 
                        bgcolor: 'white',
                        fontWeight: 500
                      }}
                    />
                  </Box>
                </Box>
                
                {/* Filter controls */}
                <Paper sx={{ p: 2, mb: 2, borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small" variant="outlined">
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
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Search by Event Name"
                        variant="outlined"
                        value={eventNameFilter}
                        onChange={(e) => setEventNameFilter(e.target.value)}
                        InputProps={{
                          endAdornment: eventNameFilter && (
                            <IconButton
                              size="small"
                              onClick={() => setEventNameFilter('')}
                              edge="end"
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showWithParticipantsOnly}
                            onChange={(e) => setShowWithParticipantsOnly(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="With Participants"
                        sx={{ 
                          '& .MuiFormControlLabel-label': { 
                            color: 'black',
                            fontSize: '0.875rem'
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Chip 
                          label={`${getUnallocatedEvents().length} events`}
                          color="primary"
                          sx={{ bgcolor: 'white' }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
                
                <Box
                  onDragOver={handleDragOver}
                  onDrop={handleDropToUnallocated}
                  sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    gap: 2,
                    p: 2,
                    bgcolor: 'white',
                    borderRadius: 1,
                    minHeight: 100,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    fontSize: '8px'
                  }}
                >
                  {getUnallocatedEvents().length > 0 ? (
                    getUnallocatedEvents().map((event, index) => {
                      const minutes = getEventMinutes(event);
                      const participantCount = getEventParticipantCount(event._id);
                      return (
                        <Paper
                          key={event._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, event._id, 'unallocated', index)}
                          elevation={draggedEvent === event._id ? 6 : 1}
                          sx={{ 
                            p: 2,
                            borderLeft: '4px solid',
                            borderLeftColor: event.gender === 'male' ? '#2563EB' : 
                                            event.gender === 'female' ? '#DB2777' : '#059669',
                            bgcolor: draggedEvent === event._id ? 'rgba(37, 99, 235, 0.05)' : 'white',
                            width: 'auto',
                            minWidth: 200,
                            cursor: 'grab',
                            '&:active': {
                              cursor: 'grabbing'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 15 }}>
                              {event.section}-{event.eventName} 
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {minutes && (
                                <Chip
                                  size="small"
                                  icon={<TimerIcon />}
                                  label={`${minutes} mins`}
                                  color="default"
                                  variant="outlined"
                                  sx={{ height: 24 }}
                                />
                              )}
                              <Chip
                                size="small"
                                icon={<PeopleIcon />}
                                label={participantCount}
                                color={participantCount > 0 ? "secondary" : "default"}
                                variant="outlined"
                                sx={{ height: 24 }}
                              />
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip 
                              size="small" 
                              label={event.gender === 'male' ? 'Boys' : 
                                    event.gender === 'female' ? 'Girls' : 'Mixed'} 
                              color={event.gender === 'male' ? 'primary' : 
                                    event.gender === 'female' ? 'error' : 'success'}
                              variant="outlined"
                            />
                            <Chip 
                              size="small" 
                              label={event.eventType === 'single' ? 'Single' : 'Group'} 
                              color="secondary"
                              variant="outlined"
                            />
                          </Box>
                        </Paper>
                      );
                    })
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      width: '100%',
                      color: 'text.secondary'
                    }}>
                      {(sectionFilter || eventNameFilter || showWithParticipantsOnly) ? (
                        <Typography>No events match the current filters</Typography>
                      ) : (
                        <Typography>All events have been allocated</Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Venues & Allocated Events
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1 }} />
                Drag and drop events to allocate them to venues. You can also reorder events within venues.
              </Typography>
              
              <Grid container spacing={3}>
                {venues.map(venue => renderVenueCard(venue))}
              </Grid>
            </Box>
          )}
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default StageAllocation;
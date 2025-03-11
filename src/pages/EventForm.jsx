import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  Paper, 
  Checkbox, 
  FormGroup, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  FormHelperText
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import axiosInstance from '../axiosConfig';

const SinglePageApp = () => {
  // State for event form
  const [formData, setFormData] = useState({
    eventName: '',
    gender: 'male',
    maxParticipants: 1,
    eventType: 'single',
    category: '',
    section: '',
    rules: '',
    allowCrossSectionParticipation: false,
    crossSectionMaxParticipants: 0,
    crossSectionAllowedSections: []
  });

  // State management
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([
    "Dominic Savio", "Alphonsa", "Saint Thomas"
  ]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  // Fetch events and categories when component mounts
  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  // Event name generation effect
  useEffect(() => {
    if (formData.category && formData.gender) {
      const selectedCategory = categories.find(cat => cat._id === formData.category);
      const categoryName = selectedCategory ? selectedCategory.name : formData.category;
      const capitalizedGender =
        formData.gender === 'male' ? 'Boys' :
        formData.gender === 'female' ? 'Girls' :
        formData.gender === 'common' ? '' : '';

      setFormData(prev => ({
        ...prev,
        eventName: `${categoryName} ${capitalizedGender}`
      }));
    }
  }, [formData.category, formData.gender, categories]);

  // Fetch categories
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await axiosInstance.get('/categories');
      setCategories(response.data.data.categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setMessage({
        text: 'Failed to load categories. Using default categories.',
        type: 'error'
      });
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'allowCrossSectionParticipation') {
      setFormData({
        ...formData,
        [name]: checked,
        ...(checked ? {} : { 
          crossSectionMaxParticipants: 0, 
          crossSectionAllowedSections: [] 
        })
      });
    } else if (name === 'crossSectionAllowedSections') {
      const selectedSections = e.target.value;
      setFormData({
        ...formData,
        crossSectionAllowedSections: 
          typeof selectedSections === 'string' 
            ? selectedSections.split(',') 
            : selectedSections
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Fetch all events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/events');
      setEvents(response.data.data.events);
    } catch (err) {
      setMessage({
        text: 'Failed to load events. Please try again later.',
        type: 'error'
      });
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete an event
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await axiosInstance.delete(`/events/${id}`);
        // Update the list after successful deletion
        setEvents(events.filter(event => event._id !== id));
        setMessage({ text: 'Event deleted successfully!', type: 'success' });
      } catch (err) {
        setMessage({ text: 'Failed to delete event. Please try again.', type: 'error' });
        console.error('Error deleting event:', err);
      }
    }
  };

  // Edit an event
  const handleEdit = (event) => {
    setEditMode(true);
    setCurrentEventId(event._id);
    setFormData({
      eventName: event.eventName,
      gender: event.gender,
      maxParticipants: event.maxParticipants,
      eventType: event.eventType,
      category: event.category,
      section: event.section,
      rules: event.rules,
      allowCrossSectionParticipation: event.allowCrossSectionParticipation || false,
      crossSectionMaxParticipants: event.crossSectionMaxParticipants || 0,
      crossSectionAllowedSections: event.crossSectionAllowedSections || []
    });
  };

  // Submit form to create or update event
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      // Validation logic
      if (!formData.eventName || !formData.gender || !formData.category || !formData.section) {
        setMessage({ text: 'Please fill all required fields', type: 'error' });
        setFormSubmitting(false);
        return;
      }

      // Cross-section participation validation for group events
      if (formData.eventType === 'group' && formData.allowCrossSectionParticipation) {
        if (formData.crossSectionMaxParticipants <= 0) {
          setMessage({ 
            text: 'Cross-section max participants must be greater than 0', 
            type: 'error' 
          });
          setFormSubmitting(false);
          return;
        }

        if (formData.crossSectionAllowedSections.length === 0) {
          setMessage({ 
            text: 'Please select at least one section for cross-section participation', 
            type: 'error' 
          });
          setFormSubmitting(false);
          return;
        }

        if (formData.crossSectionAllowedSections.includes(formData.section)) {
          setMessage({ 
            text: 'Allowed sections cannot include the main event section', 
            type: 'error' 
          });
          setFormSubmitting(false);
          return;
        }
      }

      // Check for duplicate event
      const duplicateEvent = events.find(event =>
        event._id !== currentEventId && 
        event.category === formData.category &&
        event.section === formData.section &&
        event.gender === formData.gender &&
        event.eventType === formData.eventType &&
        event.maxParticipants === formData.maxParticipants
      );

      if (duplicateEvent) {
        setMessage({
          text: `An identical event already exists.`,
          type: 'error'
        });
        setFormSubmitting(false);
        return;
      }

      // Send data to backend
      if (editMode) {
        // Update existing event
        await axiosInstance.put(`/events/${currentEventId}`, formData);
        setMessage({ text: 'Event updated successfully!', type: 'success' });
      } else {
        // Create new event
        await axiosInstance.post('/events', formData);
        setMessage({ text: 'Event saved successfully!', type: 'success' });
      }

      // Reset form and refresh events
      setFormData({
        eventName: '',
        gender: 'male',
        maxParticipants: 1,
        eventType: 'single',
        category: '',
        section: '',
        rules: '',
        allowCrossSectionParticipation: false,
        crossSectionMaxParticipants: 0,
        crossSectionAllowedSections: []
      });
      setEditMode(false);
      setCurrentEventId(null);
      fetchEvents();
    } catch (error) {
      setMessage({
        text: `Error: ${error.response?.data?.message || 'Could not save event'}`,
        type: 'error'
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Format helpers
  const formatGender = (gender) => {
    if (!gender) return 'None';
    if (gender === 'common') return 'Mixed';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const formatCategory = (categoryId) => {
    if (!categoryId) return '';
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 
      (typeof categoryId === 'string' 
        ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1) 
        : 'Unknown');
  };

  // Filtered events
  const filteredEvents = events.filter(event => 
    (!selectedCategory || event.category === selectedCategory) &&
    (!selectedSection || event.section === selectedSection) &&
    (event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
     event.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
     formatCategory(event.category).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Render cross-section participation fields
  const renderCrossSectionFields = () => {
    if (formData.eventType !== 'group') return null;

    return (
      <Box sx={{ mt: 2, mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.allowCrossSectionParticipation}
              onChange={handleChange}
              name="allowCrossSectionParticipation"
            />
          }
          label="Allow Cross-Section Participation"
        />

        {formData.allowCrossSectionParticipation && (
          <Grid container spacing={2} sx={{ pl: 4, mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Maximum Cross-Section Participants"
                name="crossSectionMaxParticipants"
                value={formData.crossSectionMaxParticipants}
                onChange={handleChange}
                variant="outlined"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Allowed Sections</InputLabel>
                <Select
                  multiple
                  value={formData.crossSectionAllowedSections}
                  onChange={handleChange}
                  name="crossSectionAllowedSections"
                  renderValue={(selected) => selected.join(', ')}
                  label="Allowed Sections"
                >
                  {sections
                    .filter(section => section !== formData.section)
                    .map(section => (
                      <MenuItem key={section} value={section}>
                        <Checkbox 
                          checked={formData.crossSectionAllowedSections.includes(section)} 
                        />
                        {section}
                      </MenuItem>
                    ))}
                </Select>
                <FormHelperText>
                  Select sections that can participate in this group event
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
          Event Management System
        </Typography>

        {message.text && (
          <Alert 
            severity={message.type === 'error' ? 'error' : 'success'}
            sx={{ mb: 3 }}
          >
            {message.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Event Form Section */}
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <AddIcon sx={{ mr: 1, color: 'primary.main' }} /> 
                {editMode ? 'Edit Event' : 'Add New Event'}
              </Typography>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  {/* Category Selection */}
                  <Grid item xs={12}>
                    <FormControl fullWidth variant="outlined" required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        label="Category"
                        disabled={categoriesLoading}
                      >
                        <MenuItem value="">Select a category</MenuItem>
                        {categories.length > 0 ? (
                          categories.map(category => (
                            <MenuItem key={category._id} value={category._id}>
                              {category.name}
                            </MenuItem>
                          ))
                        ) : (
                          ['Sports', 'Cultural', 'Technical', 'Literary', 'Arts', 'Academic']
                            .map(cat => (
                              <MenuItem key={cat} value={cat.toLowerCase()}>
                                {cat}
                              </MenuItem>
                            ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Gender Selection */}
                  <Grid item xs={12}>
                    <FormControl component="fieldset" required>
                      <Typography sx={{ mb: 1 }}>Gender</Typography>
                      <RadioGroup row
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        <FormControlLabel 
                          value="male" 
                          control={<Radio />} 
                          label="Male" 
                        />
                        <FormControlLabel 
                          value="female" 
                          control={<Radio />} 
                          label="Female" 
                        />
                        <FormControlLabel 
                          value="common" 
                          control={<Radio />} 
                          label="Mixed" 
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  {/* Section Selection */}
                  <Grid item xs={12}>
                    <FormControl fullWidth variant="outlined" required>
                      <InputLabel>Section</InputLabel>
                      <Select
                        name="section"
                        value={formData.section}
                        onChange={handleChange}
                        label="Section"
                      >
                        <MenuItem value="">Select a section</MenuItem>
                        {sections.map(section => (
                          <MenuItem key={section} value={section}>
                            {section}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Event Name */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Event Name"
                      name="eventName"
                      value={formData.eventName}
                      onChange={handleChange}
                      variant="outlined"
                      required
                      helperText="Auto-generated from category and gender, but can be edited"
                    />
                  </Grid>

                  {/* Max Participants */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Maximum Number of Participants"
                      name="maxParticipants"
                      value={formData.maxParticipants}
                      onChange={handleChange}
                      variant="outlined"
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  {/* Event Type */}
                  <Grid item xs={12}>
                    <FormControl component="fieldset" required>
                      <Typography sx={{ mb: 1 }}>Event Type</Typography>
                      <RadioGroup
                        row
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleChange}
                      >
                        <FormControlLabel 
                          value="single" 
                          control={<Radio />} 
                          label="Single" 
                        />
                        <FormControlLabel 
                          value="group" 
                          control={<Radio />} 
                          label="Group" 
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  {/* Cross-section participation fields */}
                  <Grid item xs={12}>
                    {renderCrossSectionFields()}
                  </Grid>

                  {/* Rules */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Rules (in Malayalam)"
                      name="rules"
                      value={formData.rules}
                      onChange={handleChange}
                      variant="outlined"
                      placeholder="Enter event rules here..."
                      sx={{ 
                        '& .MuiInputBase-root': { 
                          fontFamily: "'Manjari', 'Noto Sans Malayalam', sans-serif" 
                        } 
                      }}
                      helperText="Enter each rule on a new line"
                    />
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={formSubmitting}
                      startIcon={formSubmitting ? <CircularProgress size={20} /> : null}
                    >
                      {editMode ? 'Update Event' : 'Save Event'}
                    </Button>
                    {editMode && (
                      <Button
                        variant="outlined"
                        color="secondary"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={() => {
                          setEditMode(false);
                          setCurrentEventId(null);
                          setFormData({
                            eventName: '',
                            gender: 'male',
                            maxParticipants: 1,
                            eventType: 'single',
                            category: '',
                            section: '',
                            rules: '',
                            allowCrossSectionParticipation: false,
                            crossSectionMaxParticipants: 0,
                            crossSectionAllowedSections: []
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>

          {/* Events List Section */}
          <Grid item xs={12} md={8}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Event List</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search events"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ minWidth: 200 }}
                  />
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={fetchEvents}
                    startIcon={<CircularProgress size={20} sx={{ display: loading ? 'inline-block' : 'none' }} />}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : filteredEvents.length === 0 ? (
                <Alert severity="info">
                  No events found. Add a new event using the form.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Event Name</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Section</TableCell>
                        <TableCell>Gender</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow key={event._id} hover>
                          <TableCell>
                            <Chip 
                              label={event.eventName} 
                              color="primary" 
                              variant="outlined" 
                            />
                          </TableCell>
                          <TableCell>{formatCategory(event.category)}</TableCell>
                          <TableCell>{event.section}</TableCell>
                          <TableCell>{formatGender(event.gender)}</TableCell>
                          <TableCell>
                            <IconButton 
                              color="primary" 
                              size="small"
                              onClick={() => handleEdit(event)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              size="small"
                              onClick={() => handleDelete(event._id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default SinglePageApp;
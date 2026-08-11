import React, { useState, useEffect } from 'react';
import axiosInstance from "../axiosConfig";
import { getParishId } from '../utils/parishAuth';
import {
  Container, Typography, Box, Select, MenuItem, TextField, Button, FormControl,
  InputLabel, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Card, CardContent, Alert, IconButton, Chip
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { UserPlus, Edit3, Trash2, Users, Phone, Shield, RefreshCw, X } from 'lucide-react';

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

const SECTION_COLORS = {
  'Dominic Savio': '#2563EB',
  'Alphonsa': '#10B981',
  'Saint Thomas': '#6366F1',
};

const ManagerForm = () => {
  const [formData, setFormData] = useState({
    parish: '',
    section: '',
    managers: [
      { name: '', contactNumber: '' },
      { name: '', contactNumber: '' }
    ]
  });

  const [parishes, setParishes] = useState([]);
  const [sections, setSections] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [isLoading, setIsLoading] = useState(false);
  const [savedManagers, setSavedManagers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  useEffect(() => { fetchParishes(); }, []);
  useEffect(() => {
    const pid = getParishId();
    if (pid) setFormData(prev => ({ ...prev, parish: pid }));
  }, []);

  useEffect(() => {
    if (formData.parish) { fetchManagersByParish(formData.parish); }
    else { setSavedManagers([]); }
  }, [formData.parish]);

  const fetchParishes = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/parish");
      const filtered = (response.data || []).filter(
        (p) => p.forane === "673799a3cb9b4aa181e53fa2" || p.forane?._id === "673799a3cb9b4aa181e53fa2"
      );
      setParishes(filtered);
    } catch (err) { console.error("Failed to fetch Parishes"); }
    finally { setIsLoading(false); }
  };

  const fetchManagersByParish = async (parishId) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/managers/parish/${parishId}`);
      setSavedManagers(response.data);
    } catch (error) {
      console.error('Error fetching managers:', error);
      showMessage('Failed to load saved managers', 'error');
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (formData.parish) {
      setSections(["Dominic Savio", "Alphonsa", "Saint Thomas"]);
    } else { setSections([]); }
  }, [formData.parish, parishes]);

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
  };

  const handleParishChange = (e) => {
    setFormData({ ...formData, parish: e.target.value, section: '' });
    if (isEditing) { setIsEditing(false); setEditingId(null); }
  };

  const handleSectionChange = (e) => { setFormData({ ...formData, section: e.target.value }); };

  const handleManagerChange = (index, field, value) => {
    const updatedManagers = [...formData.managers];
    updatedManagers[index] = { ...updatedManagers[index], [field]: value };
    setFormData({ ...formData, managers: updatedManagers });
  };

  const handleEdit = (record) => {
    setIsEditing(true);
    setEditingId(record._id);
    const managers = [...record.managers];
    while (managers.length < 2) managers.push({ name: '', contactNumber: '' });
    setFormData({
      parish: typeof record.parish === 'object' ? record.parish._id : record.parish,
      section: record.section,
      managers
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteConfirmation = (id) => { setRecordToDelete(id); setDeleteDialogOpen(true); };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/managers/${recordToDelete}`);
      showMessage('Manager record deleted successfully');
      if (formData.parish) fetchManagersByParish(formData.parish);
      setDeleteDialogOpen(false); setRecordToDelete(null);
    } catch (error) {
      console.error('Error deleting manager:', error);
      showMessage('Failed to delete manager record', 'error');
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.parish || !formData.section) { showMessage('Please select both parish and section', 'error'); return; }
    const isValid = formData.managers.every(m => m.name.trim() !== '' && m.contactNumber.trim() !== '');
    if (!isValid) { showMessage('Please enter both name and contact number for all managers', 'error'); return; }

    try {
      setIsLoading(true);
      if (isEditing) {
        await axiosInstance.put(`/managers/${editingId}`, formData);
        showMessage('Managers updated successfully!');
      } else {
        await axiosInstance.post("/managers", formData);
        showMessage('Managers saved successfully!');
      }
      setFormData({ parish: formData.parish, section: '', managers: [{ name: '', contactNumber: '' }, { name: '', contactNumber: '' }] });
      setIsEditing(false); setEditingId(null);
      fetchManagersByParish(formData.parish);
    } catch (error) {
      console.error('Error saving managers:', error);
      showMessage('Failed to save managers. Please try again.', 'error');
    } finally { setIsLoading(false); }
  };

  const cancelEdit = () => {
    setIsEditing(false); setEditingId(null);
    setFormData({ parish: formData.parish, section: '', managers: [{ name: '', contactNumber: '' }, { name: '', contactNumber: '' }] });
  };

  // Stats
  const totalManagers = savedManagers.reduce((acc, r) => acc + (r.managers?.length || 0), 0);
  const sectionsWithManagers = new Set(savedManagers.map(r => r.section)).size;

  const statisticsCards = [
    { title: 'Total Records', value: savedManagers.length, color: '#2563EB', icon: <Shield size={24} /> },
    { title: 'Total Managers', value: totalManagers, color: '#10B981', icon: <Users size={24} /> },
    { title: 'Sections Covered', value: sectionsWithManagers, color: '#6366F1', icon: <Users size={24} /> },
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
                    {isEditing ? 'Edit Managers' : 'Manager Registration'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Assign section managers for Forane Kalolsavam
                  </Typography>
                </Box>
                {formData.parish && (
                  <Button variant="outlined" startIcon={<RefreshCw size={18} />}
                    onClick={() => fetchManagersByParish(formData.parish)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                    Refresh
                  </Button>
                )}
              </PageHeader>
            </Grid>

            {/* Message */}
            {message && (
              <Grid item xs={12}>
                <Alert severity={messageType} sx={{ borderRadius: 2 }} onClose={() => setMessage('')}>
                  {message}
                </Alert>
              </Grid>
            )}

            {/* Parish Selector (admin only) */}
            {!getParishId() && (
              <Grid item xs={12} sm={6} md={4}>
                <StyledCard>
                  <StyledCardContent>
                    <FormControl fullWidth required>
                      <InputLabel>Parish</InputLabel>
                      <Select value={formData.parish} label="Parish" onChange={handleParishChange} disabled={isEditing}>
                        <MenuItem value="">Select Parish</MenuItem>
                        {parishes.map((p) => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </StyledCardContent>
                </StyledCard>
              </Grid>
            )}

            {/* Stat Cards */}
            {formData.parish && statisticsCards.map((stat, index) => (
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

            {/* Registration Form */}
            <Grid item xs={12}>
              <ChartCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                    {isEditing ? 'Edit Manager Details' : 'Register New Managers'}
                  </Typography>
                  {isEditing && (
                    <Button variant="outlined" color="inherit" onClick={cancelEdit} startIcon={<X size={16} />}
                      sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel Edit</Button>
                  )}
                </Box>
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Section</InputLabel>
                        <Select value={formData.section} label="Section" onChange={handleSectionChange} disabled={!formData.parish}>
                          <MenuItem value="">Select Section</MenuItem>
                          {sections.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>

                    {formData.managers.map((manager, index) => (
                      <React.Fragment key={index}>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: index > 0 ? 1 : 0 }}>
                            <IconBox color={index === 0 ? '#2563EB' : '#10B981'} sx={{ width: 36, height: 36, borderRadius: 10 }}>
                              <UserPlus size={18} />
                            </IconBox>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a202c' }}>
                              Manager {index + 1}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField fullWidth label="Name" value={manager.name}
                            onChange={(e) => handleManagerChange(index, 'name', e.target.value)} required />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField fullWidth label="Contact Number" value={manager.contactNumber}
                            onChange={(e) => handleManagerChange(index, 'contactNumber', e.target.value)}
                            required type="tel" inputProps={{ pattern: "[0-9]*" }} />
                        </Grid>
                      </React.Fragment>
                    ))}

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                        {isEditing && (
                          <Button variant="outlined" onClick={cancelEdit}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                        )}
                        <Button type="submit" variant="contained" disabled={isLoading}
                          startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : (isEditing ? <Edit3 size={18} /> : <UserPlus size={18} />)}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 4, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                          {isLoading ? 'Saving...' : isEditing ? 'Update Managers' : 'Save Managers'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              </ChartCard>
            </Grid>

            {/* Saved Managers Table */}
            {formData.parish && (
              <Grid item xs={12}>
                <ChartCard>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c', mb: 3 }}>
                    Managers for Selected Parish
                  </Typography>

                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                  ) : savedManagers.length > 0 ? (
                    <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Section</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Manager 1</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Manager 2</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {savedManagers.map((record) => {
                            const sColor = SECTION_COLORS[record.section];
                            return (
                              <TableRow key={record._id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                <TableCell>
                                  <Chip size="small" label={record.section} sx={{
                                    bgcolor: sColor ? `${sColor}15` : undefined,
                                    color: sColor || undefined,
                                    border: sColor ? `1px solid ${sColor}30` : undefined,
                                    fontWeight: 600
                                  }} />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{record.managers[0]?.name || '-'}</TableCell>
                                <TableCell>
                                  {record.managers[0]?.contactNumber ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Phone size={14} style={{ color: '#64748b' }} />
                                      {record.managers[0].contactNumber}
                                    </Box>
                                  ) : '-'}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{record.managers[1]?.name || '-'}</TableCell>
                                <TableCell>
                                  {record.managers[1]?.contactNumber ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Phone size={14} style={{ color: '#64748b' }} />
                                      {record.managers[1].contactNumber}
                                    </Box>
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button variant="outlined" size="small" onClick={() => handleEdit(record)}
                                      startIcon={<Edit3 size={14} />}
                                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Edit</Button>
                                    <IconButton size="small" onClick={() => handleDeleteConfirmation(record._id)}
                                      sx={{ color: '#EF4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}>
                                      <Trash2 size={18} />
                                    </IconButton>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                      <Users size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                      <Typography color="textSecondary" sx={{ fontSize: '1.05rem' }}>
                        No managers saved for this parish
                      </Typography>
                    </Box>
                  )}
                </ChartCard>
              </Grid>
            )}
          </Grid>
        </Container>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 600 }}>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to delete this manager record?</DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Delete</Button>
          </DialogActions>
        </Dialog>
      </DashboardContainer>
    </ThemeProvider>
  );
};

export default ManagerForm;
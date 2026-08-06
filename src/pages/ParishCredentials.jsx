import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, Table, TableBody, TableHead, TableRow, TableCell,
  TableContainer, TextField, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, CircularProgress, InputAdornment, Alert, Snackbar
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Eye, EyeOff, Copy, Search, UserPlus, KeyRound, RotateCcw, Shield, Check } from 'lucide-react';
import axiosInstance from "../axiosConfig";

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#5B4CD6' },
    background: { default: '#F8F9FC', paper: '#FFFFFF' }
  },
  typography: { fontFamily: '"Inter", "Segoe UI", sans-serif' }
});

const card = {
  background: '#FFFFFF',
  border: '1px solid #E8EBF0',
  borderRadius: '14px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: '#1E293B', borderRadius: '10px',
    '& fieldset': { borderColor: '#E2E8F0' },
    '&:hover fieldset': { borderColor: '#5B4CD6' },
    '&.Mui-focused fieldset': { borderColor: '#5B4CD6' }
  },
  '& .MuiInputLabel-root': { color: '#94A3B8' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#5B4CD6' }
};

const FORANE_ID = '673799a3cb9b4aa181e53fa2';

const ParishCredentials = () => {
  const [parishes, setParishes] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedParish, setSelectedParish] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [parishRes, credRes] = await Promise.all([
        axiosInstance.get('/parish'),
        axiosInstance.get('/parishc/parish-credentials').catch(() => ({ data: [] }))
      ]);
      const allParishes = (parishRes.data || []).filter(
        p => p.forane === FORANE_ID || p.forane?._id === FORANE_ID
      );
      setParishes(allParishes);
      setCredentials(credRes.data?.data || credRes.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      showSnack('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const parishList = useMemo(() => {
    const credMap = {};
    credentials.forEach(c => {
      const pid = c.parish?._id || c.parish;
      if (pid) credMap[pid] = c;
    });
    return parishes
      .map(p => ({ _id: p._id, name: p.name, credential: credMap[p._id] || null }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [parishes, credentials]);

  const filtered = useMemo(() => {
    if (!search.trim()) return parishList;
    const q = search.toLowerCase();
    return parishList.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.credential?.username || '').toLowerCase().includes(q)
    );
  }, [parishList, search]);

  const openCreate = (parish) => {
    setSelectedParish(parish);
    setDialogMode('create');
    setForm({
      username: parish.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20),
      password: '', confirmPassword: ''
    });
    setShowPassword(false);
    setShowConfirm(false);
    setDialogOpen(true);
  };

  const openReset = (parish) => {
    setSelectedParish(parish);
    setDialogMode('reset');
    setForm({ username: parish.credential?.username || '', password: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirm(false);
    setDialogOpen(true);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm(f => ({ ...f, password: pwd, confirmPassword: pwd }));
  };

  const handleSave = async () => {
    if (!form.username.trim()) return showSnack('Username is required', 'error');
    if (!form.password.trim()) return showSnack('Password is required', 'error');
    if (form.password.length < 6) return showSnack('Password must be at least 6 characters', 'error');
    if (form.password !== form.confirmPassword) return showSnack('Passwords do not match', 'error');

    setSaving(true);
    try {
      if (dialogMode === 'create') {
        await axiosInstance.post('/parishc/parish-credentials', {
          parish: selectedParish._id,
          username: form.username.trim(),
          password: form.password
        });
        showSnack(`Credentials created for ${selectedParish.name}`);
      } else {
        const credId = selectedParish.credential?._id;
        await axiosInstance.put(`/parishc/parish-credentials/${credId}`, { password: form.password });
        showSnack(`Password reset for ${selectedParish.name}`);
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save';
      showSnack(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const withCred = parishList.filter(p => p.credential).length;
  const withoutCred = parishList.filter(p => !p.credential).length;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', background: '#F8F9FC', color: '#1E293B' }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>

          {/* Header */}
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Shield size={20} color="#5B4CD6" />
                  <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#5B4CD6' }}>
                    Parish Credentials
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                  User Management
                </Typography>
                <Typography sx={{ color: '#94A3B8', mt: 0.5, fontSize: '14px' }}>
                  Create and manage login credentials for each parish
                </Typography>
              </Box>
              <Box display="flex" gap={1.5} alignItems="center">
                <Box sx={{ ...card, px: 2.5, py: 1.2, display: 'flex', gap: 2.5 }}>
                  <Box textAlign="center">
                    <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#059669' }}>{withCred}</Typography>
                    <Typography sx={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Active</Typography>
                  </Box>
                  <Box sx={{ width: '1px', background: '#E8EBF0' }} />
                  <Box textAlign="center">
                    <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#E11D48' }}>{withoutCred}</Typography>
                    <Typography sx={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Pending</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Search */}
          <Box sx={{ mb: 2.5 }}>
            <TextField
              size="small" fullWidth placeholder="Search parishes or usernames..."
              value={search} onChange={e => setSearch(e.target.value)}
              sx={{ ...inputSx, maxWidth: 400 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search size={16} color="#94A3B8" /></InputAdornment>
              }}
            />
          </Box>

          {/* Table */}
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={10}>
              <CircularProgress sx={{ color: '#5B4CD6' }} />
            </Box>
          ) : (
            <Box sx={{ ...card, p: 0 }}>
              <TableContainer>
                <Table size="small" sx={{
                  '& th': { color: '#64748B', fontWeight: 700, borderBottom: '1px solid #E8EBF0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.5, px: 2, background: '#FAFBFD' },
                  '& td': { color: '#334155', borderBottom: '1px solid #F1F5F9', py: 1.5, px: 2 }
                }}>
                  <TableHead>
                    <TableRow>
                      <TableCell width={50}>#</TableCell>
                      <TableCell>Parish</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((p, idx) => (
                      <TableRow key={p._id} sx={{ '&:hover': { background: '#F8F9FC' } }}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#94A3B8' }}>{idx + 1}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>{p.name}</Typography>
                        </TableCell>
                        <TableCell>
                          {p.credential ? (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Typography sx={{
                                fontFamily: '"JetBrains Mono", monospace', fontSize: '13px',
                                color: '#5B4CD6', background: 'rgba(91,76,214,0.06)',
                                px: 1, py: 0.3, borderRadius: '6px'
                              }}>
                                {p.credential.username}
                              </Typography>
                              <IconButton size="small" onClick={() => copyToClipboard(p.credential.username, `u-${p._id}`)}
                                sx={{ color: copiedId === `u-${p._id}` ? '#059669' : '#94A3B8', p: 0.5 }}>
                                {copiedId === `u-${p._id}` ? <Check size={14} /> : <Copy size={14} />}
                              </IconButton>
                            </Box>
                          ) : (
                            <Typography sx={{ color: '#CBD5E1', fontSize: '13px' }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={p.credential ? 'Active' : 'No Credentials'}
                            size="small"
                            sx={{
                              fontWeight: 600, fontSize: '11px',
                              bgcolor: p.credential ? 'rgba(5,150,105,0.08)' : 'rgba(225,29,72,0.06)',
                              color: p.credential ? '#059669' : '#E11D48'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {p.credential ? (
                            <Button size="small" startIcon={<RotateCcw size={14} />}
                              onClick={() => openReset(p)}
                              sx={{
                                textTransform: 'none', color: '#D97706', fontSize: '12px', fontWeight: 600,
                                border: '1px solid rgba(217,119,6,0.2)', borderRadius: '8px', px: 1.5,
                                '&:hover': { background: 'rgba(217,119,6,0.06)' }
                              }}>
                              Reset Password
                            </Button>
                          ) : (
                            <Button size="small" startIcon={<UserPlus size={14} />}
                              onClick={() => openCreate(p)}
                              sx={{
                                textTransform: 'none', color: '#5B4CD6', fontSize: '12px', fontWeight: 600,
                                border: '1px solid rgba(91,76,214,0.25)', borderRadius: '8px', px: 1.5,
                                '&:hover': { background: 'rgba(91,76,214,0.06)' }
                              }}>
                              Create Credentials
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#CBD5E1' }}>
                          {search ? 'No parishes match your search' : 'No parishes found'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Dialog */}
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
            PaperProps={{ sx: { background: '#FFFFFF', border: '1px solid #E8EBF0', borderRadius: '16px', color: '#1E293B' } }}>
            <DialogTitle sx={{ pb: 1 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <KeyRound size={20} color="#5B4CD6" />
                <Typography sx={{ fontWeight: 700, fontSize: '18px', color: '#0F172A' }}>
                  {dialogMode === 'create' ? 'Create Credentials' : 'Reset Password'}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '13px', color: '#94A3B8', mt: 0.5 }}>
                {selectedParish?.name}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Box display="flex" flexDirection="column" gap={2.5} mt={1}>
                {dialogMode === 'create' && (
                  <TextField
                    label="Username" fullWidth size="small"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') }))}
                    sx={inputSx}
                    helperText="Lowercase letters, numbers, dots, hyphens only"
                    FormHelperTextProps={{ sx: { color: '#94A3B8' } }}
                  />
                )}
                {dialogMode === 'reset' && (
                  <Box sx={{ p: 1.5, borderRadius: '10px', background: '#F8F9FC', border: '1px solid #E8EBF0' }}>
                    <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>Username</Typography>
                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', color: '#5B4CD6', fontSize: '14px' }}>
                      {form.username}
                    </Typography>
                  </Box>
                )}
                <TextField
                  label="Password" fullWidth size="small"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  sx={inputSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)} sx={{ color: '#94A3B8' }}>
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <TextField
                  label="Confirm Password" fullWidth size="small"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  sx={inputSx}
                  error={form.confirmPassword.length > 0 && form.password !== form.confirmPassword}
                  helperText={form.confirmPassword.length > 0 && form.password !== form.confirmPassword ? 'Passwords do not match' : ''}
                  FormHelperTextProps={{ sx: { color: '#EF4444' } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowConfirm(!showConfirm)} sx={{ color: '#94A3B8' }}>
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <Button onClick={generatePassword} size="small" startIcon={<KeyRound size={14} />}
                  sx={{
                    alignSelf: 'flex-start', textTransform: 'none', color: '#059669', fontSize: '12px', fontWeight: 600,
                    border: '1px solid rgba(5,150,105,0.25)', borderRadius: '8px', px: 1.5,
                    '&:hover': { background: 'rgba(5,150,105,0.06)' }
                  }}>
                  Generate Strong Password
                </Button>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
              <Button onClick={() => setDialogOpen(false)}
                sx={{ textTransform: 'none', color: '#94A3B8', borderRadius: '10px', px: 2 }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} variant="contained"
                sx={{
                  textTransform: 'none', fontWeight: 600, borderRadius: '10px', px: 3,
                  background: '#5B4CD6', '&:hover': { background: '#4338CA' },
                  boxShadow: '0 2px 8px rgba(91,76,214,0.25)'
                }}>
                {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> :
                  dialogMode === 'create' ? 'Create Credentials' : 'Reset Password'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar */}
          <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}
              sx={{ borderRadius: '10px' }}>
              {snack.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default ParishCredentials;
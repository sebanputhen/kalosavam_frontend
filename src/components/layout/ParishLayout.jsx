import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Divider, IconButton, Drawer,
  AppBar, Toolbar, useMediaQuery, useTheme
} from '@mui/material';
import { ClipboardList, Users, FileText, LogOut, BarChart3, Menu } from 'lucide-react';
import { getParishName } from '../../utils/parishAuth';

const DRAWER_WIDTH = 250;

const navItems = [
  { path: '/parish/registration', label: 'Event Registration', icon: ClipboardList },
  { path: '/parish/managers', label: 'Team Managers', icon: Users },
  { path: '/parish/print', label: 'Print Form', icon: FileText },
];

const ParishLayout = ({ children }) => {
  const location = useLocation();
  const parishName = getParishName();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/parishlogin';
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E40AF' }}>
          {parishName}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Parish Portal
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ flex: 1, py: 1, px: 1 }}>
        {navItems.map(item => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}
              onClick={() => isMobile && setMobileOpen(false)}>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 2, py: 1.2, borderRadius: 1, mb: 0.5,
                color: active ? '#2563EB' : '#555',
                bgcolor: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                fontWeight: active ? 600 : 400, fontSize: '14px',
                '&:hover': { bgcolor: active ? 'rgba(37,99,235,0.08)' : '#f5f5f5' }
              }}>
                <Icon size={18} />
                {item.label}
              </Box>
            </NavLink>
          );
        })}
      </Box>

      <Divider />

      <Box sx={{ p: 1 }}>
        <NavLink to="/" style={{ textDecoration: 'none' }}
          onClick={() => isMobile && setMobileOpen(false)}>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2, py: 1, borderRadius: 1, mb: 0.5,
            color: '#555', fontSize: '13px',
            '&:hover': { bgcolor: '#f5f5f5' }
          }}>
            <BarChart3 size={16} />
            Results Dashboard
          </Box>
        </NavLink>
        <Button fullWidth onClick={handleLogout} startIcon={<LogOut size={16} />}
          sx={{
            textTransform: 'none', justifyContent: 'flex-start',
            color: '#d32f2f', fontSize: '13px', borderRadius: 1, px: 2,
            '&:hover': { bgcolor: '#ffebee' }
          }}>
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar position="fixed" sx={{
          bgcolor: '#fff', boxShadow: 'none',
          borderBottom: '1px solid #e0e0e0',
          zIndex: theme.zIndex.drawer + 1
        }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#333' }}>
              <Menu size={24} />
            </IconButton>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E40AF' }}>
              {parishName}
            </Typography>
            <Box sx={{ width: 40 }} />
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH, boxSizing: 'border-box',
            }
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Box sx={{
          width: DRAWER_WIDTH, flexShrink: 0, background: '#fff',
          borderRight: '1px solid #e0e0e0',
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
          overflowY: 'auto'
        }}>
          {drawerContent}
        </Box>
      )}

      {/* Main content */}
      <Box sx={{
        flexGrow: 1,
        width: isMobile ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)`,
        ml: isMobile ? 0 : `${DRAWER_WIDTH}px`,
        mt: isMobile ? '56px' : 0,
        minHeight: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default ParishLayout;
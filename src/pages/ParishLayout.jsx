import React from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import {
  Box, Typography, Button, Divider
} from '@mui/material';
import { ClipboardList, Users, FileText, LogOut, Church } from 'lucide-react';
import { getParishName } from '../utils/parishAuth';

const navItems = [
  { path: '/parish/registration', label: 'Event Registration', icon: <ClipboardList size={18} /> },
  { path: '/parish/managers', label: 'Managers', icon: <Users size={18} /> },
  { path: '/parish/print', label: 'Print Registration', icon: <FileText size={18} /> },
];

const ParishLayout = ({ children }) => {
  const history = useHistory();
  const parishName = getParishName();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/parishlogin';
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box sx={{
        width: 240, flexShrink: 0,
        background: '#FFFFFF', borderRight: '1px solid #E8EBF0',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100
      }}>
        {/* Parish branding */}
        <Box sx={{ p: 2.5, borderBottom: '1px solid #E8EBF0' }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Church size={20} color="#5B4CD6" />
            <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#5B4CD6' }}>
              Parish Portal
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0F172A', lineHeight: 1.2, mt: 0.5 }}>
            {parishName}
          </Typography>
        </Box>

        {/* Nav links */}
        <Box sx={{ flex: 1, py: 1.5, px: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={{ textDecoration: 'none' }}
              activeStyle={{}}
            >
              {({ isActive }) => (
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 1.5, py: 1.2, borderRadius: '10px',
                  color: window.location.pathname === item.path ? '#5B4CD6' : '#64748B',
                  background: window.location.pathname === item.path ? 'rgba(91,76,214,0.06)' : 'transparent',
                  fontWeight: window.location.pathname === item.path ? 700 : 500,
                  fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s',
                  '&:hover': { background: 'rgba(91,76,214,0.04)', color: '#5B4CD6' }
                }}>
                  {item.icon}
                  {item.label}
                </Box>
              )}
            </NavLink>
          ))}
        </Box>

        {/* Logout */}
        <Box sx={{ p: 1.5, borderTop: '1px solid #E8EBF0' }}>
          <Button fullWidth onClick={handleLogout}
            startIcon={<LogOut size={16} />}
            sx={{
              textTransform: 'none', justifyContent: 'flex-start',
              color: '#EF4444', fontWeight: 600, fontSize: '13px',
              borderRadius: '10px', px: 1.5,
              '&:hover': { background: 'rgba(239,68,68,0.06)' }
            }}>
            Logout
          </Button>
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, ml: '240px', background: '#F8F9FC', minHeight: '100vh' }}>
        {children}
      </Box>
    </Box>
  );
};

export default ParishLayout;
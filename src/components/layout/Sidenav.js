import React,{ useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme, useMediaQuery } from '@mui/material';
import logo from "../../assets/images/diocese-logo-new5.webp";
import {
  Drawer,
  IconButton,
  ListItem,
  ListItemText,
  Typography,
  Box,
  ListSubheader,
  AppBar,
  Toolbar,
} from '@mui/material';
import { Menu } from 'lucide-react';
import { styled } from '@mui/material/styles';

const drawerWidth = 280;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    borderRight: '1px solid rgb(229, 231, 235)',
  },
}));

const LogoWrapper = styled(Box)({
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '& img': {
    width: '32px',
    height: 'auto',
  },
});

const StyledNavLink = styled(NavLink)({
  textDecoration: 'none',
  color: 'rgb(71, 84, 103)',
  '&.active': {
    '& .MuiListItem-root': {
      backgroundColor: 'rgb(245, 247, 250)',
      '& .MuiListItemText-primary': {
        color: 'rgb(66, 102, 242)',
        fontWeight: 500,
      },
    },
  },
});

const StyledListSubheader = styled(ListSubheader)({
  backgroundColor: 'transparent',
  color: 'rgb(156, 163, 175)',
  fontSize: '12px',
  fontWeight: 600,
  lineHeight: '16px',
  textTransform: 'uppercase',
  padding: '24px 8px 8px 8px',
  letterSpacing: '0.05em',
});

const StyledListItem = styled(ListItem)({
  borderRadius: '6px',
  marginBottom: '2px',
  height: '40px',
  padding: '0 12px',
  '&:hover': {
    backgroundColor: 'rgb(245, 247, 250)',
  },
});

const IconWrapper = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  marginRight: '12px',
  fontSize: '18px',
  color: 'rgb(107, 114, 128)', // Neutral icon color
});

const menuItems = [
  {
    type: 'single',
    path: '/',
    label: 'Dashboard',
    icon: '📈',
  },
  {
    type: 'header',
    label: 'MANAGE/CREATE',
    fold: true,
    items: [
      {
        type: 'single',
        path: '/forane',
        label: 'Manage Forane',
        icon: '🏢',
      },
      {
        type: 'single',
        path: '/Parish',
        label: 'Manage Parish',
        icon: '⛪',
      },
      {
        type: 'single',
        path: '/PersonManagement',
        label: 'Manage Category',
        icon: '🏷️',
      },
      {
        type: 'single',
        path: '/Family',
        label: 'Manage Event',
        icon: '🎉',
      }, 
      {
        type: 'single',
        path: '/FinanceSettings',
        label: 'Manage Venue',
        icon: '🏟️',
      }
    ]
  },
  ,
  // {
  //   type: 'header',
  //   label: 'STUDENTS PROFILE',
  //   fold: true,
  //   items: [
  //     {
  //       type: 'single',
  //       path: '/Student',
  //       label: 'Manage Students',
  //       icon: '🏢',
  //     },
  //     {
  //       type: 'single',
  //       path: '/Parish',
  //       label: 'Manage Parish',
  //       icon: '⛪',
  //     },
  //     {
  //       type: 'single',
  //       path: '/PersonManagement',
  //       label: 'Manage Category',
  //       icon: '🏷️',
  //     },
  //     {
  //       type: 'single',
  //       path: '/Family',
  //       label: 'Manage Event',
  //       icon: '🎉',
  //     }, 
  //     {
  //       type: 'single',
  //       path: '/FinanceSettings',
  //       label: 'Manage Venue',
  //       icon: '🏟️',
  //     }
  //   ]
  // },
  {
    type: 'header',
    label: 'REGISTRATION',
    fold: true,
    items: [
      {
        type: 'single',
        path: '/FamilyFinance',
        label: 'Manage Managers',
        icon: '👥',
      },
      {
        type: 'single',
        path: '/transactions',
        label: 'Registration',
        icon: '📝',
      },
      {
        type: 'single',
        path: '/report',
        label: 'Registration Print',
        icon: '🖨️',
      }
    ]
  },
  {
    type: 'header',
    label: 'OFFICE',
    fold: true,
    items: [
      {
        type: 'single',
        path: '/project',
        label: 'Score Entry',
        icon: '🏆',
      },
      {
        type: 'single',
        path: '/community',
        label: 'Stage Allocation',
        icon: '🎭',
      },
      {
        type: 'single',
        path: '/yearendtransfer',
        label: 'Judge Total Sheet',
        icon: '📊',
      },
      {
        type: 'single',
        path: '/family-print',
        label: 'Judge Sheet',
        icon: '📑',
      },
      {
        type: 'single',
        path: '/addopening',
        label: 'Venue Based  List',
        icon: '📍',
      }
      ,{
        type: 'single',
        path: '/participantList',
        label: 'Participant List',
        icon: '📋',
      },
      {
        type: 'single',
        path: '/registration-numbers',
        label: 'Registration Numbers',
        icon: '🔢',
      },
      {
        type: 'single',
        path: '/resultsDashboard',
        label: 'Results Dashboard',
        icon: '📊',
      }
    ]
  }
];

const Sidenav = ({ color }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [foldedSections, setFoldedSections] = useState({
    'MANAGE/CREATE': true,
    'REGISTRATION': true,
    'JUDGE': true
  });
  const { pathname } = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleSection = (label) => {
    setFoldedSections(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const drawer = (
    <>
      <LogoWrapper>
        <img src={logo} style={{width:'100%'}} alt="Diocese Logo" />
        <Typography
          variant="subtitle1"
          sx={{
            fontSize: '16px',
            fontWeight: 500,
            color: 'rgb(17, 24, 39)',
          }}
        >
        
        </Typography>
      </LogoWrapper>
      <Box sx={{ px: 2 }}>
        {menuItems.map((item, index) => (
          item.type === 'header' ? (
            <React.Fragment key={`header-${index}`}>
              <StyledListSubheader 
                onClick={() => item.fold && toggleSection(item.label)}
                sx={{ 
                  cursor: item.fold ? 'pointer' : 'default',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                {item.label}
                {item.fold && (
                  <span>
                    {foldedSections[item.label] ? '▼' : '▶'}
                  </span>
                )}
              </StyledListSubheader>
              
              {(!item.fold || !foldedSections[item.label]) && item.items && item.items.map((subItem) => (
                <StyledNavLink
                  key={subItem.path}
                  to={subItem.path}
                  onClick={isMobile ? handleDrawerToggle : undefined}
                >
                  <StyledListItem>
                    <IconWrapper>
                      {subItem.icon}
                    </IconWrapper>
                    <ListItemText
                      primary={subItem.label}
                      primaryTypographyProps={{
                        fontSize: '14px',
                        fontWeight: pathname === subItem.path ? 500 : 400,
                      }}
                    />
                  </StyledListItem>
                </StyledNavLink>
              ))}
            </React.Fragment>
          ) : (
            <StyledNavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? handleDrawerToggle : undefined}
            >
              <StyledListItem>
                <IconWrapper>
                  {item.icon}
                </IconWrapper>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '14px',
                    fontWeight: pathname === item.path ? 500 : 400,
                  }}
                />
              </StyledListItem>
            </StyledNavLink>
          )
        ))}
      </Box>
      <Box sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        width: drawerWidth, 
        borderTop: '1px solid rgb(229, 231, 235)',
        padding: '12px 16px',
        backgroundColor: '#fff',
        fontSize: '13px',
        color: 'rgb(156, 163, 175)'
      }}>
        
      </Box>
    </>
  );

  return (
    <>
      {isMobile && (
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 2,
            backgroundColor: '#ffffff',
            boxShadow: 'none',
            borderBottom: '1px solid rgb(229, 231, 235)'
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ color: 'rgb(17, 24, 39)' }}
            >
              <Menu size={24} />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}
      
      {isMobile ? (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <StyledDrawer 
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
          }}
        >
          {drawer}
        </StyledDrawer>
      )}
      {isMobile && <Toolbar />}
    </>
  );
};

export default Sidenav;
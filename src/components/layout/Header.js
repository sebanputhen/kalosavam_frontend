// import { useState } from 'react';
// import { NavLink } from 'react-router-dom';
// import {
//   Box,
//   Typography,
//   IconButton,
//   Avatar,
//   Menu,
//   MenuItem,
//   InputBase,
//   Badge,
//   Stack,
//   Breadcrumbs
// } from '@mui/material';
// import { styled } from '@mui/material/styles';
// import { 
//   Search as SearchIcon,
//   NotificationsNone as NotificationsIcon,
//   Settings as SettingsIcon,
//   KeyboardArrowDown as KeyboardArrowDownIcon,
//   NavigateNext as NavigateNextIcon
// } from '@mui/icons-material';
// import { UserCircle } from 'lucide-react';

// // Styled components
// const HeaderWrapper = styled(Box)(({ theme }) => ({
//   padding: '20px 0',
//   background: 'white',
//   boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
//   position: 'sticky',
//   top: 0,
//   zIndex: 1000,
//   backdropFilter: 'blur(8px)',
//   borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
// }));

// const PageTitle = styled(Typography)({
//   color: 'rgb(17, 24, 39)',
//   fontWeight: 600,
//   marginBottom: 0
// });

// const SearchWrapper = styled('div')({
//   position: 'relative',
//   borderRadius: '8px',
//   backgroundColor: '#f3f4f6',
//   '&:hover': {
//     backgroundColor: '#f9fafb',
//   },
//   width: 250,
//   display: 'flex',
//   alignItems: 'center'
// });

// const SearchIconWrapper = styled('div')({
//   padding: '0 12px',
//   height: '100%',
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   color: '#9ca3af'
// });

// const StyledInputBase = styled(InputBase)({
//   color: 'rgb(71, 84, 103)',
//   width: '100%',
//   '& .MuiInputBase-input': {
//     padding: '8px 12px 8px 0',
//     fontSize: '14px',
//     width: '100%',
//     '&::placeholder': {
//       color: '#9ca3af',
//       opacity: 1
//     }
//   }
// });

// const HeaderIconButton = styled(IconButton)({
//   width: 40,
//   height: 40,
//   borderRadius: 8,
//   backgroundColor: '#f3f4f6',
//   color: '#6b7280',
//   '&:hover': {
//     backgroundColor: '#e5e7eb',
//     color: '#374151'
//   }
// });

// const StyledBreadcrumb = styled(NavLink)({
//   color: '#6b7280',
//   fontSize: '13px',
//   textDecoration: 'none',
//   '&:hover': {
//     color: 'rgb(66, 102, 242)'
//   }
// });

// const UserAvatar = styled(Avatar)({
//   backgroundColor: 'rgb(66, 102, 242)',
//   width: 32,
//   height: 32,
//   cursor: 'pointer',
//   '&:hover': {
//     opacity: 0.9
//   }
// });

// const Header = ({ name, subName }) => {
//   const [anchorEl, setAnchorEl] = useState(null);
//   const [notificationEl, setNotificationEl] = useState(null);

//   const handleMenuOpen = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };

//   const handleNotificationOpen = (event) => {
//     setNotificationEl(event.currentTarget);
//   };

//   const handleNotificationClose = () => {
//     setNotificationEl(null);
//   };

//   const notifications = [
//     // {
//     //   id: 1,
//     //   message: 'New message from Sophie',
//     //   avatar: <Avatar sx={{ width: 24, height: 24 }}>S</Avatar>
//     // },
//     // {
//     //   id: 2,
//     //   message: 'New album by Travis Scott',
//     //   avatar: <Avatar sx={{ width: 24, height: 24, bgcolor: 'rgb(66, 102, 242)' }}>T</Avatar>
//     // },
//     // {
//     //   id: 3,
//     //   message: 'Payment completed',
//     //   avatar: <Avatar sx={{ width: 24, height: 24, bgcolor: 'rgb(34, 197, 94)' }}>$</Avatar>
//     // }
//   ];

//   return (
//     <HeaderWrapper>
//       <Box px={3} display="flex" justifyContent="space-between" alignItems="center">
//         {/* <Box>
//           <Breadcrumbs 
//             separator={<NavigateNextIcon sx={{ fontSize: 14, color: '#6b7280' }} />}
//             sx={{ mb: 1 }}
//           >
//             <StyledBreadcrumb to="/">
//               Pages
//             </StyledBreadcrumb>
//             <Typography color="#6b7280" fontSize="13px">
//               {name.replace("/", "")}
//             </Typography>
//           </Breadcrumbs> 
//           <PageTitle variant="h5">
//             {subName.replace("/", "")}
//           </PageTitle>
//         </Box> */}

//         <Stack direction="row" spacing={2} alignItems="center">
//            {/* <SearchWrapper>
//             <SearchIconWrapper>
//               <SearchIcon sx={{ fontSize: 20 }} />
//             </SearchIconWrapper>
//             <StyledInputBase
//               placeholder="Search..."
//               inputProps={{ 'aria-label': 'search' }}
//             />
//           </SearchWrapper> */}

//           {/* <Badge 
//             badgeContent={5} 
//             color="primary"
//             sx={{
//               '& .MuiBadge-badge': {
//                 backgroundColor: 'rgb(66, 102, 242)',
//                 color: 'white',
//                 fontSize: '10px',
//                 height: '16px',
//                 minWidth: '16px'
//               }
//             }}
//           >
//             <HeaderIconButton onClick={handleNotificationOpen}>
//               <NotificationsIcon sx={{ fontSize: 20 }} />
//             </HeaderIconButton>
//           </Badge> */}

//           {/* <HeaderIconButton>
//             <SettingsIcon sx={{ fontSize: 20 }} />
//           </HeaderIconButton> */}

//           <Box 
//             display="flex" 
//             alignItems="center" 
//             sx={{ cursor: 'pointer' }}
//             onClick={handleMenuOpen}
//           >
//             <UserAvatar>
//               <UserCircle size={20} />
//             </UserAvatar>
//             <KeyboardArrowDownIcon 
//               sx={{ 
//                 ml: 0.5, 
//                 fontSize: 20, 
//                 color: '#6b7280'
//               }} 
//             />
//           </Box>

//           <Menu
//             anchorEl={anchorEl}
//             open={Boolean(anchorEl)}
//             onClose={handleMenuClose}
//             PaperProps={{
//               sx: {
//                 mt: 1,
//                 boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
//                 borderRadius: '8px'
//               }
//             }}
//           >
//             {/* <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
//             <MenuItem onClick={handleMenuClose}>Settings</MenuItem> */}
//             <MenuItem onClick={handleMenuClose}>Sign out</MenuItem>
//           </Menu>

//           <Menu
//             anchorEl={notificationEl}
//             open={Boolean(notificationEl)}
//             onClose={handleNotificationClose}
//             PaperProps={{
//               sx: {
//                 mt: 1,
//                 width: 320,
//                 boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
//                 borderRadius: '8px'
//               }
//             }}
//           >
//             {notifications.map((notification) => (
//               <MenuItem 
//                 key={notification.id} 
//                 onClick={handleNotificationClose}
//                 sx={{ 
//                   py: 1.5,
//                   '&:hover': {
//                     backgroundColor: '#f9fafb'
//                   }
//                 }}
//               >
//                 <Box display="flex" alignItems="center" gap={1.5}>
//                   {notification.avatar}
//                   <Typography variant="body2" color="rgb(17, 24, 39)">
//                     {notification.message}
//                   </Typography>
//                 </Box>
//               </MenuItem>
//             ))}
//           </Menu>
//         </Stack>
//       </Box>
//     </HeaderWrapper>
//   );
// };

// export default Header;

import React,{ useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  InputBase,
  Badge,
  Stack,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import axiosInstance from '../../axiosConfig';
import { styled } from '@mui/material/styles';
import { 
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { UserCircle } from 'lucide-react';

// Styled components remain the same
const HeaderWrapper = styled(Box)(({ theme }) => ({
  padding: '20px 0',
  background: 'white',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  backdropFilter: 'blur(8px)',
  borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
}));

const UserAvatar = styled(Avatar)({
  backgroundColor: 'rgb(66, 102, 242)',
  width: 32,
  height: 32,
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.9
  }
});

// Add styled component for the logout link
const StyledLink = styled('a')({
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  width: '100%',
});

const Header = ({ name, subName }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      await axiosInstance.post('/auth/logout');
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Reset axios headers
      delete axiosInstance.defaults.headers.common['Authorization'];
      
      // Redirect to login
      window.location.href = '/home';
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage and redirect even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/home';
    }
  };
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <HeaderWrapper>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Logout"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to logout?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogout} color="primary" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
      <Box px={3} display="flex" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={2} alignItems="center">
          <Box 
            display="flex" 
            alignItems="center" 
            sx={{ cursor: 'pointer' }}
            onClick={handleMenuOpen}
          >
            <UserAvatar>
              <UserCircle size={20} />
            </UserAvatar>
            <KeyboardArrowDownIcon 
              sx={{ 
                ml: 0.5, 
                fontSize: 20, 
                color: '#6b7280'
              }} 
            />
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '8px'
              }
            }}
          >
            <MenuItem onClick={handleMenuClose}>
              <StyledLink onClick={handleClickOpen}>
                Sign out
              </StyledLink>
            </MenuItem>
          </Menu>
        </Stack>
      </Box>
    </HeaderWrapper>
  );
};

export default Header;
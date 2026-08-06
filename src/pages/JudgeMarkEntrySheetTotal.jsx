import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';
import axiosInstance from "../axiosConfig";

const printStyles = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    .no-print { display: none !important; }
    nav, header, footer, aside,
    .MuiDrawer-root, .MuiAppBar-root,
    .sidebar, .navbar, .topbar,
    [class*="Sidebar"], [class*="Navbar"], [class*="AppBar"],
    [class*="drawer"], [class*="header"] {
      display: none !important;
    }
    .print-area {
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 10px !important;
      box-shadow: none !important;
    }
    .print-area * {
      visibility: visible !important;
    }
  }
`;
const JudgeMarkEntrySheet = () => {
  const [foranes, setForanes] = useState([]);
  const [selectedForane, setSelectedForane] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState('');

  useEffect(() => {
    const fetchForanes = async () => {
      try {
        const response = await axiosInstance.get('/forane');
        setForanes(response.data || []);
      } catch (error) {
        console.error('Error fetching foranes:', error);
      }
    };
    fetchForanes();
  }, []);

  useEffect(() => {
    const fetchVenues = async () => {
      if (!selectedForane) return;
      try {
        const response = await axiosInstance.get(`/venues/parish/${selectedForane}`);
        setVenues(response.data.data || []);
        setSelectedVenue('');
        setSelectedEvent('');
        setEvents([]);
      } catch (error) {
        console.error('Error fetching venues:', error);
      }
    };
    fetchVenues();
  }, [selectedForane]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedForane || !selectedVenue) return;
      try {
        const response = await axiosInstance.get(`/allocations/forane/${selectedForane}/venue/${selectedVenue}`);
        setEvents(response.data?.data || []);
        setSelectedEvent('');
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      }
    };
    fetchEvents();
  }, [selectedForane, selectedVenue]);

  const numberOfEntries = 14;
  const selectedEventData = events.find(e => e._id === selectedEvent);
  const foraneName = foranes.find(f => f._id === selectedForane)?.name || '';
  const venueName = venues.find(v => v._id === selectedVenue)?.name || '';

  const cellStyle = {
    border: '1px solid black',
    padding: '4px 6px',
    textAlign: 'center',
    fontSize: '13px',
  };

  const headerCellStyle = {
    ...cellStyle,
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
  };

  return (
    <>
      <style>{printStyles}</style>
      <Container maxWidth="md">
        {/* Filters - hidden on print */}
        <Box className="no-print" sx={{ py: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Forane</InputLabel>
                <Select value={selectedForane} label="Select Forane" onChange={(e) => setSelectedForane(e.target.value)}>
                  {foranes.map((f) => (
                    <MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Venue</InputLabel>
                <Select value={selectedVenue} label="Select Venue" onChange={(e) => setSelectedVenue(e.target.value)} disabled={!selectedForane}>
                  {venues.map((v) => (
                    <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Event</InputLabel>
                <Select value={selectedEvent} label="Select Event" onChange={(e) => setSelectedEvent(e.target.value)} disabled={!selectedVenue}>
                  {events.length > 0 ? events.map((event) => (
                    <MenuItem key={event._id} value={event._id}>
                      {event.eventName} ({event.section}, {event.gender}, {event.eventType})
                    </MenuItem>
                  )) : <MenuItem disabled>No events available</MenuItem>}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {selectedEvent && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="contained" onClick={() => window.print()}>Print Mark Sheet</Button>
            </Box>
          )}
        </Box>

        {/* Printable Sheet */}
        {selectedEvent && (
  <Box className="print-area" sx={{ p: 2, fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <Box textAlign="center" mb={1}>
              <Typography sx={{ fontSize: '20px', fontWeight: 'bold' }}>
                സൺഡേസ്കൂൾ കലോത്സവം
              </Typography>
              <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>
                {foraneName} ഫൊറോന 2026
              </Typography>
            </Box>

            {/* Event & Section row */}
            <Box display="flex" justifyContent="space-between" mb={1.5} px={1}>
              <Typography sx={{ fontSize: '14px' }}>
                <strong>മത്സരയിനം:</strong> {selectedEventData?.eventName || ''}
              </Typography>
              <Typography sx={{ fontSize: '14px' }}>
                <strong>വിഭാഗം:</strong> {selectedEventData?.section || ''}
              </Typography>
            </Box>

            {/* Main Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ ...headerCellStyle, width: '40px' }}>No</th>
                  <th rowSpan={2} style={{ ...headerCellStyle, width: '70px' }}>Chest No</th>
                  <th colSpan={3} style={headerCellStyle}>Mark details</th>
                  <th rowSpan={2} style={{ ...headerCellStyle, width: '70px' }}>Total Mark</th>
                  <th rowSpan={2} style={headerCellStyle}>Remarks</th>
                </tr>
                <tr>
                  <th style={{ ...headerCellStyle, width: '70px' }}>Judge 1</th>
                  <th style={{ ...headerCellStyle, width: '70px' }}>Judge 2</th>
                  <th style={{ ...headerCellStyle, width: '70px' }}>Judge 3</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(numberOfEntries)].map((_, i) => (
                  <tr key={i}>
                    <td style={cellStyle}>{i + 1}</td>
                    <td style={{ ...cellStyle, height: '28px' }}></td>
                    <td style={cellStyle}></td>
                    <td style={cellStyle}></td>
                    <td style={cellStyle}></td>
                    <td style={cellStyle}></td>
                    <td style={cellStyle}></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Result & Grade Section */}
            <Box display="flex" gap={4} mb={2}>
              {/* Result */}
              <Box>
                <table style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th colSpan={2} style={{ ...headerCellStyle, fontSize: '15px' }}>Result & Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['1st', '2nd', '3rd'].map((pos) => (
                      <tr key={pos}>
                        <td style={{ ...cellStyle, width: '40px', fontWeight: 'bold' }}>{pos}</td>
                        <td style={{ ...cellStyle, width: '550px', height: '26px' }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>

              {/* Grade */}
              {/* <Box sx={{ ml: 'auto' }}>
                <table style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th colSpan={2} style={{ ...headerCellStyle, fontSize: '15px' }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['A', 'B', 'C'].map((grade) => (
                      <tr key={grade}>
                        <td style={{ ...cellStyle, width: '40px', fontWeight: 'bold' }}>{grade}</td>
                        <td style={{ ...cellStyle, width: '200px', height: '26px' }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box> */}
            </Box>

            {/* Judge Signature Section */}
            <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '16px' }}>
              <thead>
                <tr>
                  <th style={{ ...headerCellStyle, width: '80px' }}>ക്രമനമ്പർ</th>
                  <th style={headerCellStyle}>ജഡ്ജിന്റെ പേരും ഒപ്പും</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((n) => (
                  <tr key={n}>
                    <td style={{ ...cellStyle, fontWeight: 'bold' }}>{n}</td>
                    <td style={{ ...cellStyle, height: '30px' }}></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Checked by */}
            <Typography sx={{ fontSize: '13px', mt: 2 }}>
              Checked by: ___________________________________________
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
};

export default JudgeMarkEntrySheet;
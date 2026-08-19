import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import axiosInstance from "../axiosConfig";
import { getParishId } from '../utils/parishAuth';
import { useFinancialYear } from './FinancialYearContext';
import { Printer, Users, Calendar, Award, FileText, Layers } from 'lucide-react';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', light: '#3B82F6', dark: '#1E40AF' },
    secondary: { main: '#10B981', light: '#34D399', dark: '#047857' },
    info: { main: '#6366F1', light: '#818CF8', dark: '#4F46E5' },
    warning: { main: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
    background: { default: '#F0F4F8', paper: '#FFFFFF' }
  },
  typography: { fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif' },
  shape: { borderRadius: 12 },
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

const SECTION_CONFIG = {
  'Dominic Savio': { label: 'Classes IV-VI', section: 'Dominic Savio Section' },
  'Alphonsa': { label: 'Classes VII-IX', section: 'Alphonsa Section' },
  'Saint Thomas': { label: 'Classes X-XII', section: 'Saint Thomas  Section' }
};

const SECTION_COLORS = {
  'Dominic Savio': '#2563EB',
  'Alphonsa': '#10B981',
  'Saint Thomas': '#6366F1',
};

const ROWS_PER_PAGE = 20;

const EventRegistrationPrintPage = () => {
  const [parishes, setParishes] = useState([]);
  const [selectedParish, setSelectedParish] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [participants, setParticipants] = useState([]);
  const [sectionDetails, setSectionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedYear1: currentYear } = useFinancialYear();
  const [managers, setManagers] = useState([]);
  const [parishDetails, setParishDetails] = useState(null);
  const [eventColumns, setEventColumns] = useState([]);
  const [allSectionEvents, setAllSectionEvents] = useState([]);

  useEffect(() => {
    const fetchParishes = async () => {
      try {
        const response = await axiosInstance.get("/parish");
        const filtered = (response.data || []).filter(
          (p) => p.forane === "673799a3cb9b4aa181e53fa2" || p.forane?._id === "673799a3cb9b4aa181e53fa2"
        );
        setParishes(filtered);
      } catch (error) {
        console.error("Error fetching parishes:", error);
      }
    };
    fetchParishes();
  }, []);

  useEffect(() => {
    const pid = getParishId();
    if (pid) setSelectedParish(pid);
  }, []);

  useEffect(() => {
    const fetchSectionEvents = async () => {
      if (!selectedSection) {
        setAllSectionEvents([]);
        return;
      }
      try {
        const response = await axiosInstance.get(`/events/section/${encodeURIComponent(selectedSection)}`);
        const events = response.data.data.events || [];
        setAllSectionEvents(events.map(event => ({
          id: event._id,
          name: event.eventName,
          category: event.category?.name || 'Uncategorized'
        })));
      } catch (error) {
        console.error("Error fetching section events:", error);
        setAllSectionEvents([]);
      }
    };
    fetchSectionEvents();
  }, [selectedSection]);

  useEffect(() => {
    const fetchParishDetails = async () => {
      if (!selectedParish) return;
      try {
        const response = await axiosInstance.get(`/parish/${selectedParish}`);
        setParishDetails(response.data);
      } catch (error) {
        console.error("Error fetching parish details:", error);
        setParishDetails(null);
      }
    };
    fetchParishDetails();
  }, [selectedParish]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedParish) return;
      try {
        setIsLoading(true);
        const encodedSection = selectedSection
          ? encodeURIComponent(selectedSection)
          : 'all';
        const sectionApiPath = `/registrations/parish/${selectedParish}/sections/${encodedSection}`;
        const sectionResponse = await axiosInstance.get(sectionApiPath);
        setSectionDetails(sectionResponse.data.data.sectionDetails);
        const registrationsResponse = await axiosInstance.get(`/registrations/parish/${selectedParish}`);
        const registrations = registrationsResponse.data.data.registrations || [];
        setParticipants(processRegistrations(registrations));
        setEventColumns(extractEventColumns(registrations));
      } catch (error) {
        console.error("Error fetching registration data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedParish, selectedSection]);

  const extractEventColumns = (registrations) => {
    const eventColumnMap = registrations.reduce((acc, reg) => {
      if (reg.event && reg.event.eventName) {
        acc[reg.event.eventName] = reg.event;
      }
      return acc;
    }, {});
    return Object.values(eventColumnMap).map(event => ({
      id: event._id,
      name: event.eventName,
      category: event.category?.name || 'Uncategorized'
    }));
  };

  useEffect(() => {
    const fetchManagerData = async () => {
      if (!selectedParish || !selectedSection) return;
      try {
        const response = await axiosInstance.get(`/managers/parish/${selectedParish}/section/${selectedSection}`);
        const sectionData = response.data[0];
        setManagers(sectionData?.managers?.length > 0 ? sectionData.managers : []);
      } catch (error) {
        console.error("Error fetching manager:", error);
        setManagers([]);
      }
    };
    fetchManagerData();
  }, [selectedParish, selectedSection]);

  // const processRegistrations = (registrations) => {
  //   const groupedParticipants = {};
  //   registrations.forEach(reg => {
  //     const participantKey = `${reg.name}|${reg.standard}|${reg.gender}|${new Date(reg.dob).toISOString().split('T')[0]}`;
  //     if (!groupedParticipants[participantKey]) {
  //       groupedParticipants[participantKey] = {
  //         name: reg.name,
  //         standard: reg.standard,
  //         gender: reg.gender,
  //         dob: reg.dob,
  //         section: reg.section,
  //         events: []
  //       };
  //     }
  //     groupedParticipants[participantKey].events.push({
  //       eventId: reg.event._id,
  //       eventName: reg.event.eventName,
  //       category: reg.event.category?.name || 'Uncategorized'
  //     });
  //   });
  //   return Object.values(groupedParticipants)
  //     .filter(p => !selectedSection || p.section === selectedSection)
  //     .sort((a, b) => a.name.localeCompare(b.name));
  // };
const processRegistrations = (registrations) => {
  const groupedParticipants = {};
  registrations.forEach(reg => {
    const eventSection = reg.event?.section || reg.section;
    const participantKey = `${reg.name}|${reg.standard}|${reg.gender}|${new Date(reg.dob).toISOString().split('T')[0]}|${eventSection}`;
    if (!groupedParticipants[participantKey]) {
      const isCross = reg.section !== eventSection;
      groupedParticipants[participantKey] = {
        name: reg.name,
        standard: reg.standard,
        gender: reg.gender,
        dob: reg.dob,
        section: eventSection,
        originalSection: reg.section,
        isCrossSectionParticipation: isCross,
        events: []
      };
    }
    groupedParticipants[participantKey].events.push({
      eventId: reg.event._id,
      eventName: reg.event.eventName,
      category: reg.event.category?.name || 'Uncategorized'
    });
  });
  return Object.values(groupedParticipants)
    .filter(p => !selectedSection || p.section === selectedSection)
    .sort((a, b) => a.name.localeCompare(b.name));
};
  const getCurrentSectionText = () => {
    if (!selectedSection) return '';
    return SECTION_CONFIG[selectedSection]?.section || '';
  };

  const displayEventColumns = (allSectionEvents.length > 0 ? allSectionEvents : eventColumns)
    .sort((a, b) => (a.category || '').localeCompare(b.category || ''));

  const displayCategoryColumns = useMemo(() => {
    const catMap = {};
    displayEventColumns.forEach(e => {
      const cat = e.category || 'Uncategorized';
      if (!catMap[cat]) catMap[cat] = { name: cat, eventNames: [] };
      catMap[cat].eventNames.push(e.name);
    });
    return Object.values(catMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [displayEventColumns]);

  const maleCount = participants.filter(p => p.gender === 'M').length;
  const femaleCount = participants.filter(p => p.gender === 'F').length;

  const statisticsCards = [
    { title: 'Participants', value: participants.length, color: '#2563EB', icon: <Users size={24} /> },
    { title: 'Boys', value: maleCount, color: '#6366F1', icon: <Users size={24} /> },
    { title: 'Girls', value: femaleCount, color: '#10B981', icon: <Users size={24} /> },
    // { title: 'Categories', value: displayCategoryColumns.length, color: '#F59E0B', icon: <Calendar size={24} /> },
  ];

  const totalRows = Math.max(ROWS_PER_PAGE, participants.length);
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);

  const buildPrintHTML = () => {
    let html = '';

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const startRow = pageIdx * ROWS_PER_PAGE;

      html += `${pageIdx > 0 ? '<div style="page-break-before: always; break-before: page;"></div>' : ''}`;

      html += `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="flex: 1;"></div>
          <div style="flex: 2; text-align: center;">
            <h4 style="font-size: 16px; font-weight: bold; margin: 0;">ഫൊറോന കലോത്സവം ${currentYear}</h4>
            <span style="display: inline-block; border: 2px solid black; border-radius: 20px; padding: 2px 16px; font-weight: bold; font-size: 14px; margin-top: 4px;">
              ${getCurrentSectionText()}
            </span>
          </div>
          <div style="flex: 1; text-align: left;">
            <div style="font-weight: bold; white-space: nowrap; font-size: 12px;">TEAM MANAGERS</div>
            ${managers.length > 0
              ? managers.map((m, i) => `<div style="font-size: 12px; line-height: 1.6;">${i + 1}) ${m.name}<br/>&nbsp;&nbsp;&nbsp;&nbsp;${m.contactNumber}</div>`).join('')
              : '<div style="font-size: 12px;">-</div>'
            }
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
          <div style="flex: 1; text-align: left;">PARISH: ${parishDetails?.name || '_______________'}</div>
          <div style="flex: 1; text-align: center;">FORANE: PONKUNNAM</div>
          <div style="flex: 1;"></div>
        </div>
      `;

      html += `<table style="font-size: 10px; width: 100%; border-collapse: collapse;">`;
      html += `<thead><tr>`;
      html += `<th style="border: 1px solid black; padding: 3px; width: 30px;">
        <div style="writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg); white-space: nowrap; height: 50px; display: flex; align-items: center; justify-content: center;">Sl No.</div>
      </th>`;
      html += `<th style="border: 1px solid black; padding: 3px; width: 30px;">
        <div style="writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg); white-space: nowrap; height: 50px; display: flex; align-items: center; justify-content: center;">Chess No.</div>
      </th>`;
      html += `<th style="border: 1px solid black; padding: 3px;">Name & house Name in Sunday School Register</th>`;
      html += `<th style="border: 1px solid black; padding: 3px;">Class</th>`;
      html += `<th style="border: 1px solid black; padding: 3px;">Gender (M/F)</th>`;
      html += `<th style="border: 1px solid black; padding: 3px;">Dob</th>`;

      displayCategoryColumns.forEach(cat => {
        html += `<th style="border: 1px solid black; padding: 0; width: 40px;">
          <div style="writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg); white-space: nowrap; padding: 4px; height: 100px; display: flex; align-items: center; justify-content: center;">${cat.name}</div>
        </th>`;
      });
      html += `</tr></thead>`;

      html += `<tbody>`;
      for (let rowIdx = 0; rowIdx < ROWS_PER_PAGE; rowIdx++) {
        const globalIdx = startRow + rowIdx;
        const p = participants[globalIdx];
        const dob = p ? new Date(p.dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
        const crossBadge = p?.isCrossSectionParticipation
          ? ` <span style="background: #FEF3C7; color: #D97706; border: 1px solid #F59E0B; border-radius: 4px; padding: 1px 4px; font-size: 8px; margin-left: 4px;">From ${p.originalSection} Section</span>`
          : '';
        html += `<tr style="height: 22px;">`;
        html += `<td style="border: 1px solid black; padding: 3px; text-align: center;">${globalIdx + 1}</td>`;
        html += `<td style="border: 1px solid black; padding: 3px; text-align: center;"></td>`;
        html += `<td style="border: 1px solid black; padding: 3px; text-align: center;">${(p?.name || '')}${crossBadge}</td>`;
        html += `<td style="border: 1px solid black; padding: 3px; text-align: center;">${p?.standard || ''}</td>`;
        html += `<td style="border: 1px solid black; padding: 3px; text-align: center;">${p?.gender || ''}</td>`;
        html += `<td style="border: 1px solid black; padding: 3px; text-align: center;">${dob}</td>`;

        displayCategoryColumns.forEach(cat => {
          const hasEvent = p?.events?.some(e => cat.eventNames.includes(e.eventName));
          html += `<td style="border: 1px solid black; padding: 3px; text-align: center;">${hasEvent ? 'X' : ''}</td>`;
        });
        html += `</tr>`;
      }
      html += `</tbody></table>`;

      html += `
        <div style="display: flex; justify-content: space-between; margin-top: 25px; font-size: 12px;">
          <div>തിയ്യതി: _______________</div>
          <div>സ്റ്റാഫ് സെക്രട്ടറി: _______________</div>
          <div>ഡയറക്ടർ: _______________</div>
        </div>
      `;
    }

    return html;
  };

  const handlePrint = () => {
    const content = buildPrintHTML();
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
      <head>
        <title>Print Registration</title>
        <style>
          @page { size: A4 landscape; margin: 5mm; }
          * { font-family: Arial, sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 100%; }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

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
                    Registration Print
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Preview and print event registration forms
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Printer size={18} />}
                  onClick={handlePrint}
                  disabled={!selectedParish || !selectedSection}
                  sx={{
                    borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3,
                    boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
                  }}
                >
                  Print Registration
                </Button>
              </PageHeader>
            </Grid>

            {/* Parish Selector */}
            {!getParishId() && (
              <Grid item xs={12} sm={6} md={4}>
                <StyledCard>
                  <StyledCardContent>
                    <FormControl fullWidth>
                      <InputLabel>Select Parish</InputLabel>
                      <Select
                        value={selectedParish}
                        label="Select Parish"
                        onChange={(e) => setSelectedParish(e.target.value)}
                      >
                        {parishes.map((p) => (
                          <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </StyledCardContent>
                </StyledCard>
              </Grid>
            )}

            {/* Section Selector */}
            <Grid item xs={12} sm={6} md={4}>
              <StyledCard>
                <StyledCardContent>
                  <FormControl fullWidth>
                    <InputLabel>Filter by Section</InputLabel>
                    <Select
                      value={selectedSection}
                      label="Filter by Section"
                      onChange={(e) => setSelectedSection(e.target.value)}
                    >
                      <MenuItem value="">All Sections</MenuItem>
                      {Object.keys(SECTION_CONFIG).map((s) => (
                        <MenuItem key={s} value={s}>{s} ({SECTION_CONFIG[s].label})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </StyledCardContent>
              </StyledCard>
            </Grid>

            {/* Stat Cards */}
            {selectedParish && !isLoading && statisticsCards.map((stat, index) => (
              <Grid item xs={6} sm={3} key={index}>
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

            {/* Team Managers Card */}
            {selectedSection && managers.length > 0 && (
              <Grid item xs={12} sm={6} md={4}>
                <ChartCard sx={{ height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <IconBox color="#6366F1" sx={{ width: 40, height: 40, borderRadius: 10 }}>
                      <Award size={20} />
                    </IconBox>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                      Team Managers
                    </Typography>
                  </Box>
                  {managers.map((manager, index) => (
                    <Box key={index} sx={{
                      mb: 1.5, p: 1.5, borderRadius: 2,
                      bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)'
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{manager.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{manager.contactNumber}</Typography>
                    </Box>
                  ))}
                </ChartCard>
              </Grid>
            )}

            {/* Section Cards when no section selected */}
            {selectedParish && !selectedSection && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c', mb: 1 }}>
                    Select a section to print
                  </Typography>
                </Grid>
                {Object.entries(SECTION_CONFIG).map(([section, config]) => {
                  const sColor = SECTION_COLORS[section];
                  const count = participants.filter(p => p.section === section).length;
                  return (
                    <Grid item xs={12} sm={4} key={section}>
                      <StyledCard
                        sx={{ cursor: 'pointer', '&:hover': { borderColor: sColor } }}
                        onClick={() => setSelectedSection(section)}
                      >
                        <StyledCardContent>
                          <StatWrapper>
                            <Box>
                              <Typography variant="subtitle1" sx={{
                                color: 'text.secondary', fontSize: '0.875rem', fontWeight: 600,
                                textTransform: 'uppercase', letterSpacing: '0.1em'
                              }}>{section}</Typography>
                              <StatValue>{count}</StatValue>
                              <Typography variant="caption" color="textSecondary">{config.label}</Typography>
                            </Box>
                            <IconBox color={sColor}><Layers size={24} /></IconBox>
                          </StatWrapper>
                        </StyledCardContent>
                      </StyledCard>
                    </Grid>
                  );
                })}
              </>
            )}
          </Grid>

          {/* Print Preview */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
              <CircularProgress />
            </Box>
          ) : selectedParish && selectedSection ? (
            <>
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                  Print Preview
                </Typography>
              </Box>

              <ChartCard sx={{ p: 3 }}>
                {Array.from({ length: totalPages }).map((_, pageIdx) => {
                  const startRow = pageIdx * ROWS_PER_PAGE;
                  const isLastPage = pageIdx === totalPages - 1;

                  return (
                    <Box key={pageIdx}>
                      {pageIdx > 0 && (
                        <Box sx={{ my: 3, borderTop: '3px dashed #ccc', position: 'relative' }}>
                          <Chip
                            label="Page Break"
                            size="small"
                            sx={{
                              position: 'absolute', top: -12, left: '50%',
                              transform: 'translateX(-50%)', bgcolor: '#f0f0f0', fontSize: '11px'
                            }}
                          />
                        </Box>
                      )}

                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box sx={{ flex: 1 }} />
                        <Box textAlign="center" sx={{ flex: 2 }}>
                          <Typography variant="h4" fontWeight="bold">
                            ഫൊറോന കലോത്സവം {currentYear}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              display: 'inline-block', border: '2px solid black',
                              borderRadius: '20px', px: 2, py: 0.2, fontWeight: 'bold'
                            }}
                          >
                            {getCurrentSectionText()}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                          <Typography variant="body2" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>
                            TEAM MANAGERS
                          </Typography>
                          {managers.length > 0
                            ? managers.map((manager, index) => (
                                <Typography key={index} variant="body2" sx={{ lineHeight: 1.6 }}>
                                  {index + 1}) {manager.name}<br />
                                  &nbsp;&nbsp;&nbsp;&nbsp;{manager.contactNumber}
                                </Typography>
                              ))
                            : <Typography variant="body2">-</Typography>
                          }
                        </Box>
                      </Box>

                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" sx={{ flex: 1, textAlign: 'left' }}>
                          PARISH: {parishDetails?.name || '_______________'}
                        </Typography>
                        <Typography variant="body2" sx={{ flex: 1, textAlign: 'center' }}>
                          FORANE: PONKUNNAM
                        </Typography>
                        <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}></Typography>
                      </Box>

                      <Box sx={{ mb: 1 }}>
                        <Chip
                          label={`Page ${pageIdx + 1} of ${totalPages}`}
                          size="small"
                          sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 600 }}
                        />
                      </Box>

                      <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                        <Table sx={{
                          minWidth: 650, border: '1px solid black',
                          '& th, & td': { border: '1px solid black', padding: '4px', textAlign: 'center' }
                        }}>
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                              <TableCell sx={{ width: '30px', padding: '0' }}>
                                <div style={{
                                  writingMode: 'vertical-rl', textOrientation: 'mixed',
                                  transform: 'rotate(180deg)', whiteSpace: 'nowrap',
                                  padding: '4px', height: '50px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>Sl No.</div>
                              </TableCell>
                              <TableCell sx={{ width: '30px', padding: '0' }}>
                                <div style={{
                                  writingMode: 'vertical-rl', textOrientation: 'mixed',
                                  transform: 'rotate(180deg)', whiteSpace: 'nowrap',
                                  padding: '4px', height: '50px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  width: '60px'
                                }}>Chess No.</div>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Name & house Name in Sunday School Register</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Gender (M/F)</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Dob</TableCell>
                              {displayCategoryColumns.map((cat, idx) => (
                                <TableCell key={idx} sx={{ width: '50px', padding: '0' }}>
                                  <div style={{
                                    writingMode: 'vertical-rl', textOrientation: 'mixed',
                                    transform: 'rotate(180deg)', whiteSpace: 'nowrap',
                                    padding: '4px', height: '100px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}>{cat.name}</div>
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Array.from({ length: ROWS_PER_PAGE }).map((_, rowIdx) => {
                              const globalIdx = startRow + rowIdx;
                              const participant = participants[globalIdx];
                              return (
                                <TableRow key={rowIdx} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                  <TableCell>{globalIdx + 1}</TableCell>
                                  <TableCell></TableCell>
                                  <TableCell sx={{ fontWeight: 500 }}>
                                    {participant?.name || ''}
                                    {participant?.isCrossSectionParticipation && (
                                      <Chip size="small" label={`From ${participant.originalSection} Section`}
                                        sx={{
                                          ml: 1, fontSize: '0.6rem', height: 18,
                                          bgcolor: '#F59E0B15', color: '#D97706',
                                          border: '1px solid #F59E0B30', fontWeight: 600
                                        }} />
                                    )}
                                  </TableCell>
                                  <TableCell>{participant?.standard || ''}</TableCell>
                                  <TableCell>{participant?.gender || ''}</TableCell>
                                  <TableCell>
                                    {participant
                                      ? new Date(participant.dob).toLocaleDateString('en-GB', {
                                          day: '2-digit', month: '2-digit', year: 'numeric'
                                        })
                                      : ''
                                    }
                                  </TableCell>
                                  {displayCategoryColumns.map((cat, idx) => (
                                    <TableCell key={idx}>
                                      {participant?.events?.some(e => cat.eventNames.includes(e.eventName)) ? 'X' : ''}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Box mt={1} display="flex" justifyContent="space-between">
                        <Typography variant="body2">തിയ്യതി: _______________</Typography>
                        <Typography variant="body2">സ്റ്റാഫ് സെക്രട്ടറി: _______________</Typography>
                        <Typography variant="body2">ഡയറക്ടർ: _______________</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </ChartCard>
            </>
          ) : !selectedParish ? (
            <Box sx={{ mt: 3 }}>
              <ChartCard sx={{ textAlign: 'center', py: 6 }}>
                <FileText size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
                <Typography color="textSecondary" sx={{ fontSize: '1.05rem' }}>
                  Select a parish to view registration details
                </Typography>
              </ChartCard>
            </Box>
          ) : null}
        </Container>
      </DashboardContainer>
    </ThemeProvider>
  );
};

export default EventRegistrationPrintPage;
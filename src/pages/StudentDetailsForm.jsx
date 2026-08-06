import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Modal,
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  FileDown,
  X,
  Search
} from 'lucide-react';
import axiosInstance from "../axiosConfig";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

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
  
  // Modal style
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxWidth: 900,
    maxHeight: '90vh',
    overflow: 'auto',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };
  

const StudentDetailsForm = () => {
  // State for dropdowns and form
  const [foranes, setForanes] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [classes, setClasses] = useState([
    'I','II','III','IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
  ]);
  const [divisions, setDivisions] = useState(['A', 'B', 'C']);

  // Selected values for filtering
  const [selectedForane, setSelectedForane] = useState('');
  const [selectedParish, setSelectedParish] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');

  // Students list and loading state
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Show inactive students toggle
  const [showInactive, setShowInactive] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const searchTypeOptions = [
    { value: 'all', label: 'All Fields' },
    { value: 'name', label: 'Name' },
    { value: 'admissionNo', label: 'Admission No' },
    { value: 'phone', label: 'Phone' },
    { value: 'email', label: 'Email' },
    { value: 'fatherName', label: 'Father Name' },
    { value: 'motherName', label: 'Mother Name' },
    { value: 'baptismName', label: 'Baptism Name' }
  ];
  // Form data state for adding/editing student
  const [formData, setFormData] = useState({
    forane: '',
    parish: '',
    class: '',
    division: '',
    studentName: '',
    baptismName: '',
    houseName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    dateOfBaptism: '',
    dateOfConfirmation: '',
    fatherName: '',
    fatherBaptismName: '',
    motherName: '',
    motherBaptismName: '',
    admissionNo: '',
    image: null
  });

  // Filtered parishes based on selected forane
  const [filteredParishes, setFilteredParishes] = useState([]);
  const filteredStudents = useMemo(() => {
    if (!students.length) return [];

    return students.filter(student => {
      const searchString = searchTerm.toLowerCase().trim();
      
      // If no search term, return all students
      if (!searchString) return true;

      // Helper function to check if a field matches the search term
      const matchesSearch = (field) => 
        field && field.toString().toLowerCase().includes(searchString);

      // Search logic based on search type
      switch(searchType) {
        case 'name':
          return matchesSearch(student.name);
        case 'admissionNo':
          return matchesSearch(student.admissionNo);
        case 'phone':
          return matchesSearch(student.phone);
        case 'email':
          return matchesSearch(student.email);
        case 'fatherName':
          return matchesSearch(student.fatherName);
        case 'motherName':
          return matchesSearch(student.motherName);
        case 'baptismName':
          return matchesSearch(student.baptismName);
        case 'all':
        default:
          return (
            matchesSearch(student.name) ||
            matchesSearch(student.admissionNo) ||
            matchesSearch(student.phone) ||
            matchesSearch(student.email) ||
            matchesSearch(student.fatherName) ||
            matchesSearch(student.motherName) ||
            matchesSearch(student.baptismName)
          );
      }
    });
  }, [students, searchTerm, searchType]);
  // Fetch foranes when component mounts
  useEffect(() => {
    fetchForanes();
  }, []);

  // Fetch parishes when forane is selected
  useEffect(() => {
    if (selectedForane) {
      fetchParishes(selectedForane);
    }
  }, [selectedForane]);

  // Fetch students when parish, class, division, or showInactive changes
  useEffect(() => {
    if (selectedParish && selectedClass && selectedDivision) {
      fetchStudents();
    }
  }, [selectedParish, selectedClass, selectedDivision, showInactive]);

  // Update filtered parishes when form forane changes
  useEffect(() => {
    if (formData.forane) {
      const fetchParishesForForm = async () => {
        try {
          const response = await axiosInstance.get(`/parish/forane/${formData.forane}`);
          setFilteredParishes(response.data || []);
        } catch (error) {
          console.error("Failed to fetch parishes for form:", error);
        }
      };
      
      fetchParishesForForm();
    } else {
      setFilteredParishes([]);
    }
  }, [formData.forane]);

  // Fetch foranes from backend
  const fetchForanes = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/forane");
      
      setForanes(response.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch foranes:", error);
      setIsLoading(false);
    }
  };

  // Fetch parishes for a specific forane
  const fetchParishes = async (foraneId) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/parish/forane/${foraneId}`);
      setParishes(response.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch parishes:", error);
      setIsLoading(false);
    }
  };

  // Fetch students based on selected criteria
  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      
      const response = await axiosInstance.get(
        `/students/parish/${selectedParish}/class/${selectedClass}/division/${selectedDivision}`,
        { 
          params: { 
            includeInactive: showInactive.toString() 
          } 
        }
      );
      
      setStudents(response.data.students || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      setIsLoading(false);
    }
  };

  // Export students to PDF
  const handleExportPDF = () => {
    if (!students.length) return;
    
    const doc = new jsPDF();
    const tableData = students.map(student => [
      student.name,
      student.class,
      student.division,
      student.parish,
      student.admissionNo,
      student.isActive === false ? 'Inactive' : 'Active'
    ]);
    
    const tableHeaders = ['Name', 'Class', 'Division', 'Parish', 'Admission No', 'Status'];
    
    doc.text(`Student List - ${selectedClass} ${selectedDivision}`, 14, 15);
    
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 102, 242], textColor: 255 },
      startY: 25,
    });
    
    doc.save('students.pdf');
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'image' && files && files[0]) {
      setFormData({
        ...formData,
        image: files[0]
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Create form data for file upload
      const formDataToSend = new FormData();
      
      // Map studentName to name as the API might be expecting "name" instead of "studentName"
      formDataToSend.append('name', formData.studentName);
      
      // Add other fields, using API-compatible field names
      Object.keys(formData).forEach(key => {
        // Skip studentName as we've already added it as 'name'
        if (key === 'studentName') return;
        
        if (key === 'image' && formData[key]) {
          formDataToSend.append('image', formData[key]);
        } else if (formData[key]) {
          // Make sure date fields are in the correct format
          if (['dateOfBirth', 'dateOfBaptism', 'dateOfConfirmation'].includes(key)) {
            // Ensure date is in YYYY-MM-DD format
            formDataToSend.append(key, formData[key]);
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }
      });
      
      // Debug what's being sent
      console.log("Form data being sent:");
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + (pair[0] === 'image' ? 'File object' : pair[1]));
      }
      
      let response;
      if (editingStudent) {
        // Update existing student
        response = await axiosInstance.put(`/students/${editingStudent._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Add new student - try with explicit error handling
        try {
          response = await axiosInstance.post("/students", formDataToSend, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } catch (postError) {
          // Log more detailed error information
          console.error("Post request failed:", postError);
          if (postError.response) {
            console.error("Error response data:", postError.response.data);
            console.error("Error status:", postError.response.status);
            alert(`Error ${postError.response.status}: ${JSON.stringify(postError.response.data)}`);
          }
          throw postError;
        }
      }
      
      // Close modal and refresh student list
      setModalOpen(false);
      resetForm();
      fetchStudents();
      
      setIsLoading(false);
      
      // Show success message
      alert(editingStudent ? 'Student updated successfully!' : 'Student added successfully!');
    } catch (error) {
      console.error("Failed to save student:", error);
      setIsLoading(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    setFormData({
      forane: '',
      parish: '',
      class: '',
      division: '',
      studentName: '',
      baptismName: '',
      houseName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      dateOfBaptism: '',
      dateOfConfirmation: '',
      fatherName: '',
      fatherBaptismName: '',
      motherName: '',
      motherBaptismName: '',
      admissionNo: '',
      image: null
    });
    setEditingStudent(null);
  };

  // Open modal to add new student
  const handleAddStudent = () => {
    resetForm();
    // Pre-fill the form with selected filters
    setFormData({
      ...formData,
      forane: selectedForane,
      parish: selectedParish,
      class: selectedClass,
      division: selectedDivision
    });
    setModalOpen(true);
  };

  // Open modal to edit existing student
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setFormData({
      forane: student.forane || '',
      parish: student.parish || '',
      class: student.class || '',
      division: student.division || '',
      studentName: student.name || '',
      baptismName: student.baptismName || '',
      houseName: student.houseName || '',
      email: student.email || '',
      phone: student.phone || '',
      dateOfBirth: student.dateOfBirth || '',
      dateOfBaptism: student.dateOfBaptism || '',
      dateOfConfirmation: student.dateOfConfirmation || '',
      fatherName: student.fatherName || '',
      fatherBaptismName: student.fatherBaptismName || '',
      motherName: student.motherName || '',
      motherBaptismName: student.motherBaptismName || '',
      admissionNo: student.admissionNo || '',
      image: null // Cannot pre-fill the image
    });
    setModalOpen(true);
  };

  // Delete student (soft delete)
  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to deactivate this student?")) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // The API endpoint remains the same, but now it performs a soft delete
      const response = await axiosInstance.put(`/students/${studentId}/deactivate`, {
        isActive: false
      });
      
      
      if (response.data.success) {
        // Show success message
        alert(`Student ${response.data.student.name} has been deactivated successfully.`);
        // Refresh the student list to remove the deactivated student
        fetchStudents();
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to deactivate student:", error);
      setIsLoading(false);
      alert("Failed to deactivate the student. Please try again.");
    }
  };

  // Render the main component
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Student Registration
          </Typography>

          {/* Dropdown Filters */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Forane</InputLabel>
                <Select
                  value={selectedForane}
                  label="Forane"
                  onChange={(e) => {
                    setSelectedForane(e.target.value);
                    // Reset dependent fields
                    setSelectedParish('');
                    setSelectedClass('');
                    setSelectedDivision('');
                  }}
                >
                  {foranes.map((forane) => (
                    <MenuItem key={forane._id} value={forane._id}>
                      {forane.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth disabled={!selectedForane}>
                <InputLabel>Parish</InputLabel>
                <Select
                  value={selectedParish}
                  label="Parish"
                  onChange={(e) => {
                    setSelectedParish(e.target.value);
                    // Reset dependent fields
                    setSelectedClass('');
                    setSelectedDivision('');
                  }}
                >
                  {parishes.map((parish) => (
                    <MenuItem key={parish._id} value={parish._id}>
                      {parish.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth disabled={!selectedParish}>
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  label="Class"
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    // Reset division
                    setSelectedDivision('');
                  }}
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls} value={cls}>
                      {cls}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth disabled={!selectedClass}>
                <InputLabel>Division</InputLabel>
                <Select
                  value={selectedDivision}
                  label="Division"
                  onChange={(e) => setSelectedDivision(e.target.value)}
                >
                  {divisions.map((div) => (
                    <MenuItem key={div} value={div}>
                      {div}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Active/Inactive Filter */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  color="primary"
                />
              }
              label="Show inactive students"
            />
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={handleAddStudent}
              disabled={!selectedParish || !selectedClass || !selectedDivision}
            >
              Add Student
            </Button>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                onClick={fetchStudents}
                disabled={!selectedParish || !selectedClass || !selectedDivision}
                sx={{ mr: 1 }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDown size={18} />}
                onClick={handleExportPDF}
                disabled={!students.length}
              >
                Export to PDF
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Search Students"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => setSearchTerm('')}
                      edge="end"
                    >
                      <X size={20} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Search Type</InputLabel>
              <Select
                value={searchType}
                label="Search Type"
                onChange={(e) => setSearchType(e.target.value)}
              >
                {searchTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={handleAddStudent}
              disabled={!selectedParish || !selectedClass || !selectedDivision}
            >
              Add Student
            </Button>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                onClick={fetchStudents}
                disabled={!selectedParish || !selectedClass || !selectedDivision}
                sx={{ mr: 1 }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDown size={18} />}
                onClick={handleExportPDF}
                disabled={!filteredStudents.length}
              >
                Export to PDF
              </Button>
            </Box>
          </Box>

          {/* Students Table */}
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>No.</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Baptism Name</TableCell>
                  <TableCell>House Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Division</TableCell>
                  <TableCell>Admission No</TableCell>
                  <TableCell>Date of Birth</TableCell>
                  <TableCell>Baptism Date</TableCell>
                  <TableCell>Confirmation Date</TableCell>
                  <TableCell>Father Name</TableCell>
                  <TableCell>Mother Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={16} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} align="center">
                      {searchTerm 
                        ? `No students found matching "${searchTerm}" in ${
                            searchTypeOptions.find(option => option.value === searchType)?.label || 'selected field'
                          }` 
                        : 'No students found. Select filters to view students.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student, index) => (
                    <TableRow 
                      key={student._id}
                      sx={student.isActive === false ? { opacity: 0.6, backgroundColor: '#f9f9f9' } : {}}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.baptismName || 'N/A'}</TableCell>
                      <TableCell>{student.houseName || 'N/A'}</TableCell>
                      <TableCell>{student.email || 'N/A'}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>{student.division}</TableCell>
                      <TableCell>{student.admissionNo}</TableCell>
                      <TableCell>{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{student.dateOfBaptism ? new Date(student.dateOfBaptism).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{student.dateOfConfirmation ? new Date(student.dateOfConfirmation).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{student.fatherName}</TableCell>
                      <TableCell>{student.motherName}</TableCell>
                      <TableCell>
                        {student.isActive === false ? 'Inactive' : 'Active'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditStudent(student)}>
                              <Pencil size={18} />
                            </IconButton>
                          </Tooltip>
                          {student.isActive !== false && (
                            <Tooltip title="Deactivate">
                              <IconButton size="small" onClick={() => handleDeleteStudent(student._id)}>
                                <Trash2 size={18} color="red" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        
        {/* Student Details Form Modal */}
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          aria-labelledby="student-form-modal"
        >
          <Paper sx={modalStyle}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </Typography>
              <IconButton onClick={() => setModalOpen(false)}>
                <X size={24} />
              </IconButton>
            </Box>
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Location Details */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Forane</InputLabel>
                    <Select
                      name="forane"
                      value={formData.forane}
                      label="Forane"
                      onChange={handleChange}
                      required
                    >
                      {foranes.map(forane => (
                        <MenuItem 
                          key={forane._id} 
                          value={forane._id}
                        >
                          {forane.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Parish</InputLabel>
                    <Select
                      name="parish"
                      value={formData.parish}
                      label="Parish"
                      onChange={handleChange}
                      required
                      disabled={!formData.forane}
                    >
                      {filteredParishes.map(parish => (
                        <MenuItem 
                          key={parish._id} 
                          value={parish._id}
                        >
                          {parish.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Class and Division */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Class</InputLabel>
                    <Select
                      name="class"
                      value={formData.class}
                      label="Class"
                      onChange={handleChange}
                      required
                    >
                      {classes.map(cls => (
                        <MenuItem key={cls} value={cls}>
                          {cls}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Division</InputLabel>
                    <Select
                      name="division"
                      value={formData.division}
                      label="Division"
                      onChange={handleChange}
                      required
                    >
                      {divisions.map(div => (
                        <MenuItem key={div} value={div}>
                          {div}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Student Personal Details */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Student Name"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Baptism Name"
                    name="baptismName"
                    value={formData.baptismName}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="House Name"
                    name="houseName"
                    value={formData.houseName}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                {/* Date Fields */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Baptism"
                    name="dateOfBaptism"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.dateOfBaptism}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Confirmation"
                    name="dateOfConfirmation"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.dateOfConfirmation}
                    onChange={handleChange}
                  />
                </Grid>

                {/* Family Details */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Father Name"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Father Baptism Name"
                    name="fatherBaptismName"
                    value={formData.fatherBaptismName}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mother Name"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mother Baptism Name"
                    name="motherBaptismName"
                    value={formData.motherBaptismName}
                    onChange={handleChange}
                  />
                </Grid>

                {/* Admission Details */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Admission Number"
                    name="admissionNo"
                    value={formData.admissionNo}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                {/* Image Upload */}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    component="label"
                    fullWidth
                  >
                    Upload Student Image
                    <input
                      type="file"
                      name="image"
                      hidden
                      accept="image/*"
                      onChange={handleChange}
                    />
                  </Button>
                  {formData.image && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {typeof formData.image === 'object' ? formData.image.name : 'Current image'}
                    </Typography>
                  )}
                </Grid>
                
                {/* Submit Buttons */}
                <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress size={24} /> : (editingStudent ? 'Update Student' : 'Add Student')}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Modal>
      </Box>
    </ThemeProvider>
  );
};

export default StudentDetailsForm;
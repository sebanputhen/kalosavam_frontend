import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Alert, 
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import TimerIcon from '@mui/icons-material/Timer';
import axiosInstance from '../axiosConfig';

const CategoryPage = ({ onCategoryAdded }) => {
  // State for category input
  const [categoryName, setCategoryName] = useState('');
  const [categoryStage, setCategoryStage] = useState('On Stage');
  const [categoryMinutes, setCategoryMinutes] = useState(''); // Minutes instead of time
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  // Edit state
  const [editingCategory, setEditingCategory] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  // Fetch categories on component mount and when filters change
  useEffect(() => {
    fetchCategories();
  }, [searchTerm, stageFilter]);

  // Handle input changes
  const handleInputChange = (e) => {
    setCategoryName(e.target.value);
  };

  // Handle minutes input - ensure it's numeric
  const handleMinutesChange = (e) => {
    const value = e.target.value;
    // Only allow numeric values
    if (value === '' || /^[0-9]+$/.test(value)) {
      setCategoryMinutes(value);
    }
  };

  // Submit form to create or update category
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      setMessage({ text: 'Category name cannot be empty', type: 'error' });
      return;
    }
    
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const categoryData = { 
        name: categoryName,
        stage: categoryStage,
      };
      
      // Only include minutes if it's not empty
      if (categoryMinutes) {
        categoryData.minutes = parseInt(categoryMinutes, 10);
      }
      
      let response;
      if (editingCategory) {
        // Update existing category
        response = await axiosInstance.patch(`/categories/${editingCategory._id}`, categoryData);
      } else {
        // Create new category
        response = await axiosInstance.post('/categories', categoryData);
      }
      
      if (response.status === 200 || response.status === 201) {
        setMessage({ 
          text: editingCategory 
            ? 'Category updated successfully!' 
            : 'Category added successfully!', 
          type: 'success' 
        });
        
        // Reset form
        setCategoryName('');
        setCategoryStage('On Stage');
        setCategoryMinutes('');
        setEditingCategory(null);
        
        // Fetch updated categories
        fetchCategories();
        
        // Notify parent component if callback exists
        if (onCategoryAdded) {
          onCategoryAdded();
        }
      }
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Could not save category', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Start editing a category
  const startEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryStage(category.stage);
    setCategoryMinutes(category.minutes ? category.minutes.toString() : '');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryStage('On Stage');
    setCategoryMinutes('');
  };

  // Fetch all categories with optional filtering
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (stageFilter) params.append('stage', stageFilter);

      const response = await axiosInstance.get(`/categories?${params.toString()}`);
      setCategories(response.data.data.categories);
    } catch (err) {
      setMessage({ 
        text: 'Failed to load categories. Please try again later.', 
        type: 'error' 
      });
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete a category
  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/categories/${id}`);
      setCategories(categories.filter(category => category._id !== id));
      setShowConfirmDelete(null);
      setMessage({ text: 'Category deleted successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete category. Please try again.', type: 'error' });
      console.error('Error deleting category:', err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        align="center" 
        sx={{ fontWeight: 'bold', mb: 4 }}
      >
        Category Management
      </Typography>
      
      <Grid container spacing={4}>
        {/* Category Form Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </Typography>
            
            {message.text && (
              <Alert 
                severity={message.type === 'error' ? 'error' : 'success'} 
                sx={{ mb: 2 }}
              >
                {message.text}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Category Name"
                variant="outlined"
                value={categoryName}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
                placeholder="Enter category name"
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Stage</InputLabel>
                <Select
                  value={categoryStage}
                  label="Stage"
                  onChange={(e) => setCategoryStage(e.target.value)}
                >
                  <MenuItem value="On Stage">On Stage</MenuItem>
                  <MenuItem value="Off Stage">Off Stage</MenuItem>
                </Select>
              </FormControl>
              
              {/* Minutes Input Field */}
              <TextField
                fullWidth
                label="Minutes"
                type="text"
                variant="outlined"
                value={categoryMinutes}
                onChange={handleMinutesChange}
                sx={{ mb: 2 }}
                placeholder="Duration in minutes"
                InputProps={{
                  endAdornment: <InputAdornment position="end">mins</InputAdornment>,
                  startAdornment: (
                    <InputAdornment position="start">
                      <TimerIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                helperText="Enter the duration in minutes (leave empty if not applicable)"
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={submitting}
                >
                  {submitting 
                    ? (editingCategory ? 'Updating...' : 'Adding...') 
                    : (editingCategory ? 'Update Category' : 'Add Category')
                  }
                </Button>
                {editingCategory && (
                  <Button
                    type="button"
                    variant="outlined"
                    color="secondary"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Categories List Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Categories
            </Typography>
            
            {/* Search and Filter Section */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Search Categories"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  endAdornment: <SearchIcon />
                }}
              />
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Stage Filter</InputLabel>
                <Select
                  value={stageFilter}
                  label="Stage Filter"
                  onChange={(e) => setStageFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="On Stage">On Stage</MenuItem>
                  <MenuItem value="Off Stage">Off Stage</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                <Typography variant="body1" color="textSecondary">
                  Loading categories...
                </Typography>
              </Box>
            ) : categories.length === 0 ? (
              <Box 
                sx={{ 
                  border: 1, 
                  borderColor: 'grey.300', 
                  borderRadius: 2, 
                  p: 3, 
                  textAlign: 'center',
                  backgroundColor: 'grey.50'
                }}
              >
                <Typography variant="subtitle1" color="textSecondary">
                  No categories found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Add your first category using the form.
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {categories.map(category => (
                  <ListItem 
                    key={category._id} 
                    secondaryAction={
                      <>
                        <IconButton 
                          edge="end" 
                          aria-label="edit"
                          onClick={() => startEditCategory(category)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => setShowConfirmDelete(category._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    }
                  >
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1">
                            {category.name}
                          </Typography>
                          {category.minutes && (
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              ml: 2,
                              bgcolor: 'action.hover',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1
                            }}>
                              <TimerIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {category.minutes} mins
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                      secondary={category.stage}
                      sx={{
                        ...(editingCategory?._id === category._id && {
                          color: 'primary.main',
                          fontWeight: 'bold'
                        })
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDelete !== null}
        onClose={() => setShowConfirmDelete(null)}
        aria-labelledby="delete-category-dialog-title"
      >
        <DialogTitle id="delete-category-dialog-title">
          Delete Category
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this category?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDelete(null)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={() => handleDelete(showConfirmDelete)} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CategoryPage;
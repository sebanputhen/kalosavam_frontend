import React, { useState, useEffect } from 'react';
import axiosInstance from "../axiosConfig";
// import './ManagerForm.css';

const ManagerForm = () => {
  const [formData, setFormData] = useState({
    parish: '',
    section: '',
    managers: [
      { name: '', contactNumber: '' },
      { name: '', contactNumber: '' }
    ]
  });
  
  // Use state for parishes data from DB
  const [parishes, setParishes] = useState([]);
  const [sections, setSections] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedManagers, setSavedManagers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Load parishes when component mounts
  useEffect(() => {
    fetchParishes();
  }, []);

  // Load managers when parish changes
  useEffect(() => {
    if (formData.parish) {
      fetchManagersByParish(formData.parish);
    } else {
      setSavedManagers([]);
    }
  }, [formData.parish]);

  // Function to fetch parishes from the database
  const fetchParishes = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/parish");
      setParishes(response.data || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch Parishes");
      setIsLoading(false);
    }
  };

  // Function to fetch managers by parish
  const fetchManagersByParish = async (parishId) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/managers/parish/${parishId}`);
      setSavedManagers(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching managers:', error);
      setMessage('Failed to load saved managers');
      setIsLoading(false);
    }
  };

  // Load sections based on selected parish
  useEffect(() => {
    if (formData.parish) {
      const sectionsByParish = {
        // Use parish IDs as keys instead of names
        // Populate this based on your needs
      };
      
      // Get selected parish object
      const selectedParish = parishes.find(p => p._id === formData.parish);
     
      // If parish is found and has sections data
      if (selectedParish && sectionsByParish[selectedParish._id]) {
        setSections(sectionsByParish[selectedParish._id]);
      } else {
        setSections([ "Dominic Savio", "Alphonsa", "Saint Thomas"]);
      }
    } else {
      setSections([]);
    }
  }, [formData.parish, parishes]);

  const handleParishChange = (e) => {
    setFormData({
      ...formData,
      parish: e.target.value,
      section: ''
    });
    
    // Reset editing mode when parish changes
    if (isEditing) {
      setIsEditing(false);
      setEditingId(null);
    }
  };

  const handleSectionChange = (e) => {
    setFormData({
      ...formData,
      section: e.target.value
    });
  };

  const handleManagerChange = (index, field, value) => {
    const updatedManagers = [...formData.managers];
    updatedManagers[index] = {
      ...updatedManagers[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      managers: updatedManagers
    });
  };

  const handleEdit = (record) => {
    setIsEditing(true);
    setEditingId(record._id);
    
    // Populate form with record data
    setFormData({
      parish: typeof record.parish === 'object' ? record.parish._id : record.parish,
      section: record.section,
      managers: [...record.managers]
    });
    
    // If managers array is less than 2, fill it with empty objects
    if (record.managers.length < 2) {
      const updatedManagers = [...record.managers];
      while (updatedManagers.length < 2) {
        updatedManagers.push({ name: '', contactNumber: '' });
      }
      setFormData(prev => ({
        ...prev,
        managers: updatedManagers
      }));
    }
    
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.parish || !formData.section) {
      setMessage('Please select both parish and section');
      return;
    }
    
    // Validate managers data
    const isValid = formData.managers.every(manager => 
      manager.name.trim() !== '' && manager.contactNumber.trim() !== ''
    );
    
    if (!isValid) {
      setMessage('Please enter both name and contact number for all managers');
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (isEditing) {
        // Update existing record
        await axiosInstance.put(`/managers/${editingId}`, formData);
        setMessage('Managers updated successfully!');
      } else {
        // Create new record
        await axiosInstance.post("/managers", formData);
        setMessage('Managers saved successfully!');
      }
      
      // Reset form
      setFormData({
        parish: formData.parish, // Keep the parish selected
        section: '',
        managers: [
          { name: '', contactNumber: '' },
          { name: '', contactNumber: '' }
        ]
      });
      
      // Reset editing mode
      setIsEditing(false);
      setEditingId(null);
      
      // Refresh the manager list for current parish
      fetchManagersByParish(formData.parish);
      setIsLoading(false);
    } catch (error) {
      console.error('Error saving managers:', error);
      setMessage('Failed to save managers. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axiosInstance.delete(`/managers/${id}`);
        setMessage('Manager record deleted successfully');
        
        // Refresh the manager list for current parish
        if (formData.parish) {
          fetchManagersByParish(formData.parish);
        }
      } catch (error) {
        console.error('Error deleting manager:', error);
        setMessage('Failed to delete manager record');
      }
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      parish: formData.parish, // Keep the parish selected
      section: '',
      managers: [
        { name: '', contactNumber: '' },
        { name: '', contactNumber: '' }
      ]
    });
  };

  return (
    <div className="manager-form-container">
      <h1>{isEditing ? 'Edit Managers' : 'Manager Registration'}</h1>
      
      {message && <div className="message">{message}</div>}
      
      <form onSubmit={handleSubmit} className="manager-form">
        <div className="form-group">
          <label htmlFor="parish">Parish:</label>
          <select 
            id="parish" 
            value={formData.parish} 
            onChange={handleParishChange}
            required
            disabled={isEditing} // Disable parish change during edit
          >
            <option value="">Select Parish</option>
            {parishes.map((parish) => (
              <option key={parish._id} value={parish._id}>{parish.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="section">Section:</label>
          <select 
            id="section" 
            value={formData.section} 
            onChange={handleSectionChange}
            disabled={!formData.parish}
            required
          >
            <option value="">Select Section</option>
            {sections.map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>
        
        <h2>Managers Information</h2>
        
        {formData.managers.map((manager, index) => (
          <div key={index} className="manager-info">
            <h3>Manager {index + 1}</h3>
            
            <div className="form-group">
              <label htmlFor={`manager-name-${index}`}>Name:</label>
              <input
                type="text"
                id={`manager-name-${index}`}
                value={manager.name}
                onChange={(e) => handleManagerChange(index, 'name', e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor={`manager-contact-${index}`}>Contact Number:</label>
              <input
                type="text"
                id={`manager-contact-${index}`}
                value={manager.contactNumber}
                onChange={(e) => handleManagerChange(index, 'contactNumber', e.target.value)}
                required
                pattern="[0-9]*"
                title="Please enter only numbers"
              />
            </div>
          </div>
        ))}
        
        <div className="form-actions">
          {isEditing && (
            <button 
              type="button" 
              onClick={cancelEdit}
              className="cancel-btn"
            >
              Cancel
            </button>
          )}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditing ? 'Update Managers' : 'Save Managers'}
          </button>
        </div>
      </form>
      
      {formData.parish && (
        <div className="saved-managers">
          <h2>Managers for Selected Parish</h2>
          
          {isLoading ? (
            <p>Loading...</p>
          ) : savedManagers.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Parish</th>
                  <th>Section</th>
                  <th>Manager 1</th>
                  <th>Contact</th>
                  <th>Manager 2</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedManagers.map((record) => (
                  <tr key={record._id}>
                    <td>{typeof record.parish === 'object' ? record.parish.name : record.parish}</td>
                    <td>{record.section}</td>
                    <td>{record.managers[0]?.name || '-'}</td>
                    <td>{record.managers[0]?.contactNumber || '-'}</td>
                    <td>{record.managers[1]?.name || '-'}</td>
                    <td>{record.managers[1]?.contactNumber || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="edit-btn" 
                          onClick={() => handleEdit(record)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDelete(record._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No managers saved for this parish</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagerForm;
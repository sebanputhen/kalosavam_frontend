import React, { useState, useEffect } from 'react';
import { Search, Check, X, Users } from 'lucide-react';
import axiosInstance from '../axiosConfig';

const SectionManagementPage = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch sections data from API
  // useEffect(() => {
  //   const fetchSections = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await axiosInstance.get('/sections');
  //       setSections(response.data);
  //       setError('');
  //     } catch (err) {
  //       console.error('Error fetching sections:', err);
  //       setError('Failed to load sections. Please try again later.');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
    
  //   fetchSections();
  // }, []);
  
  // Filter sections based on search term
  const filteredSections = sections.filter(section => 
    section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `class ${section.class}`.includes(searchTerm.toLowerCase())
  );
  
  // Group sections by name
  const sectionGroups = {};
  filteredSections.forEach(section => {
    if (!sectionGroups[section.name]) {
      sectionGroups[section.name] = [];
    }
    sectionGroups[section.name].push(section);
  });
  
  // Get class range text for section
  const getClassRangeText = (sectionName) => {
    switch (sectionName) {
      case 'Dominic Savio':
        return '(Class 4-6)';
      case 'Alphonsa':
        return '(Class 7-9)';
      case 'Saint Thomas':
        return '(Class 10-12)';
      default:
        return '';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Section Management
          </h1>
          
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <div className="relative w-full sm:max-w-md">
            {/* <input
              type="text"
              placeholder="Search by section name or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" /> */}
          </div>
        </div>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800">Dominic Savio</h3>
            <p className="text-sm text-blue-600">Primary Section (Class 4-6)</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-800">Alphonsa</h3>
            <p className="text-sm text-purple-600">Middle Section (Class 7-9)</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800">Saint Thomas</h3>
            <p className="text-sm text-green-600">High Section (Class 10-12)</p>
          </div>
        </div>
        
        
        
        {!loading && Object.keys(sectionGroups).map(sectionName => {
          // Define color scheme based on section name
          let colorScheme;
          switch (sectionName) {
            case 'Dominic Savio':
              colorScheme = 'blue';
              break;
            case 'Alphonsa':
              colorScheme = 'purple';
              break;
            case 'Saint Thomas':
              colorScheme = 'green';
              break;
            default:
              colorScheme = 'gray';
          }
          
          return (
            <div key={sectionName} className="mb-8">
            
              
              <div className={`bg-white rounded-lg shadow overflow-hidden border-t-4 border-${colorScheme}-500`}>
                <div className="overflow-x-auto">
                  
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectionManagementPage;
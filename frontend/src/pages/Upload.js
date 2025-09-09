import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  CloudUpload,
  AttachFile,
  Add,
  Update,
} from '@mui/icons-material';
import { documentsAPI } from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Upload = () => {
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');
  const mode = searchParams.get('mode'); // 'update' for updating existing document
  const isUpdateMode = mode === 'update' && documentId;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingDocument, setLoadingDocument] = useState(false);
  
  const navigate = useNavigate();

  // Load document data if in update mode
  useEffect(() => {
    if (isUpdateMode) {
      loadDocumentData();
    }
  }, [isUpdateMode, documentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDocumentData = async () => {
    try {
      setLoadingDocument(true);
      const document = await documentsAPI.getDocument(documentId);
      setFormData({
        title: document.title,
        description: document.description || '',
        tags: '',
      });
      if (document.tags && document.tags.length > 0) {
        setTagList(document.tags);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      setError('Failed to load document data');
    } finally {
      setLoadingDocument(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // Auto-fill title if empty
    if (file && !formData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setFormData({ ...formData, title: fileName });
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tagList.includes(tag)) {
      setTagList([...tagList, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTagList(tagList.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a document title');
      return;
    }

    setLoading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      
      // Convert tagList array to individual form entries
      tagList.forEach(tag => {
        uploadFormData.append('tags', tag);
      });

      let response;
      if (isUpdateMode) {
        response = await documentsAPI.updateDocument(documentId, uploadFormData);
        setSuccess(`Document "${formData.title}" updated successfully with version ${response.version_number}!`);
      } else {
        response = await documentsAPI.createDocument(uploadFormData);
        setSuccess(`Document "${response.title}" uploaded successfully!`);
      }
      
      // Reset form
      setFormData({ title: '', description: '', tags: '' });
      setSelectedFile(null);
      setTagList([]);
      
      // Redirect to documents page after a delay
      setTimeout(() => {
        navigate('/documents');
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.detail || `Failed to ${isUpdateMode ? 'update' : 'upload'} document`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {isUpdateMode ? 'Update Document' : 'Upload Document'}
      </Typography>
      
      <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        {loadingDocument && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {!loadingDocument && (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
          {/* File Upload */}
          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              mb: 3,
              backgroundColor: selectedFile ? '#f5f5f5' : 'transparent',
            }}
          >
            <input
              accept="*/*"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<AttachFile />}
                sx={{ mb: 2 }}
              >
                Choose File
              </Button>
            </label>
            
            {selectedFile ? (
              <Box>
                <Typography variant="h6" color="primary">
                  {selectedFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Size: {formatFileSize(selectedFile.size)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {selectedFile.type || 'Unknown'}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Click to select a file or drag and drop
              </Typography>
            )}
          </Box>

          {/* Document Details */}
          <TextField
            fullWidth
            required
            label="Document Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            margin="normal"
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description (Optional)"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            margin="normal"
          />

          {/* Tags */}
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Add Tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                      startIcon={<Add />}
                    >
                      Add
                    </Button>
                  </InputAdornment>
                ),
              }}
              helperText="Press Enter or click Add to add tags"
            />
            
            {tagList.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tagList.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : (isUpdateMode ? <Update /> : <CloudUpload />)}
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading 
              ? (isUpdateMode ? 'Updating...' : 'Uploading...') 
              : (isUpdateMode ? 'Update Document' : 'Upload Document')
            }
          </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Upload;

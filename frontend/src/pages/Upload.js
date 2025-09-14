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
  ArrowBack,
} from '@mui/icons-material';
import { documentsAPI } from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Upload = () => {
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');
  const mode = searchParams.get('mode');
  const isUpdateMode = mode === 'update' && documentId;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState([]);
  const [existingTags, setExistingTags] = useState([]);
  const [originalData, setOriginalData] = useState(null); // Store original document data
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
      
      const formDataValues = {
        title: document.title,
        description: document.description || '',
        tags: '',
      };
      
      setFormData(formDataValues);
      
      // Store original data for comparison
      setOriginalData({
        title: document.title,
        description: document.description || '',
        tags: document.tags || []
      });
      
      // Store current version information
      if (document.current_version) {
        setCurrentVersion(document.current_version);
      }
      
      if (document.tags && document.tags.length > 0) {
        setExistingTags(document.tags); // Store existing tags separately
        setTagList([]); // Start with empty new tags list
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
    if (tag && !tagList.includes(tag) && !existingTags.includes(tag)) {
      setTagList([...tagList, tag]);
      setTagInput('');
    } else if (existingTags.includes(tag)) {
      setError('This tag already exists on the document');
      setTimeout(() => setError(''), 3000);
    }
    }

  const handleRemoveTag = (tagToRemove) => {
    setTagList(tagList.filter(tag => tag !== tagToRemove));
  };

  const handleRemoveExistingTag = (tagToRemove) => {
    setExistingTags(existingTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const hasChanges = () => {
    if (!isUpdateMode || !originalData) return true; // For new documents, always allow
    
    // Check if title or description changed
    const titleChanged = formData.title.trim() !== originalData.title;
    const descriptionChanged = formData.description !== originalData.description;
    
    // Check if a new file was selected
    const fileChanged = selectedFile !== null;
    
    // Check if tags changed (comparing arrays)
    const currentTagsSet = new Set([...existingTags, ...tagList]);
    const originalTagsSet = new Set(originalData.tags);
    const tagsChanged = currentTagsSet.size !== originalTagsSet.size || 
                       [...currentTagsSet].some(tag => !originalTagsSet.has(tag));
    
    return titleChanged || descriptionChanged || fileChanged || tagsChanged;
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

    // For new uploads, file is required. For updates, file is optional
    if (!selectedFile && !isUpdateMode) {
      setError('Please select a file to upload');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a document title');
      return;
    }

    // For updates, check if any changes were made
    if (isUpdateMode && !hasChanges()) {
      setError('Please make some changes to update the document');
      return;
    }

    setLoading(true);

    try {
      const uploadFormData = new FormData();
      
      // Only append file if one is selected
      if (selectedFile) {
        uploadFormData.append('file', selectedFile);
      }
      
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      
      // For updates: send both existing tags (may have been modified) and new tags
      // For creation: send all tags
      if (isUpdateMode) {
        // Send all existing tags (after any removals)
        existingTags.forEach(tag => {
          uploadFormData.append('existing_tags', tag);
        });
        // Send new tags to be added
        tagList.forEach(tag => {
          uploadFormData.append('tags', tag);
        });
      } else {
        // For new documents, send all tags
        tagList.forEach(tag => {
          uploadFormData.append('tags', tag);
        });
      }

      let response;
      if (isUpdateMode) {
        response = await documentsAPI.updateDocument(documentId, uploadFormData);
        setSuccess(`Document "${formData.title}" updated successfully!`);
      } else {
        response = await documentsAPI.createDocument(uploadFormData);
        setSuccess(`Document "${response.title}" uploaded successfully!`);
      }
      
      // Reset form
      setFormData({ title: '', description: '', tags: '' });
      setSelectedFile(null);
      setTagList([]);
      setExistingTags([]);
      
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
      <Button onClick={() => navigate('/documents')} startIcon={<ArrowBack />}>
          BACK TO DOCUMENTS
        </Button>
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Typography variant="h4" component="h1">
          {isUpdateMode ? 'Update Document' : 'Upload Document'}
        </Typography>
      </Box>
      
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
              
              {/* Current Version Info for Updates */}
              {isUpdateMode && currentVersion && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Version: {currentVersion.file_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Size: {formatFileSize(currentVersion.file_size)} • 
                    Type: {currentVersion.file_type} • 
                    Version: {currentVersion.version_number} • 
                    Uploaded: {new Date(currentVersion.uploaded_at).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Select a new file below to upload a new version, or leave empty to only update metadata.
                  </Typography>
                </Alert>
              )}

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
                {isUpdateMode ? 'Choose New File (Optional)' : 'Choose File'}
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
                {isUpdateMode 
                  ? 'Click to select a new file or leave empty to only update metadata'
                  : 'Click to select a file or drag and drop'
                }
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
            
            {/* Show tags section */}
            {(isUpdateMode || tagList.length > 0) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags:
                </Typography>
                
                {/* Show existing tags if in update mode */}
                {isUpdateMode && existingTags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Existing tags:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      {existingTags.map((tag, index) => (
                        <Chip
                          key={`existing-${index}`}
                          label={tag}
                          color="default"
                          variant="filled"
                          size="small"
                          onDelete={() => handleRemoveExistingTag(tag)}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* Show new tags */}
                {tagList.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      {isUpdateMode ? 'New tags to add:' : 'Tags:'}
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

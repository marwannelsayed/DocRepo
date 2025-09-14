import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  InputAdornment,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Paper,
} from '@mui/material';
import {
  Search,
  CloudUpload,
  Visibility,
  History,
  MoreVert,
  Edit,
  Delete,
  Clear,
  FilterList,
  AutoAwesome,
} from '@mui/icons-material';
import { documentsAPI } from '../services/api';
import { tagsAPI } from '../services/api';
import { classificationAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [usedTags, setUsedTags] = useState([]); // Tags actually used in documents
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedDocumentForMenu, setSelectedDocumentForMenu] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Classification state
  const [classifyingDocument, setClassifyingDocument] = useState(null);
  const [classificationResults, setClassificationResults] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async (searchParams = {}) => {
    try {
      setLoading(true);
      const data = await documentsAPI.getDocuments(searchParams);
      setDocuments(data);
      
      // Extract unique tags from all documents
      const tagsSet = new Set();
      data.forEach(doc => {
        if (doc.tags && doc.tags.length > 0) {
          doc.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      setUsedTags(Array.from(tagsSet).sort());
      
      setError('');
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const searchParams = {};
    if (searchQuery.trim()) {
      searchParams.search = searchQuery.trim();
    }
    if (selectedTags.length > 0) {
      searchParams.tags = selectedTags.join(',');
    }
    fetchDocuments(searchParams);
  };

  const handleTagFilter = (tag) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newSelectedTags);
    
    // Auto-apply filter when tags change
    const searchParams = {};
    if (searchQuery.trim()) {
      searchParams.search = searchQuery.trim();
    }
    if (newSelectedTags.length > 0) {
      searchParams.tags = newSelectedTags.join(',');
    }
    fetchDocuments(searchParams);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    fetchDocuments();
  };

  const handleFilterDialogOpen = () => {
    setFilterDialogOpen(true);
    setTagSearchQuery('');
  };

  const handleFilterDialogClose = () => {
    setFilterDialogOpen(false);
    setTagSearchQuery('');
  };

  const handleApplyFilters = () => {
    const searchParams = {};
    if (searchQuery.trim()) {
      searchParams.search = searchQuery.trim();
    }
    if (selectedTags.length > 0) {
      searchParams.tags = selectedTags.join(',');
    }
    fetchDocuments(searchParams);
    handleFilterDialogClose();
  };

  const getFilteredTags = () => {
    if (!tagSearchQuery.trim()) {
      return usedTags;
    }
    return usedTags.filter(tag => 
      tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewVersions = async (document) => {
    setSelectedDocument(document);
    setVersionsDialogOpen(true);
    setVersionsLoading(true);
    
    try {
      const versionsData = await documentsAPI.getDocumentVersions(document.document_id);
      setVersions(versionsData);
    } catch (error) {
      console.error('Error fetching versions:', error);
      setError('Failed to load document versions');
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleViewDocument = (document) => {
    navigate(`/documents/${document.document_id}`);
  };

  const handleMenuOpen = (event, document) => {
    setMenuAnchor(event.currentTarget);
    setSelectedDocumentForMenu(document);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDocumentForMenu(null);
  };

  const handleUpdate = () => {
    handleMenuClose();
    navigate(`/upload?documentId=${selectedDocumentForMenu.document_id}&mode=update`);
  };

  const handleDeleteClick = () => {
    setDocumentToDelete(selectedDocumentForMenu);
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await documentsAPI.deleteDocument(documentToDelete.document_id);
      setSnackbar({
        open: true,
        message: 'Document deleted successfully',
        severity: 'success'
      });
      fetchDocuments(); // Refresh the list
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete document',
        severity: 'error'
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleClassifyDocument = async (document) => {
    try {
      setClassifyingDocument(document.document_id);
      
      console.log('Starting classification for document:', document.document_id);
      
      // Call DocEx classification API
      const result = await classificationAPI.classifyDocument(document.document_id);
      
      console.log('Classification result:', result);
      
      if (result.success) {
        // Store classification result
        setClassificationResults(prev => ({
          ...prev,
          [document.document_id]: result
        }));
        
        // If classified as email and confidence > 0.8, add email tag
        if (result.predicted_class === 'email' && result.confidence > 0.8) {
          try {
            console.log('Adding Email tag to document:', document.document_id);
            await classificationAPI.addEmailTag(document.document_id);
            
            // Refresh documents to show new tag
            fetchDocuments({
              search: searchQuery,
              tags: selectedTags
            });
            
            setSnackbar({
              open: true,
              message: `Document classified as EMAIL (${Math.round(result.confidence * 100)}% confidence) and tagged automatically!`,
              severity: 'success'
            });
          } catch (tagError) {
            console.error('Error adding email tag:', tagError);
            setSnackbar({
              open: true,
              message: `Classification: EMAIL (${Math.round(result.confidence * 100)}% confidence) - Error adding tag`,
              severity: 'warning'
            });
          }
        } else {
          const classType = result.predicted_class === 'email' ? 'EMAIL' : 'NOT EMAIL';
          setSnackbar({
            open: true,
            message: `Document classified as ${classType} (${Math.round(result.confidence * 100)}% confidence)`,
            severity: 'info'
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: 'Classification failed. Please try again.',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Classification error:', error);
      
      let errorMessage = 'Error during classification.';
      
      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;
        
        console.error('HTTP Error:', status, responseData);
        
        if (status === 400) {
          errorMessage = 'Invalid file format for classification. DocEx API expects image files (PNG, JPG) of documents.';
        } else if (status === 422) {
          errorMessage = 'File validation error. Please ensure the document is a valid image file.';
        } else if (status >= 500) {
          errorMessage = 'DocEx API server error. Please try again later.';
        } else {
          errorMessage = `Classification failed (Error ${status}). Check DocEx API logs.`;
        }
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to DocEx API. Make sure it\'s running on port 8000.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Classification timed out. The document might be too large.';
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setClassifyingDocument(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Documents
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/upload')}
          startIcon={<CloudUpload />}
        >
          Upload Document
        </Button>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search documents by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button onClick={handleSearch} variant="contained" size="small">
                    Search
                  </Button>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={handleFilterDialogOpen}
            sx={{ minWidth: 'auto', px: 2 }}
            color={selectedTags.length > 0 ? 'primary' : 'inherit'}
          >
            Filter
            {selectedTags.length > 0 && (
              <Box
                component="span"
                sx={{
                  ml: 1,
                  minWidth: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                }}
              >
                {selectedTags.length}
              </Box>
            )}
          </Button>
        </Box>
        
        {/* Active Filters Display */}
        {selectedTags.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Active filters:
            </Typography>
            {selectedTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                color="primary"
                onDelete={() => handleTagFilter(tag)}
              />
            ))}
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={clearFilters}
              sx={{ ml: 1 }}
            >
              Clear All
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {documents.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="h6" align="center" color="text.secondary">
                No documents found. Upload your first document to get started!
              </Typography>
            </Grid>
          ) : (
            documents.map((document) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={document.document_id}>
                <Card sx={{ 
                  height: 350, 
                  width: '100%',
                  maxWidth: 320,
                  display: 'flex', 
                  flexDirection: 'column',
                  mx: 'auto'
                }}>
                  <CardContent sx={{ 
                    flexGrow: 1, 
                    position: 'relative',
                    height: 280,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, document)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                    <Typography variant="h6" component="h2" gutterBottom sx={{ 
                      pr: 5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {document.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {document.description || 'No description available'}
                    </Typography>
                    <Typography variant="caption" display="block" gutterBottom>
                      Created by: {document.creator_name}
                    </Typography>
                    <Typography variant="caption" display="block" gutterBottom>
                      Department: {document.department_name}
                    </Typography>
                    <Typography variant="caption" display="block" gutterBottom sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      Created: {new Date(document.created_at).toLocaleDateString()}
                    </Typography>

                    {document.current_version && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          File: {document.current_version.file_name}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          Size: {formatFileSize(document.current_version.file_size)}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          Type: {document.current_version.file_type}
                        </Typography>
                      </Box>
                    )}                    {document.tags && document.tags.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        {document.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDocument(document)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<History />}
                      onClick={() => handleViewVersions(document)}
                    >
                      Versions
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={classifyingDocument === document.document_id ? 
                        <CircularProgress size={16} /> : 
                        <AutoAwesome />
                      }
                      onClick={() => handleClassifyDocument(document)}
                      disabled={classifyingDocument === document.document_id}
                      sx={{
                        borderColor: 'success.main',
                        color: 'success.main',
                        '&:hover': {
                          borderColor: 'success.dark',
                          backgroundColor: 'success.light',
                          color: 'success.dark',
                        }
                      }}
                    >
                      {classifyingDocument === document.document_id ? 'Classifying...' : 'Classify'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Versions Dialog */}
      <Dialog
        open={versionsDialogOpen}
        onClose={() => setVersionsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Document Versions: {selectedDocument?.title}
        </DialogTitle>
        <DialogContent>
          {versionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {versions.map((version) => (
                <ListItem key={version.version_id} divider>
                  <ListItemText
                    primary={`Version ${version.version_number} - ${version.file_name}`}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Uploaded by: {version.uploader_name}
                        </Typography>
                        <Typography variant="body2">
                          Date: {formatDate(version.uploaded_at)}
                        </Typography>
                        <Typography variant="body2">
                          Size: {formatFileSize(version.file_size)} | Type: {version.file_type}
                        </Typography>
                        {version.is_current && (
                          <Chip label="Current Version" color="primary" size="small" />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleUpdate}>
          <Edit sx={{ mr: 1 }} />
          Update
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{documentToDelete?.title}"? 
            This action cannot be undone and will remove all versions of the document.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tag Filter Dialog */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={handleFilterDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Filter by Tags
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search tags..."
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          {usedTags.length > 0 ? (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Available Tags ({getFilteredTags().length})
              </Typography>
              <Box sx={{ 
                maxHeight: 300, 
                overflowY: 'auto',
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1 
              }}>
                {getFilteredTags().map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => handleTagFilter(tag)}
                    color={selectedTags.includes(tag) ? 'primary' : 'default'}
                    variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                    clickable
                  />
                ))}
              </Box>
              
              {selectedTags.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Selected Tags ({selectedTags.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        color="primary"
                        onDelete={() => handleTagFilter(tag)}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No tags found in existing documents
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterDialogClose}>
            Cancel
          </Button>
          {selectedTags.length > 0 && (
            <Button onClick={clearFilters} color="secondary">
              Clear All
            </Button>
          )}
          <Button onClick={handleApplyFilters} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Documents;

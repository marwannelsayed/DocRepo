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
} from '@mui/material';
import {
  Search,
  CloudUpload,
  Visibility,
  History,
  MoreVert,
  Edit,
  Delete,
} from '@mui/icons-material';
import { documentsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedDocumentForMenu, setSelectedDocumentForMenu] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async (searchParams = {}) => {
    try {
      setLoading(true);
      const data = await documentsAPI.getDocuments(searchParams);
      setDocuments(data);
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
    fetchDocuments(searchParams);
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
              <Grid item xs={12} sm={6} md={4} key={document.document_id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, document)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                    <Typography variant="h6" component="h2" gutterBottom sx={{ pr: 5 }}>
                      {document.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {document.description || 'No description available'}
                    </Typography>
                    <Typography variant="caption" display="block" gutterBottom>
                      Created by: {document.creator_name}
                    </Typography>
                    <Typography variant="caption" display="block" gutterBottom>
                      Department: {document.department_name}
                    </Typography>
                    <Typography variant="caption" display="block" gutterBottom>
                      Created: {formatDate(document.created_at)}
                    </Typography>
                    
                    {document.current_version && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block">
                          File: {document.current_version.file_name}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Size: {formatFileSize(document.current_version.file_size)}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Type: {document.current_version.file_type}
                        </Typography>
                      </Box>
                    )}

                    {document.tags && document.tags.length > 0 && (
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

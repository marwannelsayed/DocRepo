import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  CloudDownload,
  Person,
  CalendarToday,
  Business,
  Description,
  AttachFile,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';

const DocumentDetail = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settingCurrent, setSettingCurrent] = useState(null);

  useEffect(() => {
    fetchDocumentDetails();
  }, [documentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      const [docResponse, versionsResponse] = await Promise.all([
        documentsAPI.getDocument(documentId),
        documentsAPI.getDocumentVersions(documentId),
      ]);
      
      setDocument(docResponse);
      setVersions(versionsResponse);
      setError('');
    } catch (error) {
      console.error('Error fetching document details:', error);
      setError('Failed to load document details');
    } finally {
      setLoading(false);
    }
  };

  const handleSetCurrentVersion = async (versionId) => {
    try {
      setSettingCurrent(versionId);
      await documentsAPI.setCurrentVersion(documentId, versionId);
      
      // Refresh the document details to get updated current version info
      await fetchDocumentDetails();
      
      setError('');
    } catch (error) {
      console.error('Error setting current version:', error);
      setError('Failed to set version as current');
    } finally {
      setSettingCurrent(null);
    }
  };

  const handleDownload = async (versionId = null) => {
    try {
      await documentsAPI.downloadDocument(documentId, versionId);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document');
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => navigate('/documents')} startIcon={<ArrowBack />}>
          BACK TO DOCUMENTS
        </Button>
      </Box>
    );
  }

  if (!document) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Document not found
        </Alert>
        <Button onClick={() => navigate('/documents')} startIcon={<ArrowBack />}>
          BACK TO DOCUMENTS
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button onClick={() => navigate('/documents')} startIcon={<ArrowBack />}>
          BACK TO DOCUMENTS
        </Button>
      </Box>

      {/* Document Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {document.title}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {document.description && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description />
                  Description
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {document.description}
                </Typography>
              </Box>
            )}

            {document.tags && document.tags.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {document.tags.map((tag, index) => (
                    <Chip key={index} label={tag} color="primary" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Document Info
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Created by
                    </Typography>
                    <Typography variant="body1">
                      {document.creator_name}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Business sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body1">
                      {document.department_name}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Created on
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(document.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Current Version */}
      {document.current_version && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Current Version
          </Typography>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachFile sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">
                  {document.current_version.file_name}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Version
                  </Typography>
                  <Typography variant="body1">
                    {document.current_version.version_number}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    File Size
                  </Typography>
                  <Typography variant="body1">
                    {formatFileSize(document.current_version.file_size)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    File Type
                  </Typography>
                  <Typography variant="body1">
                    {document.current_version.file_type}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button
                    variant="contained"
                    startIcon={<CloudDownload />}
                    size="small"
                    onClick={() => handleDownload()}
                  >
                    Download
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Paper>
      )}

      {/* Version History */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Version History
        </Typography>
        
        {versions.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No versions available
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {versions.map((version) => (
              <Grid item xs={12} key={version.version_id}>
                <Card sx={{ backgroundColor: version.is_current ? '#f3f4f6' : 'background.paper' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" sx={{ mr: 2 }}>
                            Version {version.version_number}
                          </Typography>
                          {version.is_current && (
                            <Chip label="Current" color="primary" size="small" />
                          )}
                        </Box>
                        
                        <Typography variant="body1" gutterBottom>
                          {version.file_name}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">
                          Uploaded by {version.uploader_name} on {formatDate(version.uploaded_at)}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">
                          {formatFileSize(version.file_size)} • {version.file_type}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!version.is_current && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleSetCurrentVersion(version.version_id)}
                            disabled={settingCurrent === version.version_id}
                            sx={{ mr: 1 }}
                          >
                            {settingCurrent === version.version_id ? (
                              <CircularProgress size={16} />
                            ) : (
                              'Set as Current'
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          startIcon={<CloudDownload />}
                          size="small"
                          onClick={() => handleDownload(version.version_id)}
                        >
                          Download
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default DocumentDetail;

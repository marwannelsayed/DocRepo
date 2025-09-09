import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8088';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API - Updated for optimized server with /api prefix
export const authAPI = {
  login: async (email, password) => {
    console.log("🔍 authAPI.login START:", email);
    const requestStartTime = performance.now();
    
    try {
      console.log("🔍 Making POST request to /api/auth/login...");
      const response = await api.post('/api/auth/login', { email, password });
      
      const requestEndTime = performance.now();
      console.log(`🔍 HTTP request completed in ${(requestEndTime - requestStartTime).toFixed(3)}ms`);
      console.log("🔍 Response data:", response.data);
      
      return response.data;
    } catch (error) {
      const requestEndTime = performance.now();
      console.log(`🔍 HTTP request FAILED in ${(requestEndTime - requestStartTime).toFixed(3)}ms`);
      console.error("🔍 API Error:", error);
      throw error;
    }
  },
  
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
};

// Documents API - Updated for optimized server with /api prefix
export const documentsAPI = {
  getDocuments: async (params = {}) => {
    const response = await api.get('/api/documents', { params });
    return response.data;
  },
  
  getDocument: async (documentId) => {
    const response = await api.get(`/api/documents/${documentId}`);
    return response.data;
  },
  
  createDocument: async (formData) => {
    const response = await api.post('/api/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getDocumentVersions: async (documentId) => {
    const response = await api.get(`/api/documents/${documentId}/versions`);
    return response.data;
  },
  
  setCurrentVersion: async (documentId, versionId) => {
    const response = await api.put(`/api/documents/${documentId}/versions/${versionId}/set-current`);
    return response.data;
  },
  
  updateDocument: async (documentId, formData) => {
    const response = await api.put(`/api/documents/${documentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/api/documents/${documentId}`);
    return response.data;
  },
  
  downloadDocument: async (documentId, versionId = null) => {
    const url = versionId 
      ? `/api/documents/${documentId}/versions/${versionId}/download`
      : `/api/documents/${documentId}/download`;
    
    const response = await api.get(url, {
      responseType: 'blob', // Important for file downloads
    });
    
    // Get filename from Content-Disposition header or fallback
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'download';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true, filename };
  },
};

// Tags API - Updated for optimized server with /api prefix
export const tagsAPI = {
  getTags: async () => {
    const response = await api.get('/api/tags');
    return response.data;
  },
};

// Departments API - Updated for optimized server with /api prefix
export const departmentsAPI = {
  getDepartments: async () => {
    // Use a separate axios instance without auth for public endpoints
    const response = await axios.get(`${API_BASE_URL}/api/departments`);
    return response.data;
  },
};

// Roles API - Updated for optimized server with /api prefix
export const rolesAPI = {
  getRoles: async () => {
    // Use a separate axios instance without auth for public endpoints
    const response = await axios.get(`${API_BASE_URL}/api/roles`);
    return response.data;
  },
};

export default api;

# DocEx API Integration with DocRepo

This guide explains how to integrate the DocEx email classification API with the DocRepo document management system.

## 🚀 Quick Setup

### 1. Ensure DocEx API is Running
The DocEx API should be running on port 8000. You can verify this by checking:
```bash
curl http://localhost:8000/
```

### 2. Update Environment Variables
In your `.env` file, add:
```bash
REACT_APP_DOCEX_API_URL=http://localhost:8000
```

### 3. Start DocRepo
```bash
# Development mode
make dev-up

# Or manually
cd backend && python main_production_fast.py
cd frontend && npm start
```

## ✨ Features Implemented

### 🔘 Classification Button
- **Green outlined "Classify" button** on each document card
- **Loading state** with spinner while classifying
- **Disabled state** during classification to prevent multiple requests

### 🧠 Smart Classification
- **Automatic API call** to DocEx classification service
- **Confidence threshold** of 80% for auto-tagging
- **Real-time feedback** with success/error messages

### 🏷️ Auto-Tagging
- **Automatic "Email" tag** added if document is classified as email with >80% confidence
- **Tag preservation** - existing tags are maintained
- **Instant UI update** after successful tagging

### 💬 User Feedback
- **Success messages** showing classification result and confidence
- **Auto-tag confirmation** when email tag is added
- **Error handling** with helpful messages if DocEx API is unavailable

## 🔧 API Integration Details

### Frontend Classification Flow
```javascript
// 1. User clicks "Classify" button
handleClassifyDocument(document)

// 2. Download document file from DocRepo
GET /api/documents/{id}/download

// 3. Send file to DocEx API
POST http://localhost:8000/classify/document

// 4. Process classification result
if (result.predicted_class === 'email' && confidence > 0.8) {
    // 5. Auto-add "Email" tag
    POST /api/documents/{id}/tags { tags: ["Email"] }
    
    // 6. Refresh document list
    fetchDocuments()
}
```

### Backend Endpoints Added
- **`POST /api/documents/{id}/tags`** - Add tags to existing document
- Preserves existing tags while adding new ones
- Returns updated tag list

### Classification Response Format
```json
{
    "success": true,
    "predicted_class": "email",
    "confidence": 0.95,
    "probabilities": {
        "email": 0.95,
        "not email": 0.05
    },
    "message": "Classification successful"
}
```

## 🎯 User Experience

### Classification Results
- **Email (>80% confidence)**: Auto-tagged + success message
- **Email (<80% confidence)**: Info message only (no auto-tag)
- **Not Email**: Info message with classification result
- **API Error**: Clear error message with troubleshooting hint

### Visual Feedback
- **Green outline button** maintains DocRepo's design consistency
- **Loading spinner** replaces button icon during classification
- **Button text changes** to "Classifying..." during operation
- **Snackbar notifications** for all classification results

## 🐳 Docker Integration

The Docker setup includes DocEx API URL configuration:

### Development Environment
```yaml
environment:
  REACT_APP_DOCEX_API_URL: http://localhost:8000
```

### Production Environment
Update `docker-compose.yml` to point to your DocEx API endpoint.

## 🔧 Troubleshooting

### DocEx API Not Available
- **Error Message**: "Make sure DocEx API is running on port 8000"
- **Solution**: Start DocEx API service
- **Verification**: `curl http://localhost:8000/`

### Classification Failed
- **Common Causes**: 
  - File format not supported by DocEx
  - Network connectivity issues
  - DocEx API service down
- **User Feedback**: Clear error messages guide users

### Auto-Tagging Issues
- **Behavior**: Classification works but tag not added
- **Likely Cause**: Backend tag endpoint error
- **User Feedback**: Shows classification result with warning about tag error

## 📊 Benefits

1. **Automated Workflow** - No manual email identification needed
2. **Improved Organization** - Automatic email tagging for better search/filtering
3. **User Choice** - Classification is opt-in via button click
4. **Smart Thresholds** - Only high-confidence results get auto-tagged
5. **Seamless Integration** - Fits naturally into existing DocRepo workflow

## 🔮 Future Enhancements

- **Bulk Classification** - Classify multiple documents at once
- **Custom Confidence Thresholds** - User-configurable auto-tag confidence
- **Additional Classifications** - Extend beyond email/not-email
- **Classification History** - Track classification results over time
- **Auto-Classification on Upload** - Classify new documents automatically

# API Contracts: Virtual Specs 3D Try-On MVP

**Date**: 2025-12-04
**Purpose**: API endpoint definitions and contracts for frontend integration
**Status**: Complete

## Overview

This document defines the complete API contracts for the Virtual Specs 3D Try-On MVP. The API follows RESTful conventions with simple JSON responses designed for rapid frontend development.

## Base URL

```
http://localhost:5000
```

## Static Routes

### GET /

**Purpose**: Home page with navigation to try-on modes

**Response**: HTML page with navigation interface

**Features**:
- Links to both try-on modes
- Application introduction
- Basic styling and layout

---

### GET /tryon/image

**Purpose**: Photo upload try-on interface

**Response**: HTML page with upload form and overlay controls

**Features**:
- File upload form
- Frame selection interface
- Position adjustment controls
- Canvas element for overlay rendering

---

### GET /tryon/live

**Purpose**: Live webcam try-on interface

**Response**: HTML page with webcam integration

**Features**:
- Video element for webcam feed
- Frame selection interface
- Position adjustment controls
- Permission handling UI

---

## Dynamic API Endpoints

### POST /upload

**Purpose**: Handle secure image upload and validation

**Request**:
```
Content-Type: multipart/form-data

file: [image file]
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "filename": "user_upload_abc123.jpg",
  "original_name": "my_photo.jpg",
  "width": 1920,
  "height": 1080,
  "file_size": 245760,
  "mime_type": "image/jpeg"
}
```

**Error Responses**:

**400 Bad Request** - No file provided:
```json
{
  "success": false,
  "error": "No file provided",
  "error_code": "NO_FILE"
}
```

**400 Bad Request** - Invalid file type:
```json
{
  "success": false,
  "error": "Invalid file type. Only JPG and PNG files are allowed.",
  "error_code": "INVALID_FILE_TYPE"
}
```

**413 Payload Too Large** - File too big:
```json
{
  "success": false,
  "error": "File too large. Maximum size is 16MB.",
  "error_code": "FILE_TOO_LARGE"
}
```

**500 Internal Server Error** - Upload processing error:
```json
{
  "success": false,
  "error": "File processing failed. Please try again.",
  "error_code": "PROCESSING_ERROR"
}
```

---

### GET /frames

**Purpose**: Return list of available frame designs

**Request**: None (no parameters required)

**Success Response** (200 OK):
```json
{
  "success": true,
  "frames": [
    {
      "id": "aviator_classic",
      "name": "Classic Aviator",
      "category": "classic",
      "description": "Timeless aviator style with metal frame",
      "image_url": "/static/frames/aviator_classic.png",
      "default_width": 300,
      "default_height": 100,
      "default_x": 400,
      "default_y": 200
    },
    {
      "id": "round_vintage",
      "name": "Round Vintage",
      "category": "vintage",
      "description": "Classic round frame design",
      "image_url": "/static/frames/round_vintage.png",
      "default_width": 280,
      "default_height": 120,
      "default_x": 410,
      "default_y": 190
    },
    {
      "id": "sport_modern",
      "name": "Sport Modern",
      "category": "sport",
      "description": "Modern sport frame with wraparound design",
      "image_url": "/static/frames/sport_modern.png",
      "default_width": 320,
      "default_height": 90,
      "default_x": 390,
      "default_y": 210
    }
  ]
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "success": false,
  "error": "Unable to load frame designs",
  "error_code": "FRAME_LOAD_ERROR"
}
```

---

### GET /static/uploads/<filename>

**Purpose**: Serve uploaded user images

**Request**: Path parameter with filename

**Success Response** (200 OK):
- Image file content with appropriate Content-Type header

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": "File not found",
  "error_code": "FILE_NOT_FOUND"
}
```

---

## Frontend Integration Examples

### JavaScript Upload Handler

```javascript
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            displayUploadedImage(result.filename);
            return result;
        } else {
            handleUploadError(result.error);
            return null;
        }
    } catch (error) {
        console.error('Upload failed:', error);
        handleUploadError('Network error occurred');
        return null;
    }
}
```

### Frame Loading Handler

```javascript
async function loadFrames() {
    try {
        const response = await fetch('/frames');
        const result = await response.json();

        if (result.success) {
            populateFrameSelector(result.frames);
            return result.frames;
        } else {
            console.error('Failed to load frames:', result.error);
            return [];
        }
    } catch (error) {
        console.error('Frame loading failed:', error);
        return [];
    }
}
```

### Error Handler

```javascript
function handleApiError(response) {
    switch (response.error_code) {
        case 'NO_FILE':
            showUserMessage('Please select a file to upload');
            break;
        case 'INVALID_FILE_TYPE':
            showUserMessage('Only JPG and PNG files are allowed');
            break;
        case 'FILE_TOO_LARGE':
            showUserMessage('File is too large. Maximum size is 16MB');
            break;
        case 'FILE_NOT_FOUND':
            showUserMessage('Image file not found. Please upload again');
            break;
        default:
            showUserMessage('An error occurred. Please try again');
    }
}
```

## Frontend Data Contracts

### Frame Selection State

```javascript
const frameState = {
    selectedFrame: null,
    position: {
        x: 0,
        y: 0,
        scale: 1.0
    },
    imageMode: {
        uploadedImage: null,
        imageUrl: null
    },
    webcamMode: {
        stream: null,
        isActive: false
    }
};
```

### User Interface Events

```javascript
// Frame selection events
document.addEventListener('frameSelected', (event) => {
    const frameId = event.detail.frameId;
    loadFrameOverlay(frameId);
});

// Position adjustment events
document.addEventListener('positionChanged', (event) => {
    const { x, y, scale } = event.detail;
    updateFramePosition(x, y, scale);
});

// Mode switching events
document.addEventListener('modeChanged', (event) => {
    const mode = event.detail.mode; // 'image' or 'webcam'
    switchMode(mode);
});
```

## Performance Requirements

### Response Time Targets

- **File Upload**: <2 seconds for standard image sizes
- **Frame Loading**: <500ms for all frame configurations
- **Error Responses**: <100ms for all error scenarios
- **Static Asset Serving**: <200ms for frame images

### Browser Compatibility

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **API Support**: Fetch API, FormData, getUserMedia
- **Fallback Support**: Graceful degradation for older browsers

## Security Considerations

### Input Validation

- **File Types**: Only JPG, JPEG, PNG allowed
- **File Sizes**: Maximum 16MB per upload
- **Filename Sanitization**: Prevent path traversal attacks
- **MIME Type Verification**: Validate actual file content

### CORS Headers

```javascript
// Flask CORS configuration
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST')
    return response
```

## Error Handling Strategy

### Client-Side Error Handling

1. **Network Errors**: Retry mechanism with exponential backoff
2. **Validation Errors**: User-friendly messages with specific guidance
3. **Permission Errors**: Clear instructions for enabling camera access
4. **Browser Compatibility**: Feature detection and fallback messaging

### Server-Side Error Handling

1. **File Processing**: Comprehensive exception handling
2. **Resource Limits**: Memory and storage constraint enforcement
3. **Session Management**: Automatic cleanup of expired sessions
4. **Logging**: Error logging for debugging and monitoring

---

**API Contracts Complete**: All endpoints defined with request/response formats, error handling, and integration examples for frontend development.
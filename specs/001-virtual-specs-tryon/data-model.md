# Data Model: Virtual Specs 3D Try-On MVP

**Date**: 2025-12-04
**Purpose**: Entity definitions and validation rules for try-on system
**Status**: Complete

## Overview

This document defines the key entities and data structures for the Virtual Specs 3D Try-On MVP. The system uses a stateless architecture with temporary file storage, focusing on user session data rather than persistent database storage.

## Key Entities

### 1. UserPhoto

**Purpose**: Represents uploaded user image file for frame overlay

**Attributes**:
```python
UserPhoto:
  - filename: str           # Secure filename (e.g., "user_upload_abc123.jpg")
  - original_name: str      # Original user filename
  - file_path: str          # Server file path
  - file_size: int          # File size in bytes
  - upload_time: datetime   # Upload timestamp
  - mime_type: str          # Validated MIME type (image/jpeg, image/png)
  - width: int             # Image width in pixels
  - height: int            # Image height in pixels
```

**Validation Rules**:
- filename must match secure filename pattern
- original_name must have allowed extension (.jpg, .png, .jpeg)
- file_size must be < 16MB (configurable limit)
- mime_type must be in ALLOWED_MIME_TYPES
- width and height must be > 0 and < 4000px

**Business Rules**:
- Files are temporary and cleaned up after session
- Only image formats accepted for security
- File names sanitized to prevent path traversal

### 2. FrameDesign

**Purpose**: Represents eyewear frame configuration and visual assets

**Attributes**:
```python
FrameDesign:
  - id: str                 # Unique frame identifier (e.g., "aviator_classic")
  - name: str               # Display name (e.g., "Classic Aviator")
  - image_path: str         # Path to transparent PNG frame image
  - default_width: int      # Default display width in pixels
  - default_height: int     # Default display height in pixels
  - default_x: int          # Default horizontal position (from left)
  - default_y: int          # Default vertical position (from top)
  - category: str           # Frame category (e.g., "classic", "sport", "fashion")
  - description: str        # Frame description
```

**Validation Rules**:
- id must be alphanumeric and unique
- name must be non-empty string
- image_path must point to existing PNG file
- dimensions must be positive integers
- category must be from predefined set

**Business Rules**:
- Frame images must be transparent PNG format
- Default positions calculated for typical face dimensions
- Minimum 3 frames required for MVP

### 3. OverlaySession

**Purpose**: Represents active try-on session state

**Attributes**:
```python
OverlaySession:
  - session_id: str         # Unique session identifier
  - mode: str              # "image" or "webcam"
  - user_photo: UserPhoto  # Reference to uploaded photo (image mode only)
  - selected_frame: FrameDesign  # Currently selected frame
  - position_state: PositionState  # Current positioning
  - created_at: datetime   # Session creation timestamp
  - last_activity: datetime  # Last user interaction
```

**Validation Rules**:
- session_id must be UUID or similar unique identifier
- mode must be either "image" or "webcam"
- user_photo required for "image" mode, null for "webcam" mode
- selected_frame must reference valid FrameDesign

**Business Rules**:
- Sessions timeout after 30 minutes of inactivity
- Session data stored server-side for security
- Clean up temporary files when session expires

### 4. PositionState

**Purpose**: Represents current frame positioning and scaling

**Attributes**:
```python
PositionState:
  - x_position: float      # Horizontal offset from default (pixels)
  - y_position: float      # Vertical offset from default (pixels)
  - scale: float           # Scaling factor (1.0 = default size)
  - rotation: float        # Rotation angle in degrees (future feature)
  - is_mirrored: bool      # Horizontal mirror flag (webcam mode)
```

**Validation Rules**:
- x_position range: -500 to +500 pixels
- y_position range: -500 to +500 pixels
- scale range: 0.5 to 3.0 (50% to 300%)
- rotation range: -30 to +30 degrees (future feature)

**Business Rules**:
- Position changes must be <200ms response time
- Scale limited to maintain usability
- Reset functionality returns to default values

## API Data Structures

### Request Formats

**Image Upload Request**:
```json
{
  "file": "multipart/form-data file upload"
}
```

**Frame Selection Request**:
```json
{
  "frame_id": "aviator_classic"
}
```

**Position Update Request**:
```json
{
  "x_position": 25.5,
  "y_position": -10.0,
  "scale": 1.2
}
```

### Response Formats

**Upload Success Response**:
```json
{
  "success": true,
  "filename": "user_upload_abc123.jpg",
  "width": 1920,
  "height": 1080,
  "file_size": 245760
}
```

**Frame List Response**:
```json
{
  "frames": [
    {
      "id": "aviator_classic",
      "name": "Classic Aviator",
      "category": "classic",
      "description": "Timeless aviator style"
    }
  ]
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Invalid file type. Only JPG and PNG files are allowed.",
  "error_code": "INVALID_FILE_TYPE"
}
```

## Data Validation Pipeline

### File Upload Validation

```python
def validate_upload(file):
    """Comprehensive file validation pipeline"""

    # 1. File presence check
    if not file or file.filename == '':
        return False, "No file selected"

    # 2. Extension validation
    if not allowed_file(file.filename):
        return False, "Invalid file type"

    # 3. MIME type validation
    if not validate_mime_type(file):
        return False, "Invalid file format"

    # 4. Size validation
    if file.content_length > MAX_FILE_SIZE:
        return False, "File too large"

    # 5. Image validation
    try:
        img = Image.open(file.stream)
        img.verify()
        file.stream.seek(0)  # Reset stream for processing
    except Exception:
        return False, "Invalid image file"

    return True, "Valid file"
```

### Frame Configuration Validation

```python
def validate_frame_config(frame_data):
    """Frame configuration validation"""

    required_fields = ['id', 'name', 'image_path', 'default_width', 'default_height']

    for field in required_fields:
        if field not in frame_data:
            return False, f"Missing required field: {field}"

    # Validate image file exists
    if not os.path.exists(frame_data['image_path']):
        return False, "Frame image file not found"

    # Validate dimensions
    if frame_data['default_width'] <= 0 or frame_data['default_height'] <= 0:
        return False, "Invalid frame dimensions"

    return True, "Valid frame configuration"
```

### Position Update Validation

```python
def validate_position_update(position_data):
    """Position update validation"""

    # Validate ranges
    if not (-500 <= position_data.get('x_position', 0) <= 500):
        return False, "X position out of range"

    if not (-500 <= position_data.get('y_position', 0) <= 500):
        return False, "Y position out of range"

    if not (0.5 <= position_data.get('scale', 1.0) <= 3.0):
        return False, "Scale out of range"

    return True, "Valid position update"
```

## Security Considerations

### File Upload Security

1. **Filename Sanitization**: Use `secure_filename()` from Werkzeug
2. **Extension Validation**: Only allow .jpg, .jpeg, .png extensions
3. **MIME Type Verification**: Validate actual file content
4. **Size Limits**: Enforce maximum file size limits
5. **Path Traversal Prevention**: Never use user input in file paths
6. **Temporary Storage**: Store uploads in isolated directory
7. **Automatic Cleanup**: Remove files after session timeout

### Data Privacy

1. **Session Isolation**: Each session has unique identifier
2. **Temporary Storage**: No persistent storage of user photos
3. **Automatic Cleanup**: Files removed after session expiration
4. **No Personal Data**: No collection of personally identifiable information

## Performance Considerations

### Memory Management

1. **Stream Processing**: Process files as streams to limit memory usage
2. **Image Optimization**: Resize large images for better performance
3. **Cache Management**: Cache frame configurations in memory
4. **Session Cleanup**: Regular cleanup of expired sessions

### Response Time Optimization

1. **Validation Efficiency**: Fast validation pipeline for uploads
2. **Position Calculations**: Optimized positioning algorithms
3. **Asset Loading**: Efficient frame image loading
4. **Error Responses**: Fast error detection and response

---

**Data Model Complete**: All entities defined with validation rules, security considerations, and performance optimizations aligned to MVP requirements and constitutional principles.
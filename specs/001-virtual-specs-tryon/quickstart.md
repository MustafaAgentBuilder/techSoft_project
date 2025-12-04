# Quick Start Guide: Virtual Specs 3D Try-On MVP

**Date**: 2025-12-04
**Purpose**: Step-by-step development setup and local running instructions
**Status**: Complete

## Prerequisites

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **Python**: Version 3.11 or higher
- **Web Browser**: Chrome 88+, Firefox 85+, Safari 14+, or Edge 88+
- **Hardware**: Webcam (for live try-on mode), 4GB+ RAM recommended

### Software Dependencies

- **Python Package Manager**: pip (included with Python)
- **Git**: For version control
- **Code Editor**: VS Code, PyCharm, or similar

## Setup Instructions

### 1. Repository Setup

```bash
# Clone the repository (or create new project)
git clone <repository-url>
cd virtual-specs-tryon

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
# Install required Python packages
pip install -r requirements.txt
```

**requirements.txt**:
```
Flask==2.3.3
Werkzeug==2.3.7
Pillow==10.0.1
opencv-python-headless==4.8.1.78
```

### 3. Project Structure Setup

```bash
# Create directory structure
mkdir -p static/css
mkdir -p static/js
mkdir -p static/frames
mkdir -p static/uploads
mkdir -p templates

# Verify structure
tree .
```

**Expected Structure**:
```
virtual-specs-tryon/
├── app.py
├── requirements.txt
├── static/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── main.js
│   │   ├── overlay.js
│   │   └── webcam.js
│   ├── frames/
│   │   ├── aviator_classic.png
│   │   ├── round_vintage.png
│   │   └── sport_modern.png
│   └── uploads/
└── templates/
    ├── base.html
    ├── index.html
    ├── tryon_image.html
    └── tryon_live.html
```

### 4. Frame Assets Preparation

```bash
# Add frame images to static/frames/
# Each frame should be a transparent PNG with glasses/eyewear
# Recommended size: 300-400px width, proportional height

# Example frames (create or source these):
# - aviator_classic.png
# - round_vintage.png
# - sport_modern.png
```

### 5. Initial Application Setup

Create **app.py**:

```python
import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from PIL import Image
import time

# Configuration
app = Flask(__name__)
app.config['SECRET_KEY'] = 'virtual-specs-secret-key'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Allowed extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tryon/image')
def tryon_image():
    return render_template('tryon_image.html')

@app.route('/tryon/live')
def tryon_live():
    return render_template('tryon_live.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided', 'error_code': 'NO_FILE'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected', 'error_code': 'NO_FILE'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            timestamp = str(int(time.time()))
            filename = f"upload_{timestamp}_{filename}"

            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            # Get image dimensions
            with Image.open(file_path) as img:
                width, height = img.size

            return jsonify({
                'success': True,
                'filename': filename,
                'original_name': file.filename,
                'width': width,
                'height': height,
                'file_size': os.path.getsize(file_path),
                'mime_type': file.mimetype
            })

        return jsonify({'success': False, 'error': 'Invalid file type. Only JPG and PNG files are allowed.', 'error_code': 'INVALID_FILE_TYPE'}), 400

    except Exception as e:
        return jsonify({'success': False, 'error': 'File processing failed. Please try again.', 'error_code': 'PROCESSING_ERROR'}), 500

@app.route('/frames')
def get_frames():
    frames = [
        {
            'id': 'aviator_classic',
            'name': 'Classic Aviator',
            'category': 'classic',
            'description': 'Timeless aviator style with metal frame',
            'image_url': '/static/frames/aviator_classic.png',
            'default_width': 300,
            'default_height': 100,
            'default_x': 400,
            'default_y': 200
        },
        {
            'id': 'round_vintage',
            'name': 'Round Vintage',
            'category': 'vintage',
            'description': 'Classic round frame design',
            'image_url': '/static/frames/round_vintage.png',
            'default_width': 280,
            'default_height': 120,
            'default_x': 410,
            'default_y': 190
        },
        {
            'id': 'sport_modern',
            'name': 'Sport Modern',
            'category': 'sport',
            'description': 'Modern sport frame with wraparound design',
            'image_url': '/static/frames/sport_modern.png',
            'default_width': 320,
            'default_height': 90,
            'default_x': 390,
            'default_y': 210
        }
    ]

    return jsonify({'success': True, 'frames': frames})

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

### 6. Run the Application

```bash
# Start the Flask development server
python app.py
```

**Expected Output**:
```
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://[your-local-ip]:5000
Press CTRL+C to quit
```

### 7. Access the Application

Open your web browser and navigate to:
- **Home Page**: http://localhost:5000
- **Photo Try-On**: http://localhost:5000/tryon/image
- **Live Webcam Try-On**: http://localhost:5000/tryon/live

## Development Workflow

### 1. Daily Development Setup

```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

# Start development server
python app.py
```

### 2. Testing Workflow

**Manual Testing Steps**:

1. **Basic Functionality**:
   - Navigate to http://localhost:5000
   - Verify navigation links work
   - Check page loads without errors

2. **Photo Upload Mode**:
   - Go to /tryon/image
   - Upload a JPG or PNG image
   - Verify image displays correctly
   - Test frame selection functionality
   - Test position adjustment controls

3. **Live Webcam Mode**:
   - Go to /tryon/live
   - Allow camera permissions
   - Verify video feed displays
   - Test frame overlay on video
   - Test position adjustment controls

### 3. Debugging Setup

**Chrome DevTools**:
- Open Developer Tools (F12)
- Use Console tab for JavaScript debugging
- Use Network tab for API debugging
- Use Elements tab for UI inspection

**Common Debugging Commands**:
```bash
# Check Flask logs
python app.py  # Look for error messages in console

# Test API endpoints manually
curl http://localhost:5000/frames

# Check file permissions
ls -la static/uploads/
```

## Performance Testing

### 1. Load Testing

```javascript
// Browser console performance test
console.time('frame-selection');
// Select 10 frames rapidly
for(let i = 0; i < 10; i++) {
    // Trigger frame selection
}
console.timeEnd('frame-selection');
```

### 2. Memory Monitoring

```javascript
// Monitor memory usage in browser console
setInterval(() => {
    if (performance.memory) {
        console.log('Memory:', {
            used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
            total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB'
        });
    }
}, 5000);
```

## Deployment Preparation

### 1. Production Configuration

Create **config.py**:
```python
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'production-secret-key'
    UPLOAD_FOLDER = 'static/uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    DEBUG = False

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
```

### 2. Environment Variables

```bash
# Windows
set SECRET_KEY=your-production-secret-key

# macOS/Linux
export SECRET_KEY=your-production-secret-key
```

## Troubleshooting

### Common Issues

**Issue**: "ModuleNotFoundError: No module named 'flask'"
```bash
# Solution: Install dependencies
pip install -r requirements.txt
```

**Issue**: "Permission denied" on webcam access
```bash
# Solution: Use https:// or localhost in browser
# Check browser permissions for camera access
```

**Issue**: Upload directory not found
```bash
# Solution: Create directory structure
mkdir -p static/uploads
```

**Issue**: CORS errors in browser
```bash
# Solution: Access via http://localhost:5000 instead of file://
```

### Getting Help

1. **Check Flask logs** in terminal for error messages
2. **Use browser DevTools** for frontend issues
3. **Verify file permissions** on upload directory
4. **Check Python version** (3.11+ required)
5. **Ensure virtual environment** is activated

---

**Quick Start Complete**: Development environment configured and application ready for local development and testing.
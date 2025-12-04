"""
Virtual Specs 3D Try-On MVP - Flask Application
Main application file for virtual eyewear try-on functionality
"""

import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from PIL import Image
import time

# Initialize Flask application
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'virtual-specs-secret-key-mvp'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# CORS headers configuration
@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Routes
@app.route('/')
def index():
    """Home page with navigation to try-on modes"""
    return render_template('index.html')

@app.route('/tryon/image')
def tryon_image():
    """Static photo upload try-on page"""
    return render_template('tryon_image.html')

@app.route('/tryon/live')
def tryon_live():
    """Live webcam try-on page"""
    return render_template('tryon_live.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload with validation"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided',
                'error_code': 'NO_FILE'
            }), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected',
                'error_code': 'NO_FILE'
            }), 400

        if file and allowed_file(file.filename):
            # Secure filename handling
            filename = secure_filename(file.filename)
            timestamp = str(int(time.time()))
            filename = f"upload_{timestamp}_{filename}"

            # Save file
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

        return jsonify({
            'success': False,
            'error': 'Invalid file type. Only JPG and PNG files are allowed.',
            'error_code': 'INVALID_FILE_TYPE'
        }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'File processing failed. Please try again.',
            'error_code': 'PROCESSING_ERROR'
        }), 500

@app.route('/frames')
def get_frames():
    """Get available frame configurations"""
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
    """Serve uploaded files"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Page not found', 'error_code': 'NOT_FOUND'}), 404

@app.errorhandler(413)
def too_large(error):
    return jsonify({'success': False, 'error': 'File too large', 'error_code': 'FILE_TOO_LARGE'}), 413

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Internal server error', 'error_code': 'INTERNAL_ERROR'}), 500

if __name__ == '__main__':
    # Development server configuration
    app.run(debug=True, host='0.0.0.0', port=5000)
"""
Virtual Specs 3D Try-On MVP - Flask Application
Main application file for virtual eyewear try-on functionality
Enhanced with security features including CSRF protection and input sanitization
"""

import os
import secrets
import re
import html
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, render_template, request, jsonify, send_from_directory, session, redirect, url_for
from werkzeug.utils import secure_filename
from PIL import Image
import time
# Simple HTML sanitization without bleach dependency
def clean_html(text):
    """Basic HTML sanitization"""
    if not text:
        return ""
    # Remove script tags and dangerous attributes
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    return html.escape(text)
from markupsafe import Markup

# Initialize Flask application
app = Flask(__name__)

# Security Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or secrets.token_urlsafe(32)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=1)
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['WTF_CSRF_ENABLED'] = True
app.config['WTF_CSRF_TIME_LIMIT'] = 3600  # 1 hour CSRF token validity

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Security patterns for input validation
DANGEROUS_PATTERNS = [
    r'<script[^>]*>.*?</script>',
    r'javascript:',
    r'on\w+\s*=',
    r'expression\s*\(',
    r'url\s*\(',
    r'@import',
    r'binding\s*:',
]

# Allowed HTML tags for sanitization
ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'p', 'br']
ALLOWED_ATTRIBUTES = {}

def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def sanitize_filename(filename):
    """Sanitize filename to prevent directory traversal and injection"""
    if not filename:
        return 'upload_' + str(int(time.time()))

    # Remove dangerous characters
    filename = re.sub(r'[^\w\s.-]', '', filename)

    # Prevent directory traversal
    filename = filename.replace('..', '').replace('/', '').replace('\\', '')

    # Limit length
    filename = filename[:100]

    return secure_filename(filename)

def sanitize_input(text):
    """Sanitize user input to prevent XSS and injection attacks"""
    if not text:
        return ''

    # Convert to string if not already
    text = str(text)

    # Check for dangerous patterns
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            app.logger.warning(f'Dangerous pattern detected in input: {pattern}')
            return ''

    # Sanitize with simple HTML sanitization
    sanitized = clean_html(text)

    return sanitized

def sanitize_filename_input(filename):
    """Enhanced filename sanitization"""
    if not filename:
        return 'unknown_file'

    # Basic sanitization
    sanitized = sanitize_filename(filename)

    # Ensure it has an extension
    if not '.' in sanitized:
        sanitized += '.jpg'

    return sanitized

def validate_image_file(file):
    """Validate uploaded image file for security"""
    if not file or file.filename == '':
        return False, 'No file selected'

    # Check file extension
    if not allowed_file(file.filename):
        return False, 'Invalid file type. Only PNG and JPG files are allowed.'

    # Check file size
    if len(file.read()) > app.config['MAX_CONTENT_LENGTH']:
        return False, 'File too large. Maximum size is 16MB.'

    # Reset file pointer
    file.seek(0)

    try:
        # Validate image content
        with Image.open(file) as img:
            img.verify()

        # Reset file pointer again
        file.seek(0)

        return True, 'Valid image file'

    except Exception as e:
        app.logger.warning(f'Invalid image file: {str(e)}')
        return False, 'Invalid image file. Please upload a valid PNG or JPG image.'

def generate_csrf_token():
    """Generate CSRF token for forms"""
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_urlsafe(32)
    return session['csrf_token']

def validate_csrf_token(token):
    """Validate CSRF token"""
    if not token or 'csrf_token' not in session:
        return False

    # Compare tokens securely
    return secrets.compare_digest(token, session['csrf_token'])

def csrf_protected(f):
    """Decorator to protect routes with CSRF validation"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            token = request.headers.get('X-CSRFToken') or request.form.get('csrf_token')
            if not validate_csrf_token(token):
                return jsonify({'error': 'CSRF token validation failed'}), 403
        return f(*args, **kwargs)
    return decorated_function

def rate_limit(max_requests=60, window=60):
    """Simple rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.environ.get('REMOTE_ADDR', 'unknown')

            if 'rate_limits' not in session:
                session['rate_limits'] = {}

            current_time = datetime.now()
            key = f"{client_ip}_{request.endpoint}"

            if key in session['rate_limits']:
                requests = session['rate_limits'][key]
                # Filter requests within the time window
                recent_requests = [req_time for req_time in requests
                                 if (current_time - req_time).seconds < window]

                if len(recent_requests) >= max_requests:
                    return jsonify({'error': 'Rate limit exceeded'}), 429

                session['rate_limits'][key] = recent_requests
            else:
                session['rate_limits'][key] = []

            session['rate_limits'][key].append(current_time)

            return f(*args, **kwargs)
        return decorated_function
    return decorator

def secure_headers(f):
    """Decorator to add security headers to responses"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        response = f(*args, **kwargs)

        # Add security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob:; "
            "media-src 'self' blob:; "
            "connect-src 'self'; "
            "frame-src 'none';"
        )

        return response
    return decorated_function

def log_security_event(event_type, details):
    """Log security events for monitoring"""
    app.logger.warning(f'Security Event: {event_type} - {details}')

    # In production, you might want to send this to a security monitoring service
    if app.config.get('SECURITY_WEBHOOK'):
        try:
            import requests
            requests.post(app.config['SECURITY_WEBHOOK'], json={
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': event_type,
                'details': details,
                'ip': request.environ.get('REMOTE_ADDR'),
                'user_agent': request.headers.get('User-Agent', '')
            }, timeout=5)
        except Exception as e:
            app.logger.error(f'Failed to send security webhook: {str(e)}')

# CORS headers configuration
@app.after_request
def after_request(response):
    """Add CORS and security headers to all responses"""
    # CORS Headers
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-CSRFToken')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')

    # Security Headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    # Content Security Policy
    if app.config.get('ENVIRONMENT') == 'production':
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob:; "
            "media-src 'self' blob:; "
            "connect-src 'self'; "
            "frame-src 'none';"
        )
        response.headers['Content-Security-Policy'] = csp

    return response

# Routes
@app.route('/')
def index():
    """Home page with navigation to try-on modes"""
    return render_template('index.html')

@app.route('/debug')
def debug():
    """Debug test page"""
    return render_template('debug-test.html')

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
    """Get available frame configurations with enhanced metadata"""
    frames = [
        {
            'id': 'aviator_classic',
            'name': 'Classic Aviator',
            'category': 'classic',
            'subcategory': 'pilot',
            'description': 'Timeless aviator style with metal frame, perfect for a sophisticated look',
            'long_description': 'Inspired by classic pilot sunglasses, this frame features teardrop-shaped lenses with a thin metal frame. Ideal for oval and heart-shaped faces.',
            'image_url': '/static/frames/aviator_classic.png',
            'thumbnail_url': '/static/frames/aviator_classic_thumb.png',
            'tags': ['classic', 'metal', 'pilot', 'teardrop', 'sophisticated'],
            'default_width': 300,
            'default_height': 100,
            'default_x': 400,
            'default_y': 200,
            'price_range': 'premium',
            'material': 'Metal Alloy',
            'colors': ['gold', 'silver', 'gunmetal'],
            'suitable_for': ['oval', 'heart', 'round'],
            'popularity': 85,
            'new_arrival': False,
            'bestseller': True,
            'seasonal': ['all'],
            'try_on_count': 1247,
            'rating': 4.7
        },
        {
            'id': 'round_vintage',
            'name': 'Round Vintage',
            'category': 'vintage',
            'subcategory': 'retro',
            'description': 'Classic round frame design with vintage appeal',
            'long_description': 'A retro-inspired round frame that brings back the charm of vintage eyewear. Perfect for square and rectangular face shapes.',
            'image_url': '/static/frames/round_vintage.png',
            'thumbnail_url': '/static/frames/round_vintage_thumb.png',
            'tags': ['vintage', 'round', 'retro', 'acetate', 'tortoise'],
            'default_width': 280,
            'default_height': 120,
            'default_x': 410,
            'default_y': 190,
            'price_range': 'standard',
            'material': 'Acetate',
            'colors': ['tortoise', 'black', 'clear'],
            'suitable_for': ['square', 'rectangle', 'diamond'],
            'popularity': 72,
            'new_arrival': True,
            'bestseller': False,
            'seasonal': ['fall', 'winter'],
            'try_on_count': 892,
            'rating': 4.5
        },
        {
            'id': 'sport_modern',
            'name': 'Sport Modern',
            'category': 'sport',
            'subcategory': 'active',
            'description': 'Modern sport frame with wraparound design for active lifestyle',
            'long_description': 'High-performance sport sunglasses with wraparound design providing maximum coverage and protection. Lightweight and durable for any outdoor activity.',
            'image_url': '/static/frames/sport_modern.png',
            'thumbnail_url': '/static/frames/sport_modern_thumb.png',
            'tags': ['sport', 'modern', 'wraparound', 'polarized', 'lightweight'],
            'default_width': 320,
            'default_height': 90,
            'default_x': 390,
            'default_y': 210,
            'price_range': 'premium',
            'material': 'Polycarbonate',
            'colors': ['matte_black', 'gloss_black', 'white'],
            'suitable_for': ['all'],
            'popularity': 68,
            'new_arrival': True,
            'bestseller': False,
            'seasonal': ['spring', 'summer', 'fall'],
            'try_on_count': 654,
            'rating': 4.3
        },
        {
            'id': 'cat_eye_trendy',
            'name': 'Cat Eye Trendy',
            'category': 'fashion',
            'subcategory': 'cat_eye',
            'description': 'Fashionable cat-eye frame with upswept corners',
            'long_description': 'A trendy cat-eye frame that combines vintage elegance with modern fashion. Perfect for making a style statement with angular, upswept corners.',
            'image_url': '/static/frames/cat_eye_trendy.png',
            'thumbnail_url': '/static/frames/cat_eye_trendy_thumb.png',
            'tags': ['cat_eye', 'fashion', 'trendy', 'upswept', 'statement'],
            'default_width': 310,
            'default_height': 110,
            'default_x': 400,
            'default_y': 180,
            'price_range': 'designer',
            'material': 'Mixed Materials',
            'colors': ['burgundy', 'black', 'tortoise'],
            'suitable_for': ['oval', 'heart', 'round'],
            'popularity': 91,
            'new_arrival': True,
            'bestseller': True,
            'seasonal': ['fall', 'winter', 'spring'],
            'try_on_count': 1456,
            'rating': 4.8
        },
        {
            'id': 'wayfarer_classic',
            'name': 'Wayfarer Classic',
            'category': 'classic',
            'subcategory': 'iconic',
            'description': 'Iconic wayfarer style with trapezoidal shape',
            'long_description': 'The timeless wayfarer design that never goes out of style. Bold trapezoidal shape with distinctive hinge details make this an instant classic.',
            'image_url': '/static/frames/wayfarer_classic.png',
            'thumbnail_url': '/static/frames/wayfarer_classic_thumb.png',
            'tags': ['wayfarer', 'classic', 'iconic', 'trapezoidal', 'bold'],
            'default_width': 330,
            'default_height': 95,
            'default_x': 400,
            'default_y': 205,
            'price_range': 'standard',
            'material': 'Acetate',
            'colors': ['black', 'tortoise', 'crystal_clear'],
            'suitable_for': ['round', 'square', 'heart'],
            'popularity': 94,
            'new_arrival': False,
            'bestseller': True,
            'seasonal': ['all'],
            'try_on_count': 1893,
            'rating': 4.9
        },
        {
            'id': 'minimalist_rimless',
            'name': 'Minimalist Rimless',
            'category': 'minimalist',
            'subcategory': 'rimless',
            'description': 'Ultra-lightweight rimless frame for subtle elegance',
            'long_description': 'Nearly invisible rimless design that puts the focus entirely on your eyes. Ultra-lightweight construction for all-day comfort with sophisticated minimalism.',
            'image_url': '/static/frames/minimalist_rimless.png',
            'thumbnail_url': '/static/frames/minimalist_rimless_thumb.png',
            'tags': ['rimless', 'minimalist', 'lightweight', 'subtle', 'professional'],
            'default_width': 270,
            'default_height': 100,
            'default_x': 415,
            'default_y': 200,
            'price_range': 'luxury',
            'material': 'Titanium',
            'colors': ['silver', 'gold', 'rose_gold', 'gunmetal'],
            'suitable_for': ['oval', 'round', 'heart'],
            'popularity': 63,
            'new_arrival': False,
            'bestseller': False,
            'seasonal': ['all'],
            'try_on_count': 421,
            'rating': 4.6
        }
    ]

    return jsonify({'success': True, 'frames': frames})

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/csrf-token')
@secure_headers
def get_csrf_token():
    """Get CSRF token for forms"""
    return jsonify({'csrf_token': generate_csrf_token()})

@app.route('/api/security-event', methods=['POST'])
@csrf_protected
@rate_limit(max_requests=10, window=60)
@secure_headers
def log_security_event():
    """Log security events for monitoring"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid request data'}), 400

        # Validate and sanitize input
        event_type = sanitize_input(data.get('event_type', ''))
        details = data.get('details', {})

        if not event_type:
            return jsonify({'error': 'Event type is required'}), 400

        # Log security event
        log_security_event(event_type, details)

        return jsonify({'success': True, 'message': 'Security event logged'})

    except Exception as e:
        return jsonify({'error': 'Failed to log security event'}), 500

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
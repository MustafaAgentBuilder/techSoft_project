# 🚀 Virtual Specs 3D Try-On - Office Deployment Guide

## 📋 Quick Setup Commands

### 1. **Navigate to Project Directory**
```bash
cd P:\Others\TechSoft\VIRTUAL_SPECS
```

### 2. **Activate Virtual Environment**
```bash
# Windows Command Prompt
venv\Scripts\activate

# Windows PowerShell
.\venv\Scripts\Activate.ps1
```

### 3. **Install Dependencies**
```bash
pip install -r requirements.txt
```

### 4. **Generate Frame Images (One-time setup)**
```bash
python create_frames.py
```

### 5. **Start the Application**
```bash
# Development mode (with debugging)
python app.py

# Or for production:
flask run --host=0.0.0.0 --port=5000
```

### 6. **Access the Application**
- **Home Page:** http://localhost:5000
- **Photo Try-On:** http://localhost:5000/tryon/image
- **Live Webcam Try-On:** http://localhost:5000/tryon/live

## 🔧 Advanced Commands

### **Stop the Server**
- Press `Ctrl+C` in the terminal
- Or close the command window

### **Restart After Changes**
```bash
# The server auto-reloads in development mode
# Just save your changes and refresh the browser
```

### **Check Dependencies**
```bash
pip list
```

### **Update Dependencies**
```bash
pip install -r requirements.txt --upgrade
```

## 📁 Required File Structure

```
VIRTUAL_SPECS/
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── static/
│   ├── css/
│   │   └── styles.css         # Application styles
│   ├── js/
│   │   ├── main.js            # Core JavaScript
│   │   ├── photo-upload-simple.js    # Photo upload functionality
│   │   ├── live-tryon-simple.js      # Live webcam functionality
│   │   ├── overlay.js          # Frame overlay logic
│   │   └── security.js         # Security functions
│   ├── frames/                 # Frame images (generated automatically)
│   └── uploads/                # User uploaded images
├── templates/
│   ├── base.html               # Base template
│   ├── index.html              # Home page
│   ├── tryon_image.html        # Photo try-on page
│   └── tryon_live.html         # Live try-on page
└── venv/                       # Virtual environment
```

## 🌐 Network Access

### **For Office Network Access**
1. **Allow Firewall Exception:**
   - Windows may prompt to allow Python through firewall
   - Click "Allow access" for private networks

2. **Access from Other Computers:**
   ```bash
   # Use the computer's IP address instead of localhost
   http://[COMPUTER_IP]:5000
   # Example: http://192.168.1.100:5000
   ```

3. **Find Computer IP:**
   ```bash
   ipconfig
   # Look for "IPv4 Address" under your network adapter
   ```

## 🔒 Security Notes

- **Development Mode Only:** This setup is for development/testing
- **Camera Permissions:** Users must allow camera access for live try-on
- **Local Files Only:** No data is sent to external servers
- **Upload Security:** All uploads are scanned and sanitized

## 📱 Browser Compatibility

- ✅ Chrome (Recommended)
- ✅ Firefox
- ✅ Edge
- ❌ Safari (Some camera features may not work)

## 🚨 Troubleshooting

### **Server Won't Start**
```bash
# Check if port is already in use
netstat -ano | findstr :5000

# Kill existing process
taskkill /PID [PROCESS_ID] /F
```

### **Camera Not Working**
1. Check browser camera permissions
2. Ensure no other app is using the camera
3. Try refreshing the page
4. Use Chrome for best compatibility

### **Frames Not Loading**
```bash
# Regenerate frame images
python create_frames.py

# Check if static/frames directory exists
ls static/frames/
```

### **Upload Not Working**
1. Check if static/uploads directory exists
2. Ensure write permissions on the folder
3. Check browser console for errors

## 📞 Quick Support Commands

```bash
# Check server status
curl http://localhost:5000

# Check if frames are loading
curl http://localhost:5000/frames

# Test file upload endpoint
curl -X POST -F "file=@test.jpg" http://localhost:5000/upload
```

## 🎯 Ready for Presentation

Once running, the application provides:
- **Professional UI** with company branding
- **Photo Upload** try-on functionality
- **Live Webcam** real-time try-on
- **6 Frame Styles** (Classic, Vintage, Sport, Fashion, Minimalist)
- **Responsive Design** works on all devices
- **Error Handling** with user-friendly messages

**Total Setup Time:** 2-3 minutes
**Requirements:** Python 3.7+, Modern browser, Webcam (for live feature)
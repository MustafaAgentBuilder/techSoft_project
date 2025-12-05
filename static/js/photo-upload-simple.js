/**
 * SIMPLE WORKING VERSION - Photo Upload Manager
 * Fixed and simplified version that actually works
 */

class SimplePhotoUploadManager {
    constructor() {
        this.currentImage = null;
        this.currentFrame = null;
        this.canvas = null;
        this.ctx = null;
        this.allFrames = []; // Store all frames
        this.currentFilter = 'all'; // Current filter

        console.log('SimplePhotoUploadManager: Initializing...');
        this.init();
    }

    async init() {
        // Get canvas and context
        this.canvas = document.getElementById('tryonCanvas');
        if (!this.canvas) {
            console.error('Canvas not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        console.log('Canvas found and context initialized');

        // Setup event listeners
        this.setupEventListeners();

        // Setup category filters
        this.setupCategoryFilters();

        // Load frames
        await this.loadFrames();

        console.log('SimplePhotoUploadManager: Initialized successfully');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Upload button
        const uploadBtn = document.getElementById('uploadBtn');
        const photoInput = document.getElementById('photoInput');
        const uploadArea = document.getElementById('uploadArea');

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                console.log('Upload button clicked');
                photoInput?.click();
            });
        }

        if (uploadArea) {
            uploadArea.addEventListener('click', () => {
                console.log('Upload area clicked');
                photoInput?.click();
            });
        }

        if (photoInput) {
            photoInput.addEventListener('change', (e) => {
                console.log('File input changed');
                const file = e.target.files[0];
                if (file) {
                    this.handleFileUpload(file);
                }
            });
        }

        // Position controls
        const xSlider = document.getElementById('xSlider');
        const ySlider = document.getElementById('ySlider');
        const zoomSlider = document.getElementById('zoomSlider');
        const resetBtn = document.getElementById('resetBtn');

        if (xSlider) {
            xSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('xValue').textContent = value;
                this.updateFramePosition(value, parseInt(ySlider?.value || 200));
            });
        }

        if (ySlider) {
            ySlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('yValue').textContent = value;
                this.updateFramePosition(parseInt(xSlider?.value || 400), value);
            });
        }

        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('zoomValue').textContent = value;
                this.updateFrameScale(value / 100);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetPosition();
            });
        }

        console.log('Event listeners setup complete');
    }

    async handleFileUpload(file) {
        console.log('Handling file upload:', file.name);

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        try {
            // Upload to server
            const formData = new FormData();
            formData.append('file', file);

            console.log('Uploading to server...');
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Upload result:', result);

            if (result.success) {
                // Load image to canvas
                const imageUrl = `/static/uploads/${result.filename}`;
                await this.loadImageToCanvas(imageUrl);

                // Show canvas section
                document.getElementById('uploadArea').style.display = 'none';
                document.getElementById('canvasSection').style.display = 'block';

                alert('Photo uploaded successfully!');
            } else {
                alert('Upload failed: ' + result.error);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + error.message);
        }
    }

    async loadImageToCanvas(imageSrc) {
        console.log('Loading image to canvas:', imageSrc);

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;

                // Set canvas size to match image
                this.canvas.width = img.width;
                this.canvas.height = img.height;

                // Draw image
                this.ctx.drawImage(img, 0, 0);

                console.log('Image loaded to canvas');
                resolve();
            };
            img.onerror = reject;
            img.src = imageSrc;
        });
    }

    async loadFrames() {
        console.log('Loading frames...');

        try {
            const response = await fetch('/frames');
            const data = await response.json();

            if (data.success) {
                this.allFrames = data.frames; // Store all frames
                this.displayFrames(data.frames);
                console.log('Frames loaded successfully');
            }
        } catch (error) {
            console.error('Error loading frames:', error);
        }
    }

    displayFrames(frames) {
        const frameOptions = document.getElementById('frameOptions');
        if (!frameOptions) {
            console.error('frameOptions element not found!');
            return;
        }

        frameOptions.innerHTML = '';

        // Add debug info
        const debugInfo = document.createElement('div');
        debugInfo.innerHTML = `<p style="color: green;">✅ Found ${frames.length} frames from API</p>`;
        frameOptions.appendChild(debugInfo);

        frames.forEach((frame, index) => {
            const frameBtn = document.createElement('button');
            frameBtn.className = 'frame-option';
            frameBtn.style.cssText = 'margin: 5px; padding: 10px; border: 2px solid blue; background: white; cursor: pointer;';
            frameBtn.innerHTML = `
                <div>
                    <img src="${frame.image_url}" alt="${frame.name}" style="width: 50px; height: auto; display: block; margin-bottom: 5px;">
                    <div>${frame.name}</div>
                    <div style="font-size: 10px; color: #666;">${frame.image_url}</div>
                </div>
            `;

            frameBtn.addEventListener('click', () => {
                console.log(`Frame ${index + 1} clicked:`, frame);
                alert(`Loading frame: ${frame.name}`);
                this.selectFrame(frame);
            });

            frameOptions.appendChild(frameBtn);
        });

        console.log('✅ Frames displayed successfully:', frames.length, 'frames');
    }

    async selectFrame(frame) {
        console.log('Selecting frame:', frame.name);

        try {
            const img = new Image();
            img.onload = () => {
                this.currentFrame = img;
                this.currentFrameData = frame; // Store frame data for sizing
                console.log('Frame loaded successfully - dimensions:', img.width, 'x', img.height);
                this.render();
                console.log('Frame rendered successfully');
            };
            img.onerror = (error) => {
                console.error('Frame image failed to load:', error);
            };
            img.src = frame.image_url;
        } catch (error) {
            console.error('Error loading frame:', error);
        }
    }

    updateFramePosition(x, y) {
        this.frameX = x;
        this.frameY = y;
        this.render();
    }

    updateFrameScale(scale) {
        this.frameScale = scale;
        this.render();
    }

    resetPosition() {
        this.frameX = this.canvas ? this.canvas.width / 2 : 400;
        this.frameY = this.canvas ? this.canvas.height / 2 : 200;
        this.frameScale = 1.0;

        // Update sliders
        const xSlider = document.getElementById('xSlider');
        const ySlider = document.getElementById('ySlider');
        const zoomSlider = document.getElementById('zoomSlider');

        if (xSlider) {
            xSlider.value = this.frameX;
            document.getElementById('xValue').textContent = Math.round(this.frameX);
        }
        if (ySlider) {
            ySlider.value = this.frameY;
            document.getElementById('yValue').textContent = Math.round(this.frameY);
        }
        if (zoomSlider) {
            zoomSlider.value = 100;
            document.getElementById('zoomValue').textContent = '100';
        }

        this.render();
    }

    render() {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw base image
        if (this.currentImage) {
            this.ctx.drawImage(this.currentImage, 0, 0);
        } else {
            // Draw placeholder
            this.ctx.fillStyle = '#f0f0f0';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#333';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Upload an image to begin', this.canvas.width / 2, this.canvas.height / 2);
        }

        // Draw frame overlay with PROPER SIZING
        if (this.currentFrame && this.currentFrameData) {
            // Calculate target frame size based on image dimensions
            const targetWidth = Math.min(this.canvas.width * 0.4, 300); // Max 40% of image width or 300px
            const targetHeight = Math.min(this.canvas.height * 0.15, 100); // Max 15% of image height or 100px

            // Calculate scale to fit target size
            const scaleX = targetWidth / this.currentFrame.width;
            const scaleY = targetHeight / this.currentFrame.height;
            const baseScale = Math.min(scaleX, scaleY) * (this.frameScale || 1.0);

            // Calculate position
            const frameWidth = this.currentFrame.width * baseScale;
            const frameHeight = this.currentFrame.height * baseScale;
            const x = (this.frameX || this.canvas.width / 2) - (frameWidth / 2);
            const y = (this.frameY || this.canvas.height / 2) - (frameHeight / 2);

            console.log('Drawing frame - Position:', x, y, 'Size:', frameWidth, frameHeight, 'Scale:', baseScale);

            // Draw frame with shadow for better visibility
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;

            this.ctx.drawImage(this.currentFrame, x, y, frameWidth, frameHeight);

            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;

            console.log('Frame drawn successfully!');
        }
    }

    setupCategoryFilters() {
        console.log('Setting up category filters...');

        // Add click handlers to category filter buttons
        const categoryFilters = document.querySelectorAll('.category-filter');
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                console.log('Category filter clicked:', category);
                this.setActiveFilter(category);
                this.filterFrames(category);
            });
        });
    }

    setActiveFilter(category) {
        // Update active state on filter buttons
        const categoryFilters = document.querySelectorAll('.category-filter');
        categoryFilters.forEach(filter => {
            filter.classList.remove('active');
            if (filter.dataset.category === category) {
                filter.classList.add('active');
            }
        });
        this.currentFilter = category;
    }

    filterFrames(category) {
        console.log('Filtering frames by category:', category);

        let filteredFrames = this.allFrames;

        if (category !== 'all') {
            filteredFrames = this.allFrames.filter(frame =>
                frame.category && frame.category.toLowerCase() === category.toLowerCase()
            );
        }

        console.log(`Showing ${filteredFrames.length} frames for category: ${category}`);
        this.displayFrames(filteredFrames);

        // Update filter info
        const filterInfo = document.getElementById('filterInfo');
        if (filterInfo) {
            const filterCount = document.getElementById('filterCount');
            if (filterCount) {
                filterCount.textContent = `${filteredFrames.length} frames found`;
            }
            filterInfo.style.display = 'block';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing SimplePhotoUploadManager');

    // Check if we're on the photo try-on page
    if (document.getElementById('tryonCanvas')) {
        window.simplePhotoUploadManager = new SimplePhotoUploadManager();
    }
});
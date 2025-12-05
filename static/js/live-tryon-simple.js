/**
 * SIMPLE WORKING VERSION - Live Try-On Manager
 * Fixed and simplified version that actually works
 */

class SimpleLiveTryOnManager {
    constructor() {
        this.webcamManager = null;
        this.currentFrame = null;
        this.canvas = null;
        this.ctx = null;
        this.isStreaming = false;
        this.allFrames = []; // Store all frames
        this.currentFilter = 'all'; // Current filter

        console.log('SimpleLiveTryOnManager: Initializing...');
        this.init();
    }

    async init() {
        // Get canvas and context
        this.canvas = document.getElementById('liveCanvas');
        if (!this.canvas) {
            console.error('Live canvas not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        console.log('Live canvas found and context initialized');

        // Setup event listeners
        this.setupEventListeners();

        // Setup category filters
        this.setupCategoryFilters();

        // Load frames
        await this.loadFrames();

        // Setup webcam
        await this.setupWebcam();

        console.log('SimpleLiveTryOnManager: Initialized successfully');
    }

    setupEventListeners() {
        console.log('Setting up live event listeners...');

        // Position controls
        const xSlider = document.getElementById('liveXSlider');
        const ySlider = document.getElementById('liveYSlider');
        const zoomSlider = document.getElementById('liveZoomSlider');
        const resetBtn = document.getElementById('liveResetBtn');

        if (xSlider) {
            xSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                const xValueEl = document.getElementById('liveXValue');
                if (xValueEl) xValueEl.textContent = value;
                this.updateFramePosition(value, parseInt(ySlider?.value || 200));
            });
        }

        if (ySlider) {
            ySlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                const yValueEl = document.getElementById('liveYValue');
                if (yValueEl) yValueEl.textContent = value;
                this.updateFramePosition(parseInt(xSlider?.value || 400), value);
            });
        }

        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                const zoomValueEl = document.getElementById('liveZoomValue');
                if (zoomValueEl) zoomValueEl.textContent = value;
                this.updateFrameScale(value / 100);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetPosition();
            });
        }

        console.log('Live event listeners setup complete');
    }

    async setupWebcam() {
        console.log('Setting up webcam...');

        try {
            const video = document.getElementById('webcamVideo');
            if (!video) {
                console.error('Webcam video element not found');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            video.srcObject = stream;
            video.play();

            // Wait for video to be ready
            video.addEventListener('loadedmetadata', () => {
                this.canvas.width = video.videoWidth;
                this.canvas.height = video.videoHeight;
                this.isStreaming = true;
                this.startRendering();

                // Show controls
                const controlsSection = document.getElementById('liveControls');
                if (controlsSection) {
                    controlsSection.style.display = 'block';
                }

                console.log('Webcam setup complete and streaming started');
            });

        } catch (error) {
            console.error('Error setting up webcam:', error);
            alert('Unable to access webcam. Please ensure you have granted camera permissions.');
        }
    }

    async loadFrames() {
        console.log('Loading live frames...');

        try {
            const response = await fetch('/frames');
            const data = await response.json();

            if (data.success) {
                this.allFrames = data.frames; // Store all frames
                this.displayFrames(data.frames);
                console.log('Live frames loaded successfully');
            }
        } catch (error) {
            console.error('Error loading live frames:', error);
        }
    }

    displayFrames(frames) {
        const frameOptions = document.getElementById('liveFrameOptions');
        if (!frameOptions) {
            console.error('liveFrameOptions element not found!');
            return;
        }

        frameOptions.innerHTML = '';

        // Add debug info
        const debugInfo = document.createElement('div');
        debugInfo.innerHTML = `<p style="color: green;">✅ Live: Found ${frames.length} frames from API</p>`;
        frameOptions.appendChild(debugInfo);

        frames.forEach((frame, index) => {
            const frameBtn = document.createElement('button');
            frameBtn.className = 'frame-option';
            frameBtn.style.cssText = 'margin: 5px; padding: 10px; border: 2px solid red; background: white; cursor: pointer;';
            frameBtn.innerHTML = `
                <div>
                    <img src="${frame.image_url}" alt="${frame.name}" style="width: 50px; height: auto; display: block; margin-bottom: 5px;">
                    <div>${frame.name}</div>
                    <div style="font-size: 10px; color: #666;">${frame.image_url}</div>
                </div>
            `;

            frameBtn.addEventListener('click', () => {
                console.log(`Live Frame ${index + 1} clicked:`, frame);
                alert(`Loading live frame: ${frame.name}`);
                this.selectFrame(frame);
            });

            frameOptions.appendChild(frameBtn);
        });

        console.log('✅ Live frames displayed successfully:', frames.length, 'frames');
    }

    async selectFrame(frame) {
        console.log('Selecting live frame:', frame.name);

        try {
            const img = new Image();
            img.onload = () => {
                this.currentFrame = img;
                this.currentFrameData = frame; // Store frame data for sizing
                console.log('Live frame loaded successfully - dimensions:', img.width, 'x', img.height);
            };
            img.onerror = (error) => {
                console.error('Live frame image failed to load:', error);
            };
            img.src = frame.image_url;
        } catch (error) {
            console.error('Error loading live frame:', error);
        }
    }

    updateFramePosition(x, y) {
        this.frameX = x;
        this.frameY = y;
    }

    updateFrameScale(scale) {
        this.frameScale = scale;
    }

    resetPosition() {
        this.frameX = this.canvas ? this.canvas.width / 2 : 400;
        this.frameY = this.canvas ? this.canvas.height / 2 : 200;
        this.frameScale = 1.0;

        // Update sliders
        const xSlider = document.getElementById('liveXSlider');
        const ySlider = document.getElementById('liveYSlider');
        const zoomSlider = document.getElementById('liveZoomSlider');

        if (xSlider) {
            xSlider.value = this.frameX;
            const xValueEl = document.getElementById('liveXValue');
            if (xValueEl) xValueEl.textContent = Math.round(this.frameX);
        }
        if (ySlider) {
            ySlider.value = this.frameY;
            const yValueEl = document.getElementById('liveYValue');
            if (yValueEl) yValueEl.textContent = Math.round(this.frameY);
        }
        if (zoomSlider) {
            zoomSlider.value = 100;
            const zoomValueEl = document.getElementById('liveZoomValue');
            if (zoomValueEl) zoomValueEl.textContent = '100';
        }
    }

    startRendering() {
        const render = () => {
            if (this.isStreaming) {
                this.render();
                requestAnimationFrame(render);
            }
        };
        render();
    }

    render() {
        if (!this.ctx || !this.canvas) return;

        const video = document.getElementById('webcamVideo');
        if (!video || video.readyState !== 4) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw video frame
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

        // Draw frame overlay with PROPER SIZING
        if (this.currentFrame && this.currentFrameData) {
            // Calculate target frame size based on video dimensions
            const targetWidth = Math.min(this.canvas.width * 0.4, 300); // Max 40% of video width or 300px
            const targetHeight = Math.min(this.canvas.height * 0.15, 100); // Max 15% of video height or 100px

            // Calculate scale to fit target size
            const scaleX = targetWidth / this.currentFrame.width;
            const scaleY = targetHeight / this.currentFrame.height;
            const baseScale = Math.min(scaleX, scaleY) * (this.frameScale || 1.0);

            // Calculate position
            const frameWidth = this.currentFrame.width * baseScale;
            const frameHeight = this.currentFrame.height * baseScale;
            const x = (this.frameX || this.canvas.width / 2) - (frameWidth / 2);
            const y = (this.frameY || this.canvas.height / 2) - (frameHeight / 2);

            console.log('Drawing live frame - Position:', x, y, 'Size:', frameWidth, frameHeight, 'Scale:', baseScale);

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

            console.log('Live frame drawn successfully!');
        }
    }

    setupCategoryFilters() {
        console.log('Setting up live category filters...');

        // Add click handlers to category filter buttons
        const categoryFilters = document.querySelectorAll('.category-filter');
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                console.log('Live category filter clicked:', category);
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
        console.log('Live filtering frames by category:', category);

        let filteredFrames = this.allFrames;

        if (category !== 'all') {
            filteredFrames = this.allFrames.filter(frame =>
                frame.category && frame.category.toLowerCase() === category.toLowerCase()
            );
        }

        console.log(`Live showing ${filteredFrames.length} frames for category: ${category}`);
        this.displayFrames(filteredFrames);

        // Update filter info
        const filterInfo = document.getElementById('liveFilterInfo');
        if (filterInfo) {
            const filterCount = document.getElementById('liveFilterCount');
            if (filterCount) {
                filterCount.textContent = `${filteredFrames.length} frames found`;
            }
            filterInfo.style.display = 'block';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing SimpleLiveTryOnManager');

    // Check if we're on the live try-on page
    if (document.getElementById('liveCanvas') && document.getElementById('webcamVideo')) {
        window.simpleLiveTryOnManager = new SimpleLiveTryOnManager();
    }
});
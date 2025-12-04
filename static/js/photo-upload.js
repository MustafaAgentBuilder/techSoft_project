/**
 * Virtual Specs 3D Try-On MVP - Photo Upload Functionality
 * Handles file upload, validation, and integration with overlay engine
 */

class PhotoUploadManager {
    constructor() {
        this.overlayEngine = null;
        this.currentImage = null;
        this.frames = [];
        this.selectedFrame = null;

        this.init();
    }

    async init() {
        // Initialize overlay engine
        this.overlayEngine = new OverlayEngine('tryonCanvas');

        // Load available frames
        await this.loadFrames();

        // Setup event listeners
        this.setupEventListeners();

        console.log('Photo Upload Manager initialized');
    }

    /**
     * Load available frames from API
     */
    async loadFrames() {
        try {
            const response = await API.getFrames();
            if (response.success) {
                this.frames = response.frames;
                this.populateFrameSelector();
                console.log(`Loaded ${this.frames.length} frames`);
            }
        } catch (error) {
            console.error('Failed to load frames:', error);
            Utils.showError('Failed to load frame options. Please refresh the page.');
        }
    }

    /**
     * Populate frame selector UI
     */
    populateFrameSelector() {
        const frameOptions = document.getElementById('frameOptions');
        if (!frameOptions) return;

        frameOptions.innerHTML = '';

        this.frames.forEach(frame => {
            const frameOption = document.createElement('div');
            frameOption.className = 'frame-option';
            frameOption.dataset.frameId = frame.id;

            frameOption.innerHTML = `
                <img src="${frame.image_url}" alt="${frame.name}" onerror="this.style.display='none'">
                <span>${frame.name}</span>
            `;

            frameOption.addEventListener('click', () => {
                this.selectFrame(frame);
            });

            frameOptions.appendChild(frameOption);
        });

        // Select first frame by default
        if (this.frames.length > 0) {
            this.selectFrame(this.frames[0]);
        }
    }

    /**
     * Handle frame selection
     */
    async selectFrame(frame) {
        try {
            // Update UI
            document.querySelectorAll('.frame-option').forEach(option => {
                option.classList.remove('active');
            });

            const selectedOption = document.querySelector(`[data-frame-id="${frame.id}"]`);
            if (selectedOption) {
                selectedOption.classList.add('active');
            }

            // Load frame image
            await this.overlayEngine.loadFrame(frame.image_url, {
                width: frame.default_width,
                height: frame.default_height
            });

            // Set default position
            this.overlayEngine.setPosition(frame.default_x, frame.default_y);
            this.overlayEngine.setScale(1.0);

            // Update position controls
            this.updatePositionControls(frame);

            this.selectedFrame = frame;
            console.log(`Selected frame: ${frame.name}`);

        } catch (error) {
            console.error('Failed to load frame:', error);
            Utils.showError('Failed to load frame. Please try again.');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // File input
        const photoInput = document.getElementById('photoInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadArea = document.getElementById('uploadArea');

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => photoInput?.click());
        }

        if (uploadArea) {
            uploadArea.addEventListener('click', () => photoInput?.click());
        }

        if (photoInput) {
            photoInput.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files[0]);
            });
        }

        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('drop', this.handleDrop.bind(this));
            uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
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
                this.overlayEngine.setPosition(value, parseInt(ySlider.value));
            });
        }

        if (ySlider) {
            ySlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('yValue').textContent = value;
                this.overlayEngine.setPosition(parseInt(xSlider.value), value);
            });
        }

        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('zoomValue').textContent = value;
                this.overlayEngine.setScale(value / 100);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetPosition();
            });
        }
    }

    /**
     * Handle file selection
     */
    async handleFileSelect(file) {
        if (!file) return;

        // Validate file
        const validation = Utils.validateFile(file);
        if (!validation.valid) {
            Utils.showError(validation.error);
            return;
        }

        try {
            Utils.showLoading(document.getElementById('uploadArea'));

            // Upload file to server
            const uploadResponse = await API.uploadFile(file, (percent) => {
                console.log(`Upload progress: ${percent}%`);
            });

            if (uploadResponse.success) {
                // Load image into canvas
                const imageUrl = `/static/uploads/${uploadResponse.filename}`;
                await this.overlayEngine.loadImage(imageUrl);

                // Show canvas section
                document.getElementById('uploadSection').style.display = 'none';
                document.getElementById('canvasSection').style.display = 'grid';
                document.getElementById('canvasSection').classList.add('fade-in');

                this.currentImage = uploadResponse;
                console.log('Image uploaded and loaded successfully');

                Utils.showSuccess('Photo uploaded successfully!');
            } else {
                throw new Error(uploadResponse.error || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload failed:', error);
            Utils.showError('Failed to upload photo. Please try again.');
        } finally {
            Utils.hideLoading(document.getElementById('uploadArea'));
        }
    }

    /**
     * Drag and drop handlers
     */
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.style.borderColor = '#667eea';
        event.currentTarget.style.backgroundColor = '#f1f3f5';
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.style.borderColor = '#dee2e6';
        event.currentTarget.style.backgroundColor = 'transparent';
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();

        const uploadArea = event.currentTarget;
        uploadArea.style.borderColor = '#dee2e6';
        uploadArea.style.backgroundColor = 'transparent';

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileSelect(files[0]);
        }
    }

    /**
     * Update position control values
     */
    updatePositionControls(frame) {
        const xSlider = document.getElementById('xSlider');
        const ySlider = document.getElementById('ySlider');
        const zoomSlider = document.getElementById('zoomSlider');

        if (xSlider) {
            xSlider.value = frame.default_x;
            document.getElementById('xValue').textContent = frame.default_x;
        }

        if (ySlider) {
            ySlider.value = frame.default_y;
            document.getElementById('yValue').textContent = frame.default_y;
        }

        if (zoomSlider) {
            zoomSlider.value = 100;
            document.getElementById('zoomValue').textContent = 100;
        }
    }

    /**
     * Reset frame position
     */
    resetPosition() {
        if (this.selectedFrame) {
            this.overlayEngine.setPosition(
                this.selectedFrame.default_x,
                this.selectedFrame.default_y
            );
            this.overlayEngine.setScale(1.0);

            // Update sliders
            document.getElementById('xSlider').value = this.selectedFrame.default_x;
            document.getElementById('xValue').textContent = this.selectedFrame.default_x;
            document.getElementById('ySlider').value = this.selectedFrame.default_y;
            document.getElementById('yValue').textContent = this.selectedFrame.default_y;
            document.getElementById('zoomSlider').value = 100;
            document.getElementById('zoomValue').textContent = 100;
        }
    }

    /**
     * Get current state for saving
     */
    getState() {
        return {
            image: this.currentImage,
            selectedFrame: this.selectedFrame,
            overlayState: this.overlayEngine ? this.overlayEngine.getState() : null
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.overlayEngine) {
            this.overlayEngine.destroy();
        }
        this.currentImage = null;
        this.frames = [];
        this.selectedFrame = null;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the photo try-on page
    if (document.getElementById('tryonCanvas')) {
        window.photoUploadManager = new PhotoUploadManager();
    }
});
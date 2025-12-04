/**
 * Virtual Specs 3D Try-On MVP - Canvas Overlay Engine
 * Handles frame overlay rendering on images and video streams
 */

class OverlayEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // State management
        this.state = {
            image: null,
            frame: null,
            position: { x: 400, y: 200 },
            scale: 1.0,
            isDragging: false,
            dragStart: { x: 0, y: 0 }
        };

        // Performance tracking
        this.performance = {
            lastRenderTime: 0,
            renderCount: 0,
            fps: 0
        };

        // Initialize event listeners
        this.initEventListeners();
    }

    /**
     * Initialize canvas event listeners
     */
    initEventListeners() {
        // Mouse events for dragging
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    /**
     * Load and set the base image
     */
    async loadImage(imageSrc) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.state.image = img;

                // Resize canvas to match image
                this.canvas.width = img.width;
                this.canvas.height = img.height;

                // Reset position to center
                this.state.position = {
                    x: img.width / 2,
                    y: img.height / 2
                };

                this.render();
                resolve(img);
            };
            img.onerror = reject;
            img.src = imageSrc;
        });
    }

    /**
     * Load and set the frame image
     */
    async loadFrame(frameSrc, defaultSize = { width: 300, height: 100 }) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.state.frame = img;
                this.render();
                resolve(img);
            };
            img.onerror = reject;
            img.src = frameSrc;
        });
    }

    /**
     * Preload multiple frames for smooth switching
     */
    async preloadFrames(frameUrls) {
        const preloadPromises = frameUrls.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error(`Failed to load frame: ${url}`));
                img.src = url;
            });
        });

        try {
            const frames = await Promise.all(preloadPromises);
            console.log(`Preloaded ${frames.length} frames successfully`);
            return frames;
        } catch (error) {
            console.warn('Some frames failed to preload:', error);
            return [];
        }
    }

    /**
     * Main rendering function
     */
    render() {
        const startTime = performance.now();

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw base image if available
        if (this.state.image) {
            this.ctx.drawImage(this.state.image, 0, 0);
        }

        // Draw frame overlay if available
        if (this.state.frame) {
            this.drawFrame();
        }

        // Update performance metrics
        this.updatePerformanceMetrics(startTime);
    }

    /**
     * Draw frame with current position and scale
     */
    drawFrame() {
        const { frame, position, scale } = this.state;

        // Calculate frame dimensions
        const frameWidth = frame.width * scale;
        const frameHeight = frame.height * scale;

        // Center frame on position
        const x = position.x - (frameWidth / 2);
        const y = position.y - (frameHeight / 2);

        // Draw frame
        this.ctx.drawImage(frame, x, y, frameWidth, frameHeight);

        // Debug: Draw position marker (remove in production)
        if (VirtualSpecs.config.debug) {
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, frameWidth, frameHeight);

            // Draw center point
            this.ctx.beginPath();
            this.ctx.arc(position.x, position.y, 5, 0, 2 * Math.PI);
            this.ctx.fillStyle = 'red';
            this.ctx.fill();
        }
    }

    /**
     * Update frame position
     */
    setPosition(x, y) {
        this.state.position = { x, y };
        this.render();
    }

    /**
     * Update frame scale
     */
    setScale(scale) {
        this.state.scale = scale;
        this.render();
    }

    /**
     * Reset frame to default position and scale
     */
    resetPosition(defaultPosition = null) {
        if (defaultPosition) {
            this.state.position = { ...defaultPosition };
        } else if (this.state.image) {
            this.state.position = {
                x: this.state.image.width / 2,
                y: this.state.image.height / 2
            };
        }
        this.state.scale = 1.0;
        this.render();
    }

    /**
     * Mouse event handlers
     */
    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if clicking on frame (simplified - could use pixel data for accuracy)
        const frameBounds = this.getFrameBounds();
        if (this.isPointInFrame(x, y, frameBounds)) {
            this.state.isDragging = true;
            this.state.dragStart = {
                x: x - this.state.position.x,
                y: y - this.state.position.y
            };
            this.canvas.style.cursor = 'grabbing';
        }
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.state.isDragging) {
            this.state.position.x = x - this.state.dragStart.x;
            this.state.position.y = y - this.state.dragStart.y;
            this.render();
        } else {
            // Update cursor based on hover
            const frameBounds = this.getFrameBounds();
            this.canvas.style.cursor = this.isPointInFrame(x, y, frameBounds) ? 'grab' : 'default';
        }
    }

    handleMouseUp() {
        this.state.isDragging = false;
        this.canvas.style.cursor = 'default';
    }

    /**
     * Touch event handlers for mobile
     */
    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // Simulate mouse down
        this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }

    handleTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    handleTouchEnd(event) {
        event.preventDefault();
        this.handleMouseUp();
    }

    /**
     * Helper methods
     */
    getFrameBounds() {
        if (!this.state.frame) return null;

        const { frame, position, scale } = this.state;
        const frameWidth = frame.width * scale;
        const frameHeight = frame.height * scale;

        return {
            left: position.x - (frameWidth / 2),
            top: position.y - (frameHeight / 2),
            right: position.x + (frameWidth / 2),
            bottom: position.y + (frameHeight / 2),
            width: frameWidth,
            height: frameHeight
        };
    }

    isPointInFrame(x, y, bounds) {
        if (!bounds) return false;
        return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
    }

    updatePerformanceMetrics(startTime) {
        const renderTime = performance.now() - startTime;
        this.performance.renderCount++;

        // Update FPS every 10 renders
        if (this.performance.renderCount % 10 === 0) {
            this.performance.fps = 1000 / renderTime;

            // Log if performance is below target
            if (renderTime > VirtualSpecs.config.performanceTargets.overlayResponse) {
                console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms (target: ${VirtualSpecs.config.performanceTargets.overlayResponse}ms)`);
            }
        }
    }

    /**
     * Get current state for serialization
     */
    getState() {
        return {
            position: { ...this.state.position },
            scale: this.state.scale,
            performance: { ...this.performance }
        };
    }

    /**
     * Restore state from serialization
     */
    setState(state) {
        if (state.position) {
            this.state.position = { ...state.position };
        }
        if (state.scale !== undefined) {
            this.state.scale = state.scale;
        }
        this.render();
    }

    /**
     * Clear all resources
     */
    destroy() {
        this.state.image = null;
        this.state.frame = null;

        // Remove event listeners
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OverlayEngine;
}
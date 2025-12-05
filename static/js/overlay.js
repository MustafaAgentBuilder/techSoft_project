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

        // Animation state
        this.animation = {
            isTransitioning: false,
            transitionType: null,
            transitionStartTime: 0,
            transitionDuration: 500, // milliseconds
            previousFrame: null,
            transitionProgress: 0
        };

        // Frame cache for instant switching
        this.frameCache = new Map();
        this.preloadingInProgress = new Set();
        this.preloadQueue = [];

        // Performance tracking
        this.performance = {
            lastRenderTime: 0,
            renderCount: 0,
            fps: 0,
            cacheHitCount: 0,
            cacheMissCount: 0
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
     * Load and set the frame image with optional transition animation
     */
    async loadFrame(frameSrc, defaultSize = { width: 300, height: 100 }, transitionType = 'fade') {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Start transition animation
                if (this.state.frame && this.state.frame !== img) {
                    this.startFrameTransition(this.state.frame, img, transitionType);
                } else {
                    this.state.frame = img;
                    this.render();
                }
                resolve(img);
            };
            img.onerror = reject;
            img.src = frameSrc;
        });
    }

    /**
     * Start smooth frame transition animation
     */
    startFrameTransition(oldFrame, newFrame, transitionType = 'fade') {
        this.animation.isTransitioning = true;
        this.animation.transitionType = transitionType;
        this.animation.transitionStartTime = performance.now();
        this.animation.previousFrame = oldFrame;
        this.animation.transitionProgress = 0;

        // Set transition duration based on type
        const transitionDurations = {
            'fade': 400,
            'slide': 500,
            'zoom': 600,
            'flip': 700
        };
        this.animation.transitionDuration = transitionDurations[transitionType] || 400;

        // Add transition class to canvas
        this.canvas.classList.add('canvas-frame-overlay', 'frame-transitioning');
        this.canvas.classList.add(`frame-transition-${transitionType}`);

        this.state.frame = newFrame;
        this.animateTransition();
    }

    /**
     * Animate frame transition
     */
    animateTransition() {
        if (!this.animation.isTransitioning) return;

        const currentTime = performance.now();
        const elapsed = currentTime - this.animation.transitionStartTime;
        const progress = Math.min(elapsed / this.animation.transitionDuration, 1);

        this.animation.transitionProgress = progress;

        // Apply easing function for smooth animation
        const easedProgress = this.easeInOutCubic(progress);

        // Render with transition effect
        this.renderWithTransition(easedProgress);

        if (progress < 1) {
            requestAnimationFrame(() => this.animateTransition());
        } else {
            // Transition complete
            this.endTransition();
        }
    }

    /**
     * End frame transition
     */
    endTransition() {
        this.animation.isTransitioning = false;
        this.animation.previousFrame = null;
        this.animation.transitionProgress = 0;

        // Remove transition classes
        this.canvas.classList.remove('frame-transitioning');
        this.canvas.classList.remove(`frame-transition-${this.animation.transitionType}`);
        this.canvas.classList.remove('canvas-frame-overlay');

        this.render();
    }

    /**
     * Render with transition effects
     */
    renderWithTransition(progress) {
        const { previousFrame, transitionType } = this.animation;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw base image
        if (this.state.image) {
            this.ctx.drawImage(this.state.image, 0, 0);
        }

        // Apply transition effects
        if (previousFrame && this.state.frame) {
            switch (transitionType) {
                case 'fade':
                    this.renderFadeTransition(previousFrame, this.state.frame, progress);
                    break;
                case 'slide':
                    this.renderSlideTransition(previousFrame, this.state.frame, progress);
                    break;
                case 'zoom':
                    this.renderZoomTransition(previousFrame, this.state.frame, progress);
                    break;
                case 'flip':
                    this.renderFlipTransition(previousFrame, this.state.frame, progress);
                    break;
                default:
                    this.renderFadeTransition(previousFrame, this.state.frame, progress);
            }
        } else {
            // Draw current frame
            if (this.state.frame) {
                this.drawFrame();
            }
        }

        // Update performance metrics
        this.updatePerformanceMetrics(performance.now());
    }

    /**
     * Render fade transition between frames
     */
    renderFadeTransition(oldFrame, newFrame, progress) {
        const { position, scale } = this.state;

        // Draw old frame with decreasing opacity
        if (progress < 0.5) {
            this.ctx.globalAlpha = 1 - (progress * 2);
            this.drawImageFrame(oldFrame, position, scale);
        }

        // Draw new frame with increasing opacity
        if (progress > 0) {
            this.ctx.globalAlpha = Math.min(progress * 2, 1);
            this.drawImageFrame(newFrame, position, scale);
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Render slide transition between frames
     */
    renderSlideTransition(oldFrame, newFrame, progress) {
        const { position, scale } = this.state;
        const slideDistance = this.canvas.width * 0.3;

        // Calculate slide positions
        const oldX = position.x - (slideDistance * progress);
        const newX = position.x + (slideDistance * (1 - progress));

        // Draw old frame sliding out
        if (progress < 1) {
            this.ctx.globalAlpha = 1 - progress;
            this.drawImageFrame(oldFrame, { x: oldX, y: position.y }, scale);
        }

        // Draw new frame sliding in
        if (progress > 0) {
            this.ctx.globalAlpha = progress;
            this.drawImageFrame(newFrame, { x: newX, y: position.y }, scale);
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Render zoom transition between frames
     */
    renderZoomTransition(oldFrame, newFrame, progress) {
        const { position, scale } = this.state;

        // Draw old frame scaling down
        if (progress < 0.6) {
            const zoomProgress = progress / 0.6;
            const oldScale = scale * (1 - zoomProgress * 0.5);
            this.ctx.globalAlpha = 1 - zoomProgress;
            this.drawImageFrame(oldFrame, position, oldScale);
        }

        // Draw new frame scaling up
        if (progress > 0.4) {
            const zoomProgress = (progress - 0.4) / 0.6;
            const newScale = scale * (0.8 + zoomProgress * 0.2);
            this.ctx.globalAlpha = Math.min(zoomProgress * 2, 1);
            this.drawImageFrame(newFrame, position, newScale);
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Render flip transition between frames
     */
    renderFlipTransition(oldFrame, newFrame, progress) {
        const { position, scale } = this.state;
        const halfProgress = Math.floor(progress * 2);

        // Use scaling to simulate 3D flip
        const scaleX = Math.abs(Math.cos(progress * Math.PI));

        if (progress < 0.5) {
            // First half: show old frame shrinking
            this.ctx.globalAlpha = 1 - (progress * 2);
            const flipScale = scale * scaleX;
            this.drawImageFrame(oldFrame, position, flipScale);
        } else {
            // Second half: show new frame growing
            this.ctx.globalAlpha = (progress - 0.5) * 2;
            const flipScale = scale * scaleX;
            this.drawImageFrame(newFrame, position, flipScale);
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw frame image with specified position and scale
     */
    drawImageFrame(frameImg, position, scale) {
        const frameWidth = frameImg.width * scale;
        const frameHeight = frameImg.height * scale;
        const x = position.x - (frameWidth / 2);
        const y = position.y - (frameHeight / 2);

        this.ctx.drawImage(frameImg, x, y, frameWidth, frameHeight);
    }

    /**
     * Easing function for smooth animations
     */
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Enhanced frame preloading with intelligent caching
     */
    async preloadFrames(frameUrls, priority = 'normal') {
        const prioritizedUrls = this.prioritizeFrames(frameUrls, priority);

        // Start preloading in batches to avoid overwhelming the browser
        const batchSize = 3;
        const results = [];

        for (let i = 0; i < prioritizedUrls.length; i += batchSize) {
            const batch = prioritizedUrls.slice(i, i + batchSize);
            const batchResults = await Promise.allSettled(
                batch.map(url => this.preloadSingleFrame(url))
            );

            results.push(...batchResults);

            // Small delay between batches to prevent blocking
            if (i + batchSize < prioritizedUrls.length) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        console.log(`Preloaded ${successCount}/${frameUrls.length} frames successfully`);

        return results;
    }

    /**
     * Preload a single frame with caching
     */
    async preloadSingleFrame(url) {
        // Return from cache if already loaded
        if (this.frameCache.has(url)) {
            this.performance.cacheHitCount++;
            return this.frameCache.get(url);
        }

        // Skip if already preloading
        if (this.preloadingInProgress.has(url)) {
            return new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    if (!this.preloadingInProgress.has(url)) {
                        clearInterval(checkInterval);
                        if (this.frameCache.has(url)) {
                            resolve(this.frameCache.get(url));
                        } else {
                            reject(new Error(`Failed to preload frame: ${url}`));
                        }
                    }
                }, 100);
            });
        }

        this.preloadingInProgress.add(url);
        this.performance.cacheMissCount++;

        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                // Cache the loaded image
                this.frameCache.set(url, img);
                this.preloadingInProgress.delete(url);

                // Log memory usage warning if cache gets too large
                if (this.frameCache.size > 20) {
                    console.warn('Frame cache size is large, consider implementing LRU eviction');
                }

                resolve(img);
            };

            img.onerror = () => {
                this.preloadingInProgress.delete(url);
                reject(new Error(`Failed to load frame: ${url}`));
            };

            // Start loading with a slight delay to allow for other operations
            setTimeout(() => {
                img.src = url;
            }, 10);
        });
    }

    /**
     * Prioritize frames based on usage patterns and category
     */
    prioritizeFrames(frameUrls, priority) {
        // Simple priority logic - can be enhanced with actual usage data
        const priorityMap = {
            'high': new Set(['aviator_classic', 'wayfarer_classic', 'cat_eye_trendy']),
            'normal': new Set(['round_vintage', 'sport_modern']),
            'low': new Set(['minimalist_rimless'])
        };

        const prioritySet = priorityMap[priority] || new Set();

        return frameUrls.sort((a, b) => {
            const aPriority = prioritySet.has(this.extractFrameId(a)) ? 1 : 0;
            const bPriority = prioritySet.has(this.extractFrameId(b)) ? 1 : 0;

            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Higher priority first
            }

            // If same priority, maintain original order
            return 0;
        });
    }

    /**
     * Extract frame ID from URL
     */
    extractFrameId(url) {
        const matches = url.match(/([^/]+)\.png$/);
        return matches ? matches[1] : url;
    }

    /**
     * Get cached frame or load it
     */
    async getFrame(url) {
        if (this.frameCache.has(url)) {
            return this.frameCache.get(url);
        }

        return this.preloadSingleFrame(url);
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.frameCache.size,
            hitCount: this.performance.cacheHitCount,
            missCount: this.performance.cacheMissCount,
            hitRate: this.performance.cacheHitCount / (this.performance.cacheHitCount + this.performance.cacheMissCount) || 0,
            preloadingInProgress: this.preloadingInProgress.size
        };
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
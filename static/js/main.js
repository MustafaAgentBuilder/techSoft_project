/**
 * Virtual Specs 3D Try-On MVP - Main JavaScript
 * Core functionality and utilities for the virtual try-on application
 */

// Global application state
const VirtualSpecs = {
    config: {
        apiBase: '',
        maxFileSize: 16 * 1024 * 1024, // 16MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
        performanceTargets: {
            overlayResponse: 200, // ms
            webcamFps: 30,
            uploadProcess: 2000 // ms
        }
    },

    // Application state
    state: {
        currentMode: null,
        selectedFrame: null,
        uploadedImage: null,
        webcamStream: null,
        isProcessing: false
    }
};

// Utility functions
const Utils = {
    /**
     * Show loading state
     */
    showLoading(element) {
        if (element) {
            element.classList.add('loading');
        }
    },

    /**
     * Hide loading state
     */
    hideLoading(element) {
        if (element) {
            element.classList.remove('loading');
        }
    },

    /**
     * Show error message
     */
    showError(message, container = null) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;

        if (container) {
            // Remove existing error messages
            const existingErrors = container.querySelectorAll('.error');
            existingErrors.forEach(error => error.remove());
            container.appendChild(errorDiv);
        } else {
            // Add to body as a toast notification
            document.body.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        }
    },

    /**
     * Show success message
     */
    showSuccess(message, container = null) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;

        if (container) {
            container.appendChild(successDiv);
        } else {
            document.body.appendChild(successDiv);
            setTimeout(() => successDiv.remove(), 5000);
        }
    },

    /**
     * Validate file type and size
     */
    validateFile(file) {
        if (!file) {
            return { valid: false, error: 'No file selected' };
        }

        // Check file type
        if (!VirtualSpecs.config.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Invalid file type. Please select a JPG or PNG image.'
            };
        }

        // Check file size
        if (file.size > VirtualSpecs.config.maxFileSize) {
            return {
                valid: false,
                error: 'File too large. Please select an image smaller than 16MB.'
            };
        }

        return { valid: true };
    },

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Debounce function for performance optimization
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Performance measurement
     */
    measureTime(label, callback) {
        const startTime = performance.now();
        const result = callback();
        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`${label}: ${duration.toFixed(2)}ms`);
        return { result, duration };
    }
};

// API utilities
const API = {
    /**
     * Make API request with error handling
     */
    async request(endpoint, options = {}) {
        const url = `${VirtualSpecs.config.apiBase}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    /**
     * Upload file with progress tracking
     */
    async uploadFile(file, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Progress tracking
            if (onProgress) {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        onProgress(percentComplete);
                    }
                });
            }

            // Success handling
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            resolve(response);
                        } else {
                            reject(new Error(response.error || 'Upload failed'));
                        }
                    } catch (error) {
                        reject(new Error('Invalid response from server'));
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            // Error handling
            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.addEventListener('timeout', () => {
                reject(new Error('Upload timeout'));
            });

            // Configure and send request
            xhr.timeout = 30000; // 30 second timeout
            xhr.open('POST', `${VirtualSpecs.config.apiBase}/upload`);
            xhr.send(formData);
        });
    },

    /**
     * Get available frames
     */
    async getFrames() {
        return this.request('/frames');
    }
};

// Navigation utilities
const Navigation = {
    /**
     * Update active navigation state
     */
    updateActiveNav() {
        const navLinks = document.querySelectorAll('.main-nav a');
        const currentPath = window.location.pathname;

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPath ||
                (currentPath === '/' && link.getAttribute('href') === '/')) {
                link.classList.add('active');
            }
        });
    },

    /**
     * Initialize navigation
     */
    init() {
        this.updateActiveNav();

        // Update on route changes
        window.addEventListener('popstate', () => {
            this.updateActiveNav();
        });
    }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Virtual Specs 3D Try-On - Application Initialized');

    // Initialize navigation
    Navigation.init();

    // Set global error handling
    window.addEventListener('error', function(event) {
        console.error('Global error:', event.error);
        Utils.showError('An unexpected error occurred. Please refresh the page.');
    });

    // Set unhandled promise rejection handling
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        Utils.showError('An unexpected error occurred. Please try again.');
        event.preventDefault();
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VirtualSpecs, Utils, API, Navigation };
}
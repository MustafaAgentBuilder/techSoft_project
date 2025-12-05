/**
 * Virtual Specs 3D Try-On MVP - Client-Side Security Utilities
 * Client-side security validation and protection mechanisms
 */

class SecurityManager {
    constructor() {
        this.csrfToken = null;
        this.rateLimiter = new Map();
        this.sanitizers = new Map();
        this.validator = new InputValidator();
        this.init();
    }

    /**
     * Initialize security manager
     */
    init() {
        this.fetchCSRFToken();
        this.setupXSSProtection();
        this.setupCSRFProtection();
        this.setupInputValidation();
        this.setupEventListeners();
        this.setupSecurityHeaders();
        console.log('Security Manager initialized');
    }

    /**
     * Fetch CSRF token from server
     */
    async fetchCSRFToken() {
        try {
            const response = await fetch('/csrf-token', {
                method: 'GET',
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                this.csrfToken = data.csrf_token;
                this.injectCSRFIntoForms();
            }
        } catch (error) {
            console.warn('Failed to fetch CSRF token:', error);
        }
    }

    /**
     * Inject CSRF token into all forms
     */
    injectCSRFIntoForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            let csrfInput = form.querySelector('input[name="csrf_token"]');
            if (!csrfInput) {
                csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrf_token';
                csrfInput.value = this.csrfToken;
                form.appendChild(csrfInput);
            } else {
                csrfInput.value = this.csrfToken;
            }
        });
    }

    /**
     * Setup XSS protection
     */
    setupXSSProtection() {
        // Sanitize all content dynamically inserted into the DOM
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName, options) {
            const element = originalCreateElement.call(this, tagName, options);

            // Add security event listeners for script tags
            if (tagName.toLowerCase() === 'script') {
                element.addEventListener('beforescriptexecute', (e) => {
                    if (!window.securityManager?.isScriptAllowed(e.target.src)) {
                        e.preventDefault();
                        console.warn('Blocked potentially malicious script:', e.target.src);
                        return false;
                    }
                });
            }

            return element;
        };

        // HTML sanitization disabled temporarily to prevent recursion
        // TODO: Implement non-recursive HTML sanitization
    }

    /**
     * Setup CSRF protection for AJAX requests
     */
    setupCSRFProtection() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
                options.headers = options.headers || {};
                options.headers['X-CSRFToken'] = window.securityManager?.csrfToken || '';

                // Add CSRF token to form data if present
                if (options.body && options.body instanceof FormData) {
                    if (window.securityManager?.csrfToken) {
                        options.body.append('csrf_token', window.securityManager.csrfToken);
                    }
                }
            }
            return originalFetch.call(this, url, options);
        };

        // Intercept XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            this._method = method;
            this._url = url;
            return originalXHROpen.call(this, method, url, async, user, password);
        };

        XMLHttpRequest.prototype.send = function(data) {
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(this._method?.toUpperCase())) {
                this.setRequestHeader('X-CSRFToken', window.securityManager?.csrfToken || '');
            }
            return originalXHRSend.call(this, data);
        };
    }

    /**
     * Setup input validation
     */
    setupInputValidation() {
        // Validate all inputs on change
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea')) {
                this.validateInput(e.target);
            }
        });

        // Validate form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.tagName === 'FORM') {
                if (!this.validateForm(e.target)) {
                    e.preventDefault();
                    return false;
                }
            }
        });
    }

    /**
     * Setup security event listeners
     */
    setupEventListeners() {
        // Prevent clipboard access in sensitive areas
        document.addEventListener('copy', (e) => {
            if (this.isSensitiveArea(e.target)) {
                e.preventDefault();
                this.showSecurityWarning('Copy action blocked in this area');
                return false;
            }
        });

        // Prevent screenshot attempts (where possible)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.showSecurityWarning('Screenshot action blocked');
                return false;
            }
        });

        // Monitor for potentially dangerous events
        ['error', 'unhandledrejection'].forEach(eventType => {
            window.addEventListener(eventType, (e) => {
                this.logSecurityEvent(eventType, {
                    message: e.message || 'Unknown error',
                    filename: e.filename,
                    lineno: e.lineno,
                    colno: e.colno,
                    stack: e.error?.stack
                });
            });
        });
    }

    /**
     * Setup additional security headers if needed
     */
    setupSecurityHeaders() {
        // This is mainly for client-side checks
        // Most security headers are set server-side
        this.checkSecurityHeaders();
    }

    /**
     * Check if required security headers are present
     */
    checkSecurityHeaders() {
        const requiredHeaders = [
            'x-content-type-options',
            'x-frame-options',
            'x-xss-protection',
            'strict-transport-security',
            'referrer-policy',
            'content-security-policy'
        ];

        // In development, just log what headers we have
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.log('Security headers check:', requiredHeaders);
        }
    }

    /**
     * Sanitize HTML content
     */
    sanitizeHTML(html) {
        if (!html) return '';

        // Remove dangerous elements and attributes
        const tempDiv = document.createElement('div');
        // Use original innerHTML to avoid recursion
        const originalSet = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;
        originalSet.call(tempDiv, html);

        // Remove script tags
        const scripts = tempDiv.querySelectorAll('script');
        scripts.forEach(script => script.remove());

        // Remove dangerous attributes
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(element => {
            // Remove event handlers
            Array.from(element.attributes).forEach(attr => {
                if (attr.name.toLowerCase().startsWith('on')) {
                    element.removeAttribute(attr.name);
                }
            });

            // Remove javascript: URLs
            ['href', 'src', 'action', 'formaction'].forEach(attr => {
                if (element.hasAttribute(attr)) {
                    const value = element.getAttribute(attr).toLowerCase();
                    if (value.includes('javascript:') || value.includes('data:')) {
                        element.removeAttribute(attr);
                    }
                }
            });
        });

        return tempDiv.innerHTML;
    }

    /**
     * Validate input field
     */
    validateInput(input) {
        const value = input.value;
        const inputType = input.type || input.tagName.toLowerCase();

        let isValid = true;
        let errorMessage = '';

        switch (inputType) {
            case 'text':
            case 'textarea':
                if (!this.validator.isSafeText(value)) {
                    isValid = false;
                    errorMessage = 'Invalid characters detected';
                }
                break;

            case 'email':
                if (value && !this.validator.isValidEmail(value)) {
                    isValid = false;
                    errorMessage = 'Invalid email format';
                }
                break;

            case 'number':
                if (value && !this.validator.isValidNumber(value)) {
                    isValid = false;
                    errorMessage = 'Invalid number format';
                }
                break;

            case 'url':
                if (value && !this.validator.isValidURL(value)) {
                    isValid = false;
                    errorMessage = 'Invalid URL format';
                }
                break;
        }

        // Update UI with validation result
        this.updateInputValidationUI(input, isValid, errorMessage);

        return isValid;
    }

    /**
     * Validate entire form
     */
    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        let isFormValid = true;

        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isFormValid = false;
            }
        });

        return isFormValid;
    }

    /**
     * Update input validation UI
     */
    updateInputValidationUI(input, isValid, errorMessage) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        // Remove existing validation classes
        formGroup.classList.remove('has-error', 'has-success');

        // Remove existing error message
        const existingError = formGroup.querySelector('.validation-error');
        if (existingError) {
            existingError.remove();
        }

        if (isValid) {
            formGroup.classList.add('has-success');
        } else if (input.value) {
            formGroup.classList.add('has-error');

            // Add error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error';
            errorDiv.textContent = errorMessage;
            formGroup.appendChild(errorDiv);

            // Log security event
            this.logSecurityEvent('input_validation_failed', {
                inputName: input.name,
                inputType: input.type,
                value: input.value,
                error: errorMessage
            });
        }
    }

    /**
     * Check if element is in a sensitive area
     */
    isSensitiveArea(element) {
        const sensitiveSelectors = [
            '.password-field',
            '.sensitive-data',
            '[data-sensitive="true"]',
            '#csrf_token',
            'input[name="csrf_token"]'
        ];

        return sensitiveSelectors.some(selector => {
            try {
                return element.matches(selector) || element.closest(selector);
            } catch (e) {
                return false;
            }
        });
    }

    /**
     * Check if script is allowed
     */
    isScriptAllowed(src) {
        // Only allow scripts from trusted sources
        const trustedSources = [
            location.origin,
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdn.jsdelivr.net'
        ];

        if (!src) return false; // Inline scripts not allowed

        try {
            const url = new URL(src, location.href);
            return trustedSources.some(source => url.origin === source);
        } catch (e) {
            return false;
        }
    }

    /**
     * Rate limiting for client-side actions
     */
    isRateLimited(action, maxRequests = 60, windowMs = 60000) {
        const now = Date.now();
        const key = action;

        if (!this.rateLimiter.has(key)) {
            this.rateLimiter.set(key, []);
        }

        const requests = this.rateLimiter.get(key);
        const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);

        if (recentRequests.length >= maxRequests) {
            return true; // Rate limited
        }

        recentRequests.push(now);
        this.rateLimiter.set(key, recentRequests);
        return false; // Not rate limited
    }

    /**
     * Show security warning
     */
    showSecurityWarning(message) {
        console.warn('Security Warning:', message);

        // Create warning element
        const warning = document.createElement('div');
        warning.className = 'security-warning';
        warning.innerHTML = `
            <div class="security-warning-content">
                <span class="security-warning-icon">⚠️</span>
                <span class="security-warning-message">${message}</span>
                <button class="security-warning-close">×</button>
            </div>
        `;

        // Add styles if not already present
        if (!document.querySelector('#security-warning-styles')) {
            const style = document.createElement('style');
            style.id = 'security-warning-styles';
            style.textContent = `
                .security-warning {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #f8d7da;
                    border: 1px solid #f5c6cb;
                    border-radius: 4px;
                    padding: 12px 16px;
                    z-index: 10000;
                    max-width: 300px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .security-warning-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: #721c24;
                }
                .security-warning-close {
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    margin-left: auto;
                }
            `;
            document.head.appendChild(style);
        }

        // Add to page
        document.body.appendChild(warning);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
        }, 5000);

        // Manual close
        warning.querySelector('.security-warning-close').addEventListener('click', () => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
        });
    }

    /**
     * Log security events
     */
    logSecurityEvent(eventType, details) {
        const event = {
            timestamp: new Date().toISOString(),
            eventType: eventType,
            details: details,
            url: window.location.href,
            userAgent: navigator.userAgent,
            fingerprint: this.generateFingerprint()
        };

        // Log to console in development
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.log('Security Event:', event);
        }

        // In production, send to security monitoring endpoint
        if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            this.sendSecurityEvent(event);
        }
    }

    /**
     * Generate browser fingerprint for security tracking
     */
    generateFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Security fingerprint', 2, 2);

        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            canvas: canvas.toDataURL().slice(-50) // Last 50 chars of canvas
        };

        return btoa(JSON.stringify(fingerprint)).slice(0, 32);
    }

    /**
     * Send security event to server
     */
    async sendSecurityEvent(event) {
        try {
            await fetch('/api/security-event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.error('Failed to send security event:', error);
        }
    }

    /**
     * Get current CSRF token
     */
    getCSRFToken() {
        return this.csrfToken;
    }

    /**
     * Refresh CSRF token
     */
    async refreshCSRFToken() {
        await this.fetchCSRFToken();
    }
}

/**
 * Input validation utility class
 */
class InputValidator {
    constructor() {
        this.patterns = {
            // Dangerous patterns
            dangerous: /<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=|expression\s*\(|@import|binding\s*:/gi,

            // Valid patterns
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            url: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
            phone: /^[\+]?[1-9][\d]{0,15}$/,
            number: /^-?\d*\.?\d+$/,
            alphanumeric: /^[a-zA-Z0-9]*$/,
            lettersOnly: /^[a-zA-Z]*$/,
            numbersOnly: /^[0-9]*$/,
            safeText: /^[a-zA-Z0-9\s\-_.@+#]*$/,
            filename: /^[a-zA-Z0-9\-_.]*$/,
            htmlTag: /^<[a-zA-Z][a-zA-Z0-9]*\b[^>]*>(.*?)<\/[a-zA-Z][a-zA-Z0-9]*>$/
        };
    }

    /**
     * Check if text is safe (no dangerous patterns)
     */
    isSafeText(text) {
        return !this.patterns.dangerous.test(text);
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        return this.patterns.email.test(email) && this.isSafeText(email);
    }

    /**
     * Validate URL format
     */
    isValidURL(url) {
        return this.patterns.url.test(url) && this.isSafeText(url);
    }

    /**
     * Validate phone number
     */
    isValidPhone(phone) {
        return this.patterns.phone.test(phone);
    }

    /**
     * Validate number
     */
    isValidNumber(num) {
        return this.patterns.number.test(num);
    }

    /**
     * Validate alphanumeric string
     */
    isValidAlphanumeric(str) {
        return this.patterns.alphanumeric.test(str);
    }

    /**
     * Validate filename
     */
    isValidFilename(filename) {
        return this.patterns.filename.test(filename);
    }

    /**
     * Check if string contains HTML tags
     */
    containsHTML(str) {
        return this.patterns.htmlTag.test(str);
    }

    /**
     * Check string length
     */
    isValidLength(str, min = 0, max = 1000) {
        return str.length >= min && str.length <= max;
    }
}

// Initialize security manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.securityManager = new SecurityManager();
    window.inputValidator = window.securityManager.validator;

    // Make security utilities globally available
    window.Security = {
        sanitize: (html) => window.securityManager.sanitizeHTML(html),
        validate: (input) => window.securityManager.validateInput(input),
        getCSRFToken: () => window.securityManager.getCSRFToken(),
        logEvent: (type, details) => window.securityManager.logSecurityEvent(type, details)
    };
});
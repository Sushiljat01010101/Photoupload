// Utility functions for the photo gallery application

class Utils {
    // Format file size in human readable format
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Format date in human readable format
    static formatDate(date) {
        if (!date) return 'Unknown';
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return date.toLocaleDateString();
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }

    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Check if image file is valid
    static isValidImage(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        return validTypes.includes(file.type);
    }

    // Get image dimensions
    static getImageDimensions(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            };
            img.onerror = () => {
                resolve({ width: 0, height: 0 });
            };
            img.src = URL.createObjectURL(file);
        });
    }

    // Create blob from canvas
    static canvasToBlob(canvas, quality = 0.8) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', quality);
        });
    }

    // Download file
    static downloadFile(blob, filename) {
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Download failed:', error);
            return false;
        }
    }

    // Download from URL
    static async downloadFromUrl(url, filename) {
        try {
            // Try direct download first
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return true;
        } catch (error) {
            console.error('URL download failed:', error);
            return false;
        }
    }

    // Copy text to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        }
    }

    // Create toast notification
    static showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, duration);
    }

    // Lazy loading intersection observer
    static createLazyLoader(callback) {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        return new IntersectionObserver(callback, options);
    }

    // Keyboard shortcut handler
    static handleKeyboardShortcuts(shortcuts) {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            const alt = e.altKey;

            const combination = `${ctrl ? 'ctrl+' : ''}${shift ? 'shift+' : ''}${alt ? 'alt+' : ''}${key}`;
            
            if (shortcuts[combination]) {
                e.preventDefault();
                shortcuts[combination]();
            }
        });
    }

    // Compress image
    static compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Generate thumbnail
    static generateThumbnail(file, size = 200) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = size;
                canvas.height = size;

                // Calculate crop dimensions for square thumbnail
                const minDim = Math.min(img.width, img.height);
                const startX = (img.width - minDim) / 2;
                const startY = (img.height - minDim) / 2;

                ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
                canvas.toBlob(resolve, 'image/jpeg', 0.7);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Validate file constraints
    static validateFile(file, maxSize = 10 * 1024 * 1024) { // 10MB default
        const errors = [];

        if (!this.isValidImage(file)) {
            errors.push('Invalid file type. Please upload a valid image.');
        }

        if (file.size > maxSize) {
            errors.push(`File size too large. Maximum size is ${this.formatFileSize(maxSize)}.`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Create loading spinner
    static createLoadingSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        return spinner;
    }

    // Animate element
    static animate(element, animation, duration = 300) {
        return new Promise((resolve) => {
            element.style.animation = `${animation} ${duration}ms ease-in-out`;
            
            setTimeout(() => {
                element.style.animation = '';
                resolve();
            }, duration);
        });
    }

    // Storage utilities
    static getStorageUsage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate();
        }
        return Promise.resolve({ usage: 0, quota: 0 });
    }

    // Error handling
    static handleError(error, context = 'Operation') {
        console.error(`${context} failed:`, error);
        
        let message = 'An unexpected error occurred';
        if (error.code === 'storage/unauthorized') {
            message = 'You do not have permission to perform this action';
        } else if (error.code === 'storage/retry-limit-exceeded') {
            message = 'Upload failed due to poor connection. Please try again.';
        } else if (error.code === 'storage/quota-exceeded') {
            message = 'Storage quota exceeded. Please delete some files.';
        } else if (error.message) {
            message = error.message;
        }

        this.showToast(message, 'error');
        return message;
    }
}

// Export for use in other modules
window.Utils = Utils;

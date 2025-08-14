// Image processing utilities for editing and manipulation

class ImageProcessor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.originalImageData = null;
        this.currentImageData = null;
        this.history = [];
        this.historyIndex = -1;
    }

    // Initialize canvas with image
    async initializeCanvas(canvasElement, imageFile) {
        try {
            this.canvas = canvasElement;
            this.ctx = this.canvas.getContext('2d');
            
            // Clear any existing history
            this.history = [];
            this.historyIndex = -1;
            
            const img = await this.loadImage(imageFile);
            this.setupCanvas(img);
            this.saveState();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize canvas:', error);
            throw new Error('Failed to initialize image editor');
        }
    }

    // Load image from file or blob
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            let objectUrl = null;
            
            img.onload = () => {
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                }
                resolve(img);
            };
            
            img.onerror = (error) => {
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                }
                console.error('Loading image for editing failed:', error);
                reject(new Error('Failed to load image for editing'));
            };
            
            try {
                if (file instanceof File || file instanceof Blob) {
                    objectUrl = URL.createObjectURL(file);
                    img.src = objectUrl;
                } else if (typeof file === 'string') {
                    // Handle URL strings
                    img.src = file;
                } else {
                    throw new Error('Invalid file type for image loading');
                }
            } catch (error) {
                console.error('Failed to create object URL:', error);
                reject(error);
            }
        });
    }

    // Setup canvas dimensions and draw image
    setupCanvas(img) {
        const maxWidth = 800;
        const maxHeight = 600;
        
        let { width, height } = img;
        
        // Scale image to fit canvas while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.ctx.drawImage(img, 0, 0, width, height);
        this.originalImageData = this.ctx.getImageData(0, 0, width, height);
        this.currentImageData = this.ctx.getImageData(0, 0, width, height);
    }

    // Save current state to history
    saveState() {
        this.historyIndex++;
        this.history = this.history.slice(0, this.historyIndex);
        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        
        // Limit history size
        if (this.history.length > 20) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    // Undo last action
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
            return true;
        }
        return false;
    }

    // Redo last undone action
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
            return true;
        }
        return false;
    }

    // Reset to original image
    reset() {
        this.ctx.putImageData(this.originalImageData, 0, 0);
        this.saveState();
    }

    // Rotate image
    rotate(degrees) {
        const radians = (degrees * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        
        const { width, height } = this.canvas;
        const newWidth = Math.abs(width * cos) + Math.abs(height * sin);
        const newHeight = Math.abs(width * sin) + Math.abs(height * cos);
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        
        tempCtx.translate(newWidth / 2, newHeight / 2);
        tempCtx.rotate(radians);
        tempCtx.drawImage(this.canvas, -width / 2, -height / 2);
        
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.ctx.drawImage(tempCanvas, 0, 0);
        
        this.saveState();
    }

    // Flip image horizontally
    flipHorizontal() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(this.canvas, -this.canvas.width, 0);
        this.ctx.scale(-1, 1);
        this.saveState();
    }

    // Flip image vertically
    flipVertical() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.scale(1, -1);
        this.ctx.drawImage(this.canvas, 0, -this.canvas.height);
        this.ctx.scale(1, -1);
        this.saveState();
    }

    // Apply brightness filter
    adjustBrightness(value) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        const adjustment = (value - 100) * 2.55;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, data[i] + adjustment));     // Red
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment)); // Green
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment)); // Blue
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    // Apply contrast filter
    adjustContrast(value) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        const factor = (259 * (value + 255)) / (255 * (259 - value));
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));     // Red
            data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128)); // Green
            data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128)); // Blue
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    // Apply saturation filter
    adjustSaturation(value) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        const saturation = value / 100;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            data[i] = Math.max(0, Math.min(255, gray + saturation * (r - gray)));
            data[i + 1] = Math.max(0, Math.min(255, gray + saturation * (g - gray)));
            data[i + 2] = Math.max(0, Math.min(255, gray + saturation * (b - gray)));
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    // Apply blur filter
    applyBlur(radius) {
        if (radius === 0) return;
        
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const blurredData = this.boxBlur(imageData, radius);
        this.ctx.putImageData(blurredData, 0, 0);
    }

    // Box blur implementation
    boxBlur(imageData, radius) {
        const width = imageData.width;
        const height = imageData.height;
        const data = new Uint8ClampedArray(imageData.data);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        
                        if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                            const index = (ny * width + nx) * 4;
                            r += imageData.data[index];
                            g += imageData.data[index + 1];
                            b += imageData.data[index + 2];
                            count++;
                        }
                    }
                }
                
                const index = (y * width + x) * 4;
                data[index] = r / count;
                data[index + 1] = g / count;
                data[index + 2] = b / count;
            }
        }
        
        return new ImageData(data, width, height);
    }

    // Apply combined filters
    applyFilters(filters) {
        // Start with original image
        this.ctx.putImageData(this.originalImageData, 0, 0);
        
        // Apply filters in order
        if (filters.brightness !== 100) {
            this.adjustBrightness(filters.brightness);
        }
        if (filters.contrast !== 100) {
            this.adjustContrast(filters.contrast);
        }
        if (filters.saturation !== 100) {
            this.adjustSaturation(filters.saturation);
        }
        if (filters.blur > 0) {
            this.applyBlur(filters.blur);
        }
    }

    // Apply preset filters
    applyPreset(preset) {
        const presets = {
            vintage: { brightness: 110, contrast: 90, saturation: 80, blur: 0 },
            vivid: { brightness: 105, contrast: 120, saturation: 130, blur: 0 },
            sepia: { brightness: 110, contrast: 90, saturation: 40, blur: 0 },
            blackwhite: { brightness: 100, contrast: 110, saturation: 0, blur: 0 },
            soft: { brightness: 105, contrast: 85, saturation: 95, blur: 1 },
            sharp: { brightness: 100, contrast: 130, saturation: 110, blur: 0 }
        };
        
        if (presets[preset]) {
            this.applyFilters(presets[preset]);
            this.saveState();
        }
    }

    // Crop image
    crop(x, y, width, height) {
        const imageData = this.ctx.getImageData(x, y, width, height);
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.putImageData(imageData, 0, 0);
        this.saveState();
    }

    // Resize image
    resize(newWidth, newHeight) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        tempCtx.putImageData(imageData, 0, 0);
        
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
        
        this.saveState();
    }

    // Get current canvas as blob
    async getBlob(quality = 0.9) {
        return new Promise((resolve) => {
            this.canvas.toBlob(resolve, 'image/jpeg', quality);
        });
    }

    // Get current canvas as data URL
    getDataURL(quality = 0.9) {
        return this.canvas.toDataURL('image/jpeg', quality);
    }

    // Clean up resources
    cleanup() {
        this.history = [];
        this.historyIndex = -1;
        this.originalImageData = null;
        this.currentImageData = null;
        this.canvas = null;
        this.ctx = null;
    }
}

// Export for use in other modules
window.ImageProcessor = ImageProcessor;

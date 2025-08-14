// Main application initialization and coordination

class PhotoGalleryApp {
    constructor() {
        this.uploadManager = null;
        this.photoGallery = null;
        this.imageProcessor = null;
        this.memoriesTimeline = null;
        this.currentPreviewFiles = [];
        this.isInitialized = false;
        this.notionClient = null;
        this.currentUser = null;
        this.currentTab = 'gallery';
        
        this.checkAuthentication();
        this.initializeNotion();
        this.initialize();
    }
    
    // Check if user is authenticated and load user info
    async checkAuthentication() {
        try {
            const response = await fetch('/api/user');
            if (response.ok) {
                this.currentUser = await response.json();
                this.updateUserHeader();
            } else {
                // User not authenticated, redirect to auth page
                window.location.href = '/auth';
                return;
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            // Redirect to auth page on error
            window.location.href = '/auth';
        }
    }
    
    // Update user header with user information
    updateUserHeader() {
        if (!this.currentUser) return;
        
        const userNameElement = document.getElementById('user-name');
        const userAvatarElement = document.getElementById('user-avatar');
        
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.username;
        }
        
        if (userAvatarElement) {
            userAvatarElement.textContent = this.currentUser.username.charAt(0).toUpperCase();
        }
    }

    // Initialize Notion client
    async initializeNotion() {
        try {
            this.notionClient = new NotionClient();
            await this.notionClient.initializePhotosDatabase();
            console.log('Notion client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Notion client:', error);
            Utils.showToast('Failed to connect to Notion. Please check your configuration.', 'error');
        }
    }

    // Initialize application
    async initialize() {
        try {
            // Initialize scrolling header
            this.initializeScrollingHeader();
            
            // Initialize managers
            this.uploadManager = new UploadManager();
            this.photoGallery = new PhotoGallery();
            this.imageProcessor = new ImageProcessor();
            this.memoriesTimeline = new MemoriesTimeline(this.notionClient);
            
            // Setup event listeners
            this.setupEventListeners();
            this.setupUploadManager();
            this.setupImageEditor();
            this.setupKeyboardShortcuts();
            
            // Load initial data
            await this.photoGallery.loadPhotos();
            
            this.isInitialized = true;
            Utils.showToast('Application initialized successfully', 'success');
            
        } catch (error) {
            Utils.handleError(error, 'Application initialization');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Upload area drag and drop
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('photo-input');
        
        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files);
            }
        });
        
        // Click to browse
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelection(e.target.files);
            }
        });
        
        // Preview section buttons
        const cancelUploadBtn = document.getElementById('cancel-upload');
        const confirmUploadBtn = document.getElementById('confirm-upload');
        
        if (cancelUploadBtn) {
            cancelUploadBtn.addEventListener('click', () => {
                this.cancelPreview();
            });
        }
        
        if (confirmUploadBtn) {
            confirmUploadBtn.addEventListener('click', () => {
                this.confirmUpload();
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
        
        // Modal close buttons
        const closeEditorBtn = document.getElementById('close-editor');
        const closePhotoBtn = document.getElementById('close-photo');
        
        if (closeEditorBtn) {
            closeEditorBtn.addEventListener('click', () => {
                this.closeEditor();
            });
        }
        
        if (closePhotoBtn) {
            closePhotoBtn.addEventListener('click', () => {
                this.closePhotoModal();
            });
        }
        
        // Close modals on background click
        const editorModal = document.getElementById('editor-modal');
        const photoModal = document.getElementById('photo-modal');
        
        if (editorModal) {
            editorModal.addEventListener('click', (e) => {
                if (e.target.id === 'editor-modal') {
                    this.closeEditor();
                }
            });
        }
        
        if (photoModal) {
            photoModal.addEventListener('click', (e) => {
                if (e.target.id === 'photo-modal') {
                    this.closePhotoModal();
                }
            });
        }

        // Navigation tabs
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Make sure gallery tab is active by default
        this.switchTab('gallery');
    }

    // Switch between tabs
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(`${tabName}-content`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
        
        this.currentTab = tabName;
        
        // Load memories timeline if switching to memories tab
        if (tabName === 'memories' && this.memoriesTimeline) {
            this.memoriesTimeline.loadMemories();
        }
    }

    // Setup upload manager
    setupUploadManager() {
        this.uploadManager.on('preview', (item) => {
            this.updatePreview(item);
        });
        
        this.uploadManager.on('start', () => {
            this.showUploadProgress(true);
        });
        
        this.uploadManager.on('progress', (item) => {
            this.updateUploadProgress(item);
        });
        
        this.uploadManager.on('complete', (item) => {
            if (item.status === 'completed') {
                this.photoGallery.addPhoto({
                    id: item.docId,
                    originalName: item.metadata.name,
                    downloadURL: item.downloadURL,
                    storagePath: item.storagePath,
                    size: item.metadata.size,
                    type: item.metadata.type,
                    width: item.metadata.width,
                    height: item.metadata.height,
                    uploadDate: new Date(),
                    tags: [],
                    metadata: item.metadata
                });
            }
        });
        
        this.uploadManager.on('allComplete', (stats) => {
            this.showUploadProgress(false);
            this.hidePreview();
            
            if (stats.completed > 0) {
                Utils.showToast(`${stats.completed} photo${stats.completed > 1 ? 's' : ''} uploaded successfully`, 'success');
            }
            
            if (stats.failed > 0) {
                Utils.showToast(`${stats.failed} photo${stats.failed > 1 ? 's' : ''} failed to upload`, 'error');
            }
        });
    }

    // Setup image editor
    setupImageEditor() {
        const canvas = document.getElementById('editor-canvas');
        
        // Editor controls
        const rotateLeftBtn = document.getElementById('rotate-left');
        const rotateRightBtn = document.getElementById('rotate-right');
        const flipHorizontalBtn = document.getElementById('flip-horizontal');
        const flipVerticalBtn = document.getElementById('flip-vertical');
        
        if (rotateLeftBtn) {
            rotateLeftBtn.addEventListener('click', () => {
                this.imageProcessor.rotate(-90);
            });
        }
        
        if (rotateRightBtn) {
            rotateRightBtn.addEventListener('click', () => {
                this.imageProcessor.rotate(90);
            });
        }
        
        if (flipHorizontalBtn) {
            flipHorizontalBtn.addEventListener('click', () => {
                this.imageProcessor.flipHorizontal();
            });
        }
        
        if (flipVerticalBtn) {
            flipVerticalBtn.addEventListener('click', () => {
                this.imageProcessor.flipVertical();
            });
        }
        
        // Filter controls
        const filterControls = ['brightness', 'contrast', 'saturation', 'blur'];
        filterControls.forEach(filter => {
            const control = document.getElementById(filter);
            if (control) {
                control.addEventListener('input', Utils.debounce(() => {
                    this.applyFilters();
                }, 100));
            }
        });
        
        // Editor actions
        const resetEditorBtn = document.getElementById('reset-editor');
        const saveEditBtn = document.getElementById('save-edit');
        
        if (resetEditorBtn) {
            resetEditorBtn.addEventListener('click', () => {
                this.resetEditor();
            });
        }
        
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', () => {
                this.saveEdit();
            });
        }
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        Utils.handleKeyboardShortcuts({
            'ctrl+u': () => document.getElementById('photo-input').click(),
            'escape': () => this.closeModals(),
            'delete': () => this.deleteSelectedPhotos(),
            'ctrl+a': () => this.selectAllPhotos(),
            'ctrl+d': () => this.clearSelection(),
            'f': () => this.toggleFullscreen()
        });
    }

    // Handle file selection
    handleFileSelection(files) {
        if (files.length === 0) return;
        
        this.currentPreviewFiles = this.uploadManager.addFiles(files);
        if (this.currentPreviewFiles.length > 0) {
            this.showPreview();
        }
    }

    // Show preview section
    showPreview() {
        const previewSection = document.getElementById('preview-section');
        const previewContainer = document.getElementById('preview-container');
        
        previewSection.style.display = 'block';
        previewContainer.innerHTML = '';
        
        this.currentPreviewFiles.forEach(file => {
            const previewItem = this.createPreviewItem(file);
            previewContainer.appendChild(previewItem);
        });
        
        // Scroll to preview
        previewSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Create preview item
    createPreviewItem(file) {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.dataset.fileId = file.id;
        
        item.innerHTML = `
            <img src="${file.preview || ''}" alt="${file.metadata.name}">
            <div class="preview-overlay">
                <div class="preview-info">
                    <div>${file.metadata.name}</div>
                    <div>${Utils.formatFileSize(file.metadata.size)}</div>
                </div>
            </div>
        `;
        
        return item;
    }

    // Update preview item
    updatePreview(item) {
        const previewItem = document.querySelector(`[data-file-id="${item.id}"]`);
        if (previewItem && item.preview) {
            const img = previewItem.querySelector('img');
            img.src = item.preview;
        }
    }

    // Hide preview section
    hidePreview() {
        const previewSection = document.getElementById('preview-section');
        previewSection.style.display = 'none';
        this.currentPreviewFiles = [];
    }

    // Cancel preview
    cancelPreview() {
        this.uploadManager.cancelAllUploads();
        this.hidePreview();
    }

    // Confirm upload
    confirmUpload() {
        if (this.currentPreviewFiles.length > 0) {
            const selectedCategory = document.getElementById('upload-category').value;
            const customCategory = document.getElementById('custom-category').value.trim();
            
            if (!selectedCategory && !customCategory) {
                Utils.showToast('Please select a category or enter a custom category', 'warning');
                return;
            }
            
            this.uploadManager.startUpload();
        }
    }

    // Show upload progress
    showUploadProgress(show) {
        const uploadProgress = document.getElementById('upload-progress');
        uploadProgress.style.display = show ? 'block' : 'none';
        
        if (!show) {
            const progressFill = document.getElementById('progress-fill');
            const progressText = document.getElementById('progress-text');
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
        }
    }

    // Update upload progress
    updateUploadProgress(item) {
        const stats = this.uploadManager.getStats();
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        const overallProgress = stats.progress;
        progressFill.style.width = `${overallProgress}%`;
        progressText.textContent = `${Math.round(overallProgress)}%`;
    }

    // Open image editor
    async openEditor(photo) {
        const modal = document.getElementById('editor-modal');
        const canvas = document.getElementById('editor-canvas');
        
        try {
            // Show loading state
            Utils.showToast('Loading image for editing...', 'info');
            
            // Try to load image directly using the URL
            await this.imageProcessor.initializeCanvas(canvas, photo.downloadURL);
            this.resetFilterControls();
            modal.style.display = 'block';
            
            Utils.showToast('Image loaded successfully', 'success');
            
        } catch (error) {
            console.error('Loading image for editing failed:', error);
            
            // Try fallback method with fetch
            try {
                const response = await fetch(photo.downloadURL, {
                    mode: 'cors',
                    credentials: 'omit'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const blob = await response.blob();
                const file = new File([blob], photo.originalName, { type: blob.type });
                
                await this.imageProcessor.initializeCanvas(canvas, file);
                this.resetFilterControls();
                modal.style.display = 'block';
                
                Utils.showToast('Image loaded successfully', 'success');
                
            } catch (fallbackError) {
                console.error('Fallback image loading failed:', fallbackError);
                Utils.showToast('Unable to load image for editing. Please try again.', 'error');
            }
        }
    }

    // Apply filters
    applyFilters() {
        const brightnessControl = document.getElementById('brightness');
        const contrastControl = document.getElementById('contrast');
        const saturationControl = document.getElementById('saturation');
        const blurControl = document.getElementById('blur');
        
        const filters = {
            brightness: brightnessControl ? parseInt(brightnessControl.value) : 100,
            contrast: contrastControl ? parseInt(contrastControl.value) : 100,
            saturation: saturationControl ? parseInt(saturationControl.value) : 100,
            blur: blurControl ? parseInt(blurControl.value) : 0
        };
        
        this.imageProcessor.applyFilters(filters);
    }

    // Reset editor
    resetEditor() {
        this.imageProcessor.reset();
        this.resetFilterControls();
    }

    // Reset filter controls
    resetFilterControls() {
        const brightnessControl = document.getElementById('brightness');
        const contrastControl = document.getElementById('contrast');
        const saturationControl = document.getElementById('saturation');
        const blurControl = document.getElementById('blur');
        
        if (brightnessControl) brightnessControl.value = 100;
        if (contrastControl) contrastControl.value = 100;
        if (saturationControl) saturationControl.value = 100;
        if (blurControl) blurControl.value = 0;
    }

    // Save edit
    async saveEdit() {
        try {
            const blob = await this.imageProcessor.getBlob();
            const fileName = `edited_${Date.now()}.jpg`;
            
            // Upload edited image
            const storageRef = firebase.storage().ref(`photos/${fileName}`);
            const snapshot = await storageRef.put(blob);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            // Save to Firestore
            await firebase.firestore().collection('photos').add({
                fileName: fileName,
                originalName: fileName,
                downloadURL: downloadURL,
                storagePath: `photos/${fileName}`,
                size: blob.size,
                type: blob.type,
                uploadDate: firebase.firestore.FieldValue.serverTimestamp(),
                tags: ['edited'],
                metadata: {
                    name: fileName,
                    size: blob.size,
                    type: blob.type
                }
            });
            
            Utils.showToast('Edited photo saved successfully', 'success');
            this.closeEditor();
            this.photoGallery.loadPhotos();
            
        } catch (error) {
            Utils.handleError(error, 'Saving edited photo');
        }
    }

    // Close editor
    closeEditor() {
        const modal = document.getElementById('editor-modal');
        modal.style.display = 'none';
        this.imageProcessor.cleanup();
    }

    // Close photo modal
    closePhotoModal() {
        console.log('Closing photo modal');
        const modal = document.getElementById('photo-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Close all modals
    closeModals() {
        this.closeEditor();
        this.closePhotoModal();
    }

    // Delete selected photos
    deleteSelectedPhotos() {
        this.photoGallery.deleteSelectedPhotos();
    }

    // Select all photos
    selectAllPhotos() {
        this.photoGallery.filteredPhotos.forEach(photo => {
            this.photoGallery.selectedPhotos.add(photo.id);
        });
        this.photoGallery.renderPhotos();
        this.photoGallery.updateBulkActions();
    }

    // Clear selection
    clearSelection() {
        this.photoGallery.clearSelection();
    }

    // Toggle fullscreen
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }



    // Initialize scrolling header
    initializeScrollingHeader() {
        let lastScrollTop = 0;
        const header = document.querySelector('.header');
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down
                header.classList.add('hidden');
            } else {
                // Scrolling up
                header.classList.remove('hidden');
            }
            
            lastScrollTop = scrollTop;
        });
    }
    
    // Handle user logout
    async handleLogout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST'
            });
            
            if (response.ok) {
                // Redirect to auth page after successful logout
                window.location.href = '/auth';
            } else {
                Utils.showToast('Failed to logout. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            Utils.showToast('Error during logout. Please try again.', 'error');
        }
    }



    // Cleanup resources
    cleanup() {
        if (this.uploadManager) {
            this.uploadManager.cleanup();
        }
        if (this.photoGallery) {
            this.photoGallery.cleanup();
        }
        if (this.imageProcessor) {
            this.imageProcessor.cleanup();
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Make instances globally available
    window.photoGalleryApp = new PhotoGalleryApp();
    window.uploadManager = window.photoGalleryApp.uploadManager;
    window.photoGallery = window.photoGalleryApp.photoGallery;
    window.imageProcessor = window.photoGalleryApp.imageProcessor;
    window.photoEditor = {
        openEditor: (photo) => window.photoGalleryApp.openEditor(photo)
    };
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        window.photoGalleryApp.cleanup();
    });
});

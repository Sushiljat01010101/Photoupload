// Photo gallery management with advanced features

class PhotoGallery {
    constructor() {
        this.photos = [];
        this.filteredPhotos = [];
        this.selectedPhotos = new Set();
        this.currentView = 'grid';
        this.currentSort = 'date-desc';
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.currentPhotoIndex = 0;
        this.lazyLoader = null;
        this.isLoading = false;
        this.notionClient = null;
        
        this.initializeLazyLoading();
        this.setupEventListeners();
        this.initializeNotionClient();
    }

    // Initialize Notion client
    async initializeNotionClient() {
        try {
            this.notionClient = new NotionClient();
            await this.notionClient.initializePhotosDatabase();
        } catch (error) {
            console.error('Failed to initialize Notion client in PhotoGallery:', error);
        }
    }

    // Initialize lazy loading
    initializeLazyLoading() {
        this.lazyLoader = Utils.createLazyLoader((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        this.lazyLoader.unobserve(img);
                    }
                }
            });
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        const debouncedSearch = Utils.debounce((query) => {
            this.searchQuery = query;
            this.filterAndSortPhotos();
        }, 300);
        
        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        // Sort and filter controls
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.filterAndSortPhotos();
        });

        document.getElementById('filter-select').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.filterAndSortPhotos();
        });

        // Category filter
        document.getElementById('category-select').addEventListener('change', (e) => {
            this.currentCategory = e.target.value;
            this.filterAndSortPhotos();
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.setView(view);
            });
        });

        // Selection controls
        document.getElementById('select-all').addEventListener('click', () => {
            this.selectAllPhotos();
        });

        // Bulk actions
        document.getElementById('delete-selected').addEventListener('click', () => {
            this.deleteSelectedPhotos();
        });

        document.getElementById('export-selected').addEventListener('click', () => {
            this.exportSelectedPhotos();
        });

        document.getElementById('clear-selection').addEventListener('click', () => {
            this.clearSelection();
        });
    }

    // Load photos from Notion
    async loadPhotos() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            // Ensure Notion client is initialized
            if (!this.notionClient) {
                this.notionClient = new NotionClient();
                await this.notionClient.initializePhotosDatabase();
            }
            
            this.photos = await this.notionClient.getPhotos();
            
            this.filterAndSortPhotos();
            this.updateStats();
            
        } catch (error) {
            Utils.handleError(error, 'Loading photos');
            console.error('Error loading photos from Notion:', error);
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    // Filter and sort photos
    filterAndSortPhotos() {
        let filtered = [...this.photos];

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(photo => 
                photo.originalName.toLowerCase().includes(query) ||
                (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(query))) ||
                (photo.category && photo.category.toLowerCase().includes(query))
            );
        }

        // Apply category filter
        if (this.currentCategory && this.currentCategory !== 'all') {
            filtered = filtered.filter(photo => photo.category === this.currentCategory);
        }

        // Apply date filter
        if (this.currentFilter !== 'all') {
            const now = new Date();
            const filterDate = new Date();
            
            switch (this.currentFilter) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
                case 'year':
                    filterDate.setFullYear(now.getFullYear() - 1);
                    break;
            }
            
            if (this.currentFilter !== 'all') {
                filtered = filtered.filter(photo => photo.uploadDate >= filterDate);
            }
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'date-desc':
                    return b.uploadDate - a.uploadDate;
                case 'date-asc':
                    return a.uploadDate - b.uploadDate;
                case 'name-asc':
                    return a.originalName.localeCompare(b.originalName);
                case 'name-desc':
                    return b.originalName.localeCompare(a.originalName);
                case 'size-desc':
                    return b.size - a.size;
                case 'size-asc':
                    return a.size - b.size;
                default:
                    return 0;
            }
        });

        this.filteredPhotos = filtered;
        this.renderPhotos();
    }

    // Render photos in gallery
    renderPhotos() {
        const galleryGrid = document.getElementById('gallery-grid');
        const emptyState = document.getElementById('empty-state');
        
        galleryGrid.className = `gallery-grid ${this.currentView === 'list' ? 'list-view' : ''}`;
        
        if (this.filteredPhotos.length === 0) {
            galleryGrid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        const fragment = document.createDocumentFragment();
        
        this.filteredPhotos.forEach((photo, index) => {
            const photoCard = this.createPhotoCard(photo, index);
            fragment.appendChild(photoCard);
        });
        
        galleryGrid.innerHTML = '';
        galleryGrid.appendChild(fragment);
        
        // Update select all button state
        this.updateSelectAllButton();
        this.updateBulkActions();
    }

    // Create photo card element
    createPhotoCard(photo, index) {
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.dataset.photoId = photo.id;
        
        const isSelected = this.selectedPhotos.has(photo.id);
        if (isSelected) {
            card.classList.add('selected');
        }
        
        card.innerHTML = `
            <div class="photo-card-image">
                <img data-src="${photo.downloadURL || `/api/images/${photo.imageKey}`}" alt="${photo.originalName}" loading="lazy">
                <div class="photo-card-overlay">
                    <div class="photo-card-actions">
                        <button onclick="photoGallery.editPhoto('${photo.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="photoGallery.sharePhoto('${photo.id}')" title="Share">
                            <i class="fas fa-share"></i>
                        </button>
                        <button onclick="photoGallery.downloadPhoto('${photo.id}')" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="photoGallery.deletePhoto('${photo.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <input type="checkbox" class="photo-card-checkbox" ${isSelected ? 'checked' : ''}>
                ${photo.category ? `<div class="photo-category-badge">${photo.category}</div>` : ''}
            </div>
            <div class="photo-card-content">
                <div class="photo-card-title">${photo.originalName}</div>
                <div class="photo-card-meta">
                    <span>${Utils.formatFileSize(photo.size)}</span>
                    <span>${Utils.formatDate(photo.uploadDate)}</span>
                </div>
            </div>
        `;
        
        // Add event listeners
        const img = card.querySelector('img');
        this.lazyLoader.observe(img);
        
        const checkbox = card.querySelector('.photo-card-checkbox');
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            this.togglePhotoSelection(photo.id);
        });
        
        card.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox' || e.target.tagName === 'BUTTON') {
                return;
            }
            console.log('Photo card clicked:', photo);
            this.openPhotoModal(photo, index);
        });
        
        return card;
    }

    // Toggle photo selection
    togglePhotoSelection(photoId) {
        const card = document.querySelector(`[data-photo-id="${photoId}"]`);
        const checkbox = card.querySelector('.photo-card-checkbox');
        
        if (this.selectedPhotos.has(photoId)) {
            this.selectedPhotos.delete(photoId);
            card.classList.remove('selected');
            checkbox.checked = false;
        } else {
            this.selectedPhotos.add(photoId);
            card.classList.add('selected');
            checkbox.checked = true;
        }
        
        this.updateBulkActions();
    }

    // Select all photos
    selectAllPhotos() {
        const selectAllBtn = document.getElementById('select-all');
        
        if (this.selectedPhotos.size === this.filteredPhotos.length && this.filteredPhotos.length > 0) {
            // Deselect all if all are selected
            this.clearSelection();
            selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> Select All';
        } else {
            // Select all currently displayed photos
            this.filteredPhotos.forEach(photo => {
                this.selectedPhotos.add(photo.id);
            });
            
            // Update UI
            document.querySelectorAll('.photo-card').forEach(card => {
                card.classList.add('selected');
                const checkbox = card.querySelector('.photo-card-checkbox');
                if (checkbox) checkbox.checked = true;
            });
            
            selectAllBtn.innerHTML = '<i class="fas fa-minus-square"></i> Deselect All';
            Utils.showToast(`Selected ${this.selectedPhotos.size} photos`, 'success');
        }
        
        this.updateBulkActions();
    }

    // Clear selection
    clearSelection() {
        this.selectedPhotos.clear();
        document.querySelectorAll('.photo-card').forEach(card => {
            card.classList.remove('selected');
            const checkbox = card.querySelector('.photo-card-checkbox');
            if (checkbox) checkbox.checked = false;
        });
        
        const selectAllBtn = document.getElementById('select-all');
        if (selectAllBtn) {
            selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> Select All';
        }
        
        this.updateBulkActions();
    }

    // Update bulk actions visibility
    updateBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        bulkActions.style.display = this.selectedPhotos.size > 0 ? 'flex' : 'none';
        this.updateSelectAllButton();
    }

    // Update select all button text
    updateSelectAllButton() {
        const selectAllBtn = document.getElementById('select-all');
        const allSelected = this.filteredPhotos.length > 0 && 
                           this.filteredPhotos.every(photo => this.selectedPhotos.has(photo.id));
        
        if (allSelected) {
            selectAllBtn.innerHTML = '<i class="fas fa-minus-square"></i> Deselect All';
            selectAllBtn.onclick = () => this.clearSelection();
        } else {
            selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> Select All';
            selectAllBtn.onclick = () => this.selectAllPhotos();
        }
    }

    // Set view mode
    setView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        this.renderPhotos();
    }

    // Open photo modal
    openPhotoModal(photo, index) {
        console.log('Opening photo modal for:', photo);
        this.currentPhotoIndex = index;
        const modal = document.getElementById('photo-modal');
        
        if (!modal) {
            console.error('Photo modal element not found!');
            return;
        }
        
        const modalImage = document.getElementById('modal-image');
        const photoTitle = document.getElementById('photo-title');
        const photoDate = document.getElementById('photo-date');
        const photoSize = document.getElementById('photo-size');
        const photoDimensions = document.getElementById('photo-dimensions');
        const photoUploadDate = document.getElementById('photo-upload-date');
        
        if (!modalImage) {
            console.error('Modal image element not found!');
            return;
        }
        
        // Set image source with fallback
        const imageUrl = photo.downloadURL || `/api/images/${photo.imageKey}`;
        console.log('Setting image URL:', imageUrl);
        modalImage.src = imageUrl;
        
        if (photoTitle) photoTitle.textContent = photo.originalName || 'Untitled';
        if (photoDate) photoDate.textContent = Utils.formatDate(photo.uploadDate);
        if (photoSize) photoSize.textContent = Utils.formatFileSize(photo.size);
        if (photoDimensions) photoDimensions.textContent = `${photo.width || 'Unknown'} × ${photo.height || 'Unknown'}`;
        if (photoUploadDate) photoUploadDate.textContent = new Date(photo.uploadDate).toLocaleDateString();
        
        // Update category display
        const photoCategory = document.getElementById('photo-category');
        if (photoCategory) {
            photoCategory.textContent = photo.category || 'Other';
        }
        
        console.log('Showing modal...');
        modal.style.display = 'block';
        
        // Setup navigation
        this.setupPhotoNavigation();
        
        // Setup action buttons
        this.setupPhotoActions(photo);
    }

    // Setup photo navigation
    setupPhotoNavigation() {
        const prevBtn = document.getElementById('prev-photo');
        const nextBtn = document.getElementById('next-photo');
        
        prevBtn.onclick = () => this.navigatePhoto(-1);
        nextBtn.onclick = () => this.navigatePhoto(1);
        
        prevBtn.style.display = this.currentPhotoIndex > 0 ? 'block' : 'none';
        nextBtn.style.display = this.currentPhotoIndex < this.filteredPhotos.length - 1 ? 'block' : 'none';
    }

    // Navigate to previous/next photo
    navigatePhoto(direction) {
        const newIndex = this.currentPhotoIndex + direction;
        if (newIndex >= 0 && newIndex < this.filteredPhotos.length) {
            const photo = this.filteredPhotos[newIndex];
            this.openPhotoModal(photo, newIndex);
        }
    }

    // Setup photo action buttons
    setupPhotoActions(photo) {
        document.getElementById('edit-photo').onclick = () => this.editPhoto(photo.id);
        document.getElementById('share-photo').onclick = () => this.sharePhoto(photo.id);
        document.getElementById('download-photo').onclick = () => this.downloadPhoto(photo.id);
        document.getElementById('delete-photo').onclick = () => this.deletePhoto(photo.id);
        
        // Setup name editing
        const nameInput = document.getElementById('photo-name-input');
        nameInput.value = photo.originalName;
        
        document.getElementById('save-name').onclick = () => this.updatePhotoName(photo.id, nameInput.value);
    }

    // Edit photo
    editPhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (photo) {
            // Close current modal
            document.getElementById('photo-modal').style.display = 'none';
            
            // Open editor modal
            window.photoEditor.openEditor(photo);
        }
    }

    // Share photo
    async sharePhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (photo) {
            try {
                if (navigator.share) {
                    await navigator.share({
                        title: photo.originalName,
                        text: `Check out this photo: ${photo.originalName}`,
                        url: photo.downloadURL
                    });
                } else {
                    await Utils.copyToClipboard(photo.downloadURL);
                    Utils.showToast('Photo link copied to clipboard', 'success');
                }
            } catch (error) {
                Utils.handleError(error, 'Sharing photo');
            }
        }
    }

    // Download photo
    async downloadPhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) {
            Utils.showToast('Photo not found', 'error');
            return;
        }

        try {
            // Use the server endpoint for downloading
            const downloadUrl = `/api/download/${photoId}`;
            const fileName = photo.originalName || photo.fileName || 'photo.jpg';
            
            // Create download link
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = fileName;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            Utils.showToast('Photo download started', 'success');
            
        } catch (error) {
            console.error('Downloading photo failed:', error);
            Utils.showToast('Unable to download photo. Please try again.', 'error');
        }
    }

    // Delete photo
    async deletePhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (photo && confirm(`Are you sure you want to delete "${photo.originalName}"?`)) {
            try {
                // Ensure Notion client is initialized
                if (!this.notionClient) {
                    this.notionClient = new NotionClient();
                    await this.notionClient.initializePhotosDatabase();
                }
                
                // Delete from Notion (archives the page)
                await this.notionClient.deletePhoto(photoId);
                
                // Remove from local arrays
                this.photos = this.photos.filter(p => p.id !== photoId);
                this.selectedPhotos.delete(photoId);
                
                this.filterAndSortPhotos();
                this.updateStats();
                
                Utils.showToast('Photo deleted successfully', 'success');
                
                // Close modal if open
                document.getElementById('photo-modal').style.display = 'none';
                
            } catch (error) {
                Utils.handleError(error, 'Deleting photo');
            }
        }
    }

    // Delete selected photos
    async deleteSelectedPhotos() {
        if (this.selectedPhotos.size === 0) {
            Utils.showToast('No photos selected', 'warning');
            return;
        }
        
        const count = this.selectedPhotos.size;
        if (confirm(`Are you sure you want to delete ${count} selected photo${count > 1 ? 's' : ''}?`)) {
            Utils.showToast(`Deleting ${count} photos...`, 'info');
            
            try {
                // Delete photos one by one to avoid overwhelming the server
                const selectedIds = Array.from(this.selectedPhotos);
                
                for (const photoId of selectedIds) {
                    try {
                        // Ensure Notion client is initialized
                        if (!this.notionClient) {
                            this.notionClient = new NotionClient();
                            await this.notionClient.initializePhotosDatabase();
                        }
                        
                        // Delete from Notion
                        await this.notionClient.deletePhoto(photoId);
                        
                        // Remove from local arrays
                        this.photos = this.photos.filter(p => p.id !== photoId);
                        this.selectedPhotos.delete(photoId);
                        
                    } catch (error) {
                        console.error(`Failed to delete photo ${photoId}:`, error);
                    }
                }
                
                this.filterAndSortPhotos();
                this.updateStats();
                this.clearSelection();
                
                Utils.showToast(`Successfully deleted ${count} photo${count > 1 ? 's' : ''}`, 'success');
                
            } catch (error) {
                console.error('Error deleting selected photos:', error);
                Utils.showToast('Some photos could not be deleted. Please try again.', 'error');
            }
        }
    }

    // Export selected photos - improved approach
    async exportSelectedPhotos() {
        if (this.selectedPhotos.size === 0) {
            Utils.showToast('No photos selected', 'warning');
            return;
        }
        
        const selectedPhotos = this.photos.filter(p => this.selectedPhotos.has(p.id));
        
        if (selectedPhotos.length === 0) {
            Utils.showToast('No valid photos to export', 'error');
            return;
        }

        Utils.showToast(`Starting download of ${selectedPhotos.length} photos...`, 'info');
        
        try {
            // Download photos with proper URL handling
            for (let i = 0; i < selectedPhotos.length; i++) {
                const photo = selectedPhotos[i];
                
                setTimeout(() => {
                    try {
                        const downloadUrl = `/api/download/${photo.id}`;
                        const fileName = photo.originalName || photo.fileName || `photo_${i + 1}.jpg`;
                        
                        const a = document.createElement('a');
                        a.href = downloadUrl;
                        a.download = fileName;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                    } catch (error) {
                        console.error(`Failed to download ${photo.originalName}:`, error);
                    }
                }, i * 200); // 200ms delay between downloads
            }
            
            Utils.showToast(`All ${selectedPhotos.length} photos download started!`, 'success');
            
            // Clear selection after a delay to allow downloads to start
            setTimeout(() => {
                this.clearSelection();
            }, selectedPhotos.length * 200 + 1000);
            
        } catch (error) {
            console.error('Error exporting photos:', error);
            Utils.showToast('Error starting downloads. Please try again.', 'error');
        }
    }

    // Fallback method for individual downloads
    async downloadPhotosIndividually(selectedPhotos) {
        Utils.showToast(`Downloading ${selectedPhotos.length} photos individually...`, 'info');
        
        for (let i = 0; i < selectedPhotos.length; i++) {
            const photo = selectedPhotos[i];
            
            try {
                const a = document.createElement('a');
                a.href = photo.downloadURL;
                a.download = photo.originalName || `photo_${i + 1}.jpg`;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 300));
                
            } catch (error) {
                console.error(`Failed to download ${photo.originalName}:`, error);
            }
        }
        
        Utils.showToast(`${selectedPhotos.length} photos download completed`, 'success');
        this.clearSelection();
    }

    // Update statistics
    updateStats() {
        const photoCount = document.getElementById('photo-count');
        const storageUsed = document.getElementById('storage-used');
        
        const totalSize = this.photos.reduce((sum, photo) => sum + photo.size, 0);
        
        photoCount.textContent = `${this.photos.length} photo${this.photos.length !== 1 ? 's' : ''}`;
        storageUsed.textContent = `${Utils.formatFileSize(totalSize)} used`;
        
        // Update category summary
        this.updateCategorySummary();
    }

    // Update category summary
    updateCategorySummary() {
        const categorySummary = document.getElementById('category-summary');
        const categoryCards = document.getElementById('category-cards');
        
        if (this.photos.length === 0) {
            categorySummary.style.display = 'none';
            return;
        }
        
        // Count photos by category
        const categoryCount = {};
        this.photos.forEach(photo => {
            const category = photo.category || 'other';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        // Category icons
        const categoryIcons = {
            memories: 'fas fa-heart',
            friends: 'fas fa-user-friends',
            family: 'fas fa-home',
            travel: 'fas fa-plane',
            food: 'fas fa-utensils',
            selfies: 'fas fa-camera',
            nature: 'fas fa-leaf',
            pets: 'fas fa-paw',
            celebration: 'fas fa-birthday-cake',
            work: 'fas fa-briefcase',
            hobby: 'fas fa-gamepad',
            screenshots: 'fas fa-desktop',
            documents: 'fas fa-file-alt',
            favorites: 'fas fa-star',
            shopping: 'fas fa-shopping-cart',
            sports: 'fas fa-running',
            education: 'fas fa-graduation-cap',
            fitness: 'fas fa-dumbbell',
            art: 'fas fa-palette',
            music: 'fas fa-music',
            other: 'fas fa-folder'
        };
        
        categoryCards.innerHTML = '';
        
        Object.entries(categoryCount).forEach(([category, count]) => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.dataset.category = category;
            
            if (this.currentCategory === category) {
                card.classList.add('active');
            }
            
            card.innerHTML = `
                <div class="category-card-icon">
                    <i class="${categoryIcons[category] || 'fas fa-folder'}"></i>
                </div>
                <div class="category-card-name">${category}</div>
                <div class="category-card-count">${count} photo${count !== 1 ? 's' : ''}</div>
            `;
            
            card.addEventListener('click', () => {
                this.currentCategory = category;
                document.getElementById('category-select').value = category;
                this.filterAndSortPhotos();
                this.updateCategorySummary();
            });
            
            categoryCards.appendChild(card);
        });
        
        // Add "All Categories" card
        const allCard = document.createElement('div');
        allCard.className = 'category-card';
        allCard.dataset.category = 'all';
        
        if (this.currentCategory === 'all') {
            allCard.classList.add('active');
        }
        
        allCard.innerHTML = `
            <div class="category-card-icon">
                <i class="fas fa-images"></i>
            </div>
            <div class="category-card-name">All Photos</div>
            <div class="category-card-count">${this.photos.length} photo${this.photos.length !== 1 ? 's' : ''}</div>
        `;
        
        allCard.addEventListener('click', () => {
            this.currentCategory = 'all';
            document.getElementById('category-select').value = 'all';
            this.filterAndSortPhotos();
            this.updateCategorySummary();
        });
        
        categoryCards.insertBefore(allCard, categoryCards.firstChild);
        
        categorySummary.style.display = 'block';
    }

    // Show/hide loading spinner
    showLoading(show) {
        const loadingSpinner = document.getElementById('loading-spinner');
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }

    // Add photo to gallery
    addPhoto(photo) {
        this.photos.unshift(photo);
        this.filterAndSortPhotos();
        this.updateStats();
    }

    // Update photo
    updatePhoto(photoId, updates) {
        const photo = this.photos.find(p => p.id === photoId);
        if (photo) {
            Object.assign(photo, updates);
            this.filterAndSortPhotos();
        }
    }

    // Get photo by ID
    getPhotoById(photoId) {
        return this.photos.find(p => p.id === photoId);
    }

    // Update photo name
    async updatePhotoName(photoId, newName) {
        if (!newName || newName.trim() === '') {
            Utils.showToast('Please enter a valid name', 'warning');
            return;
        }

        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) {
            Utils.showToast('Photo not found', 'error');
            return;
        }

        try {
            // Ensure Notion client is initialized
            if (!this.notionClient) {
                this.notionClient = new NotionClient();
                await this.notionClient.initializePhotosDatabase();
            }

            // Update in Notion
            await this.notionClient.updatePhoto(photoId, {
                fileName: newName.trim()
            });

            // Update local photo object
            photo.originalName = newName.trim();
            photo.fileName = newName.trim();
            
            // Update UI
            this.filterAndSortPhotos();
            
            // Update modal if open
            const photoTitle = document.getElementById('photo-title');
            if (photoTitle) {
                photoTitle.textContent = newName.trim();
            }
            
            Utils.showToast('Photo name updated successfully', 'success');
            
        } catch (error) {
            console.error('Updating photo name failed:', error);
            Utils.showToast('Failed to update photo name. Please try again.', 'error');
        }
    }

    // Update bulk actions visibility and state
    updateBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        const selectedCount = this.selectedPhotos.size;
        
        if (selectedCount > 0) {
            bulkActions.style.display = 'flex';
            
            // Update delete button text
            const deleteBtn = document.getElementById('delete-selected');
            if (deleteBtn) {
                deleteBtn.innerHTML = `<i class="fas fa-trash"></i> Delete ${selectedCount} Photo${selectedCount > 1 ? 's' : ''}`;
            }
            
            // Update export button text
            const exportBtn = document.getElementById('export-selected');
            if (exportBtn) {
                exportBtn.innerHTML = `<i class="fas fa-download"></i> Download ${selectedCount} Photo${selectedCount > 1 ? 's' : ''}`;
            }
        } else {
            bulkActions.style.display = 'none';
        }
    }

    // Update select all button state
    updateSelectAllButton() {
        const selectAllBtn = document.getElementById('select-all');
        if (!selectAllBtn) return;
        
        const selectedCount = this.selectedPhotos.size;
        const totalCount = this.filteredPhotos.length;
        
        if (selectedCount === 0) {
            selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> Select All';
        } else if (selectedCount === totalCount && totalCount > 0) {
            selectAllBtn.innerHTML = '<i class="fas fa-minus-square"></i> Deselect All';
        } else {
            selectAllBtn.innerHTML = `<i class="fas fa-check-square"></i> Select All (${selectedCount} selected)`;
        }
    }

    // Cleanup resources
    cleanup() {
        if (this.lazyLoader) {
            this.lazyLoader.disconnect();
        }
        this.selectedPhotos.clear();
    }
}

// Export for use in other modules
window.PhotoGallery = PhotoGallery;

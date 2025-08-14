// Photo Memories Timeline with AI Storytelling
class MemoriesTimeline {
    constructor(notionClient) {
        this.notionClient = notionClient;
        this.photos = [];
        this.memories = [];
        this.currentStory = null;
        this.isStoryMode = false;
        this.openaiApiKey = null;
        
        this.initializeEventListeners();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Timeline navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-memory-id]')) {
                const memoryId = e.target.dataset.memoryId;
                this.showMemoryDetail(memoryId);
            }
            
            if (e.target.matches('.story-mode-toggle')) {
                this.toggleStoryMode();
            }
            
            if (e.target.matches('.generate-story-btn')) {
                const memoryId = e.target.dataset.memoryId;
                this.generateStoryForMemory(memoryId);
            }
            
            if (e.target.matches('.timeline-filter')) {
                this.filterTimeline(e.target.dataset.filter);
            }
        });
    }

    // Load photos and create memories timeline
    async loadMemoriesTimeline() {
        try {
            Utils.showToast('Loading your photo memories...', 'info');
            
            // Get all photos from Notion
            this.photos = await this.notionClient.getPhotos();
            
            if (this.photos.length === 0) {
                this.showEmptyTimeline();
                return;
            }

            // Group photos into memories based on date and context
            this.memories = this.createMemoriesFromPhotos(this.photos);
            
            // Render the timeline
            this.renderTimeline();
            
            Utils.showToast(`Found ${this.memories.length} photo memories!`, 'success');
            
        } catch (error) {
            console.error('Error loading memories timeline:', error);
            Utils.showToast('Failed to load memories timeline', 'error');
        }
    }

    // Create memories by grouping photos
    createMemoriesFromPhotos(photos) {
        const memories = [];
        const photosByDate = this.groupPhotosByDate(photos);
        
        Object.entries(photosByDate).forEach(([dateKey, dayPhotos]) => {
            if (dayPhotos.length > 0) {
                const memory = this.createMemoryFromDayPhotos(dateKey, dayPhotos);
                memories.push(memory);
            }
        });
        
        // Sort memories by date (newest first)
        return memories.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Group photos by day
    groupPhotosByDate(photos) {
        const groups = {};
        
        photos.forEach(photo => {
            const date = new Date(photo.uploadDate);
            const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(photo);
        });
        
        return groups;
    }

    // Create a memory from a day's photos
    createMemoryFromDayPhotos(dateKey, photos) {
        const date = new Date(dateKey);
        const categories = [...new Set(photos.map(p => p.category))];
        const primaryCategory = this.getMostCommonCategory(photos);
        
        // Generate a title based on date and content
        const title = this.generateMemoryTitle(date, photos, primaryCategory);
        
        // Select representative photos (max 4 for preview)
        const representativePhotos = this.selectRepresentativePhotos(photos);
        
        return {
            id: `memory_${dateKey}`,
            date: date,
            title: title,
            photos: photos,
            representativePhotos: representativePhotos,
            categories: categories,
            primaryCategory: primaryCategory,
            photoCount: photos.length,
            story: null,
            isStoryGenerated: false
        };
    }

    // Get most common category from photos
    getMostCommonCategory(photos) {
        const categoryCounts = {};
        photos.forEach(photo => {
            categoryCounts[photo.category] = (categoryCounts[photo.category] || 0) + 1;
        });
        
        return Object.entries(categoryCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'other';
    }

    // Generate memory title based on content
    generateMemoryTitle(date, photos, primaryCategory) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        
        const month = monthNames[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        
        const photoCount = photos.length;
        
        // Create contextual titles based on category and count
        const categoryTitles = {
            'family': `Family Time - ${month} ${day}`,
            'friends': `Friends Gathering - ${month} ${day}`,
            'travel': `Travel Adventure - ${month} ${day}`,
            'food': `Culinary Moments - ${month} ${day}`,
            'pets': `Pet Memories - ${month} ${day}`,
            'nature': `Nature Discovery - ${month} ${day}`,
            'events': `Special Event - ${month} ${day}`,
            'selfies': `Personal Moments - ${month} ${day}`,
            'work': `Work Day - ${month} ${day}`,
            'shopping': `Shopping Trip - ${month} ${day}`
        };
        
        const baseTitle = categoryTitles[primaryCategory] || `Photo Memory - ${month} ${day}`;
        
        if (photoCount > 10) {
            return `${baseTitle} (${photoCount} photos)`;
        } else if (photoCount > 1) {
            return baseTitle;
        } else {
            return `Single Moment - ${month} ${day}`;
        }
    }

    // Select representative photos for preview
    selectRepresentativePhotos(photos) {
        if (photos.length <= 4) {
            return photos;
        }
        
        // Select photos with different timestamps to show variety
        const sorted = [...photos].sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
        const selected = [];
        const step = Math.floor(sorted.length / 4);
        
        for (let i = 0; i < 4; i++) {
            const index = Math.min(i * step, sorted.length - 1);
            selected.push(sorted[index]);
        }
        
        return selected;
    }

    // Render the memories timeline
    renderTimeline() {
        const container = document.getElementById('memories-timeline');
        if (!container) return;
        
        const html = `
            <div class="timeline-header">
                <div class="timeline-title">
                    <h2><i class="fas fa-clock"></i> Your Photo Memories</h2>
                    <p>Discover the stories behind your photos</p>
                </div>
                <div class="timeline-controls">
                    <button class="story-mode-toggle ${this.isStoryMode ? 'active' : ''}">
                        <i class="fas fa-book-open"></i> Story Mode
                    </button>
                    <div class="timeline-filters">
                        <button class="timeline-filter active" data-filter="all">All</button>
                        <button class="timeline-filter" data-filter="recent">Recent</button>
                        <button class="timeline-filter" data-filter="family">Family</button>
                        <button class="timeline-filter" data-filter="travel">Travel</button>
                        <button class="timeline-filter" data-filter="events">Events</button>
                    </div>
                </div>
            </div>
            
            <div class="timeline-content">
                ${this.memories.map(memory => this.renderMemoryCard(memory)).join('')}
            </div>
        `;
        
        container.innerHTML = html;
        
        // Add smooth scroll animations
        this.addScrollAnimations();
    }

    // Render individual memory card
    renderMemoryCard(memory) {
        const dateFormatted = memory.date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const photosPreview = memory.representativePhotos.map(photo => `
            <div class="memory-photo-preview">
                <img src="${photo.downloadURL}" alt="${photo.fileName}" loading="lazy">
            </div>
        `).join('');
        
        const storySection = memory.isStoryGenerated ? `
            <div class="memory-story">
                <h4><i class="fas fa-feather-alt"></i> Story</h4>
                <p>${memory.story}</p>
            </div>
        ` : `
            <div class="memory-story-placeholder">
                <button class="generate-story-btn" data-memory-id="${memory.id}">
                    <i class="fas fa-magic"></i> Generate Story
                </button>
            </div>
        `;
        
        return `
            <div class="memory-card ${this.isStoryMode ? 'story-mode' : ''}" data-memory-id="${memory.id}">
                <div class="memory-timeline-marker">
                    <div class="timeline-dot"></div>
                    <div class="timeline-line"></div>
                </div>
                
                <div class="memory-content">
                    <div class="memory-header">
                        <h3>${memory.title}</h3>
                        <div class="memory-meta">
                            <span class="memory-date">
                                <i class="fas fa-calendar"></i> ${dateFormatted}
                            </span>
                            <span class="memory-count">
                                <i class="fas fa-images"></i> ${memory.photoCount} ${memory.photoCount === 1 ? 'photo' : 'photos'}
                            </span>
                            <span class="memory-category category-${memory.primaryCategory}">
                                ${memory.primaryCategory}
                            </span>
                        </div>
                    </div>
                    
                    <div class="memory-photos">
                        ${photosPreview}
                        ${memory.photoCount > 4 ? `<div class="more-photos">+${memory.photoCount - 4} more</div>` : ''}
                    </div>
                    
                    ${this.isStoryMode ? storySection : ''}
                </div>
            </div>
        `;
    }

    // Show empty timeline message
    showEmptyTimeline() {
        const container = document.getElementById('memories-timeline');
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-timeline">
                <div class="empty-timeline-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <h3>No Memories Yet</h3>
                <p>Upload some photos to start creating your personal timeline of memories!</p>
                <button onclick="document.getElementById('file-input').click()" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Upload Photos
                </button>
            </div>
        `;
    }

    // Toggle story mode
    toggleStoryMode() {
        this.isStoryMode = !this.isStoryMode;
        this.renderTimeline();
        
        if (this.isStoryMode) {
            Utils.showToast('Story mode enabled - click "Generate Story" to create narratives', 'info');
        } else {
            Utils.showToast('Story mode disabled', 'info');
        }
    }

    // Generate AI story for a memory
    async generateStoryForMemory(memoryId) {
        const memory = this.memories.find(m => m.id === memoryId);
        if (!memory) return;
        
        // Check if OpenAI API key is available
        if (!this.openaiApiKey) {
            this.requestOpenAIKey();
            return;
        }
        
        try {
            const button = document.querySelector(`[data-memory-id="${memoryId}"] .generate-story-btn`);
            if (button) {
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating story...';
                button.disabled = true;
            }
            
            // Create story prompt based on memory data
            const story = await this.createStoryWithAI(memory);
            
            // Update memory with generated story
            memory.story = story;
            memory.isStoryGenerated = true;
            
            // Re-render the specific memory card
            this.renderTimeline();
            
            Utils.showToast('Story generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating story:', error);
            Utils.showToast('Failed to generate story. Please try again.', 'error');
            
            // Reset button
            const button = document.querySelector(`[data-memory-id="${memoryId}"] .generate-story-btn`);
            if (button) {
                button.innerHTML = '<i class="fas fa-magic"></i> Generate Story';
                button.disabled = false;
            }
        }
    }

    // Create story using OpenAI
    async createStoryWithAI(memory) {
        const prompt = this.buildStoryPrompt(memory);
        
        const response = await fetch('/api/generate-story', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                memory: {
                    date: memory.date,
                    category: memory.primaryCategory,
                    photoCount: memory.photoCount,
                    categories: memory.categories
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate story');
        }
        
        const result = await response.json();
        return result.story;
    }

    // Build story prompt for AI
    buildStoryPrompt(memory) {
        const dateStr = memory.date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return `Create a warm, personal story (2-3 sentences) about a photo memory from ${dateStr}. 
        The memory contains ${memory.photoCount} photo${memory.photoCount > 1 ? 's' : ''} 
        primarily categorized as "${memory.primaryCategory}". 
        Categories present: ${memory.categories.join(', ')}.
        
        Make it feel like a journal entry that captures the emotion and significance of that day. 
        Use second person ("you") to make it personal. Keep it authentic and heartwarming.
        Don't mention technical details about photos or cameras.`;
    }

    // Request OpenAI API key from user
    requestOpenAIKey() {
        Utils.showToast('OpenAI API key required for story generation', 'info');
        
        // This will trigger the ask_secrets tool
        window.dispatchEvent(new CustomEvent('request-openai-key'));
    }

    // Set OpenAI API key
    setOpenAIKey(apiKey) {
        this.openaiApiKey = apiKey;
    }

    // Filter timeline by category or time
    filterTimeline(filter) {
        // Update active filter button
        document.querySelectorAll('.timeline-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        let filteredMemories = [...this.memories];
        
        switch (filter) {
            case 'recent':
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                filteredMemories = this.memories.filter(m => m.date >= oneMonthAgo);
                break;
            case 'family':
            case 'travel':
            case 'events':
                filteredMemories = this.memories.filter(m => m.primaryCategory === filter);
                break;
            case 'all':
            default:
                // Show all memories
                break;
        }
        
        // Re-render with filtered memories
        const originalMemories = this.memories;
        this.memories = filteredMemories;
        this.renderTimeline();
        this.memories = originalMemories; // Restore original for future filtering
    }

    // Show detailed view of a memory
    showMemoryDetail(memoryId) {
        const memory = this.memories.find(m => m.id === memoryId);
        if (!memory) return;
        
        // This could open a modal or navigate to a detailed view
        // For now, we'll just scroll to the memory
        const memoryElement = document.querySelector(`[data-memory-id="${memoryId}"]`);
        if (memoryElement) {
            memoryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            memoryElement.classList.add('highlighted');
            setTimeout(() => {
                memoryElement.classList.remove('highlighted');
            }, 2000);
        }
    }

    // Add scroll animations
    addScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        document.querySelectorAll('.memory-card').forEach(card => {
            observer.observe(card);
        });
    }

    // Refresh timeline with new photos
    async refreshTimeline() {
        await this.loadMemoriesTimeline();
    }
}

// Export for use in other modules
window.MemoriesTimeline = MemoriesTimeline;
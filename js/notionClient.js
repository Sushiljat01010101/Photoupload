// Browser-compatible Notion API client for photo gallery (using server proxy)

class NotionClient {
    constructor() {
        this.baseUrl = '/api';
        this.headers = {
            'Content-Type': 'application/json'
        };
    }

    // Make API request to our server proxy
    async makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: this.headers,
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API error: ${response.status} - ${errorData.error || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Initialize photos database (handled by server)
    async initializePhotosDatabase() {
        // Database initialization is handled by the server
        return true;
    }

    // Get all photos from database
    async getPhotos() {
        try {
            const response = await this.makeRequest('/photos');
            return response;
        } catch (error) {
            console.error('Error fetching photos:', error);
            throw error;
        }
    }

    // Add a photo to database
    async addPhoto(photoData) {
        try {
            const response = await this.makeRequest('/photos', {
                method: 'POST',
                body: JSON.stringify(photoData)
            });

            return response.id;
        } catch (error) {
            console.error('Error adding photo:', error);
            throw error;
        }
    }

    // Update a photo
    async updatePhoto(photoId, updates) {
        try {
            await this.makeRequest(`/photos/${photoId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });

            return true;
        } catch (error) {
            console.error('Error updating photo:', error);
            throw error;
        }
    }

    // Delete a photo (archive it)
    async deletePhoto(photoId) {
        try {
            await this.makeRequest(`/photos/${photoId}`, {
                method: 'DELETE'
            });

            return true;
        } catch (error) {
            console.error('Error deleting photo:', error);
            throw error;
        }
    }
}

// Export for use in other modules
window.NotionClient = NotionClient;
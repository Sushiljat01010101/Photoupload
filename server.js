// Simple Express server to serve the photo gallery with authentication
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Client } = require('@notionhq/client');

const app = express();
const PORT = process.env.PORT || 5000;

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET,
});

// Extract page ID from URL
function extractPageIdFromUrl(pageUrl) {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
        return match[1];
    }
    throw new Error("Failed to extract page ID from URL");
}

const NOTION_PAGE_ID = extractPageIdFromUrl(process.env.NOTION_PAGE_URL);
let photosDatabaseId = null;
let usersDatabaseId = null;

// In-memory storage for full image data
const imageStore = new Map();

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'photo-gallery-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Serve static files
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Initialize Users database
async function initializeUsersDatabase() {
    try {
        if (usersDatabaseId) return usersDatabaseId;
        
        // Check if Users database already exists
        const childBlocks = await notion.blocks.children.list({
            block_id: NOTION_PAGE_ID
        });
        
        for (const block of childBlocks.results) {
            if (block.type === 'child_database') {
                const dbInfo = await notion.databases.retrieve({
                    database_id: block.id
                });
                
                const dbTitle = dbInfo.title?.[0]?.plain_text?.toLowerCase();
                if (dbTitle === 'users') {
                    usersDatabaseId = block.id;
                    console.log('Found existing Users database');
                    return usersDatabaseId;
                }
            }
        }
        
        // Create Users database if it doesn't exist
        console.log('Creating Users database...');
        const database = await notion.databases.create({
            parent: {
                type: "page_id",
                page_id: NOTION_PAGE_ID
            },
            title: [
                {
                    type: "text",
                    text: { content: "Users" }
                }
            ],
            properties: {
                Username: { title: {} },
                Email: { email: {} },
                Password: { rich_text: {} },
                FullName: { rich_text: {} },
                CreatedAt: { date: {} },
                LastLogin: { date: {} },
                IsActive: { checkbox: {} }
            }
        });
        
        usersDatabaseId = database.id;
        console.log('Users database created with ID:', usersDatabaseId);
        return usersDatabaseId;
    } catch (error) {
        console.error('Error initializing Users database:', error);
        throw error;
    }
}

// Notion API proxy endpoints
async function initializePhotosDatabase() {
    try {
        if (photosDatabaseId) return photosDatabaseId;
        
        // Check if Photos database already exists
        const childBlocks = await notion.blocks.children.list({
            block_id: NOTION_PAGE_ID
        });
        
        for (const block of childBlocks.results) {
            if (block.type === 'child_database') {
                const dbInfo = await notion.databases.retrieve({
                    database_id: block.id
                });
                
                const dbTitle = dbInfo.title?.[0]?.plain_text?.toLowerCase();
                if (dbTitle === 'photos') {
                    // Check if this database has the complete schema (ImageKey and UserId properties)
                    if (dbInfo.properties.ImageKey && dbInfo.properties.UserId) {
                        photosDatabaseId = block.id;
                        console.log('Found existing Photos database with correct schema');
                        return photosDatabaseId;
                    } else {
                        // Rename old database and create new one
                        console.log('Found Photos database with incomplete schema, renaming it...');
                        const timestamp = new Date().toISOString().split('T')[0];
                        await notion.databases.update({
                            database_id: block.id,
                            title: [
                                {
                                    type: "text",
                                    text: { content: `Photos_old_${timestamp}` }
                                }
                            ]
                        });
                        break; // Exit loop to create new database
                    }
                }
            }
        }
        
        // Create Photos database if it doesn't exist
        const database = await notion.databases.create({
            parent: {
                type: "page_id",
                page_id: NOTION_PAGE_ID
            },
            title: [
                {
                    type: "text",
                    text: { content: "Photos" }
                }
            ],
            properties: {
                Name: { title: {} },
                OriginalName: { rich_text: {} },
                UserId: { rich_text: {} },
                Category: {
                    select: {
                        options: [
                            { name: "memories", color: "blue" },
                            { name: "friends", color: "green" },
                            { name: "family", color: "orange" },
                            { name: "travel", color: "purple" },
                            { name: "food", color: "pink" },
                            { name: "selfies", color: "yellow" },
                            { name: "nature", color: "green" },
                            { name: "pets", color: "brown" },
                            { name: "celebration", color: "red" },
                            { name: "work", color: "gray" },
                            { name: "hobby", color: "blue" },
                            { name: "screenshots", color: "default" },
                            { name: "documents", color: "gray" },
                            { name: "favorites", color: "red" },
                            { name: "shopping", color: "pink" },
                            { name: "sports", color: "orange" },
                            { name: "education", color: "blue" },
                            { name: "fitness", color: "green" },
                            { name: "art", color: "purple" },
                            { name: "music", color: "yellow" },
                            { name: "other", color: "default" }
                        ]
                    }
                },
                FileSize: { number: {} },
                FileType: { rich_text: {} },
                Width: { number: {} },
                Height: { number: {} },
                UploadDate: { date: {} },
                ImageKey: { rich_text: {} },
                Thumbnail: { rich_text: {} },
                Tags: {
                    multi_select: {
                        options: [
                            { name: "edited", color: "blue" },
                            { name: "favorite", color: "red" },
                            { name: "shared", color: "green" },
                            { name: "processed", color: "yellow" }
                        ]
                    }
                }
            }
        });
        
        photosDatabaseId = database.id;
        console.log('New Photos database created with ID:', photosDatabaseId);
        return photosDatabaseId;
    } catch (error) {
        console.error('Error initializing Photos database:', error);
        throw error;
    }
}

// Authentication API endpoints

// Register new user
app.post('/api/register', async (req, res) => {
    try {
        await initializeUsersDatabase();
        
        const { username, email, password, fullName } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }
        
        // Check if user already exists
        const existingUser = await notion.databases.query({
            database_id: usersDatabaseId,
            filter: {
                or: [
                    {
                        property: "Username",
                        title: {
                            equals: username
                        }
                    },
                    {
                        property: "Email",
                        email: {
                            equals: email
                        }
                    }
                ]
            }
        });
        
        if (existingUser.results.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = await notion.pages.create({
            parent: {
                database_id: usersDatabaseId
            },
            properties: {
                Username: {
                    title: [
                        {
                            text: { content: username }
                        }
                    ]
                },
                Email: {
                    email: email
                },
                Password: {
                    rich_text: [
                        {
                            text: { content: hashedPassword }
                        }
                    ]
                },
                FullName: {
                    rich_text: [
                        {
                            text: { content: fullName || username }
                        }
                    ]
                },
                CreatedAt: {
                    date: {
                        start: new Date().toISOString()
                    }
                },
                IsActive: {
                    checkbox: true
                }
            }
        });
        
        // Create session
        req.session.userId = user.id;
        req.session.username = username;
        
        res.json({
            id: user.id,
            username: username,
            email: email,
            fullName: fullName || username
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login user
app.post('/api/login', async (req, res) => {
    try {
        await initializeUsersDatabase();
        
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Find user
        const userQuery = await notion.databases.query({
            database_id: usersDatabaseId,
            filter: {
                property: "Username",
                title: {
                    equals: username
                }
            }
        });
        
        if (userQuery.results.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const userPage = userQuery.results[0];
        const properties = userPage.properties;
        
        // Verify password
        const storedPassword = properties.Password?.rich_text?.[0]?.plain_text;
        const isValidPassword = await bcrypt.compare(password, storedPassword);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Update last login
        await notion.pages.update({
            page_id: userPage.id,
            properties: {
                LastLogin: {
                    date: {
                        start: new Date().toISOString()
                    }
                }
            }
        });
        
        // Create session
        req.session.userId = userPage.id;
        req.session.username = username;
        
        res.json({
            id: userPage.id,
            username: properties.Username?.title?.[0]?.plain_text,
            email: properties.Email?.email,
            fullName: properties.FullName?.rich_text?.[0]?.plain_text
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Logout user
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// Get current user
app.get('/api/user', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const userPage = await notion.pages.retrieve({
            page_id: req.session.userId
        });
        
        const properties = userPage.properties;
        
        res.json({
            id: userPage.id,
            username: properties.Username?.title?.[0]?.plain_text,
            email: properties.Email?.email,
            fullName: properties.FullName?.rich_text?.[0]?.plain_text
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Get all photos (protected)
app.get('/api/photos', requireAuth, async (req, res) => {
    try {
        await initializePhotosDatabase();
        
        const response = await notion.databases.query({
            database_id: photosDatabaseId,
            filter: {
                property: "UserId",
                rich_text: {
                    equals: req.session.userId
                }
            },
            sorts: [
                {
                    property: "UploadDate",
                    direction: "descending"
                }
            ]
        });

        const photos = response.results.map((page) => {
            const properties = page.properties;
            
            return {
                id: page.id,
                fileName: properties.Name?.title?.[0]?.plain_text || "Untitled",
                originalName: properties.OriginalName?.rich_text?.[0]?.plain_text || "unknown",
                category: properties.Category?.select?.name || "other",
                size: properties.FileSize?.number || 0,
                type: properties.FileType?.rich_text?.[0]?.plain_text || "image/jpeg",
                width: properties.Width?.number || 0,
                height: properties.Height?.number || 0,
                uploadDate: properties.UploadDate?.date?.start ? new Date(properties.UploadDate.date.start) : new Date(),
                imageKey: properties.ImageKey?.rich_text?.[0]?.plain_text || "",
                thumbnail: properties.Thumbnail?.rich_text?.[0]?.plain_text || "",
                tags: properties.Tags?.multi_select?.map(tag => tag.name) || [],
                downloadURL: `/api/images/${properties.ImageKey?.rich_text?.[0]?.plain_text || ""}`
            };
        });

        res.json(photos);
    } catch (error) {
        console.error('Error fetching photos:', error);
        res.status(500).json({ error: 'Failed to fetch photos' });
    }
});

// Generate thumbnail from base64 image
function generateThumbnail(base64Data, maxSize = 200) {
    try {
        // For now, we'll store a truncated version as thumbnail
        // In a real implementation, you'd use image processing to create actual thumbnails
        if (base64Data.length > 2000) {
            return base64Data.substring(0, 1500) + '...'; // Truncated for storage
        }
        return base64Data;
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        return '';
    }
}

// Add a photo (protected)
app.post('/api/photos', requireAuth, async (req, res) => {
    try {
        await initializePhotosDatabase();
        
        const photoData = req.body;
        
        // Generate unique key for image storage
        const imageKey = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store full image data in memory
        if (photoData.imageData) {
            imageStore.set(imageKey, photoData.imageData);
        }
        
        // Generate thumbnail for Notion storage
        const thumbnail = generateThumbnail(photoData.imageData || '');
        
        const response = await notion.pages.create({
            parent: {
                database_id: photosDatabaseId
            },
            properties: {
                Name: {
                    title: [
                        {
                            text: { content: photoData.fileName || "Untitled Photo" }
                        }
                    ]
                },
                OriginalName: {
                    rich_text: [
                        {
                            text: { content: photoData.originalName || photoData.fileName || "unknown" }
                        }
                    ]
                },
                UserId: {
                    rich_text: [
                        {
                            text: { content: req.session.userId }
                        }
                    ]
                },
                Category: {
                    select: { name: photoData.category || "other" }
                },
                FileSize: {
                    number: photoData.size || 0
                },
                FileType: {
                    rich_text: [
                        {
                            text: { content: photoData.type || "image/jpeg" }
                        }
                    ]
                },
                Width: {
                    number: photoData.width || 0
                },
                Height: {
                    number: photoData.height || 0
                },
                UploadDate: {
                    date: {
                        start: photoData.uploadDate ? new Date(photoData.uploadDate).toISOString() : new Date().toISOString()
                    }
                },
                ImageKey: {
                    rich_text: [
                        {
                            text: { content: imageKey }
                        }
                    ]
                },
                Thumbnail: {
                    rich_text: [
                        {
                            text: { content: thumbnail }
                        }
                    ]
                },
                Tags: {
                    multi_select: (photoData.tags || []).map(tag => ({ name: tag }))
                }
            }
        });

        res.json({ id: response.id });
    } catch (error) {
        console.error('Error adding photo:', error);
        res.status(500).json({ error: 'Failed to add photo' });
    }
});

// Serve individual images
app.get('/api/images/:imageKey', (req, res) => {
    try {
        const { imageKey } = req.params;
        const imageData = imageStore.get(imageKey);
        
        if (!imageData) {
            return res.status(404).json({ error: 'Image not found' });
        }
        
        // Parse base64 data
        const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({ error: 'Invalid image data format' });
        }
        
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        res.set({
            'Content-Type': mimeType,
            'Content-Length': buffer.length,
            'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
        });
        
        res.send(buffer);
    } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({ error: 'Failed to serve image' });
    }
});

// Download photo endpoint
app.get('/api/download/:photoId', requireAuth, async (req, res) => {
    try {
        const { photoId } = req.params;
        
        // Get photo details from Notion
        const page = await notion.pages.retrieve({ page_id: photoId });
        const properties = page.properties;
        
        const imageKey = properties.ImageKey?.rich_text?.[0]?.plain_text;
        const originalName = properties.OriginalName?.rich_text?.[0]?.plain_text || 'photo.jpg';
        
        if (!imageKey) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        
        const imageData = imageStore.get(imageKey);
        if (!imageData) {
            return res.status(404).json({ error: 'Image data not found' });
        }
        
        // Extract the data URL parts
        const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({ error: 'Invalid image data' });
        }
        
        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Set headers for download
        res.set('Content-Type', contentType);
        res.set('Content-Disposition', `attachment; filename="${originalName}"`);
        res.set('Content-Length', buffer.length);
        res.send(buffer);
        
    } catch (error) {
        console.error('Error downloading photo:', error);
        res.status(500).json({ error: 'Failed to download photo' });
    }
});

// Update a photo (protected)
app.put('/api/photos/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const properties = {};

        if (updates.fileName) {
            properties.Name = {
                title: [
                    {
                        text: { content: updates.fileName }
                    }
                ]
            };
        }

        if (updates.category) {
            properties.Category = {
                select: { name: updates.category }
            };
        }

        if (updates.tags) {
            properties.Tags = {
                multi_select: updates.tags.map(tag => ({ name: tag }))
            };
        }

        await notion.pages.update({
            page_id: id,
            properties
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating photo:', error);
        res.status(500).json({ error: 'Failed to update photo' });
    }
});

// Delete a photo (protected)
app.delete('/api/photos/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if the page exists and is not already archived
        try {
            const page = await notion.pages.retrieve({ page_id: id });
            
            if (!page.archived) {
                // Only archive if not already archived
                await notion.pages.update({
                    page_id: id,
                    archived: true
                });
            }
        } catch (pageError) {
            // If page doesn't exist or can't be retrieved, consider it already deleted
            console.log(`Page ${id} already archived or doesn't exist:`, pageError.message);
        }

        // Remove from imageStore regardless
        if (imageStore.has(id)) {
            imageStore.delete(id);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({ error: 'Failed to delete photo' });
    }
});

// Generate story using OpenAI (protected)
app.post('/api/generate-story', requireAuth, async (req, res) => {
    try {
        const { prompt, memory } = req.body;
        
        // Check if OpenAI is configured
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            return res.status(400).json({ 
                error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.' 
            });
        }
        
        // Import OpenAI (dynamic import for optional dependency)
        let OpenAI;
        try {
            OpenAI = require('openai');
        } catch (error) {
            return res.status(500).json({ 
                error: 'OpenAI package not installed. Story generation requires OpenAI integration.' 
            });
        }
        
        const openai = new OpenAI({ apiKey: openaiApiKey });
        
        // Generate story using OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
                {
                    role: "system",
                    content: "You are a storyteller who creates warm, personal narratives from photo memories. Write in second person ('you') to make it personal and heartwarming. Keep stories to 2-3 sentences and focus on emotions and experiences rather than technical details."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 150,
            temperature: 0.7
        });
        
        const story = response.choices[0].message.content.trim();
        
        res.json({ story });
        
    } catch (error) {
        console.error('Error generating story:', error);
        
        if (error.status === 401) {
            res.status(401).json({ error: 'Invalid OpenAI API key. Please check your API key configuration.' });
        } else if (error.status === 429) {
            res.status(429).json({ error: 'OpenAI API rate limit exceeded. Please try again later.' });
        } else {
            res.status(500).json({ error: 'Failed to generate story. Please try again.' });
        }
    }
});

// Serve index.html with authentication check
app.get('/', (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session.userId) {
            return res.redirect('/auth');
        }
        
        // Read the index.html file
        let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        
        // Inject environment variables
        const envScript = `
        <script>
            // Inject environment variables for browser access
            window.NOTION_INTEGRATION_SECRET = "${process.env.NOTION_INTEGRATION_SECRET || ''}";
            window.NOTION_PAGE_URL = "${process.env.NOTION_PAGE_URL || ''}";
        </script>`;
        
        // Replace the placeholder script with actual environment variables
        html = html.replace(
            '<script>\n        // Inject environment variables for browser access\n        window.NOTION_INTEGRATION_SECRET = process?.env?.NOTION_INTEGRATION_SECRET;\n        window.NOTION_PAGE_URL = process?.env?.NOTION_PAGE_URL;\n    </script>',
            envScript
        );
        
        res.send(html);
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Serve auth page
app.get('/auth', (req, res) => {
    try {
        // If user is already authenticated, redirect to main app
        if (req.session.userId) {
            return res.redirect('/');
        }
        
        res.sendFile(path.join(__dirname, 'auth.html'));
    } catch (error) {
        console.error('Error serving auth.html:', error);
        res.status(500).send('Error loading authentication page');
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ error: 'Failed to logout' });
            }
            res.clearCookie('connect.sid');
            res.json({ success: true });
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Photo Gallery server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment check:`);
    console.log(`- NOTION_INTEGRATION_SECRET: ${process.env.NOTION_INTEGRATION_SECRET ? 'Set' : 'Not set'}`);
    console.log(`- NOTION_PAGE_URL: ${process.env.NOTION_PAGE_URL ? 'Set' : 'Not set'}`);
});
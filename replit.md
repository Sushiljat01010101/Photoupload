# Advanced Photo Gallery

## Overview

This is a client-side photo gallery application built with vanilla JavaScript, HTML, and CSS. The application provides advanced photo management features including drag-and-drop upload, image editing, gallery viewing with multiple layouts, photo categories, dark/light theme toggle, and Firebase integration for cloud storage and data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 14, 2025)

### Render Deployment Configuration
✓ **Deployment Files Created**: Added render.yaml, Dockerfile, and .dockerignore for Render deployment
✓ **Production Configuration**: Configured for Node.js production environment
✓ **Environment Variables**: Set up proper environment variable handling for production
✓ **Health Checks**: Added Docker health checks for application monitoring
✓ **Security**: Implemented non-root user in Docker container for security

## Previous Changes (August 06, 2025)

### Mobile Responsive Design & Header Enhancements
✓ **Enhanced Mobile Responsiveness**: Improved media queries for tablets and smartphones
✓ **Optimized Photo Grid**: Better grid layouts for different screen sizes (768px, 480px breakpoints)
✓ **Mobile Header**: Cleaner header design with hidden stats on mobile devices
✓ **Scrolling Header**: Header automatically hides when scrolling down and shows when scrolling up
✓ **Mobile Modals**: Optimized photo viewing modals for mobile screens
✓ **Touch-Friendly Buttons**: Improved button sizes and spacing for mobile interaction
✓ **Responsive Gallery Grid**: Adaptive grid that works well on all screen sizes
✓ **Mobile Toast Notifications**: Repositioned notifications to avoid header overlap
✓ **Logout Functionality**: Added proper logout endpoint and session management

## Previous Changes (August 05, 2025)

### Major Migration: Firebase to Notion Database Integration

✓ **Complete Firebase Removal**: Removed all Firebase dependencies and configurations
✓ **Notion Database Integration**: Full integration with Notion as the backend database
✓ **Server-Side Architecture**: Added Express.js server with Notion API proxy endpoints
✓ **Environment Variables Setup**: Proper handling of NOTION_INTEGRATION_SECRET and NOTION_PAGE_URL
✓ **Automatic Database Creation**: Server automatically creates Photos database in Notion with proper schema
✓ **Base64 Image Storage**: Images converted to base64 and stored directly in Notion database
✓ **API Endpoints**: RESTful API endpoints for CRUD operations (/api/photos)
✓ **CORS Resolution**: Server-side proxy eliminates browser CORS restrictions
✓ **Seamless Migration**: All existing features maintained with new backend

### Previous Features (July 18, 2025)
✓ Fixed image loading errors in the editor
✓ Added comprehensive photo category system with 20+ categories
✓ Implemented category selection during upload
✓ Added custom category input field for personalized categories
✓ Added category badges on photo cards
✓ Created interactive category summary cards
✓ Added dark/light theme toggle with persistence
✓ Improved UI with better gradients and modern styling
✓ Enhanced responsive design for mobile devices
✓ Fixed download functionality for photos
✓ Added category filtering in search and gallery
✓ Improved error handling and user feedback
✓ Added personalized categories: Memories, Friends, Selfies, Pets, Shopping, etc.
✓ Added theme color selector with 6 different color options
✓ Fixed photo name editing with proper database updates
✓ Implemented bulk photo download functionality - all selected photos download together
✓ Added "Select All" button with smart toggle (Select All/Deselect All)
✓ Improved bulk selection experience with progress feedback
✓ Removed problematic ZIP functionality in favor of reliable individual downloads
✓ Implemented scrolling header that hides on scroll down and shows on scroll up
✓ Removed theme selector functionality from header for cleaner design

## System Architecture

### Backend Architecture
- **Node.js + Express**: Server-side application with RESTful API endpoints
- **Notion Database**: Primary data storage using Notion's database API
- **Environment Variables**: Secure configuration management for API keys
- **CORS Proxy**: Server-side proxy for Notion API to bypass browser restrictions

### Frontend Architecture
- **Pure JavaScript (ES6+)**: Modular class-based architecture with separate concerns
- **HTML5**: Semantic markup with modern web standards
- **CSS3**: Modern styling with CSS custom properties and flexbox/grid layouts
- **Progressive Enhancement**: Core functionality works without JavaScript, enhanced with interactive features

### Component Structure
- **server.js**: Express server with Notion API integration and static file serving
- **App.js**: Main application controller and initialization
- **NotionClient.js**: Browser client for communicating with server API endpoints
- **UploadManager.js**: Handles file uploads with queue management and progress tracking
- **PhotoGallery.js**: Manages photo display, filtering, sorting, and selection
- **ImageProcessor.js**: Provides image editing capabilities with canvas manipulation
- **Utils.js**: Shared utility functions for common operations

## Key Components

### File Upload System
- **Drag & Drop Interface**: HTML5 drag-and-drop API implementation
- **Queue Management**: Concurrent upload handling with configurable limits
- **Progress Tracking**: Real-time upload progress with visual feedback
- **File Validation**: Client-side validation for file types and sizes
- **Preview Generation**: Thumbnail creation before upload

### Image Processing
- **Canvas-based Editing**: HTML5 Canvas for image manipulation
- **Filter System**: Apply various filters and effects
- **History Management**: Undo/redo functionality for editing actions
- **Resize & Crop**: Image dimension adjustments
- **Compression**: Client-side image optimization

### Gallery Display
- **Multiple View Modes**: Grid, list, and masonry layouts
- **Lazy Loading**: Intersection Observer API for performance optimization
- **Search & Filter**: Real-time photo filtering and searching
- **Sorting Options**: Multiple sorting criteria (date, name, size)
- **Bulk Operations**: Multi-select for batch operations

### User Interface
- **Responsive Design**: Mobile-first approach with breakpoints
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Keyboard Shortcuts**: Power user features for navigation
- **Toast Notifications**: User feedback for actions and errors

## Data Flow

1. **File Selection**: Users drag files or use file picker
2. **Validation**: Client-side validation of file types and sizes
3. **Preview Generation**: Create thumbnails and metadata extraction
4. **Queue Management**: Files added to upload queue with status tracking
5. **Base64 Conversion**: Images converted to base64 format for database storage
6. **Server API Upload**: Files sent to Express server via RESTful API
7. **Notion Storage**: Photo data and base64 images saved to Notion database
8. **Gallery Update**: UI refreshed with new photos from Notion
9. **Lazy Loading**: Images loaded on demand as user scrolls

## External Dependencies

### Notion Services
- **Notion API**: Primary database and storage service
- **Notion Client**: Server-side SDK for Notion integration
- **Notion Database**: Structured database for photo metadata and image data

### Third-party Assets
- **Font Awesome**: Icon library for UI elements
- **Google Fonts (Inter)**: Typography for modern, readable text
- **CDN Delivery**: External assets loaded via CDN for performance

### Browser APIs
- **File API**: For file handling and reading
- **Canvas API**: For image processing and manipulation
- **Drag & Drop API**: For intuitive file uploads
- **Intersection Observer API**: For lazy loading optimization

## Deployment Strategy

### Render Deployment (Current)
- **Node.js Server**: Express.js application with Notion API integration
- **Docker Container**: Containerized deployment for consistent environments
- **Environment Variables**: Secure handling of API keys and secrets
- **Health Monitoring**: Built-in health checks for application monitoring
- **Production Ready**: Optimized for production with non-root user security

### Deployment Files
- **render.yaml**: Render service configuration with build and start commands
- **Dockerfile**: Multi-stage Docker build with security optimizations
- **dockerignore**: Excludes unnecessary files from Docker build context

### Required Environment Variables
- **NOTION_INTEGRATION_SECRET**: Notion API integration token
- **NOTION_PAGE_URL**: Target Notion page URL for database creation
- **SESSION_SECRET**: Secure session management key (auto-generated on Render)
- **PORT**: Application port (auto-assigned by Render)

### Performance Optimizations
- **Lazy Loading**: Reduces initial page load time
- **Image Compression**: Client-side optimization before upload
- **Session Management**: Secure user sessions with configurable timeouts
- **API Caching**: Server-side optimization for database queries

## Key Architectural Decisions

### Frontend-Only Architecture
- **Rationale**: Simplifies deployment and reduces infrastructure costs
- **Benefits**: Easy to host, no server maintenance, scales with CDN
- **Trade-offs**: Limited server-side processing, security considerations for API keys

### Firebase Integration
- **Rationale**: Provides backend services without server management
- **Benefits**: Real-time sync, automatic scaling, integrated authentication
- **Trade-offs**: Vendor lock-in, client-side security considerations

### Modular JavaScript Architecture
- **Rationale**: Maintainable code with clear separation of concerns
- **Benefits**: Easy to test, extend, and debug individual components
- **Trade-offs**: Slightly larger codebase, requires module coordination

### Canvas-based Image Processing
- **Rationale**: Provides powerful image editing without external dependencies
- **Benefits**: Fast client-side processing, no server load
- **Trade-offs**: Limited by browser capabilities, memory constraints for large images
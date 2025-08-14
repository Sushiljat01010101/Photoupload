# 📸 Notion-Powered Photo Gallery

A modern, secure photo management application built with Node.js, Express, and Notion database integration. Features user authentication, drag-and-drop uploads, image processing, and AI-powered memory storytelling.

## ✨ Features

- **User Authentication** - Secure registration and login system with bcrypt encryption
- **Photo Upload & Management** - Drag-and-drop upload with progress tracking
- **Notion Database Integration** - All data stored securely in Notion databases  
- **Image Processing** - Built-in image editing and optimization
- **Category Management** - 20+ predefined categories with custom options
- **Memory Timeline** - Chronological photo organization with AI storytelling
- **Mobile Responsive** - Optimized for all device sizes
- **Bulk Operations** - Multi-select, bulk download, and batch management
- **Dark/Light Theme** - User preference with persistence

## 🚀 Quick Deploy to Render

This application is pre-configured for one-click deployment to Render:

### Prerequisites
- Render account ([signup here](https://render.com))
- GitHub repository with this code
- Notion integration setup

### Environment Variables Needed
```env
NOTION_INTEGRATION_SECRET=your_notion_integration_token
NOTION_PAGE_URL=https://notion.so/your-page-id
NODE_ENV=production
SESSION_SECRET=auto-generated-by-render
```

### Deploy Steps
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard
4. Deploy automatically with included `render.yaml` configuration

📖 **Detailed deployment guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🛠️ Local Development

### Installation
```bash
git clone <your-repo>
cd photo-gallery
npm install
```

### Environment Setup
Create `.env` file:
```env
NOTION_INTEGRATION_SECRET=your_token
NOTION_PAGE_URL=your_page_url
SESSION_SECRET=your_session_secret
PORT=5000
```

### Run Locally
```bash
npm start
# or
node server.js
```

Visit `http://localhost:5000`

## 🏗️ Architecture

### Backend
- **Node.js + Express** - RESTful API server
- **Notion API** - Database and authentication
- **Session Management** - Secure user sessions
- **Image Storage** - Base64 encoding in Notion

### Frontend  
- **Vanilla JavaScript** - Modern ES6+ classes
- **Progressive Enhancement** - Works without JavaScript
- **Mobile-First Design** - Responsive CSS Grid/Flexbox
- **Canvas Processing** - Client-side image editing

### File Structure
```
├── server.js              # Express server and API endpoints
├── index.html             # Main application interface
├── auth.html              # Authentication page
├── js/                    # Frontend JavaScript modules
├── styles/                # CSS stylesheets
├── render.yaml            # Render deployment config
├── Dockerfile             # Container configuration
└── DEPLOYMENT.md          # Deployment instructions
```

## 🔒 Security Features

- **Password Encryption** - bcrypt hashing with salt rounds
- **Session Security** - Secure cookie configuration
- **Environment Variables** - No hardcoded secrets
- **Input Validation** - Server-side request validation
- **CORS Protection** - Configured for production domains
- **Non-root Container** - Docker security best practices

## 📱 Supported Features

### Photo Management
- Drag & drop upload with preview
- Bulk photo selection and operations
- Real-time upload progress tracking
- Automatic thumbnail generation
- Photo categorization and tagging

### User Experience
- Responsive design for all devices
- Keyboard shortcuts for power users
- Toast notifications for user feedback
- Dark/light theme toggle
- Scrolling header behavior

### Advanced Features
- AI-powered memory storytelling (requires OpenAI API)
- Image editing with filters and effects
- Advanced search and filtering
- Category-based organization
- Timeline view for memories

## 🌐 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📊 Performance

- **Lazy Loading** - Images load on demand
- **Client-side Caching** - Reduces server requests
- **Optimized Images** - Automatic compression
- **CDN Ready** - Static assets optimized for CDN

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For deployment issues, check [DEPLOYMENT.md](./DEPLOYMENT.md) or create an issue in this repository.

---

Built with ❤️ using Node.js, Express, and Notion API
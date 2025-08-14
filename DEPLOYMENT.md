# Photo Gallery Deployment Guide - Render

## Overview
This guide will help you deploy your Notion-powered Photo Gallery application to Render, a modern cloud platform that provides easy deployment for Node.js applications.

## Prerequisites

### Required Accounts and Services
1. **Render Account** - Sign up at [render.com](https://render.com)
2. **GitHub Account** - For code repository hosting
3. **Notion Account** - With integration setup

### Required Environment Variables
You'll need these values from your current setup:
- `NOTION_INTEGRATION_SECRET` - Your Notion integration token
- `NOTION_PAGE_URL` - URL of your Notion page where databases are created

## Step-by-Step Deployment Process

### Step 1: Prepare Your Repository
1. **Push to GitHub**
   - Create a new GitHub repository
   - Push your code including the new deployment files:
     - `render.yaml`
     - `Dockerfile`
     - `.dockerignore`

### Step 2: Connect to Render
1. **Login to Render**
   - Go to [render.com](https://render.com) and sign in
   - Click "New +" button in the top right

2. **Create Web Service**
   - Select "Web Service"
   - Choose "Build and deploy from a Git repository"
   - Connect your GitHub account if not already connected
   - Select your photo gallery repository

### Step 3: Configure Service Settings
1. **Basic Settings**
   - Name: `photo-gallery-app` (or your preferred name)
   - Environment: `Node`
   - Branch: `main` (or your default branch)
   - Root Directory: Leave empty (unless your code is in a subdirectory)

2. **Build & Deploy Settings**
   - Build Command: `npm install`
   - Start Command: `node server.js`

### Step 4: Set Environment Variables
In the Render dashboard, add these environment variables:

1. **NOTION_INTEGRATION_SECRET**
   - Value: Your Notion integration token
   - Keep this secure and don't share it

2. **NOTION_PAGE_URL**
   - Value: The URL of your Notion page
   - Example: `https://notion.so/your-page-id`

3. **NODE_ENV**
   - Value: `production`

4. **SESSION_SECRET**
   - Render will auto-generate this for security
   - Or provide your own secure random string

### Step 5: Deploy
1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Start your application (`node server.js`)
   - Assign a public URL

### Step 6: Verify Deployment
1. **Check Build Logs**
   - Monitor the deployment process in Render's dashboard
   - Look for successful build and start messages

2. **Test Application**
   - Open the provided Render URL
   - Test user registration and login
   - Upload a test photo to verify Notion integration
   - Verify all features work correctly

## Post-Deployment Configuration

### Custom Domain (Optional)
1. In Render dashboard, go to Settings > Custom Domains
2. Add your domain name
3. Configure DNS settings as instructed by Render

### SSL Certificate
- Render automatically provides SSL certificates
- Your app will be accessible via HTTPS

### Monitoring
- Use Render's built-in monitoring
- Check logs in the dashboard for any issues
- Set up health checks (already configured in your Dockerfile)

## Troubleshooting

### Common Issues and Solutions

1. **Build Failures**
   - Check that `package.json` includes all dependencies
   - Ensure Node.js version compatibility

2. **Notion Connection Issues**
   - Verify `NOTION_INTEGRATION_SECRET` is correct
   - Check that `NOTION_PAGE_URL` is accessible
   - Ensure Notion integration has proper permissions

3. **Port Issues**
   - Application automatically uses the PORT environment variable provided by Render
   - No manual port configuration needed

4. **Session Issues**
   - Ensure `SESSION_SECRET` is set
   - Check that sessions work with your production domain

### Environment Variable Troubleshooting
```bash
# Check environment variables in Render console
echo $NOTION_INTEGRATION_SECRET
echo $NOTION_PAGE_URL
echo $SESSION_SECRET
echo $NODE_ENV
```

## Security Considerations

### Environment Variables Security
- Never commit secrets to your repository
- Use Render's environment variable feature for sensitive data
- Rotate secrets periodically

### Application Security
- HTTPS is automatically enabled by Render
- Sessions use secure cookies in production
- Non-root user runs the application (configured in Dockerfile)

## Performance Optimization

### Caching
- Render provides CDN caching for static assets
- Application-level caching can be implemented for database queries

### Monitoring
- Monitor application performance via Render dashboard
- Set up log retention and alerts
- Monitor Notion API usage limits

## Scaling

### Automatic Scaling
- Render can automatically scale your application based on demand
- Configure scaling settings in the Render dashboard

### Database Considerations
- Notion API has rate limits
- Consider implementing request queuing for high-traffic scenarios
- Monitor Notion workspace limits

## Backup and Recovery

### Code Backup
- GitHub repository serves as primary backup
- Render maintains deployment history

### Data Backup
- Notion data is backed up by Notion
- Consider exporting critical data periodically
- Implement data export functionality if needed

## Support and Maintenance

### Render Support
- Check Render's documentation and status page
- Use Render's community forum for issues
- Contact Render support for platform-specific problems

### Application Maintenance
- Monitor application logs regularly
- Update dependencies periodically
- Test deployment pipeline with staging environment

## Cost Estimation

### Render Pricing (Approximate)
- Free tier available for testing
- Paid plans start around $7/month for production apps
- Check [Render pricing](https://render.com/pricing) for current rates

### Notion API Costs
- Free tier includes generous API limits
- Monitor usage to avoid unexpected charges

---

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Repository connected to Render
- [ ] Environment variables configured
- [ ] Build and start commands set
- [ ] Deployment initiated
- [ ] Application tested and verified
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up

Your Photo Gallery application should now be live and accessible to users worldwide through Render's global CDN!
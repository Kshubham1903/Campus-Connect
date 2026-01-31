# Campus Connect - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (for production database)
- Domain names for frontend and backend (optional but recommended)

## Backend Deployment

### 1. Environment Setup

Copy `.env.example` to `.env` and update the values:

```bash
cd backend
cp .env.example .env
```

Update the following in `.env`:
- `MONGO_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Generate a strong secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `FRONTEND_URL` - Your frontend domain (e.g., https://campus-connect.vercel.app)
- `NODE_ENV=production`

### 2. Install Dependencies

```bash
npm install
```

### 3. Deploy to Platform

#### Option A: Render / Railway / Heroku
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables from `.env`

#### Option B: VPS (DigitalOcean, AWS EC2, etc.)
1. SSH into your server
2. Clone repository
3. Install dependencies: `npm install`
4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name campus-connect-backend
   pm2 startup
   pm2 save
   ```
5. Set up Nginx as reverse proxy
6. Configure SSL with Let's Encrypt

## Frontend Deployment

### 1. Environment Setup

Update `.env.production`:
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### 2. Build

```bash
cd frontend
npm install
npm run build
```

### 3. Deploy to Platform

#### Option A: Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

#### Option B: Netlify
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variable: `VITE_API_URL`

#### Option C: Static Hosting (AWS S3, Cloudflare Pages)
Upload the `dist` folder to your hosting service.

## Database Setup (MongoDB Atlas)

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user
3. Whitelist your backend server IP (or 0.0.0.0/0 for any IP)
4. Get connection string and add to backend `.env`

## File Upload Considerations

**Current setup**: Files are stored locally in `uploads/` directory.

**For production**, consider using cloud storage:

### Option A: Cloudinary (Recommended for images)
```bash
npm install cloudinary
```

### Option B: AWS S3
```bash
npm install aws-sdk
```

### Option C: Azure Blob Storage
```bash
npm install @azure/storage-blob
```

## Security Checklist

- ✅ CORS configured with allowed origins
- ⚠️ Install helmet for security headers: `npm install helmet`
- ⚠️ Install rate limiting: `npm install express-rate-limit`
- ✅ Environment variables not in git
- ⚠️ Enable HTTPS (SSL/TLS)
- ⚠️ Use strong JWT_SECRET
- ⚠️ Configure MongoDB Atlas IP whitelist
- ⚠️ Add request validation
- ⚠️ Sanitize user inputs

## Recommended Enhancements

Add to `backend/server.js`:

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

## Monitoring

- Set up error tracking (Sentry, LogRocket)
- Configure logging (Winston, Morgan)
- Monitor uptime (UptimeRobot, Pingdom)
- Set up analytics

## Post-Deployment Testing

1. Test user registration and login
2. Test file uploads
3. Test chat functionality
4. Test real-time notifications
5. Verify CORS is working
6. Check MongoDB connections
7. Test on mobile devices

## Troubleshooting

**CORS errors**: Verify `FRONTEND_URL` in backend `.env` matches your frontend domain

**Database connection fails**: Check MongoDB Atlas IP whitelist and connection string

**File uploads fail**: Verify uploads directory exists or migrate to cloud storage

**WebSocket issues**: Ensure your hosting supports WebSocket connections

## Useful Commands

```bash
# Backend
npm start          # Start production server
npm run dev        # Start development server

# Frontend
npm run build      # Create production build
npm run preview    # Preview production build locally
```

## Support

For issues, check:
1. Application logs
2. Browser console (F12)
3. Network tab for API errors
4. MongoDB Atlas logs

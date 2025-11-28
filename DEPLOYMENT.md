# Deployment Guide for AlumniHive on Render

This guide will help you deploy both the backend and frontend of AlumniHive on Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. A MongoDB database (MongoDB Atlas recommended for production)
3. Your Razorpay credentials (if using payment features)

## Backend Deployment on Render

### Step 1: Prepare Your Backend

1. The backend is already configured to work with Render using `server/server.js`
2. Make sure your `server/package.json` has the correct start script (already updated)

### Step 2: Deploy Backend to Render

1. Go to your Render dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `alumnihive-backend` (or your preferred name)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or upgrade for production)

### Step 3: Set Environment Variables

In the Render dashboard, go to your service → Environment and add:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
FRONTEND_URL=https://your-frontend-name.onrender.com
RAZORPAY_KEY_ID=your_razorpay_key_id (optional)
RAZORPAY_KEY_SECRET=your_razorpay_key_secret (optional)
```

**Important Notes:**
- `MONGODB_URI`: Get this from MongoDB Atlas (format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`)
- `FRONTEND_URL`: This will be your frontend URL after deployment (update this after frontend is deployed)
- `PORT`: Render automatically sets this, but 10000 is a safe default

### Step 4: Deploy

Click "Create Web Service" and wait for deployment to complete.

**Your backend URL will be**: `https://your-backend-name.onrender.com`

Test it by visiting: `https://your-backend-name.onrender.com/api/ping`

## Frontend Deployment on Render

### Step 1: Update Frontend Configuration

1. Create a `.env.production` file in the root directory:
```
VITE_API_URL=https://your-backend-name.onrender.com
```

2. Or set it in Render's environment variables:
```
VITE_API_URL=https://your-backend-name.onrender.com
```

### Step 2: Deploy Frontend to Render

1. Go to your Render dashboard
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `alumnihive-frontend` (or your preferred name)
   - **Root Directory**: (leave empty, or set to root)
   - **Build Command**: `npm install && npm run build:client`
   - **Publish Directory**: `dist/spa`
   - **Environment**: Add `VITE_API_URL=https://your-backend-name.onrender.com`

### Step 3: Update Backend CORS

After frontend is deployed, update the backend's `FRONTEND_URL` environment variable to include your frontend URL:
```
FRONTEND_URL=https://your-frontend-name.onrender.com
```

## Alternative: Using render.yaml

You can also use the `render.yaml` file for infrastructure as code:

1. Push `render.yaml` to your repository
2. In Render dashboard, go to "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically create services based on `render.yaml`

## Troubleshooting

### Backend Issues

1. **API calls failing**: 
   - Check that `FRONTEND_URL` in backend matches your frontend URL
   - Verify CORS is configured correctly
   - Check backend logs in Render dashboard

2. **Database connection errors**:
   - Verify `MONGODB_URI` is correct
   - Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Render)
   - Ensure database user has proper permissions

3. **Port errors**:
   - Render automatically sets `PORT`, but ensure your code uses `process.env.PORT`

### Frontend Issues

1. **API calls going to localhost**:
   - Verify `VITE_API_URL` is set correctly
   - Rebuild the frontend after changing environment variables
   - Check browser console for errors

2. **CORS errors**:
   - Ensure backend `FRONTEND_URL` includes your frontend URL
   - Check that CORS middleware is properly configured

## Updating API Calls in Frontend

Many files in the frontend use relative URLs like `/api/...`. For production, these need to use the full API URL. 

The `client/config/api.ts` file provides an `apiUrl()` helper function. To update files:

1. Import the helper:
```typescript
import { apiUrl } from '@/config/api';
```

2. Replace fetch calls:
```typescript
// Before
fetch('/api/endpoint')

// After
fetch(apiUrl('/endpoint'))
```

**Files that need updating** (if not already using API_ENDPOINTS):
- `client/pages/JobPostingsPage.tsx`
- `client/pages/MentorshipPage.tsx`
- `client/components/EmbeddedChat.tsx`
- `client/components/BatchChat.tsx`
- And many others...

## Quick Fix: Update All Fetch Calls

For a quick solution, you can create a global fetch wrapper. Add this to `client/utils/api.ts`:

```typescript
// Global fetch wrapper
const originalFetch = window.fetch;
window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    input = apiUrl(input);
  }
  return originalFetch(input, init);
};
```

Then import this in your main entry point (e.g., `client/App.tsx` or `index.html`).

## Testing

1. **Backend**: Visit `https://your-backend.onrender.com/api/ping`
2. **Frontend**: Visit `https://your-frontend.onrender.com`
3. **Check browser console** for any API errors
4. **Test authentication** and other features

## Production Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] MongoDB connection working
- [ ] API calls working from frontend
- [ ] Authentication working
- [ ] File uploads working (if applicable)
- [ ] Payment integration working (if applicable)

## Support

If you encounter issues:
1. Check Render logs (Dashboard → Your Service → Logs)
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure MongoDB is accessible from Render's IPs


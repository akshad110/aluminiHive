# Render Setup Guide - Separate Frontend and Backend

## ⚠️ IMPORTANT: You Need TWO Separate Services

You cannot use the same URL for both frontend and backend. You need:

1. **Backend Service** (Web Service) → `https://alumnihive-backend.onrender.com`
2. **Frontend Service** (Static Site) → `https://alumnihive-frontend.onrender.com` (or `https://alumnihive.onrender.com`)

---

## Step 1: Create Backend Service (Web Service)

1. Go to Render Dashboard → **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `alumnihive-backend` (this creates URL: `alumnihive-backend.onrender.com`)
   - **Root Directory**: (leave empty)
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free (or upgrade for production)

4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_atlas_connection_string
   FRONTEND_URL=https://alumnihive-frontend.onrender.com
   ```
   (Use your actual frontend URL - see Step 2)

5. **Deploy** and wait for it to be live
6. **Copy the backend URL**: `https://alumnihive-backend.onrender.com`

---

## Step 2: Create Frontend Service (Static Site)

1. Go to Render Dashboard → **New +** → **Static Site**
2. Connect your GitHub repository (same repo)
3. Configure:
   - **Name**: `alumnihive-frontend` (this creates URL: `alumnihive-frontend.onrender.com`)
   - **Root Directory**: (leave empty)
   - **Build Command**: `pnpm install && pnpm run build:client`
   - **Publish Directory**: `dist/spa`
   - **Plan**: Free (or upgrade for production)

4. **Set Environment Variables**:
   ```
   VITE_API_URL=https://alumnihive-backend.onrender.com
   ```
   (Use the backend URL from Step 1)

5. **Deploy** and wait for it to be live
6. **Copy the frontend URL**: `https://alumnihive-frontend.onrender.com`

---

## Step 3: Update Backend CORS

1. Go back to your **Backend Service** → **Environment**
2. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://alumnihive-frontend.onrender.com
   ```
3. Save (Render will auto-redeploy)

---

## Step 4: Update Frontend API URL (if needed)

1. Go to your **Frontend Static Site** → **Environment**
2. Verify `VITE_API_URL`:
   ```
   VITE_API_URL=https://alumnihive-backend.onrender.com
   ```
3. If you changed it, save (Render will auto-redeploy)

---

## Final Configuration

### Backend Service (`alumnihive-backend.onrender.com`)
```
Environment Variables:
- NODE_ENV=production
- MONGODB_URI=your_mongodb_uri
- FRONTEND_URL=https://alumnihive-frontend.onrender.com
```

### Frontend Service (`alumnihive-frontend.onrender.com`)
```
Environment Variables:
- VITE_API_URL=https://alumnihive-backend.onrender.com
```

---

## URL Structure

- **Backend API**: `https://alumnihive-backend.onrender.com/api/...`
- **Frontend App**: `https://alumnihive-frontend.onrender.com`
- **Frontend calls**: `https://alumnihive-frontend.onrender.com` → API calls go to → `https://alumnihive-backend.onrender.com/api/...`

---

## If You Want Custom Domain

If you want `alumnihive.onrender.com` for the frontend:

1. You can rename the frontend service to `alumnihive`
2. Or use a custom domain
3. But backend must still be separate: `alumnihive-backend.onrender.com`

---

## Quick Checklist

- [ ] Backend service created (Web Service)
- [ ] Backend URL copied: `https://alumnihive-backend.onrender.com`
- [ ] Frontend service created (Static Site)
- [ ] Frontend URL copied: `https://alumnihive-frontend.onrender.com`
- [ ] Backend `FRONTEND_URL` set to frontend URL
- [ ] Frontend `VITE_API_URL` set to backend URL
- [ ] Both services deployed and running
- [ ] Test: Frontend can call backend API

---

## Troubleshooting

**"Same URL for both" Error:**
- You cannot use the same service for both
- Create TWO separate services
- Backend = Web Service
- Frontend = Static Site

**404 on API calls:**
- Check `VITE_API_URL` points to backend URL
- Check backend is running
- Check backend URL is correct (no typos)

**CORS errors:**
- Check `FRONTEND_URL` in backend matches frontend URL exactly
- No trailing slashes
- Check both URLs are correct


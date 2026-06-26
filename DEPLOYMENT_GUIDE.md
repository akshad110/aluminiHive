# Deployment Guide for AlumniHive

## Recommended Deployment Order

### Step 1: Deploy Backend First ✅

**Why?**
- Backend needs to know the frontend URL for CORS, but you can set a placeholder initially
- You'll get the backend URL immediately after deployment
- Frontend needs the backend URL to work properly

**Steps:**
1. Push your code to GitHub (if using Git)
2. In Render Dashboard:
   - Create a new **Web Service**
   - Connect your repository
   - Use the `render.yaml` configuration OR manually set:
     - **Build Command**: `cd server && npm install`
     - **Start Command**: `cd server && npm start`
   - Set Environment Variables:
     ```
     NODE_ENV=production
     MONGODB_URI=your_mongodb_atlas_connection_string
     FRONTEND_URL=https://alumnihive-frontend.onrender.com
     ```
     **Note:** Use the URL you plan to use for your frontend. If it's different, you can update it later.
3. Deploy and wait for it to be live
4. **Copy the backend URL** (e.g., `https://alumnihive-backend.onrender.com`)

### Step 2: Update Backend CORS (if needed)

1. Go back to Render Dashboard → Your Backend Service → Environment
2. If your frontend URL is different from what you set, update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-actual-frontend-url.onrender.com
   ```
3. Save changes (Render will automatically redeploy)

### Step 3: Deploy Frontend

**Option A: Static Site (Recommended for Frontend)**

1. **IMPORTANT: Update lockfile first!**
   - Run `pnpm install` locally to update `pnpm-lock.yaml`
   - Commit and push the updated `pnpm-lock.yaml` to GitHub
   - OR use npm instead (see Option C below)

2. **IMPORTANT: SPA Routing Fix!**
   - A build script automatically copies `index.html` to `404.html` after build
   - This ensures routes like `/auth` work correctly on Render
   - The script `scripts/copy-404.js` handles this automatically

3. In Render Dashboard:
   - Create a new **Static Site**
   - Connect your repository
   - Build settings:
     - **Build Command**: `pnpm install && pnpm run build:client`
     - **Publish Directory**: `dist/spa`
   - Set Environment Variables:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com
     ```
4. Deploy

**Option B: Web Service (If you need SSR or custom server)**

1. Create a new **Web Service**
2. Build Command: `pnpm install && pnpm run build:client`
3. Start Command: `npx serve -s dist/spa -l 10000`
4. Set `VITE_API_URL` environment variable

**Option C: Use npm instead of pnpm (Alternative)**

If you prefer npm or have lockfile issues:
1. In Render Dashboard → Static Site settings:
   - **Build Command**: `npm install && npm run build:client`
   - **Publish Directory**: `dist/spa`
2. This avoids pnpm lockfile issues

### Step 4: Final Configuration

1. **Backend**: Update `FRONTEND_URL` with the actual frontend URL
2. **Frontend**: Ensure `VITE_API_URL` points to your backend URL
3. Test the connection!

## Environment Variables Summary

### Backend (Web Service)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aluminihive
FRONTEND_URL=https://your-frontend.onrender.com
RAZORPAY_KEY_ID=your_key (optional)
RAZORPAY_KEY_SECRET=your_secret (optional)
```

### Frontend (Static Site)
```
VITE_API_URL=https://your-backend.onrender.com
```

## Quick Checklist

- [ ] Backend deployed and running
- [ ] Backend URL copied
- [ ] Frontend deployed with `VITE_API_URL` set
- [ ] Frontend URL copied
- [ ] Backend `FRONTEND_URL` updated with frontend URL
- [ ] Test API connection from frontend
- [ ] Test CORS (should work automatically)

## Troubleshooting

**CORS Errors?**
- Check `FRONTEND_URL` in backend matches your frontend URL exactly
- Ensure no trailing slashes
- Check browser console for exact error

**API Not Connecting?**
- Verify `VITE_API_URL` in frontend matches backend URL
- Check backend logs in Render dashboard
- Test backend directly: `https://your-backend.onrender.com/api/ping`

**Build Fails?**
- Check Node version (Render uses Node 18+ by default)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors


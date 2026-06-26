# Quick Fix - CORS Error on Render

## ✅ Good News!

Your backend is running and CORS is configured. The issue is that `NODE_ENV` is set to `development` instead of `production`.

## 🔧 Quick Fix (2 Steps)

### Step 1: Set NODE_ENV to Production

1. Go to **Render Dashboard** → **Backend Service** (`alumnihive-backend`)
2. Click **Environment** tab
3. Find `NODE_ENV`
4. Change it to:
   ```
   NODE_ENV=production
   ```
5. **Save Changes**
6. Wait for redeploy (~1-2 minutes)

### Step 2: Verify FRONTEND_URL is Set

While you're in the Environment tab, also check:

- **FRONTEND_URL** should be: `https://aluminihive-frontend.onrender.com`
- **MONGODB_URI** should be your MongoDB Atlas connection string

## 📊 What You Should See After Fix

After setting `NODE_ENV=production`, the logs should show:

```
🌐 CORS Configuration:
   Allowed origins: [ 'https://aluminihive-frontend.onrender.com' ]
   NODE_ENV: production
✅ CORS: Allowing origin: https://aluminihive-frontend.onrender.com
```

Instead of:
```
NODE_ENV: development
✅ CORS: Allowing request with no origin
```

## ✅ Complete Environment Variables Checklist

**Backend Service (`alumnihive-backend`):**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aluminihive?retryWrites=true&w=majority
FRONTEND_URL=https://aluminihive-frontend.onrender.com
```

**Frontend Service (`aluminihive-frontend`):**
```
VITE_API_URL=https://alumnihive-backend.onrender.com
```

## 🚀 After Fixing

1. Backend will use production CORS rules
2. CORS will properly validate the frontend origin
3. Signup/login will work
4. All API calls will succeed

**Just set `NODE_ENV=production` in Render and you're done!** 🎉


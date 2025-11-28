# Fix CORS Error on Render

## ❌ Error You're Seeing

```
Access to fetch at 'https://alumnihive-backend.onrender.com/api/auth/simple-signup' 
from origin 'https://aluminihive-frontend.onrender.com' 
has been blocked by CORS policy
```

## 🔍 Problem

The backend is not allowing requests from the frontend origin. This happens when:
1. `FRONTEND_URL` is not set correctly in backend
2. `FRONTEND_URL` doesn't match the frontend URL exactly
3. CORS configuration is too strict

## ✅ Solution

### Step 1: Check Your URLs

**Backend URL:** `https://alumnihive-backend.onrender.com`  
**Frontend URL:** `https://aluminihive-frontend.onrender.com`

### Step 2: Set FRONTEND_URL in Backend

1. Go to **Render Dashboard** → **Backend Service** (`alumnihive-backend`)
2. Click **Environment** tab
3. Find or add `FRONTEND_URL`
4. Set the value to your **exact frontend URL**:
   ```
   FRONTEND_URL=https://aluminihive-frontend.onrender.com
   ```
   **Important:**
   - No trailing slash
   - Must match exactly (including `https://`)
   - If you have multiple frontends, use comma-separated: `https://frontend1.onrender.com,https://frontend2.onrender.com`

5. Click **Save Changes**
6. Render will auto-redeploy

### Step 3: Verify CORS is Working

After redeploy, check backend logs. You should see:
```
🌐 CORS Configuration:
   Allowed origins: https://aluminihive-frontend.onrender.com
✅ CORS: Allowing origin: https://aluminihive-frontend.onrender.com
```

If you see:
```
⚠️ CORS blocked origin: https://aluminihive-frontend.onrender.com
```
Then `FRONTEND_URL` doesn't match exactly.

### Step 4: Test the API

1. Open browser console on your frontend
2. Try signup again
3. Check network tab - the request should succeed
4. Check backend logs for CORS messages

---

## 🔧 What I Fixed in the Code

1. **Better CORS logging** - Shows which origins are allowed and which are blocked
2. **Flexible origin matching** - Matches with or without protocol
3. **Better error messages** - Shows exactly what's wrong
4. **Preflight handling** - Properly handles OPTIONS requests

---

## 📝 Quick Checklist

- [ ] Backend `FRONTEND_URL` is set to: `https://aluminihive-frontend.onrender.com`
- [ ] No trailing slash in `FRONTEND_URL`
- [ ] Backend service redeployed after setting `FRONTEND_URL`
- [ ] Backend logs show CORS allowing the frontend origin
- [ ] Test signup/login - should work now!

---

## 🚨 Common Mistakes

1. **Trailing slash:** `https://aluminihive-frontend.onrender.com/` ❌
   - Should be: `https://aluminihive-frontend.onrender.com` ✅

2. **Wrong URL:** Using backend URL instead of frontend URL ❌
   - `FRONTEND_URL` should be your **frontend** URL, not backend

3. **HTTP vs HTTPS:** `http://aluminihive-frontend.onrender.com` ❌
   - Should be: `https://aluminihive-frontend.onrender.com` ✅

4. **Not redeploying:** Setting env var but not waiting for redeploy
   - Render auto-redeploys, but wait for it to finish

---

## ✅ After Fixing

Once `FRONTEND_URL` is set correctly:
- CORS errors will disappear
- API calls will work
- Signup/login will succeed
- You'll see success messages in backend logs

The code has been updated with better CORS handling and logging. Just set `FRONTEND_URL` correctly in Render! 🚀


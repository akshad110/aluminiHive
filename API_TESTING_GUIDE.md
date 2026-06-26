# API Testing Guide for AlumniHive Backend

Use these endpoints to test your deployed backend on Render.

## 🔍 Health Check Endpoints

### 1. Basic Ping (Health Check)
**GET** `https://your-backend-url.onrender.com/api/ping`

**Expected Response:**
```json
{
  "message": "API is working!",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Test in Browser:**
Just open the URL in your browser - should return JSON

**Test with curl:**
```bash
curl https://your-backend-url.onrender.com/api/ping
```

---

### 2. Database Health Check
**GET** `https://your-backend-url.onrender.com/api/health/db`

**Expected Response:**
```json
{
  "connected": true,
  "connectionState": 1,
  "database": "aluminihive",
  "host": "cluster0-shard-00-00.umkcw.mongodb.net",
  "collections": ["users", "alumni", "students", "jobpostings", ...],
  "collectionCounts": {
    "users": 10,
    "messages": 5,
    "mentorshipRequests": 3
  },
  "modelCounts": {
    "users": 10,
    "messages": 5,
    "mentorshipRequests": 3
  }
}
```

**Test in Browser:**
Open the URL directly

**Test with curl:**
```bash
curl https://your-backend-url.onrender.com/api/health/db
```

---

## 📋 Public API Endpoints (No Auth Required)

### 3. Get All Skills
**GET** `https://your-backend-url.onrender.com/api/skills`

**Expected Response:**
```json
{
  "skills": ["JavaScript", "Python", "React", ...]
}
```

**Test:**
```bash
curl https://your-backend-url.onrender.com/api/skills
```

---

### 4. Get All Branches
**GET** `https://your-backend-url.onrender.com/api/branches`

**Expected Response:**
```json
{
  "branches": ["Computer Science", "Electrical Engineering", ...]
}
```

**Test:**
```bash
curl https://your-backend-url.onrender.com/api/branches
```

---

### 5. Get All Degrees
**GET** `https://your-backend-url.onrender.com/api/degrees`

**Expected Response:**
```json
{
  "degrees": ["Bachelor's", "Master's", "PhD", ...]
}
```

**Test:**
```bash
curl https://your-backend-url.onrender.com/api/degrees
```

---

### 6. Search Colleges
**GET** `https://your-backend-url.onrender.com/api/colleges/search?query=MIT`

**Expected Response:**
```json
["MIT", "MIT College", ...]
```

**Test:**
```bash
curl "https://your-backend-url.onrender.com/api/colleges/search?query=MIT"
```

---

## 🔐 Authentication Endpoints (Test with Postman/Thunder Client)

### 7. Simple Signup
**POST** `https://your-backend-url.onrender.com/api/auth/simple-signup`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "test123456",
  "batch": "2023",
  "college": "Test College",
  "role": "student"
}
```

**Expected Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "_id": "...",
    "email": "test@example.com",
    "role": "student"
  }
}
```

**Test with curl:**
```bash
curl -X POST https://your-backend-url.onrender.com/api/auth/simple-signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123456",
    "batch": "2023",
    "college": "Test College",
    "role": "student"
  }'
```

---

### 8. Login
**POST** `https://your-backend-url.onrender.com/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "test@example.com",
  "password": "test123456"
}
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "...",
    "email": "test@example.com",
    "role": "student"
  }
}
```

**Test with curl:**
```bash
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

---

## 📊 Quick Test Checklist

After deploying your backend, test these in order:

- [ ] **1. Ping Test** - `GET /api/ping` (Should return success)
- [ ] **2. Database Health** - `GET /api/health/db` (Should show connected: true)
- [ ] **3. Skills Endpoint** - `GET /api/skills` (Should return skills array)
- [ ] **4. Signup Test** - `POST /api/auth/simple-signup` (Should create user)
- [ ] **5. Login Test** - `POST /api/auth/login` (Should return user)

---

## 🛠️ Testing Tools

### Option 1: Browser (Simple GET requests)
Just open these URLs in your browser:
- `https://your-backend-url.onrender.com/api/ping`
- `https://your-backend-url.onrender.com/api/health/db`
- `https://your-backend-url.onrender.com/api/skills`

### Option 2: curl (Command Line)
```bash
# Test ping
curl https://your-backend-url.onrender.com/api/ping

# Test database health
curl https://your-backend-url.onrender.com/api/health/db

# Test skills
curl https://your-backend-url.onrender.com/api/skills
```

### Option 3: Postman / Thunder Client (VS Code Extension)
1. Create a new request
2. Set method (GET/POST)
3. Enter URL
4. For POST: Add JSON body in "Body" tab
5. Click Send

### Option 4: JavaScript (Browser Console)
```javascript
// Test ping
fetch('https://your-backend-url.onrender.com/api/ping')
  .then(res => res.json())
  .then(data => console.log(data));

// Test database health
fetch('https://your-backend-url.onrender.com/api/health/db')
  .then(res => res.json())
  .then(data => console.log(data));

// Test signup
fetch('https://your-backend-url.onrender.com/api/auth/simple-signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'test123456',
    batch: '2023',
    college: 'Test College',
    role: 'student'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## ⚠️ Common Issues & Solutions

### CORS Error
**Problem:** Browser shows CORS error
**Solution:** 
- Check `FRONTEND_URL` in backend environment variables
- Make sure it matches your frontend URL exactly
- No trailing slashes

### 404 Not Found
**Problem:** Endpoint returns 404
**Solution:**
- Check the URL path (should start with `/api/`)
- Verify the service is deployed and running
- Check Render logs for errors

### 500 Internal Server Error
**Problem:** Server error
**Solution:**
- Check Render logs for detailed error
- Verify `MONGODB_URI` is set correctly
- Check database connection

### Connection Timeout
**Problem:** Request times out
**Solution:**
- Service might be spinning up (free tier sleeps after inactivity)
- Wait 30-60 seconds and try again
- Check Render dashboard for service status

---

## 📝 Example: Complete Test Script

Save this as `test-api.sh` and run: `bash test-api.sh`

```bash
#!/bin/bash

# Replace with your actual backend URL
BACKEND_URL="https://your-backend-url.onrender.com"

echo "🧪 Testing AlumniHive Backend API"
echo "=================================="
echo ""

echo "1️⃣ Testing Ping..."
curl -s "$BACKEND_URL/api/ping" | jq .
echo ""

echo "2️⃣ Testing Database Health..."
curl -s "$BACKEND_URL/api/health/db" | jq .
echo ""

echo "3️⃣ Testing Skills Endpoint..."
curl -s "$BACKEND_URL/api/skills" | jq .
echo ""

echo "4️⃣ Testing Branches Endpoint..."
curl -s "$BACKEND_URL/api/branches" | jq .
echo ""

echo "✅ Testing Complete!"
```

**Note:** Requires `jq` for JSON formatting. Install with: `brew install jq` (Mac) or `apt-get install jq` (Linux)

---

## 🎯 Success Criteria

Your backend is working correctly if:
- ✅ `/api/ping` returns `{"message": "API is working!", ...}`
- ✅ `/api/health/db` shows `"connected": true` and `"database": "aluminihive"`
- ✅ `/api/skills` returns an array of skills
- ✅ Signup creates a user successfully
- ✅ Login returns user data

If all these pass, your backend is ready! 🚀


# Fix: MongoDB Connection Error on Render

## ❌ Error You're Seeing

```
🔗 Connecting to MongoDB: mongodb://localhost:27017/aluminihive
❌ MongoDB connection error: connect ECONNREFUSED
```

## 🔍 Problem

The `MONGODB_URI` environment variable is **NOT SET** in your Render backend service, so it's trying to connect to localhost (which doesn't exist on Render).

## ✅ Solution: Set MONGODB_URI in Render

### Step 1: Get Your MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

### Step 2: Update Connection String for AlumniHive

Replace `database` in the connection string with `aluminihive`:

**Before:**
```
mongodb+srv://user:pass@cluster.mongodb.net/test?retryWrites=true&w=majority
```

**After:**
```
mongodb+srv://user:pass@cluster.mongodb.net/aluminihive?retryWrites=true&w=majority
```

### Step 3: Set Environment Variable in Render

1. Go to **Render Dashboard**
2. Click on your **Backend Service** (`alumnihive-backend`)
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Set:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB Atlas connection string (with `aluminihive` as database)
6. Click **Save Changes**
7. Render will automatically redeploy

### Step 4: Verify MongoDB Atlas Network Access

1. Go to MongoDB Atlas → **Network Access**
2. Make sure you have `0.0.0.0/0` (allow from anywhere) OR
3. Add Render's IP addresses (if you want to restrict)

### Step 5: Verify Database User

1. Go to MongoDB Atlas → **Database Access**
2. Make sure your database user has read/write permissions
3. Note the username and password (used in connection string)

---

## 📝 Example Environment Variable

In Render Dashboard → Backend Service → Environment:

```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.umkcw.mongodb.net/aluminihive?retryWrites=true&w=majority&appName=Cluster0
```

**Important:**
- Replace `myuser` with your MongoDB username
- Replace `mypassword` with your MongoDB password
- Replace `cluster0.umkcw.mongodb.net` with your cluster URL
- Make sure `/aluminihive` is in the path (not `/test` or empty)

---

## ✅ After Setting MONGODB_URI

1. Render will automatically redeploy
2. Check the logs - you should see:
   ```
   ✅ MongoDB connected successfully
   📊 Database: aluminihive
   ```
3. Test the API: `https://your-backend.onrender.com/api/ping`

---

## 🔍 How to Verify It's Set

After setting the environment variable, check the deployment logs. You should see:

**✅ Correct:**
```
🔗 Connecting to MongoDB: mongodb+srv://***:***@cluster.mongodb.net/aluminihive
✅ MongoDB connected successfully
📊 Database: aluminihive
```

**❌ Wrong (what you're seeing now):**
```
🔗 Connecting to MongoDB: mongodb://localhost:27017/aluminihive
❌ MongoDB connection error
```

---

## 🚨 Common Mistakes

1. **Forgot to set MONGODB_URI** - Most common! Set it in Render dashboard
2. **Wrong database name** - Make sure it's `/aluminihive` not `/test`
3. **Network access blocked** - Check MongoDB Atlas Network Access settings
4. **Wrong password** - Verify username/password in connection string
5. **Missing `/aluminihive`** - The connection string must include the database name

---

## Quick Checklist

- [ ] MongoDB Atlas cluster is running
- [ ] Database user exists with correct permissions
- [ ] Network Access allows `0.0.0.0/0` (or Render IPs)
- [ ] Connection string includes `/aluminihive` as database
- [ ] `MONGODB_URI` is set in Render backend service environment variables
- [ ] Connection string format is correct (mongodb+srv://...)
- [ ] Backend service redeployed after setting environment variable

---

Once you set `MONGODB_URI` correctly, the backend will connect successfully! 🚀


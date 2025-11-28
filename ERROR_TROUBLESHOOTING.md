# Error Troubleshooting Guide

## Common Errors and Solutions

### 1. "Cannot find module" or Import Errors

**Error**: `Error: Cannot find module './index'` or similar

**Solution**: 
- Make sure you're running from the `server` directory
- Check that `tsx` is installed: `npm install`
- Try: `npx tsx server.ts`

### 2. "tsx: command not found"

**Error**: `'tsx' is not recognized as an internal or external command`

**Solution**:
```bash
cd server
npm install
npm start
```

### 3. MongoDB Connection Error

**Error**: `MongoDB connection error` or `MongooseError`

**Solution**:
- Create a `.env` file in the `server` directory:
```
MONGODB_URI=mongodb://localhost:27017/aluminihive
```
- Or set it in your environment variables
- For Render, set `MONGODB_URI` in the dashboard

### 4. Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
- Change the port in `.env`: `PORT=3001`
- Or kill the process using port 3000

### 5. TypeScript/Module Resolution Errors

**Error**: `Cannot find module '@shared/api'` or path resolution issues

**Solution**: 
- ✅ Already fixed - changed to relative paths
- If still seeing this, check that files were saved

### 6. "SyntaxError: Unexpected token" or Parse Errors

**Error**: Syntax errors in TypeScript files

**Solution**:
- Run: `npx tsc --noEmit server.ts` to check for syntax errors
- Make sure all files are saved
- Check for missing semicolons or brackets

## Step-by-Step Debugging

### Step 1: Verify Dependencies
```bash
cd server
npm install
```

### Step 2: Check Environment Variables
Create `server/.env`:
```
MONGODB_URI=mongodb://localhost:27017/aluminihive
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Step 3: Test Imports
```bash
cd server
npx tsx -e "import('./index.js').then(() => console.log('✅ Imports work'))"
```

### Step 4: Try Starting the Server
```bash
cd server
npm start
```

### Step 5: Check the Exact Error
Look at the full error message. Common patterns:
- **Import errors**: Check file paths and extensions
- **Type errors**: Usually can be ignored if using tsx
- **Runtime errors**: Check the specific error message

## Quick Fixes

### If tsx doesn't work, try:
```bash
cd server
node --loader tsx server.ts
```

### If you get module errors, try:
```bash
cd server
node --experimental-loader tsx server.ts
```

### Alternative: Use the direct server
```bash
cd server
npm run dev:direct
```

## Still Having Issues?

1. **Share the exact error message** - This helps identify the specific issue
2. **Check the console output** - Look for the first error line
3. **Verify file paths** - Make sure you're in the correct directory
4. **Check Node.js version** - Should be Node 18+ for best compatibility

## Testing the Fix

After applying fixes, test with:
```bash
cd server
npm start
```

Expected output:
```
✅ MongoDB connected successfully
🚀 AlumniHive API server running on port 3000
```

If you see errors, copy the full error message and check this guide.


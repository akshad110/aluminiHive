# Server Testing Guide

## Quick Test

To test if the server starts correctly:

```bash
cd server
npm install
npm start
```

Or with tsx directly:
```bash
cd server
npx tsx server.ts
```

## Expected Output

If everything is working, you should see:
```
✅ MongoDB connected successfully
🚀 AlumniHive API server running on port 3000
🔧 API: http://0.0.0.0:3000/api
📡 Ping: http://0.0.0.0:3000/api/ping
🌍 Environment: development
```

## Common Issues Fixed

1. ✅ **Import paths**: Fixed `@shared/api` imports to use relative paths
2. ✅ **Type errors**: Fixed PORT type conversion
3. ✅ **Graceful shutdown**: Improved error handling
4. ✅ **Dependencies**: Added `tsx` to dependencies for production

## Environment Variables Needed

Create a `.env` file in the `server` directory:

```
MONGODB_URI=mongodb://localhost:27017/aluminihive
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

## Testing the API

Once the server starts, test the ping endpoint:
```bash
curl http://localhost:3000/api/ping
```

Should return:
```json
{"message":"ping"}
```


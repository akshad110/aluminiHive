# MongoDB Setup for AlumniHive

## 🗄️ Database Configuration

Your AlumniHive application is now configured with MongoDB! Here's how to set it up:

## 📋 Prerequisites

1. **MongoDB Installation**
   - Download and install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Or use MongoDB Atlas (cloud) for free tier

2. **Environment Variables**
   Create a `.env` file in your project root with:
   ```env
   MONGODB_URI=mongodb://localhost:27017/aluminihive
   PORT=8080
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

## 🚀 Setup Options

### Option 1: Local MongoDB (Recommended for Development)

1. **Install MongoDB Community Server**
   ```bash
   # Windows: Download from mongodb.com
   # macOS: brew install mongodb-community
   # Ubuntu: sudo apt install mongodb
   ```

2. **Start MongoDB Service**
   ```bash
   # Windows: MongoDB runs as a service
   # macOS: brew services start mongodb-community
   # Ubuntu: sudo systemctl start mongod
   ```

3. **Verify Connection**
   ```bash
   mongosh
   # Should connect to MongoDB shell
   ```

### Option 2: MongoDB Atlas (Cloud - Free Tier)

1. **Create Atlas Account**
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Sign up for free account

2. **Create Cluster**
   - Choose "Free" tier
   - Select cloud provider & region
   - Create cluster

3. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

4. **Update Environment**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aluminihive?retryWrites=true&w=majority
   ```

## 🗂️ Database Models

Your application includes these MongoDB models:

### 👤 User Model
- Authentication (email, password)
- Basic profile (firstName, lastName, role)
- Password hashing with bcrypt

### 🎓 Alumni Model
- Professional experience
- Education history
- Skills and achievements
- Mentoring availability
- Social links

### 🎒 Student Model
- Academic information
- Projects and internships
- Career goals
- Mentorship interests
- Certifications

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile/:userId` - Get user profile

### Alumni
- `GET /api/alumni` - Get all alumni (with pagination)
- `GET /api/alumni/search` - Search alumni
- `GET /api/alumni/mentors` - Get available mentors
- `GET /api/alumni/:id` - Get specific alumni
- `PUT /api/alumni/:id` - Update alumni profile

### Students
- `GET /api/students` - Get all students (with pagination)
- `GET /api/students/search` - Search students
- `GET /api/students/mentorship` - Get students looking for mentorship
- `GET /api/students/:id` - Get specific student
- `PUT /api/students/:id` - Update student profile

## 🧪 Testing the Setup

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Test database connection**
   - Check console for "✅ MongoDB connected successfully"
   - Visit `http://localhost:8081/api/ping`

3. **Test registration**
   ```bash
   curl -X POST http://localhost:8081/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "firstName": "John",
       "lastName": "Doe",
       "role": "student",
       "studentId": "STU001",
       "currentYear": 3,
       "expectedGraduationYear": 2025,
       "major": "Computer Science"
     }'
   ```

## 🔧 Troubleshooting

### Connection Issues
- Ensure MongoDB service is running
- Check firewall settings
- Verify connection string format

### Authentication Issues
- Check if user exists in database
- Verify password hashing is working
- Check JWT secret configuration

### Performance Issues
- Add database indexes for frequently queried fields
- Use pagination for large datasets
- Implement caching for static data

## 📊 Database Indexes

The following indexes are automatically created for performance:

**Alumni Collection:**
- Location (city, state)
- Industry
- Skills
- Mentoring availability

**Student Collection:**
- Major
- Skills
- Mentorship interests
- Graduation year

## 🔐 Security Features

- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- Prepared for JWT authentication

## 🚀 Next Steps

1. **Add JWT Authentication**
2. **Implement file upload for profile pictures**
3. **Add email verification**
4. **Create admin dashboard**
5. **Add real-time messaging**
6. **Implement search with Elasticsearch**

Your MongoDB setup is now complete! 🎉

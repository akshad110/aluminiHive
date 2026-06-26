import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/aluminihive";

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully");

    const app = express();

    // Define MentoSession schema (collection: mento_session) to persist session history per requestId
    const MentoSessionSchema = new mongoose.Schema(
      {
        requestId: { type: String, index: true, unique: true },
        history: [
          {
            callId: String,
            callType: { type: String, enum: ['video', 'audio'] },
            startTime: String,
            endTime: String,
            duration: Number,
            status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] },
          },
        ],
        lastCallCompletedAt: String,
        totalCallDuration: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
      },
      { timestamps: true, collection: 'mento_session' }
    );
    const MentoSession = mongoose.models.MentoSession || mongoose.model('MentoSession', MentoSessionSchema);

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Serve static files
    app.use("/uploads", express.static("uploads"));
    app.use("/api/files", express.static("uploads/files"));

    // Simple test API routes
    app.get("/api/ping", (_req, res) => {
      const ping = process.env.PING_MESSAGE ?? "pong";
      res.json({ message: ping });
    });

    app.get("/api/test", (_req, res) => {
      res.json({ 
        message: "AlumniHive API is working!",
        timestamp: new Date().toISOString(),
        mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
      });
    });

    // Skills API (simple fallback)
    app.get("/api/skills", (_req, res) => {
      const skills = [
        { id: "javascript", category: "Programming Languages", name: "JavaScript" },
        { id: "python", category: "Programming Languages", name: "Python" },
        { id: "java", category: "Programming Languages", name: "Java" },
        { id: "react", category: "Web Technologies", name: "React" },
        { id: "nodejs", category: "Web Technologies", name: "Node.js" },
        { id: "mongodb", category: "Databases", name: "MongoDB" },
        { id: "sql", category: "Databases", name: "SQL" },
      ];
      res.json({ skills });
    });

    // Colleges API (simple mock data)
    app.get("/api/colleges/search", (_req, res) => {
      const colleges = [
        { _id: "1", name: "Indian Institute of Technology Mumbai", location: "Mumbai" },
        { _id: "2", name: "Indian Institute of Technology Delhi", location: "Delhi" },
        { _id: "3", name: "Indian Institute of Technology Bangalore", location: "Bangalore" },
        { _id: "4", name: "National Institute of Technology", location: "Various" },
        { _id: "5", name: "Indian Institute of Science", location: "Bangalore" },
      ];
      res.json({ 
        colleges,
        count: colleges.length,
        currentPage: 1,
        pages: 1
      });
    });

    // Auth endpoints (simple implementation)
    app.post("/api/auth/simple-signup", (req, res) => {
      const { name, email, password, role, batch, college } = req.body;
      
      // Basic validation
      if (!name || !email || !password || !role) {
        return res.status(400).json({ 
          error: "Missing required fields: name, email, password, role" 
        });
      }
      
      // Mock successful signup - generate valid MongoDB ObjectId
      const userId = new mongoose.Types.ObjectId().toString();
      const userResponse = {
        _id: userId,
        email: email,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        role: role,
        isVerified: false
      };

      console.log(`✅ Simple signup: ${email} as ${role}`);
      res.json({
        message: "Signup successful",
        user: userResponse
      });
    });

    app.post("/api/auth/login", (req, res) => {
      const { email, password, role } = req.body;
      
      // Basic validation
      if (!email || !password || !role) {
        return res.status(400).json({ 
          error: "Missing required fields: email, password, role" 
        });
      }
      
      // Mock successful login - use valid MongoDB ObjectId format
      const userResponse = {
        _id: new mongoose.Types.ObjectId().toString(),
        email: email,
        firstName: "User",
        lastName: "Test",
        role: role,
        isVerified: true
      };

      console.log(`✅ Login: ${email} as ${role}`);
      res.json({
        message: "Login successful",
        user: userResponse
      });
    });

    // Alumni profile update endpoint
    app.put("/api/alumni/user/:userId", (req, res) => {
      const { userId } = req.params;
      const updateData = req.body;
      
      console.log(`✅ Alumni profile update for user ${userId}:`, updateData);
      
      // Mock successful profile update
      res.json({
        message: "Profile updated successfully",
        alumni: {
          userId: userId,
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      });
    });

    // Track call start endpoint (persists)
    app.post("/api/mentorship/mento_session/start", async (req, res) => {
      try {
        const { requestId, callType, startTime } = req.body;
        const callId = `call-${Date.now()}`;
        await MentoSession.findOneAndUpdate(
          { requestId },
          {
            $setOnInsert: { requestId },
            $push: {
              history: {
                callId,
                callType,
                startTime,
                status: 'in_progress',
              },
            },
          },
          { upsert: true, new: true }
        );
        console.log('📞 Call started (persisted)', { requestId, callType, startTime });
        res.json({
          message: 'Call start tracked successfully',
          callId,
          requestId,
          callType,
          startTime,
          status: 'in_progress',
        });
      } catch (err) {
        console.error('Call start persist error', err);
        res.status(500).json({ error: 'Failed to persist call start' });
      }
    });

    // Track call end endpoint (persists)
    app.post("/api/mentorship/mento_session/end", async (req, res) => {
      try {
        const { requestId, callType, startTime, endTime, duration } = req.body;
        const callId = `call-${Date.now()}`;
        const doc = await MentoSession.findOneAndUpdate(
          { requestId },
          {
            // push a completed call entry (robust even if start entry missing)
            $push: {
              history: {
                callId,
                callType,
                startTime,
                endTime,
                duration,
                status: 'completed',
              },
            },
            $set: { lastCallCompletedAt: endTime },
            $inc: { totalCallDuration: duration || 0 },
          },
          { upsert: true, new: true }
        );
        // Mark whole request as completed for UI, unconditionally on manual end
        const requestUpdated = {
          status: 'completed',
          lastCallCompletedAt: endTime,
          totalCallDuration: doc.totalCallDuration,
        };
        await MentoSession.updateOne(
          { requestId },
          { $set: { completed: true } }
        );
        console.log('📞 Call ended (persisted)', { requestId, callType, startTime, endTime, duration });
        res.json({
          message: 'Call end tracked successfully',
          callId,
          requestId,
          callType,
          startTime,
          endTime,
          duration,
          status: 'completed',
          requestUpdated,
        });
      } catch (err) {
        console.error('Call end persist error', err);
        res.status(500).json({ error: 'Failed to persist call end' });
      }
    });

    // Bulk fetch mento_session by request IDs to merge into UI
    app.get('/api/mentorship/mento_session/by-requests', async (req, res) => {
      try {
        const ids = (req.query.ids || '').toString().split(',').filter(Boolean);
        if (ids.length === 0) return res.json({ logs: [] });
        const logs = await MentoSession.find({ requestId: { $in: ids } }).lean();
        res.json({ logs });
      } catch (err) {
        console.error('Fetch call logs error', err);
        res.status(500).json({ error: 'Failed to fetch call logs' });
      }
    });

    // Define mentorship models directly
    const MentorshipRequestSchema = new mongoose.Schema({
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      alumniId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      category: { type: String, enum: ['career_guidance', 'interview_prep', 'project_help', 'networking', 'skill_development'], required: true },
      title: { type: String, required: true },
      description: { type: String, required: true },
      status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      skillsNeeded: [{ type: String, trim: true }],
      expectedDuration: { type: String, required: true },
      preferredCommunication: { type: String, enum: ['email', 'video_call', 'in_person', 'chat'], default: 'email' },
      studentMessage: { type: String, maxlength: 1000 },
      alumniResponse: { type: String, maxlength: 1000 },
      rejectionReason: { type: String },
      callHistory: [{
        callId: { type: String, required: true },
        startTime: { type: Date, required: true },
        endTime: { type: Date },
        duration: { type: Number },
        callType: { type: String, enum: ['video', 'audio'], required: true },
        status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' }
      }],
      lastCallCompletedAt: { type: Date },
      totalCallDuration: { type: Number, default: 0 }
    }, { timestamps: true });

    const MentorSessionSchema = new mongoose.Schema({
      mentorshipRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "MentorshipRequest", required: true },
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      alumniId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      sessionTitle: { type: String, required: true },
      sessionDescription: { type: String, required: true },
      category: { type: String, enum: ['career_guidance', 'interview_prep', 'project_help', 'networking', 'skill_development'], required: true },
      skillsNeeded: [{ type: String, trim: true }],
      studentMessage: { type: String, maxlength: 1000 },
      sessionDone: { type: Boolean, default: false },
      completedAt: { type: Date }
    }, { timestamps: true });

    const MentorshipRequest = mongoose.model('MentorshipRequest', MentorshipRequestSchema);
    const MentorSession = mongoose.model('MentorSession', MentorSessionSchema);

    // Get mentorship requests for alumni
    app.get("/api/mentorship/requests/alumni/:alumniId", async (req, res) => {
      try {
        const { alumniId } = req.params;
        console.log('Fetching requests for alumni:', alumniId);
        
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(alumniId)) {
          console.log('Invalid ObjectId, returning mock data');
          const mockRequests = [{
            _id: 'mock-request-1',
            studentId: {
              _id: 'mock-student-1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              profilePicture: null
            },
            category: 'career_guidance',
            title: 'Need help with career guidance',
            description: 'I am looking for guidance on my career path in software development',
            status: 'pending',
            priority: 'medium',
            skillsNeeded: ['mern', 'react', 'node.js'],
            studentMessage: 'Hello! I am a final year student looking for mentorship.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }];
          return res.json({ requests: mockRequests });
        }
        
        // First, create a sample request if none exist
        const existingRequests = await MentorshipRequest.find({ alumniId: alumniId });
        console.log('Existing requests:', existingRequests.length);
        
        if (existingRequests.length === 0) {
          // Create a sample request for testing
          try {
            const sampleRequest = new MentorshipRequest({
              studentId: new mongoose.Types.ObjectId(),
              alumniId: alumniId,
              category: 'career_guidance',
              title: 'Need help with career guidance',
              description: 'I am looking for guidance on my career path in software development',
              skillsNeeded: ['mern', 'react', 'node.js'],
              expectedDuration: '2 weeks',
              preferredCommunication: 'video_call',
              studentMessage: 'Hello! I am a final year student looking for mentorship in software development.',
              status: 'pending',
              priority: 'medium'
            });
            await sampleRequest.save();
            console.log('Created sample request');
          } catch (saveError) {
            console.log('Error creating sample request:', saveError);
            // Continue with returning empty array if sample creation fails
          }
        }
        
        try {
          const requests = await MentorshipRequest.find({ alumniId: alumniId })
            .populate('studentId', 'firstName lastName email profilePicture')
            .select('+callHistory +totalCallDuration +lastCallCompletedAt')
            .sort({ createdAt: -1 });
          
          console.log('Returning requests:', requests.length);
          res.json({ requests });
        } catch (dbError) {
          console.log('Database query failed, returning mock data:', dbError);
          // Return mock data for testing
          const mockRequests = [{
            _id: 'mock-request-1',
            studentId: {
              _id: 'mock-student-1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              profilePicture: null
            },
            category: 'career_guidance',
            title: 'Need help with career guidance',
            description: 'I am looking for guidance on my career path in software development',
            status: 'pending',
            priority: 'medium',
            skillsNeeded: ['mern', 'react', 'node.js'],
            studentMessage: 'Hello! I am a final year student looking for mentorship.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }];
          res.json({ requests: mockRequests });
        }
      } catch (error) {
        console.error('Error fetching mentorship requests for alumni:', error);
        res.status(500).json({ error: 'Failed to fetch mentorship requests' });
      }
    });

    // Accept mentorship request
    app.put("/api/mentorship/requests/:requestId/accept", async (req, res) => {
      try {
        const { requestId } = req.params;
        
        const request = await MentorshipRequest.findByIdAndUpdate(
          requestId,
          { 
            status: 'accepted',
            updatedAt: new Date()
          },
          { new: true }
        );
        
        if (!request) {
          return res.status(404).json({ error: 'Mentorship request not found' });
        }
        
        res.json({ 
          message: 'Mentorship request accepted successfully',
          request 
        });
      } catch (error) {
        console.error('Error accepting mentorship request:', error);
        res.status(500).json({ error: 'Failed to accept mentorship request' });
      }
    });

    // Reject mentorship request
    app.put("/api/mentorship/requests/:requestId/reject", async (req, res) => {
      try {
        const { requestId } = req.params;
        const { rejectionReason } = req.body;
        
        if (!rejectionReason || rejectionReason.trim() === '') {
          return res.status(400).json({ error: 'Rejection reason is required' });
        }
        
        const request = await MentorshipRequest.findByIdAndUpdate(
          requestId,
          { 
            status: 'rejected',
            rejectionReason: rejectionReason.trim(),
            updatedAt: new Date()
          },
          { new: true }
        );
        
        if (!request) {
          return res.status(404).json({ error: 'Mentorship request not found' });
        }
        
        res.json({ 
          message: 'Mentorship request rejected',
          request 
        });
      } catch (error) {
        console.error('Error rejecting mentorship request:', error);
        res.status(500).json({ error: 'Failed to reject mentorship request' });
      }
    });

    // Complete mentorship session
    app.put("/api/mentorship/requests/:requestId/complete", async (req, res) => {
      try {
        console.log('Complete mentorship session request:', req.params);
        const { requestId } = req.params;
        
        if (!requestId) {
          return res.status(400).json({ error: 'Request ID is required' });
        }
        
        // Find the mentorship request
        const request = await MentorshipRequest.findById(requestId)
          .populate('studentId', 'firstName lastName email')
          .populate('alumniId', 'firstName lastName email');
        
        if (!request) {
          console.log('Mentorship request not found for ID:', requestId);
          return res.status(404).json({ error: 'Mentorship request not found' });
        }

        console.log('Found mentorship request:', request._id);

        // Create a new mentor session record
        const mentorSession = new MentorSession({
          mentorshipRequestId: request._id,
          studentId: request.studentId._id,
          alumniId: request.alumniId._id,
          sessionTitle: request.title,
          sessionDescription: request.description,
          category: request.category,
          skillsNeeded: request.skillsNeeded,
          studentMessage: request.studentMessage,
          sessionDone: true,
          completedAt: new Date()
        });

        console.log('Created mentor session:', mentorSession);
        await mentorSession.save();
        console.log('Saved mentor session successfully');

        // Update the original request status to completed
        await MentorshipRequest.findByIdAndUpdate(
          requestId,
          { 
            status: 'completed',
            updatedAt: new Date()
          }
        );
        
        console.log('Updated mentorship request status to completed');
        
        res.json({ 
          message: 'Mentorship session completed successfully',
          session: mentorSession,
          success: true
        });
      } catch (error) {
        console.error('Error completing mentorship session:', error);
        res.status(500).json({ 
          error: 'Failed to complete mentorship session',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get completed mentor sessions
    app.get("/api/mentorship/sessions/completed/:alumniId", async (req, res) => {
      try {
        const { alumniId } = req.params;
        
        const sessions = await MentorSession.find({ 
          alumniId, 
          sessionDone: true 
        })
          .populate('studentId', 'firstName lastName email profilePicture')
          .sort({ completedAt: -1 });
        
        res.json({ sessions });
      } catch (error) {
        console.error('Error fetching completed mentor sessions:', error);
        res.status(500).json({ error: 'Failed to fetch completed sessions' });
      }
    });

    // Create sample mentorship request data
    app.post("/api/mentorship/create-sample", async (req, res) => {
      try {
        const sampleRequest = new MentorshipRequest({
          studentId: new mongoose.Types.ObjectId(),
          alumniId: new mongoose.Types.ObjectId(),
          category: 'career_guidance',
          title: 'Need help with career guidance',
          description: 'I am looking for guidance on my career path',
          skillsNeeded: ['mern', 'react'],
          expectedDuration: '2 weeks',
          preferredCommunication: 'video_call',
          studentMessage: 'Hello, I need help with career guidance',
          status: 'pending',
          priority: 'medium'
        });

        await sampleRequest.save();
        res.json({ message: 'Sample request created', request: sampleRequest });
      } catch (error) {
        console.error('Error creating sample request:', error);
        res.status(500).json({ error: 'Failed to create sample request' });
      }
    });

  const port = process.env.PORT || 3000; // use Render's assigned port or fallback to 3000 locally

app.listen(port, () => {
  console.log(`🚀 AlumniHive API server running on port ${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
  console.log(`📡 Ping: http://localhost:${port}/api/ping`);
});

    
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  await mongoose.disconnect();
  process.exit(0);
});

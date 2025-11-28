import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { handleDemo } from "./routes/demo";
import { connectDB } from "./db/connection";

// Models are now imported in connectDB() AFTER connecting to the database
// This ensures all models are bound to the correct database connection
import { register, login, getProfile, simpleSignup } from "./routes/auth";
import {
  getAllAlumni,
  getAlumniById,
  updateAlumniProfile,
  updateAlumniProfileByUserId,
  searchAlumni,
  getMentors
} from "./routes/alumni";
import {
  getAllStudents,
  getStudentById,
  updateStudentProfile,
  updateStudentProfileByUserId,
  searchStudents,
  getStudentsLookingForMentorship
} from "./routes/students";
import { getDashboardStats } from "./routes/dashboard";
import { 
  getMentorshipOpportunities, 
  getImpactMetrics, 
  getRecentActivity,
  updateImpactMetrics,
  createActivity,
  createMentorshipRequest,
  getMentorshipRequestsForAlumni,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
  getMentorshipRequestsForStudent,
  completeMentorshipCall
} from "./routes/alumni-dashboard";
import { completeMentorshipSession, getCompletedMentorSessions } from "./routes/mentorship";
import { 
  startVideoCall, 
  joinVideoCall, 
  leaveVideoCall, 
  getVideoCallStatus 
} from "./routes/videoCall";
import { searchColleges } from "./routes/colleges";
import { getDegrees } from "./routes/degrees";
import { getBranches } from "./routes/branches";
import { getSkills, searchSkills } from "./routes/skills";
import { createPaymentOrder, verifyPayment as verifyMentorshipPayment, checkPaymentStatus } from "./routes/payment";
import { 
  getAllBatches, 
  getBatchById, 
  getBatchesByCollege, 
  getBatchStats, 
  createBatch, 
  updateBatch, 
  deleteBatch,
  uploadBatchFile,
  upload
} from "./routes/batches";
import {
  getBatchMessages,
  getBatchDetails
} from "./routes/batchChat";
import {
  getAllJobPostings,
  getJobPostings,
  getJobPosting,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
  unlockJobPosting,
  applyForJob,
  getJobApplications,
  updateApplicationStatus
} from "./routes/jobPostings";
import {
  getConversation,
  sendMessage,
  getConversations,
  markAsRead,
  uploadMessageFile,
  upload as uploadMessageMulter
} from "./routes/messages";
import {
  sendConnectionRequest,
  getConnectionRequests,
  updateConnectionRequest,
  checkConnectionStatus,
  getConnectionStats
} from "./routes/connectionRequests";
import { 
  getSubscriptionPlans, 
  createSubscription, 
  createRazorpayOrder,
  verifyPayment,
  createJobUnlockOrder,
  verifyJobUnlockPayment,
  razorpayWebhook,
  manualUnlockJob,
  getStudentSubscriptions, 
  getAlumniEarnings, 
  checkSubscriptionStatus 
} from "./routes/subscriptions";
import {
  getMessageLimitStatus,
  canSendMessage,
  incrementMessageCount
} from "./routes/messageLimits";

export async function createServer() {
  // Connect to MongoDB
  await connectDB();

  const app = express();

  // Configure multer for file uploads (using disk storage from batches route)
  const { upload } = await import("./routes/batches");

  // Middleware
  // CORS configuration - allow frontend domain from environment variable
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'];
  
  console.log('🌐 CORS Configuration:');
  console.log('   Allowed origins:', allowedOrigins);
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  
  // CORS middleware - handles both preflight (OPTIONS) and actual requests
  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('✅ CORS: Allowing request with no origin');
        return callback(null, true);
      }
      
      console.log(`🔍 CORS: Checking origin: ${origin}`);
      
      // In development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ CORS: Development mode - allowing origin: ${origin}`);
        return callback(null, true);
      }
      
      // In production, check against allowed origins
      // Also allow if FRONTEND_URL is not set (fallback for safety)
      if (allowedOrigins.length === 0 || allowedOrigins[0].includes('localhost')) {
        console.log(`⚠️ CORS: No production FRONTEND_URL set, allowing origin: ${origin}`);
        return callback(null, true);
      }
      
      const isAllowed = allowedOrigins.some(allowed => {
        // Exact match
        if (origin === allowed) return true;
        // Match without protocol (http/https)
        const originNoProtocol = origin.replace(/^https?:\/\//, '');
        const allowedNoProtocol = allowed.replace(/^https?:\/\//, '');
        if (originNoProtocol === allowedNoProtocol) return true;
        // Match with/without trailing slash
        if (originNoProtocol.replace(/\/$/, '') === allowedNoProtocol.replace(/\/$/, '')) return true;
        return false;
      });
      
      if (isAllowed) {
        console.log(`✅ CORS: Allowing origin: ${origin}`);
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        console.warn(`   Allowed origins: ${allowedOrigins.join(', ')}`);
        console.warn(`   Set FRONTEND_URL environment variable to allow this origin`);
        callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Type'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Serve static files
  app.use("/uploads", express.static("uploads"));
  app.use("/api/files", express.static("uploads/files"));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ 
      message: "API is working!",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // CORS test endpoint
  app.get("/api/cors-test", (_req, res) => {
    res.json({
      message: "CORS is working!",
      origin: _req.headers.origin,
      timestamp: new Date().toISOString()
    });
  });

  // Database health check endpoint
  app.get("/api/health/db", async (_req, res) => {
    try {
      const mongoose = (await import("mongoose")).default;
      const { User, Message, MentorshipRequest } = await import("./models");
      
      // Get collection names directly from MongoDB
      const db = mongoose.connection.db;
      const collections = await db?.listCollections().toArray();
      const collectionNames = collections?.map(c => c.name) || [];
      
      // Get counts from each collection
      const stats: any = {};
      for (const collName of collectionNames) {
        try {
          const count = await db?.collection(collName).countDocuments({});
          stats[collName] = count || 0;
        } catch (e) {
          stats[collName] = 'error';
        }
      }
      
      // Also try model-based counts
      const modelStats = {
        users: await User.countDocuments({}),
        messages: await Message.countDocuments({}),
        mentorshipRequests: await MentorshipRequest.countDocuments({}),
      };
      
      // Get sample data
      const sampleUser = await User.findOne({});
      const sampleMessage = await Message.findOne({});
      const sampleRequest = await MentorshipRequest.findOne({});
      
      const dbStatus = {
        connected: mongoose.connection.readyState === 1,
        connectionState: mongoose.connection.readyState,
        database: mongoose.connection.db?.databaseName,
        host: mongoose.connection.host,
        collections: collectionNames,
        collectionCounts: stats,
        modelCounts: modelStats,
        samples: {
          user: sampleUser ? { _id: sampleUser._id, email: sampleUser.email, role: sampleUser.role } : null,
          message: sampleMessage ? { _id: sampleMessage._id, sender: sampleMessage.sender, receiver: sampleMessage.receiver } : null,
          request: sampleRequest ? { _id: sampleRequest._id, studentId: sampleRequest.studentId, alumniId: sampleRequest.alumniId } : null,
        }
      };
      
      res.json(dbStatus);
    } catch (error) {
      console.error("Database health check error:", error);
      res.status(500).json({ 
        error: "Database health check failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/simple-signup", simpleSignup);
  app.post("/api/auth/login", login);
  app.get("/api/auth/profile/:userId", getProfile);
  app.get("/api/users/:userId", getProfile);

  // Alumni routes
  app.get("/api/alumni", getAllAlumni);
  app.get("/api/alumni/search", searchAlumni);
  app.get("/api/alumni/mentors", getMentors);
  app.get("/api/alumni/mentorship-opportunities", getMentorshipOpportunities);
  app.get("/api/alumni/impact-metrics/:userId", getImpactMetrics);
  app.get("/api/alumni/recent-activity/:userId", getRecentActivity);
  app.put("/api/alumni/impact-metrics/:userId", updateImpactMetrics);
  app.post("/api/alumni/activities", createActivity);
  app.post("/api/mentorship/requests", createMentorshipRequest);
  app.get("/api/mentorship/requests/alumni/:alumniId", getMentorshipRequestsForAlumni);
  app.get("/api/mentorship/requests/student/:studentId", getMentorshipRequestsForStudent);
  app.put("/api/mentorship/requests/:requestId/accept", acceptMentorshipRequest);
  app.put("/api/mentorship/requests/:requestId/reject", rejectMentorshipRequest);
  app.post("/api/mentorship/requests/complete-call", completeMentorshipCall);
  app.put("/api/mentorship/requests/:requestId/complete", completeMentorshipSession);
  app.get("/api/mentorship/sessions/completed/:alumniId", getCompletedMentorSessions);
  
  // Video call tracking routes
  app.post("/api/video-call/start", startVideoCall);
  app.post("/api/video-call/join", joinVideoCall);
  app.post("/api/video-call/leave", leaveVideoCall);
  app.get("/api/video-call/status/:requestId", getVideoCallStatus);
  app.get("/api/alumni/:id", getAlumniById);
  app.put("/api/alumni/:id", updateAlumniProfile);
  app.put("/api/alumni/user/:userId", updateAlumniProfileByUserId);

  // Student routes
  app.get("/api/students", getAllStudents);
  app.get("/api/students/search", searchStudents);
  app.get("/api/students/mentorship", getStudentsLookingForMentorship);
  app.get("/api/students/:id", getStudentById);
  app.put("/api/students/:id", updateStudentProfile);
  app.put("/api/students/user/:userId", updateStudentProfileByUserId);

  // Dashboard routes
  app.get("/api/dashboard/stats", getDashboardStats);

  // College search routes
  app.get("/api/colleges/search", searchColleges);

  // Degrees routes
  app.get("/api/degrees", getDegrees);

  // Branches routes
  app.get("/api/branches", getBranches);

  // Skills routes
  app.get("/api/skills", getSkills);
  app.get("/api/skills/search", searchSkills);

  // Batch routes
  app.get("/api/batches", getAllBatches);
  app.get("/api/batches/stats", getBatchStats);
  app.get("/api/batches/college/:college", getBatchesByCollege);
  app.get("/api/batches/:id", getBatchById);
  app.post("/api/batches", createBatch);
  app.put("/api/batches/:id", updateBatch);
  app.delete("/api/batches/:id", deleteBatch);

  // Batch Chat API routes (for unified chat interface)
  app.get("/api/batches/:batchId/chat/messages", getBatchMessages);
  app.post("/api/batches/:batchId/chat/messages/file", upload.single('file'), uploadBatchFile);
  
  // Batch Details route
  app.get("/api/batches/:batchId/details", getBatchDetails);

  // Job Posting routes
  app.get("/api/jobs", getAllJobPostings); // Get all jobs (for students)
  app.get("/api/batches/:batchId/jobs", getJobPostings); // Get jobs for specific batch
  app.get("/api/jobs/:jobId", getJobPosting);
  app.post("/api/batches/:batchId/jobs", createJobPosting);
  app.put("/api/jobs/:jobId", updateJobPosting);
  app.delete("/api/jobs/:jobId", deleteJobPosting);
  app.post("/api/jobs/:jobId/unlock", unlockJobPosting);
  app.post("/api/jobs/:jobId/apply", applyForJob);
  app.get("/api/jobs/:jobId/applications", getJobApplications);
  app.put("/api/jobs/:jobId/applications/:applicationId", updateApplicationStatus);

  // Messaging routes
  app.get("/api/messages/conversations/:userId", getConversations);
  app.get("/api/messages/:userId/:otherUserId", getConversation);
  app.post("/api/messages/:senderId/:receiverId", sendMessage);
  app.post("/api/messages/:senderId/:receiverId/file", uploadMessageMulter.single('file'), uploadMessageFile);
  app.put("/api/messages/:userId/:otherUserId/read", markAsRead);

  // Connection request routes
  app.post("/api/connections/:requesterId/:recipientId", sendConnectionRequest);
  app.get("/api/connections/:userId", getConnectionRequests);
  app.put("/api/connections/:requestId", updateConnectionRequest);
  app.get("/api/connections/status/:userId1/:userId2", checkConnectionStatus);
  app.get("/api/connections/stats/:userId", getConnectionStats);

  // Subscription routes
  app.get("/api/subscriptions/plans/:alumniId", getSubscriptionPlans);
  app.post("/api/subscriptions", createSubscription);
  app.post("/api/subscriptions/razorpay/order", createRazorpayOrder);
  app.post("/api/subscriptions/razorpay/verify", verifyPayment);
  app.post("/api/subscriptions/razorpay/job-unlock-order", createJobUnlockOrder);
  app.post("/api/subscriptions/razorpay/job-unlock-verify", verifyJobUnlockPayment);
  app.post("/api/subscriptions/razorpay/callback", razorpayWebhook);
  app.post("/api/subscriptions/manual-unlock", manualUnlockJob);
  app.get("/api/subscriptions/student/:studentId", getStudentSubscriptions);
  app.get("/api/subscriptions/alumni/:alumniId/earnings", getAlumniEarnings);
  app.get("/api/subscriptions/status/:studentId/:alumniId", checkSubscriptionStatus);

  // Message limit routes
  app.get("/api/message-limits/:userId", getMessageLimitStatus);
  app.post("/api/message-limits/can-send", canSendMessage);
  app.post("/api/message-limits/increment", incrementMessageCount);

  // Mentorship payment routes
  app.post("/api/payment/mentorship/order", createPaymentOrder);
  app.post("/api/payment/mentorship/verify", verifyMentorshipPayment);
  app.get("/api/payment/mentorship/status/:studentId/:alumniId/:requestId", checkPaymentStatus);

  // College routes
  app.get("/api/colleges/search", searchColleges);

  return app;
}

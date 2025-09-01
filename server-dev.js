import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./server/db/connection.js";
import { register, login, getProfile, simpleSignup } from "./server/routes/auth.js";
import { 
  getAllAlumni, 
  getAlumniById, 
  updateAlumniProfile, 
  searchAlumni, 
  getMentors 
} from "./server/routes/alumni.js";
import { 
  getAllStudents, 
  getStudentById, 
  updateStudentProfile, 
  searchStudents, 
  getStudentsLookingForMentorship 
} from "./server/routes/students.js";

// Connect to MongoDB
await connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Example API routes
app.get("/ping", (_req, res) => {
  const ping = process.env.PING_MESSAGE ?? "ping";
  res.json({ message: ping });
});

// Authentication routes
app.post("/auth/register", register);
app.post("/auth/simple-signup", simpleSignup);
app.post("/auth/login", login);
app.get("/auth/profile/:userId", getProfile);

// Alumni routes
app.get("/alumni", getAllAlumni);
app.get("/alumni/search", searchAlumni);
app.get("/alumni/mentors", getMentors);
app.get("/alumni/:id", getAlumniById);
app.put("/alumni/:id", updateAlumniProfile);

// Student routes
app.get("/students", getAllStudents);
app.get("/students/search", searchStudents);
app.get("/students/mentorship", getStudentsLookingForMentorship);
app.get("/students/:id", getStudentById);
app.put("/students/:id", updateStudentProfile);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log("✅ MongoDB connected successfully");
});

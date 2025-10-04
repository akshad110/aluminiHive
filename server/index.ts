import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { connectDB } from "./db/connection";
import { register, login, getProfile, simpleSignup } from "./routes/auth";
import {
  getAllAlumni,
  getAlumniById,
  updateAlumniProfile,
  searchAlumni,
  getMentors
} from "./routes/alumni";
import {
  getAllStudents,
  getStudentById,
  updateStudentProfile,
  searchStudents,
  getStudentsLookingForMentorship
} from "./routes/students";
import { searchColleges } from "./routes/colleges";

export async function createServer() {
  // Connect to MongoDB
  await connectDB();

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/simple-signup", simpleSignup);
  app.post("/api/auth/login", login);
  app.get("/api/auth/profile/:userId", getProfile);

  // Alumni routes
  app.get("/api/alumni", getAllAlumni);
  app.get("/api/alumni/search", searchAlumni);
  app.get("/api/alumni/mentors", getMentors);
  app.get("/api/alumni/:id", getAlumniById);
  app.put("/api/alumni/:id", updateAlumniProfile);

  // Student routes
  app.get("/api/students", getAllStudents);
  app.get("/api/students/search", searchStudents);
  app.get("/api/students/mentorship", getStudentsLookingForMentorship);
  app.get("/api/students/:id", getStudentById);
  app.put("/api/students/:id", updateStudentProfile);

  // College routes
  app.get("/api/colleges/search", searchColleges);

  return app;
}

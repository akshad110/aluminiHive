import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../models/User.ts";
import { Alumni } from "../models/Alumni.ts";
import { Student } from "../models/Student.ts";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/alumnihive";
console.log("🔗 Connecting to:", MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")); // Hide credentials

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Alumni.deleteMany({});
    await Student.deleteMany({});
    console.log("🗑️ Cleared existing data");

    // Create sample users
    const user1 = new User({
      email: "john.doe@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      role: "student",
      isVerified: true
    });

    const user2 = new User({
      email: "jane.smith@example.com", 
      password: "password123",
      firstName: "Jane",
      lastName: "Smith",
      role: "alumni",
      isVerified: true
    });

    const user3 = new User({
      email: "mike.johnson@example.com",
      password: "password123", 
      firstName: "Mike",
      lastName: "Johnson",
      role: "alumni",
      isVerified: true
    });

    await user1.save();
    await user2.save();
    await user3.save();
    console.log("👥 Created sample users");

    // Create sample student
    const student = new Student({
      userId: user1._id,
      studentId: "STU001",
      currentYear: 3,
      expectedGraduationYear: 2025,
      major: "Computer Science",
      minor: "Mathematics",
      gpa: 3.8,
      interests: ["Web Development", "Machine Learning", "Data Science"],
      careerGoals: ["Software Engineer", "Data Scientist"],
      skills: ["JavaScript", "Python", "React", "Node.js"],
      projects: [{
        title: "E-commerce Platform",
        description: "Built a full-stack e-commerce application",
        technologies: ["React", "Node.js", "MongoDB"],
        githubUrl: "https://github.com/johndoe/ecommerce"
      }],
      isLookingForMentorship: true,
      mentorshipInterests: ["Career Guidance", "Technical Skills"]
    });

    await student.save();
    console.log("🎓 Created sample student");

    // Create sample alumni
    const alumni1 = new Alumni({
      userId: user2._id,
      graduationYear: 2020,
      degree: "Bachelor of Science",
      major: "Computer Science",
      currentCompany: "Google",
      currentPosition: "Senior Software Engineer",
      industry: "Technology",
      location: {
        city: "San Francisco",
        state: "California", 
        country: "USA"
      },
      bio: "Passionate software engineer with 4+ years of experience",
      skills: ["JavaScript", "Python", "React", "Node.js", "AWS"],
      experience: [{
        company: "Google",
        position: "Senior Software Engineer",
        startDate: new Date("2022-01-01"),
        current: true,
        description: "Leading development of cloud infrastructure"
      }],
      isAvailableForMentoring: true,
      mentoringInterests: ["Career Guidance", "Technical Skills", "Interview Prep"]
    });

    const alumni2 = new Alumni({
      userId: user3._id,
      graduationYear: 2018,
      degree: "Bachelor of Science", 
      major: "Computer Science",
      currentCompany: "Microsoft",
      currentPosition: "Product Manager",
      industry: "Technology",
      location: {
        city: "Seattle",
        state: "Washington",
        country: "USA"
      },
      bio: "Product manager with expertise in AI/ML products",
      skills: ["Product Management", "Machine Learning", "Python", "SQL"],
      experience: [{
        company: "Microsoft",
        position: "Product Manager",
        startDate: new Date("2021-03-01"),
        current: true,
        description: "Managing AI-powered product features"
      }],
      isAvailableForMentoring: true,
      mentoringInterests: ["Product Management", "AI/ML", "Career Transition"]
    });

    await alumni1.save();
    await alumni2.save();
    console.log("🎓 Created sample alumni");

    console.log("✅ Database seeded successfully!");
    console.log(`📊 Created ${await User.countDocuments()} users`);
    console.log(`📊 Created ${await Student.countDocuments()} students`);
    console.log(`📊 Created ${await Alumni.countDocuments()} alumni`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seedDatabase();

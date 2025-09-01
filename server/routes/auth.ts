import { RequestHandler } from "express";
import { User } from "../models/User";
import { Alumni } from "../models/Alumni";
import { Student } from "../models/Student";

// Simple signup with minimal data
export const simpleSignup: RequestHandler = async (req, res) => {
  try {
    const { fullName, email, batch, college, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Split full name into first and last name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || fullName;

    // Create user with minimal data
    const user = new User({
      email,
      password: "temp123", // Temporary password, will be changed during profile setup
      firstName,
      lastName,
      role,
    });

    await user.save();

    // Create basic profile based on role
    if (role === "alumni") {
      const alumni = new Alumni({
        userId: user._id,
        graduationYear: parseInt(batch),
        currentCompany: "Not specified",
        currentPosition: "Not specified",
        industry: "Not specified",
        location: {
          city: "Not specified",
          state: "Not specified",
          country: "Not specified"
        },
        bio: "",
        skills: [],
        experience: [],
        isAvailableForMentoring: false,
        mentoringInterests: []
      });
      await alumni.save();
    } else if (role === "student") {
      const student = new Student({
        userId: user._id,
        studentId: "Not specified",
        currentYear: parseInt(batch) - new Date().getFullYear() + 4, // Estimate current year
        expectedGraduationYear: parseInt(batch),
        major: "Not specified",
        minor: "",
        gpa: 0,
        interests: [],
        careerGoals: [],
        skills: [],
        projects: [],
        isLookingForMentorship: false,
        mentorshipInterests: []
      });
      await student.save();
    }

    // Return user without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
    };

    res.status(201).json({
      message: "Account created successfully! Please complete your profile.",
      user: userResponse,
    });
  } catch (error) {
    console.error("Simple signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const register: RequestHandler = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, ...profileData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
    });

    await user.save();

    // Create profile based on role
    if (role === "alumni") {
      const alumni = new Alumni({
        userId: user._id,
        ...profileData,
      });
      await alumni.save();
    } else if (role === "student") {
      const student = new Student({
        userId: user._id,
        ...profileData,
      });
      await student.save();
    }

    // Return user without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
    };

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Return user without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
    };

    res.json({
      message: "Login successful",
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let profile = null;
    if (user.role === "alumni") {
      profile = await Alumni.findOne({ userId }).populate("userId", "-password");
    } else if (user.role === "student") {
      profile = await Student.findOne({ userId }).populate("userId", "-password");
    }

    res.json({
      user,
      profile,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

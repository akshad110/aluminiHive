import { RequestHandler } from "express";
import { User } from "../models/User";
import { Alumni } from "../models/Alumni";
import { Student } from "../models/Student";

// Simple signup with minimal data
export const simpleSignup: RequestHandler = async (req, res) => {
  try {
    // Accept both 'name' and 'fullName' for compatibility
    const { name, fullName, email, password, batch, college, role } = req.body;
    const userName = name || fullName;

    // Validate required fields
    if (!userName || !email || !password || !batch || !college || !role) {
      const missingFields = [];
      if (!userName) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      if (!batch) missingFields.push('batch');
      if (!college) missingFields.push('college');
      if (!role) missingFields.push('role');
      
      console.error('Missing fields:', missingFields);
      return res.status(400).json({ 
        error: "All fields are required",
        missingFields: missingFields
      });
    }

    // Validate batch is a valid year
    const batchYear = parseInt(batch);
    if (isNaN(batchYear) || batchYear < 1900 || batchYear > new Date().getFullYear() + 10) {
      return res.status(400).json({ error: "Please enter a valid graduation year" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Split full name into first and last name
    const nameParts = userName.trim().split(' ');
    const firstName = nameParts[0] || userName;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    console.log('Creating user with:', {
      firstName,
      lastName,
      email,
      role,
      college,
      batch
    });

    // Create user with provided password
    const user = new User({
      email,
      password, // Use the password provided by user
      firstName,
      lastName,
      role,
      college,
    });

    console.log('Saving user to database...');
    await user.save();
    console.log('✅ User saved successfully:', user._id);

    // Create basic profile based on role
    if (role === "alumni") {
       console.log('Creating Alumni profile for user:', user._id);
       try {
         const alumni = new Alumni({
           userId: user._id,
           graduationYear: batchYear,
           degree: "Bachelor's", // Default degree
           branch: "Computer Science", // Default branch
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
         
         console.log('Saving Alumni profile...');
         await alumni.save();
         console.log('✅ Alumni profile saved successfully:', alumni._id);
       } catch (alumniError) {
         console.error('❌ Error saving Alumni profile:', alumniError);
         if (alumniError instanceof Error) {
           console.error('   Error message:', alumniError.message);
           console.error('   Error name:', alumniError.name);
           if ('errors' in alumniError) {
             console.error('   Validation errors:', JSON.stringify((alumniError as any).errors, null, 2));
           }
         }
         // Don't fail the entire signup if alumni profile creation fails
         // User is already created, so we'll continue
         console.warn('⚠️ Continuing despite Alumni profile creation error');
       }
     } else if (role === "student") {
       console.log('Creating Student profile for user:', user._id);
       try {
         const student = new Student({
           userId: user._id,
           studentId: `STU${Date.now()}`, // Generate unique student ID
           currentYear: batchYear - new Date().getFullYear() + 4, // Estimate current year
           expectedGraduationYear: batchYear,
           branch: "Computer Science", // Default branch
           minor: "",
           gpa: 0,
           academicStanding: "good", // Required field
           interests: [],
           careerGoals: [],
           skills: [],
           projects: [],
           isLookingForMentorship: false,
           mentorshipInterests: []
         });
         
         console.log('Saving Student profile...');
         await student.save();
         console.log('✅ Student profile saved successfully:', student._id);
       } catch (studentError) {
         console.error('❌ Error saving Student profile:', studentError);
         if (studentError instanceof Error) {
           console.error('   Error message:', studentError.message);
           console.error('   Error name:', studentError.name);
           if ('errors' in studentError) {
             console.error('   Validation errors:', JSON.stringify((studentError as any).errors, null, 2));
           }
         }
         console.warn('⚠️ Continuing despite Student profile creation error');
       }
    }

    // Return user without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      college: user.college,
      isVerified: user.isVerified,
    };

    // Verify that Alumni/Student profile was created
    if (role === "alumni") {
      const verifyAlumni = await Alumni.findOne({ userId: user._id });
      if (verifyAlumni) {
        console.log('✅ Verified: Alumni profile exists in database');
      } else {
        console.error('❌ WARNING: Alumni profile was not saved to database!');
      }
    } else if (role === "student") {
      const verifyStudent = await Student.findOne({ userId: user._id });
      if (verifyStudent) {
        console.log('✅ Verified: Student profile exists in database');
      } else {
        console.error('❌ WARNING: Student profile was not saved to database!');
      }
    }

    res.status(201).json({
      message: "Account created successfully! Please complete your profile.",
      user: userResponse,
    });
  } catch (error) {
    console.error("Simple signup error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password, and role are required" });
    }

    // Validate role
    if (!["alumni", "student", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

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

    // Validate that the user's actual role matches the requested role
    if (user.role !== role) {
      return res.status(403).json({ 
        error: `Access denied. This account is registered as ${user.role}, not ${role}. Please login with the correct role.` 
      });
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

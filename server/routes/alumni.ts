import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Alumni } from "../models/Alumni";
import { User } from "../models/User";
import { BatchService } from "../services/batchService";

export const getAllAlumni: RequestHandler = async (req, res) => {
  try {
    const { page = 1, limit = 10, industry, location, skills, availableForMentoring } = req.query;

    const query: any = {};

    // Apply filters
    if (industry) {
      query.industry = { $regex: industry as string, $options: "i" };
    }

    if (location) {
      query["location.city"] = { $regex: location as string, $options: "i" };
    }

    if (skills) {
      const skillsArray = (skills as string).split(",");
      query.skills = { $in: skillsArray };
    }

    if (availableForMentoring === "true") {
      query.isAvailableForMentoring = true;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const alumni = await Alumni.find(query)
      .populate("userId", "firstName lastName email profilePicture college")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Alumni.countDocuments(query);

    res.json({
      alumni,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        hasNext: skip + alumni.length < total,
        hasPrev: Number(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get all alumni error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAlumniById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // First try to find by Alumni _id, then by userId
    let alumni = await Alumni.findById(id);
    
    if (!alumni) {
    
      alumni = await Alumni.findOne({ userId: id });
    }
    
    if (!alumni) {
      return res.status(404).json({ error: "Alumni not found" });
    }

   
    try {
      // Ensure User model is registered
      if (!mongoose.models.User) {
        await import("../models/User");
      }
      
      alumni = await Alumni.findById(alumni._id).populate("userId", "firstName lastName email profilePicture college");
    } catch (populateError) {
      console.warn("Could not populate user data:", populateError);
      // Continue without population if it fails
    }

    res.json(alumni);
  } catch (error) {
    console.error("Get alumni by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAlumniProfile: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const alumni = await Alumni.findByIdAndUpdate(id, updateData, { new: true });
      // .populate("userId", "firstName lastName email profilePicture");

    if (!alumni) {
      return res.status(404).json({ error: "Alumni not found" });
    }

    res.json({
      message: "Profile updated successfully",
      alumni,
    });
  } catch (error) {
    console.error("Update alumni profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update alumni profile by user ID (for profile completion forms)
export const updateAlumniProfileByUserId: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Ensure User model is registered
    if (!mongoose.models.User) {
      await import("../models/User");
    }

    // Check if alumni profile exists
    let alumni = await Alumni.findOne({ userId });

    if (!alumni) {
      // Create new alumni profile if it doesn't exist
      alumni = new Alumni({
        userId,
        graduationYear: updateData.graduationYear || new Date().getFullYear(),
        degree: updateData.degree || "Bachelor's",
        branch: updateData.branch || "Computer Science",
        currentCompany: updateData.currentCompany || "Not specified",
        currentPosition: updateData.currentPosition || "Not specified",
        industry: updateData.industry || "Not specified",
        location: updateData.location || {
          city: "Not specified",
          state: "Not specified",
          country: "Not specified"
        },
        bio: updateData.bio || "",
        skills: updateData.skills || [],
        experience: [],
        isAvailableForMentoring: updateData.isAvailableForMentoring || false,
        mentoringInterests: updateData.mentoringInterests || []
      });
      await alumni.save();
    } else {
      // Update existing profile
      alumni = await Alumni.findOneAndUpdate(
        { userId },
        updateData,
        { new: true }
      );
    }

    // Handle batch assignment
    try {
      const user = await User.findById(userId);
      if (user && user.college && alumni.graduationYear) {
        // Create or find batch
        const batch = await BatchService.createOrFindBatch(user.college, alumni.graduationYear);
        
        // Add user to batch if not already assigned
        if (!user.batch || user.batch.toString() !== batch._id.toString()) {
          // Remove from old batch if exists
          if (user.batch) {
            await BatchService.removeUserFromBatch(userId, user.batch.toString(), "alumni");
          }
          
          // Add to new batch
          await BatchService.addUserToBatch(userId, batch._id.toString(), "alumni");
        }
      }
    } catch (batchError) {
      console.error("❌ Error handling batch assignment:", batchError);
      // Don't fail the entire request if batch assignment fails
    }

    // Populate user data (removed temporarily to avoid schema registration issue)
    // alumni = await Alumni.findById(alumni._id).populate("userId", "firstName lastName email profilePicture college");

    res.json({
      message: "Profile updated successfully",
      alumni,
    });
  } catch (error) {
    console.error("Update alumni profile by user ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchAlumni: RequestHandler = async (req, res) => {
  try {
    const { q, industry, location, skills } = req.query;

    const query: any = {};

    // Text search
    if (q) {
      query.$or = [
        { "userId.firstName": { $regex: q as string, $options: "i" } },
        { "userId.lastName": { $regex: q as string, $options: "i" } },
        { currentCompany: { $regex: q as string, $options: "i" } },
        { currentPosition: { $regex: q as string, $options: "i" } },
        { bio: { $regex: q as string, $options: "i" } },
      ];
    }

    // Apply filters
    if (industry) {
      query.industry = { $regex: industry as string, $options: "i" };
    }

    if (location) {
      query["location.city"] = { $regex: location as string, $options: "i" };
    }

    if (skills) {
      const skillsArray = (skills as string).split(",");
      query.skills = { $in: skillsArray };
    }

    const alumni = await Alumni.find(query)
      // .populate("userId", "firstName lastName email profilePicture")
      .limit(20)
      .sort({ createdAt: -1 });

    res.json(alumni);
  } catch (error) {
    console.error("Search alumni error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMentors: RequestHandler = async (req, res) => {
  try {
    const { interests } = req.query;

    const query: any = { isAvailableForMentoring: true };

    if (interests) {
      const interestsArray = (interests as string).split(",");
      query.mentoringInterests = { $in: interestsArray };
    }

    const mentors = await Alumni.find(query)
      .populate("userId", "_id firstName lastName email profilePicture college")
      .limit(20)
      .sort({ createdAt: -1 });

    res.json(mentors);
  } catch (error) {
    console.error("Get mentors error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

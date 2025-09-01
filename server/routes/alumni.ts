import { RequestHandler } from "express";
import { Alumni } from "../models/Alumni";
import { User } from "../models/User";

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
      .populate("userId", "firstName lastName email profilePicture")
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

    const alumni = await Alumni.findById(id).populate("userId", "firstName lastName email profilePicture");
    if (!alumni) {
      return res.status(404).json({ error: "Alumni not found" });
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

    const alumni = await Alumni.findByIdAndUpdate(id, updateData, { new: true })
      .populate("userId", "firstName lastName email profilePicture");

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
      .populate("userId", "firstName lastName email profilePicture")
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
      .populate("userId", "firstName lastName email profilePicture")
      .limit(20)
      .sort({ createdAt: -1 });

    res.json(mentors);
  } catch (error) {
    console.error("Get mentors error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

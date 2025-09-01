import { RequestHandler } from "express";
import { Student } from "../models/Student";
import { User } from "../models/User";

export const getAllStudents: RequestHandler = async (req, res) => {
  try {
    const { page = 1, limit = 10, major, year, lookingForMentorship } = req.query;

    const query: any = {};

    // Apply filters
    if (major) {
      query.major = { $regex: major as string, $options: "i" };
    }

    if (year) {
      query.currentYear = Number(year);
    }

    if (lookingForMentorship === "true") {
      query.isLookingForMentorship = true;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const students = await Student.find(query)
      .populate("userId", "firstName lastName email profilePicture")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(query);

    res.json({
      students,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        hasNext: skip + students.length < total,
        hasPrev: Number(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get all students error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStudentById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id).populate("userId", "firstName lastName email profilePicture");
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    console.error("Get student by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateStudentProfile: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const student = await Student.findByIdAndUpdate(id, updateData, { new: true })
      .populate("userId", "firstName lastName email profilePicture");

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      message: "Profile updated successfully",
      student,
    });
  } catch (error) {
    console.error("Update student profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchStudents: RequestHandler = async (req, res) => {
  try {
    const { q, major, skills, interests } = req.query;

    const query: any = {};

    // Text search
    if (q) {
      query.$or = [
        { "userId.firstName": { $regex: q as string, $options: "i" } },
        { "userId.lastName": { $regex: q as string, $options: "i" } },
        { major: { $regex: q as string, $options: "i" } },
        { minor: { $regex: q as string, $options: "i" } },
      ];
    }

    // Apply filters
    if (major) {
      query.major = { $regex: major as string, $options: "i" };
    }

    if (skills) {
      const skillsArray = (skills as string).split(",");
      query.skills = { $in: skillsArray };
    }

    if (interests) {
      const interestsArray = (interests as string).split(",");
      query.interests = { $in: interestsArray };
    }

    const students = await Student.find(query)
      .populate("userId", "firstName lastName email profilePicture")
      .limit(20)
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    console.error("Search students error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStudentsLookingForMentorship: RequestHandler = async (req, res) => {
  try {
    const { interests } = req.query;

    const query: any = { isLookingForMentorship: true };

    if (interests) {
      const interestsArray = (interests as string).split(",");
      query.mentorshipInterests = { $in: interestsArray };
    }

    const students = await Student.find(query)
      .populate("userId", "firstName lastName email profilePicture")
      .limit(20)
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    console.error("Get students looking for mentorship error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

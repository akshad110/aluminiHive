import { RequestHandler } from "express";
import { Alumni } from "../models/Alumni";
import { Student } from "../models/Student";
import { Message } from "../models/Message";
import { DashboardStats } from "../../shared/api";

export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    // Count available mentors (alumni who have isAvailableForMentoring = true)
    const availableMentors = await Alumni.countDocuments({ 
      isAvailableForMentoring: true 
    });

    // Count students looking for mentorship
    const studentsLookingForMentorship = await Student.countDocuments({ 
      isLookingForMentorship: true 
    });

    // Count active chats (conversations with messages in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeChats = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ["$sender", "$receiver"] },
              { sender: "$sender", receiver: "$receiver" },
              { sender: "$receiver", receiver: "$sender" }
            ]
          }
        }
      },
      {
        $count: "activeChats"
      }
    ]);

    const activeChatsCount = activeChats.length > 0 ? activeChats[0].activeChats : 0;
    const upcomingEvents = 0; // TODO: Implement when events system is added

    // Count total unique skills across all alumni and students
    const alumniSkills = await Alumni.distinct("skills");
    const studentSkills = await Student.distinct("skills");
    const allSkills = [...new Set([...alumniSkills, ...studentSkills])];
    const skillsLearned = allSkills.length;

    const stats: DashboardStats = {
      availableMentors,
      activeChats: activeChatsCount,
      upcomingEvents,
      skillsLearned,
    };

    res.json(stats);
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

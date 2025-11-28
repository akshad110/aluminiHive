import { RequestHandler } from "express";
import mongoose from "mongoose";
import { BatchChatMessage, Batch, User } from "../models";

// Get messages for a batch
export const getBatchMessages: RequestHandler = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { page = 1, limit = 50, userId } = req.query;

    console.log("📥 Fetching messages for batch:", { batchId, userId, page, limit });

    // Validate required parameters
    if (!userId) {
      console.log("❌ Missing userId parameter");
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get user info to check role
    const { User: UserModel } = await import("../models/User");
    const user = await UserModel.findById(userId);
    if (!user) {
      console.log("❌ User not found:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    // Verify batch exists
    const batch = await Batch.findById(batchId).populate("members");
    if (!batch) {
      console.log("❌ Batch not found:", batchId);
      return res.status(404).json({ error: "Batch not found" });
    }

    console.log("✅ Batch found:", batch.name, "Members:", batch.members.length);
    
    // Check if user is a member or a student (students can view but not send)
    const isMember = batch.members.some((member: any) => member._id.toString() === userId);
    const isStudent = user.role === "student";
    
    if (!isMember && !isStudent) {
      console.log("❌ User not authorized:", userId, "Role:", user.role, "Batch members:", batch.members.map((m: any) => m._id.toString()));
      return res.status(403).json({ error: "Access denied. You are not authorized to view this batch." });
    }
    
    console.log("✅ User is authorized to view batch:", { isMember, isStudent, role: user.role });

    // Get messages with pagination
    const messages = await BatchChatMessage.find({
      batchId: new mongoose.Types.ObjectId(batchId),
      isDeleted: false,
    })
      .populate("senderId", "firstName lastName profilePicture")
      .populate("reactions.userId", "firstName lastName")
      .populate("replies.senderId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(limit as number * 1)
      .skip((page as number - 1) * (limit as number));

    console.log("📨 Found messages:", messages.length, "for batch:", batchId);

    // Mark messages as read for this user
    await BatchChatMessage.updateMany(
      {
        batchId: new mongoose.Types.ObjectId(batchId),
        isDeleted: false,
        "readBy.userId": { $ne: new mongoose.Types.ObjectId(userId as string) }
      },
      {
        $push: {
          readBy: {
            userId: new mongoose.Types.ObjectId(userId as string),
            readAt: new Date()
          }
        }
      }
    );

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === (limit as number),
    });
  } catch (error) {
    console.error("❌ Error fetching batch messages:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      batchId: req.params.batchId,
      userId: req.query.userId
    });
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send a message to batch
export const sendBatchMessage: RequestHandler = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Handle both JSON and FormData requests
    let userId, content, messageType = "text", mediaUrl, fileName, fileSize;
    
    // Check if file was uploaded
    const file = req.file;
    
    if (file) {
      // File upload request
      userId = req.body.userId;
      content = req.body.content || `📎 ${file.originalname}`; // Default content for file messages
      messageType = req.body.messageType || "file";
      fileName = file.originalname;
      fileSize = file.size;
      
      // For now, we'll store file info without actual file storage
      // In production, you'd upload to cloud storage (AWS S3, etc.)
      mediaUrl = `/uploads/${Date.now()}-${file.originalname}`;
    } else {
      // Text message request
      ({ userId, content, messageType = "text", mediaUrl, fileName, fileSize } = req.body || {});
    }

    console.log("📨 Send message request:", { batchId, userId, content, messageType });

    // Validate required fields
    if (messageType === "text" && (!content || !content.trim())) {
      console.log("❌ Content validation failed:", { content, type: typeof content });
      return res.status(400).json({ error: "Message content is required" });
    }
    if (messageType === "file" && !fileName) {
      console.log("❌ File validation failed:", { fileName, type: typeof fileName });
      return res.status(400).json({ error: "File is required" });
    }
    // Ensure content is not empty for all message types
    if (!content || !content.trim()) {
      console.log("❌ Content validation failed:", { content, type: typeof content });
      return res.status(400).json({ error: "Message content is required" });
    }
    if (!userId) {
      console.log("❌ User ID validation failed:", { userId, type: typeof userId });
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get user info to check role
    const { User: UserModel } = await import("../models/User");
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify batch exists
    const batch = await Batch.findById(batchId).populate("members");
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Check if user is a member (only members can send messages)
    const isMember = batch.members.some((member: any) => member._id.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: "Access denied. Only batch members can send messages." });
    }

    // Create new message
    const message = new BatchChatMessage({
      batchId: new mongoose.Types.ObjectId(batchId),
      senderId: new mongoose.Types.ObjectId(userId),
      messageType,
      content,
      mediaUrl,
      fileName,
      fileSize,
      reactions: [],
      replies: [],
      readBy: [{
        userId: new mongoose.Types.ObjectId(userId),
        readAt: new Date()
      }],
    });

    console.log("💾 Saving message:", { content, messageType, batchId, userId });
    await message.save();
    console.log("✅ Message saved successfully:", message._id);

    // Populate the message with sender info
    const populatedMessage = await BatchChatMessage.findById(message._id)
      .populate("senderId", "firstName lastName profilePicture");

    res.status(201).json({
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("❌ Error sending batch message:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      batchId: req.params.batchId,
      userId: req.body.userId,
      content: req.body.content
    });
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add reaction to message
export const addMessageReaction: RequestHandler = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;

    // Models are already imported at module level

    const message = await BatchChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      (reaction: any) => reaction.userId.toString() !== userId
    );

    // Add new reaction
    message.reactions.push({
      emoji,
      userId: new mongoose.Types.ObjectId(userId),
      timestamp: new Date(),
    });

    await message.save();

    const populatedMessage = await BatchChatMessage.findById(messageId)
      .populate("senderId", "firstName lastName profilePicture")
      .populate("reactions.userId", "firstName lastName");

    res.json({
      message: "Reaction added successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error adding reaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reply to a message
export const replyToMessage: RequestHandler = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, content, replyToMessageId } = req.body;

    // Models are already imported at module level

    const originalMessage = await BatchChatMessage.findById(replyToMessageId);
    if (!originalMessage) {
      return res.status(404).json({ error: "Original message not found" });
    }

    // Add reply to original message
    originalMessage.replies.push({
      messageId: new mongoose.Types.ObjectId(messageId),
      content,
      senderId: new mongoose.Types.ObjectId(userId),
      timestamp: new Date(),
    });

    await originalMessage.save();

    const populatedMessage = await BatchChatMessage.findById(replyToMessageId)
      .populate("senderId", "firstName lastName profilePicture")
      .populate("replies.senderId", "firstName lastName");

    res.json({
      message: "Reply added successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Edit a message
export const editMessage: RequestHandler = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, content } = req.body;

    // Models are already imported at module level

    const message = await BatchChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    const populatedMessage = await BatchChatMessage.findById(messageId)
      .populate("senderId", "firstName lastName profilePicture")
      .populate("reactions.userId", "firstName lastName");

    res.json({
      message: "Message edited successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a message
export const deleteMessage: RequestHandler = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    // Models are already imported at module level

    const message = await BatchChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = "This message was deleted";

    await message.save();

    res.json({
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get batch chat info
export const getBatchChatInfo: RequestHandler = async (req, res) => {
  try {
    // Models are already imported at module level

    const { batchId } = req.params;

    const batch = await Batch.findById(batchId)
      .populate("members", "firstName lastName profilePicture role")
      .populate({
        path: "members",
        populate: {
          path: "batch",
          select: "name graduationYear"
        }
      });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Get last message
    const lastMessage = await BatchChatMessage.findOne({
      batchId: new mongoose.Types.ObjectId(batchId),
      isDeleted: false,
    })
      .populate("senderId", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({
      batch,
      lastMessage,
      memberCount: batch.members.length,
    });
  } catch (error) {
    console.error("Error fetching batch chat info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get chat settings for a batch
export const getChatSettings: RequestHandler = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Verify user is member of the batch
    const batch = await Batch.findById(batchId).populate("members");
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const isMember = batch.members.some((member: any) => member._id.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: "Access denied. You are not a member of this batch." });
    }

    // Get chat statistics
    const totalMessages = await BatchChatMessage.countDocuments({
      batchId: new mongoose.Types.ObjectId(batchId),
      isDeleted: false,
    });

    const unreadCount = await BatchChatMessage.countDocuments({
      batchId: new mongoose.Types.ObjectId(batchId),
      isDeleted: false,
      "readBy.userId": { $ne: new mongoose.Types.ObjectId(userId as string) }
    });

    // Default chat settings (in a real app, these would be stored in user preferences)
    const chatSettings = {
      notifications: true,
      soundEnabled: true,
      showOnlineStatus: true,
      messagePreview: true,
      autoDownloadMedia: false,
      theme: "light",
      fontSize: "medium",
      language: "en"
    };

    res.json({
      chatSettings,
      statistics: {
        totalMessages,
        unreadCount,
        memberCount: batch.members.length,
        lastActivity: batch.updatedAt
      }
    });
  } catch (error) {
    console.error("Error fetching chat settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update chat settings
export const updateChatSettings: RequestHandler = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { userId, settings } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Verify user is member of the batch
    const batch = await Batch.findById(batchId).populate("members");
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const isMember = batch.members.some((member: any) => member._id.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: "Access denied. You are not a member of this batch." });
    }

    // In a real app, you would save these settings to a user preferences collection
    // For now, we'll just return the updated settings
    const updatedSettings = {
      notifications: settings.notifications ?? true,
      soundEnabled: settings.soundEnabled ?? true,
      showOnlineStatus: settings.showOnlineStatus ?? true,
      messagePreview: settings.messagePreview ?? true,
      autoDownloadMedia: settings.autoDownloadMedia ?? false,
      theme: settings.theme ?? "light",
      fontSize: settings.fontSize ?? "medium",
      language: settings.language ?? "en"
    };

    res.json({
      message: "Chat settings updated successfully",
      settings: updatedSettings
    });
  } catch (error) {
    console.error("Error updating chat settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get detailed batch information
export const getBatchDetails: RequestHandler = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Verify user is member of the batch
    const batch = await Batch.findById(batchId)
      .populate("members", "firstName lastName email role profilePicture college")
      .populate({
        path: "members",
        populate: {
          path: "batch",
          select: "name graduationYear"
        }
      });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const isMember = batch.members.some((member: any) => member._id.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: "Access denied. You are not a member of this batch." });
    }

    // Get additional statistics
    const totalMessages = await BatchChatMessage.countDocuments({
      batchId: new mongoose.Types.ObjectId(batchId),
      isDeleted: false,
    });

    const recentMessages = await BatchChatMessage.find({
      batchId: new mongoose.Types.ObjectId(batchId),
      isDeleted: false,
    })
      .populate("senderId", "firstName lastName profilePicture")
      .sort({ createdAt: -1 })
      .limit(5);

    // Group members by role
    const membersByRole = batch.members.reduce((acc: any, member: any) => {
      const role = member.role || 'student';
      if (!acc[role]) acc[role] = [];
      acc[role].push(member);
      return acc;
    }, {});

    res.json({
      batch: {
        _id: batch._id,
        name: batch.name,
        college: batch.college,
        graduationYear: batch.graduationYear,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt
      },
      members: batch.members,
      membersByRole,
      statistics: {
        totalMembers: batch.members.length,
        alumniCount: batch.alumniCount,
        studentCount: batch.studentCount,
        totalMessages,
        lastMessage: recentMessages[0] || null
      },
      recentActivity: recentMessages
    });
  } catch (error) {
    console.error("Error fetching batch details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


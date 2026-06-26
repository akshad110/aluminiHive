import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Message, User, PerAlumniMessageLimit, AlumniSubscription, QuarterlySubscription } from "../models";
import { MessageLimit } from "../models/MessageLimit";
import { Subscription } from "../models/Subscription";
import multer from "multer";
import path from "path";
import fs from "fs";

// Get conversation between two users
export const getConversation: RequestHandler = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify both users exist
    const [user1, user2] = await Promise.all([
      User.findById(userId),
      User.findById(otherUserId)
    ]);

    if (!user1 || !user2) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    })
    .populate("sender", "firstName lastName profilePicture")
    .populate("receiver", "firstName lastName profilePicture")
    .sort({ createdAt: -1 })
    .limit(limit as number * 1)
    .skip((page as number - 1) * (limit as number));

    // Mark messages as read for the current user
    await Message.updateMany(
      { receiver: userId, sender: otherUserId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      messages: messages.reverse(), // Return in chronological order
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
};

// Send a message
export const sendMessage: RequestHandler = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    const { content, messageType = "text" } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Verify both users exist
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    // Check per-alumni message limits for students
    if (sender.role === "student") {
      // Check if receiver is an alumni
      const receiverUser = await User.findById(receiverId);
      if (receiverUser?.role === "alumni") {
        // Get or create per-alumni message limit
        let perAlumniLimit = await (PerAlumniMessageLimit as any).findOne({ 
          studentId: senderId, 
          alumniId: receiverId 
        });
        
        if (!perAlumniLimit) {
          perAlumniLimit = new PerAlumniMessageLimit({
            studentId: senderId,
            alumniId: receiverId,
            messageCount: 0,
            lastResetDate: new Date(),
            isSubscribed: false
          });
          await perAlumniLimit.save();
        }

        // Check for active subscription to this specific alumni
        const activeSubscription = await (AlumniSubscription as any).findOne({
          studentId: senderId,
          alumniId: receiverId,
          status: "active",
          endDate: { $gt: new Date() }
        });

        // Check for quarterly subscription (access to ALL alumni)
        const quarterlySubscription = await (QuarterlySubscription as any).findOne({
          studentId: senderId,
          status: "active",
          endDate: { $gt: new Date() }
        });

        const isSubscribed = activeSubscription || quarterlySubscription || perAlumniLimit.isSubscribed;
        
        if (!isSubscribed && perAlumniLimit.messageCount >= 5) {
          return res.status(429).json({ 
            error: "Message limit reached for this alumni", 
            message: `You have reached your limit of 5 messages with this alumni. Subscribe to continue messaging.`,
            remainingMessages: 0,
            requiresSubscription: true,
            alumniId: receiverId,
            alumniName: `${receiverUser.firstName} ${receiverUser.lastName}`
          });
        }

        // Increment per-alumni message count
        perAlumniLimit.messageCount += 1;
        await perAlumniLimit.save();
      }
    }

    // Create new message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
      messageType,
    });

    await message.save();
    await message.populate("sender", "firstName lastName profilePicture");
    await message.populate("receiver", "firstName lastName profilePicture");

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Get user's conversations (list of people they've messaged)
export const getConversations: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("❌ Invalid userId:", userId);
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if user exists - try both ObjectId and string
    let userExists = await User.findById(userId);
    if (!userExists) {
      // Try finding by string ID
      userExists = await User.findOne({ _id: userId });
    }
    if (!userExists) {
      // Try finding by string ID as string
      userExists = await User.findOne({ _id: userId.toString() });
    }
    if (!userExists) {
      // Log all users for debugging
      const allUsers = await User.find({}).limit(5).select("_id email");
      console.error("❌ User not found:", userId);
      console.error("📋 Available users:", allUsers.map(u => ({ _id: u._id.toString(), email: u.email })));
      return res.status(404).json({ error: "User not found" });
    }

    console.log("🔍 Fetching conversations for user:", userId);

    // First, let's check what messages exist for this user using a simple query
    const directMessages = await Message.find({
      $or: [
        { sender: new mongoose.Types.ObjectId(userId) },
        { receiver: new mongoose.Types.ObjectId(userId) }
      ]
    }).limit(5);
    console.log("📨 Direct messages found:", directMessages.length);
    if (directMessages.length > 0) {
      console.log("📨 Sample message:", {
        sender: directMessages[0].sender,
        receiver: directMessages[0].receiver,
        content: directMessages[0].content?.substring(0, 50)
      });
    }

    // Get all unique users this person has messaged or been messaged by
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", new mongoose.Types.ObjectId(userId)] },
                    { $eq: ["$isRead", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users", // Mongoose pluralizes "User" to "users"
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          otherUser: {
            _id: "$user._id",
            firstName: "$user.firstName",
            lastName: "$user.lastName",
            profilePicture: "$user.profilePicture",
            role: "$user.role"
          },
          lastMessage: {
            content: "$lastMessage.content",
            createdAt: "$lastMessage.createdAt",
            messageType: "$lastMessage.messageType"
          },
          unreadCount: 1,
          updatedAt: "$lastMessage.createdAt"
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);

    // Check total messages in database for debugging
    const totalMessages = await Message.countDocuments({});
    console.log("📊 Total messages in database:", totalMessages);
    
    // Check messages for this specific user with raw query
    const userMessagesCount = await Message.countDocuments({
      $or: [
        { sender: new mongoose.Types.ObjectId(userId) },
        { receiver: new mongoose.Types.ObjectId(userId) }
      ]
    });
    console.log("📊 Messages for this user (count):", userMessagesCount);
    
    // Also check using raw MongoDB collection
    const db = mongoose.connection.db;
    if (db) {
      const messagesCollection = db.collection('messages');
      const rawCount = await messagesCollection.countDocuments({
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { receiver: new mongoose.Types.ObjectId(userId) }
        ]
      });
      console.log("📊 Raw MongoDB query count:", rawCount);
      
      // Get a sample message to see the structure
      const sampleMsg = await messagesCollection.findOne({
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { receiver: new mongoose.Types.ObjectId(userId) }
        ]
      });
      if (sampleMsg) {
        console.log("📋 Sample message structure:", {
          sender: sampleMsg.sender,
          receiver: sampleMsg.receiver,
          senderType: typeof sampleMsg.sender,
          receiverType: typeof sampleMsg.receiver
        });
      }
    }

    console.log("📨 Found", conversations.length, "conversations for user:", userId);
    
    // If aggregation returns empty, try a simpler approach
    if (conversations.length === 0) {
      console.log("⚠️ Aggregation returned 0, trying alternative query method...");
      
      // Alternative: Get all messages and group manually
      const allMessages = await Message.find({
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { receiver: new mongoose.Types.ObjectId(userId) }
        ]
      })
      .populate("sender", "firstName lastName profilePicture role")
      .populate("receiver", "firstName lastName profilePicture role")
      .sort({ createdAt: -1 })
      .limit(100);
      
      console.log("📨 Alternative query found", allMessages.length, "messages");
      
      // Group by other user
      const conversationMap = new Map();
      for (const msg of allMessages) {
        // Type guard: ensure sender and receiver are populated
        const sender = typeof msg.sender === 'object' && 'firstName' in msg.sender 
          ? msg.sender as any 
          : null;
        const receiver = typeof msg.receiver === 'object' && 'firstName' in msg.receiver 
          ? msg.receiver as any 
          : null;
        
        if (!sender || !receiver) {
          console.warn('Message sender or receiver not populated:', msg._id);
          continue;
        }
        
        const otherUserId = sender._id.toString() === userId 
          ? receiver._id.toString() 
          : sender._id.toString();
        
        if (!conversationMap.has(otherUserId)) {
          const otherUser = sender._id.toString() === userId ? receiver : sender;
          conversationMap.set(otherUserId, {
            otherUser: {
              _id: otherUser._id,
              firstName: otherUser.firstName,
              lastName: otherUser.lastName,
              profilePicture: otherUser.profilePicture,
              role: otherUser.role
            },
            lastMessage: {
              content: msg.content,
              createdAt: msg.createdAt,
              messageType: msg.messageType
            },
            unreadCount: 0,
            updatedAt: msg.createdAt
          });
        }
      }
      
      const alternativeConversations = Array.from(conversationMap.values());
      console.log("💬 Alternative method found", alternativeConversations.length, "conversations");
      
      if (alternativeConversations.length > 0) {
        return res.json({ conversations: alternativeConversations });
      }
    } else {
      console.log("💬 Conversations data (first 2):", JSON.stringify(conversations.slice(0, 2), null, 2));
    }

    res.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

// Mark messages as read
export const markAsRead: RequestHandler = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    await Message.updateMany(
      { receiver: userId, sender: otherUserId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'files');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload file for personal message
export const uploadMessageFile: RequestHandler = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Verify both users exist
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    // Check per-alumni message limits for students
    if (sender.role === "student") {
      // Check if receiver is an alumni
      const receiverUser = await User.findById(receiverId);
      if (receiverUser?.role === "alumni") {
        // Get or create per-alumni message limit
        let perAlumniLimit = await (PerAlumniMessageLimit as any).findOne({ 
          studentId: senderId, 
          alumniId: receiverId 
        });
        
        if (!perAlumniLimit) {
          perAlumniLimit = new PerAlumniMessageLimit({
            studentId: senderId,
            alumniId: receiverId,
            messageCount: 0,
            lastResetDate: new Date(),
            isSubscribed: false
          });
          await perAlumniLimit.save();
        }

        // Check for active subscription to this specific alumni
        const activeSubscription = await (AlumniSubscription as any).findOne({
          studentId: senderId,
          alumniId: receiverId,
          status: "active",
          endDate: { $gt: new Date() }
        });

        // Check for quarterly subscription (access to ALL alumni)
        const quarterlySubscription = await (QuarterlySubscription as any).findOne({
          studentId: senderId,
          status: "active",
          endDate: { $gt: new Date() }
        });

        const isSubscribed = activeSubscription || quarterlySubscription || perAlumniLimit.isSubscribed;
        
        if (!isSubscribed && perAlumniLimit.messageCount >= 5) {
          return res.status(429).json({ 
            error: "Message limit reached for this alumni", 
            message: `You have reached your limit of 5 messages with this alumni. Subscribe to continue messaging.`,
            remainingMessages: 0,
            requiresSubscription: true,
            alumniId: receiverId,
            alumniName: `${receiverUser.firstName} ${receiverUser.lastName}`
          });
        }

        // Increment per-alumni message count
        perAlumniLimit.messageCount += 1;
        await perAlumniLimit.save();
      }
    }

    // Create new message with file
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: file.filename,
      messageType: "file",
      fileUrl: `/api/files/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype
    });

    await message.save();
    await message.populate("sender", "firstName lastName profilePicture");
    await message.populate("receiver", "firstName lastName profilePicture");

    res.status(201).json({
      message: "File uploaded successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
};

export { upload };

import { RequestHandler } from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Batch } from "../models";
import { BatchService } from "../services/batchService";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'files');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    console.log("📁 Upload directory:", uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log("📁 Generated filename:", filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    console.log("📁 File filter check:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extname: path.extname(file.originalname).toLowerCase(),
      extnameMatch: extname,
      mimetypeMatch: mimetype
    });
    
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

// Get all batches
export const getAllBatches: RequestHandler = async (req, res) => {
  try {
    // Force model registration - import and register immediately
    if (!mongoose.models.User) {
      const { User } = await import("../models/User");
      mongoose.model("User", User.schema);
    }
    if (!mongoose.models.Batch) {
      const { Batch } = await import("../models/Batch");
      mongoose.model("Batch", Batch.schema);
    }
    
    const { page = 1, limit = 10, college, graduationYear } = req.query;
    
    const query: any = {};
    
    if (college) {
      query.college = { $regex: college as string, $options: "i" };
    }
    
    if (graduationYear) {
      query.graduationYear = parseInt(graduationYear as string);
    }

    const batches = await Batch.find(query)
      .populate("members", "firstName lastName email role profilePicture")
      .sort({ graduationYear: -1, college: 1 })
      .limit(limit as number * 1)
      .skip((page as number - 1) * (limit as number));

    const total = await Batch.countDocuments(query);

    res.json({
      batches,
      totalPages: Math.ceil(total / (limit as number)),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get batch by ID
export const getBatchById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const batch = await BatchService.getBatchWithMembers(id);
    
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json({ batch });
  } catch (error) {
    console.error("Error fetching batch:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get batches by college
export const getBatchesByCollege: RequestHandler = async (req, res) => {
  try {
    const { college } = req.params;
    
    const batches = await BatchService.getBatchesByCollege(college);
    
    res.json({ batches });
  } catch (error) {
    console.error("Error fetching batches by college:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get batch statistics
export const getBatchStats: RequestHandler = async (req, res) => {
  try {
    const stats = await BatchService.getBatchStats();
    
    res.json({ stats });
  } catch (error) {
    console.error("Error fetching batch stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new batch manually
export const createBatch: RequestHandler = async (req, res) => {
  try {
    const { college, graduationYear } = req.body;
    
    if (!college || !graduationYear) {
      return res.status(400).json({ error: "College and graduation year are required" });
    }

    const batch = await BatchService.createOrFindBatch(college, graduationYear);
    
    res.status(201).json({
      message: "Batch created successfully",
      batch,
    });
  } catch (error) {
    console.error("Error creating batch:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update batch information
export const updateBatch: RequestHandler = async (req, res) => {
  try {
    // Models are already imported at module level
    
    const { id } = req.params;
    const updateData = req.body;
    
    const batch = await Batch.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("members", "firstName lastName email role");
    
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json({
      message: "Batch updated successfully",
      batch,
    });
  } catch (error) {
    console.error("Error updating batch:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete batch
export const deleteBatch: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const batch = await Batch.findById(id);
    
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Remove batch reference from all users
    await Batch.updateMany(
      { _id: id },
      { $unset: { batch: 1 } }
    );

    await Batch.findByIdAndDelete(id);

    res.json({
      message: "Batch deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting batch:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Upload file for batch chat
export const uploadBatchFile: RequestHandler = async (req, res) => {
  try {
    console.log("📁 File upload request received");
    console.log("📁 Request body:", req.body);
    console.log("📁 Request file:", req.file);
    console.log("📁 Request params:", req.params);
    
    const { batchId } = req.params;
    const { userId } = req.body;
    
    console.log("📁 Batch ID:", batchId);
    console.log("📁 User ID:", userId);
    
    if (!userId) {
      console.log("❌ No user ID provided");
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("📁 File details:", {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Import BatchChatMessage model
    let BatchChatMessage;
    try {
      if (!mongoose.models.BatchChatMessage) {
        const { BatchChatMessage: BatchChatMessageModel } = await import("../models/BatchChat");
        BatchChatMessage = mongoose.model("BatchChatMessage", BatchChatMessageModel.schema);
      } else {
        BatchChatMessage = mongoose.model("BatchChatMessage");
      }
      console.log("📁 BatchChatMessage model loaded successfully");
    } catch (modelError) {
      console.error("❌ Error loading BatchChatMessage model:", modelError);
      return res.status(500).json({ error: "Failed to load BatchChatMessage model" });
    }

    // Create message with file
    try {
      const message = new BatchChatMessage({
        batchId: new mongoose.Types.ObjectId(batchId),
        senderId: new mongoose.Types.ObjectId(userId),
        content: req.file.originalname, // Use original filename for display
        messageType: "file",
        mediaUrl: `/api/files/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        reactions: [],
        replies: [],
        isEdited: false,
        isDeleted: false,
        readBy: [],
      });

      console.log("📁 Creating message:", message);
      await message.save();
      console.log("📁 Message saved successfully");

      // Populate sender info
      const populatedMessage = await BatchChatMessage.findById(message._id)
        .populate("senderId", "firstName lastName profilePicture");
      console.log("📁 Message populated:", populatedMessage);

      res.json({
        message: "File uploaded successfully",
        data: populatedMessage,
      });
    } catch (messageError) {
      console.error("❌ Error creating/saving message:", messageError);
      return res.status(500).json({ error: "Failed to create message" });
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Export multer middleware
export { upload };

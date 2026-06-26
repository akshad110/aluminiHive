import mongoose, { Document, Schema } from "mongoose";

export interface IBatchChatMessage extends Document {
  batchId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  messageType: "text" | "image" | "file" | "system";
  content: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  reactions: {
    emoji: string;
    userId: mongoose.Types.ObjectId;
    timestamp: Date;
  }[];
  replies: {
    messageId: mongoose.Types.ObjectId;
    content: string;
    senderId: mongoose.Types.ObjectId;
    timestamp: Date;
  }[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const batchChatMessageSchema = new Schema<IBatchChatMessage>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
    },
    reactions: [{
      emoji: {
        type: String,
        required: true,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
    replies: [{
      messageId: {
        type: Schema.Types.ObjectId,
        ref: "BatchChatMessage",
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      senderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    readBy: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
batchChatMessageSchema.index({ batchId: 1, createdAt: -1 });
batchChatMessageSchema.index({ senderId: 1 });
batchChatMessageSchema.index({ isDeleted: 1 });

export const BatchChatMessage = (mongoose.models.BatchChatMessage as mongoose.Model<IBatchChatMessage>) || 
  mongoose.model<IBatchChatMessage>("BatchChatMessage", batchChatMessageSchema);

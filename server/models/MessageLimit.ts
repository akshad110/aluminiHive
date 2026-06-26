import mongoose, { Document, Schema } from "mongoose";

export interface IMessageLimit extends Document {
  userId: mongoose.Types.ObjectId;
  dailyMessageCount: number;
  lastResetDate: Date;
  totalMessagesSent: number;
  subscriptionStatus: "free" | "premium";
  subscriptionExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageLimitSchema = new Schema<IMessageLimit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dailyMessageCount: {
      type: Number,
      default: 0,
      max: 5, // Free limit
    },
    lastResetDate: {
      type: Date,
      default: Date.now,
    },
    totalMessagesSent: {
      type: Number,
      default: 0,
    },
    subscriptionStatus: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    subscriptionExpiry: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Reset daily count if it's a new day
messageLimitSchema.pre("save", function (next) {
  const now = new Date();
  const lastReset = new Date(this.lastResetDate);
  
  // Check if it's a new day
  if (now.toDateString() !== lastReset.toDateString()) {
    this.dailyMessageCount = 0;
    this.lastResetDate = now;
  }
  
  next();
});

export const MessageLimit = (mongoose.models.MessageLimit as mongoose.Model<IMessageLimit>) || 
  mongoose.model<IMessageLimit>("MessageLimit", messageLimitSchema);

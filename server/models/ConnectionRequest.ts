import mongoose, { Schema, Document } from "mongoose";

export interface IConnectionRequest extends Document {
  requester: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const connectionRequestSchema = new Schema<IConnectionRequest>({
  requester: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  message: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
connectionRequestSchema.index({ requester: 1, recipient: 1 });
connectionRequestSchema.index({ recipient: 1, status: 1 });

export const ConnectionRequest = (mongoose.models.ConnectionRequest as mongoose.Model<IConnectionRequest>) || mongoose.model<IConnectionRequest>("ConnectionRequest", connectionRequestSchema);

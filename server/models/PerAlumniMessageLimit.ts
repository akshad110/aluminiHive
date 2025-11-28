import mongoose, { Document, Schema } from "mongoose";

export interface IPerAlumniMessageLimit extends Document {
  studentId: string;
  alumniId: string;
  messageCount: number;
  lastResetDate: Date;
  isSubscribed: boolean;
  subscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PerAlumniMessageLimitSchema = new Schema<IPerAlumniMessageLimit>({
  studentId: {
    type: String,
    required: true,
    ref: "User"
  },
  alumniId: {
    type: String,
    required: true,
    ref: "User"
  },
  messageCount: {
    type: Number,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  isSubscribed: {
    type: Boolean,
    default: false
  },
  subscriptionId: {
    type: String,
    ref: "Subscription"
  }
}, {
  timestamps: true
});

// Compound index to ensure one record per student-alumni pair
PerAlumniMessageLimitSchema.index({ studentId: 1, alumniId: 1 }, { unique: true });

export const PerAlumniMessageLimit = mongoose.models.PerAlumniMessageLimit || 
  mongoose.model<IPerAlumniMessageLimit>("PerAlumniMessageLimit", PerAlumniMessageLimitSchema);

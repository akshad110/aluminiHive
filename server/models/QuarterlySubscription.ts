import mongoose, { Document, Schema } from "mongoose";

export interface IQuarterlySubscription extends Document {
  studentId: string;
  subscriptionType: "quarterly";
  amount: number;
  platformCommission: number; // Amount platform keeps
  status: "active" | "expired" | "cancelled";
  startDate: Date;
  endDate: Date;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuarterlySubscriptionSchema = new Schema<IQuarterlySubscription>({
  studentId: {
    type: String,
    required: true,
    ref: "User"
  },
  subscriptionType: {
    type: String,
    enum: ["quarterly"],
    default: "quarterly"
  },
  amount: {
    type: Number,
    required: true
  },
  platformCommission: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["active", "expired", "cancelled"],
    default: "active"
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  paymentId: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
QuarterlySubscriptionSchema.index({ studentId: 1 });
QuarterlySubscriptionSchema.index({ status: 1, endDate: 1 });

export const QuarterlySubscription = mongoose.models.QuarterlySubscription || 
  mongoose.model<IQuarterlySubscription>("QuarterlySubscription", QuarterlySubscriptionSchema);

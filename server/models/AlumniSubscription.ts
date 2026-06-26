import mongoose, { Document, Schema } from "mongoose";

export interface IAlumniSubscription extends Document {
  studentId: string;
  alumniId: string;
  subscriptionType: "monthly" | "yearly";
  amount: number;
  platformCommission: number; // Amount platform keeps
  alumniEarnings: number; // Amount alumni receives
  status: "active" | "expired" | "cancelled";
  startDate: Date;
  endDate: Date;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AlumniSubscriptionSchema = new Schema<IAlumniSubscription>({
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
  subscriptionType: {
    type: String,
    enum: ["monthly", "quarterly", "yearly"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  platformCommission: {
    type: Number,
    required: true
  },
  alumniEarnings: {
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

// Compound index for efficient queries
AlumniSubscriptionSchema.index({ studentId: 1, alumniId: 1 });
AlumniSubscriptionSchema.index({ status: 1, endDate: 1 });

export const AlumniSubscription = mongoose.models.AlumniSubscription || 
  mongoose.model<IAlumniSubscription>("AlumniSubscription", AlumniSubscriptionSchema);

import mongoose, { Document, Schema } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  targetUserId?: mongoose.Types.ObjectId; // For individual subscriptions
  subscriptionType: "individual" | "unlimited";
  status: "active" | "expired" | "cancelled";
  amount: number;
  currency: string;
  paymentId?: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    subscriptionType: {
      type: String,
      enum: ["individual", "unlimited"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    paymentId: {
      type: String,
      required: false,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = (mongoose.models.Subscription as mongoose.Model<ISubscription>) || 
  mongoose.model<ISubscription>("Subscription", subscriptionSchema);

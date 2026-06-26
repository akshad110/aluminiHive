import mongoose, { Document, Schema } from "mongoose";

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'mentorship_request' | 'event_scheduled' | 'rating_received' | 'profile_view' | 'event_created';
  title: string;
  description: string;
  metadata?: {
    studentName?: string;
    eventName?: string;
    rating?: number;
    menteeName?: string;
    viewerName?: string;
    eventId?: string;
  };
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ['mentorship_request', 'event_scheduled', 'rating_received', 'profile_view', 'event_created'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      studentName: String,
      eventName: String,
      rating: Number,
      menteeName: String,
      viewerName: String,
      eventId: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ userId: 1, isRead: 1 });

export const Activity = (mongoose.models.Activity as mongoose.Model<IActivity>) || mongoose.model<IActivity>("Activity", activitySchema);

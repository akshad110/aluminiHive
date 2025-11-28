import mongoose, { Document, Schema } from "mongoose";

export interface IMentorshipRequest extends Document {
  studentId: mongoose.Types.ObjectId;
  alumniId: mongoose.Types.ObjectId;
  category: 'career_guidance' | 'interview_prep' | 'project_help' | 'networking' | 'skill_development';
  title: string;
  description: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high';
  skillsNeeded: string[];
  expectedDuration: string; // e.g., "2 weeks", "1 month"
  preferredCommunication: 'email' | 'video_call' | 'in_person' | 'chat';
  studentMessage?: string;
  alumniResponse?: string;
  callHistory?: {
    callId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number; // in minutes
    callType: 'video' | 'audio';
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  }[];
  lastCallCompletedAt?: Date;
  totalCallDuration?: number; // total duration in minutes
  createdAt: Date;
  updatedAt: Date;
}

const mentorshipRequestSchema = new Schema<IMentorshipRequest>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    alumniId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: ['career_guidance', 'interview_prep', 'project_help', 'networking', 'skill_development'],
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
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    skillsNeeded: [{
      type: String,
      trim: true,
    }],
    expectedDuration: {
      type: String,
      required: true,
    },
    preferredCommunication: {
      type: String,
      enum: ['email', 'video_call', 'in_person', 'chat'],
      default: 'email',
    },
    studentMessage: {
      type: String,
      maxlength: 1000,
    },
    alumniResponse: {
      type: String,
      maxlength: 1000,
    },
    callHistory: [{
      callId: {
        type: String,
        required: true,
      },
      startTime: {
        type: Date,
        required: true,
      },
      endTime: {
        type: Date,
      },
      duration: {
        type: Number, // in minutes
      },
      callType: {
        type: String,
        enum: ['video', 'audio'],
        required: true,
      },
      status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled',
      },
    }],
    lastCallCompletedAt: {
      type: Date,
    },
    totalCallDuration: {
      type: Number, // total duration in minutes
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
mentorshipRequestSchema.index({ alumniId: 1, status: 1 });
mentorshipRequestSchema.index({ studentId: 1, status: 1 });
mentorshipRequestSchema.index({ category: 1 });
mentorshipRequestSchema.index({ createdAt: -1 });

export const MentorshipRequest = (mongoose.models.MentorshipRequest as mongoose.Model<IMentorshipRequest>) || mongoose.model<IMentorshipRequest>("MentorshipRequest", mentorshipRequestSchema);

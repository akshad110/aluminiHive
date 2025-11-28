import mongoose, { Document, Schema } from "mongoose";

export interface IMentorSession extends Document {
  mentorshipRequestId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  alumniId: mongoose.Types.ObjectId;
  sessionTitle: string;
  sessionDescription: string;
  category: 'career_guidance' | 'interview_prep' | 'project_help' | 'networking' | 'skill_development';
  skillsNeeded: string[];
  studentMessage?: string;
  sessionDone: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mentorSessionSchema = new Schema<IMentorSession>({
  mentorshipRequestId: {
    type: Schema.Types.ObjectId,
    ref: "MentorshipRequest",
    required: true,
  },
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
  sessionTitle: {
    type: String,
    required: true,
  },
  sessionDescription: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['career_guidance', 'interview_prep', 'project_help', 'networking', 'skill_development'],
    required: true,
  },
  skillsNeeded: [{
    type: String,
    trim: true,
  }],
  studentMessage: {
    type: String,
    maxlength: 1000,
  },
  sessionDone: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

export const MentorSession = (mongoose.models.MentorSession as mongoose.Model<IMentorSession>) || mongoose.model<IMentorSession>("MentorSession", mentorSessionSchema);

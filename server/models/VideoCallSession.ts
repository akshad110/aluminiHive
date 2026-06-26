import mongoose, { Document, Schema } from "mongoose";

export interface IVideoCallSession extends Document {
  requestId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  alumniId: mongoose.Types.ObjectId;
  channelName: string;
  attendeeLink: string;
  isStudentActive: boolean;
  isAlumniActive: boolean;
  studentJoinedAt?: Date;
  studentLeftAt?: Date;
  alumniJoinedAt?: Date;
  alumniLeftAt?: Date;
  callStartedAt: Date;
  sessionStartedAt?: Date;
  callEndedAt?: Date;
  status: 'active' | 'ended';
  createdAt: Date;
  updatedAt: Date;
}

const videoCallSessionSchema = new Schema<IVideoCallSession>({
  requestId: {
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
  channelName: {
    type: String,
    required: true,
  },
  attendeeLink: {
    type: String,
    required: true,
  },
  isStudentActive: {
    type: Boolean,
    default: false,
  },
  isAlumniActive: {
    type: Boolean,
    default: false,
  },
  studentJoinedAt: {
    type: Date,
  },
  studentLeftAt: {
    type: Date,
  },
  alumniJoinedAt: {
    type: Date,
  },
  alumniLeftAt: {
    type: Date,
  },
  callStartedAt: {
    type: Date,
    required: true,
  },
  sessionStartedAt: {
    type: Date,
  },
  callEndedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active',
  },
}, {
  timestamps: true,
});

export const VideoCallSession = (mongoose.models.VideoCallSession as mongoose.Model<IVideoCallSession>) || mongoose.model<IVideoCallSession>("VideoCallSession", videoCallSessionSchema);

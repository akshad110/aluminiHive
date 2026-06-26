import mongoose, { Document, Schema } from "mongoose";

export interface IJobPosting extends Document {
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: "full-time" | "part-time" | "contract" | "internship" | "freelance";
  experienceLevel: "entry" | "mid" | "senior" | "executive";
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: "hourly" | "monthly" | "yearly";
  };
  requirements: string[];
  benefits: string[];
  skills: string[];
  postedBy: mongoose.Types.ObjectId; // Alumni who posted
  batchId: mongoose.Types.ObjectId; // Which batch this job is for
  isActive: boolean;
  isLocked: boolean; // True if payment required
  unlockPrice: number; // Amount students need to pay to unlock
  currency: string;
  applicationLink?: string; // Link to apply (only accessible after payment)
  paymentMethod: "one-time" | "subscription";
  unlockedBy: {
    userId: mongoose.Types.ObjectId;
    unlockedAt: Date;
    paymentId?: string;
    amount: number;
  }[];
  applicationDeadline?: Date;
  maxApplications?: number;
  currentApplications: number;
  applications: {
    userId: mongoose.Types.ObjectId;
    appliedAt: Date;
    status: "pending" | "reviewed" | "accepted" | "rejected";
    coverLetter?: string;
    resumeUrl?: string;
  }[];
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const jobPostingSchema = new Schema<IJobPosting>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "freelance"],
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "executive"],
      required: true,
    },
    salary: {
      min: {
        type: Number,
        required: false,
      },
      max: {
        type: Number,
        required: false,
      },
      currency: {
        type: String,
        default: "USD",
      },
      period: {
        type: String,
        enum: ["hourly", "monthly", "yearly"],
        default: "yearly",
      },
    },
    requirements: [{
      type: String,
      trim: true,
    }],
    benefits: [{
      type: String,
      trim: true,
    }],
    skills: [{
      type: String,
      trim: true,
    }],
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    unlockPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    applicationLink: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["one-time", "subscription"],
      default: "one-time",
    },
    unlockedBy: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      unlockedAt: {
        type: Date,
        default: Date.now,
      },
      paymentId: {
        type: String,
      },
      amount: {
        type: Number,
        required: true,
      },
    }],
    applicationDeadline: {
      type: Date,
    },
    maxApplications: {
      type: Number,
      min: 1,
    },
    currentApplications: {
      type: Number,
      default: 0,
    },
    applications: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      appliedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["pending", "reviewed", "accepted", "rejected"],
        default: "pending",
      },
      coverLetter: {
        type: String,
      },
      resumeUrl: {
        type: String,
      },
    }],
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
jobPostingSchema.index({ batchId: 1, isActive: 1 });
jobPostingSchema.index({ postedBy: 1 });
jobPostingSchema.index({ isLocked: 1, unlockPrice: 1 });
jobPostingSchema.index({ jobType: 1, experienceLevel: 1 });
jobPostingSchema.index({ createdAt: -1 });

// Virtual for checking if user has unlocked this job
jobPostingSchema.virtual("isUnlockedByUser").get(function() {
  return (userId: string) => {
    return this.unlockedBy.some((unlock: any) => 
      unlock.userId.toString() === userId
    );
  };
});

// Virtual for checking if user has applied
jobPostingSchema.virtual("hasUserApplied").get(function() {
  return (userId: string) => {
    return this.applications.some((app: any) => 
      app.userId.toString() === userId
    );
  };
});

// Ensure virtual fields are serialized
jobPostingSchema.set("toJSON", { virtuals: true });
jobPostingSchema.set("toObject", { virtuals: true });

export const JobPosting = (mongoose.models.JobPosting as mongoose.Model<IJobPosting>) || 
  mongoose.model<IJobPosting>("JobPosting", jobPostingSchema);

import mongoose, { Document, Schema } from "mongoose";

export interface IAlumni extends Document {
  userId: mongoose.Types.ObjectId;
  graduationYear: number;
  degree: string;
  branch: string;
  currentCompany?: string;
  currentPosition?: string;
  industry: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  bio?: string;
  skills: string[];
  experience: {
    company: string;
    position: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    description?: string;
  }[];
      education: {
      degree: string;
      branch: string;
      institution: string;
      graduationYear: number;
    }[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  isAvailableForMentoring: boolean;
  mentoringInterests: string[];
  achievements: {
    title: string;
    description: string;
    date: Date;
  }[];
  // Impact tracking fields
  studentsMentored: number;
  eventsHosted: number;
  profileViews: number;
  createdAt: Date;
  updatedAt: Date;
}

const alumniSchema = new Schema<IAlumni>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    graduationYear: {
      type: Number,
      required: true,
    },
    degree: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    currentCompany: {
      type: String,
      default: "",
    },
    currentPosition: {
      type: String,
      default: "",
    },
    industry: {
      type: String,
      required: true,
    },
    location: {
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
    },
    bio: {
      type: String,
      maxlength: 1000,
    },
    skills: [{
      type: String,
      trim: true,
    }],
    experience: [{
      company: {
        type: String,
        required: true,
      },
      position: {
        type: String,
        required: true,
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
      },
      current: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
        maxlength: 500,
      },
    }],
    education: [{
      degree: {
        type: String,
        required: true,
      },
      branch: {
        type: String,
        required: true,
      },
      institution: {
        type: String,
        required: true,
      },
      graduationYear: {
        type: Number,
        required: true,
      },
    }],
    socialLinks: {
      linkedin: {
        type: String,
        default: "",
      },
      twitter: {
        type: String,
        default: "",
      },
      github: {
        type: String,
        default: "",
      },
      website: {
        type: String,
        default: "",
      },
    },
    isAvailableForMentoring: {
      type: Boolean,
      default: false,
    },
    mentoringInterests: [{
      type: String,
      trim: true,
    }],
    achievements: [{
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
    }],
    // Impact tracking fields
    studentsMentored: {
      type: Number,
      default: 0,
    },
    eventsHosted: {
      type: Number,
      default: 0,
    },
    profileViews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
alumniSchema.index({ "location.city": 1, "location.state": 1 });
alumniSchema.index({ industry: 1 });
alumniSchema.index({ skills: 1 });
alumniSchema.index({ isAvailableForMentoring: 1 });

export const Alumni = (mongoose.models.Alumni as mongoose.Model<IAlumni>) || mongoose.model<IAlumni>("Alumni", alumniSchema);

import mongoose, { Document, Schema } from "mongoose";

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  studentId: string;
  currentYear: number;
  expectedGraduationYear: number;
  major: string;
  minor?: string;
  gpa?: number;
  academicStanding: "good" | "probation" | "suspended";
  interests: string[];
  careerGoals: string[];
  skills: string[];
  projects: {
    title: string;
    description: string;
    technologies: string[];
    githubUrl?: string;
    liveUrl?: string;
    imageUrl?: string;
  }[];
  internships: {
    company: string;
    position: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    description?: string;
  }[];
  certifications: {
    name: string;
    issuer: string;
    dateObtained: Date;
    expiryDate?: Date;
    credentialId?: string;
  }[];
  socialLinks: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  isLookingForMentorship: boolean;
  mentorshipInterests: string[];
  achievements: {
    title: string;
    description: string;
    date: Date;
    type: "academic" | "project" | "competition" | "other";
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
    },
    currentYear: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    expectedGraduationYear: {
      type: Number,
      required: true,
    },
    major: {
      type: String,
      required: true,
    },
    minor: {
      type: String,
      default: "",
    },
    gpa: {
      type: Number,
      min: 0,
      max: 4,
    },
    academicStanding: {
      type: String,
      enum: ["good", "probation", "suspended"],
      default: "good",
    },
    interests: [{
      type: String,
      trim: true,
    }],
    careerGoals: [{
      type: String,
      trim: true,
    }],
    skills: [{
      type: String,
      trim: true,
    }],
    projects: [{
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
        maxlength: 500,
      },
      technologies: [{
        type: String,
        trim: true,
      }],
      githubUrl: {
        type: String,
        default: "",
      },
      liveUrl: {
        type: String,
        default: "",
      },
      imageUrl: {
        type: String,
        default: "",
      },
    }],
    internships: [{
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
    certifications: [{
      name: {
        type: String,
        required: true,
      },
      issuer: {
        type: String,
        required: true,
      },
      dateObtained: {
        type: Date,
        required: true,
      },
      expiryDate: {
        type: Date,
      },
      credentialId: {
        type: String,
        default: "",
      },
    }],
    socialLinks: {
      linkedin: {
        type: String,
        default: "",
      },
      github: {
        type: String,
        default: "",
      },
      portfolio: {
        type: String,
        default: "",
      },
    },
    isLookingForMentorship: {
      type: Boolean,
      default: false,
    },
    mentorshipInterests: [{
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
      type: {
        type: String,
        enum: ["academic", "project", "competition", "other"],
        required: true,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
studentSchema.index({ major: 1 });
studentSchema.index({ skills: 1 });
studentSchema.index({ isLookingForMentorship: 1 });
studentSchema.index({ expectedGraduationYear: 1 });

export const Student = mongoose.model<IStudent>("Student", studentSchema);

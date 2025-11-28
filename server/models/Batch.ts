import mongoose, { Document, Schema } from "mongoose";

export interface IBatch extends Document {
  name: string; // Format: "College Name - Batch Year" (e.g., "MIT - 2020")
  college: string;
  graduationYear: number;
  members: mongoose.Types.ObjectId[]; // Array of User IDs
  alumniCount: number;
  studentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    college: {
      type: String,
      required: true,
      trim: true,
    },
    graduationYear: {
      type: Number,
      required: true,
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    alumniCount: {
      type: Number,
      default: 0,
    },
    studentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
batchSchema.index({ college: 1, graduationYear: 1 });
// Note: name field already has unique: true which creates an index automatically

// Virtual for total members
batchSchema.virtual("totalMembers").get(function() {
  return this.alumniCount + this.studentCount;
});

// Ensure virtual fields are serialized
batchSchema.set("toJSON", { virtuals: true });
batchSchema.set("toObject", { virtuals: true });

export const Batch = (mongoose.models.Batch as mongoose.Model<IBatch>) || mongoose.model<IBatch>("Batch", batchSchema);

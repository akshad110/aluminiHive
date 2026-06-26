import { Batch, User, Alumni, Student } from "../models";

export class BatchService {
  /**
   * Create or find a batch based on college and graduation year
   */
  static async createOrFindBatch(college: string, graduationYear: number): Promise<any> {
    const batchName = `${college} - ${graduationYear}`;
    
    try {
      // Try to find existing batch
      let batch = await Batch.findOne({ 
        college: college.trim(), 
        graduationYear 
      });

      if (!batch) {
        // Create new batch if it doesn't exist
        batch = new Batch({
          name: batchName,
          college: college.trim(),
          graduationYear,
          members: [],
          alumniCount: 0,
          studentCount: 0,
        });

        await batch.save();
        console.log(`✅ Created new batch: ${batchName}`);
      }

      return batch;
    } catch (error) {
      console.error("❌ Error creating/finding batch:", error);
      throw error;
    }
  }

  /**
   * Add user to a batch and update counts
   */
  static async addUserToBatch(userId: string, batchId: string, userRole: "alumni" | "student"): Promise<void> {
    try {
      // Add user to batch members
      await Batch.findByIdAndUpdate(
        batchId,
        { 
          $addToSet: { members: userId },
          $inc: userRole === "alumni" ? { alumniCount: 1 } : { studentCount: 1 }
        }
      );

      // Update user's batch reference
      await User.findByIdAndUpdate(userId, { batch: batchId });

      console.log(`✅ Added ${userRole} to batch`);
    } catch (error) {
      console.error("❌ Error adding user to batch:", error);
      throw error;
    }
  }

  /**
   * Remove user from batch and update counts
   */
  static async removeUserFromBatch(userId: string, batchId: string, userRole: "alumni" | "student"): Promise<void> {
    try {
      // Remove user from batch members
      await Batch.findByIdAndUpdate(
        batchId,
        { 
          $pull: { members: userId },
          $inc: userRole === "alumni" ? { alumniCount: -1 } : { studentCount: -1 }
        }
      );

      // Remove user's batch reference
      await User.findByIdAndUpdate(userId, { $unset: { batch: 1 } });

      console.log(`✅ Removed ${userRole} from batch`);
    } catch (error) {
      console.error("❌ Error removing user from batch:", error);
      throw error;
    }
  }

  /**
   * Get batch information with populated members
   */
  static async getBatchWithMembers(batchId: string): Promise<any> {
    try {
      const batch = await Batch.findById(batchId)
        .populate({
          path: "members",
          select: "firstName lastName email role college profilePicture",
          populate: {
            path: "batch",
            select: "name graduationYear"
          }
        });

      return batch;
    } catch (error) {
      console.error("❌ Error getting batch with members:", error);
      throw error;
    }
  }

  /**
   * Get all batches for a college
   */
  static async getBatchesByCollege(college: string): Promise<any[]> {
    try {
      const batches = await Batch.find({ college: college.trim() })
        .sort({ graduationYear: -1 })
        .populate("members", "firstName lastName email role");

      return batches;
    } catch (error) {
      console.error("❌ Error getting batches by college:", error);
      throw error;
    }
  }

  /**
   * Get batch statistics
   */
  static async getBatchStats(): Promise<any> {
    try {
      const stats = await Batch.aggregate([
        {
          $group: {
            _id: null,
            totalBatches: { $sum: 1 },
            totalAlumni: { $sum: "$alumniCount" },
            totalStudents: { $sum: "$studentCount" },
            totalMembers: { $sum: { $add: ["$alumniCount", "$studentCount"] } }
          }
        }
      ]);

      return stats[0] || {
        totalBatches: 0,
        totalAlumni: 0,
        totalStudents: 0,
        totalMembers: 0
      };
    } catch (error) {
      console.error("❌ Error getting batch stats:", error);
      throw error;
    }
  }
}

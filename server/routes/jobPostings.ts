import { RequestHandler } from "express";
import mongoose from "mongoose";
import { JobPosting, User, Batch, JobPostingSubscription } from "../models";

// Get all job postings (for students to see all jobs)
export const getAllJobPostings: RequestHandler = async (req, res) => {
  try {
    const { userId, page = 1, limit = 10, jobType, experienceLevel, isLocked } = req.query;

    console.log("All job postings request:", { userId, page, limit, jobType, experienceLevel, isLocked });

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get user info to check role
    const { User: UserModel } = await import("../models/User");
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Build query - students can see all jobs
    const query: any = {};

    if (jobType && jobType !== "all") query.jobType = jobType;
    if (experienceLevel && experienceLevel !== "all") query.experienceLevel = experienceLevel;
    if (isLocked !== undefined && isLocked !== "all") query.isLocked = isLocked === "true";

    console.log("Query built:", query);

    const jobs = await JobPosting.find(query)
      .populate("postedBy", "firstName lastName profilePicture company")
      .sort({ createdAt: -1 })
      .limit(limit as number * 1)
      .skip((page as number - 1) * (limit as number));

    console.log("Jobs found:", jobs.length);

    // Add unlock status for each job
    const jobsWithStatus = jobs.map(job => ({
      ...job.toObject(),
      isUnlockedByCurrentUser: job.unlockedBy.some((unlock: any) => 
        unlock.userId.toString() === userId
      ),
      hasUserApplied: job.applications.some((app: any) => 
        app.userId.toString() === userId
      ),
    }));

    const total = await JobPosting.countDocuments(query);

    res.json({
      jobs: jobsWithStatus,
      totalPages: Math.ceil(total / (limit as number)),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching all job postings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all job postings for a batch
export const getJobPostings: RequestHandler = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { userId, page = 1, limit = 10, jobType, experienceLevel, isLocked } = req.query;

    console.log("Job postings request:", { batchId, userId, page, limit, jobType, experienceLevel, isLocked });

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get user info to check role
    const { User: UserModel } = await import("../models/User");
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify batch exists
    const batch = await Batch.findById(batchId).populate("members");
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Check if user is a member or a student (students can view but not post)
    const isMember = batch.members.some((member: any) => member._id.toString() === userId);
    const isStudent = user.role === "student";
    
    if (!isMember && !isStudent) {
      return res.status(403).json({ error: "Access denied. You are not authorized to view this batch." });
    }

    // Build query
    // For students, show ALL jobs from ALL batches (they can see everything)
    // For alumni, show only jobs from their batch
    const query: any = {};
    
    if (user.role === "alumni") {
      // Alumni only see jobs from their batch
      query.batchId = new mongoose.Types.ObjectId(batchId);
    }
    // For students, query is empty (no batchId filter) so they see ALL jobs

    if (jobType && jobType !== "all") query.jobType = jobType;
    if (experienceLevel && experienceLevel !== "all") query.experienceLevel = experienceLevel;
    if (isLocked !== undefined && isLocked !== "all") query.isLocked = isLocked === "true";

    console.log("Query built:", JSON.stringify(query, null, 2));
    console.log("User role:", user.role);
    console.log("BatchId from params:", batchId);

    const jobs = await JobPosting.find(query)
      .populate("postedBy", "firstName lastName profilePicture company")
      .sort({ createdAt: -1 })
      .limit(limit as number * 1)
      .skip((page as number - 1) * (limit as number));

    console.log("Jobs found:", jobs.length);
    if (jobs.length > 0) {
      console.log("First job batchId:", jobs[0].batchId?.toString());
      console.log("First job _id:", jobs[0]._id?.toString());
    }

    // Add unlock status for each job
    const jobsWithStatus = jobs.map(job => ({
      ...job.toObject(),
      isUnlockedByCurrentUser: job.unlockedBy.some((unlock: any) => 
        unlock.userId.toString() === userId
      ),
      hasUserApplied: job.applications.some((app: any) => 
        app.userId.toString() === userId
      ),
    }));

    const total = await JobPosting.countDocuments(query);

    res.json({
      jobs: jobsWithStatus,
      totalPages: Math.ceil(total / (limit as number)),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching job postings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get single job posting
export const getJobPosting: RequestHandler = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const job = await JobPosting.findById(jobId)
      .populate("postedBy", "firstName lastName profilePicture company email")
      .populate("unlockedBy.userId", "firstName lastName")
      .populate("applications.userId", "firstName lastName profilePicture");

    if (!job) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    // Allow students to access job details directly without batch membership check
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only check batch membership for alumni (not students)
    if (user.role === "alumni") {
      const batch = await Batch.findById(job.batchId).populate("members");
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      const isMember = batch.members.some((member: any) => member._id.toString() === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied. You are not a member of this batch." });
      }
    }

    // Increment view count
    await JobPosting.findByIdAndUpdate(jobId, { $inc: { views: 1 } });

    // Check if user has paid for this job using JobPostingSubscription
    const paymentRecord = await JobPostingSubscription.findOne({
      jobId: new mongoose.Types.ObjectId(jobId),
      userId: new mongoose.Types.ObjectId(String(userId)),
      status: 'completed'
    });

    console.log('Payment record check:', {
      jobId,
      userId,
      paymentExists: !!paymentRecord,
      paymentId: paymentRecord?._id,
      transactionId: paymentRecord?.transactionId
    });

    const isUnlockedByCurrentUser = !!paymentRecord;
    console.log('Final unlock status from payment record:', { isUnlockedByCurrentUser });

    const jobWithStatus = {
      ...job.toObject(),
      isUnlockedByCurrentUser,
      hasUserApplied: job.applications.some((app: any) => 
        app.userId.toString() === userId
      ),
    };

    res.json({ job: jobWithStatus });
  } catch (error) {
    console.error("Error fetching job posting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new job posting (Alumni only)
export const createJobPosting: RequestHandler = async (req, res) => {
  try {
    const { userId, batchId, ...jobData } = req.body;

    if (!userId || !batchId) {
      return res.status(400).json({ error: "User ID and Batch ID are required" });
    }

    // Verify user is alumni and member of the batch
    const user = await User.findById(userId);
    if (!user || user.role !== "alumni") {
      return res.status(403).json({ error: "Only alumni can post jobs" });
    }

    const batch = await Batch.findById(batchId).populate("members");
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const isMember = batch.members.some((member: any) => member._id.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: "Access denied. You are not a member of this batch." });
    }

    // Ensure batchId is a valid ObjectId
    let batchObjectId;
    try {
      batchObjectId = new mongoose.Types.ObjectId(batchId);
    } catch (error) {
      console.error("Invalid batchId format:", batchId);
      return res.status(400).json({ error: "Invalid batch ID format" });
    }

    const job = new JobPosting({
      ...jobData,
      postedBy: new mongoose.Types.ObjectId(userId),
      batchId: batchObjectId,
    });

    console.log("Creating job with data:", {
      batchId: batchId,
      batchIdObjectId: batchObjectId.toString(),
      postedBy: userId,
      title: jobData.title,
      company: jobData.company
    });

    await job.save();
    
    console.log("Job saved successfully:", {
      jobId: job._id.toString(),
      batchId: job.batchId?.toString(),
      batchIdType: typeof job.batchId,
      postedBy: job.postedBy?.toString()
    });
    
    // Verify the job was saved correctly
    const savedJob = await JobPosting.findById(job._id);
    console.log("Verified saved job batchId:", savedJob?.batchId?.toString());

    const populatedJob = await JobPosting.findById(job._id)
      .populate("postedBy", "firstName lastName profilePicture company");

    res.status(201).json({
      message: "Job posting created successfully",
      job: populatedJob,
    });
  } catch (error) {
    console.error("Error creating job posting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update job posting (Only by the poster)
export const updateJobPosting: RequestHandler = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId, ...updateData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const job = await JobPosting.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    // Check if user is the poster
    if (job.postedBy.toString() !== userId) {
      return res.status(403).json({ error: "You can only update your own job postings" });
    }

    const updatedJob = await JobPosting.findByIdAndUpdate(
      jobId,
      updateData,
      { new: true }
    ).populate("postedBy", "firstName lastName profilePicture company");

    res.json({
      message: "Job posting updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Error updating job posting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete job posting (Only by the poster)
export const deleteJobPosting: RequestHandler = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const job = await JobPosting.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    // Check if user is the poster
    if (job.postedBy.toString() !== userId) {
      return res.status(403).json({ error: "You can only delete your own job postings" });
    }

    await JobPosting.findByIdAndDelete(jobId);

    res.json({
      message: "Job posting deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job posting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Unlock job posting (Student payment)
export const unlockJobPosting: RequestHandler = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId, paymentId, amount } = req.body;

    if (!userId || !paymentId || !amount) {
      return res.status(400).json({ error: "User ID, payment ID, and amount are required" });
    }

    const job = await JobPosting.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    // Check if job is locked
    if (!job.isLocked) {
      return res.status(400).json({ error: "This job is already unlocked" });
    }

    // Check if user has already unlocked this job
    const alreadyUnlocked = job.unlockedBy.some((unlock: any) => 
      unlock.userId.toString() === userId
    );

    if (alreadyUnlocked) {
      return res.status(400).json({ error: "You have already unlocked this job" });
    }

    // Verify payment amount
    if (amount < job.unlockPrice) {
      return res.status(400).json({ error: "Insufficient payment amount" });
    }

    // Add user to unlockedBy array
    job.unlockedBy.push({
      userId: new mongoose.Types.ObjectId(userId),
      unlockedAt: new Date(),
      paymentId,
      amount,
    });

    await job.save();

    res.json({
      message: "Job unlocked successfully",
      job: job,
    });
  } catch (error) {
    console.error("Error unlocking job posting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Apply for job
export const applyForJob: RequestHandler = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId, coverLetter, resumeUrl } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const job = await JobPosting.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    // Check if job is locked and user has unlocked it
    if (job.isLocked) {
      const hasUnlocked = job.unlockedBy.some((unlock: any) => 
        unlock.userId.toString() === userId
      );
      if (!hasUnlocked) {
        return res.status(403).json({ 
          error: "You need to unlock this job before applying",
          unlockPrice: job.unlockPrice,
          currency: job.currency
        });
      }
    }

    // Check if user has already applied
    const hasApplied = job.applications.some((app: any) => 
      app.userId.toString() === userId
    );

    if (hasApplied) {
      return res.status(400).json({ error: "You have already applied for this job" });
    }

    // Check application deadline
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      return res.status(400).json({ error: "Application deadline has passed" });
    }

    // Check max applications
    if (job.maxApplications && job.currentApplications >= job.maxApplications) {
      return res.status(400).json({ error: "Maximum applications reached" });
    }

    // Add application
    job.applications.push({
      userId: new mongoose.Types.ObjectId(userId),
      appliedAt: new Date(),
      status: "pending",
      coverLetter,
      resumeUrl,
    });

    job.currentApplications += 1;
    await job.save();

    res.json({
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Error applying for job:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get job applications (Only by the poster)
export const getJobApplications: RequestHandler = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const job = await JobPosting.findById(jobId)
      .populate("applications.userId", "firstName lastName email profilePicture");

    if (!job) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    // Check if user is the poster
    if (job.postedBy.toString() !== userId) {
      return res.status(403).json({ error: "You can only view applications for your own job postings" });
    }

    res.json({
      applications: job.applications,
      totalApplications: job.currentApplications,
    });
  } catch (error) {
    console.error("Error fetching job applications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update application status (Only by the poster)
export const updateApplicationStatus: RequestHandler = async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;
    const { userId, status } = req.body;

    if (!userId || !status) {
      return res.status(400).json({ error: "User ID and status are required" });
    }

    const job = await JobPosting.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    // Check if user is the poster
    if (job.postedBy.toString() !== userId) {
      return res.status(403).json({ error: "You can only update applications for your own job postings" });
    }

    // Find and update the application
    const application = job.applications.find((app: any) => app._id.toString() === applicationId);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    application.status = status;
    await job.save();

    res.json({
      message: "Application status updated successfully",
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

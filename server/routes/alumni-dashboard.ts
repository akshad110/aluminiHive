import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Alumni } from "../models/Alumni";
import { Activity } from "../models/Activity";
import { MentorshipRequest } from "../models/MentorshipRequest";
import { Message } from "../models/Message";
import { MentorshipOpportunity, ImpactMetrics, RecentActivity } from "../../shared/api";

// Helper function to get time ago string
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

// Helper function to get icon for activity type
function getIconForType(type: string): string {
  switch (type) {
    case 'mentorship_request':
      return 'MessageCircle';
    case 'event_scheduled':
    case 'event_created':
      return 'Calendar';
    case 'rating_received':
      return 'Star';
    case 'profile_view':
      return 'Eye';
    default:
      return 'Bell';
  }
}

// Helper function to get icon for mentorship category
function getIconForCategory(category: string): string {
  switch (category) {
    case 'career_guidance':
      return 'Users';
    case 'interview_prep':
      return 'Award';
    case 'project_help':
      return 'Code';
    case 'networking':
      return 'Network';
    case 'skill_development':
      return 'TrendingUp';
    default:
      return 'Users';
  }
}

// Helper function to get category title
function getCategoryTitle(category: string): string {
  switch (category) {
    case 'career_guidance':
      return 'Software Engineering Career Guidance';
    case 'interview_prep':
      return 'Interview Preparation';
    case 'project_help':
      return 'Project Development Help';
    case 'networking':
      return 'Professional Networking';
    case 'skill_development':
      return 'Skill Development';
    default:
      return 'General Mentorship';
  }
}

// Helper function to get category description
function getCategoryDescription(category: string): string {
  switch (category) {
    case 'career_guidance':
      return 'Help students navigate their tech careers';
    case 'interview_prep':
      return 'Prepare students for technical interviews';
    case 'project_help':
      return 'Assist with coding projects and development';
    case 'networking':
      return 'Connect students with industry professionals';
    case 'skill_development':
      return 'Help students develop new technical skills';
    default:
      return 'General mentorship and guidance';
  }
}

// Get mentorship opportunities for a specific alumni
export const getMentorshipOpportunities: RequestHandler = async (req, res) => {
  try {
    const { alumniUserId } = req.query;
    
    if (!alumniUserId) {
      return res.status(400).json({ error: 'alumniUserId is required' });
    }

    // Fetch pending mentorship requests for this alumni
    const requests = await MentorshipRequest.find({ 
      alumniId: alumniUserId, 
      status: 'pending' 
    })
    .populate('studentId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

    // Group requests by category and count interested students
    const categoryMap = new Map();
    
    requests.forEach(request => {
      const category = request.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          _id: category,
          title: getCategoryTitle(category),
          description: getCategoryDescription(category),
          interestedStudents: 0,
          lastUpdated: getTimeAgo(request.createdAt),
          category: category,
          icon: getIconForCategory(category),
          requests: []
        });
      }
      
      const opportunity = categoryMap.get(category);
      opportunity.interestedStudents++;
      opportunity.requests.push(request);
      
      // Update lastUpdated to the most recent request
      if (request.createdAt > new Date(opportunity.lastUpdated)) {
        opportunity.lastUpdated = getTimeAgo(request.createdAt);
      }
    });

    const opportunities: MentorshipOpportunity[] = Array.from(categoryMap.values());

    res.json(opportunities);
  } catch (error) {
    console.error('Error fetching mentorship opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch mentorship opportunities' });
  }
};

// Get impact metrics for a specific alumni
export const getImpactMetrics: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find alumni profile
    const alumni = await Alumni.findOne({ userId });
    
    if (!alumni) {
      return res.status(404).json({ error: 'Alumni profile not found' });
    }

    // Fetch actual metrics from database
    const metrics: ImpactMetrics = {
      studentsMentored: {
        current: alumni.studentsMentored || 0,
        target: 15,
        description: "Helping students achieve their goals"
      },
      eventsHosted: {
        current: alumni.eventsHosted || 0,
        target: 8,
        description: "Creating networking opportunities"
      },
      profileViews: {
        current: alumni.profileViews || 0,
        target: 100,
        description: "Building your professional presence"
      },
      profileInfo: {
        jobTitle: alumni.currentPosition || "Not specified",
        company: alumni.currentCompany || "Not specified",
        location: `${alumni.location.city}, ${alumni.location.state}`,
        country: alumni.location.country,
        education: alumni.branch,
        graduationYear: `Class of ${alumni.graduationYear}`
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching impact metrics:', error);
    res.status(500).json({ error: 'Failed to fetch impact metrics' });
  }
};

// Get recent activity for a specific user
export const getRecentActivity: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch actual activities from database (no need to check alumni profile)
    const dbActivities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Convert database activities to API format
    const activities: RecentActivity[] = dbActivities.map(activity => ({
      _id: activity._id.toString(),
      type: activity.type as RecentActivity['type'],
      title: activity.title,
      description: activity.description,
      timestamp: getTimeAgo(activity.createdAt),
      icon: getIconForType(activity.type),
      metadata: activity.metadata
    }));

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
};

// Update impact metrics (for when actions happen)
export const updateImpactMetrics: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, increment = 1 } = req.body; // type: 'studentsMentored' | 'eventsHosted' | 'profileViews'
    
    if (!['studentsMentored', 'eventsHosted', 'profileViews'].includes(type)) {
      return res.status(400).json({ error: 'Invalid metric type' });
    }
    
    const alumni = await Alumni.findOne({ userId });
    
    if (!alumni) {
      return res.status(404).json({ error: 'Alumni profile not found' });
    }
    
    // Update the specific metric
    alumni[type] = (alumni[type] || 0) + increment;
    await alumni.save();
    
    res.json({ 
      message: `${type} updated successfully`,
      newValue: alumni[type]
    });
  } catch (error) {
    console.error('Error updating impact metrics:', error);
    res.status(500).json({ error: 'Failed to update impact metrics' });
  }
};

// Create new activity (for real-time notifications)
export const createActivity: RequestHandler = async (req, res) => {
  try {
    const { userId, type, title, description, metadata } = req.body;
    
    if (!userId || !type || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const activity = new Activity({
      userId,
      type,
      title,
      description,
      metadata: metadata || {}
    });
    
    await activity.save();
    
    res.status(201).json({
      message: 'Activity created successfully',
      activity: {
        _id: activity._id.toString(),
        type: activity.type,
        title: activity.title,
        description: activity.description,
        timestamp: getTimeAgo(activity.createdAt),
        icon: getIconForType(activity.type),
        metadata: activity.metadata
      }
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
};

// Create mentorship request (for students to request mentorship)
export const createMentorshipRequest: RequestHandler = async (req, res) => {
  try {
    console.log('Received mentorship request:', req.body);
    
    const {
      studentId,
      alumniId,
      category,
      title,
      description,
      skillsNeeded,
      expectedDuration,
      preferredCommunication,
      studentMessage
    } = req.body;
    
    console.log('Extracted fields:', {
      studentId,
      alumniId,
      category,
      title,
      description,
      skillsNeeded,
      expectedDuration,
      preferredCommunication,
      studentMessage
    });
    
    // More detailed validation
    const missingFields = [];
    if (!studentId || studentId.trim() === '') missingFields.push('studentId');
    if (!alumniId || alumniId.trim() === '') missingFields.push('alumniId');
    if (!category || category.trim() === '') missingFields.push('category');
    if (!title || title.trim() === '') missingFields.push('title');
    if (!description || description.trim() === '') missingFields.push('description');
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields: missingFields 
      });
    }
    
    console.log('Creating mentorship request with data:', {
      studentId,
      alumniId,
      category,
      title,
      description,
      skillsNeeded: skillsNeeded || [],
      expectedDuration: expectedDuration || '2 weeks',
      preferredCommunication: preferredCommunication || 'email',
      studentMessage
    });
    
    const request = new MentorshipRequest({
      studentId,
      alumniId,
      category,
      title,
      description,
      skillsNeeded: skillsNeeded || [],
      expectedDuration: expectedDuration || '2 weeks',
      preferredCommunication: preferredCommunication || 'email',
      studentMessage
    });
    
    console.log('MentorshipRequest object created:', request);
    
    try {
      await request.save();
      console.log('MentorshipRequest saved successfully:', request._id);
    } catch (saveError) {
      console.error('Error saving MentorshipRequest:', saveError);
      throw saveError;
    }
    
    // Log activity for the alumni
    const { logMentorshipRequest } = await import('../utils/activityLogger');
    await logMentorshipRequest(alumniId, 'Student', description);
    
    res.status(201).json({
      message: 'Mentorship request created successfully',
      request: {
        _id: request._id.toString(),
        category: request.category,
        title: request.title,
        description: request.description,
        status: request.status,
        createdAt: request.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating mentorship request:', error);
    res.status(500).json({ error: 'Failed to create mentorship request' });
  }
};

// Get mentorship requests for alumni
export const getMentorshipRequestsForAlumni: RequestHandler = async (req, res) => {
  try {
    const { alumniId } = req.params;
    console.log('🔍 Fetching requests for alumni:', alumniId);
    
    // Validate ObjectId format
    if (!alumniId || !mongoose.Types.ObjectId.isValid(alumniId)) {
      console.error('❌ Invalid alumniId:', alumniId);
      return res.status(400).json({ error: 'Invalid alumni ID' });
    }

    // Check if alumni exists - try both ObjectId and string
    const { User } = await import('../models');
    let alumniExists = await User.findById(alumniId);
    if (!alumniExists) {
      // Try finding by string ID
      alumniExists = await User.findOne({ _id: alumniId });
    }
    if (!alumniExists) {
      // Try finding by string ID as string
      alumniExists = await User.findOne({ _id: alumniId.toString() });
    }
    if (!alumniExists) {
      // Log all users for debugging
      const allUsers = await User.find({}).limit(5).select("_id email role");
      console.error('❌ Alumni not found:', alumniId);
      console.error('📋 Available users:', allUsers.map(u => ({ _id: u._id.toString(), email: u.email, role: u.role })));
      return res.status(404).json({ error: 'Alumni not found' });
    }
    
    console.log('✅ Alumni found:', alumniExists.firstName, alumniExists.lastName);
    
    // Check total messages in database for debugging
    const { Message } = await import('../models/Message');
    const totalMessages = await Message.countDocuments({});
    console.log('📊 Total messages in database:', totalMessages);
    
    // Check total mentorship requests in database
    const totalRequests = await MentorshipRequest.countDocuments({});
    console.log('📊 Total mentorship requests in database:', totalRequests);
    
    // Check requests for this specific alumni
    const requestsForAlumni = await MentorshipRequest.countDocuments({ 
      alumniId: new mongoose.Types.ObjectId(alumniId) 
    });
    console.log('📊 Requests for this alumni (count):', requestsForAlumni);
    
    // Also check with raw MongoDB query
    const db = mongoose.connection.db;
    if (db) {
      const requestsCollection = db.collection('mentorshiprequests');
      const rawCount = await requestsCollection.countDocuments({ 
        alumniId: new mongoose.Types.ObjectId(alumniId) 
      });
      console.log('📊 Raw MongoDB query count:', rawCount);
      
      // Get a sample request
      const sampleReq = await requestsCollection.findOne({ 
        alumniId: new mongoose.Types.ObjectId(alumniId) 
      });
      if (sampleReq) {
        console.log('📋 Sample request structure:', {
          _id: sampleReq._id,
          alumniId: sampleReq.alumniId,
          studentId: sampleReq.studentId,
          title: sampleReq.title,
          alumniIdType: typeof sampleReq.alumniId
        });
      }
    }
    
    // Try query with ObjectId conversion
    const requests = await MentorshipRequest.find({ 
      alumniId: new mongoose.Types.ObjectId(alumniId) 
    })
      .populate('studentId', 'firstName lastName email profilePicture')
      .select('+callHistory +totalCallDuration +lastCallCompletedAt')
      .sort({ createdAt: -1 });
    
    console.log('✅ Fetched', requests.length, 'requests for alumni:', alumniId);
    if (requests.length > 0) {
      console.log('📋 First request:', {
        id: requests[0]._id,
        title: requests[0].title,
        student: requests[0].studentId,
        callHistory: requests[0].callHistory
      });
    } else {
      console.log('⚠️ No requests found. Checking if alumniId format matches...');
      // Try without ObjectId conversion
      const requestsWithoutConversion = await MentorshipRequest.find({ alumniId })
        .populate('studentId', 'firstName lastName email profilePicture')
        .limit(5);
      console.log('📊 Requests without ObjectId conversion:', requestsWithoutConversion.length);
    }
    
    res.json({ requests });
  } catch (error) {
    console.error('❌ Error fetching mentorship requests for alumni:', error);
    res.status(500).json({ error: 'Failed to fetch mentorship requests' });
  }
};

// Accept mentorship request
export const acceptMentorshipRequest: RequestHandler = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await MentorshipRequest.findByIdAndUpdate(
      requestId,
      { 
        status: 'accepted',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ error: 'Mentorship request not found' });
    }
    
    res.json({ 
      message: 'Mentorship request accepted successfully',
      request 
    });
  } catch (error) {
    console.error('Error accepting mentorship request:', error);
    res.status(500).json({ error: 'Failed to accept mentorship request' });
  }
};

// Reject mentorship request
export const rejectMentorshipRequest: RequestHandler = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    
    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const request = await MentorshipRequest.findByIdAndUpdate(
      requestId,
      { 
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ error: 'Mentorship request not found' });
    }
    
    res.json({ 
      message: 'Mentorship request rejected',
      request 
    });
  } catch (error) {
    console.error('Error rejecting mentorship request:', error);
    res.status(500).json({ error: 'Failed to reject mentorship request' });
  }
};

// Get mentorship requests for a specific student
export const getMentorshipRequestsForStudent: RequestHandler = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('Fetching mentorship requests for student ID:', studentId);

    // First, let's check all mentorship requests to see what's in the database
    const allRequests = await MentorshipRequest.find({}).populate('studentId', 'firstName lastName email').populate('alumniId', 'firstName lastName email');
    console.log('All mentorship requests in database:', allRequests.length);
    allRequests.forEach((req, index) => {
      console.log(`Request ${index + 1}:`, {
        id: req._id,
        studentId: req.studentId,
        alumniId: req.alumniId,
        status: req.status,
        title: req.title
      });
    });

    const requests = await MentorshipRequest.find({ studentId })
      .populate('alumniId', 'firstName lastName email profilePicture currentCompany')
      .select('+callHistory +totalCallDuration +lastCallCompletedAt')
      .sort({ createdAt: -1 });

    console.log('Found requests for student:', requests.length);
    console.log('Requests data:', requests);
    console.log('First request call history:', requests[0]?.callHistory);

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching mentorship requests for student:', error);
    res.status(500).json({ error: 'Failed to fetch mentorship requests' });
  }
};

// Complete mentorship call
export const completeMentorshipCall: RequestHandler = async (req, res) => {
  try {
    console.log('Complete call request body:', req.body);
    
    const {
      requestId,
      callId,
      startTime,
      endTime,
      duration,
      callType
    } = req.body;

    if (!requestId || !callId || !startTime || !endTime || !duration || !callType) {
      console.log('Missing required fields:', { requestId, callId, startTime, endTime, duration, callType });
      return res.status(400).json({ 
        error: 'Missing required fields: requestId, callId, startTime, endTime, duration, callType' 
      });
    }

    // Find the mentorship request
    const request = await MentorshipRequest.findById(requestId);
    if (!request) {
      console.log('Mentorship request not found for ID:', requestId);
      return res.status(404).json({ error: 'Mentorship request not found' });
    }

    console.log('Found request:', request._id, 'Current call history:', request.callHistory);

    // Add call to history
    const callEntry: {
      callId: string;
      startTime: Date;
      endTime: Date;
      duration: number;
      callType: 'video' | 'audio';
      status: 'completed';
    } = {
      callId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration: parseInt(duration),
      callType: callType as 'video' | 'audio',
      status: 'completed'
    };

    // Initialize callHistory if it doesn't exist
    if (!request.callHistory) {
      request.callHistory = [];
    }

    request.callHistory.push(callEntry);
    request.lastCallCompletedAt = new Date(endTime);
    request.totalCallDuration = (request.totalCallDuration || 0) + parseInt(duration);

    // Mark as completed if this was a significant call (more than 5 minutes)
    if (parseInt(duration) >= 5) {
      request.status = 'completed';
    }

    await request.save();

    console.log('Call completed successfully. Updated request:', {
      id: request._id,
      callHistoryLength: request.callHistory.length,
      totalCallDuration: request.totalCallDuration,
      status: request.status
    });

    res.json({ 
      success: true, 
      message: 'Call completed successfully',
      callDuration: duration,
      totalCalls: request.callHistory.length,
      totalDuration: request.totalCallDuration
    });
  } catch (error) {
    console.error('Error completing mentorship call:', error);
    res.status(500).json({ error: 'Failed to complete call' });
  }
};
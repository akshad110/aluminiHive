import { RequestHandler } from "express";
import { MentorshipRequest } from "../models/MentorshipRequest";
import { MentorSession } from "../models/MentorSession";

// Get mentorship requests for alumni
export const getMentorshipRequestsForAlumni: RequestHandler = async (req, res) => {
  try {
    const { alumniId } = req.params;
    
    const requests = await MentorshipRequest.find({ alumniId })
      .populate('studentId', 'firstName lastName email profilePicture')
      .select('+callHistory +totalCallDuration +lastCallCompletedAt')
      .sort({ createdAt: -1 });
    
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching mentorship requests for alumni:', error);
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

// Complete mentorship session
export const completeMentorshipSession: RequestHandler = async (req, res) => {
  try {
    console.log('Complete mentorship session request:', req.params);
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }
    
    // Find the mentorship request
    const request = await MentorshipRequest.findById(requestId)
      .populate('studentId', 'firstName lastName email')
      .populate('alumniId', 'firstName lastName email');
    
    if (!request) {
      console.log('Mentorship request not found for ID:', requestId);
      return res.status(404).json({ error: 'Mentorship request not found' });
    }

    console.log('Found mentorship request:', request._id);

    // Create a new mentor session record
    const mentorSession = new MentorSession({
      mentorshipRequestId: request._id,
      studentId: request.studentId._id,
      alumniId: request.alumniId._id,
      sessionTitle: request.title,
      sessionDescription: request.description,
      category: request.category,
      skillsNeeded: request.skillsNeeded,
      studentMessage: request.studentMessage,
      sessionDone: true,
      completedAt: new Date()
    });

    console.log('Created mentor session:', mentorSession);
    await mentorSession.save();
    console.log('Saved mentor session successfully');

    // Update the original request status to completed
    await MentorshipRequest.findByIdAndUpdate(
      requestId,
      { 
        status: 'completed',
        updatedAt: new Date()
      }
    );
    
    console.log('Updated mentorship request status to completed');
    
    res.json({ 
      message: 'Mentorship session completed successfully',
      session: mentorSession,
      success: true
    });
  } catch (error) {
    console.error('Error completing mentorship session:', error);
    res.status(500).json({ 
      error: 'Failed to complete mentorship session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get completed mentor sessions
export const getCompletedMentorSessions: RequestHandler = async (req, res) => {
  try {
    const { alumniId } = req.params;
    
    const sessions = await MentorSession.find({ 
      alumniId, 
      sessionDone: true 
    })
      .populate('studentId', 'firstName lastName email profilePicture')
      .sort({ completedAt: -1 });
    
    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching completed mentor sessions:', error);
    res.status(500).json({ error: 'Failed to fetch completed sessions' });
  }
};

import { RequestHandler } from "express";
import { VideoCallSession } from "../models/VideoCallSession";

// Start video call
export const startVideoCall: RequestHandler = async (req, res) => {
  try {
    const { requestId, studentId, alumniId, channelName, attendeeLink } = req.body;
    
    // End any existing active calls for this request
    await VideoCallSession.updateMany(
      { requestId, status: 'active' },
      { status: 'ended', callEndedAt: new Date() }
    );
    
    const videoCall = new VideoCallSession({
      requestId,
      studentId,
      alumniId,
      channelName,
      attendeeLink,
      callStartedAt: new Date(),
      sessionStartedAt: new Date(),
      status: 'active'
    });
    
    await videoCall.save();
    
    res.json({ 
      message: 'Video call started',
      callId: videoCall._id,
      attendeeLink 
    });
  } catch (error) {
    console.error('Error starting video call:', error);
    res.status(500).json({ error: 'Failed to start video call' });
  }
};

// Join video call (student or alumni)
export const joinVideoCall: RequestHandler = async (req, res) => {
  try {
    const { requestId, userId, userType } = req.body; // userType: 'student' or 'alumni'
    
    const videoCall = await VideoCallSession.findOne({ 
      requestId, 
      status: 'active' 
    });
    
    if (!videoCall) {
      return res.status(404).json({ error: 'Active video call not found' });
    }
    
    if (userType === 'student') {
      videoCall.isStudentActive = true;
      videoCall.studentJoinedAt = new Date();
    } else if (userType === 'alumni') {
      videoCall.isAlumniActive = true;
      videoCall.alumniJoinedAt = new Date();
    }
    
    await videoCall.save();
    
    res.json({ 
      message: 'User joined video call',
      isStudentActive: videoCall.isStudentActive,
      isAlumniActive: videoCall.isAlumniActive
    });
  } catch (error) {
    console.error('Error joining video call:', error);
    res.status(500).json({ error: 'Failed to join video call' });
  }
};

// Leave video call (student or alumni)
export const leaveVideoCall: RequestHandler = async (req, res) => {
  try {
    const { requestId, userId, userType } = req.body; // userType: 'student' or 'alumni'
    
    const videoCall = await VideoCallSession.findOne({ 
      requestId, 
      status: 'active' 
    });
    
    if (!videoCall) {
      return res.status(404).json({ error: 'Active video call not found' });
    }
    
    if (userType === 'student') {
      videoCall.isStudentActive = false;
      videoCall.studentLeftAt = new Date();
    } else if (userType === 'alumni') {
      videoCall.isAlumniActive = false;
      videoCall.alumniLeftAt = new Date();
    }
    
    // If both users have left, end the call
    if (!videoCall.isStudentActive && !videoCall.isAlumniActive) {
      videoCall.status = 'ended';
      videoCall.callEndedAt = new Date();
    }
    
    await videoCall.save();
    
    res.json({ 
      message: 'User left video call',
      isStudentActive: videoCall.isStudentActive,
      isAlumniActive: videoCall.isAlumniActive,
      callEnded: videoCall.status === 'ended'
    });
  } catch (error) {
    console.error('Error leaving video call:', error);
    res.status(500).json({ error: 'Failed to leave video call' });
  }
};

// Get video call status
export const getVideoCallStatus: RequestHandler = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const videoCall = await VideoCallSession.findOne({ 
      requestId, 
      status: 'active' 
    });
    
    if (!videoCall) {
      return res.json({ 
        isActive: false,
        isStudentActive: false,
        isAlumniActive: false
      });
    }
    
    res.json({
      isActive: true,
      isStudentActive: videoCall.isStudentActive,
      isAlumniActive: videoCall.isAlumniActive,
      attendeeLink: videoCall.attendeeLink,
      channelName: videoCall.channelName,
      sessionStartedAt: videoCall.sessionStartedAt
    });
  } catch (error) {
    console.error('Error getting video call status:', error);
    res.status(500).json({ error: 'Failed to get video call status' });
  }
};

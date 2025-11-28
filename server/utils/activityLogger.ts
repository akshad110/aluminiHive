import { Activity } from "../models/Activity";

export interface CreateActivityData {
  userId: string;
  type: 'mentorship_request' | 'event_scheduled' | 'rating_received' | 'event_created' | 'profile_view';
  title: string;
  description: string;
  metadata?: {
    studentName?: string;
    eventName?: string;
    rating?: number;
    menteeName?: string;
    viewerName?: string;
    eventId?: string;
  };
}

export async function logActivity(data: CreateActivityData) {
  try {
    const activity = new Activity({
      userId: data.userId,
      type: data.type,
      title: data.title,
      description: data.description,
      metadata: data.metadata || {}
    });
    
    await activity.save();
    console.log(`✅ Activity logged: ${data.type} for user ${data.userId}`);
    return activity;
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    throw error;
  }
}

// Helper functions for common activity types
export async function logMentorshipRequest(alumniUserId: string, studentName: string, description: string) {
  return logActivity({
    userId: alumniUserId,
    type: 'mentorship_request',
    title: `New mentorship request from ${studentName}`,
    description,
    metadata: { studentName }
  });
}

export async function logProfileView(alumniUserId: string, viewerName: string) {
  return logActivity({
    userId: alumniUserId,
    type: 'profile_view',
    title: `Profile viewed by ${viewerName}`,
    description: `${viewerName} viewed your profile`,
    metadata: { viewerName }
  });
}

export async function logRating(alumniUserId: string, menteeName: string, rating: number) {
  return logActivity({
    userId: alumniUserId,
    type: 'rating_received',
    title: `Received ${rating}-star rating from mentee`,
    description: `${menteeName} - "Great mentor!"`,
    metadata: { menteeName, rating }
  });
}

export async function logEventCreated(alumniUserId: string, eventName: string) {
  return logActivity({
    userId: alumniUserId,
    type: 'event_created',
    title: `"${eventName}" event created`,
    description: `You created a new networking event`,
    metadata: { eventName }
  });
}

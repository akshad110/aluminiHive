import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Clock, 
  Check, 
  X, 
  MessageCircle, 
  User, 
  Calendar,
  Star,
  AlertCircle,
  Phone,
  Video,
  Mail,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Base URL for call log persistence API (Express dev server)
// Avoid referencing `process` directly in the browser to prevent "process is not defined" errors
const runtimeEnvBase =
  (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_API_BASE) ||
  (typeof process !== 'undefined' && (process as any).env && (process as any).env.NEXT_PUBLIC_API_BASE) ||
  undefined;
const API_BASE = (runtimeEnvBase as string | undefined) || 'http://localhost:8081';

interface MentorshipRequest {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  category: 'career_guidance' | 'interview_prep' | 'project_help' | 'networking' | 'skill_development';
  title: string;
  description: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high';
  skillsNeeded: string[];
  studentMessage?: string;
  alumniResponse?: string;
  rejectionReason?: string;
  callHistory?: {
    callId: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    callType: 'video' | 'audio';
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  }[];
  lastCallCompletedAt?: string;
  totalCallDuration?: number;
  createdAt: string;
  updatedAt: string;
}

const REJECTION_REASONS = [
  'Not available for this type of mentorship',
  'Schedule conflicts',
  'Outside my area of expertise',
  'Too many current mentees',
  'Personal reasons',
  'Other'
];

const CATEGORY_LABELS = {
  career_guidance: 'Career Guidance',
  interview_prep: 'Interview Preparation',
  project_help: 'Project Help',
  networking: 'Networking',
  skill_development: 'Skill Development'
};

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800'
};

export default function AlumniMentorshipPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'completed'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MentorshipRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<{[key: string]: boolean}>({});
  const [videoCallStatus, setVideoCallStatus] = useState<{[key: string]: {isStudentActive: boolean, isAlumniActive: boolean}}>({});
  const [sessionStartTime, setSessionStartTime] = useState<{[key: string]: Date}>({});
  const [minimumSessionDuration] = useState(1); // Minimum 1 minute required for demo
  const [showMentorSessions, setShowMentorSessions] = useState(false);

  // New state to track if student call tab is open per request
  const [studentCallOpenStatus, setStudentCallOpenStatus] = useState<{[key: string]: boolean}>({});

  // Effect to listen for localStorage changes for student call tab open/close
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key.startsWith('studentCallOpen_')) {
        const requestId = event.key.replace('studentCallOpen_', '');
        const isOpen = event.newValue === 'true';
        setStudentCallOpenStatus(prev => ({
          ...prev,
          [requestId]: isOpen
        }));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Initialize studentCallOpenStatus on mount and when requests change
  useEffect(() => {
    const status: {[key: string]: boolean} = {};
    requests.forEach(request => {
      const key = `studentCallOpen_${request._id}`;
      const value = localStorage.getItem(key);
      status[request._id] = value === 'true';
    });
    setStudentCallOpenStatus(status);
  }, [requests]);

  useEffect(() => {
    if (user) {
      fetchMentorshipRequests();
    }
  }, [user]);

  // Restore session timers from localStorage on page load
  useEffect(() => {
    const savedTimers = JSON.parse(localStorage.getItem('sessionTimers') || '{}');
    const restoredTimers: {[key: string]: Date} = {};
    
    Object.keys(savedTimers).forEach(requestId => {
      restoredTimers[requestId] = new Date(savedTimers[requestId]);
    });
    
    setSessionStartTime(restoredTimers);
  }, []);

  // Check video call status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      requests.forEach(request => {
        if (request.status !== 'completed') {
          checkVideoCallStatus(request._id);
        }
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [requests]);

  const fetchMentorshipRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/mentorship/requests/alumni/${user?._id || '507f1f77bcf86cd799439011'}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched mentorship requests:', data.requests);
        console.log('First request call history:', data.requests?.[0]?.callHistory);

        // Merge persisted call logs
        let mergedRequests: MentorshipRequest[] = data.requests || [];
        if (mergedRequests.length > 0) {
          try {
            const ids = mergedRequests.map((r: MentorshipRequest) => r._id).join(',');
            const logsRes = await fetch(`${API_BASE}/api/mentorship/mento_session/by-requests?ids=${ids}`);
            if (logsRes.ok) {
              const { logs } = await logsRes.json();
              const byId: {[k: string]: any} = {};
              (logs || []).forEach((l: any) => { byId[l.requestId] = l; });
              mergedRequests = mergedRequests.map((r: MentorshipRequest) => {
                const log = byId[r._id];
                if (!log) return r;
                const updated: MentorshipRequest = {
                  ...r,
                  callHistory: log.history || r.callHistory,
                  lastCallCompletedAt: log.lastCallCompletedAt || r.lastCallCompletedAt,
                  totalCallDuration: (typeof log.totalCallDuration === 'number') ? log.totalCallDuration : r.totalCallDuration,
                  status: log.completed ? 'completed' : r.status,
                };
                return updated;
              });
            }
          } catch (e) {
            console.warn('Failed to merge persisted call logs', e);
          }

          // Fallback: also merge from localStorage if server logs are missing/unavailable
          try {
            const localRaw = localStorage.getItem('mentorshipCallLogs');
            if (localRaw) {
              const localLogs = JSON.parse(localRaw) as Record<string, any>;
              mergedRequests = mergedRequests.map((r: MentorshipRequest) => {
                const log = localLogs[r._id];
                if (!log) return r;
                return {
                  ...r,
                  callHistory: log.history || r.callHistory,
                  lastCallCompletedAt: log.lastCallCompletedAt || r.lastCallCompletedAt,
                  totalCallDuration: (typeof log.totalCallDuration === 'number') ? log.totalCallDuration : r.totalCallDuration,
                  status: log.completed ? 'completed' : r.status,
                } as MentorshipRequest;
              });
            }
          } catch (e) {
            console.warn('Failed to merge localStorage call logs', e);
          }
        }

        setRequests(mergedRequests);
        
        if (data.requests && data.requests.length > 0) {
          const paymentPromises = data.requests
            .filter((request: any) => request.status === 'accepted' && request.studentId?._id)
            .map(async (request: any) => {
              const hasPaid = await checkPaymentStatus(request._id, request.studentId._id);
              return { requestId: request._id, hasPaid };
            });
          
          const paymentResults = await Promise.all(paymentPromises);
          const newPaymentStatus: {[key: string]: boolean} = {};
          paymentResults.forEach(result => {
            newPaymentStatus[result.requestId] = result.hasPaid;
          });
          
          setPaymentStatus(newPaymentStatus);
        }
      } else {
        console.error('Failed to fetch mentorship requests');
      }
    } catch (error) {
      console.error('Error fetching mentorship requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manual completion fallback in case the external call UI does not close the window
  const handleManualComplete = async (requestId: string) => {
    try {
      const infoRaw = localStorage.getItem('agoraCallInfo');
      const info = infoRaw ? JSON.parse(infoRaw) : null;
      const type: 'video' | 'audio' = info?.type === 'audio' ? 'audio' : 'video';
      const storedStart = info?.requestId === requestId && info?.callStartTime ? info.callStartTime : null;
      const startTime = storedStart || new Date(Date.now() - 60 * 1000).toISOString(); // default 1 min
      await trackCallEnd(requestId, type, startTime);
    } catch (e) {
      console.error('Manual complete failed, falling back to immediate completion', e);
      const startTime = new Date(Date.now() - 60 * 1000).toISOString();
      await trackCallEnd(requestId, 'video', startTime);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const response = await fetch(`${API_BASE}/api/mentorship/requests/${requestId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Mentorship request accepted successfully!');
        fetchMentorshipRequests();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const response = await fetch(`${API_BASE}/api/mentorship/requests/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason === 'Other' ? customReason : rejectionReason
        }),
      });

      if (response.ok) {
        alert('Mentorship request rejected');
        setShowRejectionModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
        setCustomReason('');
        fetchMentorshipRequests();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectionModal = (request: MentorshipRequest) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };

  const handleMarkCompleted = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const response = await fetch(`${API_BASE}/api/mentorship/requests/${requestId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Mentorship session marked as completed successfully!');
        fetchMentorshipRequests(); // Refresh the data
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to mark session as completed');
      }
    } catch (error) {
      console.error('Error marking session as completed:', error);
      alert('Failed to mark session as completed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCommunication = (type: string, studentEmail: string, requestId?: string) => {
    switch (type) {
      case 'chat':
        // Navigate to chat with student
        window.open(`/chat?personal=${studentEmail}`, '_blank');
        break;
      case 'email':
        // Open email client
        window.open(`mailto:${studentEmail}`, '_blank');
        break;
      case 'video':
        // Start Agora video call and session timer
        if (requestId) {
          startSessionTimer(requestId);
        }
        startAgoraCall('video', studentEmail, requestId);
        break;
      case 'voice':
        // Start Agora voice call and session timer
        if (requestId) {
          startSessionTimer(requestId);
        }
        startAgoraCall('audio', studentEmail, requestId);
        break;
      default:
        break;
    }
  };

  const startAgoraCall = async (type: 'video' | 'audio', studentEmail: string, requestId?: string) => {
   
    const channelName = requestId ? `mentorship-${requestId}-${Date.now()}` : `mentorship-${user?._id}-${studentEmail}-${Date.now()}`;
    const callStartTime = new Date().toISOString();
    
  
    if (requestId) {
      await trackCallStart(requestId, type);
    }
    
  
    localStorage.setItem('agoraCallInfo', JSON.stringify({
      channelName,
      type,
      initiator: user?.firstName || 'Alumni',
      studentEmail,
      timestamp: Date.now(),
      requestId,
      callStartTime
    }));

    // Show notification
    alert(`Starting ${type} call with student. The call window will open shortly.`);

    // Open Agora call in new tab (will appear next to current tab)
    const APP_BUILDER_URL = 'https://56c3a73ab43d95c4ac03-4z4bfl6j1-akshads-projects-48e10662.vercel.app';
    const agoraUrl = `${APP_BUILDER_URL}/join?roomId=${channelName}&enableScreenShare=true`;
    const callWindow = window.open(agoraUrl, '_blank', 'noopener,noreferrer,width=1200,height=800,scrollbars=yes,resizable=yes');
    
    // Monitor when the call window is closed to track call end
    if (callWindow && requestId) {
      const checkClosed = setInterval(() => {
        if (callWindow.closed) {
          clearInterval(checkClosed);
          // Call window was closed, track the end of the call
          trackCallEnd(requestId, type, callStartTime);
        }
      }, 1000);
      
      // Clear interval after 2 hours to prevent memory leaks
      setTimeout(() => {
        clearInterval(checkClosed);
      }, 2 * 60 * 60 * 1000);
    }
  };

  const checkPaymentStatus = async (requestId: string, studentId: string) => {
    if (!user?._id) return false;
    
    try {
      const response = await fetch(`/api/payment/mentorship/status/${studentId}/${user._id}/${requestId}`);
      const data = await response.json();
      return data.hasPaid || false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  };

  const hasPaidForRequest = (requestId: string) => {
    return paymentStatus[requestId] || false;
  };

  const checkVideoCallStatus = async (requestId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/video-call/status/${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setVideoCallStatus(prev => ({
          ...prev,
          [requestId]: {
            isStudentActive: data.isStudentActive || false,
            isAlumniActive: data.isAlumniActive || false
          }
        }));
        
        // Also check if there's an active session timer in database
        if (data.isActive && data.sessionStartedAt && !sessionStartTime[requestId]) {
          // Restore session timer from database
          setSessionStartTime(prev => ({
            ...prev,
            [requestId]: new Date(data.sessionStartedAt)
          }));
          
          // Also update localStorage
          const existingData = JSON.parse(localStorage.getItem('sessionTimers') || '{}');
          existingData[requestId] = data.sessionStartedAt;
          localStorage.setItem('sessionTimers', JSON.stringify(existingData));
        }
      }
    } catch (error) {
      console.error('Error checking video call status:', error);
    }
  };

  const isStudentInCall = (requestId: string) => {
    return videoCallStatus[requestId]?.isStudentActive || false;
  };

  const startSessionTimer = (requestId: string) => {
    const startTime = new Date();
    setSessionStartTime(prev => ({
      ...prev,
      [requestId]: startTime
    }));
    
    // Persist to localStorage
    const existingData = JSON.parse(localStorage.getItem('sessionTimers') || '{}');
    existingData[requestId] = startTime.toISOString();
    localStorage.setItem('sessionTimers', JSON.stringify(existingData));
    
    // Also persist to database
    fetch(`${API_BASE}/api/video-call/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        studentId: requests.find(r => r._id === requestId)?.studentId._id,
        alumniId: user?._id,
        channelName: `mentorship-${requestId}-${Date.now()}`,
        attendeeLink: `https://meet.example.com/${requestId}`
      })
    }).catch(console.error);
  };

  const hasMinimumSessionTime = (requestId: string) => {
    const startTime = sessionStartTime[requestId];
    if (!startTime) return false;
    
    const now = new Date();
    const durationMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
    return durationMinutes >= minimumSessionDuration;
  };

  const getSessionTimeRemaining = (requestId: string) => {
    const startTime = sessionStartTime[requestId];
    if (!startTime) return minimumSessionDuration;
    
    const now = new Date();
    const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
    const remaining = Math.max(0, minimumSessionDuration - elapsedMinutes);
    return Math.ceil(remaining);
  };

  const trackCallStart = async (requestId: string, callType: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/mentorship/mento_session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          callType,
          startTime: new Date().toISOString()
        }),
      });

      if (response.ok) {
        console.log('Call start tracked successfully');
      } else {
        console.error('Failed to track call start');
      }
    } catch (error) {
      console.error('Error tracking call start:', error);
    }
  };

  const trackCallEnd = async (requestId: string, callType: string, startTime: string) => {
    try {
      const endTime = new Date().toISOString();
      const duration = Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)); // duration in minutes
      
      const response = await fetch(`${API_BASE}/api/mentorship/mento_session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          callType,
          startTime,
          endTime,
          duration
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Call end tracked successfully');
        // Optimistically update local state so the item moves to Completed and history shows up
        const callId = data?.callId || `call-${Date.now()}`;
        const requestUpdate = data?.requestUpdated;
        setRequests((prev) =>
          prev.map((r) => {
            if (r._id !== requestId) return r;
            const updatedHistory = [
              ...(r.callHistory || []),
              {
                callId,
                startTime,
                endTime,
                duration,
                callType: callType as 'video' | 'audio',
                status: 'completed' as const,
              },
            ];
            const newTotalDuration = (r.totalCallDuration || 0) + (duration || 0);
            return {
              ...r,
              status: requestUpdate?.status || 'completed',
              lastCallCompletedAt: endTime,
              totalCallDuration: newTotalDuration,
              callHistory: updatedHistory,
            } as MentorshipRequest;
          })
        );
        // Persist minimal call data in localStorage as fallback
        try {
          const localRaw = localStorage.getItem('mentorshipCallLogs');
          const store = localRaw ? JSON.parse(localRaw) : {};
          const existing = store[requestId] || { history: [], totalCallDuration: 0, completed: false };
          existing.history = [
            ...existing.history,
            { callId, startTime, endTime, duration, callType, status: 'completed' },
          ];
          existing.totalCallDuration = (existing.totalCallDuration || 0) + (duration || 0);
          existing.lastCallCompletedAt = endTime;
          existing.completed = true;
          store[requestId] = existing;
          localStorage.setItem('mentorshipCallLogs', JSON.stringify(store));
        } catch {}
        // Clear any stored call info
        localStorage.removeItem('agoraCallInfo');
        // Notify success
        alert('Request successfully completed');
        // Also refresh from server when available to stay consistent
        fetchMentorshipRequests();
      } else {
        console.error('Failed to track call end');
        // Fallback: still update local state so user sees completion
        const callId = `call-${Date.now()}`;
        setRequests((prev) =>
          prev.map((r) => {
            if (r._id !== requestId) return r;
            const updatedHistory = [
              ...(r.callHistory || []),
              {
                callId,
                startTime,
                endTime,
                duration,
                callType: callType as 'video' | 'audio',
                status: 'completed' as const,
              },
            ];
            const newTotalDuration = (r.totalCallDuration || 0) + (duration || 0);
            return {
              ...r,
              status: 'completed',
              lastCallCompletedAt: endTime,
              totalCallDuration: newTotalDuration,
              callHistory: updatedHistory,
            } as MentorshipRequest;
          })
        );
        localStorage.removeItem('agoraCallInfo');
        alert('Request successfully completed');
      }
    } catch (error) {
      console.error('Error tracking call end:', error);
      // Fallback: still update local state so user sees completion
      const endTime = new Date().toISOString();
      const duration = Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60));
      const callId = `call-${Date.now()}`;
      setRequests((prev) =>
        prev.map((r) => {
          if (r._id !== requestId) return r;
          const updatedHistory = [
            ...(r.callHistory || []),
            {
              callId,
              startTime,
              endTime,
              duration,
              callType: callType as 'video' | 'audio',
              status: 'completed' as const,
            },
          ];
          const newTotalDuration = (r.totalCallDuration || 0) + (duration || 0);
          return {
            ...r,
            status: 'completed',
            lastCallCompletedAt: endTime,
            totalCallDuration: newTotalDuration,
            callHistory: updatedHistory,
          } as MentorshipRequest;
        })
      );
      localStorage.removeItem('agoraCallInfo');
      alert('Request successfully completed');
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return request.status !== 'completed';
    return request.status === filter;
  });

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatCallDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatCallTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading mentorship requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mentorship Requests</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage incoming mentorship requests from students</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-fit">
            {[
              { key: 'all', label: 'All', count: requests.length },
              { key: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
              { key: 'accepted', label: 'Accepted', count: requests.filter(r => r.status === 'accepted').length },
              { key: 'rejected', label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length },
              { key: 'completed', label: 'Completed', count: requests.filter(r => r.status === 'completed').length },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>



        <Dialog open={showMentorSessions} onOpenChange={setShowMentorSessions}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Mentor Sessions
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {requests.filter(r => r.status === 'completed').length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No completed sessions yet</h3>
                  <p>Completed mentorship sessions will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.filter(r => r.status === 'completed').map((request) => (
                    <div key={request._id} className="border rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.studentId.profilePicture} />
                            <AvatarFallback className="text-lg">
                              {request.studentId.firstName[0]}{request.studentId.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-lg">
                              {request.studentId.firstName} {request.studentId.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground">{request.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{request.studentId.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800 mb-2">Completed</Badge>
                          <div className="text-sm font-medium text-green-700">
                            {request.totalCallDuration ? formatCallDuration(request.totalCallDuration) : 'No duration recorded'}
                          </div>
                          {request.lastCallCompletedAt && (
                            <div className="text-xs text-muted-foreground">
                              Completed {getTimeAgo(request.lastCallCompletedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      {request.callHistory && request.callHistory.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Call History ({request.callHistory.length} calls)
                          </h5>
                          <div className="space-y-3">
                            {request.callHistory.map((call) => (
                              <div key={call.callId} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${call.callType === 'video' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                  <div>
                                    <span className="font-medium capitalize">{call.callType} Call</span>
                                    {call.duration && (
                                      <span className="text-muted-foreground ml-2">
                                        ({formatCallDuration(call.duration)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-muted-foreground">
                                    {formatCallTime(call.startTime)}
                                  </div>
                                  {call.status && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {call.status}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Past Calls Summary */}
        {requests.some(r => r.callHistory && r.callHistory.length > 0) && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Past Calls Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {requests.reduce((total, r) => total + (r.callHistory?.length || 0), 0)}
                    </div>
                    <div className="text-sm text-blue-800">Total Calls</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCallDuration(requests.reduce((total, r) => total + (r.totalCallDuration || 0), 0))}
                    </div>
                    <div className="text-sm text-green-800">Total Duration</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {requests.filter(r => r.status === 'completed').length}
                    </div>
                    <div className="text-sm text-purple-800">Completed Sessions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Requests List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No requests found</h3>
                <p className="text-muted-foreground">
                  {filter === 'all' 
                    ? "You don't have any mentorship requests yet."
                    : `No ${filter} requests found.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request._id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarImage src={request.studentId.profilePicture} />
                        <AvatarFallback className="text-sm sm:text-base">
                          {request.studentId.firstName[0]}{request.studentId.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold truncate">
                            {request.studentId.firstName} {request.studentId.lastName}
                          </h3>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            <Badge className={`text-xs ${STATUS_COLORS[request.status]}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                            <Badge className={`text-xs ${PRIORITY_COLORS[request.priority]}`}>
                              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            {getTimeAgo(request.createdAt)}
                          </span>
                        </div>
                        
                        {/* Communication Options */}
                        {request.status !== 'completed' ? (
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs px-2 sm:px-3"
                            onClick={() => handleCommunication('chat', request.studentId.email)}
                          >
                            <MessageCircle className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Chat</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs px-2 sm:px-3"
                            onClick={() => handleCommunication('email', request.studentId.email)}
                          >
                            <Mail className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Email</span>
                          </Button>
                          <div className="relative">
                            <Button
                              size="sm"
                              variant="outline" 
                              className={`text-xs px-2 sm:px-3 ${hasPaidForRequest(request._id) ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'opacity-50 cursor-not-allowed'}`}
                              disabled={!hasPaidForRequest(request._id)}
                              onClick={() => handleCommunication('video', request.studentId.email, request._id)}
                            >
                              <Video className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Video Call</span>
                            </Button>
                            {!hasPaidForRequest(request._id) && (
                              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                                Not Paid
                              </div>
                            )}
                            {hasPaidForRequest(request._id) && (
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 rounded-full">
                                Paid
                              </div>
                            )}
                          </div>
                          <div className="relative">
                            <Button
                              size="sm"
                              variant="outline" 
                              className={`text-xs px-2 sm:px-3 ${hasPaidForRequest(request._id) ? 'bg-green-600 hover:bg-green-700 text-white' : 'opacity-50 cursor-not-allowed'}`}
                              disabled={!hasPaidForRequest(request._id)}
                              onClick={() => handleCommunication('voice', request.studentId.email, request._id)}
                            >
                              <Phone className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Voice Call</span>
                            </Button>
                            {!hasPaidForRequest(request._id) && (
                              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                                Not Paid
                              </div>
                            )}
                            {hasPaidForRequest(request._id) && (
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 rounded-full">
                                Paid
                              </div>
                            )}
                          </div>
                          {/* Manual complete fallback */}
                          {hasPaidForRequest(request._id) && (request.status as string) !== 'completed' && !isStudentInCall(request._id) && hasMinimumSessionTime(request._id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 sm:px-3 bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={() => handleMarkCompleted(request._id)}
                              disabled={actionLoading === request._id}
                            >
                              {actionLoading === request._id ? 'Completing...' : (
                                <>
                                  <Check className="h-3 w-3 sm:mr-1" />
                                  <span className="hidden sm:inline">Mark Completed</span>
                                </>
                              )}
                            </Button>
                          )}
                          {isStudentInCall(request._id) && (
                            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              Student is in call - Complete button hidden
                            </div>
                          )}
                          {hasPaidForRequest(request._id) && !hasMinimumSessionTime(request._id) && !isStudentInCall(request._id) && (
                            <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                              Minimum {getSessionTimeRemaining(request._id)} minutes required before completion
                            </div>
                          )}
                        </div>
                        ) : (
                          <div className="mt-2 text-xs text-green-700">Session marked as completed.</div>
                        )}
                        {request.status !== 'completed' && !hasPaidForRequest(request._id) && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <DollarSign className="h-3 w-3 inline mr-1" />
                            Student needs to pay ₹100 to unlock video/voice calls
                          </div>
                        )}
                        {request.status !== 'completed' && hasPaidForRequest(request._id) && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                            <DollarSign className="h-3 w-3 inline mr-1" />
                            ✅ Payment received! Video/voice calls are now available
                            {sessionStartTime[request._id] && (
                              <div className="mt-1 text-xs">
                                Session started: {Math.floor((new Date().getTime() - sessionStartTime[request._id].getTime()) / (1000 * 60))} minutes ago
                                {!hasMinimumSessionTime(request._id) && (
                                  <span className="text-orange-600 ml-2">
                                    ({getSessionTimeRemaining(request._id)} min remaining for completion)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request._id)}
                            disabled={actionLoading === request._id}
                            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {actionLoading === request._id ? 'Accepting...' : 'Accept'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectionModal(request)}
                            disabled={actionLoading === request._id}
                            className="border-red-300 text-red-600 hover:bg-red-50 w-full sm:w-auto"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                  <div>
                    <h4 className="font-medium mb-1 text-sm sm:text-base">{request.title}</h4>
                    <Badge variant="outline" className="mb-2 text-xs">
                      {CATEGORY_LABELS[request.category]}
                    </Badge>
                    <p className="text-muted-foreground text-sm sm:text-base">{request.description}</p>
                  </div>

                  {request.skillsNeeded.length > 0 && (
                    <div>
                      <h5 className="text-xs sm:text-sm font-medium mb-2">Skills Needed:</h5>
                      <div className="flex flex-wrap gap-1">
                        {request.skillsNeeded.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.studentMessage && (
                    <div>
                      <h5 className="text-xs sm:text-sm font-medium mb-2">Student Message:</h5>
                      <p className="text-xs sm:text-sm text-muted-foreground bg-gray-50 p-2 sm:p-3 rounded-md">
                        {request.studentMessage}
                      </p>
                    </div>
                  )}

                  {request.rejectionReason && (
                    <div>
                      <h5 className="text-xs sm:text-sm font-medium mb-2 text-red-600">Rejection Reason:</h5>
                      <p className="text-xs sm:text-sm text-red-600 bg-red-50 p-2 sm:p-3 rounded-md">
                        {request.rejectionReason}
                      </p>
                    </div>
                  )}


                  {/* Last Call Info */}
                  {request.lastCallCompletedAt && (
                    <div className="bg-green-50 p-2 rounded text-xs text-green-800">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Last call completed: {getTimeAgo(request.lastCallCompletedAt)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Rejection Modal */}
        {showRejectionModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Reject Mentorship Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Reason for rejection:</label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a reason</option>
                    {REJECTION_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                {rejectionReason === 'Other' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Custom reason:</label>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Please specify the reason..."
                      className="w-full p-2 border border-gray-300 rounded-md h-20"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button
                    onClick={() => handleRejectRequest(selectedRequest._id)}
                    disabled={!rejectionReason || (rejectionReason === 'Other' && !customReason.trim())}
                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                  >
                    Reject Request
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectionModal(false);
                      setSelectedRequest(null);
                      setRejectionReason('');
                      setCustomReason('');
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

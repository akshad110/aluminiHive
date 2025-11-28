import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';

// Agora.io SDK (you'll need to install: npm install agora-rtc-sdk-ng)
import AgoraRTC from 'agora-rtc-sdk-ng';

interface AgoraCallPageProps {}

const AgoraCallPage: React.FC<AgoraCallPageProps> = () => {
  const [searchParams] = useSearchParams();
  const channelName = searchParams.get('channel') || '';
  const callType = searchParams.get('type') || 'video';
  const userRole = searchParams.get('role') || 'mentor';
  
  // Agora configuration
  const APP_ID = import.meta.env.VITE_AGORA_APP_ID || '06f40ac109b40b48de936fd7e2b4a74';
  const TOKEN = import.meta.env.VITE_AGORA_TOKEN || null;
  
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  
  // Agora client and tracks
  const clientRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);
  const localVideoTrackRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Agora client when component mounts
    initializeAgora();
    
    return () => {
      // Cleanup on unmount
      leaveCall();
    };
  }, []);

  const initializeAgora = async () => {
    try {
      setIsLoading(true);
      
       // Initialize Agora client
       const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
       clientRef.current = client;
       
       // Set up event listeners
       client.on('user-published', handleUserPublished);
       client.on('user-unpublished', handleUserUnpublished);
      
      console.log('Agora initialized for channel:', channelName);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize Agora:', err);
      setError('Failed to initialize video call. Please check your Agora configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const joinCall = async () => {
    try {
      setIsLoading(true);
      
       // Join the channel
       await clientRef.current.join(APP_ID, channelName, TOKEN, null);
       
       // Create and publish local tracks
       if (callType === 'video') {
         localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack();
         localVideoTrackRef.current.play(localVideoRef.current);
         await clientRef.current.publish([localVideoTrackRef.current]);
       }
       
       localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
       await clientRef.current.publish([localAudioTrackRef.current]);
      
      setIsJoined(true);
      console.log('Successfully joined channel:', channelName);
    } catch (err) {
      console.error('Failed to join call:', err);
      setError('Failed to join the call. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveCall = async () => {
    try {
      // Stop and close local tracks
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      
      // Leave the channel
      if (clientRef.current) {
        await clientRef.current.leave();
      }
      
      setIsJoined(false);
      console.log('Left the call');
    } catch (err) {
      console.error('Error leaving call:', err);
    }
  };

  const toggleMute = () => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

   const handleUserPublished = async (user: any, mediaType: string) => {
     // Subscribe to the remote user
     await clientRef.current.subscribe(user, mediaType);
     
     if (mediaType === 'video') {
       const remoteVideoTrack = user.videoTrack;
       remoteVideoTrack.play(remoteVideoRef.current);
     }
     
     if (mediaType === 'audio') {
       const remoteAudioTrack = user.audioTrack;
       remoteAudioTrack.play();
     }
   };

  const handleUserUnpublished = (user: any, mediaType: string) => {
    if (mediaType === 'video') {
      // Remove remote video track
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Call Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.close()}>Close</Button>
        </Card>
      </div>
    );
  }

  // Use Agora App Builder iframe instead of custom implementation
  const agoraAppBuilderUrl = process.env.VITE_AGORA_APP_BUILDER_URL || 'https://your-app-builder-url.agora.io';
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {callType === 'video' ? 'Video Call' : 'Voice Call'}
          </h1>
          <p className="text-gray-300">Channel: {channelName}</p>
          <p className="text-gray-400">Role: {userRole}</p>
        </div>

        {/* Agora App Builder Integration */}
        <div className="w-full h-screen">
          <iframe
            src={`${agoraAppBuilderUrl}?channel=${channelName}&type=${callType}&role=${userRole}`}
            className="w-full h-full border-0 rounded-lg"
            title="AlumniHive Video Call"
            allow="camera; microphone; fullscreen"
            allowFullScreen
          />
        </div>

        {/* Fallback for if iframe doesn't work */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400 mb-4">
            If the video call doesn't load, you can also use the direct link:
          </p>
          <Button
            onClick={() => window.open(`${agoraAppBuilderUrl}?channel=${channelName}&type=${callType}&role=${userRole}`, '_blank')}
            variant="outline"
            className="text-white border-gray-600 hover:bg-gray-800"
          >
            Open in New Tab
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgoraCallPage;

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Users } from 'lucide-react';

// This will be replaced with the actual Agora App Builder code
// For now, we'll create a custom implementation

interface AgoraCallPageCustomProps {}

const AgoraCallPageCustom: React.FC<AgoraCallPageCustomProps> = () => {
  const [searchParams] = useSearchParams();
  const channelName = searchParams.get('channel') || '';
  const callType = searchParams.get('type') || 'video';
  const userRole = searchParams.get('role') || 'mentor';
  
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState(1);
  
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
      
      // Agora configuration
      const APP_ID = import.meta.env.VITE_AGORA_APP_ID || 'your-agora-app-id';
      const TOKEN = import.meta.env.VITE_AGORA_TOKEN || null;
      
      // Initialize Agora client
      // const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      // clientRef.current = client;
      
      // Set up event listeners
      // client.on('user-published', handleUserPublished);
      // client.on('user-unpublished', handleUserUnpublished);
      // client.on('user-joined', handleUserJoined);
      // client.on('user-left', handleUserLeft);
      
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
      // await clientRef.current.join(APP_ID, channelName, TOKEN, null);
      
      // Create and publish local tracks
      if (callType === 'video') {
        // localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack();
        // localVideoTrackRef.current.play(localVideoRef.current);
        // await clientRef.current.publish([localVideoTrackRef.current]);
      }
      
      // localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
      // await clientRef.current.publish([localAudioTrackRef.current]);
      
      setIsJoined(true);
      setParticipants(1);
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
      setParticipants(0);
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
    // await clientRef.current.subscribe(user, mediaType);
    
    if (mediaType === 'video') {
      // const remoteVideoTrack = user.videoTrack;
      // remoteVideoTrack.play(remoteVideoRef.current);
    }
    
    if (mediaType === 'audio') {
      // const remoteAudioTrack = user.audioTrack;
      // remoteAudioTrack.play();
    }
  };

  const handleUserUnpublished = (user: any, mediaType: string) => {
    if (mediaType === 'video') {
      // Remove remote video track
    }
  };

  const handleUserJoined = (user: any) => {
    setParticipants(prev => prev + 1);
    console.log('User joined:', user.uid);
  };

  const handleUserLeft = (user: any) => {
    setParticipants(prev => Math.max(0, prev - 1));
    console.log('User left:', user.uid);
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </h1>
            <p className="text-gray-300">Channel: {channelName}</p>
            <p className="text-gray-400">Role: {userRole}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            <span>{participants} participant{participants !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Local Video */}
          <Card className="bg-gray-800 p-4">
            <h3 className="text-lg font-semibold mb-2">You</h3>
            <div 
              ref={localVideoRef}
              className="w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center"
            >
              {!isVideoEnabled && (
                <div className="text-center">
                  <VideoOff className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-400">Camera Off</p>
                </div>
              )}
            </div>
          </Card>

          {/* Remote Video */}
          <Card className="bg-gray-800 p-4">
            <h3 className="text-lg font-semibold mb-2">Remote Participant</h3>
            <div 
              ref={remoteVideoRef}
              className="w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center"
            >
              <div className="text-center">
                <Video className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-400">Waiting for participant...</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center space-x-4">
          {!isJoined ? (
            <Button
              onClick={joinCall}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg"
            >
              {isLoading ? 'Joining...' : 'Join Call'}
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "outline"}
                className="text-white px-6 py-3"
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              
              {callType === 'video' && (
                <Button
                  onClick={toggleVideo}
                  variant={!isVideoEnabled ? "destructive" : "outline"}
                  className="text-white px-6 py-3"
                >
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
              )}
              
              <Button
                onClick={leaveCall}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 px-6 py-3"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                Leave Call
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-gray-400">
          <p className="text-sm">
            {!isJoined 
              ? 'Click "Join Call" to start the session'
              : 'Use the controls above to manage your audio and video'
            }
          </p>
          <p className="text-xs mt-2">
            Share this channel name with the other participant: <code className="bg-gray-800 px-2 py-1 rounded">{channelName}</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgoraCallPageCustom;

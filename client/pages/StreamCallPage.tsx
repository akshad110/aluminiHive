import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Call,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  SpeakerLayout,
  CallControls,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-styling/dist/css/styles.css";
import "@/styles/stream-call-light.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiUrl } from "@/config/api";
import { PhoneOff } from "lucide-react";

export default function StreamCallPage() {
  const [searchParams] = useSearchParams();
  const channel = searchParams.get("channel") || "";
  const callType = searchParams.get("type") || "video";
  const userId = searchParams.get("userId") || "";
  const userName = searchParams.get("userName") || "Guest";
  const role = searchParams.get("role") || "student";

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apiKey = import.meta.env.VITE_STREAM_API_KEY as string | undefined;

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.background = "#ffffff";
    return () => {
      document.body.style.margin = "";
      document.body.style.background = "";
    };
  }, []);

  useEffect(() => {
    if (!apiKey) {
      setError("Stream API key is not configured (VITE_STREAM_API_KEY).");
      setLoading(false);
      return;
    }

    if (!channel || !userId) {
      setError("Missing call channel or user information.");
      setLoading(false);
      return;
    }

    let videoClient: StreamVideoClient | null = null;
    let activeCall: Call | null = null;
    let cancelled = false;

    async function joinCall() {
      try {
        setLoading(true);
        setError(null);

        const tokenResponse = await fetch(apiUrl("/stream/token"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, userName }),
        });

        if (!tokenResponse.ok) {
          const data = await tokenResponse.json().catch(() => ({}));
          throw new Error(data.error || "Failed to get Stream token");
        }

        const { token } = await tokenResponse.json();

        videoClient = new StreamVideoClient({
          apiKey,
          user: { id: userId, name: userName },
          token,
        });

        activeCall = videoClient.call("default", channel);
        await activeCall.join({ create: role === "mentor" });

        if (callType === "audio") {
          await activeCall.camera.disable();
        }

        if (!cancelled) {
          setClient(videoClient);
          setCall(activeCall);
        }
      } catch (err) {
        console.error("Failed to join Stream call:", err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to join the call."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    joinCall();

    return () => {
      cancelled = true;
      activeCall?.leave().catch(() => undefined);
      videoClient?.disconnectUser().catch(() => undefined);
    };
  }, [apiKey, channel, userId, userName, callType, role]);

  const handleLeaveCall = async () => {
    try {
      await call?.leave();
      await client?.disconnectUser();
    } finally {
      window.close();
    }
  };

  if (loading) {
    return (
      <div className="stream-call-page min-h-screen bg-white flex flex-col items-center justify-center text-gray-700">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-lg font-medium">Connecting to call...</p>
      </div>
    );
  }

  if (error || !client || !call) {
    return (
      <div className="stream-call-page min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Call Error</h2>
          <p className="text-gray-600 mb-4">{error || "Unable to start call."}</p>
          <Button onClick={() => window.close()}>Close</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="stream-call-page min-h-screen bg-white flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {callType === "video" ? "Video Call" : "Voice Call"}
          </h1>
          <p className="text-sm text-gray-500">
            {userName} · {role === "mentor" ? "Mentor" : "Student"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleLeaveCall}
        >
          <PhoneOff className="h-4 w-4 mr-2" />
          Leave
        </Button>
      </header>

      <div className="flex-1 min-h-0">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <StreamTheme className="stream-call-light h-full">
              <div className="h-[calc(100vh-64px)] flex flex-col bg-white">
                <div className="flex-1 min-h-0 bg-white stream-call-video-area overflow-hidden">
                  <SpeakerLayout />
                </div>
                <div className="stream-call-controls-bar px-4 bg-white border-t border-gray-200">
                  <CallControls />
                </div>
              </div>
            </StreamTheme>
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  );
}

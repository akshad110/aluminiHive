import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserPlus, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ConnectionStats {
  totalConnections: number;
  pendingRequests: number;
  sentRequests: number;
  receivedRequests: number;
}

interface ConnectionStatsProps {
  userId?: string;
  onUpdate?: () => void;
}

export default function ConnectionStats({ userId, onUpdate }: ConnectionStatsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?._id;

  useEffect(() => {
    if (targetUserId) {
      fetchConnectionStats();
    }
  }, [targetUserId]);

  const fetchConnectionStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/connections/stats/${targetUserId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching connection stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh stats when onUpdate is called
  useEffect(() => {
    if (onUpdate) {
      fetchConnectionStats();
    }
  }, [onUpdate]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading stats...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Unable to load connection stats</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Connections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.totalConnections}</p>
            <p className="text-sm text-muted-foreground">Connected</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium text-blue-600">{stats.sentRequests}</p>
              <p className="text-muted-foreground">Sent</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-purple-600">{stats.receivedRequests}</p>
              <p className="text-muted-foreground">Received</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

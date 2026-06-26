import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Clock, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ConnectionRequest {
  _id: string;
  requester: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    college?: string;
  };
  status: "pending" | "accepted" | "rejected";
  message?: string;
  createdAt: string;
}

interface ConnectionRequestsProps {
  onConnectionUpdate?: () => void;
}

export default function ConnectionRequests({ onConnectionUpdate }: ConnectionRequestsProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConnectionRequests();
    }
  }, [user]);

  const fetchConnectionRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/connections/${user?._id}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching connection requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequest = async (requestId: string, status: "accepted" | "rejected") => {
    try {
      setUpdating(requestId);
      const response = await fetch(`/api/connections/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Update the local state
        setRequests(prev => 
          prev.map(req => 
            req._id === requestId 
              ? { ...req, status }
              : req
          )
        );
        
        // Notify parent component
        if (onConnectionUpdate) {
          onConnectionUpdate();
        }
        
        alert(`Connection request ${status} successfully!`);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update connection request");
      }
    } catch (error) {
      console.error("Error updating connection request:", error);
      alert("Failed to update connection request");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-3 w-3" />;
      case "accepted": return <Check className="h-3 w-3" />;
      case "rejected": return <X className="h-3 w-3" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connection Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests.filter(req => req.status === "pending");
  const otherRequests = requests.filter(req => req.status !== "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Connection Requests
          {pendingRequests.length > 0 && (
            <Badge className="bg-blue-100 text-blue-800">
              {pendingRequests.length} Pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-4">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No connection requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">Pending Requests</h4>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.requester.profilePicture} />
                          <AvatarFallback>
                            {request.requester.firstName?.[0]}{request.requester.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {request.requester.firstName} {request.requester.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.requester.college || 'Student'}
                          </p>
                          {request.message && (
                            <p className="text-xs text-muted-foreground mt-1">
                              "{request.message}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateRequest(request._id, "accepted")}
                          disabled={updating === request._id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          {updating === request._id ? "Accepting..." : "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateRequest(request._id, "rejected")}
                          disabled={updating === request._id}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {updating === request._id ? "Rejecting..." : "Reject"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Requests */}
            {otherRequests.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-gray-600">Recent Requests</h4>
                <div className="space-y-2">
                  {otherRequests.slice(0, 5).map((request) => (
                    <div key={request._id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={request.requester.profilePicture} />
                          <AvatarFallback className="text-xs">
                            {request.requester.firstName?.[0]}{request.requester.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {request.requester.firstName} {request.requester.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Mail, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar,
  MessageCircle,
  ExternalLink,
  Star,
  Award,
  UserPlus,
  Check,
  X,
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ConnectionStats from "@/components/ConnectionStats";
import ConnectionRequests from "@/components/ConnectionRequests";

interface AlumniProfile {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    college?: string;
  };
  bio?: string;
  graduationYear: number;
  currentCompany?: string;
  currentPosition?: string;
  industry: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  skills: string[];
  experience: {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }[];
  achievements: {
    title: string;
    description: string;
    date: string;
  }[];
  socialLinks: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  isAvailableForMentoring: boolean;
  mentoringInterests: string[];
  studentsMentored: number;
  eventsHosted: number;
  profileViews: number;
  createdAt: string;
  updatedAt: string;
}

export default function AlumniProfilePage() {
  const { alumniId } = useParams<{ alumniId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alumni, setAlumni] = useState<AlumniProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>("none");
  const [connectionLoading, setConnectionLoading] = useState(false);

  useEffect(() => {
    if (alumniId) {
      fetchAlumniProfile();
      if (user && user._id !== alumniId) {
        checkConnectionStatus();
      }
    }
  }, [alumniId, user]);

  const fetchAlumniProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/alumni/${alumniId}`);
      if (response.ok) {
        const data = await response.json();
        setAlumni(data);
      } else {
        console.error("Failed to fetch alumni profile");
      }
    } catch (error) {
      console.error("Error fetching alumni profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    // Navigate to unified chat with personal messaging
    navigate(`/chat?personal=${alumniId}`);
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`/api/connections/status/${user?._id}/${alumniId}`);
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data.status);
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
    }
  };

  const handleSendConnectionRequest = async () => {
    try {
      setConnectionLoading(true);
      const response = await fetch(`/api/connections/${user?._id}/${alumniId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Hi ${alumni?.userId?.firstName}, I'd like to connect with you!`
        }),
      });

      if (response.ok) {
        setConnectionStatus("pending");
        alert("Connection request sent successfully!");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to send connection request");
      }
    } catch (error) {
      console.error("Error sending connection request:", error);
      alert("Failed to send connection request");
    } finally {
      setConnectionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!alumni) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The alumni profile you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Alumni Profile</h1>
            <p className="text-muted-foreground">
              Connect with {alumni.userId?.firstName} {alumni.userId?.lastName}
            </p>
          </div>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={alumni.userId?.profilePicture} />
                  <AvatarFallback className="text-2xl">
                    {alumni.userId?.firstName?.[0]}{alumni.userId?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {alumni.userId?.firstName} {alumni.userId?.lastName}
                      {alumni.isAvailableForMentoring && (
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          <Star className="h-3 w-3 mr-1" />
                          Available for Mentoring
                        </Badge>
                      )}
                    </h2>
                    <p className="text-muted-foreground">
                      {alumni.currentPosition} at {alumni.currentCompany}
                    </p>
                  </div>
                  
                  {user?.role === "student" && (
                    <div className="flex gap-2">
                      <Button onClick={handleMessage}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      
                      {connectionStatus === "none" && (
                        <Button 
                          variant="outline" 
                          onClick={handleSendConnectionRequest}
                          disabled={connectionLoading}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          {connectionLoading ? "Sending..." : "Connect"}
                        </Button>
                      )}
                      
                      {connectionStatus === "pending" && (
                        <Button variant="outline" disabled>
                          <Clock className="h-4 w-4 mr-2" />
                          Request Sent
                        </Button>
                      )}
                      
                      {connectionStatus === "accepted" && (
                        <Button variant="outline" disabled>
                          <Check className="h-4 w-4 mr-2" />
                          Connected
                        </Button>
                      )}
                      
                      {connectionStatus === "rejected" && (
                        <Button variant="outline" disabled>
                          <X className="h-4 w-4 mr-2" />
                          Request Declined
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>{alumni.userId?.college || 'Not specified'} • {alumni.graduationYear}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{alumni.experience?.length || 0} years experience</span>
                  </div>
                  {alumni.currentCompany && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{alumni.currentCompany}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{alumni.location?.city}, {alumni.location?.state}</span>
                  </div>
                </div>

                {alumni.bio && (
                  <p className="text-muted-foreground">{alumni.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        {alumni.skills && alumni.skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {alumni.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievements */}
        {alumni.achievements && alumni.achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {alumni.achievements.map((achievement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <div>
                      <span className="font-medium">{achievement.title}</span>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Social Links */}
        {alumni.socialLinks && Object.values(alumni.socialLinks).some(link => link) && (
          <Card>
            <CardHeader>
              <CardTitle>Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {alumni.socialLinks.linkedin && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(alumni.socialLinks.linkedin, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                )}
                {alumni.socialLinks.github && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(alumni.socialLinks.github, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    GitHub
                  </Button>
                )}
                {alumni.socialLinks.twitter && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(alumni.socialLinks.twitter, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Stats and Requests - Only show for alumni viewing their own profile */}
        {user?.role === "alumni" && user?._id === alumniId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConnectionStats userId={alumniId} />
            <ConnectionRequests onConnectionUpdate={() => {
              // Refresh connection status when requests are updated
              if (user && user._id !== alumniId) {
                checkConnectionStatus();
              }
            }} />
          </div>
        )}

        {/* Connection Stats for students viewing alumni profile */}
        {user?.role === "student" && (
          <ConnectionStats userId={alumniId} />
        )}
      </div>
    </div>
  );
}

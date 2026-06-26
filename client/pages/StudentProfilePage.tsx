import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  GraduationCap, 
  Calendar,
  MessageCircle,
  Users,
  Star,
  Award,
  BookOpen,
  Target,
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface StudentProfile {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  studentId?: string;
  college?: string;
  currentYear?: string;
  expectedGraduationYear?: number;
  branch?: string;
  minor?: string;
  gpa?: string;
  interests?: string;
  careerGoals?: string;
  skills?: string[];
  bio?: string;
  isLookingForMentorship?: boolean;
  mentorshipInterests?: string;
  connections?: number;
  mentorshipRequests?: number;
  profileViews?: number;
  createdAt: string;
  updatedAt: string;
}

export default function StudentProfilePage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (studentId) {
      fetchStudentProfile();
      setIsOwnProfile(user?._id === studentId);
    }
  }, [studentId, user]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      console.log("Fetching student profile for ID:", studentId);
      
      // Get the profile from localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const userObj = JSON.parse(userData);
        console.log("Current user:", userObj);
        
        if (userObj._id === studentId) {
          const profileKey = `student_profile_${studentId}`;
          const savedProfile = localStorage.getItem(profileKey);
          console.log("Saved profile data:", savedProfile);
          
          if (savedProfile) {
            const profileData = JSON.parse(savedProfile);
            // Ensure skills is always an array
            const skills = Array.isArray(profileData.skills) ? profileData.skills : [];
            setStudent({
              _id: studentId,
              userId: userObj,
              ...profileData,
              skills, // Ensure skills is an array
              connections: 5, // Mock data
              mentorshipRequests: 3, // Mock data
              profileViews: 12, // Mock data
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          } else {
            // If no profile data, create a basic profile
            setStudent({
              _id: studentId,
              userId: userObj,
              skills: [], // Ensure skills is an array
              connections: 0,
              mentorshipRequests: 0,
              profileViews: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        } else {
          console.log("User ID mismatch:", userObj._id, "vs", studentId);
        }
      } else {
        console.log("No user data found in localStorage");
      }
    } catch (error) {
      console.error("Error fetching student profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    navigate(`/chat?personal=${studentId}`);
  };

  const handleEditProfile = () => {
    navigate('/student/profile-setup');
  };

  console.log("StudentProfilePage render - loading:", loading, "student:", student, "studentId:", studentId);

  if (loading) {
    return (
      <section className="container mx-auto py-8 md:py-12">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!student) {
    return (
      <section className="container mx-auto py-8 md:py-12">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="text-center py-8">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-muted-foreground">Profile Not Found</h2>
            <p className="text-muted-foreground mt-2">This student profile could not be found.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto py-8 md:py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={student.userId.profilePicture} />
                <AvatarFallback className="text-2xl">
                  {student.userId.firstName.charAt(0)}{student.userId.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold" style={{fontFamily:'Montserrat'}}>
                      {student.userId.firstName} {student.userId.lastName}
                    </h1>
                    <p className="text-lg text-muted-foreground mt-1">
                      {student.college || 'College not specified'} • {student.branch || 'Branch not specified'}
                    </p>
                    {student.currentYear && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {student.currentYear} Year • Expected Graduation: {student.expectedGraduationYear}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    {!isOwnProfile && (
                      <Button onClick={handleMessage} className="bg-blue-600 hover:bg-blue-700">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    )}
                    {isOwnProfile && (
                      <Button onClick={handleEditProfile} variant="outline">
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
                
                {student.bio && (
                  <p className="text-muted-foreground mt-4 leading-relaxed">
                    {student.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{student.connections || 0}</p>
                  <p className="text-sm text-muted-foreground">Connections</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{student.mentorshipRequests || 0}</p>
                  <p className="text-sm text-muted-foreground">Mentorship Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{student.profileViews || 0}</p>
                  <p className="text-sm text-muted-foreground">Profile Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Academic Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">College</p>
                  <p className="text-sm text-muted-foreground">{student.college || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Current Year</p>
                  <p className="text-sm text-muted-foreground">{student.currentYear || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Award className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Branch</p>
                  <p className="text-sm text-muted-foreground">{student.branch || 'Not specified'}</p>
                </div>
              </div>
              
              {student.minor && (
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Minor</p>
                    <p className="text-sm text-muted-foreground">{student.minor}</p>
                  </div>
                </div>
              )}
              
              {student.gpa && (
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">GPA</p>
                    <p className="text-sm text-muted-foreground">{student.gpa}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Career & Interests */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Career & Interests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {student.interests && (
                <div>
                  <p className="text-sm font-medium mb-2">Interests</p>
                  <p className="text-sm text-muted-foreground">{student.interests}</p>
                </div>
              )}
              
              {student.careerGoals && (
                <div>
                  <p className="text-sm font-medium mb-2">Career Goals</p>
                  <p className="text-sm text-muted-foreground">{student.careerGoals}</p>
                </div>
              )}
              
              {student.skills && Array.isArray(student.skills) && student.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {student.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {student.isLookingForMentorship && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-600">Looking for Mentorship</p>
                  </div>
                  {student.mentorshipInterests && (
                    <p className="text-sm text-muted-foreground mt-2">{student.mentorshipInterests}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Connection Stats - Temporarily removed for debugging */}
      </div>
    </section>
  );
}
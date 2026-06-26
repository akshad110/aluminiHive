import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ConnectionStats from "@/components/ConnectionStats";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  MessageCircle, 
  Star, 
  Target,
  Award,
  Clock,
  MapPin,
  Briefcase
} from "lucide-react";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function Student() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileProgress, setProfileProgress] = useState(0);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const calculateProfileProgress = (profile: any) => {
    if (!profile) return 0;
    
    const fields = [
      'studentId', 'currentYear', 'expectedGraduationYear', 'branch',
      'interests', 'careerGoals', 'skills', 'bio'
    ];
    
    const completedFields = fields.filter(field => {
      const value = profile[field];
      return value && value !== '' && value !== 'Not specified' && 
             (Array.isArray(value) ? value.length > 0 : true);
    });
    
    return Math.round((completedFields.length / fields.length) * 100);
  };

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);

      // Check if this is first login (no profile data in localStorage)
      const profileKey = `student_profile_${userObj._id}`;
      const savedProfile = localStorage.getItem(profileKey);
      
      if (!savedProfile) {
        setIsFirstLogin(true);
        setProfileProgress(0);
      } else {
        const profile = JSON.parse(savedProfile);
        setProfileData(profile);
        setProfileProgress(calculateProfileProgress(profile));
      }
    }
  }, []);

  if (!user) {
    return (
      <section className="container mx-auto py-12 md:py-16">
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-primary" style={{fontFamily:'Montserrat'}}>Student Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Please log in to access your dashboard.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto py-6 sm:py-8 md:py-12 px-4 w-full">
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 p-3 sm:p-4 shadow-sm">
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 shadow-sm hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800" style={{fontFamily:'Montserrat'}}>
                  Welcome back, {user.firstName}! 👋
                </h1>
                <p className="text-slate-600 text-sm">
                  Ready to connect with amazing alumni mentors?
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="hover:scale-105 transition-all duration-200 cursor-pointer"
                onClick={() => navigate('/mentorship')}
              >
                <Target className="h-3 w-3 mr-2" />
                Mentorship Ready
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Setup */}
        {(isFirstLogin || profileProgress < 100) && (
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  {isFirstLogin ? "🎉" : "📝"}
                </div>
                {isFirstLogin ? "Welcome! Complete Your Profile" : "Complete Your Profile"}
              </CardTitle>
              <CardDescription className="text-base">
                {isFirstLogin 
                  ? "Set up your student profile to connect with alumni mentors and access personalized features."
                  : "Your profile is incomplete. Complete it to unlock all features and connect with mentors."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Profile Completion</span>
                  <span className="text-blue-600">{profileProgress}%</span>
                </div>
                <Progress value={profileProgress} className="h-2 bg-white border border-blue-200" />
                <p className="text-xs text-muted-foreground">
                  {profileProgress === 0 
                    ? "Start by setting up your basic information"
                    : profileProgress < 50
                    ? "You're making good progress! Keep going."
                    : profileProgress < 100
                    ? "Almost there! Just a few more details."
                    : "Profile complete! 🎉"
                  }
                </p>
              </div>
              
              <Button
                size="sm"
                className="bg-brand-orange hover:bg-brand-orange/90 w-auto px-4 py-2 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() => navigate('/student/profile-setup')}
              >
                {isFirstLogin ? "🚀 Set Up Profile" : "✨ Complete Profile"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-100">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">24</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Available Mentors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-100">
                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">3</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Active Chats</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connection Stats */}
        {authUser && (
          <ConnectionStats userId={authUser._id} />
        )}


        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New message from Sarah Johnson</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Registered for "Career Planning Workshop"</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                  <Star className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Profile viewed by 3 alumni</p>
                  <p className="text-xs text-muted-foreground">3 days ago</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Profile Completion</span>
                  <span className="font-medium text-blue-600">{profileProgress}%</span>
                </div>
                <Progress value={profileProgress} className="h-1 bg-white border border-blue-200" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mentorship Connections</span>
                  <span className="font-medium">3/10</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Computer Science • Junior Year</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Briefcase className="h-4 w-4" />
                  <span>Looking for Software Engineering mentorship</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

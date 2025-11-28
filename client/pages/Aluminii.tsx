import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  TrendingUp, 
  MessageCircle, 
  Star, 
  Target,
  Award,
  Clock,
  MapPin,
  Briefcase,
  Heart,
  BookOpen
} from "lucide-react";
import { DashboardStats, MentorshipOpportunity, ImpactMetrics, RecentActivity } from "@shared/api";
import { useAuth } from "@/contexts/AuthContext";
import ConnectionStats from "@/components/ConnectionStats";
import ConnectionRequests from "@/components/ConnectionRequests";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function Aluminii() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileProgress, setProfileProgress] = useState(0);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [mentorshipOpportunities, setMentorshipOpportunities] = useState<MentorshipOpportunity[]>([]);
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingDynamicData, setLoadingDynamicData] = useState(true);

  const calculateProfileProgress = (profile: any) => {
    if (!profile) return 0;
    
    const fields = [
      'graduationYear', 'degree', 'branch', 'currentCompany', 'currentPosition', 
      'industry', 'location', 'bio', 'skills'
    ];
    
    const completedFields = fields.filter(field => {
      const value = profile[field];
      if (field === 'location') {
        return value && value.city && value.city !== 'Not specified' && 
               value.state && value.state !== 'Not specified' && 
               value.country && value.country !== 'Not specified';
      }
      return value && value !== '' && value !== 'Not specified' && 
             (Array.isArray(value) ? value.length > 0 : true);
    });
    
    return Math.round((completedFields.length / fields.length) * 100);
  };

  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const stats = await response.json();
        setDashboardStats(stats);
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchDynamicData = async () => {
    if (!user) return;
    
    try {
      setLoadingDynamicData(true);
      
      // Fetch all dynamic data in parallel
      const [opportunitiesRes, impactRes, activityRes] = await Promise.all([
        fetch(`/api/alumni/mentorship-opportunities?alumniUserId=${user._id}`),
        fetch(`/api/alumni/impact-metrics/${user._id}`),
        fetch(`/api/alumni/recent-activity/${user._id}`)
      ]);

      if (opportunitiesRes.ok) {
        const opportunities = await opportunitiesRes.json();
        setMentorshipOpportunities(opportunities);
      }

      if (impactRes.ok) {
        const impact = await impactRes.json();
        setImpactMetrics(impact);
      }

      if (activityRes.ok) {
        const activity = await activityRes.json();
        setRecentActivity(activity);
      }
    } catch (error) {
      console.error('Error fetching dynamic data:', error);
    } finally {
      setLoadingDynamicData(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Check if this is first login (no profile data in localStorage)
      const profileKey = `alumni_profile_${user._id}`;
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

    // Fetch dashboard statistics
    fetchDashboardStats();
    
    // Fetch dynamic data
    fetchDynamicData();
  }, [user]);

  if (!user) {
    return (
      <section className="container mx-auto py-16">
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-primary" style={{fontFamily:'Montserrat'}}>Alumni Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Please log in to access your dashboard.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Floating Action Button */}
      {user && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => navigate(`/alumni/${user._id}`)}
            className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
            size="icon"
          >
            <Users className="h-6 w-6 text-white" />
          </Button>
          <div className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
            View My Profile
          </div>
        </div>
      )}
      
      <section className="container mx-auto py-8 md:py-12 px-4">
        <div className="space-y-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 shadow-sm hover:scale-110 transition-transform duration-300">
                <GraduationCap className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800" style={{fontFamily:'Montserrat'}}>
                  Welcome back, {user.firstName}! 🎓
                </h1>
                <p className="text-slate-600 text-sm">
                  Ready to inspire the next generation?
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="hover:scale-105 transition-all duration-200 cursor-pointer"
                onClick={() => navigate('/alumni/profile-setup')}
              >
                <GraduationCap className="h-3 w-3 mr-2" />
                Alumni Portal
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="hover:scale-105 transition-all duration-200 cursor-pointer"
                onClick={() => navigate('/mentorship')}
              >
                <Heart className="h-3 w-3 mr-2" />
                Mentor Ready
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Setup */}
        {(isFirstLogin || profileProgress < 100) && (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-4 text-xl">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg">
                  <span className="text-3xl">
                    {isFirstLogin ? "🎉" : "📝"}
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-800">
                    {isFirstLogin ? "Welcome! Complete Your Profile" : "Complete Your Profile"}
                  </div>
                  <div className="text-lg text-slate-600 font-medium">
                    {isFirstLogin ? "Let's get you started!" : "You're almost there!"}
                  </div>
                </div>
              </CardTitle>
              <div className="text-lg leading-relaxed text-slate-600 mt-4">
                {isFirstLogin 
                  ? "Set up your alumni profile to connect with students and share your expertise. This will help you build meaningful mentoring relationships."
                  : "Your profile is incomplete. Complete it to unlock all features and start mentoring students who need your guidance."
                }
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enhanced Progress Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-600">Profile Completion</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-blue-600">{profileProgress}%</span>
                    {profileProgress === 100 && (
                      <span className="text-sm animate-bounce">🎉</span>
                    )}
                  </div>
                </div>
                
                {/* Animated Progress Bar */}
                <div className="relative">
                  <Progress 
                    value={profileProgress} 
                    className="h-2 bg-slate-200" 
                  />
                  <div 
                    className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${profileProgress}%` }}
                  />
                </div>

                {/* Dynamic Status Message */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      {profileProgress === 0 ? "🚀" : profileProgress < 50 ? "⚡" : profileProgress < 100 ? "🔥" : "✨"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {profileProgress === 0 
                          ? "Ready to launch your profile?"
                          : profileProgress < 25
                          ? "Great start! Let's keep building momentum."
                          : profileProgress < 50
                          ? "You're making excellent progress! Keep going."
                          : profileProgress < 75
                          ? "Almost there! You're doing amazing."
                          : profileProgress < 100
                          ? "So close! Just a few more details to go."
                          : "Congratulations! Your profile is complete! 🎉"
                        }
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {profileProgress === 0 
                          ? "Start by setting up your basic information"
                          : profileProgress < 50
                          ? "Add more details to help students find you"
                          : profileProgress < 100
                          ? "Complete the remaining sections to unlock all features"
                          : "Your profile is now live and students can connect with you!"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced CTA Button */}
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-auto px-4 py-2 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 rounded-lg"
                onClick={() => navigate('/alumni/profile-setup')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {isFirstLogin ? "🚀" : "✨"}
                  </span>
                  <span>
                    {isFirstLogin ? "Launch Your Profile" : "Complete Profile"}
                  </span>
                  <span className="text-sm">
                    →
                  </span>
                </div>
              </Button>

              {/* Quick Stats */}
              {profileProgress > 0 && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{Math.floor(profileProgress / 33.33)}</div>
                    <div className="text-xs text-slate-600">Sections Done</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-600">{100 - profileProgress}%</div>
                    <div className="text-xs text-slate-600">Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-600">
                      {profileProgress >= 50 ? "🎯" : "⏳"}
                    </div>
                    <div className="text-xs text-slate-600">Status</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden cursor-pointer"
            onClick={() => navigate('/mentorship')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-4xl font-bold text-blue-600 group-hover:scale-105 transition-transform duration-300">
                      {loadingStats ? (
                        <div className="h-10 w-16 bg-slate-200 rounded animate-pulse"></div>
                      ) : (
                        dashboardStats?.availableMentors || 0
                      )}
                    </p>
                    {!loadingStats && (dashboardStats?.availableMentors || 0) > 0 && (
                      <span className="text-lg text-slate-600 font-medium animate-pulse">↗</span>
                    )}
                  </div>
                  <p className="text-lg text-slate-700 font-semibold">Available Mentors</p>
                  <p className="text-sm text-slate-500 mt-1">Ready to help students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden cursor-pointer"
            onClick={() => navigate('/chat')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-4xl font-bold text-green-600 group-hover:scale-105 transition-transform duration-300">
                      {loadingStats ? (
                        <div className="h-10 w-16 bg-slate-200 rounded animate-pulse"></div>
                      ) : (
                        dashboardStats?.activeChats || 0
                      )}
                    </p>
                    {!loadingStats && (dashboardStats?.activeChats || 0) > 0 && (
                      <span className="text-lg text-slate-600 font-medium animate-bounce">💬</span>
                    )}
                  </div>
                  <p className="text-lg text-slate-700 font-semibold">Active Chats</p>
                  <p className="text-sm text-slate-500 mt-1">Ongoing conversations</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>



        {/* Enhanced Recent Activity & Impact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-2xl bg-white/80 backdrop-blur-sm border-0 rounded-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-slate-500 to-slate-600 shadow-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">Recent Activity</div>
                  <div className="text-lg text-slate-600 font-medium">Stay updated</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingDynamicData ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded animate-pulse w-1/4"></div>
                    </div>
                  </div>
                ))
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity) => {
                  const IconComponent = activity.icon === 'MessageCircle' ? MessageCircle : 
                                      activity.icon === 'Calendar' ? Calendar : Star;
                  const isBlue = activity.type === 'mentorship_request' || activity.type === 'rating_received';
                  
                  return (
                    <div 
                      key={activity._id} 
                      className={`group flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:${isBlue ? 'bg-blue-50' : 'bg-slate-100'} transition-all duration-300 border border-slate-200 hover:${isBlue ? 'border-blue-300' : 'border-slate-300'} cursor-pointer hover:shadow-md`}
                      onClick={() => {
                        if (activity.type === 'mentorship_request') {
                          navigate('/mentorship');
                        } else if (activity.type === 'event_scheduled' || activity.type === 'event_created') {
                          navigate('/batches');
                        } else if (activity.type === 'profile_view') {
                          navigate(`/alumni/${user?._id}`);
                        }
                      }}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isBlue ? 'bg-blue-600' : 'bg-slate-600'} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
                        <p className="text-xs text-slate-600 mt-1">{activity.description}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">{activity.timestamp}</p>
                      </div>
                      <div className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        →
                      </div>
                    </div>
                  );
                })
              ) : (
                // Empty state
                <div className="text-center py-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mx-auto mb-4">
                    <Clock className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No recent activity</p>
                  <p className="text-slate-500 text-sm mt-1">Your activity will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-2xl bg-white/80 backdrop-blur-sm border-0 rounded-2xl">
            <CardContent className="space-y-6 p-6">
              {loadingDynamicData ? (
                // Loading skeleton
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-32"></div>
                        <div className="h-6 bg-slate-200 rounded animate-pulse w-12"></div>
                      </div>
                      <div className="h-3 bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : impactMetrics ? (
                <div className="pt-4 border-t border-slate-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                        <Briefcase className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{impactMetrics.profileInfo.jobTitle}</p>
                        <p className="text-xs text-slate-600">{impactMetrics.profileInfo.company}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{impactMetrics.profileInfo.location}</p>
                        <p className="text-xs text-slate-600">{impactMetrics.profileInfo.country}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{impactMetrics.profileInfo.education}</p>
                        <p className="text-xs text-slate-600">{impactMetrics.profileInfo.graduationYear}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Empty state
                <div className="text-center py-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mx-auto mb-4">
                    <Heart className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No impact data available</p>
                  <p className="text-slate-500 text-sm mt-1">Complete your profile to start tracking your impact</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        </div>
      </section>
    </div>
  );
}

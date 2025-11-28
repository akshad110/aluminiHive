import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Lock, 
  Unlock, 
  CheckCircle,
  Send,
  Eye,
  Calendar,
  ArrowLeft,
  Briefcase,
  Building,
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface JobPosting {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: "full-time" | "part-time" | "contract" | "internship" | "freelance";
  experienceLevel: "entry" | "mid" | "senior" | "executive";
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: "hourly" | "monthly" | "yearly";
  };
  requirements: string[];
  benefits: string[];
  skills: string[];
  postedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    company?: string;
  };
  isLocked: boolean;
  unlockPrice: number;
  currency: string;
  applicationLink?: string;
  isUnlockedByCurrentUser: boolean;
  hasUserApplied: boolean;
  applicationDeadline?: string;
  maxApplications?: number;
  currentApplications: number;
  views: number;
  createdAt: string;
}

export default function JobDetailsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId && user) {
      fetchJobDetails();
    }
  }, [jobId, user]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/jobs/${jobId}?userId=${user?._id}&t=${Date.now()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Job data received:', data.job);
        console.log('isUnlockedByCurrentUser:', data.job.isUnlockedByCurrentUser);
        console.log('isLocked:', data.job.isLocked);
        setJob(data.job);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch job details");
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      setError("Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!user || !job) return;
    
    try {
     
      const orderResponse = await fetch('/api/subscriptions/razorpay/job-unlock-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: job.unlockPrice * 100, // Convert to paise
          currency: 'INR',
          description: `Unlock job: ${job.title}`,
          jobId: job._id,
          userId: user._id
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();
      console.log('Razorpay order created:', orderData);

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: 'rzp_test_RDoUFgwLLU69on',
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'AlumniHive',
          description: orderData.description,
          order_id: orderData.id,
          handler: async function (response: any) {
            console.log('Payment successful:', response);
            
            try {
              // Verify payment
              const verifyResponse = await fetch('/api/subscriptions/razorpay/job-unlock-verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  jobId: job._id,
                  userId: user._id,
                  amount: job.unlockPrice
                }),
              });

              if (verifyResponse.ok) {
                alert('Payment successful! Job unlocked.');
                fetchJobDetails(); // Refresh job details
              } else {
                alert('Payment verification failed. Please contact support.');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              alert('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            contact: ''
          },
          theme: {
            color: '#f97316'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      script.onerror = () => {
        alert('Failed to load payment gateway. Please try again.');
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  const handleApply = async () => {
    if (!user || !job) return;
    
    try {
      const response = await fetch(`/api/jobs/${job._id}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          coverLetter: "I am interested in this position and would like to apply.",
        }),
      });

      if (response.ok) {
        fetchJobDetails();
        alert("Application submitted successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error applying for job:", error);
      alert("Error applying for job. Please try again.");
    }
  };

  const formatSalary = (salary: any) => {
    if (!salary) return "Salary not specified";
    const { min, max, currency, period } = salary;
    const periodText = period === "yearly" ? "year" : period === "monthly" ? "month" : "hour";
    return `${currency} ${min}${max ? ` - ${max}` : ""} per ${periodText}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const canApply = () => {
    if (!job) return false;
    if (job.hasUserApplied) return false;
    if (isDeadlinePassed(job.applicationDeadline)) return false;
    if (job.maxApplications && job.currentApplications >= job.maxApplications) return false;
    if (job.isLocked && !job.isUnlockedByCurrentUser) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Job Not Found</h3>
          <p className="text-muted-foreground mb-4">
            {error || "The job you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => navigate(-1)} className="w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span className="font-medium">{job.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Job Info Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Job Type</p>
                    <p className="font-semibold capitalize text-lg">{job.jobType.replace("-", " ")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-semibold capitalize text-lg">{job.experienceLevel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Salary</p>
                    <p className="font-semibold text-lg">{formatSalary(job.salary)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
          {/* Left Column - Job Details (3/4 width on xl screens) */}
          <div className="xl:col-span-3 space-y-6">
            {/* Description */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-base">{job.description}</p>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-base leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-base leading-relaxed">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {job.skills.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1 text-sm font-medium">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posted By */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Posted By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={job.postedBy?.profilePicture} />
                    <AvatarFallback className="text-lg font-semibold">
                      {job.postedBy?.firstName?.[0] || 'A'}{job.postedBy?.lastName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg">
                      {job.postedBy?.firstName || 'Alumni'} {job.postedBy?.lastName || 'User'}
                    </p>
                    {job.postedBy?.company && (
                      <p className="text-sm text-muted-foreground font-medium">{job.postedBy.company}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Badges */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {job.isLocked ? (
                    job.isUnlockedByCurrentUser ? (
                      <Badge variant="outline" className="text-green-600 border-green-600 px-3 py-1 text-sm font-semibold">
                        <Unlock className="h-4 w-4 mr-2" />
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-600 px-3 py-1 text-sm font-semibold">
                        <Lock className="h-4 w-4 mr-2" />
                        Locked
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-600 px-3 py-1 text-sm font-semibold">
                      <Unlock className="h-4 w-4 mr-2" />
                      Free
                    </Badge>
                  )}
                </div>
                {job.hasUserApplied && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-blue-600 border-blue-600 px-3 py-1 text-sm font-semibold">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Applied
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Info (1/4 width on xl screens) */}
          <div className="xl:col-span-1 space-y-6">
            {/* Action Buttons - Sticky on desktop */}
            <div className="xl:sticky xl:top-6">
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {job.isLocked && !job.isUnlockedByCurrentUser && user?.role === "student" && (
                    <Button
                      onClick={handleUnlock}
                      className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-base font-semibold"
                    >
                      <Lock className="h-5 w-5 mr-2" />
                      Unlock Job ({job.currency} {job.unlockPrice})
                    </Button>
                  )}

                  {job.isUnlockedByCurrentUser && (
                    <Button
                      disabled
                      className="w-full bg-green-600 h-12 text-base font-semibold"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      PAID
                    </Button>
                  )}

                  {job.hasUserApplied && (
                    <Button
                      variant="outline"
                      disabled
                      className="w-full h-12 text-base font-semibold"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Submitted
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Job Stats */}
              <Card className="mt-6 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Job Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">Views</span>
                    </div>
                    <span className="font-bold text-lg">{job.views}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium">Applications</span>
                    </div>
                    <span className="font-bold text-lg">
                      {job.currentApplications}
                      {job.maxApplications && ` / ${job.maxApplications}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Clock className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium">Posted</span>
                    </div>
                    <span className="font-bold text-lg">{formatDate(job.createdAt)}</span>
                  </div>
                  {job.applicationDeadline && (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium">Deadline</span>
                      </div>
                      <span className={`font-bold text-lg ${isDeadlinePassed(job.applicationDeadline) ? 'text-red-600' : ''}`}>
                        {formatDate(job.applicationDeadline)}
                        {isDeadlinePassed(job.applicationDeadline) && ' (Expired)'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

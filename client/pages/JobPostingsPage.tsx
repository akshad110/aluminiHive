import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter, 
  Briefcase,
  Lock,
  Unlock,
  Users,
  DollarSign
} from "lucide-react";
import JobPostingCard from "@/components/JobPostingCard";
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
  isUnlockedByCurrentUser: boolean;
  hasUserApplied: boolean;
  applicationDeadline?: string;
  maxApplications?: number;
  currentApplications: number;
  views: number;
  createdAt: string;
}

interface JobPostingsResponse {
  jobs: JobPosting[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export default function JobPostingsPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    jobType: "all",
    experienceLevel: "all",
    isLocked: "all",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });

  useEffect(() => {
    console.log("useEffect triggered:", { batchId, user, filters, pagination });
    if (user) {
      fetchJobPostings();
    }
  }, [batchId, user, filters, pagination.currentPage]);

  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      console.log("Current user:", user);
      console.log("User ID:", user?._id);
      const params = new URLSearchParams({
        userId: user?._id || "",
        page: pagination.currentPage.toString(),
        limit: "10",
        jobType: filters.jobType,
        experienceLevel: filters.experienceLevel,
        isLocked: filters.isLocked,
      });

      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
      // Use batch-specific endpoint if batchId exists, otherwise use general jobs endpoint
      const url = batchId 
        ? `${apiUrl}/api/batches/${batchId}/jobs?${params}`
        : `${apiUrl}/api/jobs?${params}`;
      console.log("Making API call to:", url);
      const response = await fetch(url);
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      if (response.ok) {
        const data: JobPostingsResponse = await response.json();
        console.log("Jobs data received:", data);
        setJobs(data.jobs);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          total: data.total,
        });
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
      }
    } catch (error) {
      console.error("Error fetching job postings:", error);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    fetchJobPostings();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleUnlock = async (jobId: string, price: number) => {
    if (!user) return;
    
    try {
      // Find the job to get its details
      const job = jobs.find(j => j._id === jobId);
      if (!job) {
        alert("Job not found");
        return;
      }

      // Create Razorpay order
      const orderResponse = await fetch('/api/subscriptions/razorpay/job-unlock-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: price * 100, // Convert to paise
          currency: 'INR',
          description: `Unlock job: ${job.title}`,
          jobId: jobId,
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
                  jobId: jobId,
                  userId: user._id,
                  amount: price
                }),
              });

              if (verifyResponse.ok) {
                alert('Payment successful! Job unlocked.');
                fetchJobPostings(); // Refresh job postings
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

  const handleApply = async (jobId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
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
        // Refresh the job postings
        fetchJobPostings();
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

  const handleView = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const filteredJobs = jobs.filter(job => {
    // Search term filter
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Job type filter
    const matchesJobType = filters.jobType === "all" || job.jobType === filters.jobType;
    
    // Experience level filter
    const matchesExperience = filters.experienceLevel === "all" || job.experienceLevel === filters.experienceLevel;
    
    // Access filter
    const matchesAccess = filters.isLocked === "all" || 
      (filters.isLocked === "false" && !job.isLocked) ||
      (filters.isLocked === "true" && job.isLocked);
    
    return matchesSearch && matchesJobType && matchesExperience && matchesAccess;
  });

  const stats = {
    total: pagination.total,
    locked: jobs.filter(job => job.isLocked).length,
    unlocked: jobs.filter(job => !job.isLocked).length,
    applied: jobs.filter(job => job.hasUserApplied).length,
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading job postings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Please log in to view job postings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 w-full">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Job Postings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Find opportunities from your batch alumni
            </p>
          </div>
          {user?.role === "alumni" && (
            <Button onClick={() => navigate(`/batches/${batchId}/jobs/create`)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Post a Job
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{stats.unlocked}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Free Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{stats.locked}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Premium Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{stats.applied}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Applied</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3 sm:space-y-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs, companies, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" className="w-full sm:w-auto">Search</Button>
              </form>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  <Select
                    value={filters.jobType}
                    onValueChange={(value) => handleFilterChange("jobType", value)}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.experienceLevel}
                    onValueChange={(value) => handleFilterChange("experienceLevel", value)}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.isLocked}
                    onValueChange={(value) => handleFilterChange("isLocked", value)}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Access" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      <SelectItem value="false">Free Jobs</SelectItem>
                      <SelectItem value="true">Premium Jobs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Listings */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No job postings found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || Object.values(filters).some(f => f) 
                    ? "Try adjusting your search or filters"
                    : "Be the first to post a job opportunity"
                  }
                </p>
                {user?.role === "alumni" && batchId && (
                  <Button onClick={() => navigate(`/batches/${batchId}/jobs/create`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Job
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <JobPostingCard
                key={job._id}
                job={job}
                onUnlock={handleUnlock}
                onApply={handleApply}
                onView={handleView}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPagination(prev => ({ 
                ...prev, 
                currentPage: Math.max(1, prev.currentPage - 1) 
              }))}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPagination(prev => ({ 
                ...prev, 
                currentPage: Math.min(prev.totalPages, prev.currentPage + 1) 
              }))}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

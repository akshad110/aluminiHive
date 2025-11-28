import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Batch {
  _id: string;
  name: string;
  college: string;
  graduationYear: number;
  members: User[];
  alumniCount: number;
  totalMembers?: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePicture?: string;
}

interface BatchStats {
  totalBatches: number;
  totalAlumni: number;
  totalMembers: number;
}

export default function BatchManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [stats, setStats] = useState<BatchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [colleges, setColleges] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [exploreOtherColleges, setExploreOtherColleges] = useState(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('exploreOtherColleges');
    return saved === 'true';
  });
  const [userCollege, setUserCollege] = useState<string>("");

  // Fetch user college information
  const fetchUserCollege = async () => {
    try {
      if (user?.role === "student") {
        // For students, get college from User model via getProfile endpoint
        const response = await fetch(`/api/auth/profile/${user._id}`);
        if (response.ok) {
          const userData = await response.json();
          setUserCollege(userData.user?.college || "");
        }
      } else if (user?.role === "alumni") {
        const response = await fetch(`/api/alumni/${user._id}`);
        if (response.ok) {
          const alumniData = await response.json();
          const college = alumniData.education?.[0]?.institution || "";
          setUserCollege(college);
        }
      }
    } catch (error) {
      console.error("Error fetching user college:", error);
    }
  };

  // Fetch batches data
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // For students, show batches from their college unless explore other colleges is enabled
      if (user?.role === "student") {
        if (!exploreOtherColleges && userCollege) {
          params.append("college", userCollege);
        }
        // If exploreOtherColleges is true, don't add college filter to show all batches
      } else if (user?.role === "alumni") {
        // Alumni can only see batches from their college
        if (userCollege) {
          params.append("college", userCollege);
        }
      } else {
        // For admins, use filters
        if (selectedCollege !== "all") params.append("college", selectedCollege);
        if (selectedYear !== "all") params.append("graduationYear", selectedYear);
      }
      
      const response = await fetch(`/api/batches?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
        
        // Extract unique colleges and years
        const uniqueColleges = [...new Set(data.batches.map((b: any) => b.college))] as string[];
        const uniqueYears = [...new Set(data.batches.map((b: any) => b.graduationYear))].sort((a: number, b: number) => b - a) as number[];
        setColleges(uniqueColleges);
        setYears(uniqueYears);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
    setLoading(false);
  };

  // Fetch batch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/batches/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserCollege();
    }
  }, [user]);

  useEffect(() => {
    fetchBatches();
    fetchStats();
  }, [selectedCollege, selectedYear, user, exploreOtherColleges, userCollege]);

  // Filter batches based on search term
  const filteredBatches = batches.filter((batch) =>
    batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.college.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Batch Management</h1>
          <p className="text-muted-foreground">
            Manage and view all batches in the system
          </p>
        </div>
        {user?.role === "student" && (
          <div className="flex items-center gap-2">
            <Button 
              variant={exploreOtherColleges ? "default" : "outline"}
              onClick={() => {
                const newState = !exploreOtherColleges;
                setExploreOtherColleges(newState);
                localStorage.setItem('exploreOtherColleges', newState.toString());
              }}
              className="px-4 py-2"
            >
              {exploreOtherColleges ? "Same College Only" : "Explore Other Colleges"}
            </Button>
          </div>
        )}
      </div>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Current batch statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.totalBatches || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Batches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats?.totalAlumni || 0}
              </div>
              <div className="text-sm text-muted-foreground">Alumni</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats?.totalMembers || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search for students */}
      {user?.role === "student" && !exploreOtherColleges && (
        <Card>
          <CardHeader>
            <CardTitle>Search Batches</CardTitle>
            <CardDescription>Search batches from your college</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {(user?.role !== "student" || exploreOtherColleges) && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter batches by college and graduation year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="college">College</Label>
                <Select value={selectedCollege} onValueChange={setSelectedCollege}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colleges</SelectItem>
                    {colleges.map((college) => (
                      <SelectItem key={college} value={college}>
                        {college}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Graduation Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batches List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading batches...</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No batches found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <Card key={batch._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{batch.name}</CardTitle>
                      <CardDescription>
                        {batch.college} • Class of {batch.graduationYear}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {batch.alumniCount} Alumni
                      </Badge>
                      <Badge variant="outline">
                        {batch.totalMembers} Total
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/batches/${batch._id}/jobs`)}
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Jobs
                    </Button>
                  </div>
                  
                  {/* Recent Alumni */}
                  {batch.members && batch.members.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Alumni</h4>
                      <div className="flex flex-wrap gap-2">
                        {batch.members.slice(0, 3).map((member) => (
                          <div key={member._id} className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={member.profilePicture} />
                              <AvatarFallback className="text-xs">
                                {member.firstName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {member.role === "alumni" ? (
                              <button
                                onClick={() => navigate(`/alumni/${member._id}`)}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                {member.firstName}
                              </button>
                            ) : (
                              <span className="text-sm">{member.firstName}</span>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {member.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
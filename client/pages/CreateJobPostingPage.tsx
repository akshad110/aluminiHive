import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Switch,
} from "@/components/ui/switch";
import { 
  Plus, 
  X, 
  Save,
  ArrowLeft,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  FileText
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface JobPostingData {
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: "full-time" | "part-time" | "contract" | "internship" | "freelance";
  experienceLevel: "entry" | "mid" | "senior" | "executive";
  salary: {
    min: number;
    max: number;
    currency: string;
    period: "hourly" | "monthly" | "yearly";
  } | null;
  requirements: string[];
  benefits: string[];
  skills: string[];
  isLocked: boolean;
  unlockPrice: number;
  currency: string;
  applicationLink: string;
  applicationDeadline: string;
  maxApplications: number;
}

export default function CreateJobPostingPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [newRequirement, setNewRequirement] = useState("");
  const [newBenefit, setNewBenefit] = useState("");
  const [newSkill, setNewSkill] = useState("");
  
  const [jobData, setJobData] = useState<JobPostingData>({
    title: "",
    description: "",
    company: "",
    location: "",
    jobType: "full-time",
    experienceLevel: "entry",
    salary: null,
    requirements: [],
    benefits: [],
    skills: [],
    isLocked: false,
    unlockPrice: 300,
    currency: "INR",
    applicationLink: "",
    applicationDeadline: "",
    maxApplications: 0,
  });

  useEffect(() => {
    if (user?.role !== "alumni") {
      navigate("/unauthorized");
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: any) => {
    setJobData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSalaryChange = (field: string, value: any) => {
    setJobData(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: value
      } as any
    }));
  };

  const addItem = (type: "requirements" | "benefits" | "skills", value: string) => {
    if (value.trim()) {
      setJobData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()]
      }));
      
      // Clear the input
      if (type === "requirements") setNewRequirement("");
      if (type === "benefits") setNewBenefit("");
      if (type === "skills") setNewSkill("");
    }
  };

  const removeItem = (type: "requirements" | "benefits" | "skills", index: number) => {
    setJobData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/batches/${batchId}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...jobData,
          userId: user._id,
          batchId: batchId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert("Job posted successfully!");
        navigate(`/batches/${batchId}/jobs`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating job posting:", error);
      alert("Error creating job posting. Please try again.");
    }
    setLoading(false);
  };

  if (user?.role !== "alumni") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              Only alumni can post job opportunities.
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
            <h1 className="text-3xl font-bold">Post a Job Opportunity</h1>
            <p className="text-muted-foreground">
              Share job opportunities with your batch members
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Job Title *</label>
                  <Input
                    value={jobData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Software Engineer"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Company *</label>
                  <Input
                    value={jobData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    placeholder="e.g., Google"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Location *</label>
                <Input
                  value={jobData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Job Description *</label>
                <Textarea
                  value={jobData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the role, responsibilities, and what makes it exciting..."
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Job Type *</label>
                  <Select
                    value={jobData.jobType}
                    onValueChange={(value) => handleInputChange("jobType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Experience Level *</label>
                  <Select
                    value={jobData.experienceLevel}
                    onValueChange={(value) => handleInputChange("experienceLevel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Salary Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-salary"
                  checked={jobData.salary !== null}
                  onCheckedChange={(checked) => 
                    handleInputChange("salary", checked ? { min: 0, max: 0, currency: "USD", period: "yearly" } : null)
                  }
                />
                <label htmlFor="include-salary" className="text-sm font-medium">
                  Include salary information
                </label>
              </div>

              {jobData.salary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Min Salary</label>
                    <Input
                      type="number"
                      value={jobData.salary.min}
                      onChange={(e) => handleSalaryChange("min", parseInt(e.target.value) || 0)}
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Salary</label>
                    <Input
                      type="number"
                      value={jobData.salary.max}
                      onChange={(e) => handleSalaryChange("max", parseInt(e.target.value) || 0)}
                      placeholder="80000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Currency</label>
                    <Select
                      value={jobData.salary.currency}
                      onValueChange={(value) => handleSalaryChange("currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Period</label>
                    <Select
                      value={jobData.salary.period}
                      onValueChange={(value) => handleSalaryChange("period", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Per Hour</SelectItem>
                        <SelectItem value="monthly">Per Month</SelectItem>
                        <SelectItem value="yearly">Per Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Add a requirement..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("requirements", newRequirement);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addItem("requirements", newRequirement)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobData.requirements.map((req, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {req}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeItem("requirements", index)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Add a benefit..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("benefits", newBenefit);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addItem("benefits", newBenefit)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobData.benefits.map((benefit, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {benefit}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeItem("benefits", index)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("skills", newSkill);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addItem("skills", newSkill)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobData.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeItem("skills", index)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Premium Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Premium Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="lock-job"
                  checked={jobData.isLocked}
                  onCheckedChange={(checked) => handleInputChange("isLocked", checked)}
                />
                <label htmlFor="lock-job" className="text-sm font-medium">
                  Make this a premium job (students must pay to unlock)
                </label>
              </div>

              {jobData.isLocked && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Application Link *</label>
                    <Input
                      value={jobData.applicationLink}
                      onChange={(e) => handleInputChange("applicationLink", e.target.value)}
                      placeholder="https://company.com/careers/job-application"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This link will only be accessible to students after they pay
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Unlock Price (INR)</label>
                      <Input
                        type="number"
                        value={jobData.unlockPrice}
                        onChange={(e) => handleInputChange("unlockPrice", parseInt(e.target.value) || 300)}
                        placeholder="300"
                        min="300"
                        max="500"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Price range: ₹300 - ₹500
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Currency</label>
                      <Select
                        value={jobData.currency}
                        onValueChange={(value) => handleInputChange("currency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Application Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Application Deadline</label>
                  <Input
                    type="datetime-local"
                    value={jobData.applicationDeadline}
                    onChange={(e) => handleInputChange("applicationDeadline", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Applications</label>
                  <Input
                    type="number"
                    value={jobData.maxApplications}
                    onChange={(e) => handleInputChange("maxApplications", parseInt(e.target.value) || 0)}
                    placeholder="0 for unlimited"
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-32"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Posting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Post Job
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

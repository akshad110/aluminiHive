import React, { useState } from "react";
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
  Calendar
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
  postedBy?: {
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

interface JobPostingCardProps {
  job: JobPosting;
  onUnlock?: (jobId: string, price: number) => void;
  onApply?: (jobId: string) => void;
  onView?: (jobId: string) => void;
}

export default function JobPostingCard({ 
  job, 
  onUnlock, 
  onApply, 
  onView 
}: JobPostingCardProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case "full-time": return "bg-blue-100 text-blue-800";
      case "part-time": return "bg-green-100 text-green-800";
      case "contract": return "bg-purple-100 text-purple-800";
      case "internship": return "bg-orange-100 text-orange-800";
      case "freelance": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case "entry": return "bg-green-100 text-green-800";
      case "mid": return "bg-yellow-100 text-yellow-800";
      case "senior": return "bg-red-100 text-red-800";
      case "executive": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
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
    if (job.hasUserApplied) return false;
    if (isDeadlinePassed(job.applicationDeadline)) return false;
    if (job.maxApplications && job.currentApplications >= job.maxApplications) return false;
    if (job.isLocked && !job.isUnlockedByCurrentUser) return false;
    return true;
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2">
              {job.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="font-medium">{job.company}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {job.isLocked && (
              <div className="flex items-center gap-1 text-sm">
                {job.isUnlockedByCurrentUser ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Unlock className="h-3 w-3 mr-1" />
                    Unlocked
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>
            )}
            {job.hasUserApplied && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Applied
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={getJobTypeColor(job.jobType)}>
            {job.jobType.replace("-", " ")}
          </Badge>
          <Badge className={getExperienceColor(job.experienceLevel)}>
            {job.experienceLevel}
          </Badge>
          {job.salary && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <DollarSign className="h-3 w-3 mr-1" />
              {formatSalary(job.salary)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {job.description}
            </p>
            {job.description.length > 150 && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-blue-600 hover:text-blue-800"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Show less" : "Show more"}
              </Button>
            )}
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="space-y-4 pt-2 border-t">
              {/* Requirements */}
              {job.requirements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Requirements</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {job.benefits.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Benefits</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              {job.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Job stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {job.views} views
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {job.currentApplications} applications
              {job.maxApplications && ` / ${job.maxApplications} max`}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(job.createdAt)}
            </div>
            {job.applicationDeadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Deadline: {formatDate(job.applicationDeadline)}
                {isDeadlinePassed(job.applicationDeadline) && (
                  <span className="text-red-600 font-medium">(Expired)</span>
                )}
              </div>
            )}
          </div>

          {/* Posted by */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Avatar className="h-6 w-6">
              <AvatarImage src={job.postedBy?.profilePicture} />
              <AvatarFallback className="text-xs">
                {job.postedBy?.firstName?.[0] || 'A'}{job.postedBy?.lastName?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">
                {job.postedBy?.firstName || 'Alumni'} {job.postedBy?.lastName || 'User'}
              </span>
              {job.postedBy?.company && (
                <span> • {job.postedBy.company}</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView?.(job._id)}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>

            {job.isLocked && !job.isUnlockedByCurrentUser && user?.role === "student" && (
              <Button
                size="sm"
                onClick={() => onUnlock?.(job._id, job.unlockPrice)}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                <Lock className="h-3 w-3 mr-1" />
                Unlock ({job.currency} {job.unlockPrice})
              </Button>
            )}


            {job.isUnlockedByCurrentUser && job.applicationLink && !job.hasUserApplied && (
              <Button
                size="sm"
                onClick={() => window.open(job.applicationLink.startsWith('http') ? job.applicationLink : `https://${job.applicationLink}`, '_blank')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Send className="h-3 w-3 mr-1" />
                Apply Now
              </Button>
            )}

            {canApply() && !job.hasUserApplied && (
              <Button
                size="sm"
                onClick={() => onApply?.(job._id)}
                className="flex-1"
              >
                <Send className="h-3 w-3 mr-1" />
                Submit
              </Button>
            )}


            {job.hasUserApplied && (
              <Button
                size="sm"
                variant="outline"
                disabled
                className="flex-1"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Submitted
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

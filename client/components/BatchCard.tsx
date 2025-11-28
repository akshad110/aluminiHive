import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePicture?: string;
}

interface Batch {
  _id: string;
  name: string;
  college: string;
  graduationYear: number;
  members: User[];
  alumniCount: number;
  studentCount?: number;
  totalMembers?: number;
  createdAt: string;
  updatedAt: string;
}

interface BatchCardProps {
  batch: Batch;
  showMembers?: boolean;
  maxMembers?: number;
}

export default function BatchCard({ batch, showMembers = true, maxMembers = 3 }: BatchCardProps) {
  const navigate = useNavigate();
  
  const getInitials = (user: User) => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "alumni": return "bg-blue-100 text-blue-800";
      case "student": return "bg-green-100 text-green-800";
      case "admin": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{batch.name}</CardTitle>
        <CardDescription>
          {batch.college} • Class of {batch.graduationYear}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Badge className="bg-blue-100 text-blue-800">
              {batch.alumniCount} Alumni
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              {batch.studentCount} Students
            </Badge>
          </div>
          <Badge variant="outline">
            {batch.totalMembers} Total
          </Badge>
        </div>
        
        {showMembers && batch.members && batch.members.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Recent Members</h4>
            <div className="space-y-2">
              {batch.members.slice(0, maxMembers).map((member, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.profilePicture} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                  {member.role === "alumni" ? (
                    <button
                      onClick={() => navigate(`/alumni/${member._id}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {member.firstName} {member.lastName}
                    </button>
                  ) : (
                    <span className="text-sm">
                      {member.firstName} {member.lastName}
                    </span>
                  )}
                  <Badge className={`text-xs ${getRoleColor(member.role)}`}>
                    {member.role}
                  </Badge>
                </div>
              ))}
              {batch.members.length > maxMembers && (
                <p className="text-xs text-muted-foreground">
                  +{batch.members.length - maxMembers} more members
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
  timestamp: string;
}

// User interfaces
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: "alumni" | "student" | "admin";
  college?: string;
  profilePicture?: string;
  batch?: string; // Batch ID
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Alumni interfaces
export interface Alumni {
  _id: string;
  userId: User;
  graduationYear: number;
  degree: string;
  branch: string;
  currentCompany?: string;
  currentPosition?: string;
  industry: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  bio?: string;
  skills: string[];
  experience: {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }[];
  education: {
    degree: string;
    branch: string;
    institution: string;
    graduationYear: number;
  }[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  isAvailableForMentoring: boolean;
  mentoringInterests: string[];
  achievements: {
    title: string;
    description: string;
    date: string;
  }[];
  // Impact tracking fields
  studentsMentored: number;
  eventsHosted: number;
  profileViews: number;
  createdAt: string;
  updatedAt: string;
}

// Student interfaces
export interface Student {
  _id: string;
  userId: User;
  studentId: string;
  currentYear: number;
  expectedGraduationYear: number;
  branch: string;
  minor?: string;
  gpa?: number;
  academicStanding: "good" | "probation" | "suspended";
  interests: string[];
  careerGoals: string[];
  skills: string[];
  projects: {
    title: string;
    description: string;
    technologies: string[];
    githubUrl?: string;
    liveUrl?: string;
    imageUrl?: string;
  }[];
  internships: {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }[];
  certifications: {
    name: string;
    issuer: string;
    dateObtained: string;
    expiryDate?: string;
    credentialId?: string;
  }[];
  socialLinks: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  isLookingForMentorship: boolean;
  mentorshipInterests: string[];
  achievements: {
    title: string;
    description: string;
    date: string;
    type: "academic" | "project" | "competition" | "other";
  }[];
  createdAt: string;
  updatedAt: string;
}

// Authentication interfaces
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "alumni" | "student";
  // Additional profile data based on role
  [key: string]: any;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

// API Response interfaces
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AlumniResponse extends PaginatedResponse<Alumni> {
  alumni: Alumni[];
}

export interface StudentResponse extends PaginatedResponse<Student> {
  students: Student[];
}

// Dashboard statistics interface
export interface DashboardStats {
  availableMentors: number;
  activeChats: number;
  upcomingEvents: number;
  skillsLearned: number;
}

// Mentorship opportunities interface
export interface MentorshipOpportunity {
  _id: string;
  title: string;
  description: string;
  interestedStudents: number;
  lastUpdated: string;
  category: string;
  icon: string;
}

// Impact metrics interface
export interface ImpactMetrics {
  studentsMentored: {
    current: number;
    target: number;
    description: string;
  };
  eventsHosted: {
    current: number;
    target: number;
    description: string;
  };
  profileViews: {
    current: number;
    target: number;
    description: string;
  };
  profileInfo: {
    jobTitle: string;
    company: string;
    location: string;
    country: string;
    education: string;
    graduationYear: string;
  };
}

// Recent activity interface
export interface RecentActivity {
  _id: string;
  type: 'mentorship_request' | 'event_scheduled' | 'rating_received' | 'event_created' | 'profile_view';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  metadata?: {
    studentName?: string;
    eventName?: string;
    rating?: number;
    menteeName?: string;
    viewerName?: string;
    eventId?: string;
  };
}

// Batch interfaces
export interface Batch {
  _id: string;
  name: string; // Format: "College Name - Batch Year"
  college: string;
  graduationYear: number;
  members: User[];
  alumniCount: number;
  studentCount: number;
  totalMembers?: number; // Virtual field
  createdAt: string;
  updatedAt: string;
}
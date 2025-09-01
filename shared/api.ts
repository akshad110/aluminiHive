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
  lastName: string;
  role: "alumni" | "student" | "admin";
  profilePicture?: string;
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
  major: string;
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
    major: string;
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
  major: string;
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

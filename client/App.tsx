import "./global.css";
import React from "react";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { resolveFetchUrl } from "@/config/api";

// Rewrite /api/* to backend in production (static frontend on Render)
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;

  window.fetch = function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    if (typeof input === 'string') {
      input = resolveFetchUrl(input);
    }
    return originalFetch(input, init);
  };
}
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RootLayout from "@/components/layout/RootLayout";
import Auth from "./pages/Auth";
import Aluminii from "./pages/Aluminii";
import Student from "./pages/Student";
import StudentProfileSetup from "./pages/StudentProfileSetup";
import AlumniProfileSetup from "./pages/AlumniProfileSetup";
import BranchDemo from "./pages/BranchDemo";
import SkillsDemo from "./pages/SkillsDemo";
import BatchManagement from "./pages/BatchManagement";
import JobPostingsPage from "./pages/JobPostingsPage";
import CreateJobPostingPage from "./pages/CreateJobPostingPage";
import AlumniProfilePage from "./pages/AlumniProfilePage";
import StudentProfilePage from "./pages/StudentProfilePage";
import MessagesPage from "./pages/MessagesPage";
import WhatsAppLikeChat from "./pages/WhatsAppLikeChat";
import JobDetailsPage from "./pages/JobDetailsPage";
import MentorshipPage from "./pages/MentorshipPage";
import StreamCallPage from "./pages/StreamCallPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Full-screen call page — no site navbar/footer */}
            <Route path="/call" element={<StreamCallPage />} />

            <Route element={<RootLayout /> }>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/aluminii" element={<Aluminii />} />
              <Route path="/student" element={<Student />} />
              <Route path="/student/profile-setup" element={<StudentProfileSetup />} />
              <Route path="/alumni/profile-setup" element={<AlumniProfileSetup />} />
              <Route path="/branch-demo" element={<BranchDemo />} />
              <Route path="/skills-demo" element={<SkillsDemo />} />
              <Route path="/batches" element={<BatchManagement />} />
              <Route path="/jobs" element={<JobPostingsPage />} />
              <Route path="/batches/:batchId/jobs" element={<JobPostingsPage />} />
              <Route path="/batches/:batchId/jobs/create" element={<CreateJobPostingPage />} />
              <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
              <Route path="/alumni/:alumniId" element={<AlumniProfilePage />} />
              <Route path="/student/:studentId" element={<StudentProfilePage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/chat" element={<WhatsAppLikeChat />} />
              <Route path="/mentorship" element={<MentorshipPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

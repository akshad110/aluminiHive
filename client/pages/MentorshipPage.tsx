import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  Users, 
  MapPin, 
  Building, 
  GraduationCap,
  Star,
  MessageCircle,
  X,
  Calendar,
  User,
  Mail,
  Video,
  Phone,
  Lock,
  DollarSign,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AlumniMentorshipPage from './AlumniMentorshipPage';

// Predefined mentorship interest options
const MENTORSHIP_OPTIONS = [
  'Career Guidance',
  'Technical Skills',
  'Interview Preparation',
  'Product Management',
  'Software Engineering',
  'Data Science',
  'Machine Learning',
  'Web Development',
  'Mobile Development',
  'DevOps',
  'Cloud Computing',
  'Cybersecurity',
  'UI/UX Design',
  'Digital Marketing',
  'Business Strategy',
  'Entrepreneurship',
  'Leadership',
  'Networking',
  'Resume Building',
  'Higher Studies'
];

// Additional filtering options
const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Consulting',
  'Manufacturing',
  'Retail',
  'Media & Entertainment',
  'Real Estate',
  'Government',
  'Non-Profit',
  'Energy',
  'Transportation',
  'Agriculture',
  'Telecommunications',
  'Aerospace',
  'Automotive',
  'Food & Beverage',
  'Fashion',
  'Sports'
];

const EXPERIENCE_LEVELS = [
  'Entry Level (0-2 years)',
  'Mid Level (3-5 years)',
  'Senior Level (6-10 years)',
  'Executive Level (10+ years)',
  'C-Level Executive',
  'Founder/CEO',
  'Director',
  'Manager',
  'Lead/Principal',
  'Staff Engineer',
  'Architect',
  'Consultant',
  'Freelancer',
  'Contractor',
  'Intern',
  'Graduate Student',
  'PhD Holder',
  'Professor',
  'Researcher',
  'Industry Expert'
];

const LOCATION_OPTIONS = [
  'San Francisco Bay Area',
  'New York City',
  'Seattle',
  'Austin',
  'Boston',
  'Chicago',
  'Los Angeles',
  'Denver',
  'Miami',
  'Atlanta',
  'Dallas',
  'Phoenix',
  'Philadelphia',
  'Detroit',
  'Minneapolis',
  'Portland',
  'San Diego',
  'Las Vegas',
  'Nashville',
  'Remote/Global'
];

const COMPANY_SIZE_OPTIONS = [
  'Startup (1-10 employees)',
  'Small (11-50 employees)',
  'Medium (51-200 employees)',
  'Large (201-1000 employees)',
  'Enterprise (1000+ employees)',
  'Fortune 500',
  'Unicorn Startup',
  'Public Company',
  'Private Company',
  'Non-Profit',
  'Government',
  'Educational Institution',
  'Research Lab',
  'Consulting Firm',
  'Agency',
  'Freelance',
  'Contract',
  'Part-time',
  'Full-time',
  'Remote'
];

interface Mentor {
  _id: string;
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    college?: string;
  };
  // Fallback properties for when userId is not populated
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
  college?: string;
  currentCompany: string;
  currentPosition: string;
  industry: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  bio: string;
  skills: string[];
  mentoringInterests: string[];
  isAvailableForMentoring: boolean;
  rating?: number;
  totalMentees?: number;
}

export default function MentorshipPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // All hooks must be called before any conditional returns
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedExperienceLevels, setSelectedExperienceLevels] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  
  // Mentorship booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingData, setBookingData] = useState({
    category: '',
    title: '',
    description: '',
    skillsNeeded: [] as string[],
    studentMessage: ''
  });

  // Mentorship requests state for students
  const [mentorshipRequests, setMentorshipRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{[key: string]: boolean}>({});

  // Define functions before useEffect hooks
  const fetchMentors = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
      const response = await fetch(`${apiUrl}/api/alumni?availableForMentoring=true`);
      const data = await response.json();
      console.log('Fetched mentors data:', data.alumni);
      setMentors(data.alumni || []);
      setFilteredMentors(data.alumni || []);

      // Extract unique skills from all mentors
      const allSkills = new Set<string>();
      (data.alumni || []).forEach((mentor: Mentor) => {
        (mentor.skills || []).forEach(skill => allSkills.add(skill));
      });
      setAvailableSkills(Array.from(allSkills).sort());
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMentorshipRequests = async () => {
    if (user?.role !== 'student' || !user?._id) {
      return;
    }
    
    try {
      setRequestsLoading(true);
      const response = await fetch(`/api/mentorship/requests/student/${user._id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMentorshipRequests(data.requests || []);
      
      if (data.requests && data.requests.length > 0) {
        const paymentPromises = data.requests
          .filter((request: any) => request.status === 'accepted' && request.alumniId?._id)
          .map(async (request: any) => {
            const hasPaid = await checkPaymentStatus(request._id, request.alumniId._id);
            return { requestId: request._id, hasPaid };
          });
        
        const paymentResults = await Promise.all(paymentPromises);
        const newPaymentStatus: {[key: string]: boolean} = {};
        paymentResults.forEach(result => {
          newPaymentStatus[result.requestId] = result.hasPaid;
        });
        
        setPaymentStatus(newPaymentStatus);
      }
    } catch (error) {
      console.error('Error fetching mentorship requests:', error);
      alert('Failed to fetch mentorship requests. Please try again.');
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'alumni') {
      fetchMentors();
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchMentorshipRequests();
    }
  }, [user?.role, user?._id]);

  // Filter mentors based on search and selected interests
  useEffect(() => {
    if (user?.role === 'alumni') return;
    let filtered = mentors;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(mentor => 
        (mentor.userId?.firstName || mentor.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mentor.userId?.lastName || mentor.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mentor.currentCompany || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mentor.currentPosition || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mentor.bio || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Interest filter
    if (selectedInterests.length > 0) {
      filtered = filtered.filter(mentor => 
        selectedInterests.some(interest => 
          (mentor.mentoringInterests || []).some(mentorInterest => 
            mentorInterest.toLowerCase().includes(interest.toLowerCase())
          )
        )
      );
    }

    // Industry filter (multi-select)
    if (selectedIndustries.length > 0) {
      filtered = filtered.filter(mentor => 
        selectedIndustries.some(industry => 
          (mentor.industry || '').toLowerCase().includes(industry.toLowerCase())
        )
      );
    }

    // Experience level filter
    if (selectedExperienceLevels.length > 0) {
      filtered = filtered.filter(mentor => 
        selectedExperienceLevels.some(level => 
          (mentor.currentPosition || '').toLowerCase().includes(level.toLowerCase()) ||
          (mentor.bio || '').toLowerCase().includes(level.toLowerCase())
        )
      );
    }

    // Location filter (multi-select)
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(mentor => 
        selectedLocations.some(location => 
          (mentor.location?.city || '').toLowerCase().includes(location.toLowerCase()) ||
          (mentor.location?.state || '').toLowerCase().includes(location.toLowerCase()) ||
          (mentor.location?.country || '').toLowerCase().includes(location.toLowerCase())
        )
      );
    }

    // Company size filter
    if (selectedCompanySizes.length > 0) {
      filtered = filtered.filter(mentor => 
        selectedCompanySizes.some(size => 
          (mentor.currentCompany || '').toLowerCase().includes(size.toLowerCase()) ||
          (mentor.bio || '').toLowerCase().includes(size.toLowerCase())
        )
      );
    }

    // Rating filter
    if (ratingFilter) {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter(mentor => 
        (mentor.rating || 0) >= minRating
      );
    }

    // Availability filter
    if (availabilityFilter) {
      if (availabilityFilter === 'available') {
        filtered = filtered.filter(mentor => mentor.isAvailableForMentoring);
      } else if (availabilityFilter === 'busy') {
        filtered = filtered.filter(mentor => !mentor.isAvailableForMentoring);
      }
    }

    // Legacy single filters (for backward compatibility)
    if (locationFilter) {
      filtered = filtered.filter(mentor => 
        (mentor.location?.city || '').toLowerCase().includes(locationFilter.toLowerCase()) ||
        (mentor.location?.state || '').toLowerCase().includes(locationFilter.toLowerCase()) ||
        (mentor.location?.country || '').toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (companyFilter) {
      filtered = filtered.filter(mentor => 
        (mentor.currentCompany || '').toLowerCase().includes(companyFilter.toLowerCase())
      );
    }

    if (industryFilter) {
      filtered = filtered.filter(mentor => 
        (mentor.industry || '').toLowerCase().includes(industryFilter.toLowerCase())
      );
    }

    // Skills filter
    if (skillsFilter.length > 0) {
      filtered = filtered.filter(mentor => 
        skillsFilter.some(skill => 
          (mentor.skills || []).some(mentorSkill => 
            mentorSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    setFilteredMentors(filtered);
  }, [mentors, searchQuery, selectedInterests, selectedIndustries, selectedExperienceLevels, selectedLocations, selectedCompanySizes, ratingFilter, availabilityFilter, locationFilter, companyFilter, industryFilter, skillsFilter]);

  // Show different interface for alumni vs students AFTER all hooks are called
  if (user?.role === 'alumni') {
    return <AlumniMentorshipPage />;
  }

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleIndustryToggle = (industry: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industry) 
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };

  const handleExperienceToggle = (level: string) => {
    setSelectedExperienceLevels(prev => 
      prev.includes(level) 
        ? prev.filter(i => i !== level)
        : [...prev, level]
    );
  };

  const handleLocationToggle = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(i => i !== location)
        : [...prev, location]
    );
  };

  const handleCompanySizeToggle = (size: string) => {
    setSelectedCompanySizes(prev => 
      prev.includes(size) 
        ? prev.filter(i => i !== size)
        : [...prev, size]
    );
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests(prev => [...prev, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setSelectedInterests(prev => prev.filter(i => i !== interest));
  };

  const removeIndustry = (industry: string) => {
    setSelectedIndustries(prev => prev.filter(i => i !== industry));
  };

  const removeExperience = (level: string) => {
    setSelectedExperienceLevels(prev => prev.filter(i => i !== level));
  };

  const removeLocation = (location: string) => {
    setSelectedLocations(prev => prev.filter(i => i !== location));
  };

  const removeCompanySize = (size: string) => {
    setSelectedCompanySizes(prev => prev.filter(i => i !== size));
  };

  const handleSkillToggle = (skill: string) => {
    setSkillsFilter(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const removeSkill = (skill: string) => {
    setSkillsFilter(prev => prev.filter(s => s !== skill));
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedInterests([]);
    setSelectedIndustries([]);
    setSelectedExperienceLevels([]);
    setSelectedLocations([]);
    setSelectedCompanySizes([]);
    setRatingFilter('');
    setAvailabilityFilter('');
    setLocationFilter('');
    setCompanyFilter('');
    setIndustryFilter('');
    setSkillsFilter([]);
  };

  // Handle mentor actions
  const handleConnect = (mentor: Mentor) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Navigate to chat with the mentor
    const mentorId = mentor.userId?._id || mentor._id;
    navigate(`/chat?personal=${mentorId}`);
  };

  const handleViewProfile = (mentor: Mentor) => {
    const mentorId = mentor.userId?._id || mentor._id;
    navigate(`/alumni/${mentorId}`);
  };

  const handleBookMentorship = (mentor: Mentor) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    console.log('Selected mentor for booking:', mentor);
    console.log('Mentor userId:', mentor.userId);
    console.log('Mentor userId._id:', mentor.userId?._id);
    setSelectedMentor(mentor);
    // Reset form data when opening modal
    setBookingData({
      category: '',
      title: '',
      description: '',
      skillsNeeded: [],
      studentMessage: ''
    });
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async () => {
    if (!selectedMentor || !user) return;

    console.log('User object:', user);
    console.log('Selected mentor:', selectedMentor);
    console.log('Booking data:', bookingData);

    // Client-side validation - match server validation exactly
    if (!user?._id) {
      alert('User not authenticated. Please log in again.');
      return;
    }
    
    // Handle different mentor data structures
    // alumniId should be the User's _id (not the Alumni document's _id)
    // The mentor object from API has userId populated with User data
    let mentorId: string | undefined;
    if (selectedMentor?.userId?._id) {
      mentorId = selectedMentor.userId._id;
    } else if (selectedMentor?.userId && typeof selectedMentor.userId === 'string') {
      mentorId = selectedMentor.userId;
    } else if (selectedMentor?._id) {
      // If we only have the Alumni document _id, we need to find the User _id
      // For now, try using the _id directly (it might be the User _id if the API returns it that way)
      mentorId = selectedMentor._id;
    }
    
    if (!mentorId) {
      console.error('Mentor ID not found. Mentor object:', selectedMentor);
      alert('Invalid mentor selected. Please try again.');
      return;
    }
    
    console.log('Using mentorId (User _id) for mentorship request:', mentorId);
    if (!bookingData.category || bookingData.category.trim() === '') {
      alert('Please select a category');
      return;
    }
    if (!bookingData.title || bookingData.title.trim() === '') {
      alert('Please enter a title');
      return;
    }
    if (!bookingData.description || bookingData.description.trim() === '') {
      alert('Please enter a description');
      return;
    }

    try {
      const requestData = {
        studentId: user._id,
        alumniId: mentorId,
        category: bookingData.category.trim(),
        title: bookingData.title.trim(),
        description: bookingData.description.trim(),
        skillsNeeded: Array.isArray(bookingData.skillsNeeded) ? bookingData.skillsNeeded : [],
        expectedDuration: '2 weeks',
        preferredCommunication: 'email',
        studentMessage: bookingData.studentMessage?.trim() || ''
      };

      console.log('Sending mentorship request:', requestData);

      const response = await fetch('/api/mentorship/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        alert('Mentorship request sent successfully!');
        setShowBookingModal(false);
        setSelectedMentor(null);
        setBookingData({
          category: '',
          title: '',
          description: '',
          skillsNeeded: [],
          studentMessage: ''
        });
        fetchMentorshipRequests();
      } else {
        const data = await response.json();
        console.error('Server error:', data);
        if (data.missingFields && data.missingFields.length > 0) {
          alert(`Missing required fields: ${data.missingFields.join(', ')}`);
        } else {
          alert(data.error || 'Failed to send mentorship request');
        }
      }
    } catch (error) {
      console.error('Error sending mentorship request:', error);
      alert('Failed to send mentorship request');
    }
  };

  const handleStudentCommunication = (type: string, alumniEmail: string, requestId: string) => {
    switch (type) {
      case 'chat':
        window.open(`/chat?personal=${alumniEmail}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:${alumniEmail}`, '_blank');
        break;
      case 'video':
        if (hasPaidForRequest(requestId)) {
          startStudentAgoraCall('video', alumniEmail, requestId);
        } else {
          alert('Please pay ₹100 to unlock video calls. Only alumni can start calls - you can join them.');
        }
        break;
      case 'voice':
        if (hasPaidForRequest(requestId)) {
          startStudentAgoraCall('audio', alumniEmail, requestId);
        } else {
          alert('Please pay ₹100 to unlock voice calls. Only alumni can start calls - you can join them.');
        }
        break;
      default:
        break;
    }
  };

  const startStudentAgoraCall = (type: 'video' | 'audio', alumniEmail: string, requestId: string) => {
    // Generate a unique channel name for this mentorship session
    const channelName = `mentorship-${requestId}-${Date.now()}`;
    
    // Store call info in localStorage for the other participant
    localStorage.setItem('agoraCallInfo', JSON.stringify({
      channelName,
      type,
      initiator: user?.firstName || 'Student',
      alumniEmail,
      timestamp: Date.now(),
      requestId
    }));

    // Show notification
    alert(`Starting ${type} call with your mentor. The call window will open shortly.`);

    // Open Agora call in new tab (will appear next to current tab)
    const APP_BUILDER_URL = 'https://56c3a73ab43d95c4ac03-4z4bfl6j1-akshads-projects-48e10662.vercel.app';
    const agoraUrl = `${APP_BUILDER_URL}/join?roomId=${channelName}&enableScreenShare=true`;
    window.open(agoraUrl, '_blank', 'noopener,noreferrer,width=1200,height=800,scrollbars=yes,resizable=yes');
  };

  const checkPaymentStatus = async (requestId: string, alumniId: string) => {
    if (!user?._id) return false;
    
    try {
      const response = await fetch(`/api/payment/mentorship/status/${user._id}/${alumniId}/${requestId}`);
      const data = await response.json();
      return data.hasPaid || false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  };

  const hasPaidForRequest = (requestId: string) => {
    return paymentStatus[requestId] || false;
  };

  const formatCallDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatCallTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const initiatePayment = async (requestId: string, alumniId: string) => {
    if (!user?._id) return;
    
    try {
      // Create payment order
      const orderResponse = await fetch('/api/payment/mentorship/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 100,
          studentId: user._id,
          alumniId: alumniId,
          requestId: requestId
        }),
      });

      const orderData = await orderResponse.json();
      
      if (orderData.success) {
        // Initialize Razorpay with key from server response
        const options = {
          key: orderData.key,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: 'AlumniHive',
          description: 'Mentorship Call Payment',
          order_id: orderData.order.id,
          handler: async function (response: any) {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/mentorship/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: orderData.order.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                studentId: user._id,
                alumniId: alumniId,
                requestId: requestId
              }),
            });

            const verifyData = await verifyResponse.json();
            
                 if (verifyData.success) {
                   setPaymentStatus(prev => ({ ...prev, [requestId]: true }));
                   alert('Payment successful! Video/voice calls are now unlocked.');
                   fetchMentorshipRequests();
                 } else {
                   alert('Payment verification failed. Please try again.');
                 }
          },
          prefill: {
            name: user.firstName + ' ' + user.lastName,
            email: user.email,
          },
          theme: {
            color: '#00AEFC'
          },
          modal: {
            ondismiss: function() {
              alert('Payment cancelled');
            }
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        alert('Failed to create payment order. Please try again.');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Payment failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading mentors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Mentor</h1>
          <p className="text-muted-foreground">Connect with experienced alumni who can guide your career journey</p>
        </div>

        {/* Mentorship Requests Status for Students */}
        {user?.role === 'student' && (
          <div className="mb-8">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Your Mentorship Requests
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMentorshipRequests}
                    disabled={requestsLoading}
                  >
                    {requestsLoading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading requests...</p>
                  </div>
                ) : mentorshipRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No mentorship requests yet</h3>
                    <p className="text-gray-500 mb-4">Send requests to mentors below to get started!</p>
                    <Button 
                      onClick={fetchMentorshipRequests}
                      variant="outline"
                      size="sm"
                    >
                      Check for Requests
                    </Button>
                    <div className="mt-2 text-xs text-gray-400">
                      User ID: {user?._id} | Role: {user?.role}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mentorshipRequests.map((request) => (
                      <div key={request._id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={request.alumniId?.profilePicture} />
                                <AvatarFallback>
                                  {request.alumniId?.firstName?.[0]}{request.alumniId?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">
                                  {request.alumniId?.firstName} {request.alumniId?.lastName}
                                </h3>
                                <p className="text-sm text-muted-foreground">{request.alumniId?.currentCompany}</p>
                              </div>
                            </div>
                            <div className="mb-3">
                              <h4 className="font-medium text-gray-900">{request.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{request.category}</Badge>
                                <Badge 
                                  variant={
                                    request.status === 'accepted' ? 'default' : 
                                    request.status === 'rejected' ? 'destructive' : 
                                    'secondary'
                                  }
                                >
                                  {request.status}
                                </Badge>
                                {request.status === 'accepted' && hasPaidForRequest(request._id) && (
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Paid
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Communication Options for Accepted Requests */}
                        {request.status === 'accepted' && (
                          <div className="border-t pt-3 mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Connect with your mentor:</p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => handleStudentCommunication('chat', request.alumniId?.email, request._id)}
                              >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Chat
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => handleStudentCommunication('email', request.alumniId?.email, request._id)}
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                Email
                              </Button>
                              <div className="relative">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs opacity-50 cursor-not-allowed"
                                  disabled
                                >
                                  <Video className="h-3 w-3 mr-1" />
                                  Video Call
                                  <Lock className="h-3 w-3 ml-1" />
                                </Button>
                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                                  ₹100
                                </div>
                              </div>
                              <div className="relative">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs opacity-50 cursor-not-allowed"
                                  disabled
                                >
                                  <Phone className="h-3 w-3 mr-1" />
                                  Voice Call
                                  <Lock className="h-3 w-3 ml-1" />
                                </Button>
                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                                  ₹100
                                </div>
                              </div>
                            </div>
                            {!hasPaidForRequest(request._id) && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  className="text-xs bg-green-600 hover:bg-green-700"
                                  onClick={() => initiatePayment(request._id, request.alumniId?._id)}
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Pay ₹100 to Unlock Calls
                                </Button>
                              </div>
                            )}
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                              <AlertCircle className="h-3 w-3 inline mr-1" />
                              Note: Only alumni can start calls. Students can join when invited.
                            </div>
                          </div>
                        )}
                        
                        {/* Call History */}
                        {request.callHistory && request.callHistory.length > 0 && (
                          <div className="border-t pt-3 mt-3">
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Call History ({request.callHistory.length} call{request.callHistory.length !== 1 ? 's' : ''})
                            </h5>
                            <div className="space-y-2">
                              {request.callHistory.map((call: any, index: number) => (
                                <div key={call.callId} className="bg-gray-50 p-3 rounded-md">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${
                                        call.status === 'completed' ? 'bg-green-500' : 
                                        call.status === 'in_progress' ? 'bg-yellow-500' : 
                                        'bg-gray-400'
                                      }`} />
                                      <span className="text-sm font-medium">
                                        {call.callType === 'video' ? 'Video Call' : 'Voice Call'}
                                      </span>
                                      {call.duration && (
                                        <span className="text-xs text-gray-500">
                                          ({formatCallDuration(call.duration)})
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {formatCallTime(call.startTime)}
                                    </span>
                                  </div>
                                  {call.status === 'completed' && call.duration && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      Duration: {formatCallDuration(call.duration)}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {request.totalCallDuration && request.totalCallDuration > 0 && (
                                <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 font-medium">
                                  Total Call Time: {formatCallDuration(request.totalCallDuration)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Last Call Info */}
                        {request.lastCallCompletedAt && (
                          <div className="border-t pt-3 mt-3">
                            <div className="bg-green-50 p-2 rounded text-xs text-green-800">
                              <Clock className="h-3 w-3 inline mr-1" />
                              Last call completed: {new Date(request.lastCallCompletedAt).toLocaleDateString()}
                            </div>
                          </div>
                        )}

                        {/* Rejection Reason for Rejected Requests */}
                        {request.status === 'rejected' && request.rejectionReason && (
                          <div className="border-t pt-3 mt-3">
                            <p className="text-sm text-red-600">
                              <strong>Reason for rejection:</strong> {request.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}


        {/* Search and Filters */}
        <div className="mb-8">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Search & Filter Mentors</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, company, position, or bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="space-y-6 pt-4 border-t">
                  {/* Industry Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Industry</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {INDUSTRY_OPTIONS.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`industry-${option}`}
                            checked={selectedIndustries.includes(option)}
                            onCheckedChange={() => handleIndustryToggle(option)}
                          />
                          <label
                            htmlFor={`industry-${option}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedIndustries.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {selectedIndustries.map((industry) => (
                            <Badge
                              key={industry}
                              variant="secondary"
                              className="px-3 py-1 text-sm"
                            >
                              {industry}
                              <button
                                onClick={() => removeIndustry(industry)}
                                className="ml-2 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Experience Level Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Experience Level</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {EXPERIENCE_LEVELS.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`exp-${option}`}
                            checked={selectedExperienceLevels.includes(option)}
                            onCheckedChange={() => handleExperienceToggle(option)}
                          />
                          <label
                            htmlFor={`exp-${option}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedExperienceLevels.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {selectedExperienceLevels.map((level) => (
                            <Badge
                              key={level}
                              variant="secondary"
                              className="px-3 py-1 text-sm"
                            >
                              {level}
                              <button
                                onClick={() => removeExperience(level)}
                                className="ml-2 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Location</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {LOCATION_OPTIONS.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`location-${option}`}
                            checked={selectedLocations.includes(option)}
                            onCheckedChange={() => handleLocationToggle(option)}
                          />
                          <label
                            htmlFor={`location-${option}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedLocations.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {selectedLocations.map((location) => (
                            <Badge
                              key={location}
                              variant="secondary"
                              className="px-3 py-1 text-sm"
                            >
                              {location}
                              <button
                                onClick={() => removeLocation(location)}
                                className="ml-2 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Company Size Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Company Size</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {COMPANY_SIZE_OPTIONS.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`size-${option}`}
                            checked={selectedCompanySizes.includes(option)}
                            onCheckedChange={() => handleCompanySizeToggle(option)}
                          />
                          <label
                            htmlFor={`size-${option}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedCompanySizes.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {selectedCompanySizes.map((size) => (
                            <Badge
                              key={size}
                              variant="secondary"
                              className="px-3 py-1 text-sm"
                            >
                              {size}
                              <button
                                onClick={() => removeCompanySize(size)}
                                className="ml-2 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Skills Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Skills</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {availableSkills.map((skill) => (
                        <div key={skill} className="flex items-center space-x-2">
                          <Checkbox
                            id={`skill-${skill}`}
                            checked={skillsFilter.includes(skill)}
                            onCheckedChange={() => handleSkillToggle(skill)}
                          />
                          <label
                            htmlFor={`skill-${skill}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {skill}
                          </label>
                        </div>
                      ))}
                    </div>
                    {skillsFilter.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {skillsFilter.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="px-3 py-1 text-sm"
                            >
                              {skill}
                              <button
                                onClick={() => removeSkill(skill)}
                                className="ml-2 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Any Rating</option>
                      <option value="4.5">4.5+ Stars</option>
                      <option value="4.0">4.0+ Stars</option>
                      <option value="3.5">3.5+ Stars</option>
                      <option value="3.0">3.0+ Stars</option>
                    </select>
                  </div>

                  {/* Availability Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Availability</label>
                    <select
                      value={availabilityFilter}
                      onChange={(e) => setAvailabilityFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Any Availability</option>
                      <option value="available">Available for Mentoring</option>
                      <option value="busy">Currently Busy</option>
                    </select>
                  </div>

                  {/* Legacy Text Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Custom Location</label>
                      <Input
                        placeholder="City, State, or Country"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Custom Company</label>
                      <Input
                        placeholder="Company name"
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Custom Industry</label>
                      <Input
                        placeholder="Industry"
                        value={industryFilter}
                        onChange={(e) => setIndustryFilter(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Mentoring Interests */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Mentoring Interests</label>
                    
                    {/* Predefined Options */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                      {MENTORSHIP_OPTIONS.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={option}
                            checked={selectedInterests.includes(option)}
                            onCheckedChange={() => handleInterestToggle(option)}
                          />
                          <label
                            htmlFor={option}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>

                    {/* Custom Interest Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom interest..."
                        value={customInterest}
                        onChange={(e) => setCustomInterest(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomInterest()}
                      />
                      <Button onClick={addCustomInterest} variant="outline">
                        Add
                      </Button>
                    </div>

                    {/* Selected Interests */}
                    {selectedInterests.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {selectedInterests.map((interest) => (
                            <Badge
                              key={interest}
                              variant="secondary"
                              className="px-3 py-1 text-sm"
                            >
                              {interest}
                              <button
                                onClick={() => removeInterest(interest)}
                                className="ml-2 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clear Filters */}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            {(filteredMentors || []).length} mentor{(filteredMentors || []).length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(filteredMentors || []).map((mentor) => (
            <Card key={mentor._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={mentor.userId?.profilePicture} />
                    <AvatarFallback className="text-lg">
                      {(mentor.userId?.firstName || mentor.firstName || 'A')?.[0]}{(mentor.userId?.lastName || mentor.lastName || 'U')?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {mentor.userId?.firstName || mentor.firstName || 'Alumni'} {mentor.userId?.lastName || mentor.lastName || 'User'}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Building className="h-4 w-4" />
                      <span>{mentor.currentPosition || 'Position'} at {mentor.currentCompany || 'Company'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{mentor.location?.city || 'City'}, {mentor.location?.state || 'State'}, {mentor.location?.country || 'Country'}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bio */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {mentor.bio || 'No bio available'}
                </p>

                {/* Mentoring Interests */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Mentoring Interests</h4>
                  <div className="flex flex-wrap gap-1">
                    {(mentor.mentoringInterests || []).slice(0, 3).map((interest, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {(mentor.mentoringInterests || []).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(mentor.mentoringInterests || []).length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {(mentor.skills || []).slice(0, 4).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {(mentor.skills || []).length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{(mentor.skills || []).length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Rating and Stats */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">
                      {mentor.rating ? mentor.rating.toFixed(1) : '4.5'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{mentor.totalMentees || 0} mentees</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1" 
                    size="sm"
                    onClick={() => handleConnect(mentor)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewProfile(mentor)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </div>
                
                {/* Book Mentorship Button */}
                <div className="pt-2">
                  <Button 
                    className="w-full" 
                    size="sm"
                    variant="secondary"
                    onClick={() => handleBookMentorship(mentor)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book a Mentorship
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {(filteredMentors || []).length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No mentors found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Mentorship Booking Modal */}
        {showBookingModal && selectedMentor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Book Mentorship with {selectedMentor.userId?.firstName || selectedMentor.firstName} {selectedMentor.userId?.lastName || selectedMentor.lastName}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBookingModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  <p>Fields marked with <span className="text-red-500">*</span> are required.</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bookingData.category}
                    onChange={(e) => setBookingData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="career_guidance">Career Guidance</option>
                    <option value="interview_prep">Interview Preparation</option>
                    <option value="project_help">Project Help</option>
                    <option value="networking">Networking</option>
                    <option value="skill_development">Skill Development</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={bookingData.title}
                    onChange={(e) => setBookingData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief title for your mentorship request"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={bookingData.description}
                    onChange={(e) => setBookingData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what you need help with..."
                    className="w-full p-2 border border-gray-300 rounded-md h-24"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Skills Needed</label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Type a skill and press Enter..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !bookingData.skillsNeeded.includes(value)) {
                            setBookingData(prev => ({
                              ...prev,
                              skillsNeeded: [...prev.skillsNeeded, value]
                            }));
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    {bookingData.skillsNeeded.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {bookingData.skillsNeeded.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                            {skill}
                            <button
                              type="button"
                              onClick={() => setBookingData(prev => ({
                                ...prev,
                                skillsNeeded: prev.skillsNeeded.filter((_, i) => i !== index)
                              }))}
                              className="ml-2 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>


                <div>
                  <label className="text-sm font-medium mb-2 block">Message to Mentor</label>
                  <textarea
                    value={bookingData.studentMessage}
                    onChange={(e) => setBookingData(prev => ({ ...prev, studentMessage: e.target.value }))}
                    placeholder="Add a personal message to the mentor..."
                    className="w-full p-2 border border-gray-300 rounded-md h-20"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleBookingSubmit} className="flex-1">
                    Send Request
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBookingModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

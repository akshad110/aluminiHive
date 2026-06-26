import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import BranchSelect from "@/components/forms/BranchSelect";
import SkillsSelect from "@/components/forms/SkillsSelect";
import { X, ChevronDown, Search } from "lucide-react";
import { API_ENDPOINTS } from "@/config/api";

// Predefined options for industry and mentoring interests
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

const MENTORING_INTERESTS_OPTIONS = [
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


interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function AlumniProfileSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [graduationYear, setGraduationYear] = useState("");
  const [degree, setDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [isAvailableForMentoring, setIsAvailableForMentoring] = useState(false);
  const [mentoringInterests, setMentoringInterests] = useState("");
  const [degrees, setDegrees] = useState<Array<{id: string, name: string}>>([]);
  
  // Industry search and filtering
  const [industrySearch, setIndustrySearch] = useState("");
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const industryInputRef = useRef<HTMLInputElement>(null);
  
  // Mentoring interests search and filtering
  const [mentoringSearch, setMentoringSearch] = useState("");
  const [showMentoringDropdown, setShowMentoringDropdown] = useState(false);
  const [selectedMentoringInterests, setSelectedMentoringInterests] = useState<string[]>([]);
  const mentoringInputRef = useRef<HTMLInputElement>(null);
  

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isDropdownClick = (target as Element).closest('[data-dropdown="true"]');
      
      // Check if click is outside industry dropdown
      if (industryInputRef.current && !industryInputRef.current.contains(target) && !isDropdownClick) {
        setShowIndustryDropdown(false);
      }
      
      // Check if click is outside mentoring dropdown
      if (mentoringInputRef.current && !mentoringInputRef.current.contains(target) && !isDropdownClick) {
        setShowMentoringDropdown(false);
      }
      
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      
      // Fetch alumni profile data from API
      const fetchAlumniProfile = async () => {
        try {
          const response = await fetch(`/api/users/${userObj._id}`);
          if (response.ok) {
            const responseData = await response.json();
            console.log('Fetched profile data:', responseData);
            
            // Extract profile data (alumni profile is in responseData.profile)
            const data = responseData.profile;
            
            if (data) {
              // Set form data from API response
              setGraduationYear(data.graduationYear || new Date().getFullYear());
              setDegree(data.degree || "Bachelor's");
              setBranch(data.branch || "");
              setCurrentCompany(data.currentCompany || "");
              setCurrentPosition(data.currentPosition || "");
              setIndustry(data.industry || "");
              
              // Set location data from API
              console.log('Raw location data:', data.location);
              if (data.location) {
                setCity(data.location.city || "");
                setState(data.location.state || "");
                setCountry(data.location.country || "");
                console.log('Location data loaded from nested object:', {
                  city: data.location.city,
                  state: data.location.state,
                  country: data.location.country
                });
              } else {
                setCity(data.city || "");
                setState(data.state || "");
                setCountry(data.country || "");
                console.log('Location data loaded from direct properties:', {
                  city: data.city,
                  state: data.state,
                  country: data.country
                });
              }
              
              setBio(data.bio || "");
              setSkills(Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : []));
              setIsAvailableForMentoring(data.isAvailableForMentoring || false);
              setMentoringInterests(Array.isArray(data.mentoringInterests) ? data.mentoringInterests.join(', ') : (data.mentoringInterests || ""));
              
              // Set industry and mentoring interests arrays
              if (data.industry) {
                setSelectedIndustries(data.industry.split(',').map((s: string) => s.trim()).filter(Boolean));
              }
              if (data.mentoringInterests) {
                setSelectedMentoringInterests(Array.isArray(data.mentoringInterests) ? data.mentoringInterests : data.mentoringInterests.split(',').map((s: string) => s.trim()).filter(Boolean));
              }
              
              // Debug: Log the state values after setting
              setTimeout(() => {
                console.log('Current form state after loading:', {
                  city: city,
                  state: state,
                  country: country
                });
              }, 100);
            } else {
              console.log('No profile data found');
            }
          } else {
            console.log('No alumni profile found, using defaults');
            // Load saved profile data from localStorage as fallback
            const profileKey = `alumni_profile_${userObj._id}`;
            const savedData = localStorage.getItem(profileKey);
            if (savedData) {
              const data = JSON.parse(savedData);
              setGraduationYear(data.graduationYear || new Date().getFullYear());
              setDegree(data.degree || "Bachelor's");
              setBranch(data.branch || "");
              setCurrentCompany(data.currentCompany || "");
              setCurrentPosition(data.currentPosition || "");
              setIndustry(data.industry || "");
              setCity(data.city || "");
              setState(data.state || "");
              setCountry(data.country || "");
              setBio(data.bio || "");
              setSkills(Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : []));
              setIsAvailableForMentoring(data.isAvailableForMentoring || false);
              setMentoringInterests(Array.isArray(data.mentoringInterests) ? data.mentoringInterests.join(', ') : (data.mentoringInterests || ""));
            }
          }
        } catch (error) {
          console.error('Error fetching alumni profile:', error);
          // Load saved profile data from localStorage as fallback
          const profileKey = `alumni_profile_${userObj._id}`;
          const savedData = localStorage.getItem(profileKey);
          if (savedData) {
            const data = JSON.parse(savedData);
            setGraduationYear(data.graduationYear || new Date().getFullYear());
            setDegree(data.degree || "Bachelor's");
            setBranch(data.branch || "");
            setCurrentCompany(data.currentCompany || "");
            setCurrentPosition(data.currentPosition || "");
            setIndustry(data.industry || "");
            setCity(data.city || "");
            setState(data.state || "");
            setCountry(data.country || "");
            setBio(data.bio || "");
            setSkills(Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : []));
            setIsAvailableForMentoring(data.isAvailableForMentoring || false);
            setMentoringInterests(Array.isArray(data.mentoringInterests) ? data.mentoringInterests.join(', ') : (data.mentoringInterests || ""));
          }
        }
      };

      fetchAlumniProfile();
    } else {
      navigate('/auth');
    }

    // Fetch degrees from API
    const fetchDegrees = async () => {
      try {
        const response = await fetch('/api/degrees');
        if (response.ok) {
          const data = await response.json();
          setDegrees(data.degrees || []);
        }
      } catch (error) {
        console.error('Error fetching degrees:', error);
      }
    };

    fetchDegrees();
  }, [navigate]);

  // Industry filtering functions
  const filteredIndustries = INDUSTRY_OPTIONS.filter(option =>
    option.toLowerCase().includes(industrySearch.toLowerCase())
  );

  const handleIndustrySelect = (industry: string) => {
    console.log('Industry selected:', industry);
    if (!selectedIndustries.includes(industry)) {
      setSelectedIndustries([...selectedIndustries, industry]);
      console.log('Added industry:', industry);
    }
    setIndustrySearch("");
    setShowIndustryDropdown(false);
  };

  const handleIndustryRemove = (industry: string) => {
    setSelectedIndustries(selectedIndustries.filter(item => item !== industry));
  };

  const handleIndustryKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = industrySearch.trim();
      if (value && !selectedIndustries.includes(value)) {
        setSelectedIndustries([...selectedIndustries, value]);
        setIndustrySearch("");
      }
    }
  };

  // Mentoring interests filtering functions
  const filteredMentoringInterests = MENTORING_INTERESTS_OPTIONS.filter(option =>
    option.toLowerCase().includes(mentoringSearch.toLowerCase())
  );

  const handleMentoringSelect = (interest: string) => {
    console.log('Mentoring interest selected:', interest);
    if (!selectedMentoringInterests.includes(interest)) {
      setSelectedMentoringInterests([...selectedMentoringInterests, interest]);
      console.log('Added mentoring interest:', interest);
    }
    setMentoringSearch("");
    setShowMentoringDropdown(false);
  };

  const handleMentoringRemove = (interest: string) => {
    setSelectedMentoringInterests(selectedMentoringInterests.filter(item => item !== interest));
  };

  const handleMentoringKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = mentoringSearch.trim();
      if (value && !selectedMentoringInterests.includes(value)) {
        setSelectedMentoringInterests([...selectedMentoringInterests, value]);
        setMentoringSearch("");
      }
    }
  };


  // Reusable SearchFilterInput component
  const SearchFilterInput = ({ 
    label, 
    placeholder, 
    search, 
    setSearch, 
    showDropdown, 
    setShowDropdown, 
    selectedItems, 
    onSelect, 
    onRemove, 
    onKeyPress, 
    filteredOptions, 
    inputRef 
  }: {
    label: string;
    placeholder: string;
    search: string;
    setSearch: (value: string) => void;
    showDropdown: boolean;
    setShowDropdown: (show: boolean) => void;
    selectedItems: string[];
    onSelect: (item: string) => void;
    onRemove: (item: string) => void;
    onKeyPress: (e: React.KeyboardEvent) => void;
    filteredOptions: string[];
    inputRef: React.RefObject<HTMLInputElement>;
  }) => (
    <div className="relative">
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>{label}</Label>
      
      {/* Selected items display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 border border-gray-200 rounded-md bg-gray-50">
          {selectedItems.map((item) => (
            <Badge key={item} variant="secondary" className="px-3 py-1 text-sm">
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="ml-2 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {/* Single Input field with search and manual input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          id={label.toLowerCase().replace(/\s+/g, '-')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {/* Dropdown */}
      {showDropdown && (
        <div 
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          data-dropdown="true"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(option);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(option);
                }}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              No options found. Press Enter to add "{search}"
            </div>
          )}
        </div>
      )}
      
      {/* Helper text */}
      <p className="text-sm text-muted-foreground mt-1">
        Type to search, click to select, or press Enter to add custom values
      </p>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/alumni/user/${user?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graduationYear: parseInt(graduationYear),
          degree,
          branch,
          currentCompany,
          currentPosition,
          industry: selectedIndustries.join(', '),
          location: {
            city: city,
            state: state,
            country: country
          },
          bio,
          skills: skills.join(', '),
          isAvailableForMentoring,
          mentoringInterests: selectedMentoringInterests,
        }),
      });

      if (response.ok) {
        // Save profile data to localStorage for progress tracking
        const profileKey = `alumni_profile_${user._id}`;
        const profileData = {
          graduationYear: parseInt(graduationYear),
          degree,
          branch,
          currentCompany,
          currentPosition,
          industry: selectedIndustries.join(', '),
          location: {
            city: city,
            state: state,
            country: country
          },
          bio,
          skills: skills.join(', '),
          isAvailableForMentoring,
          mentoringInterests: selectedMentoringInterests,
        };
        localStorage.setItem(profileKey, JSON.stringify(profileData));
        
        alert('Profile updated successfully!');
        navigate('/aluminii');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        alert('Unable to connect to the server. Please check if the server is running and try again.');
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <section className="container mx-auto py-12 md:py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary" style={{fontFamily:'Montserrat'}}>
              Complete Your Alumni Profile
            </CardTitle>
            <CardDescription>
              Help us connect you with students and showcase your expertise to the community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Education Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Education</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="graduationYear">Graduation Year</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="e.g., 2020"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="degree">Degree</Label>
                    <Select value={degree} onValueChange={setDegree}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select degree" />
                      </SelectTrigger>
                      <SelectContent>
                        {degrees.map((deg) => (
                          <SelectItem key={deg.id} value={deg.name}>
                            {deg.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <BranchSelect
                    value={branch}
                    onChange={setBranch}
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Professional Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentCompany">Current Company</Label>
                    <Input
                      id="currentCompany"
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      placeholder="e.g., Google"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentPosition">Current Position</Label>
                    <Input
                      id="currentPosition"
                      value={currentPosition}
                      onChange={(e) => setCurrentPosition(e.target.value)}
                      placeholder="e.g., Senior Software Engineer"
                      required
                    />
                  </div>
                </div>

                <SearchFilterInput
                  label="Industry"
                  placeholder="Search or type industry..."
                  search={industrySearch}
                  setSearch={setIndustrySearch}
                  showDropdown={showIndustryDropdown}
                  setShowDropdown={setShowIndustryDropdown}
                  selectedItems={selectedIndustries}
                  onSelect={handleIndustrySelect}
                  onRemove={handleIndustryRemove}
                  onKeyPress={handleIndustryKeyPress}
                  filteredOptions={filteredIndustries}
                  inputRef={industryInputRef}
                />

              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Location</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Enter your city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      type="text"
                      placeholder="Enter your state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      type="text"
                      placeholder="Enter your country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Bio and Skills */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">About You</h3>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your background, experience, and what you're passionate about..."
                    rows={4}
                  />
                </div>

                <div>
                  <SkillsSelect
                    value=""
                    onChange={() => {}}
                    placeholder="e.g., JavaScript, Python, React, Node.js, AWS"
                    label="Skills"
                    multiple
                    selectedSkills={skills}
                    onSkillsChange={setSkills}
                  />
                </div>
              </div>

              {/* Mentorship */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Mentorship</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mentoring"
                    checked={isAvailableForMentoring}
                    onCheckedChange={(checked) => setIsAvailableForMentoring(checked as boolean)}
                  />
                  <Label htmlFor="mentoring">I'm available for mentoring students</Label>
                </div>

                {isAvailableForMentoring && (
                  <SearchFilterInput
                    label="Mentoring Interests"
                    placeholder="Search or type mentoring interests..."
                    search={mentoringSearch}
                    setSearch={setMentoringSearch}
                    showDropdown={showMentoringDropdown}
                    setShowDropdown={setShowMentoringDropdown}
                    selectedItems={selectedMentoringInterests}
                    onSelect={handleMentoringSelect}
                    onRemove={handleMentoringRemove}
                    onKeyPress={handleMentoringKeyPress}
                    filteredOptions={filteredMentoringInterests}
                    inputRef={mentoringInputRef}
                  />
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="bg-brand-orange hover:bg-brand-orange/90">
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/aluminii')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

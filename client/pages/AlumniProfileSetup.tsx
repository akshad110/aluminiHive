import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [major, setMajor] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [isAvailableForMentoring, setIsAvailableForMentoring] = useState(false);
  const [mentoringInterests, setMentoringInterests] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
    } else {
      navigate('/auth');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/alumni/${user?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graduationYear: parseInt(graduationYear),
          degree,
          major,
          currentCompany,
          currentPosition,
          industry,
          location: {
            city,
            state,
            country
          },
          bio,
          skills: skills.split(',').map(s => s.trim()).filter(s => s),
          isAvailableForMentoring,
          mentoringInterests: mentoringInterests.split(',').map(m => m.trim()).filter(m => m),
        }),
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        navigate('/aluminii');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile. Please try again.');
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
                        <SelectItem value="Bachelor of Science">Bachelor of Science</SelectItem>
                        <SelectItem value="Bachelor of Engineering">Bachelor of Engineering</SelectItem>
                        <SelectItem value="Master of Science">Master of Science</SelectItem>
                        <SelectItem value="Master of Engineering">Master of Engineering</SelectItem>
                        <SelectItem value="PhD">PhD</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
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

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g., Technology"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Location</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., San Francisco"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g., California"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g., USA"
                      required
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
                  <Label htmlFor="skills">Skills</Label>
                  <Input
                    id="skills"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g., JavaScript, Python, React, Node.js, AWS"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Separate multiple skills with commas</p>
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
                  <div>
                    <Label htmlFor="mentoringInterests">Mentoring Interests</Label>
                    <Input
                      id="mentoringInterests"
                      value={mentoringInterests}
                      onChange={(e) => setMentoringInterests(e.target.value)}
                      placeholder="e.g., Career Guidance, Technical Skills, Interview Prep, Product Management"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Separate multiple interests with commas</p>
                  </div>
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

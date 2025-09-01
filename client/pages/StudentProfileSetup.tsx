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

export default function StudentProfileSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [studentId, setStudentId] = useState("");
  const [currentYear, setCurrentYear] = useState("");
  const [expectedGraduationYear, setExpectedGraduationYear] = useState("");
  const [major, setMajor] = useState("");
  const [minor, setMinor] = useState("");
  const [gpa, setGpa] = useState("");
  const [interests, setInterests] = useState("");
  const [careerGoals, setCareerGoals] = useState("");
  const [skills, setSkills] = useState("");
  const [isLookingForMentorship, setIsLookingForMentorship] = useState(false);
  const [mentorshipInterests, setMentorshipInterests] = useState("");

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
      const response = await fetch(`/api/students/${user?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          currentYear: parseInt(currentYear),
          expectedGraduationYear: parseInt(expectedGraduationYear),
          major,
          minor,
          gpa: parseFloat(gpa),
          interests: interests.split(',').map(i => i.trim()).filter(i => i),
          careerGoals: careerGoals.split(',').map(g => g.trim()).filter(g => g),
          skills: skills.split(',').map(s => s.trim()).filter(s => s),
          isLookingForMentorship,
          mentorshipInterests: mentorshipInterests.split(',').map(m => m.trim()).filter(m => m),
        }),
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        navigate('/student');
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
              Complete Your Student Profile
            </CardTitle>
            <CardDescription>
              Help us personalize your experience and connect you with the right alumni mentors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g., STU001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentYear">Current Year</Label>
                    <Select value={currentYear} onValueChange={setCurrentYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expectedGraduationYear">Expected Graduation Year</Label>
                    <Input
                      id="expectedGraduationYear"
                      type="number"
                      value={expectedGraduationYear}
                      onChange={(e) => setExpectedGraduationYear(e.target.value)}
                      placeholder="e.g., 2025"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gpa">GPA</Label>
                    <Input
                      id="gpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={gpa}
                      onChange={(e) => setGpa(e.target.value)}
                      placeholder="e.g., 3.8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="minor">Minor (Optional)</Label>
                    <Input
                      id="minor"
                      value={minor}
                      onChange={(e) => setMinor(e.target.value)}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                </div>
              </div>

              {/* Interests and Goals */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Interests & Goals</h3>
                
                <div>
                  <Label htmlFor="interests">Areas of Interest</Label>
                  <Input
                    id="interests"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g., Web Development, Machine Learning, Data Science"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Separate multiple interests with commas</p>
                </div>

                <div>
                  <Label htmlFor="careerGoals">Career Goals</Label>
                  <Input
                    id="careerGoals"
                    value={careerGoals}
                    onChange={(e) => setCareerGoals(e.target.value)}
                    placeholder="e.g., Software Engineer, Data Scientist, Product Manager"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Separate multiple goals with commas</p>
                </div>

                <div>
                  <Label htmlFor="skills">Skills</Label>
                  <Input
                    id="skills"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g., JavaScript, Python, React, Node.js"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Separate multiple skills with commas</p>
                </div>
              </div>

              {/* Mentorship */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Mentorship</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mentorship"
                    checked={isLookingForMentorship}
                    onCheckedChange={(checked) => setIsLookingForMentorship(checked as boolean)}
                  />
                  <Label htmlFor="mentorship">I'm looking for mentorship</Label>
                </div>

                {isLookingForMentorship && (
                  <div>
                    <Label htmlFor="mentorshipInterests">Mentorship Interests</Label>
                    <Input
                      id="mentorshipInterests"
                      value={mentorshipInterests}
                      onChange={(e) => setMentorshipInterests(e.target.value)}
                      placeholder="e.g., Career Guidance, Technical Skills, Interview Prep"
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
                <Button type="button" variant="outline" onClick={() => navigate('/student')}>
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

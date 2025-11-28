import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SkillsSelect from "@/components/forms/SkillsSelect";
import SkillsFilter from "@/components/forms/SkillsFilter";

export default function SkillsDemo() {
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [filteredSkill, setFilteredSkill] = useState("");
  const [demoResults, setDemoResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    esco: 'unknown' | 'working' | 'failed';
    local: 'unknown' | 'working' | 'failed';
    lastTest: string;
  }>({
    esco: 'unknown',
    local: 'unknown',
    lastTest: ''
  });

  // Test ESCO API directly
  const testESCOAPI = async () => {
    setLoading(true);
    try {
      console.log('Testing ESCO API...');
      const startTime = Date.now();
      
      const response = await fetch('/api/skills/search?q=programming&limit=5');
      const data = await response.json();
      const endTime = Date.now();
      
      console.log('ESCO API Response:', data);
      
      if (data.source === "Combined (Local + ESCO)" || data.source === "ESCO") {
        setApiStatus(prev => ({
          ...prev,
          esco: 'working',
          lastTest: `ESCO API working (${endTime - startTime}ms) - Found ${data.skills?.length || 0} skills`
        }));
      } else {
        setApiStatus(prev => ({
          ...prev,
          esco: 'failed',
          lastTest: `ESCO API failed - Using fallback (${endTime - startTime}ms)`
        }));
      }
    } catch (error) {
      console.error('ESCO API Test Error:', error);
      setApiStatus(prev => ({
        ...prev,
        esco: 'failed',
        lastTest: `ESCO API Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
    setLoading(false);
  };

  // Test local skills API
  const testLocalAPI = async () => {
    setLoading(true);
    try {
      console.log('Testing Local Skills API...');
      const startTime = Date.now();
      
      const response = await fetch('/api/skills');
      const data = await response.json();
      const endTime = Date.now();
      
      console.log('Local API Response:', data);
      
      if (data.skills && data.skills.length > 0) {
        setApiStatus(prev => ({
          ...prev,
          local: 'working',
          lastTest: `Local API working (${endTime - startTime}ms) - Found ${data.skills.length} skills`
        }));
      } else {
        setApiStatus(prev => ({
          ...prev,
          local: 'failed',
          lastTest: `Local API failed - No skills found`
        }));
      }
    } catch (error) {
      console.error('Local API Test Error:', error);
      setApiStatus(prev => ({
        ...prev,
        local: 'failed',
        lastTest: `Local API Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
    setLoading(false);
  };

  const handleSearchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filteredSkill && filteredSkill !== "all") {
        params.append('skills', filteredSkill);
      }
      
      const response = await fetch(`/api/students?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDemoResults(data.students || []);
      }
    } catch (error) {
      console.error('Error searching students:', error);
      setDemoResults([]);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: 'unknown' | 'working' | 'failed') => {
    switch (status) {
      case 'working':
        return <Badge className="bg-green-100 text-green-800">✅ Working</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">❌ Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">❓ Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Skills Selection Demo</h1>
        <p className="text-muted-foreground">
          This demo shows how users can select from predefined skills or enter custom ones, with ESCO API integration
        </p>
      </div>

      {/* API Status Testing */}
      <Card>
        <CardHeader>
          <CardTitle>API Status Testing</CardTitle>
          <CardDescription>
            Test whether the ESCO API is working or if the fallback system is being used
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">ESCO API Status:</h4>
                {getStatusBadge(apiStatus.esco)}
              </div>
              <Button 
                onClick={testESCOAPI} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? "Testing..." : "Test ESCO API"}
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">Local Skills API Status:</h4>
                {getStatusBadge(apiStatus.local)}
              </div>
              <Button 
                onClick={testLocalAPI} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? "Testing..." : "Test Local API"}
              </Button>
            </div>
          </div>
          
          {apiStatus.lastTest && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Last Test Result:</strong> {apiStatus.lastTest}
              </p>
            </div>
          )}

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800 mb-2">How to Check API Status:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>ESCO API Working:</strong> You'll see "Combined (Local + ESCO)" or "ESCO" in the response</li>
              <li>• <strong>ESCO API Failed:</strong> You'll see "Local" in the response and fallback skills</li>
              <li>• <strong>Check Console:</strong> Open browser dev tools to see detailed API responses</li>
              <li>• <strong>Network Tab:</strong> Check if ESCO API calls are being made</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Single Skill Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Single Skill Selection</CardTitle>
            <CardDescription>
              Use this component for single skill selection. Users can select from predefined skills or enter custom ones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SkillsSelect
              value={selectedSkill}
              onChange={setSelectedSkill}
              placeholder="Select or enter a skill..."
              label="Your Skill"
              required
            />
            
            {selectedSkill && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Selected:</strong> {selectedSkill}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

                 {/* Multiple Skills Selection */}
         <Card>
           <CardHeader>
             <CardTitle>Your Skills</CardTitle>
             <CardDescription>
               Add multiple skills with tags. Click the × to remove skills. Type to search or add custom skills.
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <SkillsSelect
               value=""
               onChange={() => {}}
               placeholder="Add skills..."
               label="Your Skills"
               multiple
               selectedSkills={selectedSkills}
               onSkillsChange={setSelectedSkills}
             />
             
             {selectedSkills.length > 0 && (
               <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                 <p className="text-sm text-green-800 mb-2">
                   <strong>Total Skills ({selectedSkills.length}):</strong>
                 </p>
                 <div className="text-xs text-green-700">
                   {selectedSkills.join(', ')}
                 </div>
               </div>
             )}
           </CardContent>
         </Card>

        {/* Skills Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Skills Filter</CardTitle>
            <CardDescription>
              Use this component for filtering/searching. Shows categorized skills for easy selection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SkillsFilter
              value={filteredSkill}
              onChange={setFilteredSkill}
              placeholder="Filter by skills..."
              label="Filter Students by Skills"
            />
            
            <Button 
              onClick={handleSearchStudents}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Searching..." : "Search Students"}
            </Button>

            {filteredSkill && filteredSkill !== "all" && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                <p className="text-sm text-purple-800">
                  <strong>Filter:</strong> {filteredSkill}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills Search Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Skills Search Demo</CardTitle>
            <CardDescription>
              Test the ESCO API integration by searching for skills.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SkillsSelect
              value=""
              onChange={() => {}}
              placeholder="Search for skills (e.g., 'programming', 'leadership')..."
              label="Search Skills"
            />
            
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>ESCO API Integration:</strong> This component searches both local skills and the European Skills/Competences, qualifications and Occupations (ESCO) database for comprehensive skill discovery.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Results */}
      {demoResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Students found with the selected skills filter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {demoResults.map((student, index) => (
                <div key={index} className="p-3 border rounded-md">
                  <p className="font-medium">
                    {student.userId?.firstName} {student.userId?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Branch: {student.branch} | Skills: {student.skills?.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Check API Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Method 1: Use the Test Buttons Above</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Click "Test ESCO API" to check ESCO integration</li>
                <li>• Click "Test Local API" to check local skills</li>
                <li>• Check the status badges and test results</li>
                <li>• Look at the console for detailed responses</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Method 2: Browser Developer Tools</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Open F12 → Network tab</li>
                <li>• Search for skills and watch API calls</li>
                <li>• Check if ESCO API calls are made</li>
                <li>• Look at response data for "source" field</li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-semibold text-green-800 mb-2">Expected Results:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✅ <strong>ESCO Working:</strong> Response shows "Combined (Local + ESCO)" or "ESCO"</li>
              <li>⚠️ <strong>ESCO Failed:</strong> Response shows "Local" (fallback system working)</li>
              <li>❌ <strong>Both Failed:</strong> No skills returned (check server logs)</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-semibold text-blue-800 mb-2">Console Debugging:</h4>
            <p className="text-sm text-blue-700">
              Open browser console (F12) and search for skills. You'll see detailed API responses showing whether ESCO API is working or if fallback is being used.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

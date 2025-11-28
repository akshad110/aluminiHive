import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BranchSelect from "@/components/forms/BranchSelect";
import BranchFilter from "@/components/forms/BranchFilter";

export default function BranchDemo() {
  const [selectedBranch, setSelectedBranch] = useState("");
  const [filteredBranch, setFilteredBranch] = useState("");
  const [demoResults, setDemoResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filteredBranch && filteredBranch !== "all") {
        params.append('branch', filteredBranch);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Branch Selection Demo</h1>
        <p className="text-muted-foreground">
          This demo shows how users can select from predefined branches or enter custom ones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BranchSelect Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Branch Selection</CardTitle>
            <CardDescription>
              Use this component for profile setup. Users can select from predefined branches or enter custom ones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BranchSelect
              value={selectedBranch}
              onChange={setSelectedBranch}
              placeholder="Select or enter your branch..."
              label="Your Branch"
              required
            />
            
            {selectedBranch && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Selected:</strong> {selectedBranch}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* BranchFilter Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Branch Filter</CardTitle>
            <CardDescription>
              Use this component for filtering/searching. Shows categorized branches for easy selection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BranchFilter
              value={filteredBranch}
              onChange={setFilteredBranch}
              placeholder="Filter by branch..."
              label="Filter Students by Branch"
            />
            
            <Button 
              onClick={handleSearchStudents}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Searching..." : "Search Students"}
            </Button>

            {filteredBranch && filteredBranch !== "all" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Filter:</strong> {filteredBranch}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search Results */}
      {demoResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Students found with the selected branch filter
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
                    Branch: {student.branch} | Year: {student.currentYear}
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
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">BranchSelect Component</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Dropdown with categorized branches</li>
                <li>• Search functionality within dropdown</li>
                <li>• Option to enter custom branch</li>
                <li>• Perfect for profile setup forms</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">BranchFilter Component</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Categorized dropdown for filtering</li>
                <li>• Shows branch categories clearly</li>
                <li>• Easy selection for search/filter</li>
                <li>• Perfect for search interfaces</li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800 mb-2">Key Features</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>✅ 11 main academic categories with 200+ specific branches</li>
              <li>✅ Users can still enter custom branches not in the list</li>
              <li>✅ Categorized organization for easy browsing</li>
              <li>✅ Search functionality within categories</li>
              <li>✅ Responsive design with keyboard navigation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

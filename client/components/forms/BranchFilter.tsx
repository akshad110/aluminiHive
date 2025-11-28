import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Branch {
  id: string;
  category: string;
  name: string;
}

interface BranchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export default function BranchFilter({ 
  value, 
  onChange, 
  placeholder = "Filter by branch...", 
  className,
  label = "Branch Filter"
}: BranchFilterProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch branches from API
  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/branches');
        if (response.ok) {
          const data = await response.json();
          setBranches(data.branches || []);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(data.branches.map((b: Branch) => b.category))] as string[];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
      setLoading(false);
    };

    fetchBranches();
  }, []);

  const getBranchesByCategory = (category: string) => {
    return branches.filter(branch => branch.category === category);
  };

  return (
    <div className={className}>
      {label && (
        <Label className="block mb-2 text-sm font-medium">
          {label}
        </Label>
      )}
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Branches</SelectItem>
          {categories.map(category => (
            <div key={category}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                {category}
              </div>
              {getBranchesByCategory(category).map(branch => (
                <SelectItem key={branch.id} value={branch.name}>
                  {branch.name}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

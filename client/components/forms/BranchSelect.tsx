import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Branch {
  id: string;
  category: string;
  name: string;
}

interface BranchSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

export default function BranchSelect({ 
  value, 
  onChange, 
  placeholder = "Select or enter your branch...", 
  className,
  label = "Branch",
  required = false 
}: BranchSelectProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch branches from API
  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/branches');
        if (response.ok) {
          const data = await response.json();
          setBranches(data.branches || []);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
      setLoading(false);
    };

    fetchBranches();
  }, []);

  // Filter branches based on input
  useEffect(() => {
    if (!value.trim()) {
      setFilteredBranches(branches.slice(0, 10)); // Show first 10 branches when empty
    } else {
      const filtered = branches
        .filter(branch => 
          branch.name.toLowerCase().includes(value.toLowerCase()) ||
          branch.category.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 8);
      setFilteredBranches(filtered);
    }
    setActiveIndex(0);
  }, [value, branches]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    setShowDropdown(true);
  };

  const handleSelectBranch = (branchName: string) => {
    onChange(branchName);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setShowDropdown(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, filteredBranches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && showDropdown) {
      e.preventDefault();
      const selectedBranch = filteredBranches[activeIndex];
      if (selectedBranch) {
        handleSelectBranch(selectedBranch.name);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <Label htmlFor="branch-input" className="block mb-2 text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <Input
        id="branch-input"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full"
        required={required}
      />

      {showDropdown && filteredBranches.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-white shadow-lg">
          {filteredBranches.map((branch, index) => (
            <div
              key={branch.id}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm",
                index === activeIndex && "bg-gray-100",
                index === 0 && "border-b border-gray-200"
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectBranch(branch.name);
              }}
            >
              <div className="font-medium">{branch.name}</div>
              <div className="text-xs text-gray-500">{branch.category}</div>
            </div>
          ))}
          
          {value.trim() && !filteredBranches.some(b => b.name.toLowerCase() === value.toLowerCase()) && (
            <div
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm border-t border-gray-200"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectBranch(value);
              }}
            >
              <div className="font-medium">Use "{value}"</div>
              <div className="text-xs text-gray-500">Custom branch</div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
}

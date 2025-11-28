import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Skill {
  id: string;
  category: string;
  name: string;
  description?: string;
  source?: string;
}

interface SkillsSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  multiple?: boolean;
  selectedSkills?: string[];
  onSkillsChange?: (skills: string[]) => void;
}

export default function SkillsSelect({ 
  value, 
  onChange, 
  placeholder = "Select or enter skills...", 
  className,
  label = "Skills",
  required = false,
  multiple = false,
  selectedSkills = [],
  onSkillsChange
}: SkillsSelectProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch skills from API
  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/skills');
        if (response.ok) {
          const data = await response.json();
          setSkills(data.skills || []);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
      }
      setLoading(false);
    };

    fetchSkills();
  }, []);

  // Search skills from ESCO API when user types
  useEffect(() => {
    if (searchQuery.length < 2) {
      setFilteredSkills(skills.slice(0, 10));
      return;
    }

    const searchSkills = async () => {
      try {
        console.log(`🔍 Searching skills for: "${searchQuery}"`);
        const response = await fetch(`/api/skills/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          console.log(`📡 Skills API Response:`, data);
          console.log(`📊 Source: ${data.source}, Skills found: ${data.skills?.length || 0}`);
          setFilteredSkills(data.skills || []);
        }
      } catch (error) {
        console.error('❌ Error searching skills:', error);
        // Fallback to local filtering
        const filtered = skills.filter(skill => 
          skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          skill.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
        console.log(`🔄 Using local fallback, found ${filtered.length} skills`);
        setFilteredSkills(filtered.slice(0, 10));
      }
    };

    const timeoutId = setTimeout(searchSkills, 300); // debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery, skills]);

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
    setSearchQuery(inputValue);
    if (multiple) {
      // For multiple selection, don't change the main value
      setShowDropdown(true);
    } else {
      onChange(inputValue);
      setShowDropdown(true);
    }
  };

  const handleSelectSkill = (skillName: string) => {
    if (multiple) {
      const newSkills = [...selectedSkills];
      if (!newSkills.includes(skillName)) {
        newSkills.push(skillName);
        onSkillsChange?.(newSkills);
      }
      setSearchQuery("");
    } else {
      onChange(skillName);
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setShowDropdown(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, filteredSkills.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && showDropdown) {
      e.preventDefault();
      const selectedSkill = filteredSkills[activeIndex];
      if (selectedSkill) {
        handleSelectSkill(selectedSkill.name);
      } else if (searchQuery.trim()) {
        handleSelectSkill(searchQuery.trim());
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const removeSkill = (skillToRemove: string) => {
    if (multiple && onSkillsChange) {
      const newSkills = selectedSkills.filter(skill => skill !== skillToRemove);
      onSkillsChange(newSkills);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <Label htmlFor="skills-input" className="block mb-2 text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      {/* Selected Skills Display (for multiple mode) */}
      {multiple && selectedSkills.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedSkills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-lg border border-blue-200 hover:bg-blue-150 transition-colors"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1 text-blue-600 hover:text-blue-800 font-semibold text-lg leading-none w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-200 transition-colors"
                title="Remove skill"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      <Input
        id="skills-input"
        value={multiple ? searchQuery : value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 transition-colors"
        required={required && !multiple}
      />

      {showDropdown && filteredSkills.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-white shadow-lg">
          {filteredSkills.map((skill, index) => (
            <div
              key={skill.id}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm",
                index === activeIndex && "bg-gray-100",
                index === 0 && "border-b border-gray-200"
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectSkill(skill.name);
              }}
            >
              <div className="font-medium">{skill.name}</div>
              <div className="text-xs text-gray-500">{skill.category}</div>
              {skill.description && (
                <div className="text-xs text-gray-400 mt-1">{skill.description}</div>
              )}
              {skill.source && (
                <div className="text-xs text-blue-500 mt-1">Source: {skill.source}</div>
              )}
            </div>
          ))}
          
          {searchQuery.trim() && !filteredSkills.some(s => s.name.toLowerCase() === searchQuery.toLowerCase()) && (
            <div
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm border-t border-gray-200"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectSkill(searchQuery.trim());
              }}
            >
              <div className="font-medium">Add "{searchQuery.trim()}"</div>
              <div className="text-xs text-gray-500">Custom skill</div>
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

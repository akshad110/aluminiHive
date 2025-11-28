import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Skill {
  id: string;
  category: string;
  name: string;
  description?: string;
  source?: string;
}

interface SkillsFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export default function SkillsFilter({ 
  value, 
  onChange, 
  placeholder = "Filter by skills...", 
  className,
  label = "Skills Filter"
}: SkillsFilterProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch skills from API
  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/skills');
        if (response.ok) {
          const data = await response.json();
          setSkills(data.skills || []);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(data.skills.map((s: Skill) => s.category))] as string[];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
      }
      setLoading(false);
    };

    fetchSkills();
  }, []);

  const getSkillsByCategory = (category: string) => {
    return skills.filter(skill => skill.category === category);
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
          <SelectItem value="all">All Skills</SelectItem>
          {categories.map(category => (
            <div key={category}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                {category}
              </div>
              {getSkillsByCategory(category).map(skill => (
                <SelectItem key={skill.id} value={skill.name}>
                  {skill.name}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

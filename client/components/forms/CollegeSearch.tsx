import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface College {
  _id?: string;
  name: string;
}

interface ApiResponse {
  colleges: string[] | College[] | null;
  count?: number;
  currentPage?: number;
  pages?: number;
}

interface CollegeSearchProps {
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

// No local fallback list; rely solely on API

export default function CollegeSearch({ value, onChange, placeholder = "Search your college...", className }: CollegeSearchProps) {
  // Ensure value is always a string to prevent controlled/uncontrolled input warning
  const safeValue = value ?? "";
  const [query, setQuery] = useState(safeValue);
  const [results, setResults] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  // Search colleges from API only
  useEffect(() => {
    // Ensure query is always a string before checking length
    const queryStr = query ?? "";
    if (queryStr.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const searchColleges = async () => {
      setLoading(true);
      
      try {
        const queryStr = query ?? "";
        const url = `/api/colleges/search?query=${encodeURIComponent(queryStr)}`;
        console.log('Fetching colleges from:', url);
        
        const res = await fetch(url);
        
        if (!res.ok) {
          console.error('College search failed:', res.status, res.statusText);
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data: ApiResponse = await res.json();
        console.log('College search response:', data);
        
        // Handle both string array and object array responses
        const colleges = data.colleges || [];
        const formattedResults: College[] = colleges.map((college, index) => {
          if (typeof college === 'string') {
            return {
              _id: `college-${index}`,
              name: college
            };
          }
          return college;
        });
        
        setResults(formattedResults);
      } catch (err) {
        console.error('College search error:', err);
        setResults([]);
        // Show error message to user
        console.warn('Failed to fetch colleges. Please check your connection.');
      } finally {
        setOpen(true);
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchColleges, 300); // debounce
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle click outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSelect = (collegeName: string) => {
    console.log('College selected:', collegeName);
    setQuery(collegeName);
    onChange(collegeName);
    setOpen(false);
    console.log('College value set to:', collegeName);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && results.length > 0) {
      e.preventDefault();
      const choice = results[active];
      if (choice) {
        handleSelect(choice.name);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        value={query ?? ""}
        onChange={(e) => {
          const newValue = e.target.value ?? "";
          setQuery(newValue);
          onChange(newValue);
        }}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-autocomplete="list"
        aria-expanded={open}
      />
      
      {open && (results.length > 0 || loading) && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white p-1 shadow-md">
          {loading ? (
            <li key="loading" className="px-3 py-2 text-sm text-muted-foreground">
              Searching colleges...
            </li>
          ) : results.length > 0 ? (
            results.map((college, i) => (
              <li
                key={college._id || `college-${i}`}
                className={cn(
                  "cursor-pointer rounded-sm px-3 py-2 text-sm hover:bg-accent",
                  i === active && "bg-accent",
                )}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(college.name);
                }}
              >
                {college.name}
              </li>
            ))
          ) : (
            <li key="no-results" className="px-3 py-2 text-sm text-muted-foreground">
              No colleges found. Try a different search term.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

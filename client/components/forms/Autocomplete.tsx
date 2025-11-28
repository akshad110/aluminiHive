import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  options?: string[];
  placeholder?: string;
  className?: string;
  useApi?: boolean;
}

export default function Autocomplete({ value, onChange, options = [], placeholder, className, useApi = false }: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [apiOptions, setApiOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch colleges from API when using API mode
  useEffect(() => {
    if (!useApi) return;
    
    const fetchColleges = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/colleges/search?query=${encodeURIComponent(value)}`);
        const data = await response.json();
        setApiOptions(data.colleges || []);
      } catch (error) {
        console.error('Error fetching colleges:', error);
        setApiOptions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchColleges, 300); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [value, useApi]);

  const filtered = useMemo(() => {
    if (useApi) {
      return apiOptions;
    }
    
    const v = value.trim().toLowerCase();
    if (!v) return options.slice(0, 8);
    return options.filter(o => o.toLowerCase().includes(v)).slice(0, 8);
  }, [value, options, apiOptions, useApi]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      const choice = filtered[active];
      if (choice) {
        onChange(choice);
        setOpen(false);
      }
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white p-1 shadow-md">
          {loading ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">Searching...</li>
          ) : filtered.length > 0 ? (
            filtered.map((opt, i) => (
              <li
                key={opt}
                className={cn(
                  "cursor-pointer rounded-sm px-3 py-2 text-sm hover:bg-accent",
                  i === active && "bg-accent",
                )}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt);
                  setOpen(false);
                }}
              >
                {opt}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-muted-foreground">No colleges found</li>
          )}
        </ul>
      )}
    </div>
  );
}

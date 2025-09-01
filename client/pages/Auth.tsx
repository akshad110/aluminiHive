import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Autocomplete from "@/components/forms/Autocomplete";

const DUMMY_COLLEGES = [
  "Indian Institute of Technology Bombay",
  "Indian Institute of Technology Delhi",
  "Indian Institute of Technology Madras",
  "National Institute of Technology Trichy",
  "Birla Institute of Technology and Science, Pilani",
  "Delhi University",
  "Anna University",
  "Savitribai Phule Pune University",
  "University of Mumbai",
  "Vellore Institute of Technology",
  "SRM Institute of Science and Technology",
  "Amity University",
  "Christ University",
  "Jamia Millia Islamia",
  "Jawaharlal Nehru University",
];

type Role = "alumni" | "student";

export default function Auth() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  const [loginRole, setLoginRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [batch, setBatch] = useState("");
  const [college, setCollege] = useState("");

  const isFormValid = useMemo(() => !!role && name && email && batch && college, [role, name, email, batch, college]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3001/auth/simple-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: name,
          email,
          batch,
          college,
          role
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data in localStorage for now (in a real app, use proper state management)
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect based on role
        const target = role === "alumni" ? "/aluminii" : "/student";
        navigate(target);
      } else {
        alert(data.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Please try again.');
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    navigate(loginRole === "alumni" ? "/aluminii" : "/student");
  }

  return (
    <section className="container mx-auto max-w-4xl py-12">
      <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-3xl font-bold text-primary" style={{fontFamily:'Montserrat'}}>Welcome to AlumniHive</h1>
        <p className="mt-1 text-muted-foreground">Login or create an account to continue.</p>

        <Tabs defaultValue="signup" className="mt-6">
          <TabsList>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="mt-6">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-foreground/80">Are you an Alumni or a Student?</h3>
              <RadioGroup
                className="mt-2 grid grid-cols-2 gap-3 sm:w-80"
                onValueChange={(v)=>setRole(v as Role)}
                value={role ?? undefined}
              >
                <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-accent">
                  <RadioGroupItem value="alumni" />
                  <span>Alumni</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-accent">
                  <RadioGroupItem value="student" />
                  <span>Student</span>
                </label>
              </RadioGroup>
            </div>

            {role && (
              <form onSubmit={handleSignup} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Full name</label>
                  <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">College email</label>
                  <Input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="you@college.edu" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Batch</label>
                  <Input value={batch} onChange={(e)=>setBatch(e.target.value)} placeholder="2025" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">College name</label>
                  <Autocomplete
                    value={college}
                    onChange={setCollege}
                    options={DUMMY_COLLEGES}
                    placeholder="Search your college..."
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Type to filter from dummy data. This will connect to a live API later.</p>
                </div>
                <div className="sm:col-span-2 mt-2 flex gap-3">
                  <Button type="submit" disabled={!isFormValid} className="bg-brand-orange hover:bg-brand-orange/90">Create account</Button>
                  <Button type="button" variant="outline" onClick={()=>{setRole(null); setName(""); setEmail(""); setBatch(""); setCollege("");}}>Reset</Button>
                </div>
              </form>
            )}
          </TabsContent>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleLogin} className="grid max-w-md gap-4">
              <div>
                <h3 className="mb-2 text-sm font-medium text-foreground/80">Login as</h3>
                <RadioGroup className="grid grid-cols-2 gap-3" value={loginRole} onValueChange={(v)=>setLoginRole(v as Role)}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-accent">
                    <RadioGroupItem value="student" />
                    <span>Student</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-accent">
                    <RadioGroupItem value="alumni" />
                    <span>Alumni</span>
                  </label>
                </RadioGroup>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Password</label>
                <Input type="password" placeholder="••••••••" required />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-primary hover:bg-primary/90">Login</Button>
                <Button type="button" variant="outline" onClick={()=>navigate("/auth")}>Cancel</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

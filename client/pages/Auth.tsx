import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS } from "@/config/api";

// Removed DUMMY_COLLEGES - now using real API

type Role = "alumni" | "student";

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [loginRole, setLoginRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [batch, setBatch] = useState("");
  const [college, setCollege] = useState("");
  const [password, setPassword] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const isFormValid = useMemo(() => {
    // Check all fields are filled and not just whitespace
    const valid = !!(
      role && 
      name && name.trim() && 
      email && email.trim() && 
      batch && batch.trim() && 
      college && college.trim() && 
      signupPassword && signupPassword.trim() &&
      signupPassword.length >= 6
    );
    // Debug logging
    if (!valid) {
      console.log('Form validation failed:', {
        role: !!role,
        name: !!(name && name.trim()),
        email: !!(email && email.trim()),
        batch: !!(batch && batch.trim()),
        college: !!(college && college.trim()),
        password: !!(signupPassword && signupPassword.trim() && signupPassword.length >= 6),
        collegeValue: college
      });
    }
    return valid;
  }, [role, name, email, batch, college, signupPassword]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    // Debug: Log current form values
    console.log('Form values:', { role, name, email, batch, college, signupPassword: signupPassword?.length });
    console.log('isFormValid:', isFormValid);

    // Additional validation check with detailed feedback
    if (!role) {
      alert('Please select whether you are an Alumni or Student.');
      return;
    }
    if (!name || !name.trim()) {
      alert('Please enter your full name.');
      return;
    }
    if (!email || !email.trim()) {
      alert('Please enter your email address.');
      return;
    }
    if (!batch || !batch.trim()) {
      alert('Please enter your batch year.');
      return;
    }
    if (!college || !college.trim()) {
      alert('Please select your college from the dropdown. Current value: "' + college + '"');
      return;
    }
    if (!signupPassword || !signupPassword.trim() || signupPassword.length < 6) {
      alert('Please enter a password with at least 6 characters.');
      return;
    }

    try {
      console.log('🔗 Signup URL:', API_ENDPOINTS.AUTH.SIGNUP);
      const response = await fetch(API_ENDPOINTS.AUTH.SIGNUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: signupPassword,
          batch: batch.trim(),
          college: college.trim(),
          role
        }),
      });

      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📡 Response URL:', response.url);

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response received:', text.substring(0, 200));
        if (response.status === 404) {
          alert(`API endpoint not found (404). Please check:\n1. Backend is deployed and running\n2. VITE_API_URL is set correctly\n3. URL: ${API_ENDPOINTS.AUTH.SIGNUP}`);
        } else {
          alert(`Server error: ${response.status} ${response.statusText}. Please check if the backend is running.`);
        }
        return;
      }

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Signup successful:', data.user);
        // Use AuthContext to update user state
        login(data.user);

        // Redirect based on role
        const target = role === "alumni" ? "/aluminii" : "/student";
        navigate(target);
      } else {
        console.error('❌ Signup failed:', data);
        const errorMsg = data.error || data.message || 'Signup failed';
        const missingFields = data.missingFields ? ` Missing: ${data.missingFields.join(', ')}` : '';
        alert(errorMsg + missingFields);
      }
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        alert('Server returned invalid response. Please check if the backend is running and accessible.');
      } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        alert('Unable to connect to the server. Please check:\n1. Backend URL is correct\n2. Backend is running\n3. CORS is configured properly');
      } else {
        alert('Signup failed. Please try again.');
      }
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation with specific messages
    if (!loginRole) {
      alert('Please select whether you are logging in as Student or Alumni.');
      return;
    }
    if (!email || !email.trim()) {
      alert('Please enter your email address.');
      return;
    }
    if (!password || !password.trim()) {
      alert('Please enter your password.');
      return;
    }

    try {
      console.log('🔗 Login URL:', API_ENDPOINTS.AUTH.LOGIN);
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role: loginRole,
        }),
      });

      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📡 Response URL:', response.url);

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response received:', text.substring(0, 200));
        if (response.status === 404) {
          alert(`API endpoint not found (404). Please check:\n1. Backend is deployed and running\n2. VITE_API_URL is set correctly\n3. URL: ${API_ENDPOINTS.AUTH.LOGIN}`);
        } else {
          alert(`Server error: ${response.status} ${response.statusText}. Please check if the backend is running.`);
        }
        return;
      }

      const data = await response.json();

      if (response.ok) {
        // Use AuthContext to update user state
        login(data.user);

        // Redirect based on role
        const target = data.user.role === "alumni" ? "/aluminii" : "/student";
        navigate(target);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        alert('Server returned invalid response. Please check if the backend is running and accessible.');
      } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        alert('Unable to connect to the server. Please check:\n1. Backend URL is correct\n2. Backend is running\n3. CORS is configured properly');
      } else {
        alert('Login failed. Please try again.');
      }
    }
  }

  return (
    <section className="container mx-auto max-w-4xl py-6 sm:py-12 px-4 w-full">
      <div className="rounded-2xl border bg-white p-4 sm:p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary" style={{fontFamily:'Montserrat'}}>Welcome to AlumniHive</h1>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">Login or create an account to continue.</p>

        <Tabs defaultValue="signup" className="mt-6">
          <TabsList>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="mt-6">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-foreground/80">Are you an Alumni or a Student?</h3>
              <RadioGroup
                className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:w-80"
                onValueChange={(v)=>setRole(v as Role)}
                value={role || ""}
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
                <div>
                  <label className="mb-1 block text-sm font-medium">Password</label>
                  <Input 
                    type="password" 
                    value={signupPassword} 
                    onChange={(e)=>setSignupPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">College name</label>
                  <Input 
                    value={college} 
                    onChange={(e) => setCollege(e.target.value)} 
                    placeholder="Enter your college name (e.g., IIT Bombay)" 
                    required 
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Enter your college name. This will be used to create or join your college group.</p>
                </div>
                <div className="sm:col-span-2 mt-2 flex flex-col sm:flex-row gap-3">
                  <Button type="submit" className="bg-brand-orange hover:bg-brand-orange/90 w-full sm:w-auto">Create account</Button>
                  <Button type="button" variant="outline" onClick={()=>{setRole(undefined); setName(""); setEmail(""); setBatch(""); setCollege(""); setPassword(""); setSignupPassword("");}} className="w-full sm:w-auto">Reset</Button>
                </div>
              </form>
            )}
          </TabsContent>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleLogin} className="grid max-w-md gap-4">
              <div>
                <h3 className="mb-2 text-sm font-medium text-foreground/80">Login as</h3>
                <RadioGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3" value={loginRole} onValueChange={(v)=>setLoginRole(v as Role)}>
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
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={!email || !password || !loginRole} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">Login</Button>
                <Button type="button" variant="outline" onClick={()=>navigate("/auth")} className="w-full sm:w-auto">Cancel</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

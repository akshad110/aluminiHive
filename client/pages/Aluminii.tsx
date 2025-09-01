import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function Aluminii() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);

      // Check if profile is complete (you can add more sophisticated logic here)
      // For now, we'll assume profile needs to be set up
      setHasProfile(false);
    }
  }, []);

  if (!user) {
    return (
      <section className="container mx-auto py-16">
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-primary" style={{fontFamily:'Montserrat'}}>Alumni Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Please log in to access your dashboard.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto py-16">
      <div className="space-y-6">
        {/* Welcome Message */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary" style={{fontFamily:'Montserrat'}}>
              Welcome, {user.firstName}!
            </CardTitle>
            <CardDescription>
              You're now signed in to the alumni area of AlumniHive.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Profile Setup */}
        {!hasProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Set up your alumni profile to connect with students and share your expertise.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="bg-brand-orange hover:bg-brand-orange/90"
                onClick={() => navigate('/alumni/profile-setup')}
              >
                Set Up Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Content */}
        <Card>
          <CardHeader>
            <CardTitle>Alumni Dashboard</CardTitle>
            <CardDescription>
              Your personalized alumni area with mentorship opportunities, events, and networking features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Dashboard features will be available once you complete your profile setup.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

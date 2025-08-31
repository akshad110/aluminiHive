import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Auth() {
  return (
    <section className="container mx-auto max-w-3xl py-16">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-primary" style={{fontFamily:'Montserrat'}}>Login / Sign Up</h1>
        <p className="mb-6 text-muted-foreground">
          Authentication flow coming soon. In the meantime, explore the platform and learn more about AluminiHive.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-brand-orange hover:bg-brand-orange/90">
            <Link to="/">Return Home</Link>
          </Button>
          <Button asChild variant="outline">
            <a href="/#about">Learn More</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

import Reveal from "@/components/animations/Reveal";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Briefcase, GraduationCap, CalendarDays } from "lucide-react";

export default function Student() {
  return (
    <section className="container mx-auto py-12 md:py-16">
      {/* Intro */}
      <div className="rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-primary" style={{fontFamily:'Montserrat'}}>Welcome, Student!</h1>
        <p className="mt-2 text-muted-foreground">Discover mentors, jobs, and events tailored to your growth.</p>
      </div>

      {/* Student Benefits split section */}
      <div className="mt-10 grid items-center gap-8 md:grid-cols-2">
        <Reveal>
          <div>
            <h2 className="text-2xl font-bold text-primary md:text-3xl" style={{fontFamily:'Montserrat'}}>Student Benefits</h2>
            <p className="mt-3 text-muted-foreground">AluminiHive helps you unlock opportunities with alumni support and a powerful network.</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-orange"/> 1:1 mentorship from experienced alumni</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-orange"/> Curated internships and job referrals</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-orange"/> Skill workshops, meetups, and hackathons</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <Button asChild className="bg-brand-orange hover:bg-brand-orange/90"><a href="/#mentorship">Explore Mentors</a></Button>
              <Button asChild variant="outline"><a href="/auth">Find Jobs</a></Button>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand-blue/10 to-brand-orange/10 blur-2xl" />
            <img
              src="https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1600&auto=format&fit=crop"
              alt="Students collaborating in class"
              className="relative z-10 aspect-[4/3] w-full rounded-2xl border object-cover shadow-sm"
            />
          </div>
        </Reveal>
      </div>

      {/* Benefit cards */}
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <Reveal>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-brand-blue/10 text-brand-blue"><GraduationCap className="h-5 w-5"/></div>
            <h3 className="text-lg font-semibold">Mentorship Pathways</h3>
            <p className="mt-1 text-sm text-muted-foreground">Match with alumni by domain, role, or location.</p>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-brand-blue/10 text-brand-blue"><Briefcase className="h-5 w-5"/></div>
            <h3 className="text-lg font-semibold">Jobs & Internships</h3>
            <p className="mt-1 text-sm text-muted-foreground">Get referrals and access exclusive openings.</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-brand-blue/10 text-brand-blue"><CalendarDays className="h-5 w-5"/></div>
            <h3 className="text-lg font-semibold">Events & Workshops</h3>
            <p className="mt-1 text-sm text-muted-foreground">Attend talks, meetups, and hands-on sessions.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

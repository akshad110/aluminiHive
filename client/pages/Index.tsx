import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Reveal from "@/components/animations/Reveal";
import { CheckCircle2, Briefcase, GraduationCap, CalendarDays } from "lucide-react";

const heroImages = [
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1604881987922-8065d02f0f30?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517520287167-4bbf64a00d66?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1627556704021-b43f7a21d8b7?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=1600&auto=format&fit=crop",
];

const highlights = [
  { image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop", title: "Mentor Match", desc: "Alumni guiding students with 1:1 mentorship." },
  { image: "https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=1600&auto=format&fit=crop", title: "Career Launch", desc: "Job referrals, interview prep, and insider hiring tips." },
  { image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1600&auto=format&fit=crop", title: "Founder Stories", desc: "Entrepreneurs sharing journeys, pivots, and lessons." },
  { image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1600&auto=format&fit=crop", title: "Global Chapters", desc: "Meetups and chapters connecting alumni worldwide." },
  { image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop", title: "Give Back", desc: "Scholarships, volunteering, and community impact." },
  { image: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1600&auto=format&fit=crop", title: "Campus Memories", desc: "Reunions celebrating lifelong friendships and moments." },
];

export default function Index() {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);

  useEffect(() => {
    if (!carouselApi) return;
    const id = setInterval(() => {
      if (dir === 1) {
        if (carouselApi.canScrollNext()) carouselApi.scrollNext();
        else {
          setDir(-1);
          if (carouselApi.canScrollPrev()) carouselApi.scrollPrev();
        }
      } else {
        if (carouselApi.canScrollPrev()) carouselApi.scrollPrev();
        else {
          setDir(1);
          if (carouselApi.canScrollNext()) carouselApi.scrollNext();
        }
      }
    }, 3500);
    return () => clearInterval(id);
  }, [carouselApi, dir]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[92dvh] overflow-hidden bg-white">
        {/* Big Alumni Hero Image */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <motion.img
            src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=2400&auto=format&fit=crop"
            alt="Alumni wearing graduation caps"
            className="absolute inset-0 h-full w-full object-cover brightness-75 contrast-110 saturate-110"
            initial={{ scale: 1.06, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            loading="eager"
          />
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/40 via-transparent to-brand-orange/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.45)_100%)]" />
        </div>

        <div className="container relative z-10 mx-auto flex min-h-[92dvh] flex-col items-center justify-center py-16 text-center">
          <Reveal>
            <h1
              style={{ fontFamily: "Montserrat" }}
              className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-primary md:text-6xl"
            >
              Welcome to AluminiHive – Connecting Generations.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-3xl text-balance text-lg text-muted-foreground md:text-xl">
              Mentorship, Jobs, Networking, and Alumni Engagement in One Place.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-brand-orange hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/20">
                <a href="/auth">Join Now</a>
              </Button>
              <Button asChild size="lg" variant="default" className="bg-primary hover:bg-primary/90">
                <a href="#about">Learn More</a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Alumni Carousel */}
      <section className="container mx-auto py-10 md:py-16">
        <Reveal>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-semibold text-primary md:text-3xl" style={{fontFamily:'Montserrat'}}>Alumni Highlights</h2>
            <p className="text-sm text-muted-foreground">Stories from our vibrant community</p>
          </div>
        </Reveal>
        <Carousel opts={{ align: "start", loop: false }} setApi={(api)=>setCarouselApi(api)}>
          <CarouselContent>
            {highlights.map((item, idx) => (
              <CarouselItem key={idx} className="basis-11/12 sm:basis-1/2 lg:basis-1/3">
                <motion.div className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md" whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="disabled:opacity-0 disabled:scale-95" />
          <CarouselNext className="disabled:opacity-0 disabled:scale-95" />
        </Carousel>
      </section>

      {/* About */}
      <section id="about" className="scroll-mt-24 bg-white py-16">
        <div className="container grid items-center gap-8 md:grid-cols-2">
          <Reveal>
            <div>
              <h2 className="text-3xl font-bold text-primary md:text-4xl" style={{fontFamily:'Montserrat'}}>About AluminiHive</h2>
              <p className="mt-4 text-muted-foreground">
                AluminiHive unites alumni, students, and mentors in a single hub. Discover mentorship opportunities, job postings, and events while growing a supportive network.
              </p>
              <div className="mt-6 flex gap-3">
                <Button asChild className="bg-brand-orange hover:bg-brand-orange/90">
                  <a href="/auth">Get Started</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="#events">See Events</a>
                </Button>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand-blue/10 to-brand-orange/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop"
                  alt="Community"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Student Benefits */}
      <section id="benefits" className="scroll-mt-24 bg-muted/30 py-16">
        <div className="container grid items-center gap-8 md:grid-cols-2">
          <Reveal>
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand-blue/10 to-brand-orange/10 blur-2xl" />
              <img
                src="https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1600&auto=format&fit=crop"
                alt="Students collaborating in class"
                className="relative z-10 aspect-[4/3] w-full rounded-2xl border object-cover shadow-sm"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <h2 className="text-3xl font-bold text-primary md:text-4xl" style={{fontFamily:'Montserrat'}}>Student Benefits</h2>
              <p className="mt-3 text-muted-foreground">Unlock opportunities with alumni support and a powerful network.</p>
              <ul className="mt-5 space-y-3 text-sm">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-orange"/> 1:1 mentorship from experienced alumni</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-orange"/> Curated internships and job referrals</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-orange"/> Skill workshops, meetups, and hackathons</li>
              </ul>
              <div className="mt-6 flex gap-3">
                <Button asChild className="bg-brand-orange hover:bg-brand-orange/90"><a href="#mentorship">Explore Mentors</a></Button>
                <Button asChild variant="outline"><a href="/auth">Find Jobs</a></Button>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="container mt-10 grid gap-4 md:grid-cols-3">
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

      {/* Alumni */}
      <section id="alumni" className="scroll-mt-24 bg-muted/30 py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-primary md:text-4xl" style={{fontFamily:'Montserrat'}}>Alumni Network</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">Find and connect with alumni across batches, interests, and industries. Build meaningful relationships and open doors for the next generation.</p>
        </div>
      </section>

      {/* Mentorship */}
      <section id="mentorship" className="scroll-mt-24 bg-white py-16">
        <div className="container grid items-center gap-8 md:grid-cols-2">
          <Reveal>
            <div className="order-1 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop"
                alt="Mentorship"
                className="aspect-[4/3] w-full rounded-2xl object-cover shadow-sm"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="order-2 md:order-2">
              <h2 className="text-3xl font-bold text-primary md:text-4xl" style={{fontFamily:'Montserrat'}}>Mentorship Programs</h2>
              <p className="mt-4 text-muted-foreground">Pair with mentors, join cohort-based programs, and get guidance on careers, entrepreneurship, and higher studies.</p>
              <div className="mt-6">
                <Button asChild>
                  <a href="/auth">Become a Mentor</a>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Events */}
      <section id="events" className="scroll-mt-24 bg-muted/30 py-16">
        <Reveal>
          <div className="container">
            <h2 className="text-3xl font-bold text-primary md:text-4xl" style={{fontFamily:'Montserrat'}}>Events</h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">Attend reunions, webinars, and hiring fairs. Stay updated with a calendar of campus and alumni-led events.</p>
            <div className="mt-6">
              <Button variant="outline">View Calendar</Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Mail, MapPin, Phone, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";

function SiteHeader() {
  const navLink = (label: string, href: string) => (
    <a
      key={label}
      href={href}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        "text-foreground/80",
      )}
    >
      {label}
    </a>
  );

  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-white/90 backdrop-blur-md",
    )}>
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight" style={{fontFamily: 'Montserrat'}}>
            <span className="text-brand-blue">Alumini</span>
            <span className="text-brand-orange">Hive</span>
          </span>
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          {navLink("Home", "/")}
          {navLink("About", "/#about")}
          {navLink("Alumni", "/#alumni")}
          {navLink("Mentorship", "/#mentorship")}
          {navLink("Events", "/#events")}
        </nav>
        <div className="hidden md:block">
          <Button asChild className="bg-brand-orange hover:bg-brand-orange/90 shadow-sm">
            <a href="/auth">Login / Sign Up</a>
          </Button>
        </div>
        <Button asChild size="sm" className="md:hidden">
          <a href="/auth">Join</a>
        </Button>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-white">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand + blurb */}
        <div>
          <a href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight" style={{fontFamily:'Montserrat'}}>
              <span className="text-brand-blue">Alumini</span>
              <span className="text-brand-orange">Hive</span>
            </span>
          </a>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Connecting generations through mentorship, jobs, networking, and lifelong alumni engagement.
          </p>
          <div className="mt-4 flex items-center gap-3 text-muted-foreground">
            <a aria-label="LinkedIn" href="#" className="rounded-full p-2 hover:text-foreground"><Linkedin className="h-5 w-5"/></a>
            <a aria-label="Twitter" href="#" className="rounded-full p-2 hover:text-foreground"><Twitter className="h-5 w-5"/></a>
            <a aria-label="Facebook" href="#" className="rounded-full p-2 hover:text-foreground"><Facebook className="h-5 w-5"/></a>
            <a aria-label="Instagram" href="#" className="rounded-full p-2 hover:text-foreground"><Instagram className="h-5 w-5"/></a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-sm font-semibold text-foreground/80" style={{fontFamily:'Montserrat'}}>Quick Links</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li><a className="hover:text-foreground" href="#about">About</a></li>
            <li><a className="hover:text-foreground" href="#alumni">Alumni</a></li>
            <li><a className="hover:text-foreground" href="#mentorship">Mentorship</a></li>
            <li><a className="hover:text-foreground" href="#events">Events</a></li>
            <li><a className="hover:text-foreground" href="/auth">Join Now</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-sm font-semibold text-foreground/80" style={{fontFamily:'Montserrat'}}>Resources</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li><a className="hover:text-foreground" href="#">Jobs Board</a></li>
            <li><a className="hover:text-foreground" href="#">Mentor Directory</a></li>
            <li><a className="hover:text-foreground" href="#">Event Calendar</a></li>
            <li><a className="hover:text-foreground" href="#">Community Guidelines</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-sm font-semibold text-foreground/80" style={{fontFamily:'Montserrat'}}>Subscribe to updates</h3>
          <p className="mt-2 text-sm text-muted-foreground">Monthly news, upcoming events, and opportunities.</p>
          <form className="mt-4 flex max-w-md gap-2" onSubmit={(e)=>e.preventDefault()}>
            <div className="relative w-full">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" required placeholder="you@example.com" className="pl-9" />
            </div>
            <Button type="submit" className="bg-brand-orange hover:bg-brand-orange/90">Subscribe</Button>
          </form>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4"/><span>Global alumni community</span></div>
            <div className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4"/><a href="tel:+10000000000" className="hover:text-foreground">+1 (000) 000-0000</a></div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 bg-white/60">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} AlumniHive. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

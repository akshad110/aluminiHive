import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SiteHeader() {
  const { pathname, hash } = useLocation();
  const onHome = pathname === "/";

  const navLink = (label: string, to: string) => (
    <Link
      key={label}
      to={to}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        "text-foreground/80",
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-50 border-b border-border/50 backdrop-blur-md",
      onHome && hash === "" ? "bg-white/70" : "bg-white/90",
    )}>
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight" style={{fontFamily: 'Montserrat'}}>
            <span className="text-brand-blue">Alumini</span>
            <span className="text-brand-orange">Hive</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navLink("Home", "/")}
          {navLink("About", "/#about")}
          {navLink("Alumni", "/#alumni")}
          {navLink("Mentorship", "/#mentorship")}
          {navLink("Events", "/#events")}
        </nav>
        <div className="hidden md:block">
          <Button asChild className="bg-brand-orange hover:bg-brand-orange/90 shadow-sm">
            <Link to="/auth">Login / Sign Up</Link>
          </Button>
        </div>
        <Button asChild size="sm" className="md:hidden">
          <Link to="/auth">Join</Link>
        </Button>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-white">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} AluminiHive. All rights reserved.</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="#about" className="hover:text-foreground">About</a>
          <a href="#events" className="hover:text-foreground">Events</a>
          <Link to="/auth" className="hover:text-foreground">Join</Link>
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

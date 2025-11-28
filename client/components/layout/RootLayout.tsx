import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Mail, MapPin, Phone, Linkedin, Twitter, Facebook, Instagram, User, LogOut, Settings, ChevronDown, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

function SiteHeader() {
  const { user, logout, isLoading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.user-dropdown')) {
        setShowDropdown(false);
      }
      if (showMobileMenu && !(event.target as Element).closest('.mobile-menu')) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown, showMobileMenu]);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    window.location.href = '/';
  };

  const handleProfileSetup = () => {
    setShowDropdown(false);
    if (user?.role === 'alumni') {
      window.location.href = '/alumni/profile-setup';
    } else if (user?.role === 'student') {
      window.location.href = '/student/profile-setup';
    }
  };

  const handleViewProfile = () => {
    setShowDropdown(false);
    if (user?.role === 'alumni') {
      window.location.href = `/alumni/${user._id}`;
    } else if (user?.role === 'student') {
      window.location.href = `/student/${user._id}`;
    }
  };

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
      "fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-white/90 backdrop-blur-md w-full",
    )}>
      <div className="container flex h-16 items-center justify-between ">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight" style={{fontFamily: 'Montserrat'}}>
            <span className="text-brand-blue">Alumni</span>
            <span className="text-brand-orange">Hive</span>
          </span>
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          {navLink("Home", "/")}
          {navLink("About", "/#about")}
          {navLink("Alumni", "/#alumni")}
          {navLink("Mentorship", "/mentorship")}
          {navLink("Batches", "/batches")}
          {user && navLink("Chat", "/chat")}
          {user?.role === "alumni" && navLink("Dashboard", "/aluminii")}
          {user?.role === "student" && navLink("Dashboard", "/student")}
        </nav>
        <div className="hidden md:block ">
          {isLoading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="relative user-dropdown">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-white font-semibold text-sm cursor-pointer">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-sm font-medium text-foreground/80">
                    {user.firstName}{user.lastName ? ` ${user.lastName}` : ''}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showDropdown && "rotate-180")} />
                </button>
                
                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-white shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={handleViewProfile}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        View Profile
                      </button>
                      <button
                        onClick={handleProfileSetup}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Setup Profile
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Button asChild className="bg-brand-orange hover:bg-brand-orange/90 shadow-sm">
              <a href="/auth">Login / Sign Up</a>
            </Button>
          )}
        </div>
        <div className="md:hidden overflow-hidden">
          {isLoading ? (
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="relative user-dropdown">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-white font-semibold text-sm cursor-pointer">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showDropdown && "rotate-180")} />
                </button>
                
                {/* Mobile Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-white shadow-lg z-50 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={handleViewProfile}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        View Profile
                      </button>
                      <button
                        onClick={handleProfileSetup}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Setup Profile
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors mobile-menu overflow-hidden"
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild size="sm">
                <a href="/auth">Join</a>
              </Button>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors mobile-menu"
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-border/50 bg-white/95 backdrop-blur-md overflow-hidden">
          <div className="container py-4 space-y-4">
            <nav className="flex flex-col space-y-3">
              {navLink("Home", "/")}
              {navLink("About", "/#about")}
              {navLink("Alumni", "/#alumni")}
              {navLink("Mentorship", "/mentorship")}
              {navLink("Batches", "/batches")}
              {user && navLink("Chat", "/chat")}
              {user?.role === "alumni" && navLink("Dashboard", "/aluminii")}
              {user?.role === "student" && navLink("Dashboard", "/student")}
            </nav>
            {!user && (
              <div className="pt-4 border-t border-border/50">
                <Button asChild className="w-full bg-brand-orange hover:bg-brand-orange/90">
                  <a href="/auth">Login / Sign Up</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-white w-full">
      <div className="container grid gap-8 py-8 sm:py-12 md:py-14 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand + blurb */}
        <div>
          <a href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight" style={{fontFamily:'Montserrat'}}>
              <span className="text-brand-blue">Alumni</span>
              <span className="text-brand-orange">Hive</span>
            </span>
          </a>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Connecting generations through mentorship, jobs, networking, and lifelong alumni engagement.
          </p>
          <div className="mt-4 flex items-center gap-3 text-muted-foreground">
            <a aria-label="LinkedIn" href="#" className="rounded-full p-2 hover:text-foreground"><Linkedin className="h-4 w-4 sm:h-5 sm:w-5"/></a>
            <a aria-label="Twitter" href="#" className="rounded-full p-2 hover:text-foreground"><Twitter className="h-4 w-4 sm:h-5 sm:w-5"/></a>
            <a aria-label="Facebook" href="#" className="rounded-full p-2 hover:text-foreground"><Facebook className="h-4 w-4 sm:h-5 sm:w-5"/></a>
            <a aria-label="Instagram" href="#" className="rounded-full p-2 hover:text-foreground"><Instagram className="h-4 w-4 sm:h-5 sm:w-5"/></a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-sm font-semibold text-foreground/80" style={{fontFamily:'Montserrat'}}>Quick Links</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li><a className="hover:text-foreground" href="#about">About</a></li>
            <li><a className="hover:text-foreground" href="#alumni">Alumni</a></li>
            <li><a className="hover:text-foreground" href="#mentorship">Mentorship</a></li>
            <li><a className="hover:text-foreground" href="/batches">Batches</a></li>
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
          <form className="mt-4 flex flex-col sm:flex-row max-w-md gap-2" onSubmit={(e)=>e.preventDefault()}>
            <div className="relative w-full">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" required placeholder="you@example.com" className="pl-9" />
            </div>
            <Button type="submit" className="bg-brand-orange hover:bg-brand-orange/90 w-full sm:w-auto">Subscribe</Button>
          </form>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4"/><span>Global alumni community</span></div>
            <div className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4"/><a href="tel:+10000000000" className="hover:text-foreground">+1 (000) 000-0000</a></div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 bg-white/60">
        <div className="container flex flex-col items-center justify-between gap-4 py-4 sm:py-6 text-sm text-muted-foreground sm:flex-row">
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
    <div className="flex min-h-dvh flex-col w-full">
      <SiteHeader />
      <main className="flex-1 pt-16 w-full">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

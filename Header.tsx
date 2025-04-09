"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MoonIcon, SunIcon, MenuIcon, XIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import type { UserRole } from "@/lib/auth"; // We can still use the type

// Mock user state since we don't have full auth context
type User = {
  name: string;
  role: UserRole;
  email: string;
  profileImage?: string;
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Mock auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize mock auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Mock login function - will be used for demo login
  const handleMockLogin = (role: UserRole) => {
    const mockUsers = {
      client: {
        name: "Client User",
        role: "client" as UserRole,
        email: "client@example.com",
        profileImage: 'https://ui-avatars.com/api/?name=Client+User&background=0D8ABC&color=fff'
      },
      expert: {
        name: "Dr. Sarah Johnson",
        role: "expert" as UserRole,
        email: "expert@example.com",
        profileImage: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=8A2BE2&color=fff'
      },
      admin: {
        name: "Admin User",
        role: "admin" as UserRole,
        email: "admin@example.com",
        profileImage: 'https://ui-avatars.com/api/?name=Admin+User&background=FF5733&color=fff'
      }
    };

    const selectedUser = mockUsers[role];
    setUser(selectedUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(selectedUser));

    // Redirect to the correct dashboard
    if (role === 'admin') {
      router.push('/admin');
    } else if (role === 'expert') {
      router.push('/expert');
    } else {
      router.push('/dashboard');
    }
  };

  // Mock logout
  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    router.push('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold">ConsultPro</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Home
          </Link>
          <Link
            href="/services"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/services") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Services
          </Link>
          <Link
            href="/experts"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/experts") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Experts
          </Link>

          {isAuthenticated && user?.role === 'client' && (
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Dashboard
            </Link>
          )}

          {isAuthenticated && user?.role === 'expert' && (
            <Link
              href="/expert"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/expert") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Expert Portal
            </Link>
          )}

          {isAuthenticated && user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/admin") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Admin
            </Link>
          )}

          {isAuthenticated && (
            <Link
              href="/whiteboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/whiteboard") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Whiteboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>

          {!isAuthenticated ? (
            <div className="hidden md:flex items-center gap-4">
              {/* Mock login buttons for quick testing */}
              <div className="hidden md:flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleMockLogin('client')}>
                  Client Login
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleMockLogin('expert')}>
                  Expert Login
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleMockLogin('admin')}>
                  Admin Login
                </Button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm font-medium">
                {user?.name} ({user?.role})
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="md:hidden p-4 pt-0 border-b border-border/40 bg-background">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/services"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/services") ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="/experts"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/experts") ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Experts
            </Link>

            {isAuthenticated && user?.role === 'client' && (
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}

            {isAuthenticated && user?.role === 'expert' && (
              <Link
                href="/expert"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/expert") ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Expert Portal
              </Link>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <Link
                href="/admin"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/admin") ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            )}

            {isAuthenticated && (
              <Link
                href="/whiteboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/whiteboard") ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Whiteboard
              </Link>
            )}

            <div className="pt-4 flex flex-col space-y-2">
              {!isAuthenticated ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleMockLogin('client')}>
                    Client Login
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleMockLogin('expert')}>
                    Expert Login
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleMockLogin('admin')}>
                    Admin Login
                  </Button>
                </>
              ) : (
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

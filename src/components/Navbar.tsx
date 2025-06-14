import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { CartSheet } from "@/components/cart-sheet";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
import { memo, useCallback, useRef } from 'react';
import { useAppSettings } from '@/context/AppSettingsContext';
import { motion, AnimatePresence } from "framer-motion";

// Create a constant animated component that only mounts once
const StaticAnimatedLogo = memo(({ appName }: { appName: string }) => {
  const hasAnimated = useRef(false);

  if (hasAnimated.current) {
    return (
      <div className="font-bold text-2xl text-foreground w-[100px]">
        <Link to="/">{appName}</Link>
      </div>
    );
  }

  hasAnimated.current = true;

  return (
    <AnimatePresence>
      <motion.div
        key="logo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="font-bold text-2xl text-foreground w-[100px]"
      >
        <Link to="/">{appName}</Link>
      </motion.div>
    </AnimatePresence>
  );
});

// Memoized Navigation Links with useCallback
const NavigationLinks = memo(() => {
  const navLinks = useCallback(() => (
    <div className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
      <Link to="/" className="text-foreground hover:text-primary transition">Home</Link>
      <Link to="/menu" className="text-foreground hover:text-primary transition">Menu</Link>
      <Link to="/about" className="text-foreground hover:text-primary transition">About</Link>
      <Link to="/contact" className="text-foreground hover:text-primary transition">Contact</Link>
    </div>
  ), []);

  return navLinks();
});

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { settings } = useAppSettings();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  return (
    <nav className="border-b bg-background/50 backdrop-blur-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <StaticAnimatedLogo appName={settings.appName} />
        <NavigationLinks />

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex space-x-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="secondary" 
                    className="flex items-center space-x-2 text-foreground"
                  >
                    <User className="h-4 w-4 text-foreground" />
                    <span className="font-medium">Hi, {user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end"
                  className="w-48"
                >
                  {user?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="text-foreground cursor-pointer">
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-foreground cursor-pointer"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="secondary" asChild>
                <Link to="/login" className="text-foreground flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Account</span>
                </Link>
              </Button>
            )}
          </div>
          <ModeToggle />
          <CartSheet />
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="bg-background w-[250px] sm:w-[300px] text-foreground"
            >
              <div className="flex flex-col space-y-6 mt-8">
                <h2 className="text-lg font-semibold text-foreground px-4">Menu</h2>
                <nav className="flex flex-col space-y-4">
                  <a href="/" className="text-foreground hover:text-primary transition px-4 py-2 hover:bg-muted rounded-lg">
                    Home
                  </a>
                  <a href="/menu" className="text-foreground hover:text-primary transition px-4 py-2 hover:bg-muted rounded-lg">
                    Menu
                  </a>
                  <a href="/about" className="text-foreground hover:text-primary transition px-4 py-2 hover:bg-muted rounded-lg">
                    About
                  </a>
                  <a href="/contact" className="text-foreground hover:text-primary transition px-4 py-2 hover:bg-muted rounded-lg">
                    Contact
                  </a>
                  <div className="border-t pt-4 px-4 flex flex-col space-y-2">
                    {isAuthenticated ? (
                      <Button 
                        variant="outline" 
                        className="justify-start"
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    ) : (
                      <Button variant="secondary" asChild className="justify-start">
                        <Link to="/login">
                          <User className="h-4 w-4 mr-2" />
                          Account
                        </Link>
                      </Button>
                    )}
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

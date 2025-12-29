'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LogIn, Moon, Sun, Search, User, Loader2, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from '@/lib/context/SearchContext';
import { useSession } from '@/lib/hooks/useSession';
import { usePathname } from 'next/navigation';

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    className={className}
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.593 13.593 0 0 0-1.057 2.175 19.554 19.554 0 0 0-4.596 0 13.593 13.593 0 0 0-1.057-2.175.074.074 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.076.076 0 0 0-.04.106 14.155 14.155 0 0 0 1.225 1.994.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
  </svg>
);

const Logo = () => (
  <Link href="/" className="flex items-center space-x-2">
    <Image 
      src="/logo-light.svg" 
      alt="GraphIt! Logo" 
      width={40} 
      height={40} 
      className="dark:hidden squircle"
    />
    <Image 
      src="/logo-dark.svg" 
      alt="GraphIt! Logo" 
      width={40} 
      height={40} 
      className="hidden dark:block squircle"
    />
    <span className="font-bold text-xl text-text hidden md:inline">GraphIt!</span>
  </Link>
);

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-10 w-10 bg-neutral/50 rounded-[var(--border-radius-apple)] animate-pulse" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="relative overflow-hidden w-10 h-10"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? 'sun' : 'moon'}
          initial={{ opacity: 0, y: isDark ? 10 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: isDark ? -10 : 10 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          )}
        </motion.div>
      </AnimatePresence>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

const AccountButton = () => {
    const { session, isLoading } = useSession();

    if (isLoading) {
        return <Button disabled className="w-[105px]"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</Button>;
    }

    if (session?.isLoggedIn) {
        return (
            <Link href="/account">
                <Button>
                    <User className="mr-2 h-4 w-4" /> {session.username}
                </Button>
            </Link>
        );
    }
    
    return (
        <Link href="/login">
            <Button>
                <LogIn className="mr-2 h-4 w-4" /> Login
            </Button>
        </Link>
    );
};

const Navbar = () => {
  const { openSearch } = useSearch();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-neutral/80 backdrop-blur-sm border-b border-neutral-dark/50">
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-2 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-6">
          <Logo />
          <div className="hidden sm:flex items-center space-x-6">
            <Link href="/topics" className="text-sm font-medium text-text/80 hover:text-accent transition-colors">Start Studying</Link>
            <Link href="/graphs" className="text-sm font-medium text-text/80 hover:text-accent transition-colors">General Graphs</Link>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" className="hidden md:flex items-center justify-start gap-2 text-text/60 hover:text-text w-64" onClick={openSearch}>
            <Search className="h-4 w-4" /> Search...
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={openSearch}>
            <Search className="h-5 w-5" />
          </Button>
          
          <Link href="https://discord.gg/4huAb5ZJ9H" target="_blank" rel="noopener noreferrer" aria-label="Join our Discord">
            <Button variant="ghost" size="icon" className="w-10 h-10 text-text/60 hover:text-[#5865F2] hover:bg-neutral">
                <DiscordIcon className="h-5 w-5" />
            </Button>
          </Link>

          <ThemeToggle />
          
          <div className="hidden sm:block">
            <AccountButton />
          </div>
          <div className="sm:hidden">
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative overflow-hidden w-10 h-10"
                aria-label="Toggle mobile menu"
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={isMobileMenuOpen ? 'close' : 'open'}
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </motion.div>
                </AnimatePresence>
             </Button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="sm:hidden overflow-hidden"
            >
                <div className="flex flex-col space-y-2 p-4 border-t border-neutral-dark/30">
                    <Link href="/topics" className="block p-3 rounded-lg hover:bg-neutral font-medium">Start Studying</Link>
                    <Link href="/graphs" className="block p-3 rounded-lg hover:bg-neutral font-medium">General Graphs</Link>
                    <div className="pt-2 border-t border-neutral-dark/30">
                        <AccountButton />
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
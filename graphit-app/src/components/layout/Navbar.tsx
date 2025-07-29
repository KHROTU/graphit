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
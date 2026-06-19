'use client';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useState, useEffect } from 'react';
export default function AccountSettingsPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const renderThemeButtons = () => {
        if (!mounted) {
            return (
                <>
                    <div className="h-10 w-24 bg-neutral-dark/50 rounded-[var(--border-radius-apple)] animate-pulse" />
                    <div className="h-10 w-24 bg-neutral-dark/50 rounded-[var(--border-radius-apple)] animate-pulse" />
                    <div className="h-10 w-28 bg-neutral-dark/50 rounded-[var(--border-radius-apple)] animate-pulse" />
                </>
            );
        }
        return (
            <>
                <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}><Sun className="mr-2 h-4 w-4"/> Light</Button>
                <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}><Moon className="mr-2 h-4 w-4"/> Dark</Button>
                <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')}><Laptop className="mr-2 h-4 w-4"/> System</Button>
            </>
        );
    };
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader><CardTitle>Theme Preference</CardTitle></CardHeader>
                <div className="p-6 flex gap-2">
                    {renderThemeButtons()}
                </div>
            </Card>
            <Card>
                <CardHeader><CardTitle>About</CardTitle></CardHeader>
                <div className="p-6 space-y-2 text-sm text-text/70">
                    <p>All your data is stored locally in your browser. Nothing is ever sent to a server.</p>
                    <p>Saved graphs, ratings, and preferences are kept in localStorage.</p>
                </div>
            </Card>
        </div>
    );
}
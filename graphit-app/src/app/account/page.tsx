'use client';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';

export default function AccountSettingsPage() {
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const { refetchSession } = useSession();
    
    const [mounted, setMounted] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteMessage, setDeleteMessage] = useState({ type: '', text: '' });
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        if (newPassword.length < 6) {
             setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
            return;
        }

        setIsPasswordLoading(true);
        try {
            const res = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            } else {
                setPasswordMessage({ type: 'error', text: data.error || 'An error occurred.' });
            }
        } catch {
            setPasswordMessage({ type: 'error', text: 'Failed to connect to server.' });
        } finally {
            setIsPasswordLoading(false);
            setTimeout(() => setPasswordMessage({ type: '', text: '' }), 4000);
        }
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setDeleteMessage({ type: '', text: '' });
        setIsDeleteLoading(true);

        try {
            const res = await fetch('/api/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword })
            });
            const data = await res.json();
            if (res.ok) {
                setDeleteMessage({ type: 'success', text: 'Account deleted. Redirecting...' });
                await refetchSession();
                router.push('/');
            } else {
                setDeleteMessage({ type: 'error', text: data.error || 'An error occurred.' });
            }
        } catch {
            setDeleteMessage({ type: 'error', text: 'Failed to connect to server.' });
        } finally {
            setIsDeleteLoading(false);
        }
    };

    const Message = ({ type, text }: { type: string, text: string }) => {
        if (!text) return null;
        const color = type === 'success' ? 'text-green-600' : 'text-secondary';
        return <p className={`text-sm ${color}`}>{text}</p>
    }

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
        )
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader><CardTitle>Theme Preference</CardTitle></CardHeader>
                <div className="p-6 flex gap-2">
                    {renderThemeButtons()}
                </div>
            </Card>

            <Card>
                <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                    <div className="space-y-2"><Label htmlFor="current-pass">Current Password</Label><Input id="current-pass" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /></div>
                    <div className="space-y-2"><Label htmlFor="new-pass">New Password</Label><Input id="new-pass" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required /></div>
                    <div className="space-y-2"><Label htmlFor="confirm-pass">Confirm New Password</Label><Input id="confirm-pass" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
                    <Message {...passwordMessage} />
                    <Button type="submit" disabled={isPasswordLoading}>{isPasswordLoading ? 'Changing...' : 'Change Password'}</Button>
                </form>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-secondary">Danger Zone</CardTitle></CardHeader>
                <div className="p-6">
                    {isDeleteDialogOpen ? (
                        <form onSubmit={handleDeleteAccount} className="space-y-4 p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
                            <p className="font-bold">Are you sure?</p>
                            <p className="text-sm">This action is irreversible. All your saved graphs will be permanently deleted. Please enter your password to confirm.</p>
                            <div className="space-y-2"><Label htmlFor="delete-pass">Password</Label><Input id="delete-pass" type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} required autoFocus/></div>
                            <Message {...deleteMessage} />
                            <div className="flex gap-2">
                                <Button type="submit" variant="destructive" disabled={isDeleteLoading}>{isDeleteLoading ? 'Deleting...' : 'Delete My Account'}</Button>
                                <Button type="button" variant="ghost" onClick={() => {setIsDeleteDialogOpen(false); setDeleteMessage({type:'', text:''});}}>Cancel</Button>
                            </div>
                        </form>
                    ) : (
                        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>Delete Account</Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
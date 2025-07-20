'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refetchSession } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/login' : '/api/signup';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          await refetchSession();
          router.push('/account');
        } else {
          setIsLogin(true); 
          setUsername('');
          setPassword('');
          setError('Signup successful! Please log in to continue.');
        }
      } else {
        setError(data.error || 'An unexpected error occurred.');
      }
    } catch {
      setError('Failed to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{isLogin ? 'Log In' : 'Sign Up'}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={isLogin ? "current-password" : "new-password"} />
          </div>
          {error && <p className={`text-sm ${error.includes('successful') ? 'text-green-600' : 'text-secondary'}`}>{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </Button>
          <p className="text-center text-sm text-text/70">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <Button variant="link" type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="pl-1">
              {isLogin ? 'Sign up' : 'Log in'}
            </Button>
          </p>
        </form>
      </Card>
    </div>
  );
}
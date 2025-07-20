'use client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Settings, Image as ImageIcon, LogOut } from 'lucide-react';
import { useSession } from '@/lib/hooks/useSession';

export default function AccountNav({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { refetchSession } = useSession();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'GET' });
    await refetchSession();
    router.push('/');
  };

  const navItems = [
    { href: '/account', label: 'Settings', icon: Settings },
    { href: '/account/saved', label: 'Saved Graphs', icon: ImageIcon },
  ];

  return (
    <Card>
      <div className="p-4 border-b border-neutral-dark/30">
        <p className="font-bold text-lg">{username}</p>
        <p className="text-sm text-text/60">Manage your account</p>
      </div>
      <div className="p-2 space-y-1">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={pathname === item.href ? 'default' : 'ghost'}
              className="w-full justify-start"
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
      <div className="p-2 border-t border-neutral-dark/30">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4 text-secondary"/>
          Log Out
        </Button>
      </div>
    </Card>
  );
}
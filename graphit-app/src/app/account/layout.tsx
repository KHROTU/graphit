import { ReactNode } from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AccountNav from './AccountNav';

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect('/login');
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8">
      <div className="md:col-span-1">
        <AccountNav username={session.username!} />
      </div>
      <div className="md:col-span-3">
        {children}
      </div>
    </div>
  );
}
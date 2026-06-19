import { ReactNode } from 'react';
import Link from 'next/link';
import { Bookmark, Palette } from 'lucide-react';
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8">
      <div className="md:col-span-1">
        <nav className="space-y-1">
          <Link
            href="/account/saved"
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--border-radius-apple)] hover:bg-neutral/50 transition-colors text-sm font-medium"
          >
            <Bookmark className="h-4 w-4" /> Saved Graphs
          </Link>
          <Link
            href="/account"
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--border-radius-apple)] hover:bg-neutral/50 transition-colors text-sm font-medium"
          >
            <Palette className="h-4 w-4" /> Appearance
          </Link>
        </nav>
      </div>
      <div className="md:col-span-3">
        {children}
      </div>
    </div>
  );
}
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Target,
  ExternalLink,
  Megaphone,
  Users,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/auth-client';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Headlines', href: '/admin/headlines', icon: FileText },
  { name: 'Indications', href: '/admin/indications', icon: Target },
  { name: 'Landing Pages', href: '/admin/landing-pages', icon: ExternalLink },
  { name: 'Ads', href: '/admin/ads', icon: Megaphone },
  { name: 'Users', href: '/admin/users', icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-primary/10 text-primary font-medium'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Link href="/" className="block">
          <Button variant="outline" className="w-full justify-start gap-3">
            <ChevronLeft className="h-4 w-4" />
            Back to Site
          </Button>
        </Link>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={async () => {
            await signOut();
            window.location.href = '/';
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
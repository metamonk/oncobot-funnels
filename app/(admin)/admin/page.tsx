import { Card } from '@/components/ui/card';
import { getCurrentUserWithRole } from '@/lib/auth-utils';
import {
  FileText,
  MousePointerClick,
  Megaphone,
  Users,
  Activity,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

const stats = [
  {
    title: 'Headlines',
    value: '0',
    change: '+0%',
    icon: FileText,
    href: '/admin/headlines',
  },
  {
    title: 'Indications',
    value: '5',
    change: 'Active',
    icon: MousePointerClick,
    href: '/admin/indications',
  },
  {
    title: 'Landing Pages',
    value: '4',
    change: 'Active',
    icon: Megaphone,
    href: '/admin/landing-pages',
  },
  {
    title: 'Total Users',
    value: '0',
    change: '+0%',
    icon: Users,
    href: '/admin/users',
  },
];

export default async function AdminDashboard() {
  const user = await getCurrentUserWithRole();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.name || 'Admin'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Activity Chart Placeholder */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </div>
        <div className="h-64 bg-accent/20 rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Activity chart coming soon</p>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/admin/headlines/new"
              className="block p-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-center"
            >
              Create New Headline
            </Link>
            <Link
              href="/admin/indications"
              className="block p-3 rounded-md bg-primary/10 hover:bg-primary/20 text-center"
            >
              Manage Indications
            </Link>
            <Link
              href="/admin/landing-pages"
              className="block p-3 rounded-md bg-primary/10 hover:bg-primary/20 text-center"
            >
              Manage Landing Pages
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Database</span>
              <span className="text-sm text-green-600">Healthy</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">API</span>
              <span className="text-sm text-green-600">Operational</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cache</span>
              <span className="text-sm text-green-600">Active</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent Changes</h3>
          <p className="text-sm text-muted-foreground">
            No recent changes to display
          </p>
        </Card>
      </div>
    </div>
  );
}
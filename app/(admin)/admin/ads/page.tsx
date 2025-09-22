import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, DollarSign, Target } from 'lucide-react';
import Link from 'next/link';

export default function AdsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ad Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Manage your advertising campaigns and creatives
          </p>
        </div>
        <Link href="/admin/ads/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Campaigns</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spend</p>
              <p className="text-2xl font-bold">$0</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Campaigns list */}
      <Card className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first ad campaign to start driving traffic
          </p>
          <Link href="/admin/ads/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
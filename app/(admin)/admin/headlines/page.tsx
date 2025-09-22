import { db } from '@/lib/db/drizzle';
import { adHeadlines, indications, landingPages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

async function getHeadlines() {
  const headlines = await db
    .select({
      id: adHeadlines.id,
      headline: adHeadlines.headline,
      longHeadline: adHeadlines.longHeadline,
      description: adHeadlines.description,
      isActive: adHeadlines.isActive,
      category: adHeadlines.category,
      clicks: adHeadlines.clicks,
      conversions: adHeadlines.conversions,
      indication: {
        id: indications.id,
        name: indications.name,
        slug: indications.slug,
      },
      landingPage: {
        id: landingPages.id,
        name: landingPages.name,
        path: landingPages.path,
      },
    })
    .from(adHeadlines)
    .leftJoin(indications, eq(adHeadlines.indicationId, indications.id))
    .leftJoin(landingPages, eq(adHeadlines.landingPageId, landingPages.id))
    .orderBy(adHeadlines.createdAt);

  return headlines;
}

async function getStats() {
  const totalHeadlines = await db.select().from(adHeadlines);
  const activeHeadlines = totalHeadlines.filter(h => h.isActive);
  const totalClicks = totalHeadlines.reduce((sum, h) => sum + h.clicks, 0);
  const totalConversions = totalHeadlines.reduce((sum, h) => sum + h.conversions, 0);

  return {
    total: totalHeadlines.length,
    active: activeHeadlines.length,
    clicks: totalClicks,
    conversions: totalConversions,
  };
}

export default async function HeadlinesPage() {
  const headlines = await getHeadlines();
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Headlines</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Google Ads headlines and landing page copy
          </p>
        </div>
        <Link href="/admin/headlines/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Headline
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Headlines</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Edit2 className="h-4 w-4 text-primary" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
              <p className="text-2xl font-bold">{stats.clicks.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold">{stats.conversions.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Headlines Table */}
      {headlines.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No headlines yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first headline to start generating Google Ads copy
            </p>
            <Link href="/admin/headlines/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Headline
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Indication</th>
                  <th className="text-left p-4 font-medium">Headline</th>
                  <th className="text-left p-4 font-medium">Landing Page</th>
                  <th className="text-left p-4 font-medium">Performance</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {headlines.map((headline) => (
                  <tr key={headline.id} className="border-b hover:bg-muted/25 transition-colors">
                    <td className="p-4">
                      <Badge
                        variant={headline.isActive ? "default" : "secondary"}
                        className={headline.isActive ? "bg-green-600" : ""}
                      >
                        {headline.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{headline.indication?.name || 'N/A'}</span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{headline.headline}</p>
                        <p className="text-xs text-muted-foreground">
                          {headline.longHeadline.substring(0, 40)}...
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{headline.landingPage?.name || 'N/A'}</span>
                        {headline.landingPage && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Clicks:</span> {headline.clicks}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Conv:</span> {headline.conversions}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/headlines/${headline.id}`}>
                          <Button variant="ghost" size="icon">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/headlines/${headline.id}/copy`}>
                          <Button variant="ghost" size="icon">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
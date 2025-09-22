import { db } from '@/lib/db/drizzle';
import { landingPages, adHeadlines } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Activity, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

async function getLandingPagesWithCounts() {
  const allPages = await db.select().from(landingPages).orderBy(landingPages.name);
  const headlines = await db.select().from(adHeadlines);

  return allPages.map(page => {
    const headlineCount = headlines.filter(h => h.landingPageId === page.id).length;
    return {
      ...page,
      headlineCount,
    };
  });
}

export default async function LandingPagesPage() {
  const pagesWithCounts = await getLandingPagesWithCounts();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Landing Pages</h1>
          <p className="text-muted-foreground mt-2">
            Available landing page destinations for your ads
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pagesWithCounts.map((page) => (
          <Card key={page.id} className="p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{page.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{page.path}</code>
                  <Link href={page.path} target="_blank">
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Link>
                </div>
              </div>
              <Badge variant={page.isActive ? "default" : "secondary"}>
                {page.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {page.description && (
              <p className="text-sm text-muted-foreground mb-3">{page.description}</p>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Activity className="h-4 w-4" />
              <span>{page.headlineCount} headlines using this page</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                disabled={page.headlineCount > 0}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>

            {page.headlineCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Cannot delete - has associated headlines
              </p>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ExternalLink className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Landing Page Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Landing pages are pre-configured. Contact development to add new pages.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
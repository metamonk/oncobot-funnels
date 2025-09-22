import { db } from '@/lib/db/drizzle';
import { indications, adHeadlines } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Plus, Edit2, Trash2 } from 'lucide-react';

async function getIndicationsWithCounts() {
  const allIndications = await db.select().from(indications).orderBy(indications.name);
  const headlines = await db.select().from(adHeadlines);

  return allIndications.map(indication => {
    const headlineCount = headlines.filter(h => h.indicationId === indication.id).length;
    return {
      ...indication,
      headlineCount,
    };
  });
}

export default async function IndicationsPage() {
  const indicationsWithCounts = await getIndicationsWithCounts();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Indications</h1>
          <p className="text-muted-foreground mt-2">
            Manage cancer types and conditions for your campaigns
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicationsWithCounts.map((indication) => (
          <Card key={indication.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{indication.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Slug: {indication.slug}
                </p>
              </div>
              <Badge variant={indication.isActive ? "default" : "secondary"}>
                {indication.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Activity className="h-4 w-4" />
              <span>{indication.headlineCount} headlines</span>
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
                disabled={indication.headlineCount > 0}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>

            {indication.headlineCount > 0 && (
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
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Add New Indication</h3>
            <p className="text-sm text-muted-foreground">
              Contact development team to add new cancer types
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MousePointerClick } from 'lucide-react';
import Link from 'next/link';

export default function HooksPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hooks</h1>
          <p className="text-muted-foreground mt-2">
            Create compelling hooks to capture attention
          </p>
        </div>
        <Link href="/admin/hooks/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Hook
          </Button>
        </Link>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MousePointerClick className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Problem-Agitate</p>
              <p className="text-sm text-muted-foreground">0 hooks</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MousePointerClick className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Curiosity Gap</p>
              <p className="text-sm text-muted-foreground">0 hooks</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MousePointerClick className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Social Proof</p>
              <p className="text-sm text-muted-foreground">0 hooks</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Hooks list */}
      <Card className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No hooks yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first hook to engage your audience
          </p>
          <Link href="/admin/hooks/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Hook
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
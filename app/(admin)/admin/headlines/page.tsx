import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function HeadlinesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Headlines</h1>
          <p className="text-muted-foreground mt-2">
            Manage your marketing headlines and variations
          </p>
        </div>
        <Link href="/admin/headlines/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Headline
          </Button>
        </Link>
      </div>

      {/* Search and filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search headlines..."
              className="w-full pl-10 pr-3 py-2 border rounded-md"
            />
          </div>
          <Button variant="outline">Filter</Button>
        </div>
      </Card>

      {/* Headlines list */}
      <Card className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No headlines yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first headline to get started
          </p>
          <Link href="/admin/headlines/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Headline
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
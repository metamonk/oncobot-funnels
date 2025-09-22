import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Shield, Search } from 'lucide-react';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';

export default async function UsersPage() {
  // Fetch all users from database
  const users = await db.select().from(user);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{users.length} total users</span>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-3 py-2 border rounded-md"
            />
          </div>
          <Button variant="outline">Filter</Button>
        </div>
      </Card>

      {/* Users list */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="px-6 py-3 text-sm font-medium">User</th>
                <th className="px-6 py-3 text-sm font-medium">Email</th>
                <th className="px-6 py-3 text-sm font-medium">Role</th>
                <th className="px-6 py-3 text-sm font-medium">Joined</th>
                <th className="px-6 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-accent/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.image ? (
                          <img
                            src={u.image}
                            alt={u.name}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.role === 'admin' ? (
                        <Badge className="bg-primary/10 text-primary">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
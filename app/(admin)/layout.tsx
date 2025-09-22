import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-utils';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const adminStatus = await isAdmin();

  if (!adminStatus) {
    redirect('/');
  }

  return <>{children}</>;
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { landingPages } from '@/lib/db/schema';
import { getCurrentUserWithRole } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserWithRole();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allLandingPages = await db.select().from(landingPages).orderBy(landingPages.name);
    return NextResponse.json(allLandingPages);
  } catch (error) {
    console.error('Error fetching landing pages:', error);
    return NextResponse.json({ error: 'Failed to fetch landing pages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserWithRole();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, path, description, isActive = true } = body;

    if (!name || !path) {
      return NextResponse.json({ error: 'Name and path are required' }, { status: 400 });
    }

    // Check if path already exists
    const existing = await db
      .select()
      .from(landingPages)
      .where(eq(landingPages.path, path))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Path already exists' }, { status: 400 });
    }

    const newLandingPage = await db
      .insert(landingPages)
      .values({
        name,
        path,
        description: description || null,
        isActive,
      })
      .returning();

    return NextResponse.json(newLandingPage[0]);
  } catch (error) {
    console.error('Error creating landing page:', error);
    return NextResponse.json({ error: 'Failed to create landing page' }, { status: 500 });
  }
}
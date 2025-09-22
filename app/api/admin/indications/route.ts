import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { indications } from '@/lib/db/schema';
import { getCurrentUserWithRole } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserWithRole();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allIndications = await db.select().from(indications).orderBy(indications.name);
    return NextResponse.json(allIndications);
  } catch (error) {
    console.error('Error fetching indications:', error);
    return NextResponse.json({ error: 'Failed to fetch indications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserWithRole();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const newIndication = await db
      .insert(indications)
      .values({
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        isActive: true,
      })
      .returning();

    return NextResponse.json(newIndication[0]);
  } catch (error) {
    console.error('Error creating indication:', error);
    return NextResponse.json({ error: 'Failed to create indication' }, { status: 500 });
  }
}
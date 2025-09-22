import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { adHeadlines } from '@/lib/db/schema';
import { getCurrentUserWithRole } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserWithRole();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const headlines = await db.select().from(adHeadlines);
    return NextResponse.json(headlines);
  } catch (error) {
    console.error('Error fetching headlines:', error);
    return NextResponse.json({ error: 'Failed to fetch headlines' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserWithRole();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      headline,
      longHeadline,
      description,
      indicationId,
      landingPageId,
      category,
    } = body;

    // Validate character limits
    if (headline.length > 30) {
      return NextResponse.json({ error: 'Headline exceeds 30 characters' }, { status: 400 });
    }
    if (longHeadline.length > 90) {
      return NextResponse.json({ error: 'Long headline exceeds 90 characters' }, { status: 400 });
    }
    if (description.length > 90) {
      return NextResponse.json({ error: 'Description exceeds 90 characters' }, { status: 400 });
    }

    const newHeadline = await db
      .insert(adHeadlines)
      .values({
        headline,
        longHeadline,
        description,
        indicationId,
        landingPageId,
        category: category || null,
        isActive: false,
      })
      .returning();

    return NextResponse.json(newHeadline[0]);
  } catch (error) {
    console.error('Error creating headline:', error);
    return NextResponse.json({ error: 'Failed to create headline' }, { status: 500 });
  }
}
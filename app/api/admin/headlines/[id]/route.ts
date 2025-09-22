import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { adHeadlines } from '@/lib/db/schema';
import { getCurrentUserWithRole } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithRole();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const headline = await db
      .select()
      .from(adHeadlines)
      .where(eq(adHeadlines.id, params.id))
      .limit(1);

    if (!headline.length) {
      return NextResponse.json({ error: 'Headline not found' }, { status: 404 });
    }

    return NextResponse.json(headline[0]);
  } catch (error) {
    console.error('Error fetching headline:', error);
    return NextResponse.json({ error: 'Failed to fetch headline' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      isActive,
    } = body;

    // Validate character limits if provided
    if (headline && headline.length > 30) {
      return NextResponse.json({ error: 'Headline exceeds 30 characters' }, { status: 400 });
    }
    if (longHeadline && longHeadline.length > 90) {
      return NextResponse.json({ error: 'Long headline exceeds 90 characters' }, { status: 400 });
    }
    if (description && description.length > 90) {
      return NextResponse.json({ error: 'Description exceeds 90 characters' }, { status: 400 });
    }

    const updateData: any = {};
    if (headline !== undefined) updateData.headline = headline;
    if (longHeadline !== undefined) updateData.longHeadline = longHeadline;
    if (description !== undefined) updateData.description = description;
    if (indicationId !== undefined) updateData.indicationId = indicationId;
    if (landingPageId !== undefined) updateData.landingPageId = landingPageId;
    if (category !== undefined) updateData.category = category || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    updateData.updatedAt = new Date();

    const updated = await db
      .update(adHeadlines)
      .set(updateData)
      .where(eq(adHeadlines.id, params.id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: 'Headline not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating headline:', error);
    return NextResponse.json({ error: 'Failed to update headline' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithRole();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await db
      .delete(adHeadlines)
      .where(eq(adHeadlines.id, params.id))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: 'Headline not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting headline:', error);
    return NextResponse.json({ error: 'Failed to delete headline' }, { status: 500 });
  }
}
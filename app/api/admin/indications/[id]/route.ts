import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { indications, adHeadlines } from '@/lib/db/schema';
import { getCurrentUserWithRole } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';

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
    const { name, slug, isActive } = body;

    // Check if slug is already taken by another indication
    if (slug) {
      const existing = await db
        .select()
        .from(indications)
        .where(eq(indications.slug, slug))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== params.id) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await db
      .update(indications)
      .set(updateData)
      .where(eq(indications.id, params.id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: 'Indication not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating indication:', error);
    return NextResponse.json({ error: 'Failed to update indication' }, { status: 500 });
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

    // Check if indication has associated headlines
    const headlines = await db
      .select()
      .from(adHeadlines)
      .where(eq(adHeadlines.indicationId, params.id))
      .limit(1);

    if (headlines.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete indication with associated headlines' },
        { status: 400 }
      );
    }

    const deleted = await db
      .delete(indications)
      .where(eq(indications.id, params.id))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: 'Indication not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting indication:', error);
    return NextResponse.json({ error: 'Failed to delete indication' }, { status: 500 });
  }
}
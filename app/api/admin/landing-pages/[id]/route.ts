import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { landingPages, adHeadlines } from '@/lib/db/schema';
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
    const { name, path, description, isActive } = body;

    // Check if path is already taken by another landing page
    if (path) {
      const existing = await db
        .select()
        .from(landingPages)
        .where(eq(landingPages.path, path))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== params.id) {
        return NextResponse.json({ error: 'Path already exists' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (path !== undefined) updateData.path = path;
    if (description !== undefined) updateData.description = description || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await db
      .update(landingPages)
      .set(updateData)
      .where(eq(landingPages.id, params.id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating landing page:', error);
    return NextResponse.json({ error: 'Failed to update landing page' }, { status: 500 });
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

    // Check if landing page has associated headlines
    const headlines = await db
      .select()
      .from(adHeadlines)
      .where(eq(adHeadlines.landingPageId, params.id))
      .limit(1);

    if (headlines.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete landing page with associated headlines' },
        { status: 400 }
      );
    }

    const deleted = await db
      .delete(landingPages)
      .where(eq(landingPages.id, params.id))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting landing page:', error);
    return NextResponse.json({ error: 'Failed to delete landing page' }, { status: 500 });
  }
}
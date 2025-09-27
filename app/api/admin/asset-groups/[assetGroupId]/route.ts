import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { assetGroups, assetGroupAssets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from 'ai';

// GET single asset group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetGroupId: string }> }
) {
  try {
    const { assetGroupId } = await params;
    const assetGroup = await db
      .select()
      .from(assetGroups)
      .where(eq(assetGroups.id, assetGroupId))
      .limit(1);

    if (assetGroup.length === 0) {
      return NextResponse.json(
        { error: 'Asset group not found' },
        { status: 404 }
      );
    }

    // Get associated assets
    const assets = await db
      .select()
      .from(assetGroupAssets)
      .where(eq(assetGroupAssets.assetGroupId, assetGroupId));

    return NextResponse.json({
      ...assetGroup[0],
      assets
    });
  } catch (error) {
    console.error('Failed to fetch asset group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset group' },
      { status: 500 }
    );
  }
}

// PATCH update asset group
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assetGroupId: string }> }
) {
  try {
    const { assetGroupId } = await params;
    const body = await request.json();
    const {
      name,
      theme,
      landingPageId,
      finalUrl,
      audienceSignal,
      isActive,
      headlines
    } = body;

    // Update asset group
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (theme !== undefined) updateData.theme = theme;
    if (landingPageId !== undefined) updateData.landingPageId = landingPageId;
    if (finalUrl !== undefined) updateData.finalUrl = finalUrl;
    if (audienceSignal !== undefined) updateData.audienceSignal = audienceSignal;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = new Date();

    const updatedAssetGroup = await db
      .update(assetGroups)
      .set(updateData)
      .where(eq(assetGroups.id, assetGroupId))
      .returning();

    if (updatedAssetGroup.length === 0) {
      return NextResponse.json(
        { error: 'Asset group not found' },
        { status: 404 }
      );
    }

    // If headlines are provided, update them
    if (headlines !== undefined) {
      // Delete existing headline assets
      await db
        .delete(assetGroupAssets)
        .where(eq(assetGroupAssets.assetGroupId, assetGroupId));

      // Insert new headline assets
      if (headlines.length > 0) {
        const assetPromises = headlines.map((headlineId: string) =>
          db
            .insert(assetGroupAssets)
            .values({
              id: generateId(),
              assetGroupId: assetGroupId,
              assetType: 'headline',
              assetId: headlineId,
              isActive: true,
            })
            .returning()
        );

        await Promise.all(assetPromises);
      }
    }

    // Fetch the updated assets
    const assets = await db
      .select()
      .from(assetGroupAssets)
      .where(eq(assetGroupAssets.assetGroupId, assetGroupId));

    return NextResponse.json({
      ...updatedAssetGroup[0],
      assets
    });
  } catch (error) {
    console.error('Failed to update asset group:', error);
    return NextResponse.json(
      { error: 'Failed to update asset group' },
      { status: 500 }
    );
  }
}

// DELETE asset group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assetGroupId: string }> }
) {
  try {
    const { assetGroupId } = await params;

    // Delete all assets in the asset group first
    await db.delete(assetGroupAssets).where(eq(assetGroupAssets.assetGroupId, assetGroupId));

    // Delete the asset group
    const deletedAssetGroup = await db
      .delete(assetGroups)
      .where(eq(assetGroups.id, assetGroupId))
      .returning();

    if (deletedAssetGroup.length === 0) {
      return NextResponse.json(
        { error: 'Asset group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete asset group:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset group' },
      { status: 500 }
    );
  }
}
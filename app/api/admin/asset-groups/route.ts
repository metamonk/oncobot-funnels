import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { assetGroups, assetGroupAssets } from '@/lib/db/schema';
import { generateId } from 'ai';

// POST create new asset group with assets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaignId,
      name,
      theme,
      landingPageId,
      audienceSignal,
      headlines = []
    } = body;

    if (!campaignId || !name) {
      return NextResponse.json(
        { error: 'Campaign ID and name are required' },
        { status: 400 }
      );
    }

    // Create asset group
    const assetGroupId = generateId();
    const [newAssetGroup] = await db
      .insert(assetGroups)
      .values({
        id: assetGroupId,
        campaignId,
        name,
        theme: theme || null,
        landingPageId: landingPageId || null,
        audienceSignal: audienceSignal || null,
        isActive: true,
      })
      .returning();

    // Create asset group assets for headlines
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

    const assets = await Promise.all(assetPromises);

    return NextResponse.json({
      ...newAssetGroup,
      assets: assets.flat(),
    });
  } catch (error) {
    console.error('Failed to create asset group:', error);
    return NextResponse.json(
      { error: 'Failed to create asset group' },
      { status: 500 }
    );
  }
}
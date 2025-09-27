import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { adCampaigns, assetGroups } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;
    const campaign = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.id, campaignId))
      .limit(1);

    if (campaign.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign[0]);
  } catch (error) {
    console.error('Failed to fetch campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

// PATCH update campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;
    const body = await request.json();
    const { name, indicationId, status, utmCampaign, campaignType, budget, targetRoas } = body;

    const updatedCampaign = await db
      .update(adCampaigns)
      .set({
        ...(name && { name }),
        ...(indicationId !== undefined && { indicationId }),
        ...(status && { status }),
        ...(utmCampaign !== undefined && { utmCampaign }),
        ...(campaignType && { campaignType }),
        ...(budget !== undefined && { budget }),
        ...(targetRoas !== undefined && { targetRoas }),
        updatedAt: new Date(),
      })
      .where(eq(adCampaigns.id, campaignId))
      .returning();

    if (updatedCampaign.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCampaign[0]);
  } catch (error) {
    console.error('Failed to update campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;
    // Delete all asset groups in the campaign first (cascade delete handles this, but being explicit)
    await db.delete(assetGroups).where(eq(assetGroups.campaignId, campaignId));

    // Delete the campaign
    const deletedCampaign = await db
      .delete(adCampaigns)
      .where(eq(adCampaigns.id, campaignId))
      .returning();

    if (deletedCampaign.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
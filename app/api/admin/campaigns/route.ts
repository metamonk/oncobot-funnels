import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { adCampaigns } from '@/lib/db/schema';
import { generateId } from 'ai';

// GET all campaigns
export async function GET() {
  try {
    const campaigns = await db.select().from(adCampaigns);
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST create new campaign (Performance Max)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      indicationId,
      status = 'draft',
      utmCampaign,
      campaignType = 'performance_max',
      budget,
      targetRoas
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Campaign name is required' },
        { status: 400 }
      );
    }

    const newCampaign = await db
      .insert(adCampaigns)
      .values({
        id: generateId(),
        name,
        indicationId: indicationId || null,
        status,
        utmCampaign: utmCampaign || null,
        campaignType,
        budget: budget || null,
        targetRoas: targetRoas || null,
      })
      .returning();

    return NextResponse.json(newCampaign[0]);
  } catch (error) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
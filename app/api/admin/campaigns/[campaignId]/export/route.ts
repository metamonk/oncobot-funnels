import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { adCampaigns, assetGroups, assetGroupAssets, adHeadlines } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Export campaign to Google Ads CSV format
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;
    // Fetch campaign with its ads
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

    // Fetch asset groups with their assets for Performance Max export
    const campaignAssetGroups = await db
      .select()
      .from(assetGroups)
      .where(eq(assetGroups.campaignId, campaignId));

    // For each asset group, fetch the assets
    const assetGroupsWithAssets = await Promise.all(
      campaignAssetGroups.map(async (assetGroup) => {
        const assets = await db
          .select({
            assetType: assetGroupAssets.assetType,
            textContent: assetGroupAssets.textContent,
            assetId: assetGroupAssets.assetId,
            headline: adHeadlines.headline,
            longHeadline: adHeadlines.longHeadline,
            description: adHeadlines.description,
          })
          .from(assetGroupAssets)
          .where(eq(assetGroupAssets.assetGroupId, assetGroup.id))
          .leftJoin(adHeadlines, eq(assetGroupAssets.assetId, adHeadlines.id));

        return {
          ...assetGroup,
          assets,
        };
      })
    );

    // Generate CSV content for Google Ads
    const csvHeaders = [
      'Campaign',
      'Ad group',
      'Headline 1',
      'Headline 2',
      'Headline 3',
      'Description 1',
      'Description 2',
      'Path 1',
      'Path 2',
      'Final URL',
      'Status',
    ];

    // Export Performance Max asset groups
    const csvRows = assetGroupsWithAssets.flatMap(assetGroup => {
      const campaignName = campaign[0].name;
      const assetGroupName = assetGroup.name;

      // Get headlines from assets
      const headlines = assetGroup.assets
        .filter(a => a.assetType === 'headline')
        .map(a => a.textContent || a.headline || '')
        .slice(0, 3);
      while (headlines.length < 3) headlines.push('');

      // Get descriptions from assets (or use first headline as description if none)
      const descriptions = assetGroup.assets
        .filter(a => a.assetType === 'description')
        .map(a => a.textContent || a.description || '')
        .slice(0, 2);
      while (descriptions.length < 2) descriptions.push(headlines[0] || '');

      // Extract path segments from URL
      const urlPath = assetGroup.finalUrl ? new URL(assetGroup.finalUrl).pathname : '';
      const pathSegments = urlPath.split('/').filter(Boolean).slice(0, 2);
      while (pathSegments.length < 2) pathSegments.push('');

      return [[
        campaignName,
        assetGroupName,
        headlines[0].substring(0, 30), // Google Ads headline limit
        headlines[1].substring(0, 30),
        headlines[2].substring(0, 30),
        descriptions[0].substring(0, 90), // Google Ads description limit
        descriptions[1].substring(0, 90),
        pathSegments[0].substring(0, 15), // Path segment limit
        pathSegments[1].substring(0, 15),
        assetGroup.finalUrl || '',
        assetGroup.isActive ? 'Enabled' : 'Paused',
      ]];
    });

    // Combine headers and rows
    const csvContent = [
      csvHeaders,
      ...csvRows,
    ]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${campaign[0].name.toLowerCase().replace(/\s+/g, '-')}-google-ads.csv"`,
      },
    });
  } catch (error) {
    console.error('Failed to export campaign:', error);
    return NextResponse.json(
      { error: 'Failed to export campaign' },
      { status: 500 }
    );
  }
}
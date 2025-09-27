import { db } from '@/lib/db/drizzle';
import { adCampaigns, assetGroups, assetGroupAssets, adHeadlines, indications, landingPages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import AdsClient from './AdsClient';

async function getCampaigns() {
  const campaignResults = await db
    .select()
    .from(adCampaigns)
    .leftJoin(indications, eq(adCampaigns.indicationId, indications.id))
    .orderBy(adCampaigns.createdAt);

  // Transform and fetch asset groups for each campaign
  const campaignsWithAssetGroups = await Promise.all(
    campaignResults.map(async (row) => {
      const campaign = {
        ...row.ad_campaigns,
        indication: row.indications || null,
      };

      // Fetch asset groups for this campaign
      const assetGroupResults = await db
        .select()
        .from(assetGroups)
        .where(eq(assetGroups.campaignId, campaign.id));

      // Fetch assets for each asset group
      const assetGroupsWithAssets = await Promise.all(
        assetGroupResults.map(async (assetGroup) => {
          const assets = await db
            .select()
            .from(assetGroupAssets)
            .where(eq(assetGroupAssets.assetGroupId, assetGroup.id))
            .leftJoin(adHeadlines, eq(assetGroupAssets.assetId, adHeadlines.id));

          const processedAssets = assets.map(asset => ({
            id: asset.asset_group_assets.id,
            assetType: asset.asset_group_assets.assetType,
            textContent: asset.asset_group_assets.textContent,
            assetId: asset.asset_group_assets.assetId,
            headline: asset.ad_headlines || undefined,
            performanceRating: asset.asset_group_assets.performanceRating,
            impressions: asset.asset_group_assets.impressions,
          }));

          return {
            ...assetGroup,
            assets: processedAssets,
          };
        })
      );

      return {
        ...campaign,
        assetGroups: assetGroupsWithAssets,
      };
    })
  );

  return campaignsWithAssetGroups;
}

async function getStats() {
  const allCampaigns = await db.select().from(adCampaigns);
  const allAssetGroups = await db.select().from(assetGroups);

  return {
    totalCampaigns: allCampaigns.length,
    activeCampaigns: allCampaigns.filter(c => c.status === 'active').length,
    totalAssetGroups: allAssetGroups.length,
    activeAssetGroups: allAssetGroups.filter(ag => ag.isActive).length,
  };
}

export default async function AdsPage() {
  const campaigns = await getCampaigns();
  const stats = await getStats();
  const allIndications = await db.select().from(indications).orderBy(indications.name);
  const allLandingPages = await db.select().from(landingPages).orderBy(landingPages.name);
  const allHeadlines = await db.select().from(adHeadlines).orderBy(adHeadlines.headline);

  return (
    <AdsClient
      initialCampaigns={campaigns}
      indications={allIndications}
      landingPages={allLandingPages}
      headlines={allHeadlines}
      stats={stats}
    />
  );
}
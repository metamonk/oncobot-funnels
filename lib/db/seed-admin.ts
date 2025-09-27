// Load environment variables
import 'dotenv/config';
import { db } from './drizzle';
import { indications, landingPages } from './schema';

export async function seedAdminData() {
  try {
    console.log('Seeding admin data...');

    // Seed indications with featured status and hero content
    const indicationData = [
      {
        id: 'ind_lung',
        name: 'Lung Cancer',
        slug: 'lung-cancer',
        isActive: true,
        isFeatured: true,
        heroHeadline: 'Find Your Lung Cancer Clinical Trial Match',
        heroSubheadline: 'Access 500+ active lung cancer trials nationwide. Get matched in 48 hours.'
      },
      {
        id: 'ind_prostate',
        name: 'Prostate Cancer',
        slug: 'prostate-cancer',
        isActive: true,
        isFeatured: true,
        heroHeadline: 'Prostate Cancer Trial Options Near You',
        heroSubheadline: '300+ trials for all stages. Free eligibility check in 2 minutes.'
      },
      {
        id: 'ind_gi',
        name: 'GI Cancer',
        slug: 'gi-cancer',
        isActive: true,
        isFeatured: true,
        heroHeadline: 'GI & Colorectal Cancer Trials Available Now',
        heroSubheadline: 'Connect with leading research centers. HIPAA-secure and confidential.'
      },
      {
        id: 'ind_breast',
        name: 'Breast Cancer',
        slug: 'breast-cancer',
        isActive: true,
        isFeatured: false,
        heroHeadline: 'Breast Cancer Clinical Trial Matching',
        heroSubheadline: 'Personalized trial matching for all breast cancer subtypes.'
      },
      {
        id: 'ind_colorectal',
        name: 'Colorectal Cancer',
        slug: 'colorectal-cancer',
        isActive: true,
        isFeatured: false,
        heroHeadline: 'Colorectal Cancer Research Opportunities',
        heroSubheadline: 'Access innovative treatments through clinical trials.'
      },
    ];

    for (const indication of indicationData) {
      await db
        .insert(indications)
        .values(indication)
        .onConflictDoNothing()
        .execute();
    }

    console.log(`Seeded ${indicationData.length} indications`);

    // Seed landing pages including indication-specific pages
    const landingPageData = [
      {
        id: 'lp_home',
        name: 'Homepage',
        path: '/',
        slug: 'home',
        description: 'Main landing page with general information',
        isActive: true,
      },
      {
        id: 'lp_contact',
        name: 'Contact Form',
        path: '/contact',
        slug: 'contact',
        description: 'Patient information submission form',
        isActive: true,
      },
      {
        id: 'lp_membership',
        name: 'Site Membership',
        path: '/membership',
        slug: 'membership',
        description: 'Clinical trial site partnership page',
        isActive: true,
      },
      {
        id: 'lp_about',
        name: 'About Us',
        path: '/about',
        slug: 'about',
        description: 'Information about our services',
        isActive: true,
      },
      {
        id: 'lp_lung',
        name: 'Lung Cancer Landing',
        path: '/lung-cancer',
        slug: 'lung-cancer',
        indicationId: 'ind_lung',
        description: 'Lung cancer specific landing page',
        isActive: true,
      },
      {
        id: 'lp_prostate',
        name: 'Prostate Cancer Landing',
        path: '/prostate-cancer',
        slug: 'prostate-cancer',
        indicationId: 'ind_prostate',
        description: 'Prostate cancer specific landing page',
        isActive: true,
      },
      {
        id: 'lp_gi',
        name: 'GI Cancer Landing',
        path: '/gi-cancer',
        slug: 'gi-cancer',
        indicationId: 'ind_gi',
        description: 'GI cancer specific landing page',
        isActive: true,
      },
    ];

    for (const page of landingPageData) {
      await db
        .insert(landingPages)
        .values(page)
        .onConflictDoNothing()
        .execute();
    }

    console.log(`Seeded ${landingPageData.length} landing pages`);

    console.log('Admin data seeding complete!');
  } catch (error) {
    console.error('Error seeding admin data:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedAdminData()
    .then(() => {
      console.log('Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}
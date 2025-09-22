// Load environment variables
import 'dotenv/config';
import { db } from './drizzle';
import { indications, landingPages } from './schema';

export async function seedAdminData() {
  try {
    console.log('Seeding admin data...');

    // Seed indications
    const indicationData = [
      { id: 'ind_lung', name: 'Lung Cancer', slug: 'lung-cancer', isActive: true },
      { id: 'ind_prostate', name: 'Prostate Cancer', slug: 'prostate-cancer', isActive: true },
      { id: 'ind_gi', name: 'GI Cancer', slug: 'gi-cancer', isActive: true },
      { id: 'ind_breast', name: 'Breast Cancer', slug: 'breast-cancer', isActive: true },
      { id: 'ind_colorectal', name: 'Colorectal Cancer', slug: 'colorectal-cancer', isActive: true },
    ];

    for (const indication of indicationData) {
      await db
        .insert(indications)
        .values(indication)
        .onConflictDoNothing()
        .execute();
    }

    console.log(`Seeded ${indicationData.length} indications`);

    // Seed landing pages
    const landingPageData = [
      {
        id: 'lp_home',
        name: 'Homepage',
        path: '/',
        description: 'Main landing page with general information',
        isActive: true,
      },
      {
        id: 'lp_contact',
        name: 'Contact Form',
        path: '/contact',
        description: 'Patient information submission form',
        isActive: true,
      },
      {
        id: 'lp_membership',
        name: 'Site Membership',
        path: '/membership',
        description: 'Clinical trial site partnership page',
        isActive: true,
      },
      {
        id: 'lp_about',
        name: 'About Us',
        path: '/about',
        description: 'Information about our services',
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
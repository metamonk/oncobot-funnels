'use server';

import { db } from '@/lib/db';
import { healthProfile, userHealthProfile, healthProfileResponse } from '@/lib/db/schema';
import { getUser } from '@/lib/auth-utils';
import { eq, and, desc } from 'drizzle-orm';
import { generateId } from 'ai';

export async function getUserHealthProfile() {
  const user = await getUser();
  if (!user) {
    throw new Error('Authentication required');
  }

  try {
    // Get the active health profile for the user
    const userProfile = await db.query.userHealthProfile.findFirst({
      where: and(
        eq(userHealthProfile.userId, user.id),
        eq(userHealthProfile.isActive, true)
      ),
      with: {
        healthProfile: true,
      },
    });

    if (!userProfile) {
      return null;
    }

    // Get responses for this profile
    const responses = await db.query.healthProfileResponse.findMany({
      where: eq(healthProfileResponse.healthProfileId, userProfile.healthProfileId),
      orderBy: [desc(healthProfileResponse.createdAt)],
    });

    return {
      profile: userProfile.healthProfile,
      responses,
    };
  } catch (error) {
    console.error('Error fetching health profile:', error);
    throw new Error('Failed to fetch health profile');
  }
}

export async function createHealthProfile(data: {
  cancerRegion?: string;
  primarySite?: string;
  cancerType?: string;
  diseaseStage?: string;
  treatmentHistory?: any;
  molecularMarkers?: any;
  performanceStatus?: string;
  complications?: any;
}) {
  const user = await getUser();
  if (!user) {
    throw new Error('Authentication required');
  }

  try {
    // Create the health profile
    const profileId = generateId();
    const [newProfile] = await db.insert(healthProfile).values({
      id: profileId,
      ...data,
    }).returning();

    // Create the user-profile mapping
    await db.insert(userHealthProfile).values({
      userId: user.id,
      healthProfileId: profileId,
      isActive: true,
    });

    // Deactivate any other profiles for this user
    await db.update(userHealthProfile)
      .set({ isActive: false })
      .where(and(
        eq(userHealthProfile.userId, user.id),
        eq(userHealthProfile.healthProfileId, profileId).not()
      ));

    return newProfile;
  } catch (error) {
    console.error('Error creating health profile:', error);
    throw new Error('Failed to create health profile');
  }
}

export async function updateHealthProfile(profileId: string, data: {
  cancerRegion?: string;
  primarySite?: string;
  cancerType?: string;
  diseaseStage?: string;
  treatmentHistory?: any;
  molecularMarkers?: any;
  performanceStatus?: string;
  complications?: any;
  completedAt?: Date;
}) {
  const user = await getUser();
  if (!user) {
    throw new Error('Authentication required');
  }

  try {
    // Verify user owns this profile
    const userProfile = await db.query.userHealthProfile.findFirst({
      where: and(
        eq(userHealthProfile.userId, user.id),
        eq(userHealthProfile.healthProfileId, profileId)
      ),
    });

    if (!userProfile) {
      throw new Error('Profile not found or access denied');
    }

    // Update the profile
    const [updatedProfile] = await db.update(healthProfile)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(healthProfile.id, profileId))
      .returning();

    return updatedProfile;
  } catch (error) {
    console.error('Error updating health profile:', error);
    throw new Error('Failed to update health profile');
  }
}

export async function saveHealthProfileResponse(profileId: string, questionId: string, response: any) {
  const user = await getUser();
  if (!user) {
    throw new Error('Authentication required');
  }

  try {
    // Verify user owns this profile
    const userProfile = await db.query.userHealthProfile.findFirst({
      where: and(
        eq(userHealthProfile.userId, user.id),
        eq(userHealthProfile.healthProfileId, profileId)
      ),
    });

    if (!userProfile) {
      throw new Error('Profile not found or access denied');
    }

    // Save the response
    const [newResponse] = await db.insert(healthProfileResponse).values({
      healthProfileId: profileId,
      questionId,
      response,
    }).returning();

    // Update the profile's updatedAt timestamp
    await db.update(healthProfile)
      .set({ updatedAt: new Date() })
      .where(eq(healthProfile.id, profileId));

    return newResponse;
  } catch (error) {
    console.error('Error saving health profile response:', error);
    throw new Error('Failed to save response');
  }
}

export async function deleteHealthProfile(profileId: string) {
  const user = await getUser();
  if (!user) {
    throw new Error('Authentication required');
  }

  try {
    // Verify user owns this profile
    const userProfile = await db.query.userHealthProfile.findFirst({
      where: and(
        eq(userHealthProfile.userId, user.id),
        eq(userHealthProfile.healthProfileId, profileId)
      ),
    });

    if (!userProfile) {
      throw new Error('Profile not found or access denied');
    }

    // Delete the profile (cascades to user_health_profile and responses)
    await db.delete(healthProfile).where(eq(healthProfile.id, profileId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting health profile:', error);
    throw new Error('Failed to delete health profile');
  }
}

export async function hasCompletedHealthProfile() {
  const user = await getUser();
  if (!user) {
    return false;
  }

  try {
    const userProfile = await db.query.userHealthProfile.findFirst({
      where: and(
        eq(userHealthProfile.userId, user.id),
        eq(userHealthProfile.isActive, true)
      ),
      with: {
        healthProfile: true,
      },
    });

    return userProfile?.healthProfile?.completedAt != null;
  } catch (error) {
    console.error('Error checking health profile completion:', error);
    return false;
  }
}
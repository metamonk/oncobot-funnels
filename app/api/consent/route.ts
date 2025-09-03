import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { ConsentServiceServer } from '@/lib/consent/consent-server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consents = await ConsentServiceServer.getUserConsents(session.user.id);
    
    return NextResponse.json({
      consents,
      hasRequiredConsents: await ConsentServiceServer.hasRequiredConsents(session.user.id)
    });
  } catch (error) {
    console.error('Error fetching consents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent preferences' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { updates } = body;
    
    // Enhanced validation
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid request body: updates must be an array' },
        { status: 400 }
      );
    }
    
    // Validate each update
    const validCategories = [
      'eligibility_checks', 'trial_matching', 'contact_sharing', 
      'data_sharing', 'marketing', 'analytics', 'research'
    ];
    
    for (const update of updates) {
      if (!update.category || typeof update.category !== 'string') {
        return NextResponse.json(
          { error: 'Invalid update: category is required and must be a string' },
          { status: 400 }
        );
      }
      
      if (!validCategories.includes(update.category)) {
        return NextResponse.json(
          { error: `Invalid category: ${update.category}` },
          { status: 400 }
        );
      }
      
      if (typeof update.consented !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid update: consented must be a boolean' },
          { status: 400 }
        );
      }
    }

    await ConsentServiceServer.updateConsents(session.user.id, updates);
    
    return NextResponse.json({
      success: true,
      consents: await ConsentServiceServer.getUserConsents(session.user.id)
    });
  } catch (error) {
    console.error('Error updating consents:', error);
    return NextResponse.json(
      { error: 'Failed to update consent preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();
    
    if (action === 'grant_core') {
      await ConsentServiceServer.grantCoreConsents(session.user.id);
    } else if (action === 'revoke_all') {
      await ConsentServiceServer.revokeAllConsents(session.user.id);
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      consents: await ConsentServiceServer.getUserConsents(session.user.id)
    });
  } catch (error) {
    console.error('Error updating consents:', error);
    return NextResponse.json(
      { error: 'Failed to update consent preferences' },
      { status: 500 }
    );
  }
}
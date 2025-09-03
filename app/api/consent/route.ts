import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ConsentService } from '@/lib/consent/consent-service';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consents = await ConsentService.getUserConsents(session.user.id);
    
    return NextResponse.json({
      consents,
      hasRequiredConsents: await ConsentService.hasRequiredConsents(session.user.id)
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
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { updates } = await req.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    await ConsentService.updateConsents(session.user.id, updates);
    
    return NextResponse.json({
      success: true,
      consents: await ConsentService.getUserConsents(session.user.id)
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
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();
    
    if (action === 'grant_core') {
      await ConsentService.grantCoreConsents(session.user.id);
    } else if (action === 'revoke_all') {
      await ConsentService.revokeAllConsents(session.user.id);
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      consents: await ConsentService.getUserConsents(session.user.id)
    });
  } catch (error) {
    console.error('Error updating consents:', error);
    return NextResponse.json(
      { error: 'Failed to update consent preferences' },
      { status: 500 }
    );
  }
}
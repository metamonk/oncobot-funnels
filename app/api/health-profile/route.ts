import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserHealthProfile, 
  createHealthProfile, 
  updateHealthProfile,
  deleteHealthProfile 
} from '@/lib/health-profile-actions';
import { getUser } from '@/lib/auth-utils';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getUserHealthProfile();
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in GET /api/health-profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const profile = await createHealthProfile(body);
    
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/health-profile:', error);
    return NextResponse.json(
      { error: 'Failed to create health profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { profileId, ...data } = body;

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID required' },
        { status: 400 }
      );
    }

    const profile = await updateHealthProfile(profileId, data);
    
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in PUT /api/health-profile:', error);
    return NextResponse.json(
      { error: 'Failed to update health profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID required' },
        { status: 400 }
      );
    }

    await deleteHealthProfile(profileId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/health-profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete health profile' },
      { status: 500 }
    );
  }
}
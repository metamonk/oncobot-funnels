import { NextRequest, NextResponse } from 'next/server';
import { saveHealthProfileResponse } from '@/lib/health-profile-actions';
import { getUser } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { profileId, questionId, response } = body;

    if (!profileId || !questionId || response === undefined) {
      return NextResponse.json(
        { error: 'Profile ID, question ID, and response are required' },
        { status: 400 }
      );
    }

    const savedResponse = await saveHealthProfileResponse(profileId, questionId, response);
    
    return NextResponse.json({ response: savedResponse }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/health-profile/responses:', error);
    return NextResponse.json(
      { error: 'Failed to save response' },
      { status: 500 }
    );
  }
}
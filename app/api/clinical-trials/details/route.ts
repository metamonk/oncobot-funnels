import { NextRequest, NextResponse } from 'next/server';

// Simple endpoint to fetch trial details from ClinicalTrials.gov
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nctId = searchParams.get('nctId');
    
    if (!nctId) {
      return NextResponse.json({ error: 'Missing NCT ID' }, { status: 400 });
    }
    
    // Fetch trial details from ClinicalTrials.gov API
    const response = await fetch(
      `https://clinicaltrials.gov/api/v2/studies/${nctId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        next: {
          revalidate: 3600, // Cache for 1 hour
        },
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Trial not found' }, { status: 404 });
      }
      throw new Error(`Failed to fetch trial: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Return the full trial data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching trial details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trial details' },
      { status: 500 }
    );
  }
}
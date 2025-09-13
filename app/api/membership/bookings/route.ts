import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { membershipBookings } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const booking = {
      companyName: body.companyName,
      contactName: body.contactName,
      email: body.email,
      phone: body.phone,
      indication: body.indication,
      siteLocation: body.siteLocation,
      monthlyVolume: body.monthlyVolume || null,
      notes: body.notes || null,
      selectedTime: body.selectedTime,
      status: 'pending' as const,
    };

    const [result] = await db.insert(membershipBookings).values(booking).returning();

    return NextResponse.json({ 
      success: true, 
      bookingId: result.id 
    });
  } catch (error) {
    console.error('Booking save error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save booking' },
      { status: 500 }
    );
  }
}
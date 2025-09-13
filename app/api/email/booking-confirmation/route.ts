import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { serverEnv } from '@/env/server';

const resend = new Resend(serverEnv.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, name, time } = await request.json();

    const emailContent = `
      <h2>Your Protocol Intake is Confirmed!</h2>
      
      <p>Hi ${name},</p>
      
      <p>Your protocol intake meeting is confirmed for:</p>
      <p><strong>${time}</strong></p>
      
      <h3>What to Bring:</h3>
      <ul>
        <li>I/E criteria document</li>
        <li>Geographic radius preferences</li>
        <li>PI availability windows</li>
        <li>Site contact information</li>
      </ul>
      
      <h3>Meeting Details:</h3>
      <ul>
        <li>Duration: 15 minutes</li>
        <li>Format: Video conference</li>
        <li>Meeting link: Will be sent separately</li>
      </ul>
      
      <p>During this call, we'll:</p>
      <ul>
        <li>Finalize your I/E criteria and geographic parameters</li>
        <li>Activate your member portal</li>
        <li>Set up your pipeline for go-live within 48 hours</li>
      </ul>
      
      <p>If you need to reschedule, please reply to this email.</p>
      
      <p>Best regards,<br>
      OncoBot Clinical Trials Team</p>
    `;

    const { data, error } = await resend.emails.send({
      from: serverEnv.EMAIL_FROM || 'OncoBot <noreply@oncobot.com>',
      to: [to],
      subject: 'Protocol Intake Confirmed - OncoBot Clinical Trials',
      html: emailContent,
    });

    if (error) {
      console.error('Email send error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
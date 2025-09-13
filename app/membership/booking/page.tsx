'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Shield, 
  FileText,
  MapPin,
  Users,
  CheckCircle2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';
import { BookingForm } from './_components/BookingForm';

export default function BookingPage() {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const { track } = useUnifiedAnalytics();

  useEffect(() => {
    track('booking_page_viewed', {
      source: 'membership_funnel'
    });
  }, [track]);

  // Mock available times - in production, this would come from a calendar API
  const availableTimes = [
    { date: 'Monday, Dec 18', times: ['9:00 AM', '10:00 AM', '2:00 PM', '3:00 PM'] },
    { date: 'Tuesday, Dec 19', times: ['10:00 AM', '11:00 AM', '1:00 PM', '4:00 PM'] },
    { date: 'Wednesday, Dec 20', times: ['9:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'] },
    { date: 'Thursday, Dec 21', times: ['10:00 AM', '1:00 PM', '3:00 PM', '4:00 PM'] },
    { date: 'Friday, Dec 22', times: ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM'] },
  ];

  const handleContinue = () => {
    if (selectedTime) {
      track('time_selected', {
        time: selectedTime,
        type: 'protocol_intake'
      });
      setShowForm(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 border-b">
        <div className="container max-w-screen-xl mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold">
              Lock Your Capacity Slot — 15-Minute Protocol Intake
            </h1>
            <p className="text-xl text-muted-foreground">
              Bring I/E criteria, geo radius, and PI availability. 
              We configure your prescreener, confirm SLAs, and go live in 48 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container max-w-screen-xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Calendar Section */}
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" />
                    Pick a Time
                  </h2>
                  
                  <div className="space-y-6">
                    {availableTimes.map((day) => (
                      <div key={day.date}>
                        <h3 className="font-semibold mb-3">{day.date}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {day.times.map((time) => {
                            const timeSlot = `${day.date} - ${time}`;
                            return (
                              <Button
                                key={timeSlot}
                                variant={selectedTime === timeSlot ? 'default' : 'outline'}
                                onClick={() => {
                                  setSelectedTime(timeSlot);
                                  track('time_slot_selected', { slot: timeSlot });
                                }}
                                className="w-full"
                              >
                                {time}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedTime && (
                    <div className="mt-8 p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm font-medium">
                        Selected: <span className="text-primary">{selectedTime}</span>
                      </p>
                    </div>
                  )}

                  {!showForm && (
                    <Button 
                      size="lg" 
                      className="w-full mt-6"
                      disabled={!selectedTime}
                      onClick={handleContinue}
                    >
                      Continue to Details
                    </Button>
                  )}
                </Card>

                {showForm && selectedTime && (
                  <div className="mt-6">
                    <BookingForm selectedTime={selectedTime} />
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* What to Bring */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    What to Bring
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">I/E criteria document</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Geographic radius preferences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">PI availability windows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Site contact information</span>
                    </li>
                  </ul>
                </Card>

                {/* Meeting Details */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Meeting Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>15 minutes</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Protocol specialist</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Video conference</span>
                    </div>
                  </div>
                </Card>

                {/* Reassurance */}
                <Card className="p-6 bg-accent/10">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-2">HIPAA Compliant</h3>
                      <p className="text-sm text-muted-foreground">
                        BAA provided. Neutral outreach unless sponsor/site copy is provided.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
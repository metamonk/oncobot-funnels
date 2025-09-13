'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock, AlertCircle, Calendar } from 'lucide-react';

interface CountdownTimerProps {
  className?: string;
  urgencyThresholdHours?: number;
  cycleType?: 'weekly' | 'biweekly' | 'monthly';
}

export function CountdownTimer({ 
  className, 
  urgencyThresholdHours = 48,
  cycleType = 'weekly'
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isUrgent: boolean;
    isCritical: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isUrgent: false, isCritical: false });

  useEffect(() => {
    const getNextDeadline = () => {
      const now = new Date();
      const deadline = new Date();
      
      switch (cycleType) {
        case 'weekly':
          // Next Friday at 11:59 PM
          const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
          deadline.setDate(now.getDate() + daysUntilFriday);
          deadline.setHours(23, 59, 59, 999);
          break;
          
        case 'biweekly':
          const weekNumber = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
          const isEvenWeek = weekNumber % 2 === 0;
          let daysUntilBiweeklyFriday = (5 - now.getDay() + 7) % 7;
          if (daysUntilBiweeklyFriday === 0 && now.getHours() >= 23) {
            daysUntilBiweeklyFriday = 14;
          } else if (!isEvenWeek) {
            daysUntilBiweeklyFriday += 7;
          }
          deadline.setDate(now.getDate() + (daysUntilBiweeklyFriday || 14));
          deadline.setHours(23, 59, 59, 999);
          break;
          
        case 'monthly':
          deadline.setMonth(now.getMonth() + 1, 0);
          deadline.setHours(23, 59, 59, 999);
          break;
      }
      
      return deadline;
    };

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadline = getNextDeadline().getTime();
      const difference = deadline - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        const totalHoursLeft = days * 24 + hours;
        const isUrgent = totalHoursLeft <= urgencyThresholdHours;
        const isCritical = totalHoursLeft <= 24;

        setTimeLeft({ days, hours, minutes, seconds, isUrgent, isCritical });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isUrgent: false, isCritical: false });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [cycleType, urgencyThresholdHours]);

  const getDisplayInfo = () => {
    const { days, hours, minutes, isUrgent, isCritical } = timeLeft;
    
    if (isCritical) {
      if (days === 0 && hours === 0) {
        return {
          value: `${minutes}`,
          unit: 'minutes left',
          icon: AlertCircle,
          colorClasses: 'bg-red-50 border-red-200 text-red-700',
          iconColor: 'text-red-500'
        };
      } else if (days === 0) {
        return {
          value: `${hours}`,
          unit: hours === 1 ? 'hour left' : 'hours left',
          icon: AlertCircle,
          colorClasses: 'bg-red-50 border-red-200 text-red-700',
          iconColor: 'text-red-500'
        };
      }
    }
    
    if (isUrgent) {
      return {
        value: `${days}`,
        unit: days === 1 ? 'day left' : 'days left',
        icon: Clock,
        colorClasses: 'bg-orange-50 border-orange-200 text-orange-700',
        iconColor: 'text-orange-500'
      };
    }
    
    return {
      value: `${days}`,
      unit: days === 1 ? 'day left' : 'days left',
      icon: Calendar,
      colorClasses: 'bg-green-50 border-green-200 text-green-700',
      iconColor: 'text-green-500'
    };
  };

  const display = getDisplayInfo();
  const Icon = display.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-4 py-2.5 rounded-md border',
      display.colorClasses,
      'transition-all duration-300',
      className
    )}>
      <Icon className={cn('h-4 w-4 flex-shrink-0', display.iconColor, timeLeft.isCritical && 'animate-pulse')} />
      
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium">
          {display.value} {display.unit}
        </span>
        {timeLeft.isCritical && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </div>
    </div>
  );
}
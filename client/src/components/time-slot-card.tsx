import { type TimeSlot, type Event } from "@shared/schema";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface TimeSlotCardProps {
  timeSlot: TimeSlot & { registrationCount: number; waitlistCount: number };
  event: Event;
}

export default function TimeSlotCard({ timeSlot, event }: TimeSlotCardProps) {
  const [, setLocation] = useLocation();
  const availableSpots = timeSlot.capacity - timeSlot.registrationCount;
  const isFull = availableSpots <= 0;
  const isWaitlistOnly = isFull && timeSlot.waitlistCount > 0;

  const handleClick = () => {
    // Navigate to registration page with time slot and event IDs
    setLocation(`/register?event=${event.id}&timeSlot=${timeSlot.id}`);
  };

  return (
    <div 
      className={cn(
        "time-slot-card bg-white border-2 rounded-xl p-6 cursor-pointer transition-all duration-200",
        "border-gray-200 hover:border-primary hover:-translate-y-1 hover:shadow-lg",
        isFull && "bg-gray-50"
      )}
      onClick={handleClick}
    >
      <div className="text-center">
        <div className={cn(
          "text-lg font-semibold mb-2",
          isFull ? "text-gray-600" : "text-gray-900"
        )}>
          {format(new Date(timeSlot.startTime), 'EEEE, MMMM d, yyyy')}
        </div>
        
        <div className={cn(
          "text-2xl font-bold mb-3",
          isFull ? "text-gray-600" : "text-primary"
        )}>
          {format(new Date(timeSlot.startTime), 'h:mm a')} - {format(new Date(timeSlot.endTime), 'h:mm a')}
        </div>
        
        <div className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
          isFull ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
        )}>
          <span className={cn(
            "w-2 h-2 rounded-full mr-2",
            isFull ? "bg-red-500" : "bg-green-500"
          )}></span>
          <span>
            {isFull ? (
              isWaitlistOnly ? "Join Waitlist" : "Full"
            ) : (
              `${availableSpots} spot${availableSpots !== 1 ? 's' : ''} left`
            )}
          </span>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          {event.location}
        </div>
      </div>
    </div>
  );
}

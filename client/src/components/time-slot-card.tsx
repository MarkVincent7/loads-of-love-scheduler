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

  const handleClick = () => {
    // Navigate to registration page with time slot and event IDs
    setLocation(`/register?event=${event.id}&timeSlot=${timeSlot.id}`);
  };

  return (
    <div 
      className={cn(
        "time-slot-card bg-white border-2 rounded-xl p-6 transition-all duration-200",
        "border-gray-200 hover:border-primary hover:-translate-y-1 hover:shadow-lg",
        isFull && "bg-gray-50"
      )}
    >
      <div className="space-y-3">
        {/* Event Date */}
        <div className="text-left">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Event Date</div>
          <div className={cn(
            "text-lg font-semibold",
            isFull ? "text-gray-600" : "text-gray-900"
          )}>
            {format(new Date(timeSlot.startTime), 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
        
        {/* Event Time */}
        <div className="text-left">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Event Time</div>
          <div className={cn(
            "text-xl font-bold",
            isFull ? "text-gray-600" : "text-primary"
          )}>
            {format(new Date(timeSlot.startTime), 'h:mm a')} - {format(new Date(timeSlot.endTime), 'h:mm a')}
          </div>
        </div>
        
        {/* Slots Left */}
        <div className="text-left">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {isFull ? 'Status' : 'Slots Left'}
          </div>
          <div className="mt-1">
            {!isFull ? (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                <span>{availableSpots} spot{availableSpots !== 1 ? 's' : ''} available</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-600">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                  <span>Time slot is full</span>
                </div>
                {timeSlot.waitlistCount > 0 && (
                  <div className="text-xs text-gray-400">
                    {timeSlot.waitlistCount} already on waitlist
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Event Location */}
        <div className="text-left">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Event Location</div>
          <div className="text-sm text-gray-700 font-medium">
            {event.laundromatName && (
              <div className="font-semibold">{event.laundromatName}</div>
            )}
            {event.laundromatAddress && (
              <div className="text-xs text-gray-600 mt-1">{event.laundromatAddress}</div>
            )}
            {!event.laundromatName && !event.laundromatAddress && (
              <div>{event.location}</div>
            )}
            {(event.laundromatName || event.laundromatAddress) && event.location && (
              <div className="text-xs text-gray-500 mt-1">{event.location}</div>
            )}
          </div>
        </div>
        
        {/* Action Button */}
        <div className="pt-2">
          {!isFull ? (
            <button
              onClick={handleClick}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Sign Up for This Slot
            </button>
          ) : (
            <button
              onClick={handleClick}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Join Waitlist
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

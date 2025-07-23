import { type TimeSlot, type Event } from "@shared/schema";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TimeSlotCardProps {
  timeSlot: TimeSlot & { registrationCount: number; waitlistCount: number };
  event: Event;
  isSelected: boolean;
  onSelect: (timeSlot: TimeSlot) => void;
}

export default function TimeSlotCard({ timeSlot, event, isSelected, onSelect }: TimeSlotCardProps) {
  const availableSpots = timeSlot.capacity - timeSlot.registrationCount;
  const isFull = availableSpots <= 0;
  const isWaitlistOnly = isFull && timeSlot.waitlistCount > 0;

  const handleClick = () => {
    onSelect(timeSlot);
  };

  return (
    <div 
      className={cn(
        "time-slot-card bg-white border-2 rounded-xl p-6 cursor-pointer transition-all duration-200",
        isSelected ? "time-slot-selected" : "border-gray-200 hover:border-primary hover:-translate-y-1 hover:shadow-lg",
        isFull && !isSelected && "bg-gray-50"
      )}
      onClick={handleClick}
    >
      <div className="text-center">
        <div className={cn(
          "text-lg font-semibold mb-2",
          isSelected ? "text-white" : isFull ? "text-gray-600" : "text-gray-900"
        )}>
          {format(new Date(timeSlot.startTime), 'EEEE, MMMM d, yyyy')}
        </div>
        
        <div className={cn(
          "text-2xl font-bold mb-3",
          isSelected ? "text-white" : isFull ? "text-gray-600" : "text-primary"
        )}>
          {format(new Date(timeSlot.startTime), 'h:mm a')} - {format(new Date(timeSlot.endTime), 'h:mm a')}
        </div>
        
        <div className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
          isSelected ? "bg-white bg-opacity-20 text-white" :
          isFull ? "bg-accent-100 text-accent-600" : "bg-secondary-50 text-secondary-600"
        )}>
          <span className={cn(
            "w-2 h-2 rounded-full mr-2",
            isSelected ? "bg-white" :
            isFull ? "bg-accent-500" : "bg-secondary-500"
          )}></span>
          <span>
            {isFull ? (
              isWaitlistOnly ? "Join Waitlist" : "Full"
            ) : (
              `${availableSpots} spot${availableSpots !== 1 ? 's' : ''} left`
            )}
          </span>
        </div>
        
        <div className={cn(
          "mt-4 text-sm",
          isSelected ? "opacity-90" : "text-gray-500"
        )}>
          {event.location}
        </div>
      </div>
    </div>
  );
}

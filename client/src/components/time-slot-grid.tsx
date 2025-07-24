import { type EventWithSlots, type TimeSlot } from "@shared/schema";
import TimeSlotCard from "./time-slot-card";

interface TimeSlotGridProps {
  events: EventWithSlots[];
}

export default function TimeSlotGrid({ events }: TimeSlotGridProps) {
  const allTimeSlots = events.flatMap(event => 
    event.timeSlots.map(slot => ({ ...slot, event }))
  );

  if (allTimeSlots.length === 0) {
    return (
      <div className="mb-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Available Time Slots</h3>
        <div className="text-center py-12">
          <p className="text-gray-600">No time slots are currently available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Available Time Slots</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTimeSlots.map((slot) => (
          <TimeSlotCard
            key={slot.id}
            timeSlot={slot}
            event={slot.event}
          />
        ))}
      </div>
    </div>
  );
}

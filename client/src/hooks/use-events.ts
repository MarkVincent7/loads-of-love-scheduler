import { useQuery } from "@tanstack/react-query";
import { type EventWithSlots } from "@shared/schema";

export function useEvents() {
  return useQuery<EventWithSlots[]>({
    queryKey: ["/api/events"],
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["/api/events", id],
    enabled: !!id,
  });
}

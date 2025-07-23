import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAdminStats() {
  return useQuery({
    queryKey: ["/api/admin/stats"],
  });
}

export function useRegistrations(eventId?: string) {
  return useQuery({
    queryKey: ["/api/admin/registrations", eventId],
    enabled: !!eventId,
  });
}

export function useBlacklist() {
  return useQuery({
    queryKey: ["/api/admin/blacklist"],
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest("POST", "/api/admin/events", eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event Created",
        description: "Event has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });
}

export function useAddToBlacklist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (blacklistData: any) => {
      const response = await apiRequest("POST", "/api/admin/blacklist", blacklistData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blacklist"] });
      toast({
        title: "Added to Blacklist",
        description: "User has been added to blacklist",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to blacklist",
        variant: "destructive",
      });
    },
  });
}

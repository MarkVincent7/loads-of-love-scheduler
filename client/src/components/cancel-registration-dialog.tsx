import { useState } from "react";
import { useCancelRegistration } from "@/hooks/use-admin";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import type { Registration } from "@shared/schema";

interface CancelRegistrationDialogProps {
  children: React.ReactNode;    
  registration: Registration;
}

export default function CancelRegistrationDialog({ children, registration }: CancelRegistrationDialogProps) {
  const [open, setOpen] = useState(false);
  const cancelRegistrationMutation = useCancelRegistration();

  const handleCancel = () => {
    cancelRegistrationMutation.mutate(registration.id, {
      onSuccess: () => {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Cancel Registration</span>
          </DialogTitle>
          <DialogDescription>
            This will cancel the registration and may promote someone from the waitlist.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Registration Info */}
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <h4 className="font-medium text-red-900 mb-1">{registration.name}</h4>
            <p className="text-sm mb-1">
              <a href={`mailto:${registration.email}`} className="text-red-600 hover:text-red-800 hover:underline">{registration.email}</a>
            </p>
            <p className="text-sm">
              <a href={`tel:${registration.phone}`} className="text-red-600 hover:text-red-800 hover:underline">{registration.phone}</a>
            </p>
            <div className="text-xs text-red-600 mt-2">
              <p>Registered: {format(new Date(registration.createdAt), 'MMM d, yyyy h:mm a')}</p>
              <p>Status: {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> If this is a confirmed registration, the next person on the waitlist 
              will automatically be promoted to confirmed status.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep Registration
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel}
              disabled={cancelRegistrationMutation.isPending}
            >
              {cancelRegistrationMutation.isPending ? "Cancelling..." : "Cancel Registration"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
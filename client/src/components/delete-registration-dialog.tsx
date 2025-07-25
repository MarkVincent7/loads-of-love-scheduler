import { useState } from "react";
import { useDeleteRegistration } from "@/hooks/use-admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { Registration } from "@shared/schema";

interface DeleteRegistrationDialogProps {
  registration: Registration | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteRegistrationDialog({
  registration,
  isOpen,
  onClose,
}: DeleteRegistrationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteRegistration = useDeleteRegistration();

  const handleDelete = async () => {
    if (!registration) return;

    setIsDeleting(true);
    try {
      await deleteRegistration.mutateAsync(registration.id);
      onClose();
    } catch (error) {
      console.error("Error deleting registration:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!registration) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Registration
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete this registration? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              <strong>Warning:</strong> This will permanently remove the registration from the system.
              {registration.status === 'confirmed' && (
                <span className="block mt-1">
                  If this is a confirmed registration, the next person on the waitlist will be automatically promoted.
                </span>
              )}
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div><strong>Name:</strong> {registration.name}</div>
            <div><strong>Email:</strong> <a href={`mailto:${registration.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">{registration.email}</a></div>
            <div><strong>Phone:</strong> <a href={`tel:${registration.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">{registration.phone}</a></div>
            <div><strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                registration.status === 'confirmed' 
                  ? 'bg-green-100 text-green-800'
                  : registration.status === 'waitlist'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {registration.status}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Registration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
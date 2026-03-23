import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateRegistration } from "@/hooks/use-admin";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Registration } from "@shared/schema";

const registrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  status: z.enum(['confirmed', 'waitlist', 'cancelled']),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface EditRegistrationDialogProps {
  children: React.ReactNode;
  registration: Registration;
}

export default function EditRegistrationDialog({ children, registration }: EditRegistrationDialogProps) {
  const [open, setOpen] = useState(false);
  const updateRegistrationMutation = useUpdateRegistration();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: registration.name,
      email: registration.email,
      phone: registration.phone ?? "",
      status: registration.status as 'confirmed' | 'waitlist' | 'cancelled',
    },
  });

  // Reset form when registration changes
  useEffect(() => {
    form.reset({
      name: registration.name,
      email: registration.email,
      phone: registration.phone ?? "",
      status: registration.status as 'confirmed' | 'waitlist' | 'cancelled',
    });
  }, [registration, form]);

  const onSubmit: SubmitHandler<RegistrationFormData> = (data) => {
    updateRegistrationMutation.mutate({
      id: registration.id,
      registrationData: data,
    }, {
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
          <DialogTitle>Edit Registration</DialogTitle>
          <DialogDescription>
            Update the registration details and status.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter full name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="user@example.com"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              {...form.register("phone")}
              placeholder="(555) 123-4567"
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.phone.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="status">Status *</Label>
            <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as 'confirmed' | 'waitlist' | 'cancelled')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="waitlist">Waitlisted</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.status.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateRegistrationMutation.isPending}>
              {updateRegistrationMutation.isPending ? "Updating..." : "Update Registration"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

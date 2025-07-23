import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddToBlacklist } from "@/hooks/use-admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const blacklistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  reason: z.string().min(1, "Reason is required"),
});

type BlacklistFormData = z.infer<typeof blacklistSchema>;

interface AddBlacklistDialogProps {
  children: React.ReactNode;
}

export default function AddBlacklistDialog({ children }: AddBlacklistDialogProps) {
  const [open, setOpen] = useState(false);
  const addToBlacklistMutation = useAddToBlacklist();

  const form = useForm<BlacklistFormData>({
    resolver: zodResolver(blacklistSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      reason: "",
    },
  });

  const onSubmit = (data: BlacklistFormData) => {
    addToBlacklistMutation.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
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
          <DialogTitle>Add to Blacklist</DialogTitle>
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
            <Label htmlFor="reason">Reason for Blacklist *</Label>
            <Textarea
              id="reason"
              {...form.register("reason")}
              placeholder="Enter reason for blacklisting this user..."
              rows={3}
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={addToBlacklistMutation.isPending}>
              {addToBlacklistMutation.isPending ? "Adding..." : "Add to Blacklist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
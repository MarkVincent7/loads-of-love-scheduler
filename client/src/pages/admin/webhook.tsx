import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import { useAuthStore } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Webhook, Save, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const webhookSchema = z.object({
  webhookUrl: z.string().url("Must be a valid URL").or(z.literal('')),
  enabled: z.number().min(0).max(1),
});

type WebhookFormData = z.infer<typeof webhookSchema>;

export default function WebhookConfig() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<{
    webhookUrl: string;
    enabled: number;
  }>({
    queryKey: ['/api/admin/webhook'],
  });

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      webhookUrl: '',
      enabled: 1,
    },
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    if (config) {
      form.reset({
        webhookUrl: config.webhookUrl || '',
        enabled: config.enabled ?? 1,
      });
    }
  }, [config, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: WebhookFormData) => {
      const response = await apiRequest('POST', '/api/admin/webhook', data, true);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/webhook'] });
      toast({
        title: "Webhook configuration saved",
        description: "Your webhook settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save webhook configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WebhookFormData) => {
    updateMutation.mutate(data);
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Webhook Configuration</h1>
          <p className="text-gray-600">Configure webhook integration for SMS messaging</p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            When a user registers for an event, the system will send registration data to your webhook URL. 
            You can use this to trigger SMS messages through your SMS service provider.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Settings
            </CardTitle>
            <CardDescription>
              Configure the webhook endpoint that will receive registration confirmations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <p>Loading configuration...</p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="webhookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://your-sms-service.com/webhook" 
                            {...field}
                            data-testid="input-webhook-url"
                          />
                        </FormControl>
                        <FormDescription>
                          The URL where registration event data should be sent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Webhook</FormLabel>
                          <FormDescription>
                            Turn on/off webhook notifications
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === 1}
                            onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                            data-testid="switch-webhook-enabled"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                    data-testid="button-save-webhook"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Payload Format</CardTitle>
            <CardDescription>
              The data structure sent to your webhook endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-xs overflow-x-auto">
{`{
  "event": "registration.created",
  "data": {
    "registrationId": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "address": "123 Main St",
    "city": "Cincinnati",
    "state": "OH",
    "zipCode": "45202",
    "eventTitle": "Loads of Love - Morning Event",
    "eventDate": "Tuesday, January 14, 2025",
    "eventTime": "9:00 AM - 11:00 AM",
    "eventLocation": "Laundromat Name, Address",
    "status": "confirmed",
    "cancelUrl": "https://your-domain.com/cancel/token"
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

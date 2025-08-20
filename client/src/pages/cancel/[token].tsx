import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function CancelRegistration() {
  const { token } = useParams();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/cancel/${token}`);
      return response.json();
    },
    onSuccess: () => {
      setStatus('success');
      toast({
        title: "Registration Cancelled",
        description: "Your registration has been successfully cancelled.",
      });
    },
    onError: (error: any) => {
      setStatus('error');
      toast({
        title: "Cancellation Failed",
        description: error.message || "Unable to cancel registration",
        variant: "destructive",
      });
    },
  });

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
            <p className="text-gray-600">This cancellation link is not valid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">CLH</span>
          </div>
          <CardTitle className="text-xl">Cancel Registration</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'idle' && (
            <>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel your Loads of Love registration?
              </p>
              <div className="space-y-3">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel My Registration"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.close()}
                >
                  Keep My Registration
                </Button>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Registration Cancelled
              </h3>
              <p className="text-gray-600 mb-6">
                Your registration has been successfully cancelled. Your spot may be given to someone on the waitlist.
              </p>
              <Button onClick={() => window.close()}>
                Close
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cancellation Failed
              </h3>
              <p className="text-gray-600 mb-6">
                Unable to cancel your registration. Please contact Christ's Loving Hands at 513-367-7746.
              </p>
              <Button 
                variant="outline"
                onClick={() => setStatus('idle')}
              >
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, MapPin, Mail, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function RegistrationSuccess() {
  const [location, setLocation] = useLocation();
  
  // Get registration details from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const eventTitle = urlParams.get('eventTitle');
  const eventLocation = urlParams.get('eventLocation');
  const startTime = urlParams.get('startTime');
  const endTime = urlParams.get('endTime');
  const userEmail = urlParams.get('email');
  const status = urlParams.get('status') || 'confirmed';

  // Redirect to home if no registration details
  useEffect(() => {
    if (!eventTitle || !startTime) {
      setLocation('/');
    }
  }, [eventTitle, startTime, setLocation]);

  if (!eventTitle || !startTime) {
    return null;
  }

  const handleBackToHome = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardContent className="p-8 text-center">
            {/* Success Icon */}
            <div className="mb-6">
              <div className={`w-20 h-20 ${status === 'waitlist' ? 'bg-yellow-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <CheckCircle className={`w-12 h-12 ${status === 'waitlist' ? 'text-yellow-600' : 'text-green-600'}`} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {status === 'waitlist' ? 'Added to Waitlist!' : 'Registration Complete!'}
              </h1>
              <p className="text-gray-600">
                {status === 'waitlist' 
                  ? "You're on the waitlist and we'll notify you if a spot opens up"
                  : "You're all set for your laundry appointment"
                }
              </p>
            </div>

            {/* Appointment Details */}
            <div className={`${status === 'waitlist' ? 'bg-yellow-50' : 'bg-blue-50'} p-4 rounded-lg mb-6 text-left`}>
              <h2 className="font-semibold text-gray-900 mb-3">
                {status === 'waitlist' ? 'Waitlist Details' : 'Your Appointment Details'}
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-3 text-blue-600 flex-shrink-0" />
                  <span className="font-medium">
                    {startTime && format(new Date(startTime), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-3 text-blue-600 flex-shrink-0" />
                  <span>
                    {startTime && endTime && `${format(new Date(startTime), 'h:mm a')} - ${format(new Date(endTime), 'h:mm a')}`}
                  </span>
                </div>
                
                <div className="flex items-start text-sm">
                  <MapPin className="w-4 h-4 mr-3 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{eventLocation}</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="text-left mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start">
                  <Mail className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>
                    A confirmation email has been sent to {userEmail}
                  </span>
                </div>
                <div className="flex items-start">
                  <MessageSquare className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>
                    You may receive a text reminder before your appointment
                  </span>
                </div>
              </div>
            </div>

            {/* Important Reminders */}
            <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Important Reminders</h3>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>• Please arrive on time for your appointment</li>
                <li>• Cancel within 24 hours if you can't make it</li>
                <li>• Bring your laundry and any needed supplies</li>
                <li>• Have transportation arranged to the location</li>
              </ul>
            </div>

            {/* Action Button */}
            <Button 
              onClick={handleBackToHome}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
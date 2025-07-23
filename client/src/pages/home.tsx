import { useState } from "react";
import Header from "@/components/header";
import TimeSlotGrid from "@/components/time-slot-grid";
import RegistrationForm from "@/components/registration-form";
import HowItWorks from "@/components/how-it-works";
import { useEvents } from "@/hooks/use-events";
import { type TimeSlot } from "@shared/schema";

export default function Home() {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const { data: events, isLoading, error } = useEvents();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Unable to Load Events
            </h2>
            <p className="text-gray-600">
              Please try again later or contact us at (555) 123-4567
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Reserve Your Spot
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Choose your preferred time slot and complete your reservation below.
          </p>
          
          {isLoading ? (
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Loading Available Time Slots...
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white border-2 border-gray-200 rounded-xl p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded mb-3"></div>
                    <div className="h-6 bg-gray-200 rounded w-24 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : events && events.length > 0 ? (
            <TimeSlotGrid 
              events={events} 
              selectedTimeSlot={selectedTimeSlot}
              onTimeSlotSelect={setSelectedTimeSlot}
            />
          ) : (
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                No Events Available
              </h3>
              <p className="text-gray-600">
                There are no upcoming events scheduled at this time. Please check back later.
              </p>
            </div>
          )}
          
          {selectedTimeSlot && (
            <RegistrationForm 
              timeSlot={selectedTimeSlot}
              onSuccess={() => setSelectedTimeSlot(null)}
            />
          )}
        </div>
      </section>
      
      <HowItWorks />
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 mb-2">Christ's Loving Hands - Loads of Love</p>
          <p className="text-sm text-gray-500">
            Questions? Contact us at 513-367-7746 or info@christslovinghands.org
          </p>
        </div>
      </footer>
    </div>
  );
}

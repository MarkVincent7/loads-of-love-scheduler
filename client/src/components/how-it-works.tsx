export default function HowItWorks() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">1</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Select Your Time</h4>
            <p className="text-gray-600">Choose from available time slots that work best for your schedule.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">2</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Reserve Your Spot</h4>
            <p className="text-gray-600">Fill out the simple form with your contact information.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">3</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Come & Enjoy</h4>
            <p className="text-gray-600">Arrive at your scheduled time with your laundry - it's completely free!</p>
          </div>
        </div>
      </div>
    </section>
  );
}

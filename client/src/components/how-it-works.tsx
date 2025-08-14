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
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Reserve Your Spot</h4>
            <p className="text-gray-600">Choose your preferred time slot and fill out the simple registration form. We'll confirm your reservation right away.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">2</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Bring Your Laundry</h4>
            <p className="text-gray-600">Show up during your scheduled time with your dirty clothes. We'll provide all the soap and supplies you need.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">3</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Clean & Fresh</h4>
            <p className="text-gray-600">Stay with your clothes during the entire washing and drying process while connecting with community. Leave with clean laundry and a smile!</p>
          </div>
        </div>
      </div>
    </section>
  );
}

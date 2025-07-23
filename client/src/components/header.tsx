export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {/* Christ's Loving Hands logo */}
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">CLH</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Christ's Loving Hands</h1>
              <p className="text-sm text-gray-500">Loads of Love</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

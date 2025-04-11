"use client";

export default function Home() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-gray-800/30 backdrop-blur-md rounded-xl p-8 shadow-lg border border-gray-700/50">
          
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Collected Zakat */}
            <div className="bg-gray-900/50 rounded-lg p-6 border border-emerald-700/50">
              <div className="text-gray-400 mb-2">Total Zakat Collected</div>
              <div className="text-4xl font-bold text-emerald-400 mb-1">RM 1,457,826</div>
              
            </div>
            
            {/* Distributed Zakat */}
            <div className="bg-gray-900/50 rounded-lg p-6 border border-emerald-700/50">
              <div className="text-gray-400 mb-2">Total Zakat Distribution</div>
              <div className="text-4xl font-bold text-emerald-400 mb-1">RM 965,412</div>
             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

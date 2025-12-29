import React from 'react';
import { ChefHat } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[60] bg-gray-900 flex flex-col items-center justify-center h-screen w-screen">
      {/* Center Content */}
      <div className="flex flex-col items-center animate-pulse">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-white/10">
           <ChefHat size={40} className="text-gray-900" strokeWidth={2} />
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight text-center">
          The Malabar House
        </h1>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-12">
        <p className="text-white/40 text-[10px] sm:text-xs font-medium uppercase tracking-[0.25em] text-center">
          Premium Dining Experience
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
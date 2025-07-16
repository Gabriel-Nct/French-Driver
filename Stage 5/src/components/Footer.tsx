import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">French Driver</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Révolutionnons ensemble l'expérience de transport en France
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-400">
            <p>&copy; 2025 French Driver. Tous droits réservés.</p>
            <div className="flex items-center">
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
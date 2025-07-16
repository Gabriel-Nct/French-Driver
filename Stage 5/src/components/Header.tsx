import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg' 
        : 'bg-white shadow-md'
    }`}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 cursor-pointer"
                onClick={() => scrollToSection('hero')}>
              French Driver
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Fonctionnalités
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              À Propos
            </button>
            <button
              onClick={() => scrollToSection('features')}
                className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-900 transition-colors duration-200"
            >
              Découvrir
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors duration-200"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => scrollToSection('features')}
                className="text-left text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                Fonctionnalités
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-left text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                À Propos
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-900 transition-colors duration-200 w-fit"
              >
                Découvrir
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
import { useState } from "react";
// import { Link } from "react-router-dom"; // Remplacez par votre router
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = () => setMobileOpen((o) => !o);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-black/90 backdrop-blur-md text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo minimaliste modernisé */}
        <a 
          href="/" 
          className="group relative transition-all duration-300 hover:scale-105"
        >
          <div className="text-xl font-semibold tracking-tight">
            <span className="text-white group-hover:text-gray-200 transition-colors duration-300">
              French
            </span>
            <span className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
              Driver
            </span>
          </div>
        </a>

        {/* Navigation desktop */}
        <div className="hidden md:flex items-center space-x-8">
          <a 
            href="/contact" 
            className="text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium tracking-wide"
          >
            Contact
          </a>
          <a 
            href="/disposition" 
            className="text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium tracking-wide"
          >
            Mise à disposition
          </a>
        </div>

        {/* Burger minimaliste */}
        <button
          onClick={toggleMobile}
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors duration-300"
          aria-label="Ouvrir le menu"
        >
          {mobileOpen ? (
            <X size={24} className="transform rotate-0 hover:rotate-90 transition-transform duration-300" />
          ) : (
            <Menu size={24} className="transform hover:scale-110 transition-transform duration-300" />
          )}
        </button>
      </nav>

      {/* Mobile menu avec navigation */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
        mobileOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-black/95 backdrop-blur-sm border-t border-gray-800/50">
          <div className="px-6 py-4 space-y-3">
            <a 
              href="/contact" 
              className="block text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </a>
            <a 
              href="/disposition" 
              className="block text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Mise à disposition
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
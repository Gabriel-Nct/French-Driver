// src/components/Navbar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Définition des styles de lien
const linkVariants = cva(
  'px-3 py-2 rounded-md text-sm font-medium transition',
  {
    variants: {
      variant: {
        active: 'text-white bg-gray-900',
        default: 'text-gray-300 hover:text-white hover:bg-gray-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-black shadow-md z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Titre */}
          <NavLink to="/" className="text-white text-xl font-bold">
            French Driver
          </NavLink>

          {/* Liens desktop */}
          <div className="hidden md:flex space-x-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(linkVariants({ variant: isActive ? 'active' : 'default' }))
              }
            >
              Accueil
            </NavLink>
            <NavLink
              to="/booking"
              className={({ isActive }) =>
                cn(linkVariants({ variant: isActive ? 'active' : 'default' }))
              }
            >
              Réserver
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(linkVariants({ variant: isActive ? 'active' : 'default' }))
              }
            >
              Dashboard
            </NavLink>
          </div>

          {/* Ici tu pourras ajouter un menu mobile */}
          <div className="md:hidden">
            {/* Bouton hamburger… */}
          </div>
        </div>
      </div>
    </nav>
  );
}

import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Styles communs des liens (desktop & mobile)
  const navBase =
    "block px-4 py-2 rounded-md text-sm font-medium transition-colors";
  const inactive = "text-gray-300 hover:text-white hover:bg-gray-800";
  const active = "text-white bg-gray-900";

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-black text-white shadow-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:py-3">
        {/* Logo */}
        <Link to="/" className="text-xl font-medium tracking-tight">
          French&nbsp;Driver
        </Link>

        {/* Zone droite – desktop */}
        <div className="hidden md:flex items-center space-x-4">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              cn(navBase, isActive ? active : inactive)
            }
          >
            Connexion
          </NavLink>
          <Button asChild>
            <Link to="/register">S’inscrire</Link>
          </Button>
        </div>

        {/* Burger */}
        <button
          onClick={toggleMobile}
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white"
          aria-label="Ouvrir le menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Menu mobile (slide-down) */}
      {mobileOpen && (
        <div className="md:hidden bg-black border-t border-gray-800">
          <div className="space-y-1 px-2 pb-4 pt-2">
            <NavLink
              to="/login"
              onClick={toggleMobile}
              className={({ isActive }) =>
                cn(navBase, isActive ? active : inactive, "w-full")
              }
            >
              Connexion
            </NavLink>
            <Button
              asChild
              className="w-full justify-start"
              onClick={toggleMobile}
            >
              <Link to="/register">S’inscrire</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

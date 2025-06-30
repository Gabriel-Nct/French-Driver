import { useState, useEffect, useCallback } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  /* ------------------------------------------------------------------ */
  /*  Petite fonction réutilisable pour relire localStorage             */
  /* ------------------------------------------------------------------ */
  const readUser = useCallback(() => {
    const raw = localStorage.getItem("user");
    setCurrentUser(raw ? JSON.parse(raw) : null);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  À l’init + écoute des changements (storage & userChanged)         */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    readUser();                                // 1ʳᵉ lecture

    window.addEventListener("storage", readUser);
    window.addEventListener("userChanged", readUser);

    return () => {
      window.removeEventListener("storage", readUser);
      window.removeEventListener("userChanged", readUser);
    };
  }, [readUser]);

  /* ------------------------------------------------------------------ */
  /*  Actions                                                           */
  /* ------------------------------------------------------------------ */
  const toggleMobile = () => setMobileOpen((o) => !o);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged"));   // 🔔
    navigate("/login");
  };

  /* ------------------------------------------------------------------ */
  /*  Styles                                                            */
  /* ------------------------------------------------------------------ */
  const navBase =
    "block px-4 py-2 rounded-md text-sm font-medium transition-colors";
  const inactive = "text-gray-300 hover:text-white hover:bg-gray-800";
  const active = "text-white bg-gray-900";

  /* ------------------------------------------------------------------ */
  /*  Rendu                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-black text-white shadow-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:py-3">
        {/* Logo */}
        <Link to="/" className="text-xl font-medium tracking-tight">
          French&nbsp;Driver
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          {currentUser ? (
            <>
              <NavLink
                to={`/customer/${currentUser.id}`}
                className={({ isActive }) =>
                  cn(navBase, isActive ? active : inactive)
                }
              >
                Mon&nbsp;compte
              </NavLink>
              <Button variant="outline" onClick={logout}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
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

      {/* Mobile */}
      {mobileOpen && (
        <div className="md:hidden bg-black border-t border-gray-800">
          <div className="space-y-1 px-2 pb-4 pt-2">
            {currentUser ? (
              <>
                <NavLink
                  to={`/customer/${currentUser.id}`}
                  onClick={toggleMobile}
                  className={({ isActive }) =>
                    cn(navBase, isActive ? active : inactive, "w-full")
                  }
                >
                  Mon&nbsp;compte
                </NavLink>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    toggleMobile();
                    logout();
                  }}
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

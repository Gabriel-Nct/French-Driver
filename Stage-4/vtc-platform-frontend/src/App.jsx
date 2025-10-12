// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import 'leaflet/dist/leaflet.css';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPageAdmin from "./pages/LoginPageAdmin";
import CustomerPage, { mockClient } from "./pages/CustomerPage.jsx";
import AdminDashboard from "./pages/AdminDashboard";
import ContactPage from "./pages/ContactPage"; // ⬅️ ajout
import DispoPage from "./pages/DispoPage";
import ConditionsPage from "./pages/ConditionsPage";
import ReservationMessageDemo from "./pages/ReservationMessageDemo";
import RgpdPage from "./pages/RgpdPage";
import MentionsLegalesPage from "./pages/MentionsLegalesPage";



export default function App() {
  return (
    <>
      <Navbar />
      <div className="p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<LoginPageAdmin />} />
          <Route path="/customer/:id" element={<CustomerPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/contact" element={<ContactPage />} /> {/* ⬅️ ajout */}
          <Route path="/disposition" element={<DispoPage />} />
          <Route path="/conditions" element={<ConditionsPage />} />
          <Route path="/reservation/confirmation" element={<ReservationMessageDemo />} />
          <Route path="/rgpd" element={<RgpdPage />} />
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        </Routes>
      </div>
    </>
  );
}

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
        </Routes>
      </div>
    </>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import About from "../pages/About/About";

import Login from "../pages/auth/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";
import ClaimMembership from "../pages/auth/ClaimMembership";
import VerifyOTP from "../pages/auth/VerifyOTP";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Pages */}

        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        {/* Authentication */}

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Member Portal */}

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        {/* 404 */}

        <Route path="*" element={<NotFound />} />

        {/* Membership Activation */}
        <Route path="/activate-membership" element={<ClaimMembership />} />

         {/* OTP Verification */}
        <Route path="/verify-otp" element={<VerifyOTP />} />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;

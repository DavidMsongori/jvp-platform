import { BrowserRouter, Routes, Route } from "react-router-dom";

/* Public Pages */
import Home from "../pages/Home";
import About from "../pages/about/About";
import Programs from "../pages/programs/Programs";
import Events from "../pages/events/Events";
import News from "../pages/news/News";
import Membership from "../pages/membership/Membership";
import Summit from "../pages/summit/Summit";
import Contact from "../pages/contact/Contact";

/* Authentication */
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ClaimMembership from "../pages/auth/ClaimMembership";
import VerifyOTP from "../pages/auth/VerifyOTP";

/* Member Portal */
import Dashboard from "../pages/dashboard/Dashboard";
import Profile from "../pages/dashboard/Profile";

/* Other */
import NotFound from "../pages/NotFound";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/events" element={<Events />} />
        <Route path="/news" element={<News />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/summit" element={<Summit />} />
        <Route path="/contact" element={<Contact />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/activate-membership"
          element={<ClaimMembership />}
        />
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Member Portal */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
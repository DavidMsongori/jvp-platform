import { BrowserRouter, Routes, Route } from "react-router-dom";

/* ==========================================
   ROUTE GUARDS
========================================== */

import ProtectedRoute from "./ProtectedRoute";
import PermissionRoute from "./PermissionRoute";

import { PERMISSIONS } from "../utils/permissions";

/* ==========================================
   PUBLIC WEBSITE
========================================== */

import Home from "../pages/Home";
import About from "../pages/about/About";
import Programs from "../pages/programs/Programs";
import Events from "../pages/events/Events";
import News from "../pages/news/News";
import Membership from "../pages/membership/Membership";
import Summit from "../pages/summit/SummitPage";
import Contact from "../pages/contact/Contact";

/* ==========================================
   AUTHENTICATION
========================================== */

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ActivateMembership from "../pages/auth/ActivateMembership";
import VerifyOTP from "../pages/auth/VerifyOTP";
import CreatePassword from "../pages/auth/CreatePassword";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

/* ==========================================
   PAYMENT
========================================== */

import Payment from "../pages/payment/Payment";
import PaymentSuccess from "../pages/payment/PaymentSuccess";
import PaymentFailed from "../pages/payment/PaymentFailed";

/* ==========================================
   MEMBER LAYOUT
========================================== */

import DashboardLayout from "../layouts/DashboardLayout";

/* ==========================================
   MEMBER PAGES
========================================== */

import Dashboard from "../pages/dashboard/Dashboard";
import Profile from "../pages/profile/Profile";
import MembershipCardPage from "../features/member-card/MembershipCardPage";
import EventsDashboard from "../pages/dashboard/Events";
import ProgramsDashboard from "../pages/dashboard/Programs";
import Certificates from "../pages/dashboard/Certificates";
import Notifications from "../pages/dashboard/Notifications";
import Settings from "../pages/dashboard/settings/Settings";

/* ==========================================
   ADMIN LAYOUT
========================================== */

import AdminLayout from "../layouts/AdminLayout";

/* ==========================================
   ADMIN PAGES
========================================== */

import AdminDashboard from "../pages/admin/AdminDashboard";
import Members from "../pages/admin/Members";
import MemberDetails from "../pages/admin/MemberDetails";
import Payments from "../pages/admin/Payments";
import AdminEvents from "../pages/admin/Events";
import EventForm from "../pages/admin/EventForm";

/* ==========================================
   OTHER
========================================== */

import NotFound from "../pages/NotFound";

function AppRoutes() {

  return (

    <BrowserRouter>

      <Routes>

        {/* =====================================
            PUBLIC WEBSITE
        ====================================== */}

        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/events" element={<Events />} />
        <Route path="/news" element={<News />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/summit" element={<Summit />} />
        <Route path="/contact" element={<Contact />} />

        {/* =====================================
            AUTHENTICATION
        ====================================== */}

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/activate-membership"
          element={<ActivateMembership />}
        />

        <Route
          path="/verify-otp"
          element={<VerifyOTP />}
        />

        <Route
          path="/create-password"
          element={<CreatePassword />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* =====================================
            PAYMENT
        ====================================== */}

        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment/success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment/failed"
          element={
            <ProtectedRoute>
              <PaymentFailed />
            </ProtectedRoute>
          }
        />

        {/* =====================================
            MEMBER DASHBOARD
        ====================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >

          <Route
            index
            element={<Dashboard />}
          />

          <Route
            path="profile"
            element={<Profile />}
          />

          <Route
  path="membership-card"
  element={<MembershipCardPage />}
/>

          <Route
            path="events"
            element={<EventsDashboard />}
          />

          <Route
            path="programs"
            element={<ProgramsDashboard />}
          />

          <Route
            path="certificates"
            element={<Certificates />}
          />

          <Route
            path="notifications"
            element={<Notifications />}
          />

          <Route
            path="settings"
            element={<Settings />}
          />

        </Route>

        {/* =====================================
            ADMIN DASHBOARD
        ====================================== */}

        <Route
          path="/admin"
          element={
            <PermissionRoute
              permission={PERMISSIONS.VIEW_MEMBERS}
            >
              <AdminLayout />
            </PermissionRoute>
          }
        >

          <Route
            index
            element={
              <PermissionRoute
                permission={PERMISSIONS.VIEW_REPORTS}
              >
                <AdminDashboard />
              </PermissionRoute>
            }
          />

          <Route
            path="members"
            element={
              <PermissionRoute
                permission={PERMISSIONS.VIEW_MEMBERS}
              >
                <Members />
              </PermissionRoute>
            }
          />

          <Route
            path="members/:id"
            element={
              <PermissionRoute
                permission={PERMISSIONS.VIEW_MEMBERS}
              >
                <MemberDetails />
              </PermissionRoute>
            }
          />

          <Route
            path="payments"
            element={
              <PermissionRoute
                permission={PERMISSIONS.VIEW_PAYMENTS}
              >
                <Payments />
              </PermissionRoute>
            }
          />

          <Route
            path="events"
            element={
              <PermissionRoute
                permission={PERMISSIONS.VIEW_EVENTS}
              >
                <AdminEvents />
              </PermissionRoute>
            }
          />

          <Route
            path="events/new"
            element={
              <PermissionRoute
                permission={PERMISSIONS.CREATE_EVENT}
              >
                <EventForm />
              </PermissionRoute>
            }
          />

          <Route
            path="events/:id/edit"
            element={
              <PermissionRoute
                permission={PERMISSIONS.EDIT_EVENT}
              >
                <EventForm />
              </PermissionRoute>
            }
          />

        </Route>

        {/* =====================================
            404
        ====================================== */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>

    </BrowserRouter>

  );

}

export default AppRoutes;
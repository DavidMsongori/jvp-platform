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
import Event from "../pages/events/Event";
import News from "../pages/news/News";
import Membership from "../pages/membership/Membership";
import Summit from "../pages/summit/SummitPage";
import SummitRegistration from "../pages/summit/SummitRegistration";
import SummitTicketLookup from "../pages/summit/SummitTicketLookup";
import SummitVerifyTicket from "../pages/summit/SummitVerifyTicket";
import SummitPlanningCommittee from "../pages/summit/SummitPlanningCommittee";
import ExhibitorRegistration from "../pages/summit/ExhibitorRegistration";
import SummitGuests from "../pages/summit/SummitGuests";
import SummitPosterForm from "../pages/summit-poster/SummitPosterForm";
import SummitPosterStatus from "../pages/summit-poster/SummitPosterStatus";
import Contact from "../pages/contact/Contact";
import Leadership from "../pages/leadership/Leadership";

/* ==========================================
   PUBLIC ELECTIONS
========================================== */

import PublicElection from "../pages/elections/PublicElection";
import ElectionDetails from "../pages/elections/ElectionDetails";

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
import EventDetails from "../pages/dashboard/EventDetails";
import ProgramsDashboard from "../pages/dashboard/Programs";
import Certificates from "../pages/dashboard/Certificates";
import Notifications from "../pages/dashboard/Notifications";
import Settings from "../pages/dashboard/settings/Settings";

import LeadershipCard from "../pages/leadership/LeadershipCard";

/* ==========================================
   MEMBER ELECTIONS
========================================== */

import Elections from "../pages/elections/Elections";
import ElectionApplication from "../pages/elections/ElectionApplication";
import MyApplications from "../pages/elections/MyApplications";
import Aspirants from "../pages/elections/Aspirants";
import Voting from "../pages/elections/Voting";
import MyVotes from "../pages/elections/MyVotes";

/* ==========================================
   LEADERSHIP WORKSPACE
========================================== */

import LeadershipLayout from "../pages/leadership/LeadershipLayout";
import LeadershipOverview from "../pages/leadership/LeadershipOverview";

import LeadershipMembers from "../pages/leadership/LeadershipMembers";
import LeadershipMeetings from "../pages/leadership/LeadershipMeetings";
import LeadershipAnnouncements from "../pages/leadership/LeadershipAnnouncements";
import LeadershipReports from "../pages/leadership/LeadershipReports";
import LeadershipDocuments from "../pages/leadership/LeadershipDocuments";
import LeadershipCommittees from "../pages/leadership/LeadershipCommittees";
import LeadershipAnalytics from "../pages/leadership/LeadershipAnalytics";
import LeadershipSettings from "../pages/leadership/LeadershipSettings";
import LeadershipMeetingDetails from "../pages/LeadershipMeetingDetails";

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
import LeadershipPage from "../pages/admin/leadership/LeadershipPage";

/* ==========================================
   ADMIN EVENTS
========================================== */

import AdminEvents from "../pages/admin/events/Events";
import CreateEvent from "../pages/admin/events/CreateEvent";
import EditEvent from "../pages/admin/events/EditEvent";
import ViewEvent from "../pages/admin/events/ViewEvent";

/* ==========================================
   ADMIN SUMMIT
========================================== */

import SummitDashboard from "../pages/admin/summit/SummitDashboard";
import SummitRegistrations from "../pages/admin/summit/SummitRegistrations";
import SummitRegistrationDetails from "../pages/admin/summit/SummitRegistrationDetails";
import SummitCheckIn from "../pages/admin/summit/SummitCheckIn";
import AdminExhibitors from "../pages/admin/summit/AdminExhibitors";
import AdminSummitPosters from "../pages/admin/AdminSummitPosters";

/* ==========================================
   ADMIN ELECTIONS
========================================== */

import AdminElections from "../pages/admin/elections/AdminElections";
import CreateElection from "../pages/admin/elections/CreateElection";
import AdminElectionDetails from "../pages/admin/elections/AdminElectionDetails";
import EditElection from "../pages/admin/elections/EditElection";
import ElectionApplications from "../pages/admin/elections/ElectionApplications";
import ElectionAspirants from "../pages/admin/elections/ElectionAspirants";
import ElectionResults from "../pages/admin/elections/ElectionResults";

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

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/programs"
          element={<Programs />}
        />

        <Route
          path="/events"
          element={<Events />}
        />

        <Route
          path="/events/:slug"
          element={<Event />}
        />

        <Route
          path="/news"
          element={<News />}
        />

        <Route
          path="/membership"
          element={<Membership />}
        />

        <Route
          path="/leadership"
          element={<Leadership />}
        />

        {/* =====================================
            PUBLIC ELECTIONS
        ====================================== */}

        {/* Public Elections Listing */}

        <Route
          path="/elections"
          element={<PublicElection />}
        />

        {/* Public Election Details */}

        <Route
          path="/elections/:electionId"
          element={<ElectionDetails />}
        />

        {/* =====================================
            SUMMIT
        ====================================== */}

        <Route
          path="/summit"
          element={<Summit />}
        />

        <Route
          path="/summit/register"
          element={<SummitRegistration />}
        />

        <Route
          path="/summit/ticket"
          element={<SummitTicketLookup />}
        />

        <Route
          path="/summit/verify-ticket"
          element={<SummitVerifyTicket />}
        />

        <Route
          path="/summit/planning-committee"
          element={<SummitPlanningCommittee />}
        />

        <Route
          path="/summit/guests"
          element={<SummitGuests />}
        />

        <Route
          path="/summit/poster"
          element={<SummitPosterForm />}
        />

        <Route
          path="/summit/poster/status"
          element={<SummitPosterStatus />}
        />

        <Route
          path="/summit/exhibitor-register"
          element={<ExhibitorRegistration />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        {/* =====================================
            AUTHENTICATION
        ====================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

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

          {/* Dashboard Home */}

          <Route
            index
            element={<Dashboard />}
          />

          {/* Profile */}

          <Route
            path="profile"
            element={<Profile />}
          />

          {/* Membership Card */}

          <Route
            path="membership-card"
            element={<MembershipCardPage />}
          />

          {/* Events */}

          <Route
            path="events"
            element={<EventsDashboard />}
          />

          <Route
            path="events/:id"
            element={<EventDetails />}
          />

          {/* Programs */}

          <Route
            path="programs"
            element={<ProgramsDashboard />}
          />

          {/* Certificates */}

          <Route
            path="certificates"
            element={<Certificates />}
          />

          {/* Notifications */}

          <Route
            path="notifications"
            element={<Notifications />}
          />

          {/* Settings */}

          <Route
            path="settings"
            element={<Settings />}
          />

          {/* =====================================
              MEMBER ELECTIONS
          ====================================== */}

          {/* Election Dashboard */}

          <Route
            path="elections"
            element={<Elections />}
          />

          {/* My Applications */}

          <Route
            path="elections/my-applications"
            element={<MyApplications />}
          />

          {/* My Votes */}

          <Route
            path="elections/my-votes"
            element={<MyVotes />}
          />

          {/* Election Details */}

          <Route
            path="elections/:electionId"
            element={<ElectionDetails />}
          />

          {/* Election Aspirants */}

          <Route
            path="elections/:electionId/aspirants"
            element={<Aspirants />}
          />

          {/* Position Application */}

          <Route
            path="elections/:electionId/positions/:positionId/apply"
            element={<ElectionApplication />}
          />

          {/* Position Voting */}

          <Route
            path="elections/:electionId/positions/:positionId/vote"
            element={<Voting />}
          />

        </Route>

        {/* =====================================
            LEADERSHIP WORKSPACE
        ====================================== */}

        <Route
          path="/workspace/leadership"
          element={
            <ProtectedRoute>
              <LeadershipLayout />
            </ProtectedRoute>
          }
        >

          <Route
            index
            element={<LeadershipOverview />}
          />

          <Route
            path="card"
            element={<LeadershipCard />}
          />

          <Route
            path="members"
            element={<LeadershipMembers />}
          />

          <Route
            path="meetings"
            element={<LeadershipMeetings />}
          />

          <Route
            path="meetings/:meetingId"
            element={<LeadershipMeetingDetails />}
          />

          <Route
            path="announcements"
            element={<LeadershipAnnouncements />}
          />

          <Route
            path="reports"
            element={<LeadershipReports />}
          />

          <Route
            path="documents"
            element={<LeadershipDocuments />}
          />

          <Route
            path="committees"
            element={<LeadershipCommittees />}
          />

          <Route
            path="analytics"
            element={<LeadershipAnalytics />}
          />

          <Route
            path="settings"
            element={<LeadershipSettings />}
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

          {/* Admin Home */}

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

          {/* =====================================
              MEMBERS
          ====================================== */}

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

          {/* =====================================
              LEADERSHIP
          ====================================== */}

          <Route
            path="leadership"
            element={
              <PermissionRoute
                permission={PERMISSIONS.VIEW_MEMBERS}
              >
                <LeadershipPage />
              </PermissionRoute>
            }
          />

          {/* =====================================
              PAYMENTS
          ====================================== */}

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

          {/* =====================================
              EVENTS
          ====================================== */}

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
            path="events/create"
            element={
              <PermissionRoute
                permission={PERMISSIONS.CREATE_EVENT}
              >
                <CreateEvent />
              </PermissionRoute>
            }
          />

          <Route
            path="events/:id"
            element={
              <PermissionRoute
                permission={PERMISSIONS.VIEW_EVENTS}
              >
                <ViewEvent />
              </PermissionRoute>
            }
          />

          <Route
            path="events/:id/edit"
            element={
              <PermissionRoute
                permission={PERMISSIONS.EDIT_EVENT}
              >
                <EditEvent />
              </PermissionRoute>
            }
          />

          {/* =====================================
              SUMMIT
          ====================================== */}

          <Route
            path="summit"
            element={
              <PermissionRoute
                permission={PERMISSIONS.VIEW_EVENTS}
              >
                <SummitDashboard />
              </PermissionRoute>
            }
          />

          <Route
            path="summit/registrations"
            element={
              <PermissionRoute
                permission={PERMISSIONS.VIEW_EVENTS}
              >
                <SummitRegistrations />
              </PermissionRoute>
            }
          />

          <Route
            path="summit/registrations/:registrationId"
            element={
              <PermissionRoute
                permission={PERMISSIONS.VIEW_EVENTS}
              >
                <SummitRegistrationDetails />
              </PermissionRoute>
            }
          />

          <Route
            path="summit/check-in"
            element={
              <PermissionRoute
                permission={PERMISSIONS.VIEW_EVENTS}
              >
                <SummitCheckIn />
              </PermissionRoute>
            }
          />

          <Route
            path="summit/exhibitors"
            element={<AdminExhibitors />}
          />

          <Route
            path="summit/posters"
            element={<AdminSummitPosters />}
          />

          {/* =====================================
              ADMIN ELECTIONS
          ====================================== */}

          <Route
            path="elections"
            element={
              <PermissionRoute
                permission={PERMISSIONS.MANAGE_ELECTIONS}
              >
                <AdminElections />
              </PermissionRoute>
            }
          />

          <Route
            path="elections/create"
            element={
              <PermissionRoute
                permission={PERMISSIONS.MANAGE_ELECTIONS}
              >
                <CreateElection />
              </PermissionRoute>
            }
          />

          <Route
            path="elections/applications"
            element={
              <PermissionRoute
                permission={PERMISSIONS.MANAGE_ELECTIONS}
              >
                <ElectionApplications />
              </PermissionRoute>
            }
          />

          <Route
            path="elections/aspirants"
            element={
              <PermissionRoute
                permission={PERMISSIONS.MANAGE_ELECTIONS}
              >
                <ElectionAspirants />
              </PermissionRoute>
            }
          />

          <Route
            path="elections/:electionId"
            element={
              <PermissionRoute
                permission={PERMISSIONS.MANAGE_ELECTIONS}
              >
                <AdminElectionDetails />
              </PermissionRoute>
            }
          />

          <Route
            path="elections/:electionId/edit"
            element={
              <PermissionRoute
                permission={PERMISSIONS.MANAGE_ELECTIONS}
              >
                <EditElection />
              </PermissionRoute>
            }
          />

          <Route
            path="elections/:electionId/results"
            element={
              <PermissionRoute
                permission={PERMISSIONS.MANAGE_ELECTIONS}
              >
                <ElectionResults />
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
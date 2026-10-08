import React from "react";
import ReactDOM from "react-dom/client";

import "./styles/global.css";
import "./styles/variables.css";
import "./styles/utilities.css";
import "./styles/buttons.css";
import "./styles/section.css";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { DashboardProvider } from "./context/DashboardContext";
import { ProfileProvider } from "./context/ProfileContext";
import { PaymentProvider } from "./context/PaymentContext";
import { EventProvider } from "./context/EventContext";
import { LeaderProvider } from "./context/LeaderContext";
import { LeadershipDashboardProvider } from "./context/LeadershipDashboardContext";
import { SummitProvider } from "./context/SummitContext";
import { NewsProvider } from "./context/NewsContext";
import { ContactProvider } from "./context/ContactContext";
import { LeadershipProvider } from "./context/LeadershipContext";

import {
  installProfileImageFallback,
} from "./utils/installProfileImageFallback";


/* ==========================================
   INSTALL GLOBAL IMAGE FALLBACK
========================================== */

installProfileImageFallback();


ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>

    <AuthProvider>

      <DashboardProvider>

        <LeadershipDashboardProvider>

          <ProfileProvider>

            <PaymentProvider>

              <EventProvider>

                <LeaderProvider>

                  <SummitProvider>

                    <NewsProvider>

                      <ContactProvider>

                        <LeadershipProvider>

                        <App />

                        </LeadershipProvider>

                      </ContactProvider>

                    </NewsProvider>

                  </SummitProvider>

                </LeaderProvider>

              </EventProvider>

            </PaymentProvider>

          </ProfileProvider>

        </LeadershipDashboardProvider>

      </DashboardProvider>

    </AuthProvider>

  </React.StrictMode>
);
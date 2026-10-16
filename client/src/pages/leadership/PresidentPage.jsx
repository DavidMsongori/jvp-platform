
import PresidentHero from "../../components/president/PresidentHero";
import PresidentialMandate from "../../components/president/PresidentialMandate";
import PresidentialPriorities from "../../components/president/PresidentialPriorities";
import PresidencyTeam from "../../components/president/PresidencyTeam";
import PresidentialCoordination from "../../components/president/PresidentialCoordination";
import PresidentialImpact from "../../components/president/PresidentialImpact";
import PresidentialResources from "../../components/president/PresidentialResources";
import PresidentialCTA from "../../components/president/PresidentialCTA";


/* ==========================================================
   JVP PRESIDENT PAGE

   Sections:
   1. Presidential Hero
   2. Presidential Mandate
   3. Strategic Priorities
   4. Presidency Team
   5. Executive Coordination
   6. Programmes and Impact
   7. Presidential Resources
   8. Call to Action
========================================================== */

export default function PresidentPage() {
  return (
    <main className="president-page">
      {/* 1. PRESIDENTIAL HERO */}
      <PresidentHero />

      {/* 2. MANDATE OF THE OFFICE */}
      <PresidentialMandate />

      {/* 3. STRATEGIC PRIORITIES */}
      <PresidentialPriorities />

      {/* 4. PRESIDENCY TEAM AND ASSIGNED LEADERS */}
      <PresidencyTeam />

      {/* 5. EXECUTIVE COORDINATION */}
      <PresidentialCoordination />

      {/* 6. PROGRAMMES, PARTICIPATION AND IMPACT */}
      <PresidentialImpact />

      {/* 7. OFFICIAL RESOURCES AND COMMUNICATIONS */}
      <PresidentialResources />

      {/* 8. CLOSING CALL TO ACTION */}
      <PresidentialCTA />
    </main>
  );
}

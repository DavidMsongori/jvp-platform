import "./AuthLayout.css";

import AuthHero from "./AuthHero";

function AuthLayout({ children }) {
  return (
    <main className="auth-layout">

      {/* LEFT PANEL */}

      <div className="auth-left">

        <AuthHero />

      </div>

      {/* RIGHT PANEL */}

      <div className="auth-right">

        <div className="auth-card">

          {children}

        </div>

      </div>

    </main>
  );
}

export default AuthLayout;
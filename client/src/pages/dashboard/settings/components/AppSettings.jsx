import {
  Settings,
  Palette,
  Languages,
  Monitor,
  Smartphone,
  Info,
  Sparkles,
} from "lucide-react";

import "./AppSettings.css";

function AppSettings() {
  const version = "1.0.0";

  return (
    <div className="app-settings">

      {/* ===========================
          HEADER
      =========================== */}

      <div className="app-settings-header">

        <Settings size={30} />

        <div>

          <h2>Application Settings</h2>

          <p>

            Configure your JVP Connect application preferences.

          </p>

        </div>

      </div>

      {/* ===========================
          APPEARANCE
      =========================== */}

      <div className="app-settings-card">

        <h3>

          <Palette size={20} />

          Appearance

        </h3>

        <div className="setting-row">

          <div>

            <strong>Theme</strong>

            <span>

              Light mode is currently enabled.

            </span>

          </div>

          <button
            className="secondary-btn"
            disabled
          >
            Coming Soon
          </button>

        </div>

      </div>

      {/* ===========================
          LANGUAGE
      =========================== */}

      <div className="app-settings-card">

        <h3>

          <Languages size={20} />

          Language

        </h3>

        <div className="setting-row">

          <div>

            <strong>Display Language</strong>

            <span>

              English (Default)

            </span>

          </div>

          <button
            className="secondary-btn"
            disabled
          >
            Coming Soon
          </button>

        </div>

      </div>

      {/* ===========================
          APPLICATION INFO
      =========================== */}

      <div className="app-settings-card">

        <h3>

          <Info size={20} />

          Application Information

        </h3>

        <div className="app-info-grid">

          <div className="app-info-item">

            <Monitor size={20} />

            <div>

              <span>Platform</span>

              <strong>Web Application</strong>

            </div>

          </div>

          <div className="app-info-item">

            <Smartphone size={20} />

            <div>

              <span>Responsive</span>

              <strong>Desktop & Mobile</strong>

            </div>

          </div>

          <div className="app-info-item">

            <Sparkles size={20} />

            <div>

              <span>Version</span>

              <strong>{version}</strong>

            </div>

          </div>

        </div>

      </div>

      {/* ===========================
          COMING SOON
      =========================== */}

      <div className="app-note">

        <Sparkles size={22} />

        <div>

          <h4>More personalization is coming</h4>

          <p>

            Future updates will introduce Dark Mode, multilingual support,
            accessibility preferences, push notifications, offline access,
            and additional personalization features.

          </p>

        </div>

      </div>

    </div>
  );
}

export default AppSettings;
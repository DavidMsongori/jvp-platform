import {
  Shield,
  Download,
  Trash2,
  Lock,
  Clock3,
  Smartphone,
} from "lucide-react";

import "./PrivacySettings.css";

function PrivacySettings() {
  const handleDownload = () => {
    // TODO:
    // Download member data
    alert("Download feature coming soon.");
  };

  const handleDeleteRequest = () => {
    // TODO:
    // Submit account deletion request
    alert("Account deletion request feature coming soon.");
  };

  return (
    <div className="privacy-settings">

      {/* ===========================
          HEADER
      =========================== */}

      <div className="privacy-header">

        <Shield size={30} />

        <div>

          <h2>Privacy & Security</h2>

          <p>

            Manage your privacy, account security and personal data.

          </p>

        </div>

      </div>

      {/* ===========================
          SECURITY STATUS
      =========================== */}

      <div className="privacy-card">

        <h3>

          <Lock size={20} />

          Account Security

        </h3>

        <div className="privacy-info">

          <div className="privacy-item">

            <Clock3 size={18} />

            <div>

              <strong>Password</strong>

              <span>Password management will be available soon.</span>

            </div>

          </div>

          <div className="privacy-item">

            <Smartphone size={18} />

            <div>

              <strong>Two-Factor Authentication</strong>

              <span>Coming in a future update.</span>

            </div>

          </div>

        </div>

      </div>

      {/* ===========================
          DATA MANAGEMENT
      =========================== */}

      <div className="privacy-card">

        <h3>

          <Download size={20} />

          Your Data

        </h3>

        <p className="privacy-description">

          Download a copy of your membership information and profile data.

        </p>

        <button
          className="secondary-btn"
          onClick={handleDownload}
        >

          <Download size={18} />

          Download My Data

        </button>

      </div>

      {/* ===========================
          DANGER ZONE
      =========================== */}

      <div className="privacy-card danger-zone">

        <h3>

          <Trash2 size={20} />

          Danger Zone

        </h3>

        <p className="privacy-description">

          Request permanent deletion of your account. This request will be reviewed by the JVP administration before being processed.

        </p>

        <button
          className="danger-btn"
          onClick={handleDeleteRequest}
        >

          <Trash2 size={18} />

          Request Account Deletion

        </button>

      </div>

    </div>
  );
}

export default PrivacySettings;
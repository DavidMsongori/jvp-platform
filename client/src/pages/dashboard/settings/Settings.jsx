import { useState } from "react";
import {
  User,
  Bell,
  CreditCard,
  Shield,
  Settings as SettingsIcon,
} from "lucide-react";

import AccountSettings from "./components/AccountSettings";
import NotificationSettings from "./components/NotificationSettings";
import MembershipSettings from "./components/MembershipSettings";
import PrivacySettings from "./components/PrivacySettings";
import AppSettings from "./components/AppSettings";

import "./Settings.css";

function Settings() {
  const [activeTab, setActiveTab] = useState("account");

  const menuItems = [
    {
      id: "account",
      label: "Account",
      icon: <User size={20} />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell size={20} />,
    },
    {
      id: "membership",
      label: "Membership",
      icon: <CreditCard size={20} />,
    },
    {
      id: "privacy",
      label: "Privacy & Security",
      icon: <Shield size={20} />,
    },
    {
      id: "application",
      label: "Application",
      icon: <SettingsIcon size={20} />,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountSettings />;

      case "notifications":
        return <NotificationSettings />;

      case "membership":
        return <MembershipSettings />;

      case "privacy":
        return <PrivacySettings />;

      case "application":
        return <AppSettings />;

      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="settings-page">

      {/* ===========================
          HEADER
      =========================== */}

      <div className="settings-header">

        <div>

          <h1>Settings</h1>

          <p>
            Manage your account, membership, privacy and application
            preferences.
          </p>

        </div>

      </div>

      {/* ===========================
          LAYOUT
      =========================== */}

      <div className="settings-layout">

        {/* ===========================
            SIDEBAR
        =========================== */}

        <aside className="settings-sidebar">

          {menuItems.map((item) => (

            <button
              key={item.id}
              type="button"
              className={`settings-nav-item ${
                activeTab === item.id ? "active" : ""
              }`}
              onClick={() => setActiveTab(item.id)}
            >

              {item.icon}

              <span>{item.label}</span>

            </button>

          ))}

        </aside>

        {/* ===========================
            CONTENT
        =========================== */}

        <section className="settings-content">

          {renderContent()}

        </section>

      </div>

    </div>
  );
}

export default Settings;
import { useState } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  CalendarDays,
  Newspaper,
  Save,
} from "lucide-react";

import "./NotificationSettings.css";

function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    eventUpdates: true,
    newsAnnouncements: true,
  });

  const [saving, setSaving] = useState(false);

  const handleToggle = (name) => {
    setSettings((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // TODO:
      // await updateNotificationSettings(settings);

      console.log(settings);

      alert("Notification settings saved successfully.");
    } catch (error) {
      console.error(error);

      alert("Unable to save notification settings.");
    } finally {
      setSaving(false);
    }
  };

  const options = [
    {
      key: "emailNotifications",
      title: "Email Notifications",
      description:
        "Receive important updates by email.",
      icon: <Mail size={20} />,
    },
    {
      key: "smsNotifications",
      title: "SMS Notifications",
      description:
        "Receive text message alerts for important activity.",
      icon: <MessageSquare size={20} />,
    },
    {
      key: "eventUpdates",
      title: "Event Updates",
      description:
        "Be notified about upcoming JVP events and registrations.",
      icon: <CalendarDays size={20} />,
    },
    {
      key: "newsAnnouncements",
      title: "News & Announcements",
      description:
        "Receive the latest news and official announcements.",
      icon: <Newspaper size={20} />,
    },
  ];

  return (
    <div className="notification-settings">

      <div className="notification-header">

        <Bell size={28} />

        <div>

          <h2>Notification Preferences</h2>

          <p>
            Choose how you'd like to receive updates from JVP Connect.
          </p>

        </div>

      </div>

      <div className="notification-list">

        {options.map((item) => (

          <div
            key={item.key}
            className="notification-item"
          >

            <div className="notification-icon">
              {item.icon}
            </div>

            <div className="notification-content">

              <h3>{item.title}</h3>

              <p>{item.description}</p>

            </div>

            <label className="notification-switch">

              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={() => handleToggle(item.key)}
              />

              <span className="notification-slider"></span>

            </label>

          </div>

        ))}

      </div>

      <div className="notification-actions">

        <button
          className="primary-btn"
          onClick={handleSave}
          disabled={saving}
        >

          <Save size={18} />

          {saving
            ? "Saving..."
            : "Save Preferences"}

        </button>

      </div>

    </div>
  );
}

export default NotificationSettings;
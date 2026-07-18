import { useState, useRef, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Save,
} from "lucide-react";

import { useProfile } from "../../../../context/ProfileContext";
import {
  updateMyProfile,
  uploadProfilePhoto,
} from "../../../../services/member.service";

import "./AccountSettings.css";

function AccountSettings() {
  const { profile, reloadProfile } = useProfile();

  const fileInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        email: profile.email || "",
        phone: profile.phone || "",
      }));
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("profilePhoto", file);

      await uploadProfilePhoto(formData);

      await reloadProfile();
    } catch (error) {
      console.error("Profile photo upload failed:", error);
      alert("Failed to upload profile photo.");
    } finally {
      setUploading(false);

      e.target.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await updateMyProfile({
        email: form.email,
        phone: form.phone,
      });

      await reloadProfile();

      alert("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update failed:", error);

      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <form
      className="account-settings"
      onSubmit={handleSave}
    >
      {/* ===========================
          PROFILE PHOTO
      =========================== */}

      <div className="account-section">

        <h3>Profile Photo</h3>

        <div className="photo-row">

          <div className="photo-preview">

            {profile.profilePhoto ? (
              <img
                src={profile.profilePhoto}
                alt={profile.firstName}
              />
            ) : (
              <div className="photo-placeholder">
                {profile.firstName?.charAt(0)}
              </div>
            )}

          </div>

          <button
            type="button"
            className="secondary-btn"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={18} />

            {uploading
              ? "Uploading..."
              : "Change Photo"}

          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handlePhotoUpload}
          />

        </div>

      </div>

      {/* ===========================
          PERSONAL INFORMATION
      =========================== */}

      <div className="account-section">

        <h3>Personal Information</h3>

        <div className="form-grid">

          <div className="form-group">

            <label>

              <User size={16} />

              Full Name

            </label>

            <input
              type="text"
              value={`${profile.firstName || ""} ${profile.lastName || ""}`}
              disabled
            />

          </div>

          <div className="form-group">

            <label>

              <Mail size={16} />

              Email Address

            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />

          </div>

          <div className="form-group">

            <label>

              <Phone size={16} />

              Phone Number

            </label>

            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />

          </div>

        </div>

      </div>

      {/* ===========================
          PASSWORD
      =========================== */}

      <div className="account-section">

        <h3>Change Password</h3>

        <div className="form-grid">

          <div className="form-group">

            <label>

              <Lock size={16} />

              Current Password

            </label>

            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="Coming soon"
              disabled
            />

          </div>

          <div className="form-group">

            <label>

              <Lock size={16} />

              New Password

            </label>

            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Coming soon"
              disabled
            />

          </div>

          <div className="form-group">

            <label>

              <Lock size={16} />

              Confirm Password

            </label>

            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Coming soon"
              disabled
            />

          </div>

        </div>

      </div>

      {/* ===========================
          SAVE
      =========================== */}

      <div className="account-actions">

        <button
          type="submit"
          className="primary-btn"
          disabled={saving}
        >

          <Save size={18} />

          {saving
            ? "Saving..."
            : "Save Changes"}

        </button>

      </div>

    </form>
  );
}

export default AccountSettings;
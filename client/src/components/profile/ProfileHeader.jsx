import {
  useRef,
  useState,
  useEffect,
} from "react";

import {
  Camera,
  LoaderCircle,
  MapPin,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import {
  uploadProfilePhoto,
} from "../../services/member.service";

import {
  useProfile,
} from "../../context/ProfileContext";

import "./ProfileHeader.css";

function ProfileHeader() {

  const {

    profile,

    setProfile,

    fullName,

    initials,

    memberNumber,

    membershipStatus,

    profilePhoto,

    joinedDate,

  } = useProfile();

  const inputRef = useRef(null);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [imageFailed, setImageFailed] =
    useState(false);

  const [preview, setPreview] =
  useState(null);

  useEffect(() => {

  return () => {

    if (preview) {

      URL.revokeObjectURL(preview);

    }

  };

}, [preview]);

  /* ==========================================
     MEMBERSHIP STATUS
  ========================================== */

  const status = (
    membershipStatus || "inactive"
  ).toLowerCase();

  const statusMap = {

    active: {

      label: "Active Member",

      className: "active",

      icon: <CheckCircle2 size={16} />,

    },

    pending_payment: {

      label: "Pending Payment",

      className: "pending",

      icon: <Clock3 size={16} />,

    },

    expired: {

      label: "Expired",

      className: "expired",

      icon: <XCircle size={16} />,

    },

    inactive: {

      label: "Inactive",

      className: "inactive",

      icon: <XCircle size={16} />,

    },

  };

  const badge =
    statusMap[status] ||
    statusMap.inactive;

  /* ==========================================
     PHOTO UPLOAD
  ========================================== */

const handleUpload = async (event) => {

  const file = event.target.files?.[0];

  if (!file) return;

  setError("");

  /* ===============================
     VALIDATE TYPE
  =============================== */

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {

    setError(
      "Only JPG, PNG and WEBP images are allowed."
    );

    event.target.value = "";

    return;

  }

  /* ===============================
     VALIDATE SIZE
  =============================== */

  if (file.size > 2 * 1024 * 1024) {

    setError(
      "Image must not exceed 2 MB."
    );

    event.target.value = "";

    return;

  }

  /* ===============================
     SHOW PREVIEW
  =============================== */

  if (preview) {

  URL.revokeObjectURL(preview);

}

const previewUrl = URL.createObjectURL(file);

setPreview(previewUrl);

  try {

    setUploading(true);

    setError("");

    const response = await uploadProfilePhoto(file);

setProfile(response.data);

URL.revokeObjectURL(previewUrl);

setPreview(null);

setImageFailed(false);

  } catch (err) {

    console.error(err);

    URL.revokeObjectURL(previewUrl);

    setPreview(null);

    setImageFailed(false);

    setError(

      err.response?.data?.message ||

      "Unable to upload profile photo."

    );

  } finally {

    setUploading(false);

    event.target.value = "";

  }

};

  /* ==========================================
     RENDER
  ========================================== */

  return (

    <section className="profile-header">

      {/* ======================================
          PROFILE PHOTO
      ====================================== */}

      <div className="profile-avatar">

        {

  preview ? (

    <img
      src={preview}
      alt="Preview"
    />

  ) :

  profilePhoto &&
  !imageFailed ? (

    <img
      src={profilePhoto}
      alt={fullName}
      onError={() =>
        setImageFailed(true)
      }
    />

  ) : (

    <div className="avatar-placeholder">

      {initials || "M"}

    </div>

  )

}

 {

    uploading && (

      <div className="upload-overlay">

        <LoaderCircle
          size={28}
          className="spin"
        />

      </div>

    )

  }

        <button

          type="button"

          aria-label="Upload profile photo"

          className="change-photo-btn"

          onClick={() =>

            inputRef.current?.click()

          }

          disabled={uploading}

          title="Upload Profile Photo"

        >

          {

            uploading ? (

              <LoaderCircle

                size={18}

                className="spin"

              />

            ) : (

              <Camera size={18} />

            )

          }

        </button>

        <input

          ref={inputRef}

          type="file"

          accept="image/jpeg,image/jpg,image/png,image/webp"

          hidden

          onChange={handleUpload}

        />

      </div>

      {/* ======================================
          MEMBER DETAILS
      ====================================== */}

      <div className="profile-details">

        <h1>

          {fullName || "Member"}

        </h1>

        <p className="member-number">

          {

            memberNumber ||

            "Membership Number Pending"

          }

        </p>

        <div

          className={`status-badge ${badge.className}`}

        >

          {badge.icon}

          <span>

            {badge.label}

          </span>

        </div>

        <div className="member-meta">

          <span>

            <MapPin size={16} />

            {

              profile?.county ||

              "County Not Set"

            }

          </span>

          <span>

            <CalendarDays size={16} />

            {

              joinedDate

                ? `Joined ${new Date(

                    joinedDate

                  ).toLocaleDateString(

                    "en-KE",

                    {

                      month: "long",

                      year: "numeric",

                    }

                  )}`

                : "Join Date Pending"

            }

          </span>

        </div>

        {

          error && (

            <div className="upload-error">

              {error}

            </div>

          )

        }

      </div>

    </section>

  );

}

export default ProfileHeader;
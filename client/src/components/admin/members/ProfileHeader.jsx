import {
  FaUser,
  FaUserEdit,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import "./MemberProfile.css";

function ProfileHeader({
  member,
  onEdit,
  onToggleStatus,
}) {
  if (!member) return null;

  const fullName = [
    member.firstName,
    member.middleName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const status = member.accountActivated
    ? "Activated"
    : member.source === "imported"
    ? "Imported"
    : "New";

  return (
    <div className="profile-header">
      <div className="profile-header-left">
        {member.profilePhoto ? (
          <img
            src={member.profilePhoto}
            alt={fullName}
            className="profile-avatar"
          />
        ) : (
          <div className="profile-avatar placeholder">
            <FaUser />
          </div>
        )}

        <div className="profile-info">
          <h2>{fullName}</h2>

          <p className="member-number">
            {member.memberNumber || "Not Assigned"}
          </p>

          <span className="membership-type">
            {member.membershipType || "Ordinary Member"}
          </span>

          <span
            className={`status-badge ${
              status.toLowerCase()
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="profile-actions">
        <button
          className="btn-primary"
          onClick={onEdit}
        >
          <FaUserEdit />
          Edit
        </button>

        <button
          className={
            member.accountActivated
              ? "btn-danger"
              : "btn-success"
          }
          onClick={onToggleStatus}
        >
          {member.accountActivated ? (
            <>
              <FaTimesCircle />
              Deactivate
            </>
          ) : (
            <>
              <FaCheckCircle />
              Activate
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ProfileHeader;
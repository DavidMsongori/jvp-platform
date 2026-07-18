import "./MemberProfile.css";

function MembershipInformation({ member }) {
  if (!member) return null;

  const membershipStatus = member.membershipStatus
    ? member.membershipStatus
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "Unknown";

  const registrationSource = member.source
    ? member.source.charAt(0).toUpperCase() +
      member.source.slice(1)
    : "-";

  const joinedDate = member.createdAt
    ? new Date(member.createdAt).toLocaleDateString()
    : "-";

  const expiryDate = member.membershipExpiry
    ? new Date(
        member.membershipExpiry
      ).toLocaleDateString()
    : "Not Set";

  const rows = [
    {
      label: "Member Number",
      value:
        member.memberNumber ||
        member.membershipNumber ||
        "Not Assigned",
    },
    {
      label: "Membership Type",
      value: member.membershipType || "-",
    },
    {
      label: "Membership Status",
      value: membershipStatus,
      badge: true,
      className:
        member.membershipStatus || "unknown",
    },
    {
      label: "Membership Fee Paid",
      value: member.membershipFeePaid
        ? "Yes"
        : "No",
      badge: true,
      className: member.membershipFeePaid
        ? "paid"
        : "unpaid",
    },
    {
      label: "Account Activated",
      value: member.accountActivated
        ? "Yes"
        : "No",
      badge: true,
      className: member.accountActivated
        ? "activated"
        : "pending",
    },
    {
      label: "Registration Source",
      value: registrationSource,
    },
    {
      label: "Joined Date",
      value: joinedDate,
    },
    {
      label: "Membership Expiry",
      value: expiryDate,
    },
  ];

  return (
    <div className="profile-card">
      <div className="card-header">
        <h3>Membership Information</h3>
      </div>

      <div className="info-grid">
        {rows.map((row) => (
          <div
            key={row.label}
            className="info-item"
          >
            <label>{row.label}</label>

            {row.badge ? (
              <span
                className={`info-badge ${row.className}`}
              >
                {row.value}
              </span>
            ) : (
              <span>{row.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MembershipInformation;
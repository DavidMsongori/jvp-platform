import "./MemberProfile.css";

function PersonalInformation({ member }) {
  if (!member) return null;

  const rows = [
    {
      label: "Email",
      value: member.user?.email,
    },
    {
      label: "Phone",
      value: member.phone,
    },
    {
      label: "National ID",
      value: member.nationalId,
    },
    {
      label: "Gender",
      value: member.gender,
    },
    {
      label: "Date of Birth",
      value: member.dateOfBirth
        ? new Date(
            member.dateOfBirth
          ).toLocaleDateString()
        : "-",
    },
    {
      label: "County",
      value: member.county,
    },
    {
      label: "Sub County",
      value: member.subCounty,
    },
    {
      label: "Ward",
      value: member.ward,
    },
    {
      label: "Occupation",
      value: member.occupation,
    },
    {
      label: "Address",
      value: member.address,
    },
  ];

  return (
    <div className="profile-card">
      <div className="card-header">
        <h3>Personal Information</h3>
      </div>

      <div className="info-grid">
        {rows.map((row) => (
          <div
            key={row.label}
            className="info-item"
          >
            <label>{row.label}</label>

            <span>{row.value || "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PersonalInformation;
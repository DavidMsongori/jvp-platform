
import { useMemo } from "react";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  Landmark,
  Scale,
  ShieldCheck,
  Users,
  Gavel,
  Handshake,
  FileText,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useLeaders } from "../../context/LeaderContext";

import "./AttorneyGeneralPage.css";

const DEFAULT_AVATAR = "/avatar.png";

function normalizeOffice(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAttorneyGeneral(leader) {
  const offices = [
    leader?.position,
    leader?.office,
    leader?.title,
    leader?.profile?.position,
    leader?.profile?.office,
    leader?.profile?.title,
  ];

  return offices.some((value) =>
    /\battorney general\b/.test(normalizeOffice(value))
  );
}

function getPhotoSource(value) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === "object") {
    return (
      value.secureUrl ||
      value.secure_url ||
      value.url ||
      value.imageUrl ||
      value.image ||
      value.src ||
      ""
    );
  }

  return "";
}

function getLeaderPhoto(leader) {
  const profile = leader?.profile || {};

  const candidates = [
    profile.profilePhoto,
    profile.profilePhotoUrl,
    profile.photo,
    profile.photoUrl,
    profile.image,
    profile.imageUrl,
    profile.profileImage,
    profile.avatar,
    leader?.profilePhoto,
    leader?.profilePhotoUrl,
    leader?.photo,
    leader?.photoUrl,
    leader?.image,
    leader?.imageUrl,
    leader?.profileImage,
    leader?.avatar,
  ];

  for (const candidate of candidates) {
    const source = getPhotoSource(candidate);

    if (source) {
      return source;
    }
  }

  return DEFAULT_AVATAR;
}

function getLeaderName(leader) {
  const profile = leader?.profile || {};

  return (
    profile.fullName ||
    profile.name ||
    leader?.fullName ||
    leader?.name ||
    [leader?.firstName, leader?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Attorney General"
  );
}

function getLeaderPosition(leader) {
  return (
    leader?.position ||
    leader?.office ||
    leader?.title ||
    leader?.profile?.position ||
    leader?.profile?.office ||
    "Attorney General"
  );
}

function getLeaderCounty(leader) {
  return (
    leader?.profile?.county ||
    leader?.county ||
    leader?.countyName ||
    leader?.profile?.countyName ||
    ""
  );
}

function handleImageError(event) {
  if (
    event.currentTarget.dataset.fallbackApplied === "true"
  ) {
    return;
  }

  event.currentTarget.dataset.fallbackApplied = "true";
  event.currentTarget.src = DEFAULT_AVATAR;
}

const responsibilities = [
  {
    icon: Scale,
    title: "Legal Advisory",
    description:
      "Provide legal guidance to the President, Regional Cabinet, and JVP institutions on matters affecting the organisation and its mandate.",
  },
  {
    icon: FileCheck2,
    title: "Constitutional Compliance",
    description:
      "Promote adherence to the JVP Constitution, approved policies, governance procedures, and lawful institutional decisions.",
  },
  {
    icon: ShieldCheck,
    title: "Rights and Accountability",
    description:
      "Support the protection of members’ rights, procedural fairness, transparency, and accountability across JVP structures.",
  },
  {
    icon: Gavel,
    title: "Dispute Resolution",
    description:
      "Advise on the fair handling of institutional disputes and recommend appropriate procedures for resolving governance disagreements.",
  },
  {
    icon: BookOpen,
    title: "Policy and Legal Drafting",
    description:
      "Support the review and preparation of constitutional amendments, policies, memoranda, agreements, and other official instruments.",
  },
  {
    icon: Landmark,
    title: "Institutional Governance",
    description:
      "Help clarify institutional mandates and promote coordination between regional and county structures without overlapping responsibilities.",
  },
];

const workingRelationships = [
  {
    icon: Users,
    title: "President and Deputy President",
    description:
      "Provide legal and governance advice while respecting the distinct constitutional responsibilities of the executive leadership.",
  },
  {
    icon: Landmark,
    title: "Regional Youth Assembly",
    description:
      "Offer legal guidance on legislative procedures, constitutional interpretation, motions, and institutional accountability when required.",
  },
  {
    icon: Handshake,
    title: "County Leadership",
    description:
      "Guide county structures on applying JVP governance standards consistently while recognising their respective mandates.",
  },
  {
    icon: FileText,
    title: "Secretariat and Committees",
    description:
      "Work with the relevant offices to review official documents, maintain proper procedures, and identify legal or compliance concerns.",
  },
];

export default function AttorneyGeneralPage() {
  const {
    leaders = [],
    executive = [],
    loading,
    error,
  } = useLeaders();

  const attorneyGeneral = useMemo(
    () =>
      executive.find(isAttorneyGeneral) ||
      leaders.find(isAttorneyGeneral) ||
      null,
    [executive, leaders]
  );

  const fullName = getLeaderName(attorneyGeneral);
  const position = getLeaderPosition(attorneyGeneral);
  const county = getLeaderCounty(attorneyGeneral);
  const photo = getLeaderPhoto(attorneyGeneral);

  return (
    <main className="ag-page">
      <div className="ag-container">
        <Link to="/leadership" className="ag-back-link">
          <ArrowLeft size={17} aria-hidden="true" />
          <span>Back to Leadership</span>
        </Link>

        {/* HERO */}
        <section className="ag-hero">
          <div className="ag-hero-content">
            <span className="ag-eyebrow">
              <Scale size={15} aria-hidden="true" />
              JVP REGIONAL LEADERSHIP
            </span>

            <h1>Office of the Attorney General</h1>

            <p className="ag-hero-description">
              Upholding constitutional order, strengthening
              institutional accountability, and promoting fair
              and transparent governance across Jumuiya ya
              Vijana wa Pwani.
            </p>

            <div className="ag-hero-values">
              <span>
                <CheckCircle2 size={16} aria-hidden="true" />
                Constitutional Integrity
              </span>

              <span>
                <CheckCircle2 size={16} aria-hidden="true" />
                Fairness and Accountability
              </span>

              <span>
                <CheckCircle2 size={16} aria-hidden="true" />
                Sound Governance
              </span>
            </div>
          </div>

          <div className="ag-hero-emblem" aria-hidden="true">
            <div className="ag-emblem-ring">
              <Scale size={94} strokeWidth={1.1} />
            </div>

            <span>JUSTICE · INTEGRITY · SERVICE</span>
          </div>
        </section>

        {/* OFFICE HOLDER */}
        <section className="ag-profile-section">
          <div className="ag-section-heading">
            <span className="ag-section-kicker">
              OFFICE HOLDER
            </span>

            <h2>Meet the Attorney General</h2>

            <p>
              The office holder’s profile and photograph are
              drawn from the JVP leadership records.
            </p>
          </div>

          {loading ? (
            <div className="ag-state-card" role="status">
              <span className="ag-loader" />
              <p>Loading Attorney General’s profile...</p>
            </div>
          ) : attorneyGeneral ? (
            <article className="ag-profile-card">
              <div className="ag-profile-photo-wrap">
                <img
                  src={photo}
                  alt={`Portrait of ${fullName}`}
                  className="ag-profile-photo"
                  onError={handleImageError}
                />

                <span className="ag-profile-badge">
                  <Scale size={15} aria-hidden="true" />
                  Regional Cabinet
                </span>
              </div>

              <div className="ag-profile-details">
                <span className="ag-profile-label">
                  ATTORNEY GENERAL, JVP
                </span>

                <h3>{fullName}</h3>

                <p className="ag-profile-position">
                  {position}
                </p>

                {county && (
                  <p className="ag-profile-location">
                    <Landmark size={16} aria-hidden="true" />
                    {county}
                  </p>
                )}

                <p className="ag-profile-intro">
                  Responsible for supporting legal integrity,
                  constitutional compliance, and sound
                  governance within JVP, in accordance with
                  the organisation’s Constitution and
                  applicable procedures.
                </p>

                <Link
                  to="/leadership"
                  className="ag-outline-link"
                >
                  Explore JVP Leadership
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ) : (
            <div className="ag-state-card ag-empty-state">
              <Scale size={32} aria-hidden="true" />

              <h3>Profile currently unavailable</h3>

              <p>
                {error
                  ? "The leadership records could not be loaded. Please try again later."
                  : "An Attorney General has not yet been found in the regional executive or public leadership records."}
              </p>

              {error && (
                <p className="ag-error-note">
                  The leadership service reported an error
                  while loading the executive records.
                </p>
              )}
            </div>
          )}
        </section>

        {/* RESPONSIBILITIES */}
        <section className="ag-responsibilities-section">
          <div className="ag-section-heading">
            <span className="ag-section-kicker">
              CORE MANDATE
            </span>

            <h2>Responsibilities of the Office</h2>

            <p>
              The office supports lawful, consistent, and
              accountable decision-making throughout the
              organisation.
            </p>
          </div>

          <div className="ag-responsibilities-grid">
            {responsibilities.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  className="ag-responsibility-card"
                  key={item.title}
                >
                  <div className="ag-card-icon">
                    <Icon size={23} aria-hidden="true" />
                  </div>

                  <h3>{item.title}</h3>

                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* GOVERNANCE PRINCIPLES */}
        <section className="ag-principles-section">
          <div className="ag-principles-copy">
            <span className="ag-section-kicker">
              GOVERNANCE STANDARD
            </span>

            <h2>
              Law, fairness, and institutional integrity
            </h2>

            <p>
              The Attorney General’s office should help JVP
              make decisions through clear procedures,
              respect for the Constitution, and transparent
              institutional processes. Its advice should
              strengthen the organisation rather than
              replace the authority of elected or
              constitutionally mandated offices.
            </p>
          </div>

          <div className="ag-principles-list">
            <div>
              <CheckCircle2 size={19} aria-hidden="true" />
              <span>Respect for the JVP Constitution</span>
            </div>

            <div>
              <CheckCircle2 size={19} aria-hidden="true" />
              <span>Impartial and procedurally fair advice</span>
            </div>

            <div>
              <CheckCircle2 size={19} aria-hidden="true" />
              <span>
                Confidentiality and professional integrity
              </span>
            </div>

            <div>
              <CheckCircle2 size={19} aria-hidden="true" />
              <span>
                Clear separation of institutional mandates
              </span>
            </div>
          </div>
        </section>

        {/* INSTITUTIONAL RELATIONSHIPS */}
        <section className="ag-relationships-section">
          <div className="ag-section-heading">
            <span className="ag-section-kicker">
              INSTITUTIONAL COORDINATION
            </span>

            <h2>Working with JVP Institutions</h2>

            <p>
              Effective legal guidance depends on cooperation
              and respect for each institution’s
              responsibilities.
            </p>
          </div>

          <div className="ag-relationships-grid">
            {workingRelationships.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  className="ag-relationship-card"
                  key={item.title}
                >
                  <Icon size={23} aria-hidden="true" />

                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* CLOSING */}
        <section className="ag-cta">
          <div className="ag-cta-icon">
            <ShieldCheck size={29} aria-hidden="true" />
          </div>

          <div>
            <h2>Governance rooted in integrity</h2>

            <p>
              JVP is committed to responsible leadership,
              institutional accountability, and a fair
              process for every member.
            </p>
          </div>

          <Link to="/leadership" className="ag-cta-link">
            View Leadership
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}

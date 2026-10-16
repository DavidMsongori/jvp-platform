
import { useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Landmark,
  ListChecks,
  MessagesSquare,
  Network,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useLeaders } from "../../context/LeaderContext";
import "./SecretaryToCabinetPage.css";

const DEFAULT_AVATAR = "/avatar.png";

/* =========================================================
   HELPERS
========================================================= */

function normalizeOffice(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[.,/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function isSecretaryToCabinet(leader) {
  if (!leader) return false;

  const profile = leader.profile || {};

  const officeText = normalizeOffice(
    [
      leader.position,
      leader.office,
      leader.title,
      leader.role,
      profile.position,
      profile.office,
      profile.title,
      profile.role,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return (
    /\bsecretary to (?:the )?cabinet\b/.test(officeText) ||
    /\bsecretary of (?:the )?cabinet\b/.test(officeText) ||
    /\bcabinet secretariat secretary\b/.test(officeText)
  );
}


function getPhotoSource(photo) {
  if (!photo) return "";

  if (typeof photo === "string") {
    return photo.trim();
  }

  if (typeof photo === "object") {
    return (
      photo.secureUrl ||
      photo.secure_url ||
      photo.url ||
      photo.imageUrl ||
      photo.image_url ||
      photo.src ||
      ""
    );
  }

  return "";
}

function getLeaderPhoto(leader) {
  const profile = leader?.profile || {};

  const possiblePhotos = [
    profile.profilePhoto,
    profile.profilePhotoUrl,
    profile.profileImage,
    profile.profileImageUrl,
    profile.photo,
    profile.photoUrl,
    profile.image,
    profile.imageUrl,
    profile.avatar,
    leader?.profilePhoto,
    leader?.profilePhotoUrl,
    leader?.profileImage,
    leader?.profileImageUrl,
    leader?.photo,
    leader?.photoUrl,
    leader?.image,
    leader?.imageUrl,
    leader?.avatar,
  ];

  for (const candidate of possiblePhotos) {
    const source = getPhotoSource(candidate);

    if (source) return source;
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
    [
      profile.firstName,
      profile.middleName,
      profile.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    [
      leader?.firstName,
      leader?.middleName,
      leader?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Secretary to the Cabinet"
  );
}

function getLeaderPosition(leader) {
  const profile = leader?.profile || {};

  return (
    leader?.position ||
    leader?.office ||
    leader?.title ||
    profile.position ||
    profile.office ||
    profile.title ||
    "Secretary to the Cabinet"
  );
}

function getLeaderCounty(leader) {
  const profile = leader?.profile || {};

  return (
    profile.county ||
    profile.countyName ||
    leader?.county ||
    leader?.countyName ||
    ""
  );
}

function handleImageError(event) {
  const image = event.currentTarget;

  if (image.dataset.fallbackApplied === "true") return;

  image.dataset.fallbackApplied = "true";
  image.src = DEFAULT_AVATAR;
}

/* =========================================================
   PAGE CONTENT
========================================================= */

const responsibilities = [
  {
    icon: CalendarDays,
    title: "Cabinet Meeting Coordination",
    description:
      "Coordinate meeting schedules, circulate notices, support preparation of agendas, and help ensure that Cabinet business is organised in good time.",
  },
  {
    icon: FileText,
    title: "Agenda and Paper Management",
    description:
      "Receive, organise, and circulate Cabinet papers, briefing documents, memoranda, and supporting materials through the approved procedures.",
  },
  {
    icon: ClipboardCheck,
    title: "Minutes and Official Records",
    description:
      "Maintain accurate records of Cabinet proceedings, decisions, action points, and other official documents entrusted to the office.",
  },
  {
    icon: ListChecks,
    title: "Decision Tracking",
    description:
      "Maintain a decision and action register, communicate assigned actions to relevant offices, and follow up on implementation progress.",
  },
  {
    icon: Network,
    title: "Inter-Ministerial Coordination",
    description:
      "Facilitate the exchange of information between Cabinet Secretaries, the Presidency, and relevant JVP offices to support coordinated delivery.",
  },
  {
    icon: ShieldCheck,
    title: "Confidentiality and Procedure",
    description:
      "Support orderly document handling, controlled circulation of sensitive Cabinet material, and consistent adherence to approved procedures.",
  },
];

const workflow = [
  {
    number: "01",
    title: "Before the meeting",
    description:
      "Coordinate the proposed agenda, collect submissions, prepare meeting notices, and circulate authorised papers.",
  },
  {
    number: "02",
    title: "During the meeting",
    description:
      "Support the meeting process, record key deliberations and decisions, and capture assigned responsibilities and deadlines.",
  },
  {
    number: "03",
    title: "After the meeting",
    description:
      "Prepare and circulate approved minutes or decision extracts, update the action register, and communicate follow-up requirements.",
  },
  {
    number: "04",
    title: "Follow-up and reporting",
    description:
      "Seek implementation updates from responsible offices and prepare progress summaries for the appropriate Cabinet leadership.",
  },
];

const workingRelationships = [
  {
    icon: Users,
    title: "President and Deputy President",
    description:
      "Coordinate Cabinet business in accordance with their direction and the established JVP governance framework.",
  },
  {
    icon: MessagesSquare,
    title: "Prime Cabinet Secretary",
    description:
      "Maintain close coordination on Cabinet communications, scheduling, follow-up, and the administrative flow of executive business.",
  },
  {
    icon: Landmark,
    title: "Cabinet Secretaries",
    description:
      "Receive submissions, communicate meeting requirements, distribute authorised decisions, and follow up on agreed actions.",
  },
  {
    icon: BookOpen,
    title: "Secretariat and Other Offices",
    description:
      "Coordinate document management, records, official correspondence, and administrative support while respecting each office's mandate.",
  },
];

/* =========================================================
   SECRETARY TO THE CABINET PAGE
========================================================= */

export default function SecretaryToCabinetPage() {
  const {
    executive = [],
    leaders = [],
    loading,
    error,
  } = useLeaders();

  const secretary = useMemo(
    () =>
      executive.find(isSecretaryToCabinet) ||
      leaders.find(isSecretaryToCabinet) ||
      null,
    [executive, leaders]
  );

  const fullName = secretary ? getLeaderName(secretary) : "";
  const position = secretary ? getLeaderPosition(secretary) : "";
  const county = secretary ? getLeaderCounty(secretary) : "";
  const photo = secretary
    ? getLeaderPhoto(secretary)
    : DEFAULT_AVATAR;

  return (
    <main className="stc-page">
      <div className="stc-container">
        <Link to="/leadership" className="stc-back-link">
          <ArrowLeft size={17} aria-hidden="true" />
          <span>Back to Leadership</span>
        </Link>

        <section className="stc-hero">
          <div className="stc-hero-content">
            <span className="stc-eyebrow">
              <Landmark size={15} aria-hidden="true" />
              JVP REGIONAL EXECUTIVE
            </span>

            <h1>Office of the Secretary to the Cabinet</h1>

            <p className="stc-hero-description">
              Supporting an organised, coordinated, and accountable
              Cabinet through effective meeting administration, reliable
              records, decision tracking, and timely communication.
            </p>

            <div className="stc-hero-values">
              <span>
                <CheckCircle2 size={16} aria-hidden="true" />
                Coordination
              </span>

              <span>
                <CheckCircle2 size={16} aria-hidden="true" />
                Accurate Records
              </span>

              <span>
                <CheckCircle2 size={16} aria-hidden="true" />
                Implementation Follow-up
              </span>
            </div>
          </div>

          <div className="stc-hero-emblem" aria-hidden="true">
            <div className="stc-emblem-ring">
              <ClipboardCheck size={86} strokeWidth={1.15} />
            </div>

            <span>ORGANISE · RECORD · FOLLOW THROUGH</span>
          </div>
        </section>

        <section className="stc-profile-section">
          <div className="stc-section-heading">
            <span className="stc-section-kicker">
              OFFICE HOLDER
            </span>

            <h2>Meet the Secretary to the Cabinet</h2>

            <p>
              The office holder’s details are retrieved from the JVP
              regional executive leadership records.
            </p>
          </div>

          {loading ? (
            <div className="stc-state-card" role="status">
              <span className="stc-loader" />
              <p>Loading the office holder’s profile...</p>
            </div>
          ) : secretary ? (
            <article className="stc-profile-card">
              <div className="stc-profile-photo-wrap">
                <img
                  src={photo}
                  alt={fullName}
                  className="stc-profile-photo"
                  onError={handleImageError}
                />

                <span className="stc-profile-badge">
                  <ClipboardCheck size={15} aria-hidden="true" />
                  Cabinet Secretariat
                </span>
              </div>

              <div className="stc-profile-details">
                <span className="stc-profile-label">
                  JVP REGIONAL EXECUTIVE
                </span>

                <h3>{fullName}</h3>

                <p className="stc-profile-position">
                  {position}
                </p>

                {county && (
                  <p className="stc-profile-location">
                    <Landmark size={16} aria-hidden="true" />
                    {county}
                  </p>
                )}

                <p className="stc-profile-intro">
                  The Secretary to the Cabinet supports the
                  administrative machinery of the Regional Cabinet,
                  helping ensure that meetings are properly organised,
                  decisions are documented, and assigned actions are
                  followed up through the appropriate offices.
                </p>

                <Link
                  to="/leadership"
                  className="stc-outline-link"
                >
                  Explore JVP Leadership
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ) : (
            <div className="stc-state-card stc-empty-state">
              <ClipboardCheck size={34} aria-hidden="true" />

              <h3>Profile currently unavailable</h3>

              <p>
                {error
                  ? "The executive leadership records could not be loaded. Please try again later."
                  : "No Secretary to the Cabinet was found in the current executive records."}
              </p>

              {error && (
                <p className="stc-error-note">
                  Check the leadership service and try again.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="stc-responsibilities-section">
          <div className="stc-section-heading">
            <span className="stc-section-kicker">
              CORE FUNCTIONS
            </span>

            <h2>What the Office Does</h2>

            <p>
              A dependable Cabinet secretariat helps executive
              leadership turn deliberations into documented decisions
              and coordinated action.
            </p>
          </div>

          <div className="stc-responsibilities-grid">
            {responsibilities.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  className="stc-responsibility-card"
                  key={item.title}
                >
                  <div className="stc-card-icon">
                    <Icon size={23} aria-hidden="true" />
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="stc-workflow-section">
          <div className="stc-section-heading">
            <span className="stc-section-kicker">
              CABINET WORKFLOW
            </span>

            <h2>From Agenda to Action</h2>

            <p>
              A consistent process makes Cabinet work easier to track
              and responsibilities easier to follow up.
            </p>
          </div>

          <div className="stc-workflow-list">
            {workflow.map((step) => (
              <article
                className="stc-workflow-item"
                key={step.number}
              >
                <div className="stc-workflow-number">
                  {step.number}
                </div>

                <div className="stc-workflow-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="stc-principles-section">
          <div className="stc-principles-copy">
            <span className="stc-section-kicker">
              WORKING STANDARDS
            </span>

            <h2>Reliable records. Clear responsibilities.</h2>

            <p>
              The office should support the Cabinet without taking
              over the policy-making or decision-making authority of
              the President, Deputy President, Prime Cabinet Secretary,
              or Cabinet Secretaries. Its role is to ensure that
              authorised processes are documented, communicated, and
              followed through.
            </p>
          </div>

          <div className="stc-principles-list">
            <div>
              <CheckCircle2 size={19} aria-hidden="true" />
              <span>Accurate and orderly Cabinet records</span>
            </div>

            <div>
              <CheckCircle2 size={19} aria-hidden="true" />
              <span>Timely circulation of authorised information</span>
            </div>

            <div>
              <CheckCircle2 size={19} aria-hidden="true" />
              <span>Confidential handling of sensitive documents</span>
            </div>

            <div>
              <CheckCircle2 size={19} aria-hidden="true" />
              <span>Clear action owners and follow-up deadlines</span>
            </div>

            <div>
              <CheckCircle2 size={19} aria-hidden="true" />
              <span>Respect for established institutional mandates</span>
            </div>
          </div>
        </section>

        <section className="stc-relationships-section">
          <div className="stc-section-heading">
            <span className="stc-section-kicker">
              INSTITUTIONAL COORDINATION
            </span>

            <h2>Working with JVP Leadership</h2>

            <p>
              The office connects Cabinet processes with the leaders
              and departments responsible for delivering agreed
              priorities.
            </p>
          </div>

          <div className="stc-relationships-grid">
            {workingRelationships.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  className="stc-relationship-card"
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

        <section className="stc-cta">
          <div className="stc-cta-icon">
            <ShieldCheck size={29} aria-hidden="true" />
          </div>

          <div className="stc-cta-copy">
            <h2>Coordination that delivers results</h2>

            <p>
              Strong Cabinet administration helps JVP maintain
              continuity, accountability, and follow-through across
              its regional executive.
            </p>
          </div>

          <Link to="/leadership" className="stc-cta-link">
            View Leadership
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}

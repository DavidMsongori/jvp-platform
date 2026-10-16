
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Landmark,
  MessageSquareText,
  Network,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useLeaders } from "../../context/LeaderContext";

import "./PrimeCabinetSecretaryPage.css";

const DEFAULT_AVATAR = "/avatar.png";

const priorities = [
  {
    icon: ClipboardList,
    title: "Cabinet Business",
    description:
      "Coordinate Cabinet meetings, prepare business for consideration, and support the orderly handling of executive matters.",
  },
  {
    icon: CheckCircle2,
    title: "Implementation Follow-Up",
    description:
      "Track executive decisions, monitor ministerial commitments, and facilitate reporting on agreed actions and deadlines.",
  },
  {
    icon: MessageSquareText,
    title: "Executive Communication",
    description:
      "Facilitate timely communication between the President, Deputy President, Cabinet Secretaries, and other relevant offices.",
  },
  {
    icon: FileText,
    title: "Records and Accountability",
    description:
      "Support the preparation and maintenance of Cabinet records, action points, progress reports, and executive correspondence.",
  },
];

const workingRelationships = [
  {
    title: "President",
    description:
      "Provides overall executive direction and leadership for JVP's regional mandate.",
    to: "/leadership/president",
  },
  {
    title: "Deputy President",
    description:
      "Supports the President and undertakes delegated executive responsibilities.",
    to: "/leadership/deputy-president",
  },
  {
    title: "Attorney General",
    description:
      "Provides legal and governance guidance on executive processes and institutional decisions.",
    to: "/leadership/attorney-general",
  },
];

function normalizeOffice(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPrimeCabinetSecretary(leader) {
  const officeValues = [
    leader?.position,
    leader?.office,
    leader?.title,
    leader?.profile?.position,
    leader?.profile?.office,
    leader?.profile?.title,
  ];

  return officeValues.some((value) => {
    const office = normalizeOffice(value);

    return (
      /\bprime cabinet secretary\b/.test(office) ||
      /\bprime cs\b/.test(office)
    );
  });
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

function getPhoto(leader) {
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
    "Prime Cabinet Secretary"
  );
}

function getLeaderPosition(leader) {
  return (
    leader?.position ||
    leader?.office ||
    leader?.title ||
    leader?.profile?.position ||
    leader?.profile?.office ||
    "Prime Cabinet Secretary"
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

export default function PrimeCabinetSecretaryPage() {
  const {
    leaders = [],
    executive = [],
    loading,
    error,
  } = useLeaders();

  // Search the regional executive first, then public
  // leadership records as a fallback.
  const secretary =
    executive.find(isPrimeCabinetSecretary) ||
    leaders.find(isPrimeCabinetSecretary) ||
    null;

  const fullName = getLeaderName(secretary);
  const position = getLeaderPosition(secretary);
  const county = getLeaderCounty(secretary);
  const photo = getPhoto(secretary);

  return (
    <main className="pcs-page">
      {/* HERO */}
      <section className="pcs-hero">
        <div className="pcs-container">
          <Link
            to="/leadership"
            className="pcs-back-link"
          >
            <ArrowLeft size={16} />
            Back to Leadership
          </Link>

          <div className="pcs-hero__grid">
            <div className="pcs-hero__content">
              <span className="pcs-eyebrow">
                <Landmark size={15} />
                JVP Regional Executive
              </span>

              <h1>
                Office of the
                <span> Prime Cabinet Secretary</span>
              </h1>

              <div className="pcs-title-rule" />

              <p className="pcs-hero__lead">
                Coordinating executive business, connecting
                ministries, and turning leadership decisions
                into coordinated action.
              </p>

              <p className="pcs-hero__text">
                The Office of the Prime Cabinet Secretary
                supports the coordination of JVP's Regional
                Cabinet, facilitates communication across
                executive offices, and follows up on agreed
                decisions and ministerial commitments.
                Through effective administrative coordination
                and progress monitoring, the Office helps
                strengthen collaboration and accountability
                throughout the organisation's six Coastal
                Counties.
              </p>

              <a
                href="#pcs-mandate"
                className="pcs-primary-link"
              >
                Explore the Office
                <ArrowRight size={16} />
              </a>
            </div>

            <div className="pcs-portrait">
              <div className="pcs-portrait__frame">
                <img
                  src={photo}
                  alt={`Portrait of ${fullName}`}
                  onError={handleImageError}
                />
              </div>

              <div className="pcs-portrait__caption">
                <span className="pcs-portrait__label">
                  {loading
                    ? "Loading leadership..."
                    : position}
                </span>

                <h2>
                  {loading ? "Loading..." : fullName}
                </h2>

                <p>
                  {county
                    ? `${county} · Jumuiya ya Vijana wa Pwani`
                    : "Jumuiya ya Vijana wa Pwani"}
                </p>

                {!loading && !secretary && (
                  <p role="status">
                    The officeholder's profile is currently
                    unavailable.
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <p className="pcs-data-message" role="status">
              Leadership information could not be fully
              loaded. Displaying available information.
            </p>
          )}

          <div className="pcs-hero__footer">
            <span>
              <Building2 size={15} />
              Office of the Prime Cabinet Secretary
            </span>

            <span>
              Coordination · Communication · Delivery
            </span>
          </div>
        </div>
      </section>

      {/* MANDATE */}
      <section
        className="pcs-section"
        id="pcs-mandate"
      >
        <div className="pcs-container">
          <div className="pcs-section__heading">
            <span className="pcs-section__eyebrow">
              The Secretariat
            </span>

            <h2>Mandate of the Office</h2>

            <p>
              The Office serves as a coordination hub for
              the Regional Cabinet, helping executive offices
              work together, maintain clear records, and
              follow through on agreed priorities.
            </p>
          </div>

          <div className="pcs-mandate-grid">
            <article className="pcs-mandate-card">
              <div className="pcs-mandate-card__icon">
                <ClipboardList size={22} />
              </div>

              <h3>Cabinet Coordination</h3>

              <p>
                Coordinate Cabinet business, facilitate
                meeting preparations, organise agendas, and
                support the orderly consideration of
                executive matters.
              </p>
            </article>

            <article className="pcs-mandate-card">
              <div className="pcs-mandate-card__icon">
                <CheckCircle2 size={22} />
              </div>

              <h3>Decision Implementation</h3>

              <p>
                Maintain action trackers, communicate
                assigned responsibilities, and follow up
                with relevant ministries on agreed decisions.
              </p>
            </article>

            <article className="pcs-mandate-card">
              <div className="pcs-mandate-card__icon">
                <Network size={22} />
              </div>

              <h3>Inter-Ministerial Coordination</h3>

              <p>
                Facilitate collaboration between ministries
                where programmes, assignments, and regional
                priorities require joint implementation.
              </p>
            </article>

            <article className="pcs-mandate-card">
              <div className="pcs-mandate-card__icon">
                <FileText size={22} />
              </div>

              <h3>Executive Administration</h3>

              <p>
                Support Cabinet records, official
                correspondence, decision registers, and
                periodic executive progress reports.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* PRIORITIES */}
      <section className="pcs-section pcs-section--muted">
        <div className="pcs-container">
          <div className="pcs-section__heading">
            <span className="pcs-section__eyebrow">
              Operational Priorities
            </span>

            <h2>From Decisions to Delivery</h2>

            <p>
              The Secretariat promotes a disciplined
              approach to executive coordination, ensuring
              that decisions have clear responsibilities,
              follow-up arrangements, and reporting.
            </p>
          </div>

          <div className="pcs-priorities">
            {priorities.map((priority, index) => {
              const Icon = priority.icon;

              return (
                <article
                  className="pcs-priority"
                  key={priority.title}
                >
                  <span className="pcs-priority__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="pcs-priority__icon">
                    <Icon size={21} />
                  </div>

                  <h3>{priority.title}</h3>

                  <p>{priority.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* WORKING RELATIONSHIPS */}
      <section className="pcs-section">
        <div className="pcs-container">
          <div className="pcs-section__heading">
            <span className="pcs-section__eyebrow">
              Executive Collaboration
            </span>

            <h2>Working Across the Executive</h2>

            <p>
              The Secretariat works with the President,
              Deputy President, Cabinet Secretaries, and
              other relevant offices to promote coordinated
              execution of JVP's regional agenda.
            </p>
          </div>

          <div className="pcs-offices">
            {workingRelationships.map((office) => (
              <Link
                className="pcs-office-link"
                to={office.to}
                key={office.title}
              >
                <div>
                  <h3>{office.title}</h3>
                  <p>{office.description}</p>
                </div>

                <ArrowRight size={19} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="pcs-contact">
        <div className="pcs-container pcs-contact__inner">
          <div>
            <span className="pcs-section__eyebrow">
              Office of the Prime Cabinet Secretary
            </span>

            <h2>
              One executive. Coordinated action. Shared
              progress.
            </h2>

            <p>
              Strengthening collaboration, accountability,
              and effective delivery for coastal youth.
            </p>
          </div>

          <Link
            to="/leadership"
            className="pcs-contact__link"
          >
            View Regional Leadership
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}


import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Compass,
  FileText,
  Handshake,
  Landmark,
  Users,
  BriefcaseBusiness,
  ClipboardCheck,
  Network,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useLeaders } from "../../context/LeaderContext";

import "./DeputyPresidentPage.css";

const DEFAULT_AVATAR = "/avatar.png";

const priorities = [
  {
    icon: Handshake,
    title: "Support the President",
    description:
      "Support the President in providing regional leadership and implementing JVP's strategic direction.",
  },
  {
    icon: Network,
    title: "Executive Coordination",
    description:
      "Promote collaboration between regional ministries, county leadership and other organisational structures.",
  },
  {
    icon: ClipboardCheck,
    title: "Implementation Follow-Up",
    description:
      "Follow up on delegated assignments, agreed priorities and executive commitments to encourage timely delivery.",
  },
  {
    icon: Users,
    title: "Regional Unity",
    description:
      "Strengthen cooperation, inclusion and collective responsibility among youth leaders across the six Coastal Counties.",
  },
];

const executiveOffices = [
  {
    title: "President",
    description:
      "Provides overall strategic direction and leadership to the JVP Regional Executive.",
    to: "/leadership/president",
  },
  {
    title: "Prime Cabinet Secretary",
    description:
      "Coordinates Cabinet business, executive communication and follow-up across ministries.",
    to: "/leadership/prime-cabinet-secretary",
  },
  {
    title: "Attorney General",
    description:
      "Provides legal and governance guidance to support sound executive decision-making.",
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

function isDeputyPresident(leader) {
  const values = [
    leader?.position,
    leader?.office,
    leader?.title,
    leader?.profile?.position,
    leader?.profile?.office,
    leader?.profile?.title,
  ];

  return values.some((value) => {
    const office = normalizeOffice(value);

    return (
      /\bdeputy president\b/.test(office) &&
      !/\bformer deputy president\b/.test(office)
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
    "Deputy President"
  );
}

function getLeaderPosition(leader) {
  return (
    leader?.position ||
    leader?.office ||
    leader?.title ||
    leader?.profile?.position ||
    leader?.profile?.office ||
    "Deputy President"
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

export default function DeputyPresidentPage() {
  const {
    leaders = [],
    executive = [],
    loading,
    error,
  } = useLeaders();

  // Prefer the regional executive record, then search
  // the complete public leadership collection.
  const deputyPresident =
    executive.find(isDeputyPresident) ||
    leaders.find(isDeputyPresident) ||
    null;

  const fullName = getLeaderName(deputyPresident);
  const position = getLeaderPosition(deputyPresident);
  const county = getLeaderCounty(deputyPresident);
  const photo = getPhoto(deputyPresident);

  return (
    <main className="deputy-president-page">
      {/* HERO */}
      <section className="deputy-hero">
        <div className="deputy-container">
          <Link
            to="/leadership"
            className="deputy-back-link"
          >
            <ArrowLeft size={16} />
            Back to Leadership
          </Link>

          <div className="deputy-hero__grid">
            <div className="deputy-hero__content">
              <span className="deputy-eyebrow">
                <Landmark size={15} />
                JVP Regional Executive
              </span>

              <h1>
                Office of the
                <span> Deputy President</span>
              </h1>

              <div className="deputy-title-rule" />

              <p className="deputy-hero__lead">
                Supporting regional leadership,
                strengthening executive coordination and
                advancing JVP's shared vision for coastal
                youth.
              </p>

              <p className="deputy-hero__text">
                The Office of the Deputy President supports
                the President in carrying out the mandate
                of the Regional Executive. It contributes
                to coordination, follows up on delegated
                responsibilities and promotes cooperation
                among JVP's leadership structures across
                the six Coastal Counties.
              </p>

              <a
                href="#deputy-mandate"
                className="deputy-primary-link"
              >
                Explore the Office
                <ArrowRight size={16} />
              </a>
            </div>

            <div className="deputy-portrait">
              <div className="deputy-portrait__frame">
                <img
                  src={photo}
                  alt={`Portrait of ${fullName}`}
                  onError={handleImageError}
                />
              </div>

              <div className="deputy-portrait__caption">
                <span className="deputy-portrait__label">
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

                {!loading && !deputyPresident && (
                  <p role="status">
                    The Deputy President's profile is
                    currently unavailable.
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <p
              className="deputy-data-message"
              role="status"
            >
              Leadership information could not be fully
              loaded. Displaying available information.
            </p>
          )}

          <div className="deputy-hero__footer">
            <span>
              <Building2 size={15} />
              Office of the Deputy President
            </span>

            <span>
              Support · Coordination · Accountability
            </span>
          </div>
        </div>
      </section>

      {/* MANDATE */}
      <section
        className="deputy-section"
        id="deputy-mandate"
      >
        <div className="deputy-container">
          <div className="deputy-section__heading">
            <span className="deputy-section__eyebrow">
              The Deputy Presidency
            </span>

            <h2>Mandate of the Office</h2>

            <p>
              The Office supports effective regional
              governance through delegated leadership,
              coordination and follow-up, while respecting
              the distinct responsibilities of other
              executive offices.
            </p>
          </div>

          <div className="deputy-mandate-grid">
            <article className="deputy-mandate-card">
              <div className="deputy-mandate-card__icon">
                <Compass size={22} />
              </div>

              <h3>Presidential Support</h3>

              <p>
                Assist the President in advancing agreed
                priorities and undertake assignments
                delegated by the President.
              </p>
            </article>

            <article className="deputy-mandate-card">
              <div className="deputy-mandate-card__icon">
                <BriefcaseBusiness size={22} />
              </div>

              <h3>Executive Coordination</h3>

              <p>
                Promote collaboration across ministries
                and county structures, working with the
                relevant offices to address coordination
                challenges.
              </p>
            </article>

            <article className="deputy-mandate-card">
              <div className="deputy-mandate-card__icon">
                <ClipboardCheck size={22} />
              </div>

              <h3>Progress Monitoring</h3>

              <p>
                Follow up on delegated assignments and
                agreed executive commitments, escalating
                issues to the appropriate office.
              </p>
            </article>

            <article className="deputy-mandate-card">
              <div className="deputy-mandate-card__icon">
                <FileText size={22} />
              </div>

              <h3>Continuity and Accountability</h3>

              <p>
                Support continuity of executive work and
                encourage responsible reporting,
                institutional cooperation and accountability.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* PRIORITIES */}
      <section className="deputy-section deputy-section--muted">
        <div className="deputy-container">
          <div className="deputy-section__heading">
            <span className="deputy-section__eyebrow">
              Executive Priorities
            </span>

            <h2>Areas of Focus</h2>

            <p>
              The Deputy President's work centres on
              practical support, coordinated delivery and
              stronger relationships throughout JVP.
            </p>
          </div>

          <div className="deputy-priorities">
            {priorities.map((priority, index) => {
              const Icon = priority.icon;

              return (
                <article
                  className="deputy-priority"
                  key={priority.title}
                >
                  <span className="deputy-priority__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="deputy-priority__icon">
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
      <section className="deputy-section">
        <div className="deputy-container">
          <div className="deputy-section__heading">
            <span className="deputy-section__eyebrow">
              Executive Collaboration
            </span>

            <h2>Working Across the Executive</h2>

            <p>
              The Deputy President works with the
              President and other executive offices to
              support coordinated leadership and effective
              implementation of JVP's priorities.
            </p>
          </div>

          <div className="deputy-offices">
            {executiveOffices.map((office) => (
              <Link
                className="deputy-office-link"
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
      <section className="deputy-contact">
        <div className="deputy-container deputy-contact__inner">
          <div>
            <span className="deputy-section__eyebrow">
              Office of the Deputy President
            </span>

            <h2>
              United leadership. Shared responsibility.
            </h2>

            <p>
              Advancing a coordinated, accountable and
              empowered coastal youth community.
            </p>
          </div>

          <Link
            to="/leadership"
            className="deputy-contact__link"
          >
            View Regional Leadership
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}

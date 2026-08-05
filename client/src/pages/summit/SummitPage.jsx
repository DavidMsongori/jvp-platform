import {
  useCallback,
  useEffect,
  useMemo,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mail,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";

import {
  useSummit,
} from "../../context/SummitContext";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import "./SummitPage.css";

import PosterGeneratorCTA from "../../components/summit/PosterGeneratorCTA";

/* ==========================================
   CONFIGURATION
========================================== */

const SUMMIT_SLUG =
  import.meta.env.VITE_SUMMIT_SLUG ||
  "coast-youth-summit-2026";


const SUMMIT_GUESTS = [
  {
    name: "H.E. Dr. William Samoei Ruto, E.G.H.",
    title:
      "President of the Republic of Kenya and Commander-in-Chief of the Defence Forces",
    role: "Chief Guest",
    image: "/images/summit/guests/william-ruto.jpg",
  },

  {
    name: "H.E. Gideon Mung'aro, E.G.H.",
    title:
      "Governor, Kilifi County and Patron, Jumuiya ya Vijana wa Pwani",
    role: "Host",
    image: "/images/summit/guests/gideon-mungaro.jpg",
  },

  {
    name: "Hon. Fikirini Jacobs",
    title:
      "Principal Secretary, State Department for Youth Affairs and Creative Economy",
    role: "Host",
    image: "/images/summit/guests/fikirini.jpg",
  },

  {
    name: "H.E. David Msongori",
    title:
      "President, Jumuiya ya Vijana wa Pwani",
    role: "Host",
    image: "/images/summit/guests/david-msongori.jpg",
  },

  {
    name: "Hon. James Kahindi",
    title:
      "Secretary General, Jumuiya ya Vijana wa Pwani",
    role: "Host",
    image: "/images/summit/guests/kahindi.jpg",
  },

  {
    name:
      "Hon. Sebastian Macgowan Mungah",
    title:
      "Youth Governor, Kilifi County, Jumuiya ya Vijana wa Pwani",
    role: "Host",
    image: "/images/summit/guests/sebastian.jpg",
  },
];

const EXHIBITOR_PLANS = [
  {
    name: "Youth",
    price: 10000,
    description:
      "Designed for youth-led enterprises, startups and community initiatives.",
    featured: false,
  },
  {
    name: "Bronze",
    price: 50000,
    description:
      "An entry-level exhibition package for organizations and growing brands.",
    featured: false,
  },
  {
    name: "Silver",
    price: 75000,
    description:
      "Enhanced exhibition visibility and engagement with summit participants.",
    featured: false,
  },
  {
    name: "Gold",
    price: 100000,
    description:
      "A high-visibility package for institutions, companies and development partners.",
    featured: false,
  },
  {
    name: "Premium",
    price: 150000,
    description:
      "Our highest-level exhibition package with premium visibility and positioning.",
    featured: true,
  },
];

/* ==========================================
   HELPERS
========================================== */

const ensureNumber = (
  value,
  fallback = 0
) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : fallback;
};

const formatNumber = (value) => {
  return new Intl.NumberFormat(
    "en-KE"
  ).format(ensureNumber(value));
};

const formatDate = (
  value,
  options = {}
) => {
  if (!value) {
    return "Date to be announced";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date to be announced";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      ...options,
    }
  ).format(date);
};

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
};

const formatText = (value) => {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const getSummitPayload = (summit) => {
  if (!summit) {
    return {};
  }

  return (
    summit?.data?.summitEvent ||
    summit?.data?.event ||
    summit?.data?.summit ||
    summit?.data?.data?.summitEvent ||
    summit?.data?.data?.event ||
    summit?.data?.data?.summit ||
    summit?.summitEvent ||
    summit?.event ||
    summit?.summit ||
    summit?.data ||
    summit
  );
};

const getVenueDetails = (
  summitEvent
) => {
  const venue =
    summitEvent?.venue ||
    summitEvent?.location ||
    summitEvent?.venueName;

  if (!venue) {
    return {
      name: "Venue to be announced",
      address: "",
      county: "",
      mapUrl: "",
      displayText:
        "Venue to be announced",
    };
  }

  if (typeof venue === "string") {
    return {
      name: venue,
      address: "",
      county: "",
      mapUrl: "",
      displayText: venue,
    };
  }

  const name =
    venue?.name ||
    venue?.venueName ||
    "";

  const address =
    venue?.address ||
    venue?.physicalAddress ||
    "";

  const county =
    venue?.county ||
    "";

  const mapUrl =
    venue?.mapUrl ||
    venue?.googleMapsUrl ||
    "";

  return {
    name:
      name ||
      "Venue to be announced",
    address,
    county,
    mapUrl,
    displayText: [
      name,
      address,
      county,
    ]
      .filter(Boolean)
      .join(", ") ||
      "Venue to be announced",
  };
};

const getHighlights = (
  summitEvent
) => {
  const rawHighlights =
    summitEvent?.highlights ||
    summitEvent?.keyHighlights ||
    summitEvent?.features ||
    summitEvent?.objectives ||
    [];

  if (Array.isArray(rawHighlights)) {
    return rawHighlights
      .map((highlight) => {
        if (
          typeof highlight ===
          "string"
        ) {
          return {
            title: highlight,
            description: "",
          };
        }

        return {
          title:
            highlight?.title ||
            highlight?.name ||
            highlight?.label ||
            "",

          description:
            highlight?.description ||
            highlight?.summary ||
            "",
        };
      })
      .filter(
        (highlight) =>
          highlight.title
      );
  }

  return [];
};

const getContactDetails = (
  summitEvent
) => {
  const contact =
    summitEvent?.contact ||
    summitEvent?.supportContact ||
    summitEvent?.organizerContact ||
    {};

  return {
    email:
      contact?.email ||
      summitEvent?.contactEmail ||
      summitEvent?.email ||
      "",

    phone:
      contact?.phone ||
      contact?.phoneNumber ||
      summitEvent?.contactPhone ||
      summitEvent?.phone ||
      "",
  };
};

/* ==========================================
   LOADING STATE
========================================== */

const SummitPageSkeleton = () => {
  return (
    <main
      className="public-summit-page"
      aria-busy="true"
      aria-label="Loading summit information"
    >
      <section className="public-summit-hero public-summit-skeleton-hero">
        <div className="public-summit-container">
          <div className="public-summit-skeleton public-summit-skeleton-tag" />
          <div className="public-summit-skeleton public-summit-skeleton-title" />
          <div className="public-summit-skeleton public-summit-skeleton-copy" />

          <div className="public-summit-skeleton-actions">
            <div className="public-summit-skeleton public-summit-skeleton-button" />
            <div className="public-summit-skeleton public-summit-skeleton-button" />
          </div>
        </div>
      </section>

      <section className="public-summit-container public-summit-loading-content">
        <LoaderCircle
          size={30}
          className="public-summit-spinning"
        />

        <p>
          Loading summit information...
        </p>
      </section>
    </main>
  );
};

/* ==========================================
   MAIN COMPONENT
========================================== */

const SummitPage = () => {
  const {
    summit,
    summitLoading,
    summitError,
    fetchPublicSummitBySlug,
    clearSummitError,
  } = useSummit();

  const loadSummit =
    useCallback(async () => {
      clearSummitError();

      await fetchPublicSummitBySlug(
        SUMMIT_SLUG
      );
    }, [
      clearSummitError,
      fetchPublicSummitBySlug,
    ]);

  useEffect(() => {
    loadSummit();
  }, [loadSummit]);

  const summitEvent = useMemo(
    () =>
      getSummitPayload(summit),
    [summit]
  );

  const venue = useMemo(
    () =>
      getVenueDetails(
        summitEvent
      ),
    [summitEvent]
  );

  const highlights = useMemo(
    () =>
      getHighlights(
        summitEvent
      ),
    [summitEvent]
  );

  const contact = useMemo(
    () =>
      getContactDetails(
        summitEvent
      ),
    [summitEvent]
  );

  const title =
    summitEvent?.title ||
    summitEvent?.name ||
    "Coast Youth Summit 2026";

  const theme =
    summitEvent?.theme ||
    summitEvent?.tagline ||
    "Empowering Coastal Youth for Sustainable Development";

  const description =
    summitEvent?.description ||
    summitEvent?.summary ||
    summitEvent?.about ||
    "The Coast Youth Summit brings together young people, leaders, partners and institutions to discuss opportunities, innovation, leadership and sustainable development across Kenya's Coast Region.";

  const startDate =
    summitEvent?.startDate ||
    summitEvent?.eventDate ||
    summitEvent?.date;

  const endDate =
    summitEvent?.endDate;

  const registrationStatus = String(
  summitEvent?.registrationStatus ||
  summitEvent?.registration?.status ||
  ""
).toLowerCase();

const registrationOpen =
  summitEvent?.registrationOpen === true ||
  summitEvent?.isRegistrationOpen === true ||
  summitEvent?.registration?.isOpen === true ||
  registrationStatus === "open";

  const eventStatus =
    summitEvent?.status ||
    summitEvent?.eventStatus ||
    "upcoming";

  const totalCapacity =
    ensureNumber(
      summitEvent?.capacity ??
        summitEvent?.totalCapacity ??
        summitEvent?.registration
          ?.capacity
    );

  const totalRegistered =
    ensureNumber(
      summitEvent?.registeredParticipants ??
        summitEvent?.totalRegistered ??
        summitEvent?.registrationsCount ??
        summitEvent?.registration
          ?.totalRegistered
    );

  const backendRemainingSlots =
    summitEvent?.remainingSlots ??
    summitEvent?.registration
      ?.remainingSlots;

  const remainingSlots =
    backendRemainingSlots !==
    undefined
      ? ensureNumber(
          backendRemainingSlots
        )
      : Math.max(
          totalCapacity -
            totalRegistered,
          0
        );

  const registrationFull =
    totalCapacity > 0 &&
    remainingSlots <= 0;

  const canRegister =
    registrationOpen &&
    !registrationFull;

  const heroImage =
    summitEvent?.heroImage?.url ||
    summitEvent?.heroImage ||
    summitEvent?.bannerImage?.url ||
    summitEvent?.bannerImage ||
    summitEvent?.image?.url ||
    summitEvent?.image ||
    "/images/hero/hero.jpg";

  if (
    summitLoading &&
    !summit
  ) {
    return <SummitPageSkeleton />;
  }

  if (
    summitError &&
    !summit
  ) {
    return (

      <main className="public-summit-page">
        <section className="public-summit-error">
          <span>
            <AlertCircle
              size={34}
              aria-hidden="true"
            />
          </span>

          <h1>
            Summit information is
            unavailable
          </h1>

          <p>{summitError}</p>

          <button
            type="button"
            onClick={loadSummit}
            disabled={summitLoading}
          >
            <RefreshCw
              size={18}
              className={
                summitLoading
                  ? "public-summit-spinning"
                  : ""
              }
            />

            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
  <>
    <Navbar />

    <main className="public-summit-page"> 
      {/* ======================================
          HERO
      ====================================== */}

      <section 
        className="public-summit-hero"
        style={{
          "--public-summit-hero-image":
            `url("${heroImage}")`,
        }}
      >
        <div className="public-summit-hero-overlay" />

        <div className="public-summit-container public-summit-hero-content">
          <div className="public-summit-hero-copy">
            <span className="public-summit-kicker">
              <Sparkles
                size={16}
                aria-hidden="true"
              />

              Coast Youth Summit
            </span>

            <h1>{title}</h1>

            <p className="public-summit-theme">
              {theme}
            </p>

            <div className="public-summit-hero-meta">
              <span>
                <CalendarDays
                  size={18}
                  aria-hidden="true"
                />

                {formatDate(
                  startDate
                )}

                {endDate &&
                endDate !== startDate
                  ? ` – ${formatDate(
                      endDate
                    )}`
                  : ""}
              </span>

              <span>
                <MapPin
                  size={18}
                  aria-hidden="true"
                />

                {venue.displayText}
              </span>
            </div>

            <div className="public-summit-hero-actions">
              {canRegister ? (
                <Link
                  to="/summit/register"
                  className="public-summit-primary-action"
                >
                  Register now
                  <ArrowRight
                    size={18}
                    aria-hidden="true"
                  />
                </Link>
              ) : (
                <Link
    to="/summit/register"
    className="public-summit-primary-action"
  >
    Register now
    <ArrowRight
      size={18}
      aria-hidden="true"
    />
  </Link>
              )}

              <Link
                to="/summit/ticket"
                className="public-summit-secondary-action"
              >
                <Ticket
                  size={18}
                  aria-hidden="true"
                />

                Find my ticket
              </Link>
            </div>
          </div>

          <aside className="public-summit-hero-card">
            <span className="public-summit-status">
              {formatText(
                eventStatus
              )}
            </span>

            <h2>
              Summit information
            </h2>

            <dl>
              <div>
                <dt>Date</dt>
                <dd>
                  {formatDate(
                    startDate
                  )}
                </dd>
              </div>

              {formatTime(
                startDate
              ) && (
                <div>
                  <dt>Time</dt>
                  <dd>
                    {formatTime(
                      startDate
                    )}
                  </dd>
                </div>
              )}

              <div>
                <dt>Venue</dt>
                <dd>
                  {venue.name}
                </dd>
              </div>

              {venue.county && (
                <div>
                  <dt>County</dt>
                  <dd>
                    {venue.county}
                  </dd>
                </div>
              )}

              <div>
                <dt>
                  Registration
                </dt>
                <dd>
                  {canRegister
                    ? "Open"
                    : registrationFull
                      ? "Full"
                      : "Closed"}
                </dd>
              </div>
            </dl>

            {venue.mapUrl && (
              <a
                href={venue.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="public-summit-map-link"
              >
                <MapPin
                  size={16}
                  aria-hidden="true"
                />

                View venue map
              </a>
            )}
          </aside>
        </div>
      </section>

      {/* ======================================
          SUMMIT STATISTICS
      ====================================== */}

      <section className="public-summit-stats-section">
        <div className="public-summit-container public-summit-stats">
          <article>
            <span>
              <Users
                size={22}
                aria-hidden="true"
              />
            </span>

            <div>
              <strong>
                {totalRegistered > 0
                  ? formatNumber(
                      totalRegistered
                    )
                  : "Open"}
              </strong>

              <small>
                Registered participants
              </small>
            </div>
          </article>

          <article>
            <span>
              <Ticket
                size={22}
                aria-hidden="true"
              />
            </span>

            <div>
              <strong>
                {totalCapacity > 0
                  ? formatNumber(
                      totalCapacity
                    )
                  : "Available"}
              </strong>

              <small>
                Summit capacity
              </small>
            </div>
          </article>

          <article>
            <span>
              <CheckCircle2
                size={22}
                aria-hidden="true"
              />
            </span>

            <div>
              <strong>
                {totalCapacity > 0
                  ? formatNumber(
                      remainingSlots
                    )
                  : "Open"}
              </strong>

              <small>
                Remaining spaces
              </small>
            </div>
          </article>

          <article>
            <span>
              <ShieldCheck
                size={22}
                aria-hidden="true"
              />
            </span>

            <div>
              <strong>
                Secure
              </strong>

              <small>
                Digital ticketing
              </small>
            </div>
          </article>
        </div>
      </section>

     
      {/* ======================================
          ABOUT
      ====================================== */}

      <section className="public-summit-section">
        <div className="public-summit-container public-summit-about-grid">
          <div className="public-summit-section-heading">
            <span>
              About the summit
            </span>

            <h2>
              A platform for coastal
              youth voices and
              opportunities
            </h2>
          </div>

          <div className="public-summit-about-copy">
            <p>{description}</p>

            <div className="public-summit-about-points">
              <span>
                <CheckCircle2
                  size={18}
                  aria-hidden="true"
                />
                Youth leadership and
                participation
              </span>

              <span>
                <CheckCircle2
                  size={18}
                  aria-hidden="true"
                />
                Economic empowerment
                and employment
              </span>

              <span>
                <CheckCircle2
                  size={18}
                  aria-hidden="true"
                />
                Climate action and the
                blue economy
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================
          HIGHLIGHTS
      ====================================== */}

      <section className="public-summit-section public-summit-highlights-section">
        <div className="public-summit-container">
          <div className="public-summit-centered-heading">
            <span>
              What to expect
            </span>

            <h2>
              Summit highlights
            </h2>

            <p>
              Engage, learn, connect
              and contribute to the
              future of the Coast
              Region.
            </p>
          </div>

          <div className="public-summit-highlight-grid">
            {(highlights.length >
            0
              ? highlights
              : [
                  {
                    title:
                      "Leadership conversations",
                    description:
                      "Engage with youth leaders, institutions and decision-makers.",
                  },
                  {
                    title:
                      "Skills and opportunities",
                    description:
                      "Discover education, employment, enterprise and innovation opportunities.",
                  },
                  {
                    title:
                      "Networking",
                    description:
                      "Build meaningful connections with young people and partners from across the region.",
                  },
                ]
            ).map(
              (
                highlight,
                index
              ) => (
                <article
                  key={`${highlight.title}-${index}`}
                >
                  <span>
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  <h3>
                    {highlight.title}
                  </h3>

                  {highlight.description && (
                    <p>
                      {
                        highlight.description
                      }
                    </p>
                  )}
                </article>
              )
            )}
          </div>
        </div>
      </section>


 <section>
        <PosterGeneratorCTA />
      </section>

      
      {/* ======================================
    SUMMIT LEADERSHIP AND GUESTS
====================================== */}

<section className="public-summit-section public-summit-guests-section">
  <div className="public-summit-container">
    <div className="public-summit-centered-heading">
      <span>Summit leadership</span>

      <h2>Chief Guest and Hosts</h2>

      <p>
        Meet the distinguished leaders
        expected to grace and host the Coast
        Youth Summit 2026.
      </p>
    </div>
      
      
      {/* ======================================
    PREMIUM LEADERSHIP
====================================== */}


<div className="public-summit-premium-grid">
  {SUMMIT_GUESTS.slice(0, 2).map(
    (guest, index) => (
      <article
        key={guest.name}
        className={`public-summit-premium-card ${
          index === 0 ? "chief-guest" : "host"
        }`}
      >
        <div className="public-summit-guest-image">
          <img
            src={guest.image}
            alt={guest.name}
            loading="lazy"
          />

          <span className="public-summit-guest-role">
            {guest.role}
          </span>
        </div>

        <div className="public-summit-guest-content">
          <small>
            {index === 0
              ? "Guest of Honour"
              : "Summit Host"}
          </small>

          <h3>{guest.name}</h3>

          <p>{guest.title}</p>
        </div>
      </article>
    )
  )}
</div>

{/* ======================================
    ORGANIZING HOSTS
====================================== */}

<div className="public-summit-host-heading">
  <h3>Summit Organizing Hosts</h3>

  <p>
    Working together to deliver the Coast
    Youth Summit 2026.
  </p>
</div>

<div className="public-summit-hosts-grid">
  {SUMMIT_GUESTS.slice(2).map(
    (guest) => (
      <article
        key={guest.name}
        className="public-summit-host-card"
      >
        <div className="public-summit-guest-image">
          <img
            src={guest.image}
            alt={guest.name}
            loading="lazy"
          />

          <span className="public-summit-guest-role">
            {guest.role}
          </span>
        </div>

        <div className="public-summit-guest-content">
          <small>Summit Host</small>

          <h3>{guest.name}</h3>

          <p>{guest.title}</p>
        </div>
      </article>
    )
  )}
</div>

{/* IMPORTANT:
    public-summit-hosts-grid ends above
*/}

<div className="public-summit-links-grid">
  <article className="public-summit-link-card">
    <span className="public-summit-link-tag">
      Organizing Team
    </span>

    <h3>Planning Committee</h3>

    <p>
      Meet the dedicated team coordinating
      the planning, logistics and successful
      delivery of the Coast Youth Summit
      2026.
    </p>

    <Link
      to="/summit/planning-committee"
      className="public-summit-link-button"
    >
      View Planning Committee

      <ArrowRight
        size={18}
        aria-hidden="true"
      />
    </Link>
  </article>

  <article className="public-summit-link-card">
    <span className="public-summit-link-tag">
      Confirmed Guests
    </span>

    <h3>Distinguished Guests</h3>

    <p>
      View the leaders, government officials,
      development partners, keynote speakers
      and invited guests who have confirmed
      participation.
    </p>

    <Link
      to="/summit/guests"
      className="public-summit-link-button"
    >
      View Confirmed Guests

      <ArrowRight
        size={18}
        aria-hidden="true"
      />
    </Link>
  </article>
</div>
        </div>
      </section>

      {/* ======================================
          LOCATION
      ====================================== */}

      <section className="public-summit-section">
        <div className="public-summit-container public-summit-location-card">
          <div className="public-summit-location-icon">
            <MapPin
              size={30}
              aria-hidden="true"
            />
          </div>

          <div className="public-summit-location-copy">
            <span>
              Summit venue
            </span>

            <h2>{venue.name}</h2>

            <p>
              {[
                venue.address,
                venue.county,
              ]
                .filter(Boolean)
                .join(", ") ||
                "Full venue details will be shared with registered participants."}
            </p>
          </div>

          {venue.mapUrl && (
            <a
              href={venue.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open map
              <ArrowRight
                size={17}
                aria-hidden="true"
              />
            </a>
          )}
        </div>
      </section>

      {/* ======================================
          CTA
      ====================================== */}

      <section className="public-summit-cta">
        <div className="public-summit-container public-summit-cta-content">
          <div>
            <span>
              Join the summit
            </span>

            <h2>
              Be part of the Coast
              Region's youth
              conversation
            </h2>

            <p>
              Secure your place and
              receive your summit
              ticket and event
              information.
            </p>
          </div>

          <div className="public-summit-cta-actions">
            {canRegister ? (
              <Link
                to="/summit/register"
                className="public-summit-primary-action"
              >
                Register for the summit
                <ArrowRight
                  size={18}
                  aria-hidden="true"
                />
              </Link>
            ) : (
              <span className="public-summit-registration-closed dark">
                {registrationFull
                  ? "Registration capacity reached"
                  : "Registration is not open"}
              </span>
            )}

            <Link
              to="/summit/ticket"
              className="public-summit-secondary-action dark"
            >
              <Ticket
                size={18}
                aria-hidden="true"
              />
              Retrieve ticket
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================
          SUPPORT
      ====================================== */}

      {(contact.email ||
        contact.phone) && (
        <section className="public-summit-support">
          <div className="public-summit-container public-summit-support-content">
            <div>
              <span>
                Need assistance?
              </span>

              <p>
                Contact the summit
                support team for
                registration or ticket
                assistance.
              </p>
            </div>

            <div className="public-summit-support-links">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                >
                  <Mail
                    size={17}
                    aria-hidden="true"
                  />
                  {contact.email}
                </a>
              )}

              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                >
                  {contact.phone}
                </a>
              )}
            </div>
          </div>
        </section>
      )}

{/* ======================================
    EXHIBITOR BOOKING
====================================== */}

<section className="public-summit-exhibitors">
  <div className="public-summit-container">
    <div className="public-summit-centered-heading">
      <span>
        Exhibitor opportunities
      </span>

      <h2>
        Showcase your brand at the summit
      </h2>

      <p>
        Engage thousands of young people,
        leaders, institutions and partners
        attending the Coast Youth Summit
        2026.
      </p>
    </div>

    <div className="public-summit-exhibitor-grid">
      {EXHIBITOR_PLANS.map(
        (plan) => {
          const packageId =
            String(
              plan.id ||
                plan.name ||
                ""
            )
              .trim()
              .toLowerCase()
              .replace(/\s+/g, "_");

          return (
            <article
              key={
                plan.id ||
                plan.name
              }
              className={`public-summit-exhibitor-card ${
                plan.featured
                  ? "featured"
                  : ""
              }`}
            >
              {plan.featured && (
                <span className="public-summit-exhibitor-featured-label">
                  Best visibility
                </span>
              )}

              <div className="public-summit-exhibitor-card-header">
                <small>
                  Exhibitor package
                </small>

                <h3>
                  {plan.name}
                </h3>
              </div>

              <div className="public-summit-exhibitor-price">
                <span>KES</span>

                <strong>
                  {formatNumber(
                    plan.price
                  )}
                </strong>
              </div>

              <p>
                {plan.description}
              </p>

              <Link
                to={`/summit/exhibitor-register?package=${encodeURIComponent(
                  packageId
                )}`}
                className="public-summit-exhibitor-button"
              >
                Book this package

                <ArrowRight
                  size={17}
                  aria-hidden="true"
                />
              </Link>
            </article>
          );
        }
      )}
    </div>

    <div className="public-summit-exhibitor-contact">
      <div>
        <span>
          Need a customized package?
        </span>

        <p>
          Contact the summit team to discuss
          exhibition space, branding,
          sponsorship visibility and other
          partnership opportunities.
        </p>
      </div>

      <div className="public-summit-exhibitor-contact-links">
        <a
          href={`mailto:${
            contact.email ||
            "admin@jvp.co.ke"
          }?subject=${encodeURIComponent(
            "Exhibitor Booking Enquiry - Coast Youth Summit 2026"
          )}`}
        >
          <Mail
            size={17}
            aria-hidden="true"
          />

          Email the summit team
        </a>

        <a
          href={`https://wa.me/${String(
            contact.phone ||
              "0740504969"
          )
            .replace(/\D/g, "")
            .replace(
              /^0/,
              "254"
            )}?text=${encodeURIComponent(
            "Hello JVP, I would like to enquire about exhibiting at the Coast Youth Summit 2026."
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Enquire on WhatsApp
        </a>
      </div>
    </div>
  </div>
</section>

    </main>
      <Footer />
  </>
  );
};

export default SummitPage;
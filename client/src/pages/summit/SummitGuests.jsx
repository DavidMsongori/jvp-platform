import {
  ArrowLeft,
  Building2,
  Landmark,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import "./SummitGuests.css";

/* ==========================================
   CONFIRMED GUEST DATA
========================================== */

const CHIEF_GUEST = {
  name:
    "H.E. Dr. William Samoei Ruto, E.G.H.",

  position:
    "President of the Republic of Kenya and Commander-in-Chief of the Defence Forces",

  organization:
    "Government of the Republic of Kenya",

  image:
    "/images/summit/guests/william-ruto.jpg",
};

/*
 * Add confirmed guests to the appropriate
 * category below.
 *
 * Every guest should contain:
 * - name
 * - position
 * - organization
 * - image
 */

const GUEST_CATEGORIES = [
  {
    id: "government-leaders",

    title:
      "Government Leaders",

    description:
      "National and county government leaders confirmed to participate in the summit.",

    icon:
      Landmark,

    guests: [
      {
        name:
          "Hon. Fikirini Jacobs",

        position:
          "Principal Secretary, State Department for Youth Affairs and Creative Economy",

        organization:
          "Government of Kenya",

        image:
          "/images/summit/guests/fikirini.jpg",
      },
    ],
  },

  {
    id: "cabinet-principal-secretaries",

    title:
      "Cabinet Secretaries and Principal Secretaries",

    description:
      "Cabinet-level and senior national government officials attending the summit.",

    icon:
      ShieldCheck,

    guests: [],
  },

  {
    id: "governors",

    title:
      "Governors",

    description:
      "County governors and senior county leadership confirmed for the summit.",

    icon:
      MapPin,

    guests: [
      {
        name:
          "H.E. Gideon Mung'aro, E.G.H.",

        position:
          "Governor, Kilifi County",

        organization:
          "County Government of Kilifi",

        image:
          "/images/summit/guests/gideon-mungaro.jpg",
      },
    ],
  },

  {
    id: "legislators",

    title:
      "Members of Parliament and MCAs",

    description:
      "National Assembly members, senators and county assembly representatives.",

    icon:
      Landmark,

    guests: [],
  },

  {
    id: "development-partners",

    title:
      "Development Partners",

    description:
      "Representatives of development agencies, foundations and international institutions.",

    icon:
      Building2,

    guests: [],
  },

  {
    id: "corporate-partners",

    title:
      "Corporate Partners",

    description:
      "Private-sector leaders and organizations supporting youth development and the summit.",

    icon:
      Building2,

    guests: [],
  },

  {
    id: "youth-leaders",

    title:
      "Youth Leaders",

    description:
      "Distinguished youth leaders participating in the Coast Youth Summit 2026.",

    icon:
      Users,

    guests: [
      {
        name:
          "H.E. David Msongori",

        position:
          "President",

        organization:
          "Jumuiya ya Vijana wa Pwani",

        image:
          "/images/summit/guests/david-msongori.jpg",
      },

      {
        name:
          "Hon. James Kahindi",

        position:
          "Secretary General",

        organization:
          "Jumuiya ya Vijana wa Pwani",

        image:
          "/images/summit/guests/kahindi.jpg",
      },

      {
        name:
          "Hon. Sebastian Macgowan Mungah",

        position:
          "Youth Governor, Kilifi County",

        organization:
          "Jumuiya ya Vijana wa Pwani",

        image:
          "/images/summit/guests/sebastian.jpg",
      },
    ],
  },
];

/* ==========================================
   GUEST CARD
========================================== */

const GuestCard = ({
  guest,
}) => {
  return (
    <article className="summit-guests-card">
      <div className="summit-guests-card-image">
        <img
          src={guest.image}
          alt={guest.name}
          loading="lazy"
        />

        <span>
          Confirmed
        </span>
      </div>

      <div className="summit-guests-card-content">
        <h3>
          {guest.name}
        </h3>

        <p className="summit-guests-position">
          {guest.position}
        </p>

        <p className="summit-guests-organization">
          <Building2
            size={16}
            aria-hidden="true"
          />

          {guest.organization}
        </p>
      </div>
    </article>
  );
};

/* ==========================================
   CATEGORY SECTION
========================================== */

const GuestCategory = ({
  category,
}) => {
  const CategoryIcon =
    category.icon;

  return (
    <section
      className="summit-guests-category"
      id={category.id}
    >
      <header className="summit-guests-category-header">
        <span className="summit-guests-category-icon">
          <CategoryIcon
            size={24}
            aria-hidden="true"
          />
        </span>

        <div>
          <h2>
            {category.title}
          </h2>

          <p>
            {category.description}
          </p>
        </div>
      </header>

      {category.guests.length > 0 ? (
        <div className="summit-guests-grid">
          {category.guests.map(
            (guest) => (
              <GuestCard
                key={`${category.id}-${guest.name}`}
                guest={guest}
              />
            )
          )}
        </div>
      ) : (
        <div className="summit-guests-empty">
          <Users
            size={28}
            aria-hidden="true"
          />

          <div>
            <h3>
              Confirmations coming soon
            </h3>

            <p>
              Confirmed participants in this
              category will be published here.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

/* ==========================================
   MAIN PAGE
========================================== */

const SummitGuests = () => {
  const confirmedGuests =
    GUEST_CATEGORIES.reduce(
      (
        total,
        category
      ) =>
        total +
        category.guests.length,
      CHIEF_GUEST ? 1 : 0
    );

  return (
    <>
      <Navbar />

      <main className="summit-guests-page">
        {/* HERO */}

        <section className="summit-guests-hero">
          <div className="summit-guests-container">
            <Link
              to="/summit"
              className="summit-guests-back"
            >
              <ArrowLeft
                size={17}
                aria-hidden="true"
              />

              Back to summit
            </Link>

            <div className="summit-guests-hero-content">
              <span>
                Coast Youth Summit 2026
              </span>

              <h1>
                Confirmed Guests
              </h1>

              <p>
                Meet the distinguished
                government leaders,
                development partners,
                corporate representatives and
                youth leaders confirmed to
                participate in the summit.
              </p>

              <div className="summit-guests-hero-meta">
                <strong>
                  {confirmedGuests}
                </strong>

                <span>
                  Confirmed participants
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* CHIEF GUEST */}

        <section className="summit-guests-chief-section">
          <div className="summit-guests-container">
            <div className="summit-guests-section-heading">
              <span>
                Guest of Honour
              </span>

              <h2>
                Chief Guest
              </h2>

              <p>
                The distinguished chief guest
                expected to grace the Coast
                Youth Summit 2026.
              </p>
            </div>

            <article className="summit-guests-chief-card">
              <div className="summit-guests-chief-image">
                <img
                  src={CHIEF_GUEST.image}
                  alt={CHIEF_GUEST.name}
                />

                <span>
                  Chief Guest
                </span>
              </div>

              <div className="summit-guests-chief-content">
                <small>
                  Guest of Honour
                </small>

                <h2>
                  {CHIEF_GUEST.name}
                </h2>

                <p className="summit-guests-chief-position">
                  {CHIEF_GUEST.position}
                </p>

                <p className="summit-guests-chief-organization">
                  <Landmark
                    size={18}
                    aria-hidden="true"
                  />

                  {CHIEF_GUEST.organization}
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* CATEGORY NAVIGATION */}

        <section className="summit-guests-navigation-section">
          <div className="summit-guests-container">
            <div className="summit-guests-navigation">
              {GUEST_CATEGORIES.map(
                (category) => (
                  <a
                    key={category.id}
                    href={`#${category.id}`}
                  >
                    {category.title}
                  </a>
                )
              )}
            </div>
          </div>
        </section>

        {/* GUEST CATEGORIES */}

        <section className="summit-guests-list-section">
          <div className="summit-guests-container">
            {GUEST_CATEGORIES.map(
              (category) => (
                <GuestCategory
                  key={category.id}
                  category={category}
                />
              )
            )}
          </div>
        </section>

        {/* FOOTER CTA */}

        <section className="summit-guests-cta">
          <div className="summit-guests-container summit-guests-cta-content">
            <div>
              <span>
                Coast Youth Summit 2026
              </span>

              <h2>
                Join the regional youth
                conversation
              </h2>

              <p>
                Register for the summit and
                receive your digital ticket
                and event information.
              </p>
            </div>

            <div className="summit-guests-cta-actions">
              <Link
                to="/summit/register"
                className="primary"
              >
                Register now
              </Link>

              <Link
                to="/summit"
              >
                Summit information
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default SummitGuests;
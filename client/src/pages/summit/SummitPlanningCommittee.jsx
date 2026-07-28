import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Handshake,
  Mail,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import "./SummitPlanningCommittee.css";

/* ==========================================
   COMMITTEE DATA
========================================== */

const STEERING_COMMITTEE = [
  {
    name: "Emmanuel Kiraga",
    position: "Chairperson",
    description:
      "Provides overall leadership, direction and coordination of the Summit Secretariat and Steering Committee.",
    image:
      "/images/summit/committee/emmanuel-kiraga.jpg",
    featured: true,
  },
  {
    name: "Faith Haido",
    position: "Secretary",
    description:
      "Coordinates committee meetings, records proceedings and manages official Secretariat communication.",
    image:
      "/images/summit/committee/faith-haido.jpg",
  },
  {
    name: "David Msongori",
    position: "Treasurer",
    description:
      "Oversees financial planning, budgeting, accountability and expenditure coordination for the summit.",
    image:
      "/images/summit/committee/david-msongori.jpg",
  },
  {
    name: "James Kahindi Kalama",
    position:
      "Resource Mobilization and Partnerships",
    description:
      "Leads partnership engagement, sponsorship development and resource mobilization for the summit.",
    image:
      "/images/summit/committee/james-kahindi-kalama.jpg",
  },
  {
    name: "Mwangome Mjumbe",
    position: "Organizing Secretary",
    description:
      "Coordinates summit preparations, implementation schedules and organizational activities.",
    image:
      "/images/summit/committee/mwangome-mjumbe.jpg",
  },
  {
    name: "Miss Sidi",
    position:
      "Member — Protocol, Office of the Governor",
    description:
      "Supports official protocol planning, guest coordination and engagement with the Office of the Governor.",
    image:
      "/images/summit/committee/miss-sidi.jpg",
  },
  {
    name: "Mr. Mativo",
    position:
      "Member — County Spokesperson, Kilifi County",
    description:
      "Supports public communication, county coordination and strategic information sharing.",
    image:
      "/images/summit/committee/mr-mativo.jpg",
  },
  {
    name: "Miss Time",
    position:
      "Member — Deputy Protocol, Office of the Governor",
    description:
      "Supports protocol arrangements, official guest reception and event coordination.",
    image:
      "/images/summit/committee/miss-time.jpg",
  },
];

const UPCOMING_COMMITTEES = [
  {
    title:
      "Logistics and Protocol Committee",
    icon: ClipboardList,
    description:
      "Will coordinate venue preparation, transport, accommodation, hospitality, protocol, guest reception and movement.",
    responsibilities: [
      "Venue and event logistics",
      "Guest reception and protocol",
      "Transport and accommodation",
      "Hospitality coordination",
    ],
  },
  {
    title:
      "Media, Communications and Registration Committee",
    icon: Megaphone,
    description:
      "Will manage summit publicity, media engagement, digital communication, participant registration and information services.",
    responsibilities: [
      "Media and public relations",
      "Digital communication",
      "Participant registration",
      "Accreditation and information desk",
    ],
  },
  {
    title: "Mobilization Committee",
    icon: Users,
    description:
      "Will coordinate participant outreach and mobilization across counties, constituencies, institutions and youth networks.",
    responsibilities: [
      "County-level mobilization",
      "Youth and institutional outreach",
      "Participant coordination",
      "Community engagement",
    ],
  },
];

/* ==========================================
   MEMBER CARD
========================================== */

const CommitteeMemberCard = ({
  member,
  index,
}) => {
  return (
    <article
      className={`summit-committee-member-card ${
        member.featured
          ? "featured"
          : ""
      }`}
    >
      <div className="summit-committee-member-image">
        <img
          src={member.image}
          alt={member.name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src =
              "/images/summit/committee/member-placeholder.jpg";
          }}
        />

        <span className="summit-committee-member-number">
          {String(index + 1).padStart(
            2,
            "0"
          )}
        </span>

        {member.featured && (
          <span className="summit-committee-featured-badge">
            <BadgeCheck size={15} />
            Committee Chair
          </span>
        )}
      </div>

      <div className="summit-committee-member-content">
        <small>
          Summit Secretariat
        </small>

        <h3>{member.name}</h3>

        <strong>
          {member.position}
        </strong>

        <p>
          {member.description}
        </p>
      </div>
    </article>
  );
};

/* ==========================================
   MAIN COMPONENT
========================================== */

const SummitPlanningCommittee = () => {
  return (
    <>
      <Navbar />

      <main className="summit-planning-page">
        {/* ====================================
            HERO
        ===================================== */}

        <section className="summit-planning-hero">
          <div className="summit-planning-container">
            <Link
              to="/summit"
              className="summit-planning-back"
            >
              <ArrowLeft size={17} />
              Back to summit
            </Link>

            <div className="summit-planning-hero-layout">
              <div className="summit-planning-hero-copy">
                <span className="summit-planning-kicker">
                  <Sparkles size={16} />
                  Coast Youth Summit 2026
                </span>

                <h1>
                  Summit Planning Committee
                </h1>

                <p>
                  Meet the team providing
                  strategic leadership,
                  coordination and oversight
                  for the successful planning
                  and delivery of the Coast
                  Youth Summit 2026.
                </p>

                <div className="summit-planning-hero-actions">
                  <a
                    href="#steering-committee"
                    className="primary"
                  >
                    Meet the Secretariat
                    <ArrowRight size={18} />
                  </a>

                  <a
                    href="#upcoming-committees"
                    className="secondary"
                  >
                    View subcommittees
                  </a>
                </div>
              </div>

              <aside className="summit-planning-hero-card">
                <span>
                  <ShieldCheck size={25} />
                </span>

                <small>
                  Current structure
                </small>

                <strong>
                  Summit Secretariat and
                  Steering Committee
                </strong>

                <p>
                  The Steering Committee is
                  currently coordinating the
                  summit as additional
                  technical committees are
                  established.
                </p>

                <dl>
                  <div>
                    <dt>
                      Current members
                    </dt>

                    <dd>
                      {
                        STEERING_COMMITTEE.length
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Planned committees
                    </dt>

                    <dd>
                      {
                        UPCOMING_COMMITTEES.length
                      }
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>
          </div>
        </section>

        {/* ====================================
            OVERVIEW
        ===================================== */}

        <section className="summit-planning-overview">
          <div className="summit-planning-container summit-planning-overview-grid">
            <article>
              <span>
                <BriefcaseBusiness
                  size={22}
                />
              </span>

              <div>
                <strong>
                  Strategic leadership
                </strong>

                <p>
                  Providing policy direction
                  and coordinating summit
                  planning.
                </p>
              </div>
            </article>

            <article>
              <span>
                <Handshake size={22} />
              </span>

              <div>
                <strong>
                  Partnerships
                </strong>

                <p>
                  Engaging government,
                  institutions, sponsors and
                  development partners.
                </p>
              </div>
            </article>

            <article>
              <span>
                <CalendarDays size={22} />
              </span>

              <div>
                <strong>
                  Event coordination
                </strong>

                <p>
                  Aligning timelines,
                  responsibilities and summit
                  implementation activities.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* ====================================
            STEERING COMMITTEE
        ===================================== */}

        <section
          id="steering-committee"
          className="summit-planning-section"
        >
          <div className="summit-planning-container">
            <div className="summit-planning-section-heading">
              <span>
                Current committee
              </span>

              <h2>
                Summit Secretariat and
                Steering Committee
              </h2>

              <p>
                The Secretariat and Steering
                Committee provides the central
                leadership and coordination
                required to prepare and deliver
                the summit.
              </p>
            </div>

            <div className="summit-committee-members-grid">
              {STEERING_COMMITTEE.map(
                (member, index) => (
                  <CommitteeMemberCard
                    key={member.name}
                    member={member}
                    index={index}
                  />
                )
              )}
            </div>
          </div>
        </section>

        {/* ====================================
            UPCOMING COMMITTEES
        ===================================== */}

        <section
          id="upcoming-committees"
          className="summit-planning-section summit-planning-upcoming-section"
        >
          <div className="summit-planning-container">
            <div className="summit-planning-section-heading centered">
              <span>
                Technical committees
              </span>

              <h2>
                Committees to be established
              </h2>

              <p>
                Additional committees will be
                constituted to support the
                Steering Committee in key
                operational areas.
              </p>
            </div>

            <div className="summit-planning-upcoming-grid">
              {UPCOMING_COMMITTEES.map(
                (committee) => {
                  const Icon =
                    committee.icon;

                  return (
                    <article
                      key={committee.title}
                      className="summit-planning-upcoming-card"
                    >
                      <span className="summit-planning-upcoming-icon">
                        <Icon size={25} />
                      </span>

                      <small>
                        To be established
                      </small>

                      <h3>
                        {committee.title}
                      </h3>

                      <p>
                        {
                          committee.description
                        }
                      </p>

                      <ul>
                        {committee.responsibilities.map(
                          (
                            responsibility
                          ) => (
                            <li
                              key={
                                responsibility
                              }
                            >
                              <CheckCircle2
                                size={15}
                              />
                              {
                                responsibility
                              }
                            </li>
                          )
                        )}
                      </ul>
                    </article>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* ====================================
            COMMITTEE NOTICE
        ===================================== */}

        <section className="summit-planning-notice">
          <div className="summit-planning-container summit-planning-notice-content">
            <div>
              <span>
                Committee development
              </span>

              <h2>
                More committee members will be
                announced
              </h2>

              <p>
                Membership of the technical
                committees will be published
                once appointments and
                confirmations are completed.
              </p>
            </div>

            <Link
              to="/summit"
              className="summit-planning-notice-button"
            >
              Summit information
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* ====================================
            CONTACT
        ===================================== */}

        <section className="summit-planning-contact">
          <div className="summit-planning-container summit-planning-contact-content">
            <span>
              <Mail size={22} />
            </span>

            <div>
              <small>
                Planning and partnership
                enquiries
              </small>

              <h2>
                Contact the Summit Secretariat
              </h2>

              <p>
                Institutions, partners and
                stakeholders interested in
                supporting the summit may
                contact the Secretariat through
                the official JVP communication
                channels.
              </p>
            </div>

            <Link to="/contact">
              Contact JVP
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default SummitPlanningCommittee;
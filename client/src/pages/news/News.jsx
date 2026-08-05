import {
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Newspaper,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import "./News.css";

/* ==========================================================
   SOCIAL LINKS
========================================================== */

const SOCIAL_ACCOUNTS = [
  {
    name: "Facebook",
    shortName: "f",
    username:
      "Jumuiya ya Vijana wa Pwani",
    description:
      "Follow official announcements, community activities and youth engagement updates.",
    link:
      "https://www.facebook.com/",
    className:
      "facebook",
  },
  {
    name: "X",
    shortName: "X",
    username:
      "@JVPConnect",
    description:
      "Follow live updates, statements, opportunities and regional conversations.",
    link:
      "https://x.com/",
    className:
      "twitter",
  },
  {
    name: "Instagram",
    shortName: "IG",
    username:
      "@jvpconnect",
    description:
      "View photos, videos, event highlights and stories from across the Coast Region.",
    link:
      "https://www.instagram.com/",
    className:
      "instagram",
  },
];

/* ==========================================================
   SAMPLE NEWS
========================================================== */

const FEATURED_NEWS = {
  category:
    "Featured Story",

  title:
    "Coast Youth Summit Brings Together Young People Across the Region",

  excerpt:
    "The Coast Youth Summit provides a platform for young people, institutions and development partners to discuss opportunities, leadership, innovation and regional development.",

  date:
    "August 2026",

  image:
    "/images/news/news-featured.jpg",

  link:
    "#",
};

const NEWS_ITEMS = [
  {
    id: 1,

    category:
      "Announcements",

    title:
      "Registration Open for Coast Youth Summit 2026",

    excerpt:
      "Young people from the six Coastal Counties are invited to register and secure their summit entry tickets.",

    date:
      "3 August 2026",

    image:
      "/images/news/news1.jpg",
  },
  {
    id: 2,

    category:
      "Opportunities",

    title:
      "Exhibitor Opportunities Available at the Summit",

    excerpt:
      "Youth enterprises, institutions and organizations can showcase their products, services and programmes.",

    date:
      "2 August 2026",

    image:
      "/images/news/news2.jpg",
  },
  {
    id: 3,

    category:
      "Leadership",

    title:
      "JVP Strengthens Regional Youth Leadership Structures",

    excerpt:
      "The organization continues to establish inclusive leadership structures across counties, constituencies and wards.",

    date:
      "30 July 2026",

    image:
      "/images/news/news3.jpg",
  },
  {
    id: 4,

    category:
      "Partnerships",

    title:
      "New Partnerships to Support Youth Empowerment",

    excerpt:
      "JVP is expanding partnerships in education, entrepreneurship, climate action and employment opportunities.",

    date:
      "28 July 2026",

    image:
      "/images/news/news4.jpg",
  },
];

/* ==========================================================
   COMPONENT
========================================================== */

export default function News() {
  return (
    <div className="public-news-page">
      <Navbar />

      {/* ====================================================
          HERO
      ==================================================== */}

      <section className="public-news-hero">
        <div className="public-news-hero-overlay" />

        <div className="public-news-container public-news-hero-content">
          <span className="public-news-eyebrow">
            News and stories
          </span>

          <h1>
            Latest News
          </h1>

          <p>
            News, announcements, opportunities,
            statements and success stories from
            Jumuiya ya Vijana wa Pwani.
          </p>
        </div>
      </section>

      {/* ====================================================
          SOCIAL MEDIA
      ==================================================== */}

      <section className="public-news-social-section">
        <div className="public-news-container">
          <div className="public-news-section-heading">
            <span>
              Follow the conversation
            </span>

            <h2>
              JVP on social media
            </h2>

            <p>
              Stay connected with our latest
              announcements, photos, videos,
              activities and public statements.
            </p>
          </div>

          <div className="public-news-social-grid">
            {SOCIAL_ACCOUNTS.map(
              (account) => {
            

                return (
                  <article
                    key={
                      account.name
                    }
                    className={`public-news-social-card ${account.className}`}
                  >
                    <div className="public-news-social-card-header">
                     <span className="public-news-social-brand-icon">
  {account.shortName}
</span>

                      <div>
                        <small>
                          Official account
                        </small>

                        <h3>
                          {
                            account.name
                          }
                        </h3>
                      </div>
                    </div>

                    <div className="public-news-social-frame">
                      <div className="public-news-social-placeholder">
                        <div className="public-news-social-large-icon">
  {account.shortName}
</div>

                        <strong>
                          {
                            account.username
                          }
                        </strong>

                        <p>
                          {
                            account.description
                          }
                        </p>

                        <a
                          href={
                            account.link
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View on{" "}
                          {
                            account.name
                          }

                          <ExternalLink
  size={16}
  aria-hidden="true"
/>
                        </a>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* ====================================================
          FEATURED NEWS
      ==================================================== */}

      <section className="public-news-featured-section">
        <div className="public-news-container">
          <div className="public-news-section-heading left">
            <span>
              Featured update
            </span>

            <h2>
              Stories shaping the Coast
            </h2>
          </div>

          <article className="public-news-featured-card">
            <div className="public-news-featured-image">
              <img
                src={
                  FEATURED_NEWS.image
                }
                alt={
                  FEATURED_NEWS.title
                }
                onError={(
                  event
                ) => {
                  event.currentTarget.src =
                    "/images/branding/jvp-logo.png";
                }}
              />
            </div>

            <div className="public-news-featured-content">
              <span className="public-news-category">
                {
                  FEATURED_NEWS.category
                }
              </span>

              <h2>
                {
                  FEATURED_NEWS.title
                }
              </h2>

              <p>
                {
                  FEATURED_NEWS.excerpt
                }
              </p>

              <div className="public-news-meta">
                <CalendarDays
                  size={17}
                  aria-hidden="true"
                />

                <span>
                  {
                    FEATURED_NEWS.date
                  }
                </span>
              </div>

              <a
                href={
                  FEATURED_NEWS.link
                }
                className="public-news-read-more"
              >
                Read full story

                <ArrowRight
                  size={17}
                  aria-hidden="true"
                />
              </a>
            </div>
          </article>
        </div>
      </section>

      {/* ====================================================
          LATEST UPDATES
      ==================================================== */}

      <section className="public-news-updates-section">
        <div className="public-news-container">
          <div className="public-news-section-heading">
            <span>
              Latest updates
            </span>

            <h2>
              News, opportunities and announcements
            </h2>

            <p>
              Explore recent updates from JVP programmes,
              leadership, partnerships and community
              activities.
            </p>
          </div>

          <div className="public-news-grid">
            {NEWS_ITEMS.map(
              (item) => (
                <article
                  key={item.id}
                  className="public-news-card"
                >
                  <div className="public-news-card-image">
                    <img
                      src={
                        item.image
                      }
                      alt={
                        item.title
                      }
                      onError={(
                        event
                      ) => {
                        event.currentTarget.src =
                          "/images/branding/jvp-logo.png";
                      }}
                    />
                  </div>

                  <div className="public-news-card-content">
                    <span className="public-news-category">
                      {
                        item.category
                      }
                    </span>

                    <h3>
                      {
                        item.title
                      }
                    </h3>

                    <p>
                      {
                        item.excerpt
                      }
                    </p>

                    <div className="public-news-card-footer">
                      <span>
                        <CalendarDays
                          size={15}
                          aria-hidden="true"
                        />

                        {
                          item.date
                        }
                      </span>

                      <button
                        type="button"
                      >
                        Read more

                        <ArrowRight
                          size={15}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      {/* ====================================================
          CALL TO ACTION
      ==================================================== */}

      <section className="public-news-cta">
        <div className="public-news-container public-news-cta-inner">
          <div>
            <span>
              Stay informed
            </span>

            <h2>
              Never miss an important JVP update
            </h2>

            <p>
              Follow our official platforms for
              opportunities, events, public statements
              and youth empowerment programmes.
            </p>
          </div>

          <a
            href="/contact"
          >
            <Newspaper
              size={19}
              aria-hidden="true"
            />

            Contact the communications team
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
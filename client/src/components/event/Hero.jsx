import {
  CalendarDays,
  MapPin,
  Search,
  Users,
} from "lucide-react";

import "./Hero.css";

import heroImage from "../../assets/images/coastal-hero.jpg";

const Hero = ({
  search = "",
  statistics = {},
  onSearch,
}) => {
  const {
    totalEvents = 0,
    upcomingEvents = 0,
    featuredEvents = 0,
  } = statistics;

  return (
    <section
      className="events-hero"
      style={{
        backgroundImage: `url(${heroImage})`,
      }}
    >
      <div className="events-hero__overlay" />
      <div className="events-hero__gradient" />

      <div className="events-hero__container">
        <div className="events-hero__content">

          <div className="events-hero__eyebrow">
            <CalendarDays size={13} />
            <span>JVP CONNECT EVENTS</span>
          </div>

          <h1>
            Connect.
            <span> Participate.</span>
            <br />
            Make an Impact.
          </h1>

          <p>
            Discover youth forums, trainings, summits,
            workshops and community activities happening
            across the Coast Region.
          </p>

          <div className="events-search">
            <Search
              size={17}
              className="events-search__icon"
            />

            <input
              type="search"
              value={search}
              placeholder="Search events..."
              aria-label="Search JVP events"
              onChange={(event) =>
                onSearch?.(event.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="events-search__clear"
                onClick={() => onSearch?.("")}
                aria-label="Clear event search"
              >
                ×
              </button>
            )}
          </div>

          <div className="events-hero__stats">

            <div className="events-hero-stat">
              <div className="events-hero-stat__icon">
                <CalendarDays size={15} />
              </div>

              <div>
                <strong>{totalEvents}</strong>
                <span>Published Events</span>
              </div>
            </div>

            <div className="events-hero-stat">
              <div className="events-hero-stat__icon">
                <Users size={15} />
              </div>

              <div>
                <strong>{upcomingEvents}</strong>
                <span>Upcoming</span>
              </div>
            </div>

            <div className="events-hero-stat">
              <div className="events-hero-stat__icon">
                <MapPin size={15} />
              </div>

              <div>
                <strong>{featuredEvents}</strong>
                <span>Featured</span>
              </div>
            </div>

          </div>

          <div className="events-hero__location">
            <MapPin size={12} />
            <span>
              Events and opportunities across Kenya's Coast Region
            </span>
          </div>

        </div>

        <div className="events-hero__side">
          <span>EVENTS</span>
          <strong>01</strong>
        </div>
      </div>
    </section>
  );
};

export default Hero;
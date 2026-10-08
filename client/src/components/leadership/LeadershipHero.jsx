import {
  ChevronRight,
  Users,
} from "lucide-react";

import "./LeadershipHero.css";

export default function LeadershipHero() {
  return (
    <section
      className="leadership-hero"
      aria-labelledby="leadership-hero-title"
      style={{
        backgroundImage:
          'url("/images/leadership-hero.jpg")',
      }}
    >
      <div className="leadership-hero__overlay" />

      <div className="leadership-hero__gradient" />

      <div className="leadership-hero__container">
        <div className="leadership-hero__content">
          <span className="leadership-hero__eyebrow">
            <Users size={12} />
            JVP Leadership
          </span>

          <h1
            id="leadership-hero-title"
            className="leadership-hero__title"
          >
            Leadership That
            <span>Serves. Leads. Transforms.</span>
          </h1>

          <p className="leadership-hero__description">
            Meet the leaders guiding Jumuiya ya Vijana wa
            Pwani and advancing youth participation,
            opportunity and development across the Coast
            Region.
          </p>

          <div className="leadership-hero__breadcrumb">
            <span>Leadership</span>

            <ChevronRight size={11} />

            <span>JVP Coast Region</span>
          </div>
        </div>

        <div
          className="leadership-hero__side"
          aria-hidden="true"
        >
          <span>JVP Leadership</span>
          <strong>01</strong>
        </div>
      </div>
    </section>
  );
}
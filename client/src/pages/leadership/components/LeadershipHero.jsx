import "./LeadershipHero.css";

export default function LeadershipHero() {
  return (
    <section
      className="leadership-hero"
      aria-labelledby="leadership-hero-title"
    >
      <div className="leadership-hero-inner">

        <div className="leadership-hero-copy">
          <span className="leadership-hero-eyebrow">
            Jumuiya ya Vijana wa Pwani
          </span>

          <h1 id="leadership-hero-title">
            Leadership
            <span>That Serves.</span>
          </h1>

          <div className="leadership-hero-divider" />

          <p className="leadership-hero-description">
            Meet the leaders entrusted with guiding, representing
            and advancing the aspirations of young people across
            the Coastal Region.
          </p>
        </div>

        <div className="leadership-hero-stats">
          <div className="leadership-stat">
            <strong>6</strong>
            <span>Coastal Counties</span>
          </div>

          <div className="leadership-stat-divider" />

          <div className="leadership-stat">
            <strong>1</strong>
            <span>Shared Vision</span>
          </div>

          <div className="leadership-stat-divider" />

          <div className="leadership-stat">
            <strong>∞</strong>
            <span>Youth Potential</span>
          </div>
        </div>

      </div>
    </section>
  );
}
import "./LeadershipHero.css";

import { Users, MapPinned, ShieldCheck } from "lucide-react";

export default function LeadershipHero() {
  return (
    <section className="leadership-hero">

      <div className="leadership-hero-overlay" />

      <div className="leadership-hero-content">

        <span className="leadership-badge">
          JVP CONNECT
        </span>

        <h1>
          Meet the Leadership of
          <span> Jumuiya ya Vijana wa Pwani</span>
        </h1>

        <p>
          A dedicated team of young leaders committed to
          empowering communities, promoting inclusive
          leadership, advocating for youth interests and
          driving sustainable development across the Coast
          Region of Kenya.
        </p>

        <div className="leadership-hero-stats">

          <div className="hero-stat">

            <Users size={28} />

            <div>

              <strong>200+</strong>

              <span>Leaders</span>

            </div>

          </div>

          <div className="hero-stat">

            <MapPinned size={28} />

            <div>

              <strong>6</strong>

              <span>Counties</span>

            </div>

          </div>

          <div className="hero-stat">

            <ShieldCheck size={28} />

            <div>

              <strong>1</strong>

              <span>Regional Movement</span>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
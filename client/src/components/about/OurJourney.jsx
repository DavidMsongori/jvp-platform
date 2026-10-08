import {
  ArrowRight,
  Flag,
  Users,
  Leaf,
  Globe2,
  Rocket,
} from "lucide-react";
import { Link } from "react-router-dom";

import "./OurJourney.css";

const timeline = [
  {
    icon: Flag,
    year: "2025",
    title: "JVP Founded",
    description:
      "A regional movement created to unite and empower coastal youth.",
  },
  {
    icon: Users,
    year: "2025",
    title: "Youth Mobilization",
    description:
      "Growing youth participation across the six Coast counties.",
  },
  {
    icon: Leaf,
    year: "2026",
    title: "Leadership & Action",
    description:
      "Expanding leadership, climate and entrepreneurship initiatives.",
  },
  {
    icon: Globe2,
    year: "2026",
    title: "Coastal Youth Summit",
    description:
      "Connecting young leaders, innovators and development partners.",
  },
  {
    icon: Rocket,
    year: "Future",
    title: "Growing Together",
    description:
      "Creating more opportunities and sustainable impact for youth.",
  },
];

function OurJourney() {
  return (
    <section className="journey">
      <div className="journey-container">

        <div className="journey-header">
          <div>
            <span className="journey-eyebrow">
              OUR JOURNEY
            </span>

            <h2>
              From an idea to a
              <span> growing movement.</span>
            </h2>
          </div>

          <p>
            Every milestone moves us closer to a Coast
            where young people have the voice, skills
            and opportunities to shape their future.
          </p>
        </div>

        <div className="journey-timeline">
          <div className="journey-line" />

          {timeline.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                className="journey-item"
                key={item.title}
              >
                <div className="journey-marker">
                  <Icon size={15} />
                </div>

                <div className="journey-card">
                  <span className="journey-year">
                    {item.year}
                  </span>

                  <h3>{item.title}</h3>

                  <p>{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="journey-impact">
          <div className="journey-impact__intro">
            <span>WHERE WE ARE TODAY</span>
            <strong>Building the future together.</strong>
          </div>

          <div className="journey-stat">
            <strong>6</strong>
            <span>Coast Counties</span>
          </div>

          <div className="journey-stat">
            <strong>20K+</strong>
            <span>Youth Reached</span>
          </div>

          <div className="journey-stat">
            <strong>2025</strong>
            <span>Founded</span>
          </div>

          <Link
            to="/events"
            className="journey-link"
          >
            See what we're doing
            <ArrowRight size={15} />
          </Link>
        </div>

      </div>
    </section>
  );
}

export default OurJourney;
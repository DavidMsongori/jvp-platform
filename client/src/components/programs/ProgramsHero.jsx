
import { ChevronRight, Sprout } from "lucide-react";
import { Link } from "react-router-dom";

import "./ProgramsHero.css";

import heroImage from "../../assets/images/coastal-hero.jpg";

function ProgramsHero() {
  return (
    <section
      className="programs-hero"
      style={{
        backgroundImage: `url(${heroImage})`,
      }}
    >
      <div className="programs-hero__overlay" />
      <div className="programs-hero__gradient" />

      <div className="programs-hero__container">
        <div className="programs-hero__content">
          <div className="programs-hero__eyebrow">
            <Sprout size={13} />
            <span>JVP PROGRAMMES & IMPACT</span>
          </div>

          <h1>
            Turning Ideas Into Impact.
            <span> Empowering Coastal Youth.</span>
          </h1>

          <p>
            Discover how Jumuiya ya Vijana wa Pwani is creating opportunities
            for young people through leadership, entrepreneurship, climate
            action, agriculture, education and community-led initiatives.
          </p>

          <div className="programs-hero__breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={13} />
            <span>Programmes & Impact</span>
          </div>
        </div>

        <div className="programs-hero__side" aria-hidden="true">
          <span>JVP</span>
          <strong>02</strong>
        </div>
      </div>
    </section>
  );
}

export default ProgramsHero;
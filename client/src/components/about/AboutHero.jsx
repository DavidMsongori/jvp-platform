import { ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";

import "./AboutHero.css";

import heroImage from "../../assets/images/coastal-hero.jpg";

function AboutHero() {
  return (
    <section
      className="about-hero"
      style={{
        backgroundImage: `url(${heroImage})`,
      }}
    >
      <div className="about-hero__overlay" />
      <div className="about-hero__gradient" />

      <div className="about-hero__container">
        <div className="about-hero__content">

          <div className="about-hero__eyebrow">
            <Users size={13} />
            <span>ABOUT JVP</span>
          </div>

          <h1>
            Empowering Coastal Youth.
            <span> Shaping Our Future.</span>
          </h1>

          <p>
            Jumuiya ya Vijana wa Pwani brings together
            young people across Kenya's Coast to lead,
            connect, create opportunities and drive
            meaningful change.
          </p>

          <div className="about-hero__breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={13} />
            <span>About JVP</span>
          </div>

        </div>

        <div className="about-hero__side">
          <span>JVP</span>
          <strong>01</strong>
        </div>
      </div>
    </section>
  );
}

export default AboutHero;
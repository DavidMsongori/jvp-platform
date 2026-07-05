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
      <div className="about-overlay"></div>

      <div className="about-hero-content">

        <span>ABOUT JVP</span>

        <h1>
          Empowering Coastal Youth
          <br />
          Building Tomorrow's Leaders
        </h1>

        <p>
          Learn more about Jumuiya ya Vijana wa Pwani,
          our journey, leadership, values and our
          commitment to transforming lives across
          Kenya's Coast Region.
        </p>

        <div className="breadcrumb">

          Home

          <span>/</span>

          About

        </div>

      </div>

    </section>
  );
}

export default AboutHero;
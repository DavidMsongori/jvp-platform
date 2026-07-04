import "./CTA.css";

function CTA() {
  return (
    <section className="cta">

      <div className="cta-container">

        <span>JOIN THE MOVEMENT</span>

        <h2>
          Together We Can Build
          <br />
          A Better Future For Coastal Youth
        </h2>

        <p>
          Whether you are a student, entrepreneur, development partner,
          volunteer or institution, there is a place for you in the
          JVP movement.
        </p>

        <div className="cta-buttons">

          <a href="/register" className="cta-primary">
            Become a Member
          </a>

          <a href="/partners" className="cta-secondary">
            Partner With Us
          </a>

        </div>

      </div>

    </section>
  );
}

export default CTA;
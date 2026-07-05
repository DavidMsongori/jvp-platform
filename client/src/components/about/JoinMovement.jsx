import "./JoinMovement.css";

function JoinMovement() {

  return (

    <section className="join-movement">

      <div className="join-content">

        <span>JOIN THE MOVEMENT</span>

        <h2>

          Ready to Make a Difference?

        </h2>

        <p>

          Become part of a growing movement of young
          leaders creating opportunities, protecting
          the environment, promoting innovation and
          transforming communities across Kenya's
          Coast Region.

        </p>

        <div className="join-buttons">

          <a
            href="/register"
            className="join-primary"
          >
            Become a Member
          </a>

          <a
            href="/contact"
            className="join-secondary"
          >
            Partner With Us
          </a>

        </div>

      </div>

    </section>

  );

}

export default JoinMovement;
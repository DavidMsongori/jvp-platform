import { ArrowRight, Users, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

import "./CTA.css";

function CTA() {
  return (
    <section className="home-cta">

      <div className="home-cta__container">

        <div className="home-cta__content">

          <span className="home-cta__eyebrow">
            JOIN THE MOVEMENT
          </span>

          <h2>
            Your voice can help shape
            <span> the future of the Coast.</span>
          </h2>

          <p>
            Join a growing community of young people working
            together for stronger leadership, opportunity,
            innovation and sustainable development.
          </p>

        </div>

        <div className="home-cta__actions">

          <Link
            to="/register"
            className="home-cta__primary"
          >
            <Users size={17} />
            Join JVP
            <ArrowRight size={15} />
          </Link>

          <Link
            to="/login"
            className="home-cta__secondary"
          >
            <LogIn size={15} />
            Member Login
          </Link>

        </div>

      </div>

      <div className="home-cta__bottom">

        <span>
          Jumuiya ya Vijana wa Pwani
        </span>

        <span className="home-cta__dot" />

        <span>
          Mombasa · Kilifi · Kwale · Lamu · Tana River · Taita Taveta
        </span>

      </div>

    </section>
  );
}

export default CTA;
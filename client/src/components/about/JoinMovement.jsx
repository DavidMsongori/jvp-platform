import {
  ArrowRight,
  LogIn,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import "./JoinMovement.css";

function JoinMovement() {
  return (
    <section className="join-movement">
      <div className="join-movement__container">

        <div className="join-movement__content">

          <span className="join-movement__eyebrow">
            JOIN THE MOVEMENT
          </span>

          <h2>
            Your voice belongs
            <span> in the movement.</span>
          </h2>

          <p>
            Join young people across the Coast who are
            leading, creating opportunities, building
            communities and shaping a better future.
          </p>

        </div>

        <div className="join-movement__actions">

          <Link
            to="/register"
            className="join-movement__primary"
          >
            <Users size={16} />
            Become a Member
            <ArrowRight size={15} />
          </Link>

          <Link
            to="/login"
            className="join-movement__secondary"
          >
            <LogIn size={15} />
            Member Login
          </Link>

        </div>

      </div>

      <div className="join-movement__footer">
        <span>
          Jumuiya ya Vijana wa Pwani
        </span>

        <span className="join-movement__dot" />

        <span>
          Mombasa · Kilifi · Kwale · Lamu · Tana River · Taita Taveta
        </span>
      </div>
    </section>
  );
}

export default JoinMovement;
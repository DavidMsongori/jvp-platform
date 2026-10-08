import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarPlus,
  Users,
} from "lucide-react";

import "./NewsletterCTA.css";

function NewsletterCTA() {
  return (
    <section
      className="events-newsletter"
      aria-labelledby="events-newsletter-title"
    >
      <div className="events-newsletter__container">
        <div className="events-newsletter__content">
          <span className="events-newsletter__eyebrow">
            STAY CONNECTED
          </span>

          <h2
            id="events-newsletter-title"
            className="events-newsletter__title"
          >
            Be part of the{" "}
            <span>JVP movement.</span>
          </h2>

          <p className="events-newsletter__text">
            Join young people across the Coast
            Region and stay connected to events,
            opportunities, trainings, forums and
            activities shaping our communities.
          </p>
        </div>

        <div className="events-newsletter__actions">
          <Link
            to="/register"
            className="events-newsletter__primary"
          >
            <Users size={15} />

            <span>Become a Member</span>

            <ArrowRight size={14} />
          </Link>

          <Link
            to="/contact"
            className="events-newsletter__secondary"
          >
            <CalendarPlus size={14} />

            <span>Stay Connected</span>
          </Link>
        </div>
      </div>

      <div className="events-newsletter__bottom">
        <span>
          Jumuiya ya Vijana wa Pwani
        </span>

        <span className="events-newsletter__dot">
          •
        </span>

        <span>
          Leadership · Opportunity · Community · Impact
        </span>
      </div>
    </section>
  );
}

export default NewsletterCTA;
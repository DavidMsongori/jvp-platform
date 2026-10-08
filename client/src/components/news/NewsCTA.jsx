import { ArrowRight, Mail, Users } from "lucide-react";
import { Link } from "react-router-dom";

import "./NewsCTA.css";

function NewsCTA() {
  return (
    <section className="news-cta">
      <div className="news-cta__container">
        <div className="news-cta__content">
          <span className="news-cta__eyebrow">
            <Mail size={11} />
            STAY CONNECTED
          </span>

          <h2 className="news-cta__title">
            Be part of the story.
          </h2>

          <p className="news-cta__description">
            Stay informed about JVP opportunities, programmes,
            events and stories shaping the future of young people
            across the Coast Region.
          </p>
        </div>

        <div className="news-cta__actions">
          <Link
            to="/register"
            className="news-cta__primary"
          >
            <Users size={14} />
            <span>Join JVP</span>
            <ArrowRight size={14} />
          </Link>

          <Link
            to="/contact"
            className="news-cta__secondary"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NewsCTA;
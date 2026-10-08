import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import "./ExecutiveHero.css";

export default function ExecutiveHero({
  count = 0,
}) {
  return (
    <section
      className="executive-hero"
      aria-labelledby="executive-hero-title"
    >
      <div className="executive-hero__overlay" />

      <div className="executive-hero__gradient" />

      <div className="executive-hero__container">
        <div className="executive-hero__content">
          <Link
            to="/leadership"
            className="executive-hero__back"
          >
            <ArrowLeft size={12} />
            Back to Leadership
          </Link>

          <span className="executive-hero__eyebrow">
            <BriefcaseBusiness size={12} />
            JVP Regional Leadership
          </span>

          <h1
            id="executive-hero-title"
            className="executive-hero__title"
          >
            Regional
            <span>Executive Team</span>
          </h1>

          <p className="executive-hero__description">
            Meet the President, Deputy President and
            Cabinet Secretaries entrusted with providing
            strategic leadership and advancing JVP's
            regional agenda across the Coast.
          </p>

          <div className="executive-hero__breadcrumb">
            <span>Leadership</span>
            <ChevronRight size={10} />
            <span>Executive Team</span>
          </div>
        </div>

        <div
          className="executive-hero__stat"
          aria-label={`${count} executive team members`}
        >
          <strong>{count}</strong>
          <span>
            {count === 1 ? "Cabinet Member" : "Cabinet Members"}
          </span>
        </div>
      </div>
    </section>
  );
}
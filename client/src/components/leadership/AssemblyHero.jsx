import {
  ArrowLeft,
  ChevronRight,
  Landmark,
} from "lucide-react";
import { Link } from "react-router-dom";

import "./AssemblyHero.css";

export default function AssemblyHero({
  count = 0,
}) {
  return (
    <section
      className="assembly-hero"
      aria-labelledby="assembly-hero-title"
    >
      <div className="assembly-hero__overlay" />

      <div className="assembly-hero__gradient" />

      <div className="assembly-hero__container">
        <div className="assembly-hero__content">
          <Link
            to="/leadership"
            className="assembly-hero__back"
          >
            <ArrowLeft size={12} />
            Back to Leadership
          </Link>

          <span className="assembly-hero__eyebrow">
            <Landmark size={12} />
            JVP Representative Leadership
          </span>

          <h1
            id="assembly-hero-title"
            className="assembly-hero__title"
          >
            JVP Youth
            <span>Assembly</span>
          </h1>

          <p className="assembly-hero__description">
            Meet the young representatives entrusted with
            championing youth voices, accountability, policy
            advocacy and inclusive development across the
            Coast Region.
          </p>

          <div className="assembly-hero__breadcrumb">
            <span>Leadership</span>
            <ChevronRight size={10} />
            <span>Youth Assembly</span>
          </div>
        </div>

        <div
          className="assembly-hero__stat"
          aria-label={`${count} Youth Assembly leaders`}
        >
          <strong>{count}</strong>

          <span>
            {count === 1
              ? "Assembly Leader"
              : "Assembly Leaders"}
          </span>
        </div>
      </div>
    </section>
  );
}
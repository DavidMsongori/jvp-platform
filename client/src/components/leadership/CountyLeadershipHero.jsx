import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Landmark,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";

import "./CountyLeadershipHero.css";

export default function CountyLeadershipHero({
  county = "County",
  cabinetCount = 0,
  assemblyCount = 0,
  totalCount = 0,
}) {
  return (
    <section
      className="county-leadership-hero"
      aria-labelledby="county-leadership-hero-title"
    >
      <div className="county-leadership-hero__overlay" />
      <div className="county-leadership-hero__gradient" />

      <div className="county-leadership-hero__container">
        <div className="county-leadership-hero__content">
          <Link
            to="/leadership"
            className="county-leadership-hero__back"
          >
            <ArrowLeft size={12} />
            Back to Leadership
          </Link>

          <span className="county-leadership-hero__eyebrow">
            <MapPin size={12} />
            JVP County Leadership
          </span>

          <h1
            id="county-leadership-hero-title"
            className="county-leadership-hero__title"
          >
            {county}
            <span>County Leadership</span>
          </h1>

          <p className="county-leadership-hero__description">
            Meet the leaders serving young people across{" "}
            {county}, from the County Cabinet to the
            County Youth Assembly.
          </p>

          <div className="county-leadership-hero__breadcrumb">
            <span>Leadership</span>
            <ChevronRight size={10} />
            <span>Counties</span>
            <ChevronRight size={10} />
            <span>{county}</span>
          </div>
        </div>

        <div className="county-leadership-hero__stats">
          <div className="county-leadership-hero__stat">
            <Building2 size={14} />
            <strong>{cabinetCount}</strong>
            <span>Cabinet</span>
          </div>

          <div className="county-leadership-hero__stat">
            <Landmark size={14} />
            <strong>{assemblyCount}</strong>
            <span>Assembly</span>
          </div>

          <div className="county-leadership-hero__stat">
            <MapPin size={14} />
            <strong>{totalCount}</strong>
            <span>Total Leaders</span>
          </div>
        </div>
      </div>
    </section>
  );
}
import {
  ArrowRight,
  Building2,
  Landmark,
  MapPin,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import CountyLeaderCard from "./CountyLeaderCard";

import "./CountyLeadershipSection.css";

const COUNTY_ORDER = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita Taveta",
];

const DEFAULT_PREVIEW_LIMIT = 2;

function getCountySlug(county) {
  return county
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function getPreviewLeaders(leaders = [], limit) {
  return [...leaders]
    .sort(
      (a, b) =>
        (a?.displayOrder || 0) -
        (b?.displayOrder || 0)
    )
    .slice(0, limit);
}

function LeaderPreview({
  leaders = [],
  limit,
}) {
  if (!leaders.length) {
    return (
      <div className="county-category__empty">
        <span>No leadership records available.</span>
      </div>
    );
  }

  const visibleLeaders =
    getPreviewLeaders(leaders, limit);

  return (
    <div className="county-category__content">
      <div className="county-category__grid">
        {visibleLeaders.map((leader, index) => (
          <CountyLeaderCard
            key={
              leader?._id ||
              leader?.id ||
              leader?.slug ||
              index
            }
            leader={leader}
          />
        ))}
      </div>

      {leaders.length > visibleLeaders.length && (
        <span className="county-category__more">
          Showing {visibleLeaders.length} of{" "}
          {leaders.length}
        </span>
      )}
    </div>
  );
}

export default function CountyLeadershipSection({
  counties = {},
  previewLimit = DEFAULT_PREVIEW_LIMIT,
}) {
  const orderedCounties = [
    ...COUNTY_ORDER.filter(
      (county) => counties[county]
    ),
    ...Object.keys(counties).filter(
      (county) => !COUNTY_ORDER.includes(county)
    ),
  ];

  if (!orderedCounties.length) {
    return null;
  }

  return (
    <section
      className="county-leadership"
      aria-labelledby="county-leadership-title"
    >
      <div className="county-leadership__container">
        <header className="county-leadership__header">
          <div className="county-leadership__heading">
            <span className="county-leadership__eyebrow">
              <MapPin size={12} />
              County Leadership
            </span>

            <h2
              id="county-leadership-title"
              className="county-leadership__title"
            >
              Leadership Across the Coast
            </h2>

            <div
              className="county-leadership__accent"
              aria-hidden="true"
            />

            <p className="county-leadership__description">
              JVP county structures bring leadership,
              representation and youth participation
              closer to communities across the six
              Coastal Counties.
            </p>
          </div>

          <div
            className="county-leadership__count"
            aria-label={`${orderedCounties.length} counties represented`}
          >
            <MapPin size={14} />

            <strong>
              {orderedCounties.length}
            </strong>

            <span>
              {orderedCounties.length === 1
                ? "County"
                : "Counties"}
            </span>
          </div>
        </header>

        <div className="county-leadership__teams">
          {orderedCounties.map((county) => {
            const data = counties[county] || {};

            const cabinet = data.cabinet || [];
            const assembly = data.assembly || [];

            const totalLeaders =
              cabinet.length + assembly.length;

            const countySlug =
              getCountySlug(county);

            const countyTitleId =
              `county-${countySlug}`;

            return (
              <article
                key={county}
                className="county-team"
                aria-labelledby={countyTitleId}
              >
                {/* County Header */}

                <header className="county-team__header">
                  <div className="county-team__identity">
                    <span className="county-team__icon">
                      <MapPin size={12} />
                    </span>

                    <div>
                      <h3
                        id={countyTitleId}
                        className="county-team__title"
                      >
                        {county}
                      </h3>

                      <span className="county-team__label">
                        County Leadership
                      </span>
                    </div>
                  </div>

                  <div
                    className="county-team__count"
                    aria-label={`${totalLeaders} county leaders`}
                  >
                    <Users size={12} />

                    <span>
                      {totalLeaders}
                    </span>

                    <small>
                      {totalLeaders === 1
                        ? "Leader"
                        : "Leaders"}
                    </small>
                  </div>
                </header>

                {/* County Cabinet */}

                <div className="county-category">
                  <div className="county-category__header">
                    <div className="county-category__title-wrap">
                      <span className="county-category__icon">
                        <Building2 size={12} />
                      </span>

                      <div>
                        <h4 className="county-category__title">
                          County Cabinet
                        </h4>

                        <span className="county-category__subtitle">
                          County Executive Leadership
                        </span>
                      </div>
                    </div>

                    <span className="county-category__count">
                      {cabinet.length}
                    </span>
                  </div>

                  <LeaderPreview
                    leaders={cabinet}
                    limit={previewLimit}
                  />
                </div>

                {/* County Youth Assembly */}

                <div className="county-category">
                  <div className="county-category__header">
                    <div className="county-category__title-wrap">
                      <span className="county-category__icon">
                        <Landmark size={12} />
                      </span>

                      <div>
                        <h4 className="county-category__title">
                          County Youth Assembly
                        </h4>

                        <span className="county-category__subtitle">
                          County Representative Leadership
                        </span>
                      </div>
                    </div>

                    <span className="county-category__count">
                      {assembly.length}
                    </span>
                  </div>

                  <LeaderPreview
                    leaders={assembly}
                    limit={previewLimit}
                  />
                </div>

                {/* View Full County */}

                <div className="county-team__action">
                  <Link
                    to={`/leadership/county/${countySlug}`}
                    className="county-team__view"
                  >
                    <span>
                      View Full {county} Leadership
                    </span>

                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
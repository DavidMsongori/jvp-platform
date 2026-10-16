
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  MapPin,
  Sprout,
  Users,
  UserRoundCheck,
  Waves,
} from "lucide-react";
import { Link } from "react-router-dom";

import api from "../../services/api";
import "./Impact.css";

/* ===========================================================
   HELPERS
=========================================================== */

const extractPrograms = (response) => {
  const candidates = [
    response?.data?.programs,
    response?.programs,
    response?.data?.items,
    response?.items,
    response?.data?.results,
    response?.results,
    response?.data?.data?.programs,
    response?.data?.data?.items,
    response?.data?.data,
    response?.data,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) return "—";

  return new Intl.NumberFormat("en-KE").format(number);
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getProgramId = (program = {}) =>
  program._id || program.id || program.slug;

const getProgramTitle = (program = {}) =>
  program.title || program.name || "JVP Programme";

const getProgramSummary = (program = {}) =>
  program.summary ||
  program.description ||
  program.impactSummary ||
  "A JVP initiative focused on empowering young people and strengthening coastal communities.";

const getProgramImage = (program = {}) => {
  const cover = program.coverImage;

  if (typeof cover === "string" && cover.trim()) {
    return cover;
  }

  if (cover && typeof cover === "object") {
    return (
      cover.secureUrl ||
      cover.secure_url ||
      cover.url ||
      cover.imageUrl ||
      ""
    );
  }

  return (
    program.coverImageUrl ||
    program.imageUrl ||
    program.image ||
    ""
  );
};

const getProgramCategory = (program = {}) =>
  program.category?.name ||
  program.category ||
  program.recordType ||
  "Youth Development";

const getProgramStatus = (program = {}) =>
  String(program.status || "ongoing").replace(/[_-]+/g, " ");

const getProgramUrl = (program = {}) => {
  if (program.slug) {
    return `/programs/${encodeURIComponent(program.slug)}`;
  }

  if (program._id || program.id) {
    return `/programs/${encodeURIComponent(program._id || program.id)}`;
  }

  return "/programs";
};

const getProgramDate = (program = {}) =>
  program.startDate || program.eventDate || program.date || null;

const getProgramLocation = (program = {}) =>
  typeof program.location === "string"
    ? program.location
    : program.location?.name ||
      program.location?.venue ||
      program.venue ||
      "";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PresidentialImpact() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchFeaturedPrograms = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/programs/featured");
        const results = extractPrograms(response.data);

        if (!cancelled) {
          setPrograms(results);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Programme information is temporarily unavailable."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedPrograms();

    return () => {
      cancelled = true;
    };
  }, []);

  const impactTotals = useMemo(() => {
    return programs.reduce(
      (totals, program) => ({
        attended:
          totals.attended +
          (Number(program.youthsAttended) || 0),
        benefited:
          totals.benefited +
          (Number(program.youthsBenefited) || 0),
      }),
      { attended: 0, benefited: 0 }
    );
  }, [programs]);

  const featuredPrograms = useMemo(
    () => programs.slice(0, 3),
    [programs]
  );

  return (
    <section
      className="presidential-impact"
      id="presidential-impact"
      aria-labelledby="presidential-impact-title"
    >
      <div className="presidential-impact__container">
        {/* Section heading */}
        <header className="presidential-impact__header">
          <div className="presidential-impact__heading">
            <span className="presidential-impact__eyebrow">
              <ChartNoAxesCombined size={16} aria-hidden="true" />
              From Priorities to Progress
            </span>

            <h2 id="presidential-impact-title">
              Initiatives and Impact
            </h2>

            <p>
              Discover programmes and activities advancing youth
              empowerment, livelihoods, education, environmental
              action and opportunity across Kenya's Coast region.
            </p>
          </div>

          <Link
            to="/programs"
            className="presidential-impact__all-link"
          >
            All programmes
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </header>

        {/* Impact summary */}
        <div className="presidential-impact__metrics">
          <article className="presidential-impact__metric">
            <span className="presidential-impact__metric-icon">
              <Sprout size={22} aria-hidden="true" />
            </span>

            <div>
              <span className="presidential-impact__metric-label">
                Featured programmes
              </span>
              <strong>
                {loading ? "…" : formatNumber(programs.length)}
              </strong>
              <p>Published programmes returned by JVP Connect</p>
            </div>
          </article>

          <article className="presidential-impact__metric">
            <span className="presidential-impact__metric-icon">
              <Users size={22} aria-hidden="true" />
            </span>

            <div>
              <span className="presidential-impact__metric-label">
                Youths attended
              </span>
              <strong>
                {loading ? "…" : formatNumber(impactTotals.attended)}
              </strong>
              <p>Reported attendance across these programmes</p>
            </div>
          </article>

          <article className="presidential-impact__metric">
            <span className="presidential-impact__metric-icon">
              <UserRoundCheck size={22} aria-hidden="true" />
            </span>

            <div>
              <span className="presidential-impact__metric-label">
                Youths benefited
              </span>
              <strong>
                {loading ? "…" : formatNumber(impactTotals.benefited)}
              </strong>
              <p>Reported beneficiaries across these programmes</p>
            </div>
          </article>
        </div>

        <div className="presidential-impact__section-intro">
          <div>
            <span className="presidential-impact__small-label">
              Making a difference
            </span>
            <h3>Featured programmes and activities</h3>
          </div>

          <p>
            Explore the work behind the priorities and the results
            reported by each initiative.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div
            className="presidential-impact__state"
            role="status"
            aria-live="polite"
          >
            <span className="presidential-impact__spinner" />
            <p>Loading featured programmes…</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div
            className="presidential-impact__state presidential-impact__state--error"
            role="status"
          >
            <p>{error}</p>
            <Link to="/programs" className="presidential-impact__text-link">
              Visit programmes <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && featuredPrograms.length === 0 && (
          <div className="presidential-impact__state">
            <span className="presidential-impact__empty-icon">
              <Waves size={26} aria-hidden="true" />
            </span>

            <h3>Our impact stories are on the way</h3>
            <p>
              Published featured programmes will appear here when
              they are available in JVP Connect.
            </p>
          </div>
        )}

        {/* Programme cards */}
        {!loading && !error && featuredPrograms.length > 0 && (
          <div className="presidential-impact__grid">
            {featuredPrograms.map((program) => {
              const image = getProgramImage(program);
              const date = getProgramDate(program);
              const location = getProgramLocation(program);
              const category = getProgramCategory(program);
              const status = getProgramStatus(program);
              const title = getProgramTitle(program);
              const summary = getProgramSummary(program);
              const url = getProgramUrl(program);

              return (
                <article
                  className="presidential-impact__card"
                  key={getProgramId(program)}
                >
                  <Link
                    to={url}
                    className="presidential-impact__image-link"
                    aria-label={`View ${title}`}
                  >
                    {image ? (
                      <img
                        className="presidential-impact__image"
                        src={image}
                        alt={title}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="presidential-impact__image-placeholder">
                        <Sprout size={34} aria-hidden="true" />
                        <span>JVP Connect</span>
                      </div>
                    )}

                    <span className="presidential-impact__category">
                      {category}
                    </span>
                  </Link>

                  <div className="presidential-impact__card-body">
                    <div className="presidential-impact__status-row">
                      <span
                        className={`presidential-impact__status presidential-impact__status--${status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        <Clock3 size={13} aria-hidden="true" />
                        {status}
                      </span>

                      {date && (
                        <span className="presidential-impact__date">
                          <CalendarDays size={14} aria-hidden="true" />
                          {formatDate(date)}
                        </span>
                      )}
                    </div>

                    <h3>
                      <Link to={url}>{title}</Link>
                    </h3>

                    <p className="presidential-impact__summary">
                      {summary}
                    </p>

                    {location && (
                      <div className="presidential-impact__location">
                        <MapPin size={15} aria-hidden="true" />
                        <span>{location}</span>
                      </div>
                    )}

                    <div className="presidential-impact__results">
                      <div>
                        <span>Youths attended</span>
                        <strong>
                          {formatNumber(program.youthsAttended)}
                        </strong>
                      </div>

                      <div>
                        <span>Youths benefited</span>
                        <strong>
                          {formatNumber(program.youthsBenefited)}
                        </strong>
                      </div>
                    </div>

                    {program.impactSummary && (
                      <div className="presidential-impact__impact-note">
                        <span>Reported impact</span>
                        <p>{program.impactSummary}</p>
                      </div>
                    )}

                    <Link
                      to={url}
                      className="presidential-impact__card-link"
                    >
                      Explore initiative
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Closing banner */}
        <div className="presidential-impact__closing">
          <div className="presidential-impact__closing-icon">
            <ChartNoAxesCombined size={25} aria-hidden="true" />
          </div>

          <div className="presidential-impact__closing-copy">
            <h3>Impact that can be seen and measured</h3>
            <p>
              JVP Connect brings programme information and reported
              outcomes together to support transparency, learning
              and better planning for young people.
            </p>
          </div>

          <Link
            to="/programs"
            className="presidential-impact__closing-link"
          >
            Discover our work
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

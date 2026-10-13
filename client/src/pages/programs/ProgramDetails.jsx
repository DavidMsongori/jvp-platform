
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Target,
  Handshake,
  CheckCircle2,
  LoaderCircle,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import {
  getProgramBySlug,
  getPublicProgramActivities,
} from "../../services/program.service";

import "./ProgramDetails.css";

/* ===========================================================
   HELPERS
=========================================================== */

const getRecord = (response) =>
  response?.data?.program ||
  response?.data?.data ||
  response?.program ||
  response?.data ||
  response;

const getImageUrl = (program) => {
  const cover = program?.coverImage;
  const image = program?.image;

  const candidates = [
    typeof cover === "string" ? cover : "",
    cover?.url,
    cover?.secure_url,
    cover?.secureUrl,
    cover?.path,
    cover?.src,
    cover?.imageUrl,
    typeof image === "string" ? image : "",
    image?.url,
    image?.secure_url,
    image?.path,
    image?.src,
    program?.coverImageUrl,
    program?.imageUrl,
  ];

  return (
    candidates.find(
      (value) =>
        typeof value === "string" &&
        value.trim().length > 0
    ) || ""
  );
};

const getList = (response) => {
  const record = getRecord(response);

  if (Array.isArray(record)) return record;
  if (Array.isArray(record?.activities)) return record.activities;
  if (Array.isArray(record?.programs)) return record.programs;
  if (Array.isArray(record?.results)) return record.results;

  return [];
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-KE");

const formatLabel = (value) => {
  if (!value) return "";

  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "We could not load this programme. Please try again.";

/* ===========================================================
   COMPONENT
=========================================================== */

const ProgramDetails = () => {
  const { slug } = useParams();

  const [program, setProgram] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProgram = async () => {
      setLoading(true);
      setError("");
      setProgram(null);
      setActivities([]);
      setImageFailed(false);

      try {
        const response = await getProgramBySlug(slug);
        const record = getRecord(response);

        if (
          !record ||
          typeof record !== "object" ||
          Array.isArray(record) ||
          !record._id
        ) {
          throw new Error(
            "This programme could not be found or is not publicly available."
          );
        }

        if (!active) return;

        setProgram(record);

        // Child activities are optional. Their failure should not
        // prevent the main programme details from displaying.
        const isParentProgramme =
          record.recordType === "programme" ||
          record.recordType === "program";

        if (isParentProgramme && record._id) {
          try {
            const activityResponse =
              await getPublicProgramActivities(record._id);

            if (active) {
              setActivities(getList(activityResponse));
            }
          } catch (activityError) {
            console.warn(
              "Unable to load related activities:",
              activityError
            );
          }
        }
      } catch (loadError) {
        if (active) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (slug) {
      loadProgram();
    } else {
      setError("A programme slug is required.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [slug]);

  const image = getImageUrl(program);

  const objectives = Array.isArray(program?.objectives)
    ? program.objectives
    : [];

  const achievements = Array.isArray(program?.achievements)
    ? program.achievements
    : [];

  const partners = Array.isArray(program?.partners)
    ? program.partners
    : [];

  const location = [
    program?.ward,
    program?.subCounty,
    program?.county,
  ]
    .filter(Boolean)
    .join(", ");

  const startDate = formatDate(program?.startDate);
  const endDate = formatDate(program?.endDate);

  const dateLabel =
    startDate && endDate
      ? `${startDate} – ${endDate}`
      : startDate || endDate || "Date to be announced";

  /* ===========================================================
     LOADING STATE
  =========================================================== */

  if (loading) {
    return (
      <div className="program-details-page">
        <Navbar />

        <main className="program-details-state">
          <LoaderCircle className="program-details-spinner" size={42} />

          <h1>Loading programme</h1>
          <p>Please wait while we retrieve the details.</p>
        </main>

        <Footer />
      </div>
    );
  }

  /* ===========================================================
     ERROR STATE
  =========================================================== */

  if (error || !program) {
    return (
      <div className="program-details-page">
        <Navbar />

        <main className="program-details-state">
          <AlertCircle size={44} />

          <h1>Programme unavailable</h1>
          <p>{error || "This programme could not be found."}</p>

          <Link
            to="/programs"
            className="program-details-button"
          >
            <ArrowLeft size={17} />
            Back to programmes
          </Link>
        </main>

        <Footer />
      </div>
    );
  }

  /* ===========================================================
     PAGE
  =========================================================== */

  return (
    <div className="program-details-page">
      <Navbar />

      <main>
        <div className="program-details-container">
          <Link to="/programs" className="program-details-back">
            <ArrowLeft size={17} />
            All programmes and activities
          </Link>

          {/* HERO */}
          <section className="program-details-hero">
            <div className="program-details-hero-copy">
              <div className="program-details-labels">
                <span className="program-details-type">
                  {formatLabel(
                    program.recordType || "programme"
                  )}
                </span>

                {program.category && (
                  <span className="program-details-category">
                    {formatLabel(program.category)}
                  </span>
                )}

                {program.isFeatured && (
                  <span className="program-details-featured">
                    Featured
                  </span>
                )}
              </div>

              <h1>{program.title}</h1>

              {program.summary && (
                <p className="program-details-summary">
                  {program.summary}
                </p>
              )}

              <div className="program-details-meta">
                <div>
                  <CalendarDays size={18} />
                  <span>{dateLabel}</span>
                </div>

                {location && (
                  <div>
                    <MapPin size={18} />
                    <span>{location}</span>
                  </div>
                )}
              </div>

              <a
                href="#program-description"
                className="program-details-button"
              >
                Explore programme
                <ArrowUpRight size={17} />
              </a>
            </div>

            <div className="program-details-hero-image">
              {image && !imageFailed ? (
                <img
                  src={image}
                  alt={
                    typeof program.coverImage === "object"
                      ? program.coverImage?.alt || program.title
                      : program.title
                  }
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="program-details-image-placeholder">
                  <Target size={54} />
                  <span>JVP Programmes & Impact</span>
                </div>
              )}

              {program.coverImage?.caption && (
                <p className="program-details-image-caption">
                  {program.coverImage.caption}
                </p>
              )}
            </div>
          </section>

          {/* IMPACT */}
          <section className="program-details-impact">
            <div className="program-details-impact-heading">
              <span>Our impact</span>
              <h2>People reached and supported</h2>
            </div>

            <div className="program-details-impact-grid">
              <article className="program-details-impact-card">
                <Users size={23} />
                <strong>
                  {formatNumber(program.youthsAttended)}
                </strong>
                <span>Youths attended</span>
              </article>

              <article className="program-details-impact-card">
                <Target size={23} />
                <strong>
                  {formatNumber(program.youthsBenefited)}
                </strong>
                <span>Youths benefited</span>
              </article>
            </div>

            {program.impactSummary && (
              <p className="program-details-impact-summary">
                {program.impactSummary}
              </p>
            )}
          </section>

          {/* DESCRIPTION */}
          <section
            id="program-description"
            className="program-details-content-grid"
          >
            <div className="program-details-main-content">
              <section className="program-details-section">
                <span className="program-details-eyebrow">
                  About this initiative
                </span>

                <h2>Programme overview</h2>

                {program.description ? (
                  <div className="program-details-description">
                    {program.description
                      .split(/\n{2,}/)
                      .map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                  </div>
                ) : (
                  <p className="program-details-muted">
                    More information about this initiative will
                    be added soon.
                  </p>
                )}
              </section>

              {objectives.length > 0 && (
                <section className="program-details-section">
                  <span className="program-details-eyebrow">
                    Our priorities
                  </span>

                  <h2>Objectives</h2>

                  <ul className="program-details-list">
                    {objectives.map((objective, index) => (
                      <li key={index}>
                        <CheckCircle2 size={19} />
                        <span>
                          {typeof objective === "string"
                            ? objective
                            : objective?.title ||
                              objective?.description ||
                              ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {achievements.length > 0 && (
                <section className="program-details-section">
                  <span className="program-details-eyebrow">
                    Progress and outcomes
                  </span>

                  <h2>Achievements</h2>

                  <ul className="program-details-list">
                    {achievements.map((achievement, index) => (
                      <li key={index}>
                        <CheckCircle2 size={19} />
                        <span>
                          {typeof achievement === "string"
                            ? achievement
                            : achievement?.title ||
                              achievement?.description ||
                              ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="program-details-sidebar">
              <div className="program-details-info-card">
                <h3>Programme information</h3>

                <div className="program-details-info-row">
                  <CalendarDays size={18} />
                  <div>
                    <span>Schedule</span>
                    <strong>{dateLabel}</strong>
                  </div>
                </div>

                <div className="program-details-info-row">
                  <MapPin size={18} />
                  <div>
                    <span>Location</span>
                    <strong>{location || program.location || "To be announced"}</strong>
                  </div>
                </div>

                <div className="program-details-info-row">
                  <Target size={18} />
                  <div>
                    <span>Category</span>
                    <strong>
                      {formatLabel(program.category) || "General"}
                    </strong>
                  </div>
                </div>

                <div className="program-details-info-row">
                  <Users size={18} />
                  <div>
                    <span>Record type</span>
                    <strong>
                      {formatLabel(program.recordType || "programme")}
                    </strong>
                  </div>
                </div>
              </div>

              {partners.length > 0 && (
                <div className="program-details-info-card">
                  <div className="program-details-partner-heading">
                    <Handshake size={21} />
                    <h3>Partners</h3>
                  </div>

                  <ul className="program-details-partners">
                    {partners.map((partner, index) => (
                      <li key={index}>
                        {typeof partner === "string"
                          ? partner
                          : partner?.name ||
                            partner?.title ||
                            ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="program-details-cta">
                <span>Be part of the change</span>
                <h3>Help build opportunities for coastal youth.</h3>

                <Link to="/contact">
                  Connect with JVP
                  <ArrowUpRight size={17} />
                </Link>
              </div>
            </aside>
          </section>

          {/* RELATED ACTIVITIES */}
          {activities.length > 0 && (
            <section className="program-details-related">
              <div className="program-details-related-heading">
                <div>
                  <span className="program-details-eyebrow">
                    From this programme
                  </span>
                  <h2>Related activities</h2>
                </div>

                <span className="program-details-activity-count">
                  {activities.length}{" "}
                  {activities.length === 1 ? "activity" : "activities"}
                </span>
              </div>

              <div className="program-details-activities-grid">
                {activities.map((activity) => {
                  const activitySlug = activity.slug;
                  const activityImage = getImageUrl(activity);

                  return (
                    <article
                      className="program-details-activity-card"
                      key={activity._id || activity.slug}
                    >
                      {activityImage && (
                        <img
                          src={activityImage}
                          alt={activity.title || "JVP activity"}
                          loading="lazy"
                        />
                      )}

                      <div>
                        <span>
                          {formatLabel(
                            activity.category || "Activity"
                          )}
                        </span>

                        <h3>{activity.title}</h3>

                        {activity.summary && (
                          <p>{activity.summary}</p>
                        )}

                        {activitySlug && (
                          <Link to={`/program/${activitySlug}`}>
                            View activity
                            <ArrowUpRight size={16} />
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <div className="program-details-bottom-link">
            <Link to="/programs">
              <ArrowLeft size={17} />
              Explore more JVP programmes
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProgramDetails;
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";

import leaderService from "../../services/leader.service";

import "./LeadershipStructure.css";

const FALLBACK_IMAGE = "/images/branding/jvp-logo.png";

/* ==========================================================
   HELPERS
========================================================== */

function extractLeaders(response) {
  const candidates = [
    response?.data,
    response?.data?.data,
    response?.data?.leaders,
    response?.data?.data?.leaders,
    response?.leaders,
  ];

  return candidates.find(Array.isArray) || [];
}

function getText(...values) {
  return (
    values.find(
      (value) =>
        typeof value === "string" &&
        value.trim()
    )?.trim() || ""
  );
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function isPresident(leader) {
  const presidentialTitles = [
    normalize(leader.office),
    normalize(leader.title),
    normalize(leader.position),
    normalize(leader.designation),
    normalize(leader.role),
  ];

  return presidentialTitles.some(
    (value) =>
      value === "president" ||
      value === "regional president" ||
      value === "jvp president"
  );
}

function getLeaderName(leader) {
  if (!leader) {
    return "JVP President";
  }

  const directName = getText(
    leader.name,
    leader.fullName,
    leader.full_name
  );

  if (directName) {
    return directName;
  }

  return (
    [
      getText(leader.firstName, leader.first_name),
      getText(leader.middleName, leader.middle_name),
      getText(leader.lastName, leader.last_name),
    ]
      .filter(Boolean)
      .join(" ") || "JVP President"
  );
}

function getLeaderImage(leader) {
  if (!leader) {
    return FALLBACK_IMAGE;
  }

  const possibleImages = [
    /* Direct leadership fields */
    leader.image,
    leader.imageUrl,
    leader.imageURL,
    leader.profileImage,
    leader.profileImageUrl,
    leader.profilePhoto,
    leader.photo,
    leader.photoUrl,
    leader.avatar,
    leader.avatarUrl,
    leader.picture,

    /* Member/profile fields */
    leader.member?.image,
    leader.member?.imageUrl,
    leader.member?.profileImage,
    leader.member?.profileImageUrl,
    leader.member?.profilePhoto,
    leader.member?.photo,
    leader.member?.photoUrl,
    leader.member?.avatar,
    leader.member?.avatarUrl,

    /* User fields */
    leader.user?.image,
    leader.user?.imageUrl,
    leader.user?.profileImage,
    leader.user?.profileImageUrl,
    leader.user?.profilePhoto,
    leader.user?.photo,
    leader.user?.photoUrl,
    leader.user?.avatar,
    leader.user?.avatarUrl,

    /* Cloudinary fields */
    leader.cloudinaryUrl,
    leader.cloudinaryImage,
    leader.cloudinaryImageUrl,
    leader.member?.cloudinaryUrl,
    leader.user?.cloudinaryUrl,

    /* Nested image objects */
    leader.image?.url,
    leader.image?.secure_url,
    leader.profileImage?.url,
    leader.profileImage?.secure_url,
    leader.photo?.url,
    leader.photo?.secure_url,
  ];

  const image = possibleImages.find(
    (value) =>
      typeof value === "string" &&
      value.trim().length > 0
  );

  return image?.trim() || FALLBACK_IMAGE;
}

/* ==========================================================
   COMPONENT
========================================================== */

function LeadershipStructure() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  /* ========================================================
     LOAD PUBLIC LEADERSHIP
  ======================================================== */

  useEffect(() => {
    let isMounted = true;

    async function loadPublicLeadership() {
      try {
        setLoading(true);
        setLoadError(false);

        const response =
          await leaderService.getPublicLeaders();

        const publicLeaders =
          extractLeaders(response);

        if (isMounted) {
          setLeaders(publicLeaders);
        }
      } catch (error) {
        console.error(
          "Failed to load About page leadership:",
          error
        );

        if (isMounted) {
          setLeaders([]);
          setLoadError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPublicLeadership();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ========================================================
     FIND PRESIDENT
  ======================================================== */

  const president = useMemo(() => {
    const regionalExecutives = leaders.filter(
      (leader) =>
        normalize(leader.level) ===
          "regional cabinet" &&
        normalize(leader.category) ===
          "executive"
    );

    const matchedPresident =
      regionalExecutives.find(isPresident);

    if (matchedPresident) {
      return matchedPresident;
    }

    const anyPresident =
      leaders.find(isPresident);

    if (anyPresident) {
      return anyPresident;
    }

    return regionalExecutives[0] || null;
  }, [leaders]);

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <section className="leadership">
      <div className="leadership-container">

        {/* Section heading */}

        <div className="leadership-header">
          <div>
            <span className="leadership-eyebrow">
              OUR LEADERSHIP
            </span>

            <h2>
              Leadership built around
              <span> service.</span>
            </h2>
          </div>

          <p>
            JVP is guided by a youth-led leadership
            structure designed to promote accountability,
            participation and impact across the Coast Region.
          </p>
        </div>

        {/* Main leadership feature */}

        <div className="leadership-feature">

          {/* President */}

          <article className="leadership-president">

            <div className="leadership-president__image">
              {loading ? (
                <div className="leadership-image-skeleton" />
              ) : (
                <img
                  src={getLeaderImage(president)}
                  alt={getLeaderName(president)}
                  onError={(event) => {
                    if (
                      event.currentTarget.dataset
                        .fallbackApplied === "true"
                    ) {
                      return;
                    }

                    event.currentTarget.dataset
                      .fallbackApplied = "true";

                    event.currentTarget.src =
                      FALLBACK_IMAGE;
                  }}
                />
              )}
            </div>

            <div className="leadership-president__content">

              <span className="leadership-president__label">
                PRESIDENT
              </span>

              <h3>
                {loading
                  ? "Loading leadership..."
                  : president
                    ? getLeaderName(president)
                    : loadError
                      ? "Leadership unavailable"
                      : "President's profile pending"}
              </h3>

              <p>
                Provides strategic leadership and represents
                Jumuiya ya Vijana wa Pwani across the Coast
                Region and beyond.
              </p>

              <Link
                to="/leadership"
                className="leadership-president__link"
              >
                View full profile
                <ArrowRight size={15} />
              </Link>

            </div>
          </article>

          {/* Leadership structure */}

          <article className="leadership-overview">

            <div className="leadership-overview__icon">
              <Users size={20} />
            </div>

            <div className="leadership-overview__content">

              <span className="leadership-overview__label">
                LEADERSHIP STRUCTURE
              </span>

              <h3>
                Explore our leadership
                structures and teams.
              </h3>

              <p>
                Discover the Regional Executive, Youth
                Assembly, Council of Governors and County
                Leadership teams.
              </p>

              <Link
                to="/leadership"
                className="leadership-overview__link"
              >
                Explore Leadership
                <ArrowRight size={15} />
              </Link>

            </div>

          </article>

        </div>
      </div>
    </section>
  );
}

export default LeadershipStructure;

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useLeaders } from "../../context/LeaderContext";
import {
  getPublicOfficeTeam,
} from "../../services/officeAssignment.service";

import "./Team.css";

/* ===========================================================
   HELPERS
=========================================================== */

const normalizeOffice = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getLeaderPosition = (leader = {}) =>
  leader.position ||
  leader.office ||
  leader.profile?.position ||
  leader.profile?.office ||
  "";

const isPresident = (leader = {}) => {
  const position = normalizeOffice(getLeaderPosition(leader));

  return (
    /\bpresident\b/.test(position) &&
    !/\b(deputy|vice|assistant)\b/.test(position)
  );
};

const getId = (item = {}) =>
  item._id ||
  item.id ||
  item.userId ||
  item.memberId ||
  item.profile?._id ||
  item.profile?.id ||
  "";

const getName = (person = {}) =>
  person.fullName ||
  person.name ||
  person.displayName ||
  person.profile?.fullName ||
  person.profile?.name ||
  person.member?.fullName ||
  person.member?.name ||
  person.user?.fullName ||
  person.user?.name ||
  "JVP Team Member";

const getPosition = (assignment = {}) =>
  assignment.assignedPosition ||
  assignment.assignmentTitle ||
  assignment.title ||
  assignment.positionTitle ||
  assignment.roleTitle ||
  assignment.role ||
  assignment.position ||
  assignment.office ||
  assignment.designation ||
  assignment.docket ||
  "Office Support";

const getPhoto = (person = {}) => {
  const profile = person.profile || {};
  const member = person.member || {};
  const user = person.user || {};

  const candidates = [
    person.profilePhoto,
    person.profilePhotoUrl,
    person.photo,
    person.image,
    person.avatar,
    person.profileImage,
    person.photoUrl,
    person.imageUrl,
    profile.profilePhoto,
    profile.profilePhotoUrl,
    profile.photo,
    profile.image,
    profile.avatar,
    profile.profileImage,
    profile.photoUrl,
    profile.imageUrl,
    member.profilePhoto,
    member.photo,
    member.avatar,
    member.profileImage,
    user.profilePhoto,
    user.photo,
    user.avatar,
  ];

  const photo = candidates.find((value) => {
    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return (
      value &&
      typeof value === "object" &&
      (
        value.secureUrl ||
        value.secure_url ||
        value.url ||
        value.imageUrl
      )
    );
  });

  if (typeof photo === "string") {
    return photo;
  }

  if (photo && typeof photo === "object") {
    return (
      photo.secureUrl ||
      photo.secure_url ||
      photo.url ||
      photo.imageUrl ||
      "/avatar.png"
    );
  }

  return "/avatar.png";
};

/**
 * Supports common response shapes without assuming
 * one exact backend response wrapper.
 */
const extractAssignments = (response) => {
  const candidates = [
    response?.data?.assignments,
    response?.data?.team,
    response?.data?.officeTeam,
    response?.data?.members,
    response?.assignments,
    response?.team,
    response?.officeTeam,
    response?.members,
    response?.data?.data?.assignments,
    response?.data?.data?.team,
    response?.data?.data,
    response?.data,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const getAssignmentPerson = (assignment = {}) =>
  assignment.member ||
  assignment.assignedMember ||
  assignment.user ||
  assignment.person ||
  assignment.leader ||
  assignment.profile ||
  assignment;

const getAssignmentId = (assignment = {}) =>
  assignment._id ||
  assignment.id ||
  assignment.assignmentId ||
  getId(getAssignmentPerson(assignment));

const handleImageError = (event) => {
  if (event.currentTarget.dataset.fallbackApplied === "true") {
    return;
  }

  event.currentTarget.dataset.fallbackApplied = "true";
  event.currentTarget.src = "/avatar.png";
};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PresidencyTeam() {
  const { leaders = [], executive = [] } = useLeaders();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const president = useMemo(
    () =>
      executive.find(isPresident) ||
      leaders.find(isPresident) ||
      null,
    [executive, leaders]
  );

  const presidentId = getId(president || {});

  useEffect(() => {
    let cancelled = false;

    const fetchPresidencyTeam = async () => {
      if (!presidentId) {
        setAssignments([]);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await getPublicOfficeTeam(presidentId);
        const team = extractAssignments(response);

        if (!cancelled) {
          setAssignments(team);
        }
      } catch (err) {
        if (!cancelled) {
          setAssignments([]);
          setError(
            err?.response?.data?.message ||
            err?.message ||
            "We could not load the Presidency team at this time."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPresidencyTeam();

    return () => {
      cancelled = true;
    };
  }, [presidentId]);

  const activeAssignments = useMemo(
    () =>
      assignments.filter((assignment) => {
        const status = normalizeOffice(
          assignment.status || assignment.assignmentStatus || ""
        );

        // Public API should already filter the team.
        // These checks provide an additional display safeguard.
        if (
          ["inactive", "deactivated", "completed", "cancelled", "deleted"]
            .includes(status)
        ) {
          return false;
        }

        if (
          assignment.isActive === false ||
          assignment.active === false
        ) {
          return false;
        }

        return true;
      }),
    [assignments]
  );

  return (
    <section
      className="presidency-team"
      id="presidency-team"
      aria-labelledby="presidency-team-title"
    >
      <div className="presidency-team__container">
        <header className="presidency-team__header">
          <div className="presidency-team__heading">
            <span className="presidency-team__eyebrow">
              <Users size={15} aria-hidden="true" />
              The Office of the President
            </span>

            <h2 id="presidency-team-title">
              The Team Behind the Presidency
            </h2>

            <p>
              Meet the assigned personnel supporting the Presidency
              in coordination, administration, communication and
              the delivery of JVP's regional mandate.
            </p>
          </div>

          <div className="presidency-team__header-icon" aria-hidden="true">
            <BriefcaseBusiness size={27} />
          </div>
        </header>

        <div className="presidency-team__intro">
          <div className="presidency-team__intro-icon">
            <ShieldCheck size={21} aria-hidden="true" />
          </div>

          <div>
            <h3>Supporting effective regional leadership</h3>
            <p>
              This directory is populated from the official office
              assignments recorded in JVP Connect.
            </p>
          </div>
        </div>

        {loading && (
          <div
            className="presidency-team__state"
            role="status"
            aria-live="polite"
          >
            <span className="presidency-team__spinner" />
            <p>Loading the assigned Presidency team…</p>
          </div>
        )}

        {!loading && error && (
          <div className="presidency-team__state presidency-team__state--error">
            <p>{error}</p>

            <button
              type="button"
              className="presidency-team__retry"
              onClick={() => {
                // Changing the state is unnecessary; refresh the
                // current component by calling the request again.
                if (!presidentId) return;

                setLoading(true);
                setError("");

                getPublicOfficeTeam(presidentId)
                  .then((response) => {
                    setAssignments(extractAssignments(response));
                  })
                  .catch((err) => {
                    setError(
                      err?.response?.data?.message ||
                      err?.message ||
                      "Unable to load the team. Please try again."
                    );
                  })
                  .finally(() => setLoading(false));
              }}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {!loading && !error && !presidentId && (
          <div className="presidency-team__state">
            <p>
              The Presidency profile could not be identified from the
              current leadership records.
            </p>
            <Link to="/leadership" className="presidency-team__text-link">
              View JVP leadership <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {!loading &&
          !error &&
          presidentId &&
          activeAssignments.length === 0 && (
            <div className="presidency-team__state">
              <div className="presidency-team__empty-icon">
                <Users size={25} aria-hidden="true" />
              </div>

              <h3>Team assignments will appear here</h3>
              <p>
                There are no public active assignments available for
                the Office of the President at the moment.
              </p>
            </div>
          )}

        {!loading && !error && activeAssignments.length > 0 && (
          <>
            <div className="presidency-team__summary">
              <span>
                <Users size={16} aria-hidden="true" />
                Assigned team
              </span>

              <strong>
                {activeAssignments.length}{" "}
                {activeAssignments.length === 1 ? "member" : "members"}
              </strong>
            </div>

            <div className="presidency-team__grid">
              {activeAssignments.map((assignment, index) => {
                const person = getAssignmentPerson(assignment);
                const personId = getId(person);
                const name = getName(person);
                const position = getPosition(assignment);
                const photo = getPhoto(person);

                return (
                  <article
                    className="presidency-team__card"
                    key={
                      getAssignmentId(assignment) ||
                      personId ||
                      `${position}-${index}`
                    }
                  >
                    <div className="presidency-team__card-top">
                      <div className="presidency-team__avatar-wrap">
                        <img
                          className="presidency-team__avatar"
                          src={photo}
                          alt={`${name}'s profile`}
                          loading="lazy"
                          onError={handleImageError}
                        />
                      </div>

                      <span className="presidency-team__member-mark">
                        <ShieldCheck size={15} aria-hidden="true" />
                      </span>
                    </div>

                    <div className="presidency-team__card-content">
                      <span className="presidency-team__position">
                        {position}
                      </span>

                      <h3>{name}</h3>

                      {(
                        assignment.department ||
                        assignment.ministry ||
                        assignment.docket
                      ) && (
                        <p className="presidency-team__department">
                          {assignment.department ||
                            assignment.ministry ||
                            assignment.docket}
                        </p>
                      )}
                    </div>

                    <div className="presidency-team__card-footer">
                      <span>Office of the President</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        <footer className="presidency-team__footer">
          <p>
            Public team information reflects the assignments made
            available through JVP Connect.
          </p>

          <Link
            to="/leadership"
            className="presidency-team__view-link"
          >
            Explore JVP leadership
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </section>
  );
}


import {
  BriefcaseBusiness,
  MapPin,
  ArrowUpRight,
  Layers3,
} from "lucide-react";
import { Link } from "react-router-dom";

import "./LeaderCard.css";

const DEFAULT_AVATAR = "/avatar.png";

const FALLBACK_AVATAR =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23eef3f0'/%3E%3Ccircle cx='200' cy='150' r='72' fill='%2394a89f'/%3E%3Cpath d='M88 350c10-72 54-110 112-110s102 38 112 110' fill='%2394a89f'/%3E%3C/svg%3E";

/* ==========================================================
   PORTFOLIO CONFIGURATION
========================================================== */

const CABINET_PORTFOLIOS = {
  finance_planning:
    "Finance, Planning & Economic Affairs",

  youth_employment:
    "Youth Employment, Entrepreneurship, Labour, Education, Skills & Human Capital",

  agriculture_food_security:
    "Agriculture, Agribusiness & Food Security",

  blue_economy:
    "Blue Economy, Fisheries & Maritime Affairs",

  tourism_culture:
    "Tourism, Culture, Arts & Creative Economy",

  trade:
    "Trade, Investment & Cooperatives",

  ict_digital:
    "ICT, Digital Economy & Communication",

  environment:
    "Environment, Climate Change & Natural Resources",

  health_sports:
    "Health, Sports & Youth Wellness",

  gender_social:
    "Gender, Social Protection & Community Development",

  infrastructure:
    "Infrastructure, Housing & Urban Development",
};

/* ==========================================================
   GENERAL HELPERS
========================================================== */

function firstText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function formatCategory(category) {
  if (!category) return "JVP Leadership";

  return String(category)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/* ==========================================================
   PROFILE NAME
========================================================== */

function getFullName(leader) {
  const member =
    leader?.member &&
    typeof leader.member === "object"
      ? leader.member
      : {};

  const user =
    leader?.user &&
    typeof leader.user === "object"
      ? leader.user
      : {};

  const profile =
    leader?.profile &&
    typeof leader.profile === "object"
      ? leader.profile
      : {};

  const directName = firstText(
    profile.fullName,
    profile.name,
    leader?.name,
    leader?.displayName,
    leader?.fullName,
    leader?.memberName,
    leader?.leaderName,
    member.fullName,
    member.name,
    user.fullName,
    user.name,
    user.displayName
  );

  if (directName) return directName;

  const person = Object.keys(member).length
    ? member
    : user;

  const firstName = firstText(
    person.firstName,
    person.first_name,
    person.givenName
  );

  const middleName = firstText(
    person.middleName,
    person.middle_name
  );

  const lastName = firstText(
    person.lastName,
    person.last_name,
    person.surname,
    person.familyName
  );

  const combinedName = [
    firstName,
    middleName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return combinedName || "JVP Leader";
}

/* ==========================================================
   PROFILE PHOTO
========================================================== */

function resolveImage(value) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === "object") {
    return firstText(
      value.secureUrl,
      value.secure_url,
      value.url,
      value.src,
      value.path
    );
  }

  return "";
}

function getPhoto(leader) {
  const member =
    leader?.member &&
    typeof leader.member === "object"
      ? leader.member
      : {};

  const user =
    leader?.user &&
    typeof leader.user === "object"
      ? leader.user
      : {};

  const profile =
    leader?.profile &&
    typeof leader.profile === "object"
      ? leader.profile
      : {};

  const candidates = [
    leader?.profilePicture,
    leader?.profileImage,
    leader?.avatar,
    leader?.profilePhoto,
    leader?.photo,
    leader?.image,
    leader?.picture,

    member.profilePhoto,
    member.profilePicture,
    member.profileImage,
    member.avatar,
    member.photo,
    member.image,

    user.profilePhoto,
    user.profilePicture,
    user.profileImage,
    user.avatar,
    user.photo,
    user.image,

    profile.profilePhoto,
    profile.profilePicture,
    profile.profileImage,
    profile.avatar,
    profile.photo,
    profile.image,
  ];

  for (const candidate of candidates) {
    const imageUrl = resolveImage(candidate);

    if (imageUrl) return imageUrl;
  }

  return DEFAULT_AVATAR;
}

/* ==========================================================
   CABINET SECRETARY PORTFOLIO
========================================================== */

function isCabinetSecretary(leader) {
  const position = normalizeKey(
    leader?.position || leader?.office || ""
  );

  return [
    "cabinet secretary",
    "regional cabinet secretary",
  ].includes(position);
}

function resolvePortfolioTitle(value) {
  if (!value) return "";

  // A portfolio may already be populated as an object.
  if (typeof value === "object") {
    const directTitle = firstText(
      value.title,
      value.name,
      value.label,
      value.shortTitle
    );

    if (directTitle) return directTitle;

    return resolvePortfolioTitle(
      value.key || value.slug
    );
  }

  const identifier = normalizeKey(value);

  // Resolve stable portfolio keys and slugs.
  for (const [key, title] of Object.entries(
    CABINET_PORTFOLIOS
  )) {
    const normalizedKey = normalizeKey(key);
    const normalizedSlug = normalizedKey.replace(/\s+/g, "-");
    const normalizedTitle = normalizeKey(title);

    if (
      identifier === normalizedKey ||
      identifier === normalizedSlug ||
      identifier === normalizedTitle
    ) {
      return title;
    }
  }

  // Preserve a meaningful custom portfolio value from the API.
  return typeof value === "string" ? value.trim() : "";
}

function getPortfolioTitle(leader) {
  const portfolio = leader?.portfolio;

  const candidates = [
    leader?.portfolioTitle,
    leader?.portfolioName,
    leader?.portfolioKey,
    leader?.docketTitle,
    leader?.docketKey,
    leader?.docket,
    leader?.ministry,
    portfolio?.title,
    portfolio?.name,
    portfolio?.key,
    portfolio?.slug,
    portfolio,
  ];

  for (const candidate of candidates) {
    const title = resolvePortfolioTitle(candidate);

    if (title) return title;
  }

  return "";
}

/* ==========================================================
   MINISTRY ROUTES
========================================================== */

function getMinistryRoute(leader) {
  const office = String(
    leader?.position || leader?.office || ""
  )
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    /\bsecretary to (the )?cabinet\b/.test(office)
  ) {
    return "/leadership/secretary-to-cabinet";
  }

  if (/\bdeputy president\b/.test(office)) {
    return "/leadership/deputy-president";
  }

  if (
    /\bprime cabinet secretary\b/.test(office) ||
    /\bprime cs\b/.test(office)
  ) {
    return "/leadership/prime-cabinet-secretary";
  }

  if (/\battorney general\b/.test(office)) {
    return "/leadership/attorney-general";
  }

  if (
    /\bpresident\b/.test(office) &&
    !/\bdeputy\b/.test(office)
  ) {
    return "/leadership/president";
  }

  return null;
}

/* ==========================================================
   IMAGE ERROR HANDLING
========================================================== */

function handleImageError(event) {
  const image = event.currentTarget;

  if (image.dataset.fallbackApplied === "true") {
    return;
  }

  image.dataset.fallbackApplied = "true";
  image.src = FALLBACK_AVATAR;
}

/* ==========================================================
   LEADER CARD
========================================================== */

export default function LeaderCard({ leader }) {
  if (!leader) return null;

  const fullName = getFullName(leader);

  const position = firstText(
    leader.position,
    leader.office
  ) || "JVP Leader";

  const county = firstText(
    leader.member?.county,
    leader.profile?.county,
    leader.county,
    leader.countyName
  );

  const category = formatCategory(leader.category);
  const photo = getPhoto(leader);
  const ministryRoute = getMinistryRoute(leader);

  const cabinetSecretary = isCabinetSecretary(leader);
  const portfolioTitle = cabinetSecretary
    ? getPortfolioTitle(leader)
    : "";

  const cardContent = (
    <article
      className={`leader-card ${
        ministryRoute ? "leader-card--clickable" : ""
      }`}
    >
      <div className="leader-card__media">
        <img
          src={photo}
          alt={`Portrait of ${fullName}`}
          className="leader-card__image"
          loading="lazy"
          onError={handleImageError}
        />

        <span className="leader-card__category">
          {category}
        </span>

        {ministryRoute && (
          <span
            className="leader-card__open"
            aria-hidden="true"
          >
            <ArrowUpRight size={17} />
          </span>
        )}
      </div>

      <div className="leader-card__content">
        <h3 className="leader-card__name">
          {fullName}
        </h3>

        <div className="leader-card__position">
          <span className="leader-card__icon">
            <BriefcaseBusiness
              size={13}
              strokeWidth={1.8}
            />
          </span>

          <span>{position}</span>
        </div>

        {portfolioTitle && (
          <div
            className="leader-card__portfolio"
            aria-label={`Portfolio: ${portfolioTitle}`}
          >
            <Layers3
              size={13}
              strokeWidth={1.8}
              className="leader-card__portfolio-icon"
            />

            <div className="leader-card__portfolio-content">
              <span className="leader-card__portfolio-label">
                Portfolio
              </span>

              <span className="leader-card__portfolio-title">
                {portfolioTitle}
              </span>
            </div>
          </div>
        )}

        {county && (
          <div className="leader-card__location">
            <MapPin
              size={12}
              strokeWidth={1.8}
            />

            <span>{county}</span>
          </div>
        )}

        {ministryRoute && (
          <span className="leader-card__learn-more">
            Explore Office
            <ArrowUpRight size={13} />
          </span>
        )}
      </div>
    </article>
  );

  if (!ministryRoute) {
    return cardContent;
  }

  return (
    <Link
      to={ministryRoute}
      className="leader-card__link"
      aria-label={`Explore the ${position} office`}
    >
      {cardContent}
    </Link>
  );
}

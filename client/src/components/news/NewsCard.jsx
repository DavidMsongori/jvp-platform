import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
} from "lucide-react";

import "./NewsCard.css";

const FALLBACK_IMAGE = "/images/branding/jvp-logo.png";

function formatDate(date) {
  if (!date) {
    return "JVP News";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "JVP News";
  }

  return parsedDate.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getReadingTime(article) {
  if (article?.readingTime) {
    return `${article.readingTime} min read`;
  }

  const content =
    article?.content ||
    article?.body ||
    article?.description ||
    article?.excerpt ||
    "";

  if (!content) {
    return "2 min read";
  }

  const wordCount = String(content)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(
    1,
    Math.ceil(wordCount / 200)
  );

  return `${minutes} min read`;
}

function handleImageError(event) {
  if (
    event.currentTarget.dataset.fallbackApplied ===
    "true"
  ) {
    return;
  }

  event.currentTarget.dataset.fallbackApplied = "true";
  event.currentTarget.src = FALLBACK_IMAGE;
}

function NewsCard({ article }) {
  if (!article) {
    return null;
  }

  const title =
    article.title ||
    "JVP News Story";

  const excerpt =
    article.excerpt ||
    article.summary ||
    article.shortDescription ||
    "";

  const category =
    article.category ||
    "News";

  const image =
    article.featuredImage ||
    article.coverImage?.secureUrl ||
    article.coverImage?.url ||
    article.image?.secureUrl ||
    article.image?.url ||
    FALLBACK_IMAGE;

  const slug =
    article.slug ||
    article._id ||
    article.id;

  const articleUrl = slug
    ? `/news/${slug}`
    : "/news";

  const publishedDate =
    article.publishedAt ||
    article.createdAt ||
    article.date;

  const readingTime =
    getReadingTime(article);

  return (
    <article className="news-card">

      {/* ==================================================
          IMAGE
      ================================================== */}

      <Link
        to={articleUrl}
        className="news-card__image"
        aria-label={`Read ${title}`}
      >
        <img
          src={image}
          alt={
            article.imageAlt ||
            article.featuredImageAlt ||
            title
          }
          loading="lazy"
          onError={handleImageError}
        />

        <div className="news-card__image-overlay" />

        <span className="news-card__category">
          {category}
        </span>
      </Link>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="news-card__content">

        <div className="news-card__meta">

          <span>
            <CalendarDays size={12} />
            {formatDate(publishedDate)}
          </span>

          <span className="news-card__meta-divider" />

          <span>
            <Clock3 size={12} />
            {readingTime}
          </span>

        </div>

        <h3 className="news-card__title">
          <Link to={articleUrl}>
            {title}
          </Link>
        </h3>

        {excerpt && (
          <p className="news-card__excerpt">
            {excerpt}
          </p>
        )}

        <Link
          to={articleUrl}
          className="news-card__link"
        >
          <span>Read story</span>
          <ArrowRight size={14} />
        </Link>

      </div>
    </article>
  );
}

export default NewsCard;
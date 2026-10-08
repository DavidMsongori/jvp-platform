import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Star,
} from "lucide-react";

import "./FeaturedStory.css";

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

function FeaturedStory({ article, loading = false }) {
  if (loading) {
    return (
      <section
        className="featured-story featured-story--loading"
        aria-label="Loading featured story"
      >
        <div className="featured-story__skeleton-image" />

        <div className="featured-story__skeleton-content">
          <span className="featured-story__skeleton-line featured-story__skeleton-line--small" />
          <span className="featured-story__skeleton-line featured-story__skeleton-line--title" />
          <span className="featured-story__skeleton-line featured-story__skeleton-line--title featured-story__skeleton-line--short" />
          <span className="featured-story__skeleton-line featured-story__skeleton-line--text" />
          <span className="featured-story__skeleton-line featured-story__skeleton-line--text featured-story__skeleton-line--short" />
        </div>
      </section>
    );
  }

  if (!article) {
    return null;
  }

  const title =
    article.title ||
    "Featured JVP Story";

  const excerpt =
    article.excerpt ||
    article.summary ||
    article.shortDescription ||
    article.description ||
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
    <section
      className="featured-story"
      aria-labelledby="featured-story-title"
    >
      <div className="featured-story__image">
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

        <div className="featured-story__image-overlay" />

        <span className="featured-story__badge">
          <Star size={11} />
          Featured Story
        </span>
      </div>

      <div className="featured-story__content">
        <div className="featured-story__topline">
          <span className="featured-story__category">
            {category}
          </span>

          <span className="featured-story__dot" />

          <span className="featured-story__label">
            JVP Newsroom
          </span>
        </div>

        <h2
          id="featured-story-title"
          className="featured-story__title"
        >
          <Link to={articleUrl}>
            {title}
          </Link>
        </h2>

        {excerpt && (
          <p className="featured-story__excerpt">
            {excerpt}
          </p>
        )}

        <div className="featured-story__meta">
          <span>
            <CalendarDays size={13} />
            {formatDate(publishedDate)}
          </span>

          <span className="featured-story__meta-divider" />

          <span>
            <Clock3 size={13} />
            {readingTime}
          </span>
        </div>

        <Link
          to={articleUrl}
          className="featured-story__link"
        >
          <span>Read featured story</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

export default FeaturedStory;
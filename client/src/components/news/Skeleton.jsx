import "./Skeleton.css";

export function SkeletonBlock({
  className = "",
}) {
  return (
    <span
      className={`news-skeleton__block ${className}`}
      aria-hidden="true"
    />
  );
}

export function NewsCardSkeleton() {
  return (
    <article className="news-skeleton-card">
      <SkeletonBlock className="news-skeleton-card__image" />

      <div className="news-skeleton-card__content">
        <SkeletonBlock className="news-skeleton-card__meta" />

        <SkeletonBlock className="news-skeleton-card__title" />
        <SkeletonBlock className="news-skeleton-card__title news-skeleton-card__title--short" />

        <SkeletonBlock className="news-skeleton-card__text" />
        <SkeletonBlock className="news-skeleton-card__text news-skeleton-card__text--short" />

        <SkeletonBlock className="news-skeleton-card__link" />
      </div>
    </article>
  );
}

export function FeaturedStorySkeleton() {
  return (
    <section
      className="news-skeleton-featured"
      aria-label="Loading featured story"
    >
      <SkeletonBlock className="news-skeleton-featured__image" />

      <div className="news-skeleton-featured__content">
        <SkeletonBlock className="news-skeleton-featured__eyebrow" />

        <SkeletonBlock className="news-skeleton-featured__title" />
        <SkeletonBlock className="news-skeleton-featured__title news-skeleton-featured__title--short" />

        <SkeletonBlock className="news-skeleton-featured__text" />
        <SkeletonBlock className="news-skeleton-featured__text" />
        <SkeletonBlock className="news-skeleton-featured__text news-skeleton-featured__text--short" />

        <SkeletonBlock className="news-skeleton-featured__meta" />
        <SkeletonBlock className="news-skeleton-featured__button" />
      </div>
    </section>
  );
}

export function NewsGridSkeleton({
  count = 6,
}) {
  return (
    <div
      className="news-skeleton-grid"
      aria-label="Loading news stories"
    >
      {Array.from({ length: count }).map((_, index) => (
        <NewsCardSkeleton key={index} />
      ))}
    </div>
  );
}

function Skeleton({
  variant = "card",
  count = 6,
}) {
  if (variant === "featured") {
    return <FeaturedStorySkeleton />;
  }

  if (variant === "grid") {
    return <NewsGridSkeleton count={count} />;
  }

  return <NewsCardSkeleton />;
}

export default Skeleton;
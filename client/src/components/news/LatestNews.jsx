import { ArrowRight, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";

import NewsCard from "./NewsCard";
import NewsEmptyState from "./NewsEmptyState";
import { NewsGridSkeleton } from "./Skeleton";

import "./LatestNews.css";

/* ==========================================================
   LATEST NEWS
========================================================== */

function LatestNews({
  articles = [],
  loading = false,
  limit = 8,
}) {
  const visibleArticles = articles.slice(0, limit);

  return (
    <section
      id="latest-news"
      className="latest-news"
      aria-labelledby="latest-news-title"
    >
      <div className="latest-news__container">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="latest-news__header">
          <div className="latest-news__heading">
            <span className="latest-news__eyebrow">
              <Newspaper size={12} />
              JVP NEWSROOM
            </span>

            <h2
              id="latest-news-title"
              className="latest-news__title"
            >
              Latest News
            </h2>

            <p className="latest-news__description">
              Updates, announcements, opportunities and stories
              from across the JVP movement.
            </p>
          </div>

          <Link
            to="/news"
            className="latest-news__view-all"
          >
            <span>View all news</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* ==================================================
            CONTENT
        ================================================== */}

        {loading ? (
          <NewsGridSkeleton count={6} />
        ) : visibleArticles.length > 0 ? (
          <div className="latest-news__grid">
            {visibleArticles.map((article, index) => (
              <NewsCard
                key={
                  article?._id ||
                  article?.id ||
                  article?.slug ||
                  index
                }
                article={article}
              />
            ))}
          </div>
        ) : (
          <NewsEmptyState />
        )}
      </div>
    </section>
  );
}

export default LatestNews;
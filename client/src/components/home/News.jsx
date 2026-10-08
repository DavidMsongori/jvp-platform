import { useEffect, useMemo } from "react";
import {
  ArrowRight,
  CalendarDays,
  Newspaper,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useNews } from "../../context/NewsContext";

import "./News.css";

const FALLBACK_IMAGE = "/images/branding/jvp-logo.png";

function handleImageError(event) {
  if (event.currentTarget.dataset.fallbackApplied === "true") {
    return;
  }

  event.currentTarget.dataset.fallbackApplied = "true";
  event.currentTarget.src = FALLBACK_IMAGE;
}

function formatDate(date) {
  if (!date) {
    return "JVP News";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getArticleLink(article) {
  if (article?.slug) {
    return `/news/${article.slug}`;
  }

  if (article?._id) {
    return `/news/${article._id}`;
  }

  if (article?.id) {
    return `/news/${article.id}`;
  }

  return "/news";
}

function News() {
  const {
    articles = [],
    latestArticles = [],
    loading,
    latestLoading,
    fetchLatest,
  } = useNews();

  useEffect(() => {
    let cancelled = false;

    const loadLatestNews = async () => {
      try {
        await fetchLatest(3);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Unable to load homepage news:",
            error
          );
        }
      }
    };

    loadLatestNews();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayArticles = useMemo(() => {
    const source =
      latestArticles.length > 0
        ? latestArticles
        : articles;

    return source.slice(0, 3);
  }, [latestArticles, articles]);

  const isLoading =
    loading || latestLoading;

  return (
    <section
      className="home-news"
      id="news"
    >
      <div className="home-news__container">

        {/* =========================
            HEADER
        ========================= */}

        <div className="home-news__header">

          <div>
            <span className="home-news__eyebrow">
              JVP NEWSROOM
            </span>

            <h2>
              Latest News &amp; Stories
            </h2>

            <p>
              Stay informed about JVP activities,
              opportunities, leadership and stories
              from across the Coast Region.
            </p>
          </div>

          <Link
            to="/news"
            className="home-news__view-all"
          >
            View all news
            <ArrowRight size={16} />
          </Link>

        </div>

        {/* =========================
            LOADING
        ========================= */}

        {isLoading ? (

          <div className="home-news__grid">

            {Array.from({ length: 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="home-news__skeleton"
                >
                  <div className="home-news__skeleton-image" />

                  <div className="home-news__skeleton-content">
                    <span />
                    <strong />
                    <strong />
                    <p />
                    <p />
                  </div>
                </div>
              )
            )}

          </div>

        ) : displayArticles.length > 0 ? (

          /* =========================
             NEWS GRID
          ========================= */

          <div className="home-news__grid">

            {displayArticles.map(
              (article, index) => (
                <article
                  key={
                    article?._id ||
                    article?.id ||
                    article?.slug ||
                    index
                  }
                  className="home-news-card"
                >

                  <Link
                    to={getArticleLink(article)}
                    className="home-news-card__image"
                  >
                    <img
                      src={
                        article?.featuredImage ||
                        FALLBACK_IMAGE
                      }
                      alt={
                        article?.title ||
                        "JVP News"
                      }
                      onError={handleImageError}
                    />

                    <span>
                      {article?.category ||
                        "News"}
                    </span>
                  </Link>

                  <div className="home-news-card__content">

                    <div className="home-news-card__meta">

                      <CalendarDays size={13} />

                      <span>
                        {formatDate(
                          article?.publishedAt
                        )}
                      </span>

                    </div>

                    <h3>
                      {article?.title ||
                        "JVP News Story"}
                    </h3>

                    {article?.excerpt && (
                      <p>
                        {article.excerpt}
                      </p>
                    )}

                    <Link
                      to={getArticleLink(article)}
                      className="home-news-card__link"
                    >
                      Read story
                      <ArrowRight size={15} />
                    </Link>

                  </div>

                </article>
              )
            )}

          </div>

        ) : (

          /* =========================
             EMPTY STATE
          ========================= */

          <div className="home-news__empty">

            <div className="home-news__empty-icon">
              <Newspaper size={21} />
            </div>

            <div>
              <h3>
                No news stories yet
              </h3>

              <p>
                JVP news and updates will appear
                here once they are published.
              </p>
            </div>

            <Link to="/news">
              Visit newsroom
              <ArrowRight size={15} />
            </Link>

          </div>

        )}

      </div>
    </section>
  );
}

export default News;
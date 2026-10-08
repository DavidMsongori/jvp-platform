import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Eye,
  Link as LinkIcon,
  Newspaper,
  Share2,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import { useNews } from "../../context/NewsContext";

import "./NewsArticle.css";

/* ==========================================================
   IMAGE FALLBACK
========================================================== */

const FALLBACK_IMAGE =
  "/images/branding/jvp-logo.png";

function handleImageError(event) {
  if (
    event.currentTarget.dataset.fallbackApplied ===
    "true"
  ) {
    return;
  }

  event.currentTarget.dataset.fallbackApplied =
    "true";

  event.currentTarget.src = FALLBACK_IMAGE;
}

/* ==========================================================
   DATE FORMATTER
========================================================== */

function formatDate(date) {
  if (!date) {
    return "JVP Newsroom";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "en-KE",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

/* ==========================================================
   CONTENT FORMATTER
========================================================== */

function renderContent(content) {
  if (!content) {
    return null;
  }

  const paragraphs = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.map((paragraph, index) => (
    <p key={`${index}-${paragraph.slice(0, 20)}`}>
      {paragraph}
    </p>
  ));
}

/* ==========================================================
   SHARE
========================================================== */

function shareArticle(article) {
  if (!article) {
    return;
  }

  const url = window.location.href;
  const title = article.title || "JVP News";

  if (
    navigator.share &&
    typeof navigator.share === "function"
  ) {
    navigator
      .share({
        title,
        text:
          article.excerpt ||
          "Read this story from JVP Newsroom.",
        url,
      })
      .catch(() => {});
  }
}

function shareOnFacebook() {
  const url = encodeURIComponent(
    window.location.href
  );

  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    "_blank",
    "noopener,noreferrer"
  );
}

function shareOnX(article) {
  const url = encodeURIComponent(
    window.location.href
  );

  const text = encodeURIComponent(
    article?.title || "JVP News"
  );

  window.open(
    `https://x.com/intent/post?url=${url}&text=${text}`,
    "_blank",
    "noopener,noreferrer"
  );
}

async function copyArticleLink() {
  try {
    await navigator.clipboard.writeText(
      window.location.href
    );
  } catch (error) {
    console.error(
      "Unable to copy article link:",
      error
    );
  }
}

/* ==========================================================
   ARTICLE PAGE
========================================================== */

export default function NewsArticle() {
  const { slug } = useParams();

  const {
    currentArticle,
    relatedArticles = [],

    loading,
    error,

    fetchArticle,
    fetchRelatedNews,
    clearCurrentArticle,
  } = useNews();

  /* ========================================================
     LOAD ARTICLE
  ======================================================== */

  useEffect(() => {
    if (!slug) {
      return;
    }

    clearCurrentArticle();

    fetchArticle(slug).catch((error) => {
      console.error(
        "Failed to load news article:",
        error
      );
    });

    fetchRelatedNews(slug).catch((error) => {
      console.error(
        "Failed to load related news:",
        error
      );
    });

    return () => {
      clearCurrentArticle();
    };

    // Intentionally load when slug changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /* ========================================================
     ARTICLE
  ======================================================== */

  const article = currentArticle;

  /* ========================================================
     ARTICLE URL
  ======================================================== */

  useMemo(
    () => window.location.href,
    []
  );

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading && !article) {
    return (
      <div className="public-news-article-page">
        <Navbar />

        <main className="public-news-article-main">
          <div className="public-news-container">

            <div className="public-news-article-loading">

              <div className="article-loading-image" />

              <div className="article-loading-category" />

              <div className="article-loading-title" />

              <div className="article-loading-title short" />

              <div className="article-loading-meta" />

              <div className="article-loading-content">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

            </div>

          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /* ========================================================
     ERROR / NOT FOUND
  ======================================================== */

  if (!article || error) {
    return (
      <div className="public-news-article-page">
        <Navbar />

        <main className="public-news-article-main">
          <div className="public-news-container">

            <div className="public-news-article-not-found">

              <div className="article-not-found-icon">
                <Newspaper size={28} />
              </div>

              <span>
                JVP Newsroom
              </span>

              <h1>
                Story not found
              </h1>

              <p>
                The news story you are looking for
                may have been removed, unpublished,
                or the link may be incorrect.
              </p>

              <Link to="/news">
                <ArrowLeft size={16} />
                Back to News
              </Link>

            </div>

          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="public-news-article-page">

      <Navbar />

      <main className="public-news-article-main">

        <div className="public-news-container">

          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <div className="public-news-article-breadcrumb">

            <Link to="/news">
              <ArrowLeft size={15} />
              Newsroom
            </Link>

            <span>/</span>

            <span>
              {article.category || "News"}
            </span>

          </div>

          {/* ==================================================
              ARTICLE HEADER
          ================================================== */}

          <article className="public-news-article">

            <header className="public-news-article-header">

              <span className="public-news-article-category">
                {article.category || "News"}
              </span>

              <h1>
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="public-news-article-excerpt">
                  {article.excerpt}
                </p>
              )}

              <div className="public-news-article-meta">

                <div>
                  <CalendarDays size={16} />

                  <span>
                    {formatDate(
                      article.publishedAt ||
                      article.createdAt
                    )}
                  </span>
                </div>

                {article.authorName && (
                  <div>
                    <span>
                      By {article.authorName}
                    </span>
                  </div>
                )}

                {typeof article.views ===
                  "number" && (
                  <div>
                    <Eye size={16} />

                    <span>
                      {article.views.toLocaleString()}
                      {" "}
                      views
                    </span>
                  </div>
                )}

              </div>

            </header>

            {/* ==================================================
                FEATURED IMAGE
            ================================================== */}

            <div className="public-news-article-featured-image">

              <img
                src={
                  article.featuredImage ||
                  FALLBACK_IMAGE
                }
                alt={
                  article.title ||
                  "JVP News"
                }
                onError={handleImageError}
              />

            </div>

            {/* ==================================================
                ARTICLE BODY
            ================================================== */}

            <div className="public-news-article-layout">

              <aside className="public-news-article-share">

                <span>
                  Share
                </span>

                <button
                  type="button"
                  onClick={shareOnFacebook}
                  aria-label="Share on Facebook"
                  title="Share on Facebook"
                >
                  <strong>f</strong>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    shareOnX(article)
                  }
                  aria-label="Share on X"
                  title="Share on X"
                >
                  <strong>𝕏</strong>
                </button>

                <button
                  type="button"
                  onClick={copyArticleLink}
                  aria-label="Copy article link"
                  title="Copy article link"
                >
                  <LinkIcon size={17} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    shareArticle(article)
                  }
                  aria-label="Share article"
                  title="Share article"
                >
                  <Share2 size={17} />
                </button>

              </aside>

              <div className="public-news-article-content">

                {renderContent(
                  article.content
                )}

                {/* ==================================================
                    TAGS
                ================================================== */}

                {Array.isArray(
                  article.tags
                ) &&
                  article.tags.length > 0 && (
                    <div className="public-news-article-tags">

                      <span>
                        Tags
                      </span>

                      <div>
                        {article.tags.map(
                          (tag) => (
                            <span
                              key={tag}
                            >
                              #{tag}
                            </span>
                          )
                        )}
                      </div>

                    </div>
                  )}

              </div>

            </div>

            {/* ==================================================
                SHARE FOOTER
            ================================================== */}

            <div className="public-news-article-share-footer">

              <div>

                <span>
                  Enjoyed this story?
                </span>

                <strong>
                  Share it with your network.
                </strong>

              </div>

              <div>

                <button
                  type="button"
                  onClick={shareOnFacebook}
                >
                  <strong>f</strong>
                  Facebook
                </button>

                <button
                  type="button"
                  onClick={() =>
                    shareOnX(article)
                  }
                >
                  <strong>𝕏</strong>
                  X
                </button>

                <button
                  type="button"
                  onClick={copyArticleLink}
                >
                  <LinkIcon size={16} />
                  Copy Link
                </button>

              </div>

            </div>

          </article>

          {/* ==================================================
              RELATED STORIES
          ================================================== */}

          {relatedArticles.length > 0 && (
            <section className="public-news-related">

              <div className="public-news-related-heading">

                <div>

                  <span>
                    Continue reading
                  </span>

                  <h2>
                    Related stories
                  </h2>

                </div>

                <Link to="/news">
                  View all news
                  <ArrowRight size={16} />
                </Link>

              </div>

              <div className="public-news-related-grid">

                {relatedArticles
                  .filter(
                    (item) =>
                      item.slug !==
                      article.slug
                  )
                  .slice(0, 3)
                  .map((item) => (
                    <article
                      key={
                        item._id ||
                        item.slug
                      }
                      className="public-news-related-card"
                    >

                      <div className="public-news-related-image">

                        <img
                          src={
                            item.featuredImage ||
                            FALLBACK_IMAGE
                          }
                          alt={
                            item.title ||
                            "JVP News"
                          }
                          onError={
                            handleImageError
                          }
                        />

                        <span>
                          {item.category ||
                            "News"}
                        </span>

                      </div>

                      <div className="public-news-related-content">

                        <div className="public-news-meta">

                          <CalendarDays
                            size={14}
                          />

                          <span>
                            {formatDate(
                              item.publishedAt
                            )}
                          </span>

                        </div>

                        <h3>
                          {item.title}
                        </h3>

                        {item.excerpt && (
                          <p>
                            {item.excerpt}
                          </p>
                        )}

                        <Link
                          to={`/news/${item.slug}`}
                        >
                          Read story
                          <ArrowRight
                            size={15}
                          />
                        </Link>

                      </div>

                    </article>
                  ))}

              </div>

            </section>
          )}

        </div>

      </main>

      <Footer />

    </div>
  );
}
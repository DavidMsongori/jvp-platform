import { useEffect, useRef } from "react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import { useNews } from "../../context/NewsContext";

import Hero from "../../components/news/Hero";
import FeaturedStory from "../../components/news/FeaturedStory";
import LatestNews from "../../components/news/LatestNews";
import SocialLinks from "../../components/news/SocialLinks";
import NewsCTA from "../../components/news/NewsCTA";

import "./News.css";

/* ==========================================================
   PUBLIC NEWS PAGE
========================================================== */

export default function News() {
  const {
    articles = [],
    featuredArticle,
    latestArticles = [],

    loading = false,
    featuredLoading = false,
    latestLoading = false,

    fetchNews,
    fetchFeatured,
    fetchLatest,
  } = useNews();

  /*
   * Prevent duplicate initial requests.
   *
   * React StrictMode can run effects more than once
   * during development. This guard keeps the initial
   * public news requests from being duplicated.
   */
  const hasLoadedRef = useRef(false);

  /* ========================================================
     INITIAL DATA LOAD
  ======================================================== */

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    const loadNews = async () => {
      try {
        await Promise.allSettled([
          fetchNews({
            page: 1,
            limit: 8,
          }),

          fetchFeatured(1),

          fetchLatest(8),
        ]);
      } catch (error) {
        console.error(
          "Failed to load public news:",
          error
        );
      }
    };

    loadNews();

    /*
     * NewsContext methods are intentionally excluded.
     * They may be recreated when context state changes,
     * which could otherwise trigger repeated requests.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ========================================================
     DISPLAY DATA
  ======================================================== */

  /*
   * Prefer the dedicated latest-news endpoint.
   * Fall back to the general news collection if needed.
   */
  const displayArticles =
    latestArticles.length > 0
      ? latestArticles
      : articles;

  /*
   * Prefer the dedicated featured article.
   * If none exists, use the first available article
   * as a graceful fallback.
   */
  const featured =
    featuredArticle ||
    displayArticles[0] ||
    null;

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="public-news-page">
      <Navbar />

      <main>
        {/* ==================================================
            HERO
        ================================================== */}

        <Hero />

        {/* ==================================================
            FEATURED STORY
        ================================================== */}

        <section className="public-news-featured-section">
          <div className="public-news-container">
            <FeaturedStory
              article={featured}
              loading={featuredLoading}
            />
          </div>
        </section>

        {/* ==================================================
            LATEST NEWS
        ================================================== */}

        <LatestNews
          articles={displayArticles}
          loading={loading || latestLoading}
        />

        {/* ==================================================
            SOCIAL LINKS
        ================================================== */}

        <SocialLinks />

        {/* ==================================================
            CTA
        ================================================== */}

        <NewsCTA />
      </main>

      <Footer />
    </div>
  );
}
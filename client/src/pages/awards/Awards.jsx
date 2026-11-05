import { useEffect, useState } from "react";
import { getAwardCategories } from "../../services/awardService";
import "./Awards.css";

export default function Awards() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const response = await getAwardCategories();

        if (!isMounted) return;

        const data = response?.data;
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load award categories. Please try again later."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const getNominationLink = (category) => {
    const categoryId = category?._id || "";
    const categoryName = category?.name || "";

    return `/awards/nominate?categoryId=${encodeURIComponent(
      categoryId
    )}&category=${encodeURIComponent(categoryName)}`;
  };

  return (
    <main className="awards-page">
      <section className="awards-hero">
        <p className="awards-eyebrow">
          JVP Coastal Youth Excellence Awards
        </p>

        <h1>Celebrating Leadership. Recognising Impact.</h1>

        <p>
          Inspiring the next generation by recognising young people
          making a difference across Kenya's six coastal counties.
        </p>

        <p className="awards-event">
          JVP @ 1 Anniversary · 22 December 2026 · Lamu County
        </p>

        <div className="awards-hero-actions">
          <a href="#award-categories" className="awards-secondary-btn">
            Explore Categories
          </a>

          <a
            href="/awards/nominate"
            className="awards-nominate-btn"
          >
            Nominate Yourself
          </a>
        </div>

        <p className="awards-nomination-note">
          Have you made a difference in your community? Put yourself
          forward for recognition through the JVP Coastal Youth
          Excellence Awards.
        </p>
      </section>

      <section className="awards-content" id="award-categories">
        <h2>Award Categories</h2>

        <p>
          Explore the official categories published by the JVP Awards
          Secretariat and select the category that best reflects your
          achievements and impact.
        </p>

        {loading && <p>Loading award categories...</p>}

        {!loading && error && (
          <p role="alert" className="awards-error">
            {error}
          </p>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="awards-empty">
            <h3>Categories are being prepared</h3>
            <p>
              The Awards Secretariat has not published any active
              categories yet. Please check back for official updates.
            </p>
          </div>
        )}

        {!loading && !error && categories.length > 0 && (
          <div className="awards-category-grid">
            {categories.map((category) => (
              <article
                className="awards-category-card"
                key={category._id || category.slug}
              >
                <h3>
                  {category.icon ? `${category.icon} ` : ""}
                  {category.name}
                </h3>

                <p>
                  {category.description ||
                    "Official award category."}
                </p>

                <a
                  href={getNominationLink(category)}
                  className="awards-category-nominate-btn"
                >
                  Nominate Yourself →
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
import "./PageHero.css";

import defaultHero from "../../assets/hero/hero1.jpg";

function PageHero({
  title,
  subtitle,
  image = defaultHero,
  breadcrumb,
}) {
  return (
    <section
      className="page-hero"
      style={{
        backgroundImage: `url(${image})`,
      }}
    >
      <div className="page-overlay"></div>

      <div className="page-hero-content">
        {breadcrumb && <span>{breadcrumb}</span>}

        <h1>{title}</h1>

        <p>{subtitle}</p>
      </div>
    </section>
  );
}

export default PageHero;
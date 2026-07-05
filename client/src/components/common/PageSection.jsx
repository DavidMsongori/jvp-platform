import "./PageSection.css";

function PageSection({
  title,
  subtitle,
  children,
}) {
  return (
    <section className="page-section">

      <div className="container">

        <div className="section-header">

          <h2>{title}</h2>

          {subtitle && (
            <p>{subtitle}</p>
          )}

        </div>

        {children}

      </div>

    </section>
  );
}

export default PageSection;
import "./ExecutiveSection.css";

import LeaderCard from "./LeaderCard";

export default function ExecutiveSection({
  leaders = [],
}) {
  if (!leaders.length) {
    return null;
  }

  return (
    <section
      className="executive-section"
      aria-labelledby="regional-cabinet-title"
    >

      {/* =====================================================
          SECTION HEADER
      ===================================================== */}

      <div className="executive-header">

        <span className="section-tag">
          Regional Leadership
        </span>

        <h2 id="regional-cabinet-title">
          Regional Cabinet
        </h2>

        <div className="executive-divider" />

        <p className="executive-intro">
          The Regional Cabinet is the principal executive
          leadership structure of Jumuiya ya Vijana wa Pwani.
          It provides strategic direction, coordinates regional
          programmes and drives the implementation of JVP's
          vision, policies and priorities across the six
          Coastal Counties.
        </p>

        <p className="executive-subtext">
          The Cabinet brings together the President,
          Deputy President and Cabinet Secretaries responsible
          for key areas of youth development, economic
          empowerment, governance and regional transformation.
        </p>

      </div>


      {/* =====================================================
          CABINET DIRECTORY
      ===================================================== */}

      <div className="executive-content">

        <div className="executive-grid">

          {leaders.map((leader) => (
            <LeaderCard
              key={leader._id}
              leader={leader}
            />
          ))}

        </div>

      </div>

    </section>
  );
}
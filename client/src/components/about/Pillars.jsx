import {
  FaUsers,
  FaGraduationCap,
  FaBriefcase,
  FaWater,
  FaLeaf,
  FaLightbulb,
  FaHandshake,
  FaGlobeAfrica
} from "react-icons/fa";

import "./Pillars.css";

const pillars = [
  {
    icon: <FaUsers />,
    title: "Leadership Development",
    description:
      "Building ethical, visionary and transformative youth leaders across the Coast Region."
  },
  {
    icon: <FaGraduationCap />,
    title: "Education & Skills",
    description:
      "Providing mentorship, scholarships, technical skills and lifelong learning opportunities."
  },
  {
    icon: <FaBriefcase />,
    title: "Entrepreneurship",
    description:
      "Supporting youth enterprises, MSMEs, innovation and sustainable economic empowerment."
  },
  {
    icon: <FaWater />,
    title: "Blue Economy",
    description:
      "Unlocking opportunities in fisheries, marine conservation, tourism and coastal resources."
  },
  {
    icon: <FaLeaf />,
    title: "Climate Action",
    description:
      "Championing environmental conservation, tree planting and climate resilience."
  },
  {
    icon: <FaLightbulb />,
    title: "Innovation & Technology",
    description:
      "Promoting digital inclusion, AI, innovation hubs and emerging technologies."
  },
  {
    icon: <FaHandshake />,
    title: "Civic Engagement",
    description:
      "Strengthening governance, volunteerism, advocacy and active youth participation."
  },
  {
    icon: <FaGlobeAfrica />,
    title: "Partnerships",
    description:
      "Building strategic collaborations that create opportunities for young people."
  }
];

function Pillars() {
  return (
    <section className="pillars">

      <div className="container">

        <div className="section-title">

          <span>OUR STRATEGIC PILLARS</span>

          <h2>
            Driving Youth Transformation
          </h2>

          <p>
            Everything JVP does is anchored on these eight pillars
            that empower, connect and transform young people across
            the Coast Region.
          </p>

        </div>

        <div className="pillars-grid">

          {pillars.map((pillar, index) => (

            <div
              className="pillar-card"
              key={index}
            >

              <div className="pillar-icon">

                {pillar.icon}

              </div>

              <h3>

                {pillar.title}

              </h3>

              <p>

                {pillar.description}

              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}

export default Pillars;
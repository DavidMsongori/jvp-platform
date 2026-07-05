import "./Programs.css";

import {
  FaUsers,
  FaLeaf,
  FaWater,
  FaLaptopCode,
  FaBriefcase,
  FaGraduationCap,
} from "react-icons/fa";

const programs = [
  {
    icon: <FaUsers />,
    title: "Leadership & Governance",
    description:
      "Developing ethical, visionary and accountable youth leaders across the Coast Region.",
  },
  {
    icon: <FaLeaf />,
    title: "Climate Action",
    description:
      "Driving tree planting, environmental conservation and climate resilience initiatives.",
  },
  {
    icon: <FaWater />,
    title: "Blue Economy",
    description:
      "Creating opportunities in fisheries, marine innovation and sustainable coastal livelihoods.",
  },
  {
    icon: <FaLaptopCode />,
    title: "Innovation & Technology",
    description:
      "Equipping young people with digital skills and innovative solutions for the future.",
  },
  {
    icon: <FaBriefcase />,
    title: "Entrepreneurship",
    description:
      "Supporting startups, business development and youth employment opportunities.",
  },
  {
    icon: <FaGraduationCap />,
    title: "Education & Skills",
    description:
      "Connecting youth to scholarships, mentorship and professional development programmes.",
  },
];

function Programs() {
  return (
    <section className="programs" id="programs">

      <div className="section-title">

        <span>OUR PROGRAMMES</span>

        <h2>Creating Opportunities For Every Young Person</h2>

        <p>
          Through strategic partnerships and community engagement,
          JVP empowers youth to become leaders, innovators and
          changemakers across the Coastal Region.
        </p>

      </div>

      <div className="program-grid">

        {programs.map((program, index) => (

          <div className="program-card" key={index}>

            <div className="program-icon">

              {program.icon}

            </div>

            <h3>{program.title}</h3>

            <p>{program.description}</p>

            <button>
              Learn More
            </button>

          </div>

        ))}

      </div>

    </section>
  );
}

export default Programs;
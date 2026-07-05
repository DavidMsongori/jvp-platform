import "./OurJourney.css";

import {
  FaFlag,
  FaUsers,
  FaLeaf,
  FaGlobeAfrica,
  FaRocket,
} from "react-icons/fa";

const timeline = [

  {
    icon: <FaFlag />,
    year: "2025",
    title: "JVP Founded",
    description:
      "Jumuiya ya Vijana wa Pwani was established to unite and empower young people across Kenya's Coast Region.",
  },

  {
    icon: <FaUsers />,
    year: "2025",
    title: "Youth Mobilization",
    description:
      "Expansion into the six coastal counties through membership drives, partnerships and youth engagement.",
  },

  {
    icon: <FaLeaf />,
    year: "2026",
    title: "Leadership & Climate Action",
    description:
      "Implementation of youth leadership, environmental conservation and entrepreneurship programmes.",
  },

  {
    icon: <FaGlobeAfrica />,
    year: "2026",
    title: "Coastal Youth Summit",
    description:
      "Hosting the flagship regional summit to connect young leaders, innovators and development partners.",
  },

  {
    icon: <FaRocket />,
    year: "Future",
    title: "Growing Together",
    description:
      "Expanding opportunities, partnerships and sustainable programmes for every young person across the Coast Region.",
  },

];

function OurJourney() {

  return (

    <section className="journey">

      <div className="journey-container">

        <div className="section-title">

          <span>OUR JOURNEY</span>

          <h2>Growing Together, One Milestone at a Time</h2>

          <p>

            Every milestone represents our commitment
            to empowering young people and creating
            sustainable impact across the Coast Region.

          </p>

        </div>

        <div className="timeline">

          {timeline.map((item, index) => (

            <div className="timeline-item" key={index}>

              <div className="timeline-icon">

                {item.icon}

              </div>

              <div className="timeline-card">

                <small>{item.year}</small>

                <h3>{item.title}</h3>

                <p>{item.description}</p>

              </div>

            </div>

          ))}

        </div>

      </div>

    </section>

  );

}

export default OurJourney;
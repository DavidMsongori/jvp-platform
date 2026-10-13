import "./Statistics.css";

import {
  FaUsers,
  FaMapMarkerAlt,
  FaLeaf,
  FaHandshake,
} from "react-icons/fa";

const statistics = [
  {
    icon: <FaUsers />,
    value: "50,000+",
    label: "Youth Reached",
  },
  {
    icon: <FaMapMarkerAlt />,
    value: "6",
    label: "Coastal Counties",
  },
  {
    icon: <FaLeaf />,
    value: "100+",
    label: "Projects",
  },
  {
    icon: <FaHandshake />,
    value: "250+",
    label: "Leaders",
  },
];

function Statistics() {
  return (
    <section className="statistics">

      <div className="statistics-wrapper">

        {statistics.map((item, index) => (

          <div className="stat-item" key={index}>

            <div className="stat-icon">
              {item.icon}
            </div>

            <div>

              <h2>{item.value}</h2>

              <p>{item.label}</p>

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}

export default Statistics;
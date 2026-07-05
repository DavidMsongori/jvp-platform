import "./Foundation.css";

import {
  FaBullseye,
  FaEye,
  FaHeart,
  FaCheckCircle,
} from "react-icons/fa";

function Foundation() {

  const values = [
    "Leadership",
    "Integrity",
    "Innovation",
    "Inclusivity",
    "Sustainability",
    "Accountability",
  ];

  return (

    <section className="foundation">

      <div className="foundation-container">

        <div className="section-title">

          <span>OUR FOUNDATION</span>

          <h2>
            The Principles That Guide Our Journey
          </h2>

          <p>

            Everything we do is anchored on a clear
            mission, a bold vision and strong values
            that inspire positive transformation
            across Kenya's Coast Region.

          </p>

        </div>

        <div className="foundation-grid">

          {/* Mission */}

          <div className="foundation-card">

            <div className="foundation-icon">

              <FaBullseye />

            </div>

            <h3>Our Mission</h3>

            <p>

              To empower young people through
              leadership, innovation,
              entrepreneurship, climate action,
              partnerships and sustainable
              community development.

            </p>

          </div>

          {/* Vision */}

          <div className="foundation-card">

            <div className="foundation-icon">

              <FaEye />

            </div>

            <h3>Our Vision</h3>

            <p>

              A united, empowered and
              prosperous generation of
              coastal youth driving sustainable
              development and positive change.

            </p>

          </div>

          {/* Values */}

          <div className="foundation-card">

            <div className="foundation-icon">

              <FaHeart />

            </div>

            <h3>Core Values</h3>

            <div className="values-list">

              {values.map((value, index)=>(

                <div key={index}>

                  <FaCheckCircle />

                  {value}

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </section>

  );

}

export default Foundation;
import "./About.css";

import about1 from "../../assets/about/about1.jpg";
import about2 from "../../assets/about/about2.jpg";
import about3 from "../../assets/about/about3.jpg";
import about4 from "../../assets/about/about4.jpg";

import {
  FaLeaf,
  FaUsers,
  FaLightbulb,
  FaGlobeAfrica,
} from "react-icons/fa";

function About() {
  return (
    <section className="about" id="about">

      <div className="about-container">

        <div className="about-images">

          <img src={about1} alt="" className="big"/>

          <img src={about2} alt=""/>

          <img src={about3} alt=""/>

          <img src={about4} alt="" className="big"/>

        </div>

        <div className="about-content">

          <span>WHO WE ARE</span>

          <h2>
            Empowering Coastal Youth Through Leadership,
            Innovation and Sustainable Development.
          </h2>

          <p>
            Jumuiya ya Vijana wa Pwani (JVP) is a regional youth
            movement bringing together young people from
            Mombasa, Kilifi, Kwale, Lamu, Tana River and
            Taita Taveta.

            We connect youth with opportunities,
            strengthen leadership, promote entrepreneurship,
            climate action and community transformation.
          </p>

          <div className="about-features">

            <div>

              <FaUsers />

              <h4>Youth Leadership</h4>

            </div>

            <div>

              <FaLeaf />

              <h4>Climate Action</h4>

            </div>

            <div>

              <FaLightbulb />

              <h4>Innovation</h4>

            </div>

            <div>

              <FaGlobeAfrica />

              <h4>Blue Economy</h4>

            </div>

          </div>

          <a href="/about" className="about-btn">

            Learn More

          </a>

        </div>

      </div>

    </section>
  );
}

export default About;
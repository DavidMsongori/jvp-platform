import "./WhoWeAre.css";

import image1 from "../../assets/hero/hero1.jpg";
import image2 from "../../assets/hero/hero2.jpg";
import image3 from "../../assets/hero/hero3.jpg";
import image4 from "../../assets/hero/hero4.jpg";

import {
  FaCheckCircle,
} from "react-icons/fa";

function WhoWeAre() {

  return (

    <section className="who-we-are">

      <div className="who-container">

        {/* LEFT */}

        <div className="who-images">

          <img src={image1} alt="JVP" />

          <img src={image2} alt="JVP" className="tall" />

          <img src={image3} alt="JVP" className="tall" />

          <img src={image4} alt="JVP" />

        </div>

        {/* RIGHT */}

        <div className="who-content">

          <span>
            WHO WE ARE
          </span>

          <h2>

            Empowering the Next Generation
            of Coastal Leaders

          </h2>

          <p>

            Jumuiya ya Vijana wa Pwani (JVP)
            is a regional youth movement bringing
            together young people from the six
            coastal counties of Kenya to inspire
            leadership, innovation, entrepreneurship,
            climate action and sustainable development.

          </p>

          <p>

            Through partnerships, mentorship,
            advocacy and community-driven initiatives,
            we empower young people to unlock their
            potential while creating lasting impact
            within their communities.

          </p>

          <div className="who-list">

            <div>

              <FaCheckCircle />

              Leadership Development

            </div>

            <div>

              <FaCheckCircle />

              Entrepreneurship

            </div>

            <div>

              <FaCheckCircle />

              Climate Action

            </div>

            <div>

              <FaCheckCircle />

              Blue Economy

            </div>

          </div>

          <a href="/membership">

            Become a Member

          </a>

        </div>

      </div>

    </section>

  );

}

export default WhoWeAre;
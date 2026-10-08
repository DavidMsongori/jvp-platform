import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Users,
} from "lucide-react";

import "./WhoWeAre.css";

import about1 from "../../assets/about/about1.jpg";
import about2 from "../../assets/about/about2.jpg";
import about3 from "../../assets/about/about3.jpg";
import about4 from "../../assets/about/about4.jpg";

const focusAreas = [
  "Youth Leadership",
  "Entrepreneurship",
  "Climate Action",
  "Blue Economy",
];

function WhoWeAre() {
  return (
    <section className="who-we-are">
      <div className="who-container">

        {/* Visual */}
        <div className="who-images">
          <div className="who-image who-image--main">
            <img
              src={about1}
              alt="Coastal youth participating in a JVP activity"
            />
          </div>

          <div className="who-image who-image--top">
            <img
              src={about2}
              alt="Young people engaged in a community activity"
            />
          </div>

          <div className="who-image who-image--bottom">
            <img
              src={about3}
              alt="JVP youth leadership activity"
            />
          </div>

          <div className="who-image who-image--small">
            <img
              src={about4}
              alt="Coastal youth working together"
            />
          </div>

          <div className="who-badge">
            <Users size={14} />
            <div>
              <strong>Youth-led</strong>
              <span>Regional movement</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="who-content">

          <span className="who-eyebrow">
            WHO WE ARE
          </span>

          <h2>
            One movement.
            <span> Six counties.</span>
            <br />
            A shared future.
          </h2>

          <p className="who-lead">
            Jumuiya ya Vijana wa Pwani (JVP) is a
            regional youth movement connecting young
            people across Kenya's Coast Region.
          </p>

          <p className="who-description">
            We create opportunities for young people
            to lead, innovate, build livelihoods and
            contribute to the development of their
            communities.
          </p>

          <div className="who-location">
            <MapPin size={14} />
            <span>
              Mombasa · Kilifi · Kwale · Lamu · Tana River · Taita Taveta
            </span>
          </div>

          <div className="who-list">
            {focusAreas.map((item) => (
              <div
                className="who-list__item"
                key={item}
              >
                <CheckCircle2 size={15} />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Link
            to="/register"
            className="who-button"
          >
            Join the Movement
            <ArrowRight size={15} />
          </Link>

        </div>
      </div>
    </section>
  );
}

export default WhoWeAre;
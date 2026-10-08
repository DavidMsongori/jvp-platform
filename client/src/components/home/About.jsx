import { Link } from "react-router-dom";
import {
  ArrowRight,
  Leaf,
  Users,
  Lightbulb,
  Waves,
} from "lucide-react";

import "./About.css";

import about1 from "../../assets/about/about1.jpg";
import about2 from "../../assets/about/about2.jpg";
import about3 from "../../assets/about/about3.jpg";
import about4 from "../../assets/about/about4.jpg";

const focusAreas = [
  {
    icon: Users,
    title: "Youth Leadership",
    description: "Building confident and responsible young leaders.",
  },
  {
    icon: Leaf,
    title: "Climate Action",
    description: "Supporting youth-led environmental action.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Creating pathways for ideas and enterprise.",
  },
  {
    icon: Waves,
    title: "Blue Economy",
    description: "Unlocking opportunities along our coast.",
  },
];

function About() {
  return (
    <section className="home-about" id="about">

      <div className="home-about__container">

        {/* =========================
            IMAGE COLLAGE
        ========================= */}

        <div className="home-about__visual">

          <div className="home-about__image home-about__image--main">
            <img
              src={about1}
              alt="Young people participating in a JVP activity"
            />
          </div>

          <div className="home-about__image home-about__image--top">
            <img
              src={about2}
              alt="JVP youth engagement activity"
            />
          </div>

          <div className="home-about__image home-about__image--bottom">
            <img
              src={about3}
              alt="Young people working together"
            />
          </div>

          <div className="home-about__image home-about__image--small">
            <img
              src={about4}
              alt="Coastal youth community activity"
            />
          </div>

          <div className="home-about__badge">
            <strong>6</strong>
            <span>Coast<br />Counties</span>
          </div>

        </div>

        {/* =========================
            CONTENT
        ========================= */}

        <div className="home-about__content">

          <span className="home-about__eyebrow">
            WHO WE ARE
          </span>

          <h2>
            A collective voice for the
            <span> young people of the Coast.</span>
          </h2>

          <p className="home-about__lead">
            Jumuiya ya Vijana wa Pwani (JVP) is a regional
            youth movement bringing together young people
            across Mombasa, Kilifi, Kwale, Lamu, Tana River
            and Taita Taveta.
          </p>

          <p className="home-about__description">
            We create spaces for young people to lead,
            connect, innovate and contribute to the
            development of their communities. Through
            advocacy, leadership, entrepreneurship,
            environmental action and opportunity creation,
            JVP works to turn youth potential into
            meaningful impact.
          </p>

          {/* =========================
              FOCUS AREAS
          ========================= */}

          <div className="home-about__focus">

            {focusAreas.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="home-about__focus-item"
                  key={item.title}
                >
                  <div className="home-about__focus-icon">
                    <Icon size={16} />
                  </div>

                  <div>
                    <h3>{item.title}</h3>

                    <p>
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}

          </div>

          {/* =========================
              ACTION
          ========================= */}

          <Link
            to="/about"
            className="home-about__button"
          >
            Discover JVP
            <ArrowRight size={16} />
          </Link>

        </div>

      </div>

    </section>
  );
}

export default About;
import { useEffect, useState } from "react";
import "./Hero.css";

import hero1 from "../../assets/hero/hero1.jpg";
import hero2 from "../../assets/hero/hero2.jpg";
import hero3 from "../../assets/hero/hero3.jpg";
import hero4 from "../../assets/hero/hero4.jpg";
import hero5 from "../../assets/hero/hero5.jpg";
import hero6 from "../../assets/hero/hero6.jpg";

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaWhatsapp,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";

const slides = [
  hero1,
  hero2,
  hero3,
  hero4,
  hero5,
  hero6,
];

function Hero() {

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {

    const slider = setInterval(() => {

      setCurrentSlide((prev) => (prev + 1) % slides.length);

    }, 5000);

    return () => clearInterval(slider);

  }, []);

  return (

    <section className="hero">

      {/* ===========================
          BACKGROUND SLIDES
      =========================== */}

      {slides.map((image, index) => (

        <div
          key={index}
          className={`hero-slide ${
            index === currentSlide ? "active" : ""
          }`}
          style={{
            backgroundImage: `url(${image})`,
          }}
        />

      ))}

      {/* ===========================
          OVERLAY
      =========================== */}

      <div className="hero-overlay"></div>

      {/* ===========================
          CONTAINER
      =========================== */}

      <div className="hero-container">

        {/* ===========================
            LEFT SIDE
        =========================== */}

        <div className="hero-left">

          <span className="hero-tag">
            Welcome to JVP Connect
          </span>

          <h1>

            Empowering

            <br />

            Coastal Youth.

            <br />

            <span>
              Transforming Communities.
            </span>

          </h1>

          <p>

            Jumuiya ya Vijana wa Pwani (JVP)
            brings together young people from
            the six coastal counties to promote
            leadership, entrepreneurship,
            climate action, innovation,
            community development and the
            Blue Economy.

          </p>

          <div className="hero-buttons">

            <a
              href="/register"
              className="primary-btn"
            >
              Become a Member
            </a>

            <a
              href="/about"
              className="secondary-btn"
            >
              Learn More
            </a>

          </div>

        </div>

        {/* ===========================
            RIGHT SIDE
        =========================== */}

        <div className="hero-right">

          <div className="hero-social">

            <span>
              FOLLOW US
            </span>

            <a href="#">
              <FaFacebookF />
            </a>

            <a href="#">
              <FaInstagram />
            </a>

            <a href="#">
              <FaXTwitter />
            </a>

            <a href="#">
              <FaLinkedinIn />
            </a>

            <a href="#">
              <FaYoutube />
            </a>

            <a href="#">
              <FaWhatsapp />
            </a>

          </div>

        </div>

      </div>

    </section>

  );

}

export default Hero;
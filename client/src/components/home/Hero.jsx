import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Users,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";

import "./Hero.css";

import hero1 from "../../assets/hero/hero3.jpg";
import hero2 from "../../assets/images/coastal-hero.jpg";
import hero3 from "../../assets/hero/hero6.jpg";

const slides = [
  {
    image: hero1,
    label: "Youth Leadership",
  },
  {
    image: hero2,
    label: "Coastal Communities",
  },
  {
    image: hero3,
    label: "Youth in Action",
  },
];

const socialLinks = [
  {
    label: "Facebook",
    icon: <FaFacebookF />,
    href: "https://www.facebook.com/profile.php?id=61582648195839&sk",
  },
  {
    label: "Instagram",
    icon: <FaInstagram />,
    href: "https://www.instagram.com/jumuiya_ya_vijana_wa_pwani?igsh=MTB5enkzcnJuYXZObw==/",
  },
  {
    label: "X",
    icon: <FaXTwitter />,
    href: "https://x.com/vijanapwani001",
  },
  {
    label: "LinkedIn",
    icon: <FaLinkedinIn />,
    href: "#",
  },
  {
    label: "YouTube",
    icon: <FaYoutube />,
    href: "#",
  },
  {
    label: "WhatsApp",
    icon: <FaWhatsapp />,
    href: "https://wa.me/254740504969",
  },
];

function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const slider = setInterval(() => {
      setCurrentSlide(
        (previous) =>
          (previous + 1) % slides.length
      );
    }, 6000);

    return () => clearInterval(slider);
  }, []);

  return (
    <section className="home-hero">

      {/* Background slides */}
      <div className="home-hero__background">
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`home-hero__slide ${
              index === currentSlide
                ? "is-active"
                : ""
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
            }}
          />
        ))}
      </div>

      {/* Layered overlays */}
      <div className="home-hero__overlay" />
      <div className="home-hero__gradient" />

      <div className="home-hero__container">

        {/* Main content */}
        <div className="home-hero__content">

      

          <div className="home-hero__tag">
            <Users size={13} />
            <span>
              A collective voice for coastal youth
            </span>
          </div>

          <h1>
            Empowering
            <br />
            <span>Coastal Youth.</span>
          </h1>

          <p className="home-hero__lead">
            Building a generation of young leaders,
            entrepreneurs, innovators and changemakers
            shaping a stronger future for the Coast.
          </p>

          <div className="home-hero__actions">

            <Link
              to="/register"
              className="home-hero__primary"
            >
              Join JVP
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/about"
              className="home-hero__secondary"
            >
              Discover JVP
              <ChevronRight size={15} />
            </Link>

          </div>

        </div>

        {/* Right social rail */}
        <aside className="home-hero__social">

          <span className="home-hero__social-label">
            FOLLOW JVP
          </span>

          <div className="home-hero__social-line" />

          <div className="home-hero__social-links">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={
                  social.href.startsWith("http")
                    ? "_blank"
                    : undefined
                }
                rel={
                  social.href.startsWith("http")
                    ? "noreferrer"
                    : undefined
                }
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>

        </aside>

        {/* Bottom slide information */}
        <div className="home-hero__bottom">

          <div className="home-hero__slide-info">
            <span>
              0{currentSlide + 1}
            </span>

            <div className="home-hero__progress">
              <div
                style={{
                  width: `${
                    ((currentSlide + 1) /
                      slides.length) *
                    100
                  }%`,
                }}
              />
            </div>

            <span>
              0{slides.length}
            </span>
          </div>

          <div className="home-hero__slide-label">
            {slides[currentSlide].label}
          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;
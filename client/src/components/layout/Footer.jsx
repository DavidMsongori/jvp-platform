import { Link } from "react-router-dom";
import "./Footer.css";

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaXTwitter,
  FaEnvelope,
  FaPhone,
  FaLocationDot,
} from "react-icons/fa6";

import logo from "../../assets/images/jvp-logo.png";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Brand */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img src={logo} alt="Jumuiya ya Vijana wa Pwani Logo" />

            <div>
              <strong>JVP Connect</strong>
              <span>Jumuiya ya Vijana wa Pwani</span>
            </div>
          </Link>

          <p className="footer-description">
            A collective voice for coastal youth, advancing leadership,
            opportunity, innovation and sustainable development across
            Kenya's Coast Region.
          </p>

          <div className="footer-socials">
            <a
              href="https://www.facebook.com/profile.php?id=61582648195839"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://www.instagram.com/jumuiya_ya_vijana_wa_pwani"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>

            <a
              href="https://x.com/vijanapwani001"
              target="_blank"
              rel="noreferrer"
              aria-label="X"
            >
              <FaXTwitter />
            </a>

            <a
              href="#"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn />
            </a>

            <a
              href="#"
              aria-label="YouTube"
            >
              <FaYoutube />
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div className="footer-column">
          <h4>Explore</h4>

          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>

            <li>
              <Link to="/about">About JVP</Link>
            </li>

            <li>
              <Link to="/events">Events</Link>
            </li>

            <li>
              <Link to="/elections">Elections</Link>
            </li>

            <li>
              <Link to="/leadership">Leadership</Link>
            </li>

            <li>
              <Link to="/news">News</Link>
            </li>
          </ul>
        </div>

        {/* Focus Areas */}
        <div className="footer-column">
          <h4>Our Focus</h4>

          <ul>
            <li>Youth Leadership</li>
            <li>Education & Skills</li>
            <li>Entrepreneurship</li>
            <li>Blue Economy</li>
            <li>Climate Action</li>
            <li>Innovation & Technology</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-column footer-contact">
          <h4>Get In Touch</h4>

          <ul>
            <li>
              <span className="footer-contact-icon">
                <FaLocationDot />
              </span>

              <span>Mombasa, Kenya</span>
            </li>

            <li>
              <span className="footer-contact-icon">
                <FaPhone />
              </span>

              <a href="tel:+254740504969">
                +254 740 504 969
              </a>
            </li>

            <li>
              <span className="footer-contact-icon">
                <FaEnvelope />
              </span>

              <a href="mailto:info@jumuiyapwani.org">
                info@jumuiyapwani.org
              </a>
            </li>
          </ul>

          <Link to="/register" className="footer-join">
            Join JVP
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>
            © {currentYear} Jumuiya ya Vijana wa Pwani (JVP).
            All Rights Reserved.
          </p>

          <div className="footer-bottom-links">
            <Link to="/contact">Contact</Link>
            <span>•</span>
            <span>Coast Region, Kenya</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
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
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* Column 1 */}

        <div className="footer-about">

          <img src={logo} alt="JVP Logo" />

          <h3>JVP Connect</h3>

          <p>
            Empowering young people across Kenya's Coast Region
            through leadership, innovation, entrepreneurship,
            climate action and sustainable development.
          </p>

          <div className="socials">

            <a href="#"><FaFacebookF /></a>

            <a href="#"><FaInstagram /></a>

            <a href="#"><FaXTwitter /></a>

            <a href="#"><FaLinkedinIn /></a>

            <a href="#"><FaYoutube /></a>

          </div>

        </div>

        {/* Column 2 */}

        <div>

          <h4>Quick Links</h4>

          <ul>

            <li><a href="/">Home</a></li>

            <li><a href="/about">About</a></li>

            <li><a href="/membership">Membership</a></li>

            <li><a href="/programs">Programs</a></li>

            <li><a href="/events">Events</a></li>

            <li><a href="/news">News</a></li>

          </ul>

        </div>

        {/* Column 3 */}

        <div>

          <h4>Our Programmes</h4>

          <ul>

            <li>Leadership Development</li>

            <li>Climate Action</li>

            <li>Blue Economy</li>

            <li>Entrepreneurship</li>

            <li>Education & Skills</li>

            <li>Innovation Hub</li>

          </ul>

        </div>

        {/* Column 4 */}

        <div>

          <h4>Contact Us</h4>

          <ul className="contact-list">

            <li>
              <FaLocationDot />
              Mombasa, Kenya
            </li>

            <li>
              <FaPhone />
              +254 740 504 969
            </li>

            <li>
              <FaEnvelope />
              info@jumuiyapwani.org
            </li>

          </ul>

          <div className="newsletter">

            <input
              type="email"
              placeholder="Your email address"
            />

            <button>
              Subscribe
            </button>

          </div>

        </div>

      </div>

      <div className="footer-bottom">

        <p>
          © {new Date().getFullYear()} Jumuiya ya Vijana wa Pwani (JVP).
          All Rights Reserved.
        </p>

        <p>
          Designed & Developed by JVP Digital Innovation Team
        </p>

      </div>

    </footer>
  );
}

export default Footer;
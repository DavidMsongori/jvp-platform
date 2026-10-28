
import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import HeroAnniversary from '../components/HeroAnni'
import FacebookTimeline from "../components/social/FacebookTimeline";
import InstagramFeed from "../components/social/InstagramFeed";

import {
  registerJVPAtOne,
  getJVPAtOnePhotos,
} from "../services/jvpAtOneService";

import { Link } from "react-router-dom";

import "./JVPAtOne.css";

const EVENT_DATE = new Date("2026-12-22T00:00:00+03:00");

const wards = {
  "Lamu East": ["Faza", "Kiunga", "Basuba"],
  "Lamu West": [
    "Shela",
    "Mkomani",
    "Hindi",
    "Mkunumbi",
    "Hongwe",
    "Bahari",
    "Witu",
    "Mpeketoni",
  ],
};

function getCountdown() {
  const remaining = Math.max(0, EVENT_DATE.getTime() - Date.now());

  return {
    Days: Math.floor(remaining / 86400000),
    Hours: Math.floor((remaining % 86400000) / 3600000),
    Minutes: Math.floor((remaining % 3600000) / 60000),
    Seconds: Math.floor((remaining % 60000) / 1000),
  };
}

export default function JVPAtOne() {
  const [countdown, setCountdown] = useState(getCountdown);
  const [constituency, setConstituency] = useState("");
  const [ward, setWard] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [photos, setPhotos] = useState([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [galleryError, setGalleryError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() {
      try {
        setIsLoadingPhotos(true);
        setGalleryError("");

        const data = await getJVPAtOnePhotos();

        if (!cancelled) {
          setPhotos(data.photos || []);
        }
      } catch (error) {
        if (!cancelled) {
          setGalleryError(
            error.message || "Unable to load gallery photos."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPhotos(false);
        }
      }
    }

    loadPhotos();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRegistration(event) {
    event.preventDefault();

    if (isRegistering) return;

    setFormMessage("");
    setRegistrationSuccess(false);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const registration = {
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      constituency,
      ward,
    };

    try {
      setIsRegistering(true);

      const result = await registerJVPAtOne(registration);

      setRegistrationSuccess(true);
      setFormMessage(
        result.message || "Registration completed successfully!"
      );

      form.reset();
      setConstituency("");
      setWard("");
    } catch (error) {
      setRegistrationSuccess(false);
      setFormMessage(
        error.message || "Registration failed. Please try again."
      );
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="jvp-anniversary">


        {/* COUNTDOWN */}
        <section
          className="jvp-section jvp-countdown-section"
          id="countdown"
        >
          <div className="jvp-section-heading">
            <span className="jvp-kicker">The countdown is on</span>
            <h2>Countdown to JVP @ 1</h2>
            <p>
              Join us in Lamu County on 22 December 2026 as we celebrate
              one year of purpose and a future of possibilities.
            </p>
          </div>

          <div className="jvp-countdown">
            {Object.entries(countdown).map(([label, value]) => (
              <div className="jvp-countdown-item" key={label}>
                <strong>{String(value).padStart(2, "0")}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

       
        {/* LIVE GALLERY */}
        <section className="jvp-section" id="gallery">
          <div className="jvp-section-heading">
            <span className="jvp-kicker">Moments worth remembering</span>
            <h2>Our Year in Pictures</h2>
            <p>
              A glimpse of the people and moments behind the JVP story.
            </p>
          </div>

          {isLoadingPhotos ? (
            <p className="jvp-note" role="status">
              Loading anniversary photos...
            </p>
          ) : galleryError ? (
            <div className="jvp-gallery-placeholder">
              <p className="jvp-note" role="status">
                {galleryError}
              </p>
            </div>
          ) : photos.length === 0 ? (
            <div className="jvp-gallery-placeholder">
              <div>
                <span>01</span>
                <strong>Youth leadership</strong>
              </div>
              <div>
                <span>02</span>
                <strong>Community initiatives</strong>
              </div>
              <div>
                <span>03</span>
                <strong>Our coastal journey</strong>
              </div>
              <div>
                <span>04</span>
                <strong>Unity in action</strong>
              </div>
              <div>
                <span>05</span>
                <strong>Moments together</strong>
              </div>
            </div>
          ) : (
            <div className="jvp-gallery-placeholder jvp-gallery-live">
              {photos.slice(0, 5).map((photo) => (
                <article className="jvp-gallery-photo" key={photo._id}>
                  <img
                    src={photo.secureUrl}
                    alt={photo.title || "JVP anniversary moment"}
                    loading="lazy"
                  />

                  <div className="jvp-gallery-photo-caption">
                    <strong>{photo.title || "JVP @ 1"}</strong>
                    {photo.caption && <p>{photo.caption}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}

          <p className="jvp-note">
            {photos.length > 0
              ? `${photos.length} photo${photos.length === 1 ? "" : "s"} in the JVP @ 1 gallery.`
              : "Anniversary photos will appear here once they have been uploaded by an authorized administrator."}
          </p>

          <div className="jvp-gallery-actions">
            <Link
              to="/jvp-at-one/gallery"
              className="jvp-button jvp-button-gold"
            >
              View Full Gallery
            </Link>
          </div>
        </section>


        {/* ANNIVERSARY EVENT AND REGISTRATION */}
        <section
          className="jvp-section jvp-celebration"
          id="celebration"
        >
          <div className="jvp-celebration-copy">
            <span className="jvp-eyebrow">THE JOURNEY CONTINUES</span>
            <h2>Celebrate JVP @ 1</h2>
            <p>
              Join us in Lamu County as we celebrate our first year and look
              ahead to a future of greater impact.
            </p>

            <div className="jvp-event-detail">
              <span>📅</span>
              <div>
                <strong>Tuesday, 22 December 2026</strong>
                <small>First Anniversary Celebration</small>
              </div>
            </div>

            <div className="jvp-event-detail">
              <span>📍</span>
              <div>
                <strong>Lamu County, Kenya</strong>
                <small>Venue to be announced</small>
              </div>
            </div>
          </div>

          
<div className="jvp-registration-invitation">
  <h3>Do you come from Lamu County?</h3>

  <p>
    Join us during our celebrations as we mark one year
    of youth leadership, unity and impact across the Coast.
  </p>

  <a
    className="jvp-button jvp-button-gold"
    href="/jvp-at-one/register"
  >
    Register for JVP @ 1
  </a>
</div>

        </section>
      </main>

      <Footer />
    </>
  );
}

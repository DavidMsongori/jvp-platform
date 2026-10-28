
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getJVPAtOnePhotos } from "../services/jvpAtOneService";
import "./JVPAtOneGallery.css";

export default function JVPAtOneGallery() {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [galleryError, setGalleryError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() {
      try {
        setIsLoading(true);
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
          setIsLoading(false);
        }
      }
    }

    loadPhotos();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Navbar />

      <main className="jvp-full-gallery">
        <section className="jvp-full-gallery-hero">
          <span className="jvp-kicker">JVP @ 1 Anniversary</span>
          <h1>Our Year in Pictures</h1>
          <p>
            Relive the people, leadership, community initiatives and
            unforgettable moments that tell the story of Jumuiya ya
            Vijana wa Pwani.
          </p>

          <Link to="/jvp-at-one#gallery" className="jvp-gallery-back">
            ← Back to JVP @ 1
          </Link>
        </section>

        <section className="jvp-full-gallery-content">
          <div className="jvp-full-gallery-heading">
            <div>
              <span className="jvp-kicker">Moments worth remembering</span>
              <h2>Gallery Collection</h2>
            </div>

            {!isLoading && !galleryError && (
              <span className="jvp-full-gallery-count">
                {photos.length} {photos.length === 1 ? "photo" : "photos"}
              </span>
            )}
          </div>

          {isLoading ? (
            <p className="jvp-full-gallery-message" role="status">
              Loading gallery photos...
            </p>
          ) : galleryError ? (
            <div className="jvp-full-gallery-empty">
              <p role="alert">{galleryError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : photos.length === 0 ? (
            <div className="jvp-full-gallery-empty">
              <h3>No photos yet</h3>
              <p>
                Anniversary photos will appear here once an authorized
                administrator uploads them.
              </p>
            </div>
          ) : (
            <div className="jvp-full-gallery-grid">
              {photos.map((photo, index) => (
                <article
                  className="jvp-full-gallery-card"
                  key={photo._id || photo.secureUrl || index}
                >
                  <div className="jvp-full-gallery-image">
                    <img
                      src={photo.secureUrl}
                      alt={photo.title || "JVP anniversary moment"}
                      loading="lazy"
                    />
                  </div>

                  <div className="jvp-full-gallery-caption">
                    <h3>{photo.title || "JVP @ 1"}</h3>
                    {photo.caption && <p>{photo.caption}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

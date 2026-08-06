import {
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Search,
  ShieldCheck,
} from "lucide-react";

import "./PosterGeneratorCTA.css";

export default function PosterGeneratorCTA() {
  return (
    <section className="summit-poster-cta">
      <div className="summit-poster-cta-container">
        <div className="summit-poster-cta-content">
          <span className="summit-poster-cta-eyebrow">
            Coast Youth Summit 2026
          </span>

          <h2>
            Create your “I Will Be Attending”
            poster
          </h2>

          <p>
            Upload your photo, pay KES 50 through
            the official Till Number, and receive
            a personalized summit poster ready for
            sharing.
          </p>

          <div className="summit-poster-cta-benefits">
            <span>
              <CheckCircle2
                size={17}
                aria-hidden="true"
              />

              Personalized with your name
            </span>

            <span>
              <CheckCircle2
                size={17}
                aria-hidden="true"
              />

              High-quality final download
            </span>

            <span>
              <ShieldCheck
                size={17}
                aria-hidden="true"
              />

              Released after payment confirmation
            </span>
          </div>

          <div className="summit-poster-cta-actions">
            <a
              href="/summit/poster"
              className="summit-poster-cta-primary"
            >
              <ImagePlus
                size={19}
                aria-hidden="true"
              />

              Create my poster

              <ArrowRight
                size={18}
                aria-hidden="true"
              />
            </a>

            <a
              href="/summit/poster/status"
              className="summit-poster-cta-secondary"
            >
              <Search
                size={18}
                aria-hidden="true"
              />

              Check poster status
            </a>
          </div>
        </div>

        <div className="summit-poster-cta-visual">
          <div className="summit-poster-cta-poster">
            <div className="summit-poster-cta-poster-header">
              <small>
                Coast Youth Summit
              </small>

              <strong>
                2026
              </strong>
            </div>

            <div className="summit-poster-cta-photo">
              <ImagePlus
                size={54}
                aria-hidden="true"
              />
            </div>

            <div className="summit-poster-cta-banner">
              I WILL BE ATTENDING
            </div>

            <div className="summit-poster-cta-name">
              YOUR NAME
            </div>

            <div className="summit-poster-cta-county">
              YOUR COUNTY
            </div>

            <div className="summit-poster-cta-date">
              28 AUGUST 2026
            </div>
          </div>

          <div className="summit-poster-cta-price">
            <small>
              Poster fee
            </small>

            <strong>
              KES 50
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
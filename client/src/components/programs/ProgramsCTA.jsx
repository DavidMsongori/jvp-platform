
import { ArrowRight, ArrowUpRight, HeartHandshake, Users } from "lucide-react";
import { Link } from "react-router-dom";
import "./ProgramsCTA.css";

function ProgramsCTA() {
  return (
    <section className="programs-cta" aria-labelledby="programs-cta-title">
      <div className="programs-cta__container">
        <div className="programs-cta__card">
          <div className="programs-cta__content">
            <span className="programs-cta__eyebrow">
              YOUR FUTURE. YOUR COMMUNITY. YOUR IMPACT.
            </span>

            <h2 id="programs-cta-title">
              The next success story could <span>start with you.</span>
            </h2>

            <p>
              Join a growing community of coastal young people turning ideas
              into action, building opportunities, and creating lasting change
              in our communities.
            </p>

            <div className="programs-cta__actions">
              <Link to="/register" className="programs-cta__primary">
                Become a JVP Member
                <ArrowRight size={18} />
              </Link>

              <a
                href="#programmes-list"
                className="programs-cta__secondary"
              >
                Explore programmes
                <ArrowUpRight size={17} />
              </a>
            </div>

            <div className="programs-cta__trust">
              <span className="programs-cta__trust-icon">
                <Users size={17} />
              </span>

              <span>
                <strong>Youth-led.</strong> Community-focused. Impact-driven.
              </span>
            </div>
          </div>

          <div className="programs-cta__visual" aria-hidden="true">
            <div className="programs-cta__visual-orbit programs-cta__visual-orbit--outer" />
            <div className="programs-cta__visual-orbit programs-cta__visual-orbit--inner" />

            <div className="programs-cta__visual-center">
              <HeartHandshake size={48} strokeWidth={1.5} />
              <span>TOGETHER</span>
              <strong>We Make<br />Impact.</strong>
            </div>

            <div className="programs-cta__floating programs-cta__floating--top">
              <span className="programs-cta__floating-icon">
                <Users size={16} />
              </span>
              <span>
                <strong>One community</strong>
                <small>Stronger together</small>
              </span>
            </div>

            <div className="programs-cta__floating programs-cta__floating--bottom">
              <span className="programs-cta__floating-dot" />
              <span>
                <strong>Ideas into action</strong>
                <small>Impact that matters</small>
              </span>
            </div>

            <span className="programs-cta__decor programs-cta__decor--one" />
            <span className="programs-cta__decor programs-cta__decor--two" />
            <span className="programs-cta__decor programs-cta__decor--three" />
          </div>
        </div>

        <div className="programs-cta__footer">
          <span>JUMUIYA YA VIJANA WA PWANI</span>
          <span className="programs-cta__footer-divider" />
          <span>Empowering coastal youth through action</span>
        </div>
      </div>
    </section>
  );
}

export default ProgramsCTA;
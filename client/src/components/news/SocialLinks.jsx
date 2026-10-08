import { ExternalLink } from "lucide-react";

import "./SocialLinks.css";

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    shortName: "f",
    href: "https://www.facebook.com/",
    label: "Follow us on Facebook",
    className: "facebook",
  },
  {
    name: "X",
    shortName: "𝕏",
    href: "https://x.com/",
    label: "Follow us on X",
    className: "x",
  },
  {
    name: "Instagram",
    shortName: "◎",
    href: "https://www.instagram.com/",
    label: "Follow us on Instagram",
    className: "instagram",
  },
  {
    name: "LinkedIn",
    shortName: "in",
    href: "https://www.linkedin.com/",
    label: "Connect with us on LinkedIn",
    className: "linkedin",
  },
  {
    name: "YouTube",
    shortName: "▶",
    href: "https://www.youtube.com/",
    label: "Subscribe on YouTube",
    className: "youtube",
  },
];

const SocialLinks = () => {
  return (
    <section className="news-social">
      <div className="news-social__inner">
        {/* ==================================================
            CONTENT
        ================================================== */}

        <div className="news-social__content">
          <span className="news-social__eyebrow">
            Stay Connected
          </span>

          <h2>
            Follow JVP
          </h2>

          <p>
            Stay informed with the latest JVP news,
            programmes, opportunities, events and
            stories from across the Coast.
          </p>
        </div>

        {/* ==================================================
            SOCIAL LINKS
        ================================================== */}

        <div className="news-social__links">
          {SOCIAL_LINKS.map(
            ({
              name,
              shortName,
              href,
              label,
              className,
            }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`news-social__link ${className}`}
                aria-label={label}
              >
                <span className="news-social__icon">
                  {shortName}
                </span>

                <span className="news-social__name">
                  {name}
                </span>

                <ExternalLink
                  size={14}
                  strokeWidth={2}
                  className="news-social__external"
                />
              </a>
            )
          )}
        </div>
      </div>
    </section>
  );
};

export default SocialLinks;
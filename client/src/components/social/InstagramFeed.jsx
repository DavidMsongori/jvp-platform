import { useEffect, useRef } from "react";
import "./SocialFeeds.css";

const INSTAGRAM_REEL_URL =
  "https://www.instagram.com/reel/DbxcfrdtRSq/";

export default function InstagramFeed() {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const processEmbeds = () => {
      if (!cancelled && window.instgrm?.Embeds) {
        window.instgrm.Embeds.process();
      }
    };

    if (window.instgrm?.Embeds) {
      processEmbeds();
    } else {
      let script = document.querySelector(
        'script[src="https://www.instagram.com/embed.js"]'
      );

      if (!script) {
        script = document.createElement("script");
        script.src = "https://www.instagram.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
      }

      script.addEventListener("load", processEmbeds);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="jvp-instagram-feed" ref={containerRef}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={INSTAGRAM_REEL_URL}
        data-instgrm-version="14"
      >
        <a
          href={INSTAGRAM_REEL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          View the JVP Reel on Instagram
        </a>
      </blockquote>

      <a
        className="jvp-feed-link"
        href="https://www.instagram.com/jumuiya_ya_vijana_wa_pwani/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Visit the official Instagram profile ↗
      </a>
    </div>
  );
}
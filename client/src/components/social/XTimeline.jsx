
import { useEffect, useRef } from "react";

const X_WIDGETS_URL = "https://platform.twitter.com/widgets.js";

export default function XTimeline() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    let cancelled = false;

    container.innerHTML = "";

    const timeline = document.createElement("a");
    timeline.className = "twitter-timeline";
    timeline.href = "https://x.com/vijanapwani001";
    timeline.textContent = "View the latest JVP posts on X";

    timeline.setAttribute("data-theme", "light");
    timeline.setAttribute("data-height", "500");
    timeline.setAttribute("data-chrome", "noheader nofooter noborders");
    timeline.setAttribute("data-dnt", "true");

    container.appendChild(timeline);

    function renderTimeline() {
      if (cancelled || !containerRef.current) return;

      if (window.twttr?.widgets?.load) {
        window.twttr.widgets.load(container);
      }
    }

    function loadXWidgets() {
      if (window.twttr?.widgets?.load) {
        renderTimeline();
        return;
      }

      let script = document.querySelector(
        `script[src="${X_WIDGETS_URL}"]`
      );

      if (!script) {
        script = document.createElement("script");
        script.src = X_WIDGETS_URL;
        script.async = true;
        script.charset = "utf-8";
        document.body.appendChild(script);
      }

      script.addEventListener("load", renderTimeline);
      script.addEventListener("error", handleLoadError);

      // Handle a script that has already loaded or failed.
      if (window.twttr?.widgets?.load) {
        renderTimeline();
      }
    }

    function handleLoadError() {
      if (!cancelled && containerRef.current) {
        container.innerHTML =
          '<p class="x-timeline-error">The X timeline could not load. Please visit <a href="https://x.com/vijanapwani001" target="_blank" rel="noopener noreferrer">JVP on X</a>.</p>';
      }
    }

    loadXWidgets();

    return () => {
      cancelled = true;

      const script = document.querySelector(
        `script[src="${X_WIDGETS_URL}"]`
      );

      script?.removeEventListener("load", renderTimeline);
      script?.removeEventListener("error", handleLoadError);
    };
  }, []);


return (
  <div className="x-timeline-section">
    <div
      ref={containerRef}
      className="x-timeline-embed"
      aria-label="Latest posts from JVP on X"
    />

    <p className="x-timeline-fallback">
      Having trouble viewing the timeline?{" "}
      <a
        href="https://x.com/vijanapwani001"
        target="_blank"
        rel="noopener noreferrer"
      >
        View the latest JVP posts on X ↗
      </a>
    </p>
  </div>
);

}

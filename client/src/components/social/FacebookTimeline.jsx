import "./SocialFeeds.css";

const FACEBOOK_PAGE_URL =
  "https://www.facebook.com/profile.php?id=61582648195839";

export default function FacebookTimeline() {
  const pluginUrl =
    "https://www.facebook.com/plugins/page.php" +
    `?href=${encodeURIComponent(FACEBOOK_PAGE_URL)}` +
    "&tabs=timeline" +
    "&width=500" +
    "&height=600" +
    "&small_header=true" +
    "&adapt_container_width=true" +
    "&hide_cover=false" +
    "&show_facepile=false";

  return (
    <div className="jvp-embed-frame">
      <iframe
        title="Latest JVP Facebook posts"
        src={pluginUrl}
        width="500"
        height="600"
        style={{ border: "none", overflow: "hidden" }}
        scrolling="no"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        loading="lazy"
      />

      <a
        className="jvp-feed-link"
        href="https://www.facebook.com/share/1CBB2xVX3G"
        target="_blank"
        rel="noopener noreferrer"
      >
        View JVP on Facebook ↗
      </a>
    </div>
  );
}
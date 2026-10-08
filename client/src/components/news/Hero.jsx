import { ArrowDown, Newspaper } from "lucide-react";

import "./Hero.css";

import heroImage from "../../assets/images/coastal-hero.jpg";

function Hero() {
  const scrollToLatestNews = () => {
    const section = document.getElementById("latest-news");

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section
      className="news-hero"
      style={{
        backgroundImage: `url(${heroImage})`,
      }}
    >
      <div className="news-hero__overlay" />
      <div className="news-hero__gradient" />

      <div className="news-hero__container">

        {/* Main Content */}

        <div className="news-hero__content">

          <div className="news-hero__eyebrow">
            <Newspaper size={13} />
            <span>JVP NEWSROOM</span>
          </div>

          <h1>
            News &amp;
            <span> Stories.</span>
          </h1>

          <p>
            Stay informed about JVP programmes, leadership,
            opportunities, announcements and stories from
            young people across the Coast Region.
          </p>

          <button
            type="button"
            className="news-hero__action"
            onClick={scrollToLatestNews}
          >
            <span>Explore Latest News</span>
            <ArrowDown size={15} />
          </button>

        </div>

        {/* Side Marker */}

        <div className="news-hero__side">
          <span>NEWSROOM</span>
          <strong>01</strong>
        </div>

        {/* Bottom Information */}

        <div className="news-hero__bottom">

          <div className="news-hero__location">
            <span className="news-hero__dot" />
            <span>
              Voices, stories &amp; updates from the Coast
            </span>
          </div>

          <div className="news-hero__counties">
            Mombasa · Kilifi · Kwale · Lamu · Tana River · Taita Taveta
          </div>

        </div>

      </div>
    </section>
  );
}

export default Hero;
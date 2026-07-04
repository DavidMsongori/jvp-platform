import "./News.css";

const news = [
  {
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    title: "JVP Launches Youth Leadership Programme",
    date: "July 2026",
    description:
      "A new leadership programme designed to equip coastal youth with governance, advocacy and community leadership skills.",
  },
  {
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
    title: "Climate Action Campaign Expands",
    date: "June 2026",
    description:
      "Thousands of trees planted across the Coast Region as part of JVP's environmental restoration initiative.",
  },
  {
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
    title: "Registration Opens for Coastal Youth Summit",
    date: "May 2026",
    description:
      "Applications are now open for delegates, exhibitors and partners attending the Coastal Youth Summit 2026.",
  },
];

function News() {
  return (
    <section className="news" id="news">

      <div className="section-title">

        <span>LATEST NEWS</span>

        <h2>News & Updates</h2>

        <p>
          Stay informed with the latest stories, programmes,
          opportunities and announcements from JVP.
        </p>

      </div>

      <div className="news-container">

        {news.map((item, index) => (

          <div className="news-card" key={index}>

            <img src={item.image} alt={item.title} />

            <div className="news-content">

              <small>{item.date}</small>

              <h3>{item.title}</h3>

              <p>{item.description}</p>

              <button>Read More</button>

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}

export default News;
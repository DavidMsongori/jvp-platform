import { Link } from "react-router-dom";
import {
  Newspaper,
  CalendarDays,
  ArrowRight,
} from "lucide-react";

import "./News.css";

function News({ news = [] }) {

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(
      "en-KE",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );

  return (

    <section className="dashboard-news">

      <div className="widget-header">

        <div>

          <h2>Latest News</h2>

          <p>

            Stay updated with JVP news,
            opportunities and announcements.

          </p>

        </div>

        <Link
          to="/news"
          className="widget-link"
        >

          View All

          <ArrowRight size={18} />

        </Link>

      </div>

      {

        news.length === 0 ? (

          <div className="news-empty">

            <Newspaper size={56} />

            <h3>

              No News Available

            </h3>

            <p>

              Latest news and opportunities
              will appear here.

            </p>

          </div>

        ) : (

          <div className="news-list">

            {

              news.map((item) => (

                <Link

                  key={item._id}

                  to={`/news/${item.slug}`}

                  className="news-card"

                >

                  <div className="news-image">

                    {

                      item.image ? (

                        <img
                          src={item.image}
                          alt={item.title}
                        />

                      ) : (

                        <div className="news-placeholder">

                          <Newspaper size={36} />

                        </div>

                      )

                    }

                  </div>

                  <div className="news-content">

                    <span className="news-date">

                      <CalendarDays size={14} />

                      {formatDate(
                        item.createdAt
                      )}

                    </span>

                    <h3>

                      {item.title}

                    </h3>

                    <p>

                      {item.summary}

                    </p>

                  </div>

                </Link>

              ))

            }

          </div>

        )

      }

    </section>

  );

}

export default News;
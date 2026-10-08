import { Newspaper } from "lucide-react";

import "./NewsEmptyState.css";

function NewsEmptyState({
  title = "No news stories yet",
  message = "JVP news and stories will appear here once they are published.",
}) {
  return (
    <div className="news-empty-state" role="status">
      <div className="news-empty-state__icon">
        <Newspaper size={22} strokeWidth={1.7} />
      </div>

      <div className="news-empty-state__content">
        <h3 className="news-empty-state__title">
          {title}
        </h3>

        <p className="news-empty-state__message">
          {message}
        </p>
      </div>
    </div>
  );
}

export default NewsEmptyState;
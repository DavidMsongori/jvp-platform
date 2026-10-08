import {
  CalendarX,
  RotateCcw,
} from "lucide-react";

import "./EmptyState.css";

const EmptyState = ({
  title = "No Events Found",
  message = "We couldn't find any events matching your current search or filters. Try adjusting your filters or check back again soon.",
  buttonText = "Clear Filters",
  onAction,
}) => {
  return (
    <div className="jvp-events-empty">
      <div className="jvp-events-empty__icon">
        <CalendarX size={22} strokeWidth={1.7} />
      </div>

      <div className="jvp-events-empty__content">
        <span className="jvp-events-empty__eyebrow">
          EVENTS
        </span>

        <h2 className="jvp-events-empty__title">
          {title}
        </h2>

        <p className="jvp-events-empty__message">
          {message}
        </p>

        {onAction && (
          <button
            type="button"
            className="jvp-events-empty__button"
            onClick={onAction}
          >
            <RotateCcw size={13} />
            <span>{buttonText}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
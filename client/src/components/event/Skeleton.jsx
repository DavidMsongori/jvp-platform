import "./Skeleton.css";

const Skeleton = () => {
  return (
    <article className="jvp-event-skeleton">
      <div className="jvp-event-skeleton__image" />

      <div className="jvp-event-skeleton__body">
        {/* Category */}
        <div className="jvp-event-skeleton__badge" />

        {/* Title */}
        <div className="jvp-event-skeleton__title" />
        <div className="jvp-event-skeleton__title jvp-event-skeleton__title--short" />

        {/* Description */}
        <div className="jvp-event-skeleton__text" />
        <div className="jvp-event-skeleton__text" />
        <div className="jvp-event-skeleton__text jvp-event-skeleton__text--short" />

        {/* Meta */}
        <div className="jvp-event-skeleton__meta" />
        <div className="jvp-event-skeleton__meta" />
        <div className="jvp-event-skeleton__meta jvp-event-skeleton__meta--short" />

        {/* Footer */}
        <div className="jvp-event-skeleton__footer">
          <div className="jvp-event-skeleton__registration">
            <div className="jvp-event-skeleton__price" />
            <div className="jvp-event-skeleton__capacity" />
          </div>

          <div className="jvp-event-skeleton__status" />
        </div>

        {/* Button */}
        <div className="jvp-event-skeleton__button" />
      </div>
    </article>
  );
};

export default Skeleton;
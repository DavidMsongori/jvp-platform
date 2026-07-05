import "./Events.css";

const events = [
  {
    date: "12-08 Aug 2026",
    title: "Coastal Youth Summit 2026",
    location: "Kilifi County",
    description:
      "The flagship regional summit bringing together young leaders, innovators, entrepreneurs and development partners from across the Coast Region.",
  },
  {
    date: "15 Sept 2026",
    title: "Climate Action & Tree Planting",
    location: "Taita Taveta",
    description:
      "Youth-led environmental conservation initiative focusing on ecosystem restoration and climate resilience.",
  },
  {
    date: "22 Oct 2026",
    title: "Blue Economy Forum",
    location: "Mombasa",
    description:
      "A forum connecting youth with opportunities in fisheries, marine innovation and sustainable coastal enterprises.",
  },
];

function Events() {
  return (
    <section className="events" id="events">

      <div className="section-title">
        <span>UPCOMING EVENTS</span>

        <h2>Join Our Upcoming Activities</h2>

        <p>
          Discover opportunities to participate, network,
          learn and make a lasting impact across the Coast Region.
        </p>
      </div>

      <div className="events-container">

        {events.map((event, index) => (

          <div className="event-card" key={index}>

            <div className="event-date">
              {event.date}
            </div>

            <h3>{event.title}</h3>

            <h4>{event.location}</h4>

            <p>{event.description}</p>

            <button>
              Register
            </button>

          </div>

        ))}

      </div>

    </section>
  );
}

export default Events;
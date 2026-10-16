
import {
  ArrowRight,
  BookOpen,
  Handshake,
  Users,
} from "lucide-react";

import "./PresidentPage.css";

const callsToAction = [
  {
    icon: Users,
    title: "Engage with JVP",
    description:
      "Discover the leadership structure, meet our leaders, and learn how young people can participate in shaping the Coast region.",
    label: "Explore Leadership",
    href: "/leadership",
    variant: "primary",
  },
  {
    icon: Handshake,
    title: "Partner with the Presidency",
    description:
      "Explore opportunities for collaboration, youth-focused initiatives, and strategic partnerships that create meaningful impact.",
    label: "Explore Our Priorities",
    href: "#presidential-priorities",
    variant: "secondary",
  },
  {
    icon: BookOpen,
    title: "Stay Informed",
    description:
      "Follow presidential updates, official communications, and resources that explain the work and direction of the Presidency.",
    label: "View Resources",
    href: "#presidential-resources",
    variant: "secondary",
  },
];

function PresidentialCTA() {
  return (
    <section
      className="presidential-cta"
      id="presidential-cta"
      aria-labelledby="presidential-cta-title"
    >
      <div className="presidential-cta__container">
        <div className="presidential-cta__banner">
          <div
            className="presidential-cta__decoration presidential-cta__decoration--one"
            aria-hidden="true"
          />

          <div
            className="presidential-cta__decoration presidential-cta__decoration--two"
            aria-hidden="true"
          />

          <div className="presidential-cta__content">
            <span className="presidential-cta__eyebrow">
              The Presidency of JVP
            </span>

            <h2 id="presidential-cta-title">
              Building a Stronger Future for Coastal Youth
            </h2>

            <p className="presidential-cta__intro">
              Meaningful progress begins with young people working together.
              Join the conversation, explore our priorities, and help advance
              a more empowered, inclusive, and accountable youth community
              across the Coast region.
            </p>

            <div className="presidential-cta__actions">
              <a
                href="/leadership"
                className="presidential-cta__button presidential-cta__button--light"
              >
                Explore JVP Leadership
                <ArrowRight size={18} aria-hidden="true" />
              </a>

              <a
                href="#presidential-resources"
                className="presidential-cta__button presidential-cta__button--outline"
              >
                Presidential Resources
              </a>
            </div>
          </div>

          <div className="presidential-cta__side" aria-hidden="true">
            <div className="presidential-cta__symbol">
              <Users size={43} strokeWidth={1.5} />
            </div>

            <span className="presidential-cta__side-label">
              One Coast
            </span>

            <span className="presidential-cta__side-heading">
              One Youth Community
            </span>

            <span className="presidential-cta__side-line" />

            <span className="presidential-cta__side-caption">
              Leadership. Unity. Integrity. Empowerment. Service.
            </span>
          </div>
        </div>

        <div className="presidential-cta__cards">
          {callsToAction.map((item) => {
            const Icon = item.icon;

            return (
              <article
                className="presidential-cta__card"
                key={item.title}
              >
                <div className="presidential-cta__card-icon">
                  <Icon size={23} strokeWidth={1.8} aria-hidden="true" />
                </div>

                <h3>{item.title}</h3>

                <p>{item.description}</p>

                <a
                  href={item.href}
                  className="presidential-cta__card-link"
                >
                  {item.label}
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </article>
            );
          })}
        </div>

        <div className="presidential-cta__closing">
          <Handshake size={19} aria-hidden="true" />

          <p>
            <strong>Progress through collective action.</strong>{" "}
            The Presidency remains committed to advancing JVP's mission
            through collaboration, responsible leadership, and meaningful
            youth participation.
          </p>
        </div>
      </div>
    </section>
  );
}

export default PresidentialCTA;

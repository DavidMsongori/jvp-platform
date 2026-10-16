
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  GitBranch,
  Handshake,
  Landmark,
  Network,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import "./Coordination.css";

const coordinationPartners = [
  {
    number: "01",
    title: "Deputy President",
    label: "Executive coordination",
    description:
      "Works with the President to maintain executive continuity, coordinate agreed priorities and support the effective functioning of the Regional Executive.",
    icon: Users,
    responsibilities: [
      "Coordinate assigned executive responsibilities",
      "Support follow-up on agreed priorities",
      "Promote collaboration across regional offices",
    ],
  },
  {
    number: "02",
    title: "Regional Cabinet",
    label: "Policy and implementation",
    description:
      "The President provides strategic direction while Cabinet Secretaries lead their respective dockets and report on approved plans, activities and results.",
    icon: Landmark,
    responsibilities: [
      "Align departmental plans with regional priorities",
      "Address issues requiring cross-docket collaboration",
      "Review progress and implementation challenges",
    ],
  },
  {
    number: "03",
    title: "Secretariat",
    label: "Administration and follow-up",
    description:
      "The designated Secretariat supports executive communication, meeting coordination, records, action tracking and follow-up on official decisions.",
    icon: GitBranch,
    responsibilities: [
      "Coordinate meetings and official correspondence",
      "Maintain decision and action records",
      "Track follow-up items and deadlines",
    ],
  },
  {
    number: "04",
    title: "County Leadership",
    label: "Regional–county alignment",
    description:
      "The Presidency engages county leadership to align regional priorities with county-level needs while respecting each tier's assigned mandate.",
    icon: Building2,
    responsibilities: [
      "Facilitate consultation across the six coastal counties",
      "Identify shared priorities and opportunities",
      "Refer matters to the appropriate leadership tier",
    ],
  },
];

const coordinationPrinciples = [
  {
    title: "Clear responsibilities",
    description:
      "Each office leads within its assigned mandate, reducing duplication and conflicting instructions.",
    icon: Compass,
  },
  {
    title: "Structured communication",
    description:
      "Official updates, meetings and written action points help keep leadership informed and aligned.",
    icon: Network,
  },
  {
    title: "Collective accountability",
    description:
      "Agreed actions have responsible offices, timelines and follow-up so that decisions translate into delivery.",
    icon: ShieldCheck,
  },
];

export default function PresidentialCoordination() {
  return (
    <section
      className="presidential-coordination"
      id="presidential-coordination"
      aria-labelledby="presidential-coordination-title"
    >
      <div className="presidential-coordination__container">
        <header className="presidential-coordination__header">
          <div>
            <span className="presidential-coordination__eyebrow">
              <Network size={16} aria-hidden="true" />
              Working as One Institution
            </span>

            <h2 id="presidential-coordination-title">
              Presidential Coordination
            </h2>

            <p className="presidential-coordination__lead">
              Effective leadership depends on clear responsibilities,
              consistent communication and cooperation across JVP's
              regional and county structures.
            </p>
          </div>

          <div
            className="presidential-coordination__header-symbol"
            aria-hidden="true"
          >
            <Handshake size={32} />
          </div>
        </header>

        <div className="presidential-coordination__framework">
          <div className="presidential-coordination__framework-heading">
            <span className="presidential-coordination__framework-icon">
              <Landmark size={20} aria-hidden="true" />
            </span>

            <div>
              <h3>A coordinated leadership framework</h3>
              <p>
                The Presidency provides strategic direction and
                facilitates coordination among the relevant offices.
                Each office remains responsible for its own approved
                functions and deliverables.
              </p>
            </div>
          </div>

          <div className="presidential-coordination__connector">
            <span className="presidential-coordination__connector-line" />
            <span className="presidential-coordination__connector-label">
              Coordination across four key areas
            </span>
            <span className="presidential-coordination__connector-line" />
          </div>

          <div className="presidential-coordination__grid">
            {coordinationPartners.map((partner) => {
              const Icon = partner.icon;

              return (
                <article
                  className="presidential-coordination__card"
                  key={partner.number}
                >
                  <div className="presidential-coordination__card-top">
                    <span className="presidential-coordination__number">
                      {partner.number}
                    </span>

                    <span className="presidential-coordination__card-icon">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                  </div>

                  <span className="presidential-coordination__label">
                    {partner.label}
                  </span>

                  <h3>{partner.title}</h3>

                  <p className="presidential-coordination__description">
                    {partner.description}
                  </p>

                  <div className="presidential-coordination__divider" />

                  <h4>Coordination focus</h4>

                  <ul>
                    {partner.responsibilities.map((responsibility) => (
                      <li key={responsibility}>
                        <CheckCircle2
                          size={16}
                          aria-hidden="true"
                        />
                        <span>{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>

        <div className="presidential-coordination__principles">
          <div className="presidential-coordination__principles-heading">
            <span className="presidential-coordination__eyebrow">
              Our way of working
            </span>

            <h3>Principles that guide coordination</h3>

            <p>
              A consistent approach helps JVP's leadership work
              collaboratively while preserving institutional
              accountability.
            </p>
          </div>

          <div className="presidential-coordination__principles-grid">
            {coordinationPrinciples.map((principle) => {
              const Icon = principle.icon;

              return (
                <article
                  className="presidential-coordination__principle"
                  key={principle.title}
                >
                  <span className="presidential-coordination__principle-icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>

                  <div>
                    <h4>{principle.title}</h4>
                    <p>{principle.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <footer className="presidential-coordination__footer">
          <div className="presidential-coordination__footer-icon">
            <Handshake size={23} aria-hidden="true" />
          </div>

          <div className="presidential-coordination__footer-copy">
            <h3>One regional vision. Coordinated action.</h3>
            <p>
              Explore JVP's leadership structure and the people serving
              across its leadership offices.
            </p>
          </div>

          <Link
            to="/leadership"
            className="presidential-coordination__link"
          >
            Explore leadership
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </section>
  );
}

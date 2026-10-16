
import {
  ArrowRight,
  BriefcaseBusiness,
  Compass,
  FileText,
  Handshake,
  Landmark,
} from "lucide-react";

import "./Mandate.css";

const mandateAreas = [
  {
    number: "01",
    icon: Compass,
    title: "Executive Leadership",
    description:
      "Provide strategic direction to the Regional Executive and guide the implementation of JVP's agreed vision, policies and regional priorities.",
    responsibilities: [
      "Set executive priorities and strategic direction.",
      "Guide implementation of approved regional plans.",
      "Promote unity and effective executive leadership.",
    ],
  },
  {
    number: "02",
    icon: BriefcaseBusiness,
    title: "Cabinet Coordination",
    description:
      "Work with the Deputy President, Prime Cabinet Secretary and Cabinet Secretaries to support coordinated executive action and delivery.",
    responsibilities: [
      "Provide direction on executive priorities.",
      "Support coordination across regional ministries.",
      "Review progress against agreed commitments.",
    ],
  },
  {
    number: "03",
    icon: Handshake,
    title: "Regional Representation",
    description:
      "Represent JVP's regional interests and champion constructive engagement with public institutions, development partners and youth organisations.",
    responsibilities: [
      "Strengthen institutional and strategic partnerships.",
      "Champion the voice of coastal youth.",
      "Promote cooperation across the six Coastal Counties.",
    ],
  },
  {
    number: "04",
    icon: FileText,
    title: "Accountability & Delivery",
    description:
      "Promote responsible leadership, transparent decision-making and consistent monitoring of regional programmes and executive commitments.",
    responsibilities: [
      "Monitor implementation of agreed priorities.",
      "Encourage transparent reporting of progress.",
      "Promote responsible use of organisational resources.",
    ],
  },
];

export default function PresidentialMandate() {
  return (
    <section
      className="presidential-mandate"
      id="presidential-mandate"
      aria-labelledby="presidential-mandate-title"
    >
      <div className="presidential-mandate__container">
        <header className="presidential-mandate__heading">
          <span className="presidential-mandate__eyebrow">
            <Landmark size={16} />
            The Presidency
          </span>

          <h2 id="presidential-mandate-title">
            The Mandate of the Presidency
          </h2>

          <p>
            The Office of the President provides strategic
            leadership for Jumuiya ya Vijana wa Pwani,
            aligning regional priorities, coordinating
            executive action and advancing the interests
            of young people across the Coastal Counties.
          </p>
        </header>

        <div className="presidential-mandate__grid">
          {mandateAreas.map((area) => {
            const Icon = area.icon;

            return (
              <article
                className="presidential-mandate__card"
                key={area.number}
              >
                <div className="presidential-mandate__card-top">
                  <span className="presidential-mandate__number">
                    {area.number}
                  </span>

                  <div className="presidential-mandate__icon">
                    <Icon size={23} strokeWidth={1.8} />
                  </div>
                </div>

                <h3>{area.title}</h3>

                <p className="presidential-mandate__description">
                  {area.description}
                </p>

                <div className="presidential-mandate__divider" />

                <ul>
                  {area.responsibilities.map(
                    (responsibility) => (
                      <li key={responsibility}>
                        <ArrowRight
                          size={15}
                          aria-hidden="true"
                        />
                        <span>{responsibility}</span>
                      </li>
                    )
                  )}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="presidential-mandate__footer">
          <div className="presidential-mandate__footer-icon">
            <Handshake size={24} />
          </div>

          <div className="presidential-mandate__footer-content">
            <h3>Leadership with a shared purpose</h3>

            <p>
              The Presidency works with JVP's executive
              offices, regional institutions and county
              chapters to translate shared priorities
              into coordinated action for coastal youth.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

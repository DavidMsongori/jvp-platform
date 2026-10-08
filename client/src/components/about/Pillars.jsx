import {
  Users,
  GraduationCap,
  BriefcaseBusiness,
  Waves,
  Leaf,
  Lightbulb,
  Handshake,
  Globe2,
} from "lucide-react";

import "./Pillars.css";

const pillars = [
  {
    icon: Users,
    number: "01",
    title: "Youth Leadership",
    description:
      "Developing ethical, confident and transformative young leaders.",
  },
  {
    icon: GraduationCap,
    number: "02",
    title: "Education & Skills",
    description:
      "Creating pathways for learning, mentorship and practical skills.",
  },
  {
    icon: BriefcaseBusiness,
    number: "03",
    title: "Entrepreneurship",
    description:
      "Supporting youth enterprise, innovation and economic opportunity.",
  },
  {
    icon: Waves,
    number: "04",
    title: "Blue Economy",
    description:
      "Unlocking opportunities across fisheries, marine resources and tourism.",
  },
  {
    icon: Leaf,
    number: "05",
    title: "Climate Action",
    description:
      "Advancing conservation, climate resilience and environmental action.",
  },
  {
    icon: Lightbulb,
    number: "06",
    title: "Innovation & Technology",
    description:
      "Promoting digital inclusion, technology and youth-led innovation.",
  },
  {
    icon: Handshake,
    number: "07",
    title: "Civic Engagement",
    description:
      "Strengthening advocacy, governance, volunteerism and participation.",
  },
  {
    icon: Globe2,
    number: "08",
    title: "Partnerships",
    description:
      "Connecting young people with strategic opportunities and partners.",
  },
];

function Pillars() {
  return (
    <section className="pillars">
      <div className="pillars-container">

        <div className="pillars-header">
          <div>
            <span className="pillars-eyebrow">
              WHAT DRIVES US
            </span>

            <h2>
              Our pillars for
              <span> youth transformation.</span>
            </h2>
          </div>

          <p>
            Our work is focused on creating the leadership,
            skills, opportunities and connections young
            people need to thrive.
          </p>
        </div>

        <div className="pillars-grid">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <article
                className="pillar-card"
                key={pillar.number}
              >
                <div className="pillar-card__top">
                  <div className="pillar-icon">
                    <Icon size={17} />
                  </div>

                  <span className="pillar-number">
                    {pillar.number}
                  </span>
                </div>

                <h3>{pillar.title}</h3>

                <p>{pillar.description}</p>

                <div className="pillar-card__line" />
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default Pillars;
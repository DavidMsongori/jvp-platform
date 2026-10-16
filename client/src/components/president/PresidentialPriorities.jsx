
import {
  ArrowUpRight,
  BriefcaseBusiness,
  GraduationCap,
  Handshake,
  Leaf,
  Scale,
  Sprout,
  Users,
  Waves,
} from "lucide-react";

import "./Priority.css";

const priorities = [
  {
    number: "01",
    icon: Users,
    category: "Participation & Leadership",
    title: "Youth Empowerment",
    description:
      "Expand opportunities for young people to participate meaningfully in leadership, public affairs, community service and regional decision-making.",
    outcomes: [
      "Youth representation and participation",
      "Leadership development",
      "Stronger county youth chapters",
    ],
  },
  {
    number: "02",
    icon: BriefcaseBusiness,
    category: "Economic Opportunity",
    title: "Employment & Entrepreneurship",
    description:
      "Promote access to employment pathways, enterprise development, mentorship and partnerships that help young people build sustainable livelihoods.",
    outcomes: [
      "Entrepreneurship and enterprise support",
      "Employment and internship linkages",
      "Mentorship and business partnerships",
    ],
  },
  {
    number: "03",
    icon: GraduationCap,
    category: "Skills & Human Capital",
    title: "Education & Skills Development",
    description:
      "Champion practical skills, digital literacy, career guidance and learning opportunities that prepare coastal youth for a changing economy.",
    outcomes: [
      "Skills and capacity development",
      "Digital and career readiness",
      "Education and training partnerships",
    ],
  },
  {
    number: "04",
    icon: Sprout,
    category: "Agriculture & Food Systems",
    title: "Agriculture & Food Security",
    description:
      "Advance youth participation in agriculture, agribusiness and resilient food systems while promoting innovation and value addition.",
    outcomes: [
      "Youth-led agribusiness",
      "Agricultural innovation",
      "Food security and value addition",
    ],
  },
  {
    number: "05",
    icon: Leaf,
    category: "Environment & Sustainability",
    title: "Climate Action",
    description:
      "Encourage youth-led environmental protection, climate resilience and sustainable use of coastal natural resources.",
    outcomes: [
      "Environmental conservation",
      "Climate awareness and resilience",
      "Sustainable resource management",
    ],
  },
  {
    number: "06",
    icon: Waves,
    category: "Coastal Economy",
    title: "Blue Economy & Regional Development",
    description:
      "Promote youth opportunities in fisheries, maritime activities, tourism and other sustainable sectors important to coastal communities.",
    outcomes: [
      "Blue economy participation",
      "Sustainable coastal tourism",
      "Regional economic opportunities",
    ],
  },
  {
    number: "07",
    icon: Handshake,
    category: "Partnerships & Collaboration",
    title: "Strategic Partnerships",
    description:
      "Build constructive relationships with public institutions, private organisations, civil society and development partners to advance shared youth priorities.",
    outcomes: [
      "Institutional cooperation",
      "Resource mobilisation",
      "Joint programmes and initiatives",
    ],
  },
  {
    number: "08",
    icon: Scale,
    category: "Governance & Public Trust",
    title: "Accountability & Good Governance",
    description:
      "Strengthen transparent leadership, responsible decision-making, inclusive representation and accountability for agreed commitments.",
    outcomes: [
      "Transparent decision-making",
      "Performance monitoring",
      "Inclusive and responsible leadership",
    ],
  },
];

export default function PresidentialPriorities() {
  return (
    <section
      className="presidential-priorities"
      id="presidential-priorities"
      aria-labelledby="presidential-priorities-title"
    >
      <div className="presidential-priorities__container">
        <header className="presidential-priorities__heading">
          <span className="presidential-priorities__eyebrow">
            <Sprout size={16} />
            The Presidential Agenda
          </span>

          <h2 id="presidential-priorities-title">
            Priorities for a Stronger Coastal Youth Community
          </h2>

          <p>
            The Presidency seeks to unite leadership,
            partnerships and youth-led action around
            shared priorities that expand opportunity
            and contribute to sustainable development
            across the six Coastal Counties.
          </p>
        </header>

        <div className="presidential-priorities__intro">
          <div className="presidential-priorities__intro-mark">
            <Sprout size={24} />
          </div>

          <div>
            <h3>From shared priorities to meaningful action</h3>

            <p>
              These priority areas guide presidential
              advocacy, executive coordination and
              partnership development. Specific projects,
              targets and progress will be communicated
              through JVP's official programmes and reports.
            </p>
          </div>
        </div>

        <div className="presidential-priorities__grid">
          {priorities.map((priority) => {
            const Icon = priority.icon;

            return (
              <article
                className="presidential-priority-card"
                key={priority.number}
              >
                <div className="presidential-priority-card__top">
                  <span className="presidential-priority-card__number">
                    {priority.number}
                  </span>

                  <div className="presidential-priority-card__icon">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                </div>

                <span className="presidential-priority-card__category">
                  {priority.category}
                </span>

                <h3>{priority.title}</h3>

                <p className="presidential-priority-card__description">
                  {priority.description}
                </p>

                <div className="presidential-priority-card__divider" />

                <h4>Areas of focus</h4>

                <ul>
                  {priority.outcomes.map((outcome) => (
                    <li key={outcome}>
                      <span className="presidential-priority-card__bullet" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="presidential-priorities__closing">
          <div className="presidential-priorities__closing-content">
            <span>Our guiding principle</span>

            <h3>
              Every young person deserves the opportunity
              to participate, contribute and thrive.
            </h3>

            <p>
              The Presidency will work with JVP's
              leadership, county chapters and partners
              to advance these priorities through
              collaboration, advocacy and programmes
              whose progress can be assessed.
            </p>
          </div>

          <a
            href="#presidential-impact"
            className="presidential-priorities__link"
          >
            Explore Initiatives
            <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
    </section>
  );
}

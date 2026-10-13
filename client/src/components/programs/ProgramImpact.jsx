
import { useMemo } from "react";
import {
  ArrowUpRight,
  HeartHandshake,
  Sprout,
  Users,
} from "lucide-react";

import "./ProgramImpact.css";

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE").format(value);

const getImpactNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

function ProgramImpact({ programs = [], loading = false }) {
  const metrics = useMemo(() => {
    const records = Array.isArray(programs) ? programs : [];

    const totalAttendees = records.reduce(
      (total, program) =>
        total + getImpactNumber(program?.youthsAttended),
      0
    );

    const totalBeneficiaries = records.reduce(
      (total, program) =>
        total + getImpactNumber(program?.youthsBenefited),
      0
    );

    return [
      {
        id: "programmes",
        label: "Programmes & Initiatives",
        value: records.length,
        description: "Turning ideas into action",
        icon: Sprout,
        style: "program-impact__metric--programmes",
      },
      {
        id: "attendance",
        label: "Youth Attendance",
        value: totalAttendees,
        description: "Youth participation recorded",
        icon: Users,
        style: "program-impact__metric--attendance",
      },
      {
        id: "beneficiaries",
        label: "Youth Beneficiaries",
        value: totalBeneficiaries,
        description: "Youth reached through our work",
        icon: HeartHandshake,
        style: "program-impact__metric--beneficiaries",
      },
    ];
  }, [programs]);

  return (
    <section
      className="program-impact"
      aria-labelledby="program-impact-heading"
    >
      <div className="program-impact__container">
        <div className="program-impact__intro">
          <div className="program-impact__eyebrow">
            <span className="program-impact__eyebrow-line" />
            OUR IMPACT
          </div>

          <h2
            className="program-impact__heading"
            id="program-impact-heading"
          >
            Progress measured
            <br />
            through <span>real impact.</span>
          </h2>

          <p className="program-impact__description">
            Every programme creates an opportunity to participate,
            develop skills, and build a stronger future for young
            people across the Coast.
          </p>
        </div>

        <div
          className={`program-impact__metrics ${
            loading ? "program-impact__metrics--loading" : ""
          }`}
          aria-busy={loading}
        >
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article
                className={`program-impact__metric ${metric.style}`}
                key={metric.id}
              >
                <div className="program-impact__metric-top">
                  <span className="program-impact__icon">
                    <Icon
                      size={21}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </span>

                  <ArrowUpRight
                    className="program-impact__metric-arrow"
                    size={19}
                    aria-hidden="true"
                  />
                </div>

                <div className="program-impact__metric-value">
                  {loading ? (
                    <span
                      className="program-impact__skeleton"
                      aria-label="Loading statistic"
                    />
                  ) : (
                    formatNumber(metric.value)
                  )}
                </div>

                <h3 className="program-impact__metric-label">
                  {metric.label}
                </h3>

                <p className="program-impact__metric-description">
                  {metric.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="program-impact__footer">
          <span className="program-impact__footer-mark">
            <Sprout size={17} aria-hidden="true" />
          </span>

          <p>
            Building opportunities today for a more empowered
            generation tomorrow.
          </p>

          <span className="program-impact__footer-line" />
        </div>
      </div>
    </section>
  );
}

export default ProgramImpact;
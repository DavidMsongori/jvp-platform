import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

import "./LeadershipDistributionChart.css";

const COLORS = [
  "#0F766E",
  "#0EA5E9",
  "#2563EB",
  "#7C3AED",
  "#F59E0B",
  "#10B981",
];

function LeadershipDistributionChart({
  distribution,
}) {
  if (
    !distribution ||
    !distribution.data ||
    distribution.data.length === 0
  ) {
    return (
      <section className="distribution-card">

        <div className="distribution-header">

          <div>

            <h2>Member Distribution</h2>

            <p>
              Distribution data is currently
              unavailable.
            </p>

          </div>

        </div>

        <div className="distribution-empty">

          No data available.

        </div>

      </section>
    );
  }

  const totalMembers = distribution.data.reduce(
    (sum, item) => sum + item.members,
    0
  );

  return (
    <section className="distribution-card">

      <div className="distribution-header">

        <div>

          <h2>{distribution.title}</h2>

          <p>
            Member distribution within your
            leadership jurisdiction.
          </p>

        </div>

        <div className="distribution-summary">

          <div>

            <span>Total Areas</span>

            <strong>
              {distribution.data.length}
            </strong>

          </div>

          <div>

            <span>Total Members</span>

            <strong>{totalMembers}</strong>

          </div>

        </div>

      </div>

      <div className="distribution-chart">

        <ResponsiveContainer
          width="100%"
          height={360}
        >
          <BarChart
            data={distribution.data}
            margin={{
              top: 20,
              right: 20,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="name"
              tick={{
                fontSize: 12,
              }}
            />

            <YAxis
              allowDecimals={false}
            />

            <Tooltip />

            <Bar
              dataKey="members"
              radius={[8, 8, 0, 0]}
            >
              {distribution.data.map(
                (_, index) => (
                  <Cell
                    key={index}
                    fill={
                      COLORS[
                        index %
                          COLORS.length
                      ]
                    }
                  />
                )
              )}
            </Bar>

          </BarChart>

        </ResponsiveContainer>

      </div>

    </section>
  );
}

export default LeadershipDistributionChart;
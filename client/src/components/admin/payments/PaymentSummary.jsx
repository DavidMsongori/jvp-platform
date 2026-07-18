import {
  FaMoneyCheckAlt,
  FaCheckCircle,
  FaClock,
  FaCoins,
} from "react-icons/fa";
import "./Payments.css";

function PaymentSummary({ summary = {} }) {
  const cards = [
    {
      title: "Total Payments",
      value: summary.totalPayments || 0,
      subtitle: "All payment records",
      icon: <FaMoneyCheckAlt />,
      color: "blue",
    },
    {
      title: "Completed",
      value: summary.totalPayments - (summary.pendingPayments || 0) - (summary.failedPayments || 0) || 0,
      subtitle: "Successfully verified",
      icon: <FaCheckCircle />,
      color: "green",
    },
    {
      title: "Pending",
      value: summary.pendingPayments || 0,
      subtitle: "Awaiting verification",
      icon: <FaClock />,
      color: "orange",
    },
    {
      title: "Revenue",
      value: `KES ${(summary.totalRevenue || 0).toLocaleString()}`,
      subtitle: "Completed payments",
      icon: <FaCoins />,
      color: "purple",
    },
  ];

  return (
    <div className="payment-summary">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`summary-card ${card.color}`}
        >
          <div className="summary-icon">
            {card.icon}
          </div>

          <div className="summary-content">
            <h4>{card.title}</h4>

            <h2>{card.value}</h2>

            <small>{card.subtitle}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PaymentSummary;
import { Link } from "react-router-dom";
import {
  CreditCard,
  ArrowRight,
  Receipt,
} from "lucide-react";

import "./RecentPayments.css";

function RecentPayments({ payments = [] }) {
  const formatCurrency = (amount = 0) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <section className="recent-payments">

      <div className="widget-header">

        <div>

          <h2>Recent Payments</h2>

          <p>
            Your latest membership and event payments.
          </p>

        </div>

        <Link
          to="/payments"
          className="widget-link"
        >
          View All

          <ArrowRight size={18} />

        </Link>

      </div>

      {payments.length === 0 ? (

        <div className="payments-empty">

          <Receipt size={56} />

          <h3>No Payments Yet</h3>

          <p>
            Your payment history will appear here once
            you make a payment.
          </p>

          <Link
            to="/payments"
            className="make-payment-btn"
          >
            Make Payment
          </Link>

        </div>

      ) : (

        <div className="payments-list">

          {payments.map((payment) => (

            <div
              key={payment._id}
              className="payment-card"
            >

              <div className="payment-icon">

                <CreditCard size={24} />

              </div>

              <div className="payment-details">

                <h3>

                  {payment.description ||
                    payment.paymentType ||
                    "Payment"}

                </h3>

                <span>

                  {formatDate(
                    payment.createdAt
                  )}

                </span>

              </div>

              <div className="payment-amount">

                {formatCurrency(
                  payment.amount
                )}

              </div>

              <div
                className={`payment-status ${payment.status}`}
              >

                {payment.status}

              </div>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}

export default RecentPayments;
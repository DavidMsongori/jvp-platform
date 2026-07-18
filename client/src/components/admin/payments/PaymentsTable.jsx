import { useNavigate } from "react-router-dom";
import PaymentActions from "./PaymentActions";
import "./Payments.css";

function PaymentsTable({
  payments = [],
  loading,
  pagination = {},
  filters,
  setFilters,
  onVerify,
}) {
  const navigate = useNavigate();

  /* ==========================================
     PAGINATION
  ========================================== */

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > (pagination.totalPages || 1)
    ) {
      return;
    }

    setFilters((previous) => ({
      ...previous,
      page,
    }));
  };

  /* ==========================================
     STATUS
  ========================================== */

  const getStatus = (status) => {
    switch (status) {
      case "completed":
        return {
          label: "Completed",
          className: "completed",
        };

      case "pending":
        return {
          label: "Pending",
          className: "pending",
        };

      case "failed":
        return {
          label: "Failed",
          className: "failed",
        };

      default:
        return {
          label: "Unknown",
          className: "unknown",
        };
    }
  };

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="table-loading">
        Loading payments...
      </div>
    );
  }

  /* ==========================================
     EMPTY
  ========================================== */

  if (!payments.length) {
    return (
      <div className="table-empty">
        <h3>No Payments Found</h3>

        <p>
          No payment records match the selected
          filters.
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="payments-table">
        <thead>
          <tr>
            <th>Receipt</th>
            <th>Member</th>
            <th>Member No.</th>
            <th>Method</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Paid On</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((payment) => {
            const status = getStatus(
              payment.status
            );

            return (
              <tr
                key={payment._id}
                className="clickable-row"
                onClick={() =>
                  navigate(
                    `/admin/payments/${payment._id}`
                  )
                }
              >
                <td>
                  {payment.transactionReference ||
                    payment.receiptNumber ||
                    "-"}
                </td>

                <td>
                  <div className="member-cell">
                    <strong>
                      {payment.member
                        ? `${payment.member.firstName} ${payment.member.lastName}`
                        : "-"}
                    </strong>

                    <small>
                      {payment.member?.phone ||
                        ""}
                    </small>
                  </div>
                </td>

                <td>
                  {payment.member
                    ?.memberNumber || "-"}
                </td>

                <td>
                  {payment.paymentMethod ||
                    "-"}
                </td>

                <td>
                  KES{" "}
                  {Number(
                    payment.amount || 0
                  ).toLocaleString()}
                </td>

                <td>
                  <span
                    className={`badge payment-status ${status.className}`}
                  >
                    {status.label}
                  </span>
                </td>

                <td>
                  {payment.createdAt
                    ? new Date(
                        payment.createdAt
                      ).toLocaleDateString()
                    : "-"}
                </td>

                <td
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  <PaymentActions
                    payment={payment}
                    onView={(payment) =>
                      navigate(
                        `/admin/payments/${payment._id}`
                      )
                    }
                    onVerify={onVerify}
                    onMember={(payment) =>
                      navigate(
                        `/admin/members/${payment.member?._id}`
                      )
                    }
                    onDownload={(payment) =>
                      console.log(
                        "Download receipt",
                        payment
                      )
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="table-pagination">
        <button
          disabled={!pagination.hasPreviousPage}
          onClick={() =>
            goToPage(
              pagination.page - 1
            )
          }
        >
          Previous
        </button>

        <span>
          Showing{" "}
          {((pagination.page || 1) - 1) *
            (pagination.limit || 10) +
            1}
          {" - "}
          {Math.min(
            (pagination.page || 1) *
              (pagination.limit || 10),
            pagination.total ||
              payments.length
          )}
          {" "}of{" "}
          {pagination.total ||
            payments.length}
        </span>

        <button
          disabled={!pagination.hasNextPage}
          onClick={() =>
            goToPage(
              pagination.page + 1
            )
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default PaymentsTable;
import { useEffect, useState } from "react";

import {
  FaCheckCircle,
  FaClock,
  FaMoneyBillWave,
  FaPhone,
  FaSyncAlt,
  FaUser,
  FaMobileAlt,
} from "react-icons/fa";

import {
  getManualMpesaQueue,
  approveManualMpesaPayment,
} from "../../../services/admin.service";

import "./Payments.css";

function ManualMpesaQueue() {

  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [approving, setApproving] = useState(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* ==========================================
     LOAD QUEUE
  ========================================== */

  const loadQueue = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await getManualMpesaQueue();

      /*
       * Support the common API response formats:
       *
       * { payments: [] }
       * { data: { payments: [] } }
       * { queue: [] }
       * { data: { queue: [] } }
       */

      const data = response?.data || response;

      const queue =
        data?.payments ||
        data?.queue ||
        data?.results ||
        [];

      setPayments(
        Array.isArray(queue)
          ? queue
          : []
      );

    } catch (err) {

      console.error(
        "Failed to load manual M-Pesa queue",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load payment verification queue."
      );

    } finally {

      setLoading(false);

    }

  };

  /* ==========================================
     INITIAL LOAD
  ========================================== */

  useEffect(() => {

    loadQueue();

  }, []);

  /* ==========================================
     APPROVE PAYMENT
  ========================================== */

  const handleApprove = async (payment) => {

    const reference =
      payment.transactionReference ||
      payment.mpesaCode ||
      payment.confirmationCode ||
      payment.reference;

    if (!reference) {

      setError(
        "This payment does not have a valid M-Pesa confirmation reference."
      );

      return;

    }

    const memberName = payment.member
      ? `${payment.member.firstName || ""} ${payment.member.lastName || ""}`.trim()
      : "this member";

    const confirmed = window.confirm(
      `Approve the M-Pesa payment from ${memberName}?\n\n` +
      `Confirmation Code: ${reference}\n` +
      `Amount: KES ${Number(payment.amount || 0).toLocaleString()}\n\n` +
      `This will activate the member's membership.`
    );

    if (!confirmed) return;

    try {

      setApproving(
        payment._id || reference
      );

      setError("");

      setSuccess("");

      await approveManualMpesaPayment(
        reference
      );

      setSuccess(
        `Payment ${reference} approved successfully.`
      );

      /*
       * Remove the approved payment immediately
       * from the queue.
       */

      setPayments((previous) =>
        previous.filter(
          (item) =>
            item._id !== payment._id
        )
      );

      /*
       * Reload shortly afterwards so the
       * queue remains synchronized with backend.
       */

      setTimeout(() => {

        loadQueue();

      }, 500);

    } catch (err) {

      console.error(
        "Failed to approve manual M-Pesa payment",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to approve payment."
      );

    } finally {

      setApproving(null);

    }

  };

  /* ==========================================
     HELPERS
  ========================================== */

  const getMemberName = (payment) => {

    if (!payment.member) {
      return "Unknown Member";
    }

    return `${payment.member.firstName || ""} ${payment.member.lastName || ""}`.trim();

  };

  const getPhone = (payment) => {

    return (
      payment.member?.phone ||
      payment.phone ||
      payment.phoneNumber ||
      "-"
    );

  };

  const getReference = (payment) => {

    return (
      payment.transactionReference ||
      payment.mpesaCode ||
      payment.confirmationCode ||
      payment.reference ||
      "-"
    );

  };

  const getSubmittedDate = (payment) => {

    const date =
      payment.submittedAt ||
      payment.createdAt;

    if (!date) return "-";

    return new Date(
      date
    ).toLocaleString();

  };

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {

    return (

      <section className="manual-mpesa-section">

        <div className="manual-mpesa-header">

          <div>

            <h2>
              Manual M-Pesa Verification
            </h2>

            <p>
              Payments submitted by members
              awaiting Finance/Admin verification.
            </p>

          </div>

        </div>

        <div className="manual-mpesa-loading">

          <FaSyncAlt className="spin" />

          <span>
            Loading verification queue...
          </span>

        </div>

      </section>

    );

  }

  return (

    <section className="manual-mpesa-section">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="manual-mpesa-header">

        <div>

          <div className="manual-mpesa-title">

            <FaMobileAlt />

            <h2>
              Manual M-Pesa Verification
            </h2>

            <span className="queue-count">

              {payments.length}

            </span>

          </div>

          <p>

            Review M-Pesa confirmation codes
            submitted by members.

          </p>

        </div>

        <button
          className="queue-refresh-btn"
          onClick={loadQueue}
          disabled={loading}
        >

          <FaSyncAlt />

          Refresh

        </button>

      </div>

      {/* ======================================
          SUCCESS
      ======================================= */}

      {success && (

        <div className="queue-alert success">

          <FaCheckCircle />

          <span>
            {success}
          </span>

        </div>

      )}

      {/* ======================================
          ERROR
      ======================================= */}

      {error && (

        <div className="queue-alert error">

          <span>
            {error}
          </span>

        </div>

      )}

      {/* ======================================
          EMPTY
      ======================================= */}

      {!payments.length && !error && (

        <div className="manual-mpesa-empty">

          <div className="empty-icon">

            <FaCheckCircle />

          </div>

          <h3>
            All caught up
          </h3>

          <p>
            There are no manual M-Pesa payments
            awaiting verification.
          </p>

        </div>

      )}

      {/* ======================================
          QUEUE
      ======================================= */}

      {payments.length > 0 && (

        <div className="manual-mpesa-list">

          {payments.map((payment) => {

            const reference =
              getReference(payment);

            const memberName =
              getMemberName(payment);

            const isApproving =
              approving === payment._id;

            return (

              <div
                className="manual-mpesa-card"
                key={payment._id || reference}
              >

                <div className="manual-payment-main">

                  {/* MEMBER */}

                  <div className="manual-payment-member">

                    <div className="manual-member-avatar">

                      <FaUser />

                    </div>

                    <div>

                      <h3>
                        {memberName}
                      </h3>

                      <p>

                        <FaPhone />

                        {getPhone(payment)}

                      </p>

                    </div>

                  </div>

                  {/* PAYMENT */}

                  <div className="manual-payment-details">

                    <div className="manual-detail">

                      <span>
                        M-Pesa Code
                      </span>

                      <strong className="mpesa-reference">

                        {reference}

                      </strong>

                    </div>

                    <div className="manual-detail">

                      <span>
                        Amount
                      </span>

                      <strong>

                        KES{" "}

                        {Number(
                          payment.amount || 0
                        ).toLocaleString()}

                      </strong>

                    </div>

                    <div className="manual-detail">

                      <span>
                        Submitted
                      </span>

                      <strong>

                        {getSubmittedDate(
                          payment
                        )}

                      </strong>

                    </div>

                  </div>

                </div>

                {/* FOOTER */}

                <div className="manual-payment-footer">

                  <div className="manual-payment-status">

                    <FaClock />

                    <span>
                      Awaiting verification
                    </span>

                  </div>

                  <button
                    className="approve-payment-btn"
                    onClick={() =>
                      handleApprove(payment)
                    }
                    disabled={isApproving}
                  >

                    {isApproving ? (

                      <>
                        <FaSyncAlt className="spin" />

                        Approving...

                      </>

                    ) : (

                      <>
                        <FaCheckCircle />

                        Approve Payment

                      </>

                    )}

                  </button>

                </div>

              </div>

            );

          })}

        </div>

      )}

    </section>

  );

}

export default ManualMpesaQueue;
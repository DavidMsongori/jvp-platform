import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Smartphone,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  initiateMembershipPayment,
  checkPaymentStatus,
} from "../../services/payment.service";

import "./Payment.css";

/* ==========================================
   MEMBERSHIP FEES
========================================== */

const MEMBERSHIP_FEES = {
  ordinary: 100,
  leadership: 100,
};

function Payment() {
  const navigate = useNavigate();

  const {
    member,
    refreshProfile,
  } = useAuth();

  const [phone, setPhone] = useState(
    member?.phone || ""
  );

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const [reference, setReference] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const intervalRef = useRef(null);

  const membershipType =
    member?.membershipType || "ordinary";

  const amount =
    MEMBERSHIP_FEES[membershipType] ??
    MEMBERSHIP_FEES.ordinary;

  const membershipStatus =
    member?.membershipStatus ||
    "pending_payment";

  const memberNumber =
    membershipStatus === "active" &&
    member?.memberNumber
      ? member.memberNumber
      : "Will be assigned after payment";

  /* ==========================================
     CLEAR POLLING
  ========================================== */

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setChecking(false);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  /* ==========================================
     HANDLE SUCCESSFUL PAYMENT
  ========================================== */

  const handlePaymentSuccess = async () => {
    stopPolling();

    setError("");
    setMessage(
      "Payment received successfully. Your membership has been activated."
    );

    try {
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (refreshError) {
      console.error(
        "Unable to refresh member profile:",
        refreshError
      );
    }

    setTimeout(() => {
      navigate("/dashboard", {
        replace: true,
      });
    }, 2000);
  };

  /* ==========================================
     PAYMENT STATUS POLLING
  ========================================== */

  const startPolling = (paymentReference) => {
    stopPolling();
    setChecking(true);

    intervalRef.current = setInterval(
      async () => {
        try {
          const response =
            await checkPaymentStatus(
              paymentReference
            );

          const responseData =
            response?.data || {};

          const payment =
            responseData.payment;

          const status =
            payment?.status;

          if (
            responseData.completed &&
            status === "successful"
          ) {
            await handlePaymentSuccess();
            return;
          }

          if (
            status === "failed" ||
            status === "cancelled" ||
            status === "expired"
          ) {
            stopPolling();

            setMessage("");

            setError(
              payment?.failureReason ||
                payment?.statusMessage ||
                `Payment ${status}. Please try again.`
            );
          }
        } catch (pollingError) {
          console.error(
            "Unable to check payment status:",
            pollingError
          );
        }
      },
      5000
    );
  };

  /* ==========================================
     INITIATE PAYMENT
  ========================================== */

  const handlePayment = async () => {
    setError("");
    setMessage("");
    setReference("");

    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      setError(
        "Enter the Safaricom phone number that will receive the STK Push."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await initiateMembershipPayment(
          trimmedPhone
        );

      const responseData =
        response?.data || {};

      const payment =
        responseData.payment;

      const paymentReference =
        responseData.reference ||
        payment?.reference;

      if (!paymentReference) {
        throw new Error(
          "The payment reference was not returned."
        );
      }

      setReference(paymentReference);

      setMessage(
        responseData.customerMessage ||
          payment?.mpesa?.customerMessage ||
          "STK Push sent successfully. Check your phone and enter your M-Pesa PIN."
      );

      startPolling(paymentReference);
    } catch (paymentError) {
      stopPolling();

      setError(
        paymentError?.message ||
          "Unable to initiate payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-card">
        <div className="payment-header">
          <ShieldCheck size={50} />

          <h1>
            Activate Your Membership
          </h1>

          <p>
            Your account has been created
            successfully. Complete your
            membership payment to unlock
            the JVP Connect Dashboard.
          </p>
        </div>

        {/* ================================= */}

        <div className="activation-steps">
          <div className="step complete">
            <CheckCircle2 size={20} />
            Registration
          </div>

          <div className="step complete">
            <CheckCircle2 size={20} />
            Email Verification
          </div>

          <div className="step complete">
            <CheckCircle2 size={20} />
            Password Created
          </div>

          <div className="step active">
            <Circle size={20} />
            Membership Payment
          </div>

          <div className="step">
            <Circle size={20} />
            Dashboard Access
          </div>
        </div>

        {/* ================================= */}

        <div className="membership-summary">
          <h2>
            Membership Summary
          </h2>

          <div className="summary-grid">
            <div>
              <small>
                Membership Type
              </small>

              <strong>
                {membershipType}
              </strong>
            </div>

            <div>
              <small>
                Membership Fee
              </small>

              <strong>
                KES {amount}
              </strong>
            </div>

            <div>
              <small>Status</small>

              <strong>
                {membershipStatus ===
                "pending_payment"
                  ? "Pending Payment"
                  : membershipStatus}
              </strong>
            </div>

            <div>
              <small>
                Member Number
              </small>

              <strong>
                {memberNumber}
              </strong>
            </div>
          </div>
        </div>

        {/* ================================= */}

        <div className="payment-method">
          <h2>
            Pay with M-Pesa
          </h2>

          <p>
            Enter the Safaricom phone
            number that will receive the
            STK Push.
          </p>

          <label htmlFor="mpesa-phone">
            Phone Number
          </label>

          <input
            id="mpesa-phone"
            type="tel"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            placeholder="254712345678"
            autoComplete="tel"
            disabled={
              loading || checking
            }
          />

          {error && (
            <div
              className="payment-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className="payment-success"
              role="status"
            >
              {message}
            </div>
          )}

          {checking && (
            <div className="payment-processing">
              <Loader2
                size={18}
                className="spin"
              />

              Waiting for payment
              confirmation...
            </div>
          )}

          {reference && (
            <small className="payment-reference">
              Reference: {reference}
            </small>
          )}

          <button
            type="button"
            className="pay-btn"
            onClick={handlePayment}
            disabled={
              loading || checking
            }
          >
            {loading ? (
              <>
                <Loader2
                  size={20}
                  className="spin"
                />

                Sending STK Push...
              </>
            ) : checking ? (
              <>
                <Loader2
                  size={20}
                  className="spin"
                />

                Awaiting Confirmation...
              </>
            ) : (
              <>
                <Smartphone size={20} />

                Pay KES {amount}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Payment;
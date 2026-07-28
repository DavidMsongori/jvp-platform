import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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

/* ==========================================
   STORAGE
========================================== */

const PAYMENT_REFERENCE_KEY =
  "membershipPaymentReference";

function Payment() {
  const navigate = useNavigate();

  const {
    member,
    membershipActive,
    membershipFeePaid,
    refreshProfile,
  } = useAuth();

  const [phone, setPhone] = useState(
    member?.phone || ""
  );

  const [loading, setLoading] =
    useState(false);

  const [checking, setChecking] =
    useState(false);

  const [reference, setReference] =
    useState(() => {
      return (
        localStorage.getItem(
          PAYMENT_REFERENCE_KEY
        ) || ""
      );
    });

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const intervalRef = useRef(null);

  const pollingRequestRef =
    useRef(false);

  const membershipType =
    member?.membershipType ||
    "ordinary";

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
     CLEAR SAVED PAYMENT
  ========================================== */

  const clearSavedPayment =
    useCallback(() => {
      localStorage.removeItem(
        PAYMENT_REFERENCE_KEY
      );

      setReference("");
    }, []);

  /* ==========================================
     STOP POLLING
  ========================================== */

  const stopPolling =
    useCallback(() => {
      if (intervalRef.current) {
        clearInterval(
          intervalRef.current
        );

        intervalRef.current = null;
      }

      pollingRequestRef.current =
        false;

      setChecking(false);
    }, []);

  /* ==========================================
     REDIRECT ACTIVE MEMBERS
  ========================================== */

  useEffect(() => {
    if (
      membershipActive &&
      membershipFeePaid
    ) {
      clearSavedPayment();
      stopPolling();

      navigate("/dashboard", {
        replace: true,
      });
    }
  }, [
    membershipActive,
    membershipFeePaid,
    clearSavedPayment,
    stopPolling,
    navigate,
  ]);

  /* ==========================================
     PAYMENT SUCCESS
  ========================================== */

  const handlePaymentSuccess =
    useCallback(async () => {
      stopPolling();

      setError("");

     setMessage(
  `Payment received successfully. Welcome to JVP Connect! Your membership number is ${member?.memberNumber || ""}. Redirecting to your dashboard...`
);

      try {
        await refreshProfile();
      } catch (refreshError) {
        console.error(
          "Unable to refresh member profile:",
          refreshError
        );
      }

      clearSavedPayment();

      navigate("/dashboard", {
        replace: true,
      });
    }, [
      stopPolling,
      refreshProfile,
      clearSavedPayment,
      navigate,
    ]);

  /* ==========================================
     CHECK PAYMENT ONCE
  ========================================== */

  const checkStatus =
    useCallback(
      async (paymentReference) => {
        if (
          !paymentReference ||
          pollingRequestRef.current
        ) {
          return;
        }

        pollingRequestRef.current =
          true;

        try {
          const response =
            await checkPaymentStatus(
              paymentReference
            );

          const responseData =
            response?.data || {};

          const completed =
  responseData.completed;

const payment =
  responseData.payment;

const status =
  payment?.status;

if (
  completed &&
  status === "successful" &&
  payment?.membershipProcessed
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
            clearSavedPayment();

            setMessage("");

            setError(
              payment?.failureReason ||
                payment?.statusMessage ||
                `Payment ${status}. Please try again.`
            );

            return;
          }

          /*
           * A processing status is normal while
           * waiting for the Safaricom callback.
           * Do not show it as an error.
           */
          setError("");

          setMessage(
            "Your payment is being processed. Please do not initiate another payment."
          );
        } catch (statusError) {
          console.error(
            "Unable to check payment status:",
            statusError
          );

          /*
           * Do not clear the reference because
           * this may only be a temporary network
           * or backend problem.
           */
          setMessage(
            "Confirming your payment. Please wait..."
          );
        } finally {
          pollingRequestRef.current =
            false;
        }
      },
      [
        handlePaymentSuccess,
        stopPolling,
        clearSavedPayment,
      ]
    );

  /* ==========================================
     START POLLING
  ========================================== */

  const startPolling =
    useCallback(
      (paymentReference) => {
        if (!paymentReference) {
          return;
        }

        stopPolling();

        setChecking(true);

        checkStatus(paymentReference);

        intervalRef.current =
          setInterval(() => {
            checkStatus(
              paymentReference
            );
          }, 5000);
      },
      [
        stopPolling,
        checkStatus,
      ]
    );

  /* ==========================================
     RESUME PAYMENT AFTER REFRESH
  ========================================== */

  useEffect(() => {
    if (
      membershipActive &&
      membershipFeePaid
    ) {
      return;
    }

    const savedReference =
      localStorage.getItem(
        PAYMENT_REFERENCE_KEY
      );

    if (savedReference) {
      setReference(savedReference);

      setMessage(
        "A payment is already being processed. Confirming its status..."
      );

      startPolling(savedReference);
    }

    return () => {
      stopPolling();
    };
  }, [
    membershipActive,
    membershipFeePaid,
    startPolling,
    stopPolling,
  ]);

  /* ==========================================
     INITIATE PAYMENT
  ========================================== */

  const handlePayment = async () => {
    setError("");
    setMessage("");

    const trimmedPhone =
      phone.trim();

    if (!trimmedPhone) {
      setError(
        "Enter the Safaricom phone number that will receive the STK Push."
      );

      return;
    }

    const existingReference =
      localStorage.getItem(
        PAYMENT_REFERENCE_KEY
      );

    if (existingReference) {
      setReference(
        existingReference
      );

      setMessage(
        "A payment is already being processed. Please wait for confirmation."
      );

      startPolling(
        existingReference
      );

      return;
    }

    try {
      setLoading(true);

      /*
       * Refresh first in case the callback
       * already activated the membership.
       */
      const refreshed =
        await refreshProfile();

      const refreshedMember =
        refreshed?.member;

      if (
        refreshedMember
          ?.membershipStatus ===
          "active" &&
        refreshedMember
          ?.membershipFeePaid
      ) {
        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

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

      localStorage.setItem(
        PAYMENT_REFERENCE_KEY,
        paymentReference
      );

      setReference(
        paymentReference
      );

      setMessage(
        "STK Push sent. Check your phone, enter your M-Pesa PIN, and remain on this page while we confirm payment."
      );

      startPolling(
        paymentReference
      );
    } catch (paymentError) {
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
            Complete your membership
            payment to unlock the JVP
            Connect Dashboard.
          </p>
        </div>

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
                {checking
                  ? "Processing Payment"
                  : membershipStatus ===
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
              setPhone(
                event.target.value
              )
            }
            placeholder="254712345678"
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

              Confirming payment...
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
              loading ||
              checking ||
              Boolean(reference)
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
            ) : checking ||
              reference ? (
              <>
                <Loader2
                  size={20}
                  className="spin"
                />

                Awaiting Confirmation...
              </>
            ) : (
              <>
                <Smartphone
                  size={20}
                />

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
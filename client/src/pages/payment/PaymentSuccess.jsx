import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Home,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  checkPaymentStatus,
} from "../../services/payment.service";

import "./PaymentSuccess.css";

/* ==========================================================
   STORAGE
========================================================== */

const PAYMENT_REFERENCE_KEY =
  "membershipPaymentReference";

const PAYMENT_INVOICE_KEY =
  "membershipPaymentInvoiceId";

/* ==========================================================
   POLLING
========================================================== */

const POLLING_INTERVAL = 5000;
const MAX_POLLING_ATTEMPTS = 12;

/* ==========================================================
   HELPERS
========================================================== */

const formatAmount = (
  value
) => {
  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
  ) {
    return "-";
  }

  return new Intl.NumberFormat(
    "en-KE"
  ).format(amount);
};

const formatStatus = (
  value
) => {
  if (!value) {
    return "Pending";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
};

const getResponseData = (
  response
) => {
  return (
    response?.data?.data ||
    response?.data ||
    response ||
    {}
  );
};

/* ==========================================================
   COMPONENT
========================================================== */

export default function PaymentSuccess() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const {
    refreshProfile,
  } = useAuth();

  const [
    state,
    setState,
  ] = useState(
    "checking"
  );

  const [
    payment,
    setPayment,
  ] = useState(null);

  const [
    message,
    setMessage,
  ] = useState(
    "Confirming your payment with IntaSend..."
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    manualChecking,
    setManualChecking,
  ] = useState(false);

  const pollingIntervalRef =
    useRef(null);

  const requestInProgressRef =
    useRef(false);

  const attemptsRef =
    useRef(0);

  const reference =
    searchParams.get(
      "reference"
    ) ||
    searchParams.get(
      "api_ref"
    ) ||
    localStorage.getItem(
      PAYMENT_REFERENCE_KEY
    ) ||
    "";

  const invoiceId =
    searchParams.get(
      "invoice_id"
    ) ||
    searchParams.get(
      "invoiceId"
    ) ||
    localStorage.getItem(
      PAYMENT_INVOICE_KEY
    ) ||
    "";

  /* ========================================================
     CLEAR STORAGE
  ======================================================== */

  const clearStoredPayment =
    useCallback(() => {
      localStorage.removeItem(
        PAYMENT_REFERENCE_KEY
      );

      localStorage.removeItem(
        PAYMENT_INVOICE_KEY
      );
    }, []);

  /* ========================================================
     STOP POLLING
  ======================================================== */

  const stopPolling =
    useCallback(() => {
      if (
        pollingIntervalRef.current
      ) {
        clearInterval(
          pollingIntervalRef.current
        );

        pollingIntervalRef.current =
          null;
      }

      requestInProgressRef.current =
        false;
    }, []);

  /* ========================================================
     SUCCESS
  ======================================================== */

  const handleSuccessfulPayment =
    useCallback(
      async (
        confirmedPayment
      ) => {
        stopPolling();

        setPayment(
          confirmedPayment
        );

        setState(
          "successful"
        );

        setError("");

        setMessage(
          "Your payment has been confirmed successfully."
        );

        clearStoredPayment();

        try {
          await refreshProfile();
        } catch (
          refreshError
        ) {
          console.error(
            "Unable to refresh profile after payment:",
            refreshError
          );
        }
      },
      [
        stopPolling,
        clearStoredPayment,
        refreshProfile,
      ]
    );

  /* ========================================================
     CHECK STATUS
  ======================================================== */

  const verifyPayment =
    useCallback(
      async ({
        manual = false,
      } = {}) => {
        if (
          requestInProgressRef.current
        ) {
          return;
        }

        if (
          !reference &&
          !invoiceId
        ) {
          stopPolling();

          setState(
            "missing"
          );

          setMessage("");

          setError(
            "The payment reference could not be found. Return to the payment page and try again."
          );

          return;
        }

        requestInProgressRef.current =
          true;

        if (manual) {
          setManualChecking(
            true
          );
        }

        try {
          const response =
            await checkPaymentStatus(
              {
                reference:
                  reference ||
                  null,

                invoiceId:
                  invoiceId ||
                  null,
              }
            );

          const responseData =
            getResponseData(
              response
            );

          const confirmedPayment =
            responseData.payment ||
            null;

          const completed =
            responseData.completed ===
              true ||
            confirmedPayment
              ?.status ===
              "successful";

          const status =
            confirmedPayment
              ?.status ||
            "pending";

          setPayment(
            confirmedPayment
          );

          if (completed) {
            await handleSuccessfulPayment(
              confirmedPayment
            );

            return;
          }

          if (
            [
              "failed",
              "cancelled",
              "expired",
            ].includes(
              status
            )
          ) {
            stopPolling();

            setState(
              "failed"
            );

            setMessage("");

            setError(
              confirmedPayment
                ?.failureReason ||
                confirmedPayment
                  ?.statusMessage ||
                `The payment was ${status}.`
            );

            return;
          }

          attemptsRef.current +=
            1;

          setState(
            "pending"
          );

          setError("");

          setMessage(
            status ===
              "processing"
              ? "Your payment is being processed. Confirmation may take a few moments."
              : "We are waiting for IntaSend to confirm your payment."
          );

          if (
            attemptsRef.current >=
            MAX_POLLING_ATTEMPTS
          ) {
            stopPolling();

            setMessage(
              "Payment confirmation is taking longer than expected. You can check again manually."
            );
          }
        } catch (
          statusError
        ) {
          console.error(
            "Unable to verify payment:",
            statusError
          );

          attemptsRef.current +=
            1;

          setState(
            "pending"
          );

          setMessage(
            "We could not confirm the payment yet. This may be a temporary delay."
          );

          setError("");

          if (
            attemptsRef.current >=
            MAX_POLLING_ATTEMPTS
          ) {
            stopPolling();
          }
        } finally {
          requestInProgressRef.current =
            false;

          setManualChecking(
            false
          );
        }
      },
      [
        reference,
        invoiceId,
        stopPolling,
        handleSuccessfulPayment,
      ]
    );

  /* ========================================================
     START POLLING
  ======================================================== */

  useEffect(() => {
    verifyPayment();

    pollingIntervalRef.current =
      setInterval(() => {
        verifyPayment();
      }, POLLING_INTERVAL);

    return () => {
      stopPolling();
    };
  }, [
    verifyPayment,
    stopPolling,
  ]);

  /* ========================================================
     ACTIONS
  ======================================================== */

  const handleGoToDashboard =
    async () => {
      try {
        await refreshProfile();
      } catch (
        refreshError
      ) {
        console.error(
          "Unable to refresh profile:",
          refreshError
        );
      }

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    };

  const handleTryAgain = () => {
    clearStoredPayment();

    navigate(
      "/payment",
      {
        replace: true,
      }
    );
  };

  /* ========================================================
     DISPLAY
  ======================================================== */

  const isSuccessful =
    state === "successful";

  const isFailed =
    state === "failed" ||
    state === "missing";

  const isPending =
    state === "checking" ||
    state === "pending";

  return (
    <main className="payment-success-page">
      <section className="payment-success-card">
        <div
          className={`payment-success-icon ${
            isSuccessful
              ? "successful"
              : isFailed
                ? "failed"
                : "pending"
          }`}
        >
          {isSuccessful ? (
            <CheckCircle2
              size={52}
              aria-hidden="true"
            />
          ) : isFailed ? (
            <AlertCircle
              size={52}
              aria-hidden="true"
            />
          ) : (
            <Loader2
              size={52}
              className="payment-success-spin"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="payment-success-heading">
          <span>
            <ShieldCheck
              size={16}
              aria-hidden="true"
            />

            Secure payment verification
          </span>

          <h1>
            {isSuccessful
              ? "Payment Confirmed"
              : isFailed
                ? "Payment Not Completed"
                : "Confirming Payment"}
          </h1>

          {message && (
            <p>{message}</p>
          )}

          {error && (
            <div
              className="payment-success-error"
              role="alert"
            >
              <AlertCircle
                size={18}
                aria-hidden="true"
              />

              <span>
                {error}
              </span>
            </div>
          )}
        </div>

        {payment && (
          <div className="payment-success-details">
            <div>
              <small>
                Payment reference
              </small>

              <strong>
                {payment.reference ||
                  reference ||
                  "-"}
              </strong>
            </div>

            <div>
              <small>
                Amount
              </small>

              <strong>
                {payment.currency ||
                  "KES"}{" "}
                {formatAmount(
                  payment.amount
                )}
              </strong>
            </div>

            <div>
              <small>
                Payment status
              </small>

              <strong
                className={`payment-success-status status-${payment.status}`}
              >
                {formatStatus(
                  payment.status
                )}
              </strong>
            </div>

            <div>
              <small>
                Payment provider
              </small>

              <strong>
                IntaSend
              </strong>
            </div>

            {payment.intasend
              ?.invoiceId && (
              <div className="full-width">
                <small>
                  IntaSend invoice
                </small>

                <strong>
                  {
                    payment.intasend
                      .invoiceId
                  }
                </strong>
              </div>
            )}
          </div>
        )}

        {isPending && (
          <div className="payment-success-waiting">
            <Clock3
              size={20}
              aria-hidden="true"
            />

            <div>
              <strong>
                Please keep this page open
              </strong>

              <p>
                We are checking for the
                latest confirmation from
                IntaSend.
              </p>
            </div>
          </div>
        )}

        <div className="payment-success-actions">
          {isSuccessful ? (
            <button
              type="button"
              className="payment-success-primary"
              onClick={
                handleGoToDashboard
              }
            >
              Go to dashboard

              <ArrowRight
                size={18}
                aria-hidden="true"
              />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="payment-success-primary"
                onClick={() =>
                  verifyPayment({
                    manual: true,
                  })
                }
                disabled={
                  manualChecking
                }
              >
                {manualChecking ? (
                  <>
                    <Loader2
                      size={18}
                      className="payment-success-spin"
                    />

                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw
                      size={18}
                      aria-hidden="true"
                    />

                    Check payment again
                  </>
                )}
              </button>

              {isFailed && (
                <button
                  type="button"
                  className="payment-success-secondary"
                  onClick={
                    handleTryAgain
                  }
                >
                  Try payment again
                </button>
              )}
            </>
          )}

          <Link
            to="/"
            className="payment-success-home"
          >
            <Home
              size={17}
              aria-hidden="true"
            />

            Return home
          </Link>
        </div>

        <p className="payment-success-note">
          JVP Connect does not receive or
          store your M-Pesa PIN. Payment
          verification is handled securely
          through IntaSend.
        </p>
      </section>
    </main>
  );
}
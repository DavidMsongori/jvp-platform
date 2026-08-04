import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  initiateMembershipPayment,
  redirectToCheckout,
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
   LOCAL STORAGE
========================================== */

const PAYMENT_REFERENCE_KEY =
  "membershipPaymentReference";

const PAYMENT_INVOICE_KEY =
  "membershipPaymentInvoiceId";

/* ==========================================
   PHONE NORMALIZATION
========================================== */

const normalizeKenyanPhone = (
  value
) => {
  const phone = String(
    value || ""
  )
    .trim()
    .replace(/[\s()-]/g, "");

  if (
    /^254[17]\d{8}$/.test(
      phone
    )
  ) {
    return phone;
  }

  if (
    /^\+254[17]\d{8}$/.test(
      phone
    )
  ) {
    return phone.slice(1);
  }

  if (
    /^0[17]\d{8}$/.test(
      phone
    )
  ) {
    return `254${phone.slice(
      1
    )}`;
  }

  return null;
};

/* ==========================================
   COMPONENT
========================================== */

function Payment() {
  const navigate =
    useNavigate();

  const {
    member,
    membershipActive,
    membershipFeePaid,
    refreshProfile,
  } = useAuth();

  const [
    phone,
    setPhone,
  ] = useState(
    member?.phone || ""
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const membershipType =
    member?.membershipType ||
    "ordinary";

  const amount =
    MEMBERSHIP_FEES[
      membershipType
    ] ??
    MEMBERSHIP_FEES.ordinary;

  const membershipStatus =
    member?.membershipStatus ||
    "pending_payment";

  const memberNumber =
    membershipStatus ===
      "active" &&
    member?.memberNumber
      ? member.memberNumber
      : "Will be assigned after payment";

  /* ==========================================
     KEEP PHONE IN SYNC
  ========================================== */

  useEffect(() => {
    if (
      member?.phone &&
      !phone
    ) {
      setPhone(
        member.phone
      );
    }
  }, [
    member?.phone,
    phone,
  ]);

  /* ==========================================
     REDIRECT ACTIVE MEMBERS
  ========================================== */

  useEffect(() => {
    if (
      membershipActive &&
      membershipFeePaid
    ) {
      localStorage.removeItem(
        PAYMENT_REFERENCE_KEY
      );

      localStorage.removeItem(
        PAYMENT_INVOICE_KEY
      );

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    }
  }, [
    membershipActive,
    membershipFeePaid,
    navigate,
  ]);

  /* ==========================================
     INITIATE PAYMENT
  ========================================== */

  const handlePayment =
    async () => {
      setError("");
      setMessage("");

      const normalizedPhone =
        normalizeKenyanPhone(
          phone
        );

      if (!normalizedPhone) {
        setError(
          "Enter a valid Kenyan mobile number, for example 0712345678 or 0112345678."
        );

        return;
      }

      try {
        setLoading(true);

        /*
         * Refresh before creating another
         * payment in case membership was
         * activated in another browser tab.
         */
        const refreshedMember =
          await refreshProfile();

        if (
          refreshedMember
            ?.membershipStatus ===
            "active" &&
          refreshedMember
            ?.membershipFeePaid ===
            true
        ) {
          navigate(
            "/dashboard",
            {
              replace: true,
            }
          );

          return;
        }

        const fullName = [
          member?.firstName,
          member?.middleName,
          member?.lastName,
        ]
          .filter(Boolean)
          .join(" ");

        const response =
          await initiateMembershipPayment(
            {
              phoneNumber:
                normalizedPhone,

              email:
                member?.user?.email ||
                member?.email ||
                null,

              fullName:
                fullName ||
                null,

              method:
                "M-PESA",

              redirectUrl:
                `${window.location.origin}/payment/success`,
            }
          );

        const responseData =
          response?.data ||
          {};

        const payment =
          responseData.payment ||
          null;

        const reference =
          responseData.reference ||
          payment?.reference ||
          null;

        const invoiceId =
          responseData.invoiceId ||
          payment?.intasend
            ?.invoiceId ||
          null;

        const checkoutUrl =
          responseData.checkoutUrl ||
          payment?.intasend
            ?.checkoutUrl ||
          null;

        /*
         * The account might already have
         * been activated by a previously
         * completed payment.
         */
        if (
          responseData
            .alreadyCompleted
        ) {
          await refreshProfile();

          navigate(
            "/dashboard",
            {
              replace: true,
            }
          );

          return;
        }

        if (!checkoutUrl) {
          throw new Error(
            "IntaSend did not return a checkout URL."
          );
        }

        if (reference) {
          localStorage.setItem(
            PAYMENT_REFERENCE_KEY,
            reference
          );
        }

        if (invoiceId) {
          localStorage.setItem(
            PAYMENT_INVOICE_KEY,
            invoiceId
          );
        }

        setMessage(
          "Your secure IntaSend checkout is ready. Redirecting you to complete payment..."
        );

        /*
         * Give React a moment to display
         * the redirect message.
         */
        window.setTimeout(
          () => {
            redirectToCheckout(
              checkoutUrl
            );
          },
          500
        );
      } catch (
        paymentError
      ) {
        console.error(
          "Unable to create IntaSend checkout:",
          paymentError
        );

        setError(
          paymentError?.message ||
            "Unable to start payment. Please try again."
        );

        setLoading(false);
      }
    };

  /* ==========================================
     RENDER
  ========================================== */

  return (
    <div className="payment-page">
      <div className="payment-card">
        <div className="payment-header">
          <ShieldCheck
            size={50}
          />

          <h1>
            Activate Your Membership
          </h1>

          <p>
            Complete your membership
            payment securely through
            IntaSend to unlock the JVP
            Connect Dashboard.
          </p>
        </div>

        <div className="activation-steps">
          <div className="step complete">
            <CheckCircle2
              size={20}
            />

            Registration
          </div>

          <div className="step complete">
            <CheckCircle2
              size={20}
            />

            Email Verification
          </div>

          <div className="step complete">
            <CheckCircle2
              size={20}
            />

            Password Created
          </div>

          <div className="step active">
            <Circle
              size={20}
            />

            Membership Payment
          </div>

          <div className="step">
            <Circle
              size={20}
            />

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
              <small>
                Status
              </small>

              <strong>
                {loading
                  ? "Preparing Checkout"
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
            Pay securely with IntaSend
          </h2>

          <p>
            Enter the Kenyan mobile
            number you will use to
            complete the M-Pesa payment.
            You will be redirected to a
            secure IntaSend checkout.
          </p>

          <label htmlFor="intasend-phone">
            M-Pesa Phone Number
          </label>

          <input
            id="intasend-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(
              event
            ) =>
              setPhone(
                event.target.value
              )
            }
            placeholder="0712345678 or 0112345678"
            disabled={loading}
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

          {loading && (
            <div className="payment-processing">
              <Loader2
                size={18}
                className="spin"
              />

              Connecting to secure
              checkout...
            </div>
          )}

          <button
            type="button"
            className="pay-btn"
            onClick={
              handlePayment
            }
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2
                  size={20}
                  className="spin"
                />

                Preparing Checkout...
              </>
            ) : (
              <>
                <Smartphone
                  size={20}
                />

                Pay KES {amount}

                <ExternalLink
                  size={17}
                />
              </>
            )}
          </button>

          <small className="payment-security-note">
            Payment is processed
            securely by IntaSend. JVP
            Connect does not receive or
            store your M-Pesa PIN.
          </small>
        </div>
      </div>
    </div>
  );
}

export default Payment;
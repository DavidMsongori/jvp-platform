import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  Circle,
  Clipboard,
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
  initiateManualMembershipPayment,
  confirmManualMpesaPayment,
  getPaymentHistory,
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
   JVP M-PESA TILL
========================================== */

const JVP_MPESA_TILL_NUMBER =
  import.meta.env.VITE_JVP_MPESA_TILL_NUMBER ||
  "";

/* ==========================================
   PAYMENT STATUS
========================================== */

const PAYMENT_STATUS = {
  IDLE: "idle",
  PENDING: "pending",
  SUBMITTED: "submitted",
  SUCCESSFUL: "successful",
  FAILED: "failed",
};

/* ==========================================
   COMPONENT
========================================== */

function Payment() {
  const navigate = useNavigate();

  const {
    member,
    membershipActive,
    membershipFeePaid,
    refreshProfile,
  } = useAuth();

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    submittingCode,
    setSubmittingCode,
  ] = useState(false);

  const [
    checkingStatus,
    setCheckingStatus,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    confirmationCode,
    setConfirmationCode,
  ] = useState("");

  const [
    payment,
    setPayment,
  ] = useState(null);

  const [
    paymentStatus,
    setPaymentStatus,
  ] = useState(
    PAYMENT_STATUS.IDLE
  );

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
    membershipStatus === "active" &&
    member?.memberNumber
      ? member.memberNumber
      : "Will be assigned after payment";

  const paymentReference =
    payment?.reference || "";

  const transactionCode =
    payment?.manualMpesa
      ?.transactionCode || "";

  /* ==========================================
     REDIRECT ACTIVE MEMBERS
  ========================================== */

  useEffect(() => {
    if (
      membershipActive &&
      membershipFeePaid
    ) {
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
     LOAD EXISTING PAYMENT
  ========================================== */

  useEffect(() => {
    let mounted = true;

    const loadExistingPayment = async () => {
      try {
        const response =
          await getPaymentHistory({
            paymentFor: "membership",
            limit: 10,
          });

        const payments =
          response?.data?.payments ||
          response?.data?.items ||
          response?.payments ||
          [];

        const manualPayment =
          payments.find(
            (item) =>
              item?.provider ===
                "manual" &&
              item?.paymentMethod ===
                "mpesa" &&
              [
                "pending",
                "submitted",
                "successful",
              ].includes(
                item?.status
              )
          );

        if (!mounted || !manualPayment) {
          return;
        }

        setPayment(
          manualPayment
        );

        if (
          manualPayment.status ===
          "submitted"
        ) {
          setPaymentStatus(
            PAYMENT_STATUS.SUBMITTED
          );
        } else if (
          manualPayment.status ===
          "successful"
        ) {
          setPaymentStatus(
            PAYMENT_STATUS.SUCCESSFUL
          );
        } else {
          setPaymentStatus(
            PAYMENT_STATUS.PENDING
          );
        }
      } catch (loadError) {
        console.warn(
          "Unable to load existing manual payment:",
          loadError
        );
      }
    };

    loadExistingPayment();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================
     CREATE MANUAL PAYMENT
  ========================================== */

  const handleStartPayment =
    async () => {
      setError("");
      setMessage("");

      try {
        setLoading(true);

        const response =
          await initiateManualMembershipPayment();

        const paymentData =
          response?.data?.payment ||
          response?.payment ||
          null;

        if (!paymentData) {
          throw new Error(
            "The payment record could not be created."
          );
        }

        setPayment(
          paymentData
        );

        setPaymentStatus(
          paymentData.status ===
            "submitted"
            ? PAYMENT_STATUS.SUBMITTED
            : paymentData.status ===
                "successful"
              ? PAYMENT_STATUS.SUCCESSFUL
              : PAYMENT_STATUS.PENDING
        );

        setMessage(
          response?.message ||
            "Your manual M-Pesa payment has been prepared."
        );
      } catch (paymentError) {
        console.error(
          "Unable to create manual membership payment:",
          paymentError
        );

        setError(
          paymentError?.message ||
            "Unable to prepare the M-Pesa payment. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ==========================================
     COPY PAYMENT REFERENCE
  ========================================== */

  const handleCopyReference =
    async () => {
      if (!paymentReference) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          paymentReference
        );

        setMessage(
          "Payment reference copied."
        );
      } catch {
        setMessage(
          "Payment reference: " +
            paymentReference
        );
      }
    };

  /* ==========================================
     SUBMIT M-PESA CODE
  ========================================== */

  const handleSubmitCode =
    async () => {
      setError("");
      setMessage("");

      const code =
        confirmationCode
          .trim()
          .toUpperCase();

      if (!paymentReference) {
        setError(
          "Please start your payment first."
        );
        return;
      }

      if (!code) {
        setError(
          "Enter your M-Pesa confirmation code."
        );
        return;
      }

      if (
        !/^[A-Z0-9]{6,20}$/.test(
          code
        )
      ) {
        setError(
          "Enter a valid M-Pesa confirmation code."
        );
        return;
      }

      try {
        setSubmittingCode(true);

        const response =
          await confirmManualMpesaPayment({
            reference:
              paymentReference,
            confirmationCode:
              code,
          });

        const updatedPayment =
          response?.data?.payment ||
          response?.payment ||
          null;

        if (updatedPayment) {
          setPayment(
            updatedPayment
          );
        } else {
          setPayment(
            (currentPayment) => ({
              ...currentPayment,
              status: "submitted",
              manualMpesa: {
                ...currentPayment?.manualMpesa,
                transactionCode:
                  code,
              },
            })
          );
        }

        setConfirmationCode("");

        setPaymentStatus(
          PAYMENT_STATUS.SUBMITTED
        );

        setMessage(
          response?.message ||
            "Your M-Pesa confirmation code has been submitted and is awaiting verification."
        );
      } catch (paymentError) {
        console.error(
          "Unable to submit M-Pesa confirmation code:",
          paymentError
        );

        setError(
          paymentError?.message ||
            "Unable to submit your M-Pesa confirmation code. Please try again."
        );
      } finally {
        setSubmittingCode(false);
      }
    };

  /* ==========================================
     CHECK PAYMENT STATUS
  ========================================== */

  const handleCheckStatus =
  async () => {
    if (!paymentReference) {
      return;
    }

    setError("");
    setMessage("");

    try {
      setCheckingStatus(true);

      const response =
        await getPaymentHistory({
          paymentFor: "membership",
          limit: 20,
        });

      const payments =
        response?.data?.payments ||
        response?.data?.items ||
        response?.payments ||
        [];

      const updatedPayment =
        payments.find(
          (item) =>
            item?.reference ===
            paymentReference
        );

      if (!updatedPayment) {
        throw new Error(
          "We could not find this payment in your payment history."
        );
      }

      setPayment(
        updatedPayment
      );

      if (
        updatedPayment.status ===
        "successful"
      ) {
        setPaymentStatus(
          PAYMENT_STATUS.SUCCESSFUL
        );

        await refreshProfile();

        setMessage(
          "Your membership payment has been verified successfully."
        );

        return;
      }

      if (
        updatedPayment.status ===
        "failed"
      ) {
        setPaymentStatus(
          PAYMENT_STATUS.FAILED
        );

        setError(
          updatedPayment.statusMessage ||
            updatedPayment.manualMpesa
              ?.rejectionReason ||
            "Your payment was not approved."
        );

        return;
      }

      if (
        updatedPayment.status ===
        "submitted"
      ) {
        setPaymentStatus(
          PAYMENT_STATUS.SUBMITTED
        );

        setMessage(
          "Your payment is still awaiting verification by JVP Finance/Admin."
        );

        return;
      }

      setPaymentStatus(
        PAYMENT_STATUS.PENDING
      );

      setMessage(
        "Your payment is still being processed."
      );
    } catch (statusError) {
      console.error(
        "Unable to check payment status:",
        statusError
      );

      setError(
        statusError?.message ||
          "Unable to check payment status. Please try again."
      );
    } finally {
      setCheckingStatus(false);
    }
  };

  /* ==========================================
     POLL SUBMITTED PAYMENT
  ========================================== */

  useEffect(() => {
    if (
      paymentStatus !==
        PAYMENT_STATUS.SUBMITTED ||
      !paymentReference
    ) {
      return undefined;
    }

    const interval =
      window.setInterval(
        async () => {
          try {
            const response =
  await getPaymentHistory({
    paymentFor: "membership",
    limit: 20,
  });

const payments =
  response?.data?.payments ||
  response?.data?.items ||
  response?.payments ||
  [];

const updatedPayment =
  payments.find(
    (item) =>
      item?.reference ===
      paymentReference
  );

            if (!updatedPayment) {
              return;
            }

            setPayment(
              updatedPayment
            );

            if (
              updatedPayment.status ===
              "successful"
            ) {
              setPaymentStatus(
                PAYMENT_STATUS.SUCCESSFUL
              );

              await refreshProfile();

              setMessage(
                "Your membership payment has been verified successfully."
              );

              window.clearInterval(
                interval
              );
            }

            if (
              updatedPayment.status ===
              "failed"
            ) {
              setPaymentStatus(
                PAYMENT_STATUS.FAILED
              );

              setError(
                updatedPayment.statusMessage ||
                  updatedPayment.manualMpesa
                    ?.rejectionReason ||
                  "Your payment was not approved."
              );

              window.clearInterval(
                interval
              );
            }
          } catch (pollError) {
            console.warn(
              "Payment status check failed:",
              pollError
            );
          }
        },
        10000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    paymentStatus,
    paymentReference,
    refreshProfile,
  ]);

  /* ==========================================
     RENDER
  ========================================== */

  return (
    <div className="payment-page">
      <div className="payment-card">

        {/* HEADER */}

        <div className="payment-header">
          <ShieldCheck
            size={50}
          />

          <h1>
            Activate Your Membership
          </h1>

          <p>
            Complete your JVP membership
            payment using the official
            JVP M-Pesa Till.
          </p>
        </div>

        {/* ACTIVATION STEPS */}

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

        {/* MEMBERSHIP SUMMARY */}

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
                {paymentStatus ===
                PAYMENT_STATUS.SUBMITTED
                  ? "Awaiting Verification"
                  : paymentStatus ===
                      PAYMENT_STATUS.SUCCESSFUL
                    ? "Payment Verified"
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

        {/* PAYMENT CONTENT */}

        <div className="payment-method">

          {paymentStatus ===
          PAYMENT_STATUS.SUCCESSFUL ? (
            <>
              <div className="payment-success">
                <CheckCircle2
                  size={32}
                />

                <h2>
                  Payment Verified
                </h2>

                <p>
                  Your JVP membership payment
                  has been verified successfully.
                </p>
              </div>

              <button
                type="button"
                className="pay-btn"
                onClick={() =>
                  navigate(
                    "/dashboard",
                    {
                      replace: true,
                    }
                  )
                }
              >
                Continue to Dashboard
              </button>
            </>
          ) : (
            <>
              <h2>
                Pay via M-Pesa Till
              </h2>

              <p>
                Use the official JVP M-Pesa
                Till to pay your membership
                fee.
              </p>

              {/* TILL */}

              <div className="mpesa-till-card">

                <small>
                  JVP M-Pesa Till Number
                </small>

                <strong>
                  {JVP_MPESA_TILL_NUMBER ||
                    "Till number not configured"}
                </strong>

              </div>

              {!JVP_MPESA_TILL_NUMBER && (
                <div
                  className="payment-error"
                  role="alert"
                >
                  The JVP M-Pesa Till number
                  has not been configured.
                </div>
              )}

              {/* INSTRUCTIONS */}

              <div className="mpesa-instructions">

                <h3>
                  How to Pay
                </h3>

                <ol>
                  <li>
                    Open M-Pesa on your
                    phone.
                  </li>

                  <li>
                    Select{" "}
                    <strong>
                      Lipa na M-Pesa
                    </strong>.
                  </li>

                  <li>
                    Select{" "}
                    <strong>
                      Buy Goods and Services
                    </strong>.
                  </li>

                  <li>
                    Enter the JVP Till
                    number shown above.
                  </li>

                  <li>
                    Enter{" "}
                    <strong>
                      KES {amount}
                    </strong>.
                  </li>

                  <li>
                    Enter your M-Pesa PIN
                    and complete the payment.
                  </li>

                  <li>
                    Keep the M-Pesa
                    confirmation message.
                  </li>
                </ol>

              </div>

              {/* START PAYMENT */}

              {!paymentReference && (
                <button
                  type="button"
                  className="pay-btn"
                  onClick={
                    handleStartPayment
                  }
                  disabled={
                    loading ||
                    !JVP_MPESA_TILL_NUMBER
                  }
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={20}
                        className="spin"
                      />

                      Preparing Payment...
                    </>
                  ) : (
                    <>
                      <Smartphone
                        size={20}
                      />

                      I've Paid / Start Payment
                    </>
                  )}
                </button>
              )}

              {/* PAYMENT REFERENCE */}

              {paymentReference && (
                <div className="payment-reference-card">

                  <div>
                    <small>
                      JVP Payment Reference
                    </small>

                    <strong>
                      {paymentReference}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleCopyReference
                    }
                    title="Copy payment reference"
                  >
                    <Clipboard
                      size={18}
                    />
                  </button>

                </div>
              )}

              {/* CONFIRMATION CODE */}

              {paymentReference &&
                paymentStatus !==
                  PAYMENT_STATUS.SUBMITTED &&
                paymentStatus !==
                  PAYMENT_STATUS.SUCCESSFUL && (
                  <div className="mpesa-confirmation">

                    <label htmlFor="mpesa-code">
                      M-Pesa Confirmation Code
                    </label>

                    <input
                      id="mpesa-code"
                      type="text"
                      value={
                        confirmationCode
                      }
                      onChange={(
                        event
                      ) =>
                        setConfirmationCode(
                          event.target.value
                            .toUpperCase()
                        )
                      }
                      placeholder="e.g. ABC123XYZ"
                      autoComplete="off"
                      maxLength={20}
                      disabled={
                        submittingCode
                      }
                    />

                    <small>
                      Enter the confirmation
                      code exactly as it appears
                      in your M-Pesa message.
                    </small>

                    <button
                      type="button"
                      className="pay-btn"
                      onClick={
                        handleSubmitCode
                      }
                      disabled={
                        submittingCode ||
                        !confirmationCode.trim()
                      }
                    >
                      {submittingCode ? (
                        <>
                          <Loader2
                            size={20}
                            className="spin"
                          />

                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            size={20}
                          />

                          Submit Confirmation Code
                        </>
                      )}
                    </button>

                  </div>
                )}

              {/* SUBMITTED */}

              {paymentStatus ===
                PAYMENT_STATUS.SUBMITTED && (
                <div className="payment-success">

                  <CheckCircle2
                    size={32}
                  />

                  <h2>
                    Payment Submitted
                  </h2>

                  <p>
                    Your M-Pesa confirmation
                    code has been submitted
                    successfully.
                  </p>

                  <p>
                    JVP Finance/Admin will
                    verify your payment before
                    activating your membership.
                  </p>

                  {transactionCode && (
                    <small>
                      Confirmation Code:{" "}
                      <strong>
                        {transactionCode}
                      </strong>
                    </small>
                  )}

                  <button
                    type="button"
                    className="pay-btn"
                    onClick={
                      handleCheckStatus
                    }
                    disabled={
                      checkingStatus
                    }
                  >
                    {checkingStatus ? (
                      <>
                        <Loader2
                          size={20}
                          className="spin"
                        />

                        Checking...
                      </>
                    ) : (
                      "Check Payment Status"
                    )}
                  </button>

                </div>
              )}

              {/* FAILED */}

              {paymentStatus ===
                PAYMENT_STATUS.FAILED && (
                <div
                  className="payment-error"
                  role="alert"
                >
                  <strong>
                    Payment Not Approved
                  </strong>

                  <p>
                    {payment?.manualMpesa
                      ?.rejectionReason ||
                      payment?.statusMessage ||
                      "Your payment could not be verified."}
                  </p>

                  <button
                    type="button"
                    className="pay-btn"
                    onClick={() => {
                      setPaymentStatus(
                        PAYMENT_STATUS.PENDING
                      );
                      setPayment(
                        null
                      );
                      setConfirmationCode(
                        ""
                      );
                      setError("");
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* ERROR */}

              {error && (
                <div
                  className="payment-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* MESSAGE */}

              {message && (
                <div
                  className="payment-success"
                  role="status"
                >
                  {message}
                </div>
              )}

            </>
          )}

          {/* SECURITY */}

          <small className="payment-security-note">
            JVP Connect will never ask you for
            your M-Pesa PIN. Only enter your
            M-Pesa confirmation code after
            completing the payment.
          </small>

        </div>
      </div>
    </div>
  );
}

export default Payment;
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { usePayment } from "../../context/PaymentContext";
import { useAuth } from "../../context/AuthContext";

import "./Payment.css";

function PaymentSuccess() {

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const transactionId =

    searchParams.get("transaction_id") ||

    searchParams.get("transactionId");

  const {

    verifyMembershipPayment,

  } = usePayment();

  const {

    refreshProfile,

  } = useAuth();

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {

    const verify = async () => {

      try {

        if (!transactionId) {

          throw new Error(

            "Missing transaction ID."

          );

        }

        await verifyMembershipPayment(

          transactionId

        );

        await refreshProfile();

        setLoading(false);

        setTimeout(() => {

          navigate(

            "/dashboard",

            {

              replace: true,

            }

          );

        }, 2500);

      } catch (err) {

        setLoading(false);

        setError(

          err.response?.data?.message ||

          err.message ||

          "Unable to verify payment."

        );

      }

    };

    verify();

  }, [

    transactionId,

    verifyMembershipPayment,

    refreshProfile,

    navigate,

  ]);

  if (loading) {

    return (

      <div className="payment-result">

        <LoaderCircle

          size={60}

          className="spin"

        />

        <h2>

          Verifying your payment...

        </h2>

        <p>

          Please wait while we activate your membership.

        </p>

      </div>

    );

  }

  if (error) {

    return (

      <div className="payment-result">

        <h2>

          Payment Verification Failed

        </h2>

        <p>{error}</p>

        <button

          className="payment-button"

          onClick={() =>

            navigate("/payment")

          }

        >

          Try Again

        </button>

      </div>

    );

  }

  return (

    <div className="payment-result success">

      <CheckCircle2

        size={72}

      />

      <h1>

        Payment Successful!

      </h1>

      <p>

        Your membership has been activated successfully.

      </p>

      <p>

        Redirecting to your dashboard...

      </p>

    </div>

  );

}

export default PaymentSuccess;
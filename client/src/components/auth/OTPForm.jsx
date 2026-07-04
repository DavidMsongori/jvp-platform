import { useState } from "react";
import "./OTPForm.css";

function OTPForm() {

  const [otp, setOtp] = useState("");

  const handleSubmit = (e) => {

    e.preventDefault();

    console.log(otp);

  };

  return (

    <>

      <div className="otp-header">

        <h2>

          Verify Your Identity

        </h2>

        <p>

          We have sent a 6-digit verification
          code to your phone number or email.

        </p>

      </div>

      <form
        onSubmit={handleSubmit}
        className="otp-form"
      >

        <input

          type="text"

          maxLength={6}

          placeholder="Enter 6-digit code"

          value={otp}

          onChange={(e)=>setOtp(e.target.value)}

        />

        <button>

          Verify Code

        </button>

      </form>

      <button className="resend">

        Resend Code

      </button>

    </>

  );

}

export default OTPForm;
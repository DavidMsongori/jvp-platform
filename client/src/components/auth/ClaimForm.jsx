import { useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import "./ClaimForm.css";

function ClaimForm() {

  const [value, setValue] = useState("");

  const handleSubmit = (e) => {

    e.preventDefault();

    console.log(value);

  };

  return (

    <>

      <div className="claim-header">

        <h2>

          Activate Existing Membership

        </h2>

        <p>

          If you were previously registered
          with JVP, enter the email address
          or phone number you used before.

        </p>

      </div>

      <form
        onSubmit={handleSubmit}
        className="claim-form"
      >

        <label>

          Email Address or Phone Number

        </label>

        <div className="claim-input">

          <FaEnvelope />

          <input

            type="text"

            placeholder="Email or Phone Number"

            value={value}

            onChange={(e)=>setValue(e.target.value)}

          />

        </div>

        <button>

          Continue

        </button>

      </form>

    </>

  );

}

export default ClaimForm;
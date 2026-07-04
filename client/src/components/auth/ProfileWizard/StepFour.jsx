import { useState } from "react";

import FormInput from "../../ui/FormInput";
import FormButton from "../../ui/FormButton";

import { FaLock } from "react-icons/fa";

import { useMember } from "../../../context/MemberContext";

function StepFour({ back }) {

  const { member, updateMember } = useMember();

  const [confirmPassword, setConfirmPassword] = useState("");

  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleFinish = () => {

    if (!member.password) {
      alert("Please create a password.");
      return;
    }

    if (member.password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!acceptTerms) {
      alert("Please accept the Terms & Conditions.");
      return;
    }

    console.log("Member Profile");

    console.log(member);

    // TODO:
    // Send member object to backend

    // navigate("/dashboard");

  };

  return (

    <div className="wizard-step-content">

      <h2>

        Secure Your Account

      </h2>

      <p>

        Create a secure password to complete
        your JVP Connect account activation.

      </p>

      <FormInput

        label="Password"

        type="password"

        icon={<FaLock />}

        value={member.password}

        onChange={(e)=>

          updateMember({

            password:e.target.value

          })

        }

      />

      <FormInput

        label="Confirm Password"

        type="password"

        icon={<FaLock />}

        value={confirmPassword}

        onChange={(e)=>

          setConfirmPassword(

            e.target.value

          )

        }

      />

      <label className="terms-check">

        <input

          type="checkbox"

          checked={acceptTerms}

          onChange={(e)=>

            setAcceptTerms(

              e.target.checked

            )

          }

        />

        I agree to the JVP Connect
        Terms & Conditions and
        Privacy Policy.

      </label>

      <div className="wizard-buttons">

        <button

          type="button"

          className="secondary-button"

          onClick={back}

        >

          ← Back

        </button>

        <FormButton

          type="button"

          onClick={handleFinish}

        >

          Finish Registration

        </FormButton>

      </div>

    </div>

  );

}

export default StepFour;
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
} from "react-icons/fa";

import FormInput from "../../ui/FormInput";
import FormSelect from "../../ui/FormSelect";
import FormButton from "../../ui/FormButton";

import { useMember } from "../../../context/MemberContext";

function StepOne({ next }) {
  const { member, updateMember } = useMember();

  const countyOptions = [
    { value: "", label: "Select County" },
    { value: "Mombasa", label: "Mombasa" },
    { value: "Kwale", label: "Kwale" },
    { value: "Kilifi", label: "Kilifi" },
    { value: "Tana River", label: "Tana River" },
    { value: "Lamu", label: "Lamu" },
    { value: "Taita Taveta", label: "Taita Taveta" },
  ];

  const genderOptions = [
    { value: "", label: "Select Gender" },
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  const handleNext = () => {
    if (
      !member.firstName ||
      !member.lastName ||
      !member.phone ||
      !member.email ||
      !member.county
    ) {
      alert("Please complete all required fields.");
      return;
    }

    next();
  };

  return (
    <div className="wizard-step-content">

      <h2>Personal Information</h2>

      <p>
        Please confirm your personal information before
        continuing. Information imported from the previous
        JVP system can be edited if necessary.
      </p>

      <FormInput
        label="First Name"
        icon={<FaUser />}
        placeholder="Enter your first name"
        value={member.firstName}
        onChange={(e) =>
          updateMember({ firstName: e.target.value })
        }
        required
      />

      <FormInput
        label="Last Name"
        icon={<FaUser />}
        placeholder="Enter your last name"
        value={member.lastName}
        onChange={(e) =>
          updateMember({ lastName: e.target.value })
        }
        required
      />

      <FormInput
        label="Phone Number"
        icon={<FaPhone />}
        placeholder="07XXXXXXXX"
        value={member.phone}
        onChange={(e) =>
          updateMember({ phone: e.target.value })
        }
        required
      />

      <FormInput
        label="Email Address"
        icon={<FaEnvelope />}
        type="email"
        placeholder="example@email.com"
        value={member.email}
        onChange={(e) =>
          updateMember({ email: e.target.value })
        }
      />

      <FormInput
        label="Date of Birth"
        icon={<FaCalendarAlt />}
        type="date"
        value={member.dob}
        onChange={(e) =>
          updateMember({ dob: e.target.value })
        }
      />

      <FormSelect
        label="County"
        value={member.county}
        onChange={(e) =>
          updateMember({ county: e.target.value })
        }
        options={countyOptions}
      />

      <FormSelect
        label="Gender"
        value={member.gender}
        onChange={(e) =>
          updateMember({ gender: e.target.value })
        }
        options={genderOptions}
      />

      <div className="wizard-buttons">

        <FormButton
          type="button"
          onClick={handleNext}
        >
          Continue →
        </FormButton>

      </div>

    </div>
  );
}

export default StepOne;
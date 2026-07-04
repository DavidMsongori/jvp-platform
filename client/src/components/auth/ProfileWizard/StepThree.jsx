import FormButton from "../../ui/FormButton";
import { useMember } from "../../../context/MemberContext";

function StepThree({ next, back }) {
  const { member, updateMember } = useMember();

  const skills = [
    "Leadership",
    "Public Speaking",
    "Entrepreneurship",
    "Climate Action",
    "Blue Economy",
    "Agriculture",
    "ICT",
    "Research",
    "Project Management",
    "Graphic Design",
    "Photography",
    "Videography",
    "Community Mobilization",
    "Advocacy",
    "Financial Literacy",
    "Event Planning",
  ];

  const interests = [
    "Volunteerism",
    "Leadership",
    "Education",
    "Innovation",
    "Entrepreneurship",
    "Climate Action",
    "Blue Economy",
    "Governance",
    "Mental Health",
    "Youth Empowerment",
    "Community Service",
    "Creative Arts",
    "Sports",
    "Technology",
    "Tourism",
    "Culture",
  ];

  const languages = [
    "English",
    "Kiswahili",
    "French",
    "Arabic",
    "German",
    "Chinese",
  ];

  const toggleSkill = (skill) => {
    if (member.skills.includes(skill)) {
      updateMember({
        skills: member.skills.filter((item) => item !== skill),
      });
    } else {
      updateMember({
        skills: [...member.skills, skill],
      });
    }
  };

  const toggleInterest = (interest) => {
    if (member.interests.includes(interest)) {
      updateMember({
        interests: member.interests.filter((item) => item !== interest),
      });
    } else {
      updateMember({
        interests: [...member.interests, interest],
      });
    }
  };

  const toggleLanguage = (language) => {
    if (member.languages.includes(language)) {
      updateMember({
        languages: member.languages.filter((item) => item !== language),
      });
    } else {
      updateMember({
        languages: [...member.languages, language],
      });
    }
  };

  return (
    <div className="wizard-step-content">

      <h2>Skills & Interests</h2>

      <p>
        Select all that apply. These help us match you with
        opportunities, leadership roles and programmes.
      </p>

      <h3 className="section-heading">
        Professional Skills
      </h3>

      <div className="chip-grid">
        {skills.map((skill) => (
          <button
            key={skill}
            type="button"
            className={
              member.skills.includes(skill)
                ? "chip active"
                : "chip"
            }
            onClick={() => toggleSkill(skill)}
          >
            {skill}
          </button>
        ))}
      </div>

      <h3 className="section-heading">
        JVP Interests
      </h3>

      <div className="chip-grid">
        {interests.map((interest) => (
          <button
            key={interest}
            type="button"
            className={
              member.interests.includes(interest)
                ? "chip active"
                : "chip"
            }
            onClick={() => toggleInterest(interest)}
          >
            {interest}
          </button>
        ))}
      </div>

      <h3 className="section-heading">
        Languages
      </h3>

      <div className="chip-grid">
        {languages.map((language) => (
          <button
            key={language}
            type="button"
            className={
              member.languages.includes(language)
                ? "chip active"
                : "chip"
            }
            onClick={() => toggleLanguage(language)}
          >
            {language}
          </button>
        ))}
      </div>

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
          onClick={next}
        >
          Continue →
        </FormButton>

      </div>

    </div>
  );
}

export default StepThree;
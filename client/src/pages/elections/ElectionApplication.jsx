import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getElection,
  submitApplication,
} from "../../services/election.service";

import "./ElectionApplication.css";

const ElectionApplication = () => {
  const { electionId, positionId } = useParams();
  const navigate = useNavigate();

  const [election, setElection] = useState(null);
  const [position, setPosition] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    statement: "",
    experience: "",
    manifesto: "",
    photo: "",
    declaration: false,
  });

  useEffect(() => {
    const loadElection = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getElection(electionId);
        const electionData = response?.data;

        if (!electionData) {
          throw new Error("Election information was not found.");
        }

        setElection(electionData);

        const selectedPosition = electionData.positions?.find(
          (item) => String(item._id) === String(positionId)
        );

        if (!selectedPosition) {
          throw new Error(
            "The selected position could not be found in this election."
          );
        }

        setPosition(selectedPosition);

        if (electionData.status !== "open") {
          setError(
            "Applications are not currently open for this election."
          );
        }
      } catch (err) {
        console.error(
          "Failed to load application information:",
          err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load the application page."
        );
      } finally {
        setLoading(false);
      }
    };

    loadElection();
  }, [electionId, positionId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!election || !position) {
      setError("Election information is unavailable.");
      return;
    }

    if (election.status !== "open") {
      setError(
        "Applications are not currently open for this election."
      );
      return;
    }

    if (!formData.statement.trim()) {
      setError("Please provide your statement of interest.");
      return;
    }

    if (!formData.declaration) {
      setError(
        "You must confirm the declaration before submitting your application."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await submitApplication(
        electionId,
        positionId,
        {
          statement: formData.statement.trim(),
          experience: formData.experience.trim(),
          manifesto: formData.manifesto.trim(),
          photo: formData.photo.trim(),
          declaration: formData.declaration,
        }
      );

      setSuccess(
        response?.message ||
          "Your application has been submitted successfully."
      );
    } catch (err) {
      console.error("Application submission failed:", err);

      setError(
        err.response?.data?.message ||
          "Unable to submit your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="election-application-page">
        <div className="election-application-container">
          <div className="election-application-loading">
            <div className="election-application-spinner"></div>
            <p>Loading application...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!election || !position) {
    return (
      <div className="election-application-page">
        <div className="election-application-container">
          <div className="election-application-error">
            <div className="election-application-error-icon">
              !
            </div>

            <h2>Application Unavailable</h2>

            <p>
              {error ||
                "The requested election position could not be found."}
            </p>

            <button
              type="button"
              className="election-application-primary-btn"
              onClick={() =>
                navigate(`/dashboard/elections/${electionId}`)
              }
            >
              ← Back to Election
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="election-application-page">
        <div className="election-application-container">
          <div className="election-application-success">
            <div className="election-success-icon">✓</div>

            <span className="election-success-label">
              Application Submitted
            </span>

            <h1>Your application has been received.</h1>

            <p>
              Your application for{" "}
              <strong>{position.name}</strong> has been
              successfully submitted for review.
            </p>

            <p className="election-success-note">
              The JVP election administration team will review your
              application. If approved, you will become an official
              aspirant for this position.
            </p>

            <div className="election-success-actions">
              <button
                type="button"
                className="election-application-primary-btn"
                onClick={() =>
                  navigate(`/dashboard/elections/${electionId}`)
                }
              >
                Back to Election
              </button>

              <button
                type="button"
                className="election-application-secondary-btn"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="election-application-page">
      <div className="election-application-container">
        <button
          type="button"
          className="election-application-back"
          onClick={() =>
            navigate(`/dashboard/elections/${electionId}`)
          }
        >
          ← Back to Election
        </button>

        <section className="election-application-header">
          <div>
            <span className="election-application-eyebrow">
              JVP ELECTIONS
            </span>

            <h1>Application for Office</h1>

            <p>
              Submit your application to participate in the JVP
              leadership election.
            </p>
          </div>
        </section>

        <section className="election-application-position">
          <div className="election-application-position-number">
            #
          </div>

          <div>
            <span>Applying for</span>

            <h2>{position.name}</h2>

            <p>
              {position.level}
              {position.county ? ` • ${position.county}` : ""}
              {position.constituency
                ? ` • ${position.constituency}`
                : ""}
              {position.ward ? ` • ${position.ward}` : ""}
            </p>
          </div>
        </section>

        {error && (
          <div className="election-application-alert election-application-alert-error">
            <span>!</span>
            <p>{error}</p>
          </div>
        )}

        <form
          className="election-application-form"
          onSubmit={handleSubmit}
        >
          <div className="election-form-section">
            <div className="election-form-section-heading">
              <span>01</span>

              <div>
                <h2>Statement of Interest</h2>

                <p>
                  Tell JVP members why you are seeking this position
                  and what you hope to contribute.
                </p>
              </div>
            </div>

            <div className="election-form-group">
              <label htmlFor="statement">
                Statement of Interest <span>*</span>
              </label>

              <textarea
                id="statement"
                name="statement"
                value={formData.statement}
                onChange={handleChange}
                rows={7}
                maxLength={3000}
                placeholder="Explain your motivation for seeking this position, your leadership vision, and what you intend to achieve."
                required
              />

              <div className="election-form-counter">
                {formData.statement.length}/3000
              </div>
            </div>
          </div>

          <div className="election-form-section">
            <div className="election-form-section-heading">
              <span>02</span>

              <div>
                <h2>Leadership Experience</h2>

                <p>
                  Highlight relevant leadership, professional,
                  community, academic, or organizational experience.
                </p>
              </div>
            </div>

            <div className="election-form-group">
              <label htmlFor="experience">
                Experience
              </label>

              <textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows={6}
                maxLength={3000}
                placeholder="Describe relevant leadership positions, achievements, community work, professional experience, or other qualifications."
              />

              <div className="election-form-counter">
                {formData.experience.length}/3000
              </div>
            </div>
          </div>

          <div className="election-form-section">
            <div className="election-form-section-heading">
              <span>03</span>

              <div>
                <h2>Manifesto</h2>

                <p>
                  Present your priorities and the change you would
                  like to pursue if elected.
                </p>
              </div>
            </div>

            <div className="election-form-group">
              <label htmlFor="manifesto">
                Manifesto
              </label>

              <textarea
                id="manifesto"
                name="manifesto"
                value={formData.manifesto}
                onChange={handleChange}
                rows={9}
                maxLength={5000}
                placeholder="Outline your key priorities, proposed programmes, leadership commitments, and how you will represent JVP members."
              />

              <div className="election-form-counter">
                {formData.manifesto.length}/5000
              </div>
            </div>
          </div>

          <div className="election-form-section">
            <div className="election-form-section-heading">
              <span>04</span>

              <div>
                <h2>Candidate Photo</h2>

                <p>
                  You may provide a URL for your official campaign
                  or candidate photograph.
                </p>
              </div>
            </div>

            <div className="election-form-group">
              <label htmlFor="photo">
                Photo URL
              </label>

              <input
                id="photo"
                name="photo"
                type="url"
                value={formData.photo}
                onChange={handleChange}
                placeholder="https://example.com/your-photo.jpg"
              />

              <small className="election-form-help">
                Image upload integration can be added later. For
                now, provide a publicly accessible image URL.
              </small>
            </div>
          </div>

          <div className="election-form-section election-declaration-section">
            <div className="election-form-section-heading">
              <span>05</span>

              <div>
                <h2>Declaration</h2>

                <p>
                  Confirm that the information provided in this
                  application is accurate.
                </p>
              </div>
            </div>

            <label className="election-declaration">
              <input
                type="checkbox"
                name="declaration"
                checked={formData.declaration}
                onChange={handleChange}
              />

              <span className="election-custom-checkbox"></span>

              <span className="election-declaration-text">
                I declare that the information provided in this
                application is true and accurate to the best of my
                knowledge. I understand that my application will be
                subject to the JVP election vetting process and that
                submitting an application does not automatically
                qualify me as an aspirant.
              </span>
            </label>
          </div>

          <div className="election-application-submit">
            <div>
              <strong>Ready to submit?</strong>

              <p>
                Review your information before submitting your
                application.
              </p>
            </div>

            <button
              type="submit"
              className="election-application-submit-btn"
              disabled={
                submitting || election.status !== "open"
              }
            >
              {submitting ? (
                <>
                  <span className="election-button-spinner"></span>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ElectionApplication;

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import awardService from "../../services/awardService";
import "./PublicAwardNomination.css";

const counties = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita Taveta",
];

const initialForm = {
  categoryId: "",
  fullName: "",
  email: "",
  phone: "",
  county: "",
  constituency: "",
  ward: "",
  dateOfBirth: "",
  currentRole: "",
  nominationStatement: "",
  achievements: "",
  evidenceLinks: [""],
  nomineeConsent: false,
};

export default function PublicAwardNomination() {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    ...initialForm,
    categoryId: searchParams.get("categoryId") || "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const response = await awardService.getAwardCategories();
        const data = Array.isArray(response)
          ? response
          : response?.data || response?.categories || [];

        if (active) {
          setCategories(data);
        }
      } catch {
        if (active) {
          setError("Unable to load award categories. Please refresh and try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function updateEvidence(index, value) {
    setForm((previous) => ({
      ...previous,
      evidenceLinks: previous.evidenceLinks.map((link, i) =>
        i === index ? value : link
      ),
    }));
  }

  function addEvidenceLink() {
    if (form.evidenceLinks.length >= 10) return;

    setForm((previous) => ({
      ...previous,
      evidenceLinks: [...previous.evidenceLinks, ""],
    }));
  }

  function removeEvidenceLink(index) {
    setForm((previous) => ({
      ...previous,
      evidenceLinks: previous.evidenceLinks.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.nomineeConsent) {
      setError("Please confirm that the nominee has consented.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...form,
        evidenceLinks: form.evidenceLinks
          .map((link) => link.trim())
          .filter(Boolean),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        constituency: form.constituency.trim() || undefined,
        ward: form.ward.trim() || undefined,
        currentRole: form.currentRole.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      };

      const response = await awardService.submitAwardNomination(payload);

      setSuccess(
        response?.message ||
          "Your nomination has been submitted successfully for Secretariat review."
      );

      setForm(initialForm);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "We could not submit your nomination. Please check your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="public-nomination-page">
      <header className="nomination-header">
        <Link to="/awards" className="nomination-back">
          ← Back to Awards
        </Link>
        <p className="nomination-eyebrow">JVP Coastal Youth Excellence Awards</p>
        <h1>Nominate a Changemaker</h1>
        <p>
          Tell us about a young person whose leadership, service, innovation,
          or community impact deserves recognition.
        </p>
      </header>

      <section className="nomination-card">
        <div className="nomination-intro">
          <h2>Nomination form</h2>
          <p>
            Complete the required fields. Submissions are subject to eligibility
            checks and review by the JVP Awards Secretariat.
          </p>
        </div>

        {error && (
          <div className="nomination-alert error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="nomination-alert success" role="status">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="nomination-field">
            <label htmlFor="categoryId">Award category *</label>
            <select
              id="categoryId"
              name="categoryId"
              value={form.categoryId}
              onChange={updateField}
              required
              disabled={loading}
            >
              <option value="">
                {loading ? "Loading categories..." : "Select a category"}
              </option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name || category.title}
                </option>
              ))}
            </select>
            {!loading && categories.length === 0 && (
              <small>No categories are currently available.</small>
            )}
          </div>

          <h3>Nominee information</h3>

          <div className="nomination-field">
            <label htmlFor="fullName">Full name *</label>
            <input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={updateField}
              maxLength={150}
              required
              autoComplete="name"
              placeholder="Enter the nominee's full name"
            />
          </div>

          <div className="nomination-two-columns">
            <div className="nomination-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                autoComplete="email"
                placeholder="name@example.com"
              />
            </div>

            <div className="nomination-field">
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={updateField}
                autoComplete="tel"
                placeholder="+254..."
              />
            </div>
          </div>

          <div className="nomination-two-columns">
            <div className="nomination-field">
              <label htmlFor="county">County *</label>
              <select
                id="county"
                name="county"
                value={form.county}
                onChange={updateField}
                required
              >
                <option value="">Select county</option>
                {counties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            <div className="nomination-field">
              <label htmlFor="dateOfBirth">Date of birth *</label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={updateField}
                required
              />
            </div>
          </div>

          <div className="nomination-two-columns">
            <div className="nomination-field">
              <label htmlFor="constituency">Constituency</label>
              <input
                id="constituency"
                name="constituency"
                value={form.constituency}
                onChange={updateField}
                placeholder="Constituency"
              />
            </div>

            <div className="nomination-field">
              <label htmlFor="ward">Ward</label>
              <input
                id="ward"
                name="ward"
                value={form.ward}
                onChange={updateField}
                placeholder="Ward"
              />
            </div>
          </div>

          <div className="nomination-field">
            <label htmlFor="currentRole">Current role or organisation</label>
            <input
              id="currentRole"
              name="currentRole"
              value={form.currentRole}
              onChange={updateField}
              maxLength={200}
              placeholder="Role, organisation, or initiative"
            />
          </div>

          <h3>Achievements and impact</h3>

          <div className="nomination-field">
            <label htmlFor="nominationStatement">
              Why should this person be nominated? *
            </label>
            <textarea
              id="nominationStatement"
              name="nominationStatement"
              value={form.nominationStatement}
              onChange={updateField}
              minLength={30}
              maxLength={3000}
              rows={5}
              required
              placeholder="Explain why the nominee deserves this award (30–3,000 characters)."
            />
          </div>

          <div className="nomination-field">
            <label htmlFor="achievements">Key achievements and evidence of impact *</label>
            <textarea
              id="achievements"
              name="achievements"
              value={form.achievements}
              onChange={updateField}
              minLength={30}
              maxLength={5000}
              rows={6}
              required
              placeholder="Describe achievements, projects, results, and community impact (30–5,000 characters)."
            />
          </div>

          <div className="nomination-field">
            <label>Evidence links (optional)</label>
            {form.evidenceLinks.map((link, index) => (
              <div className="nomination-evidence-row" key={index}>
                <input
                  type="url"
                  value={link}
                  onChange={(event) => updateEvidence(index, event.target.value)}
                  placeholder="https://..."
                  aria-label={`Evidence link ${index + 1}`}
                />
                {form.evidenceLinks.length > 1 && (
                  <button
                    type="button"
                    className="nomination-remove-link"
                    onClick={() => removeEvidenceLink(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            {form.evidenceLinks.length < 10 && (
              <button
                type="button"
                className="nomination-add-link"
                onClick={addEvidenceLink}
              >
                + Add another evidence link
              </button>
            )}
          </div>

          <label className="nomination-consent">
            <input
              type="checkbox"
              name="nomineeConsent"
              checked={form.nomineeConsent}
              onChange={updateField}
              required
            />
            <span>
              I confirm that the nominee has consented to this nomination and
              the information provided is accurate to the best of my knowledge. *
            </span>
          </label>

          <button
            type="submit"
            className="nomination-submit"
            disabled={loading || submitting || categories.length === 0}
          >
            {submitting ? "Submitting nomination..." : "Submit nomination"}
          </button>

          <p className="nomination-privacy-note">
            Your submission will be reviewed by the JVP Awards Secretariat.
            Submission does not guarantee approval or placement on the ballot.
          </p>
        </form>
      </section>
    </main>
  );
}

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";

import PageLayout from "../../components/common/PageLayout";

import { useContact } from "../../context/ContactContext";

import "./Contact.css";

const CONTACT_CATEGORIES = [
  {
    value: "general",
    label: "General Enquiry",
  },
  {
    value: "membership",
    label: "Membership",
  },
  {
    value: "programmes",
    label: "Programmes",
  },
  {
    value: "partnerships",
    label: "Partnerships",
  },
  {
    value: "media",
    label: "Media & Press",
  },
  {
    value: "events",
    label: "Events",
  },
  {
    value: "leadership",
    label: "Leadership",
  },
  {
    value: "opportunities",
    label: "Opportunities",
  },
  {
    value: "support",
    label: "Support",
  },
  {
    value: "complaints",
    label: "Complaints",
  },
  {
    value: "other",
    label: "Other",
  },
];

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  category: "general",
  subject: "",
  message: "",
};

function Contact() {
  const {
    submitContact,
    submissionLoading,
    submissionError,
    submissionSuccess,
    submissionResult,
    resetSubmission,
  } = useContact();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));

    if (submissionError) {
      resetSubmission();
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Please enter your name.";
    } else if (form.name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!form.subject.trim()) {
      nextErrors.subject = "Please enter a subject.";
    }

    if (!form.message.trim()) {
      nextErrors.message = "Please enter your message.";
    } else if (form.message.trim().length < 10) {
      nextErrors.message =
        "Message must be at least 10 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await submitContact({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
        source: "website",
      });

      setForm(INITIAL_FORM);
      setErrors({});
    } catch {
      // Submission error is handled by ContactContext.
    }
  };

  const handleNewMessage = () => {
    resetSubmission();
    setForm(INITIAL_FORM);
    setErrors({});
  };

  return (
    <PageLayout>
      <main className="contact-page">
        {/* HERO */}
        <section className="contact-hero">
          <div className="contact-container">
            <div className="contact-hero__content">
              <span className="contact-eyebrow">
                JVP Secretariat
              </span>

              <h1>Let&apos;s Talk</h1>

              <p>
                Have a question, idea, partnership proposal, or
                need support? Reach out to the JVP Secretariat.
              </p>
            </div>
          </div>
        </section>

        {/* CONTACT CONTENT */}
        <section className="contact-section">
          <div className="contact-container">
            <div className="contact-grid">
              {/* LEFT */}
              <aside className="contact-info">
                <div className="contact-section-heading">
                  <span>Get in touch</span>

                  <h2>We&apos;re here to listen.</h2>

                  <p>
                    Whether you want to connect with JVP, learn
                    about our programmes, explore a partnership,
                    or raise an issue, our Secretariat is ready
                    to hear from you.
                  </p>
                </div>

                <div className="contact-info-list">
                  <a
                    href="mailto:jumuiyayavijanawapwani@gmail.com"
                    className="contact-info-card"
                  >
                    <span className="contact-info-card__icon">
                      <Mail size={19} />
                    </span>

                    <span className="contact-info-card__content">
                      <small>Email</small>
                      <strong>
                        jumuiyayavijanawapwani@gmail.com
                      </strong>
                    </span>
                  </a>

                  <div className="contact-info-card">
                    <span className="contact-info-card__icon">
                      <MapPin size={19} />
                    </span>

                    <span className="contact-info-card__content">
                      <small>Coverage</small>
                      <strong>Coast Region, Kenya</strong>
                    </span>
                  </div>

                  <div className="contact-info-card">
                    <span className="contact-info-card__icon">
                      <Clock3 size={19} />
                    </span>

                    <span className="contact-info-card__content">
                      <small>Secretariat Hours</small>
                      <strong>
                        Monday – Friday · 8:00 AM – 5:00 PM
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="contact-info-note">
                  <MessageSquare size={18} />

                  <div>
                    <strong>Need a response?</strong>

                    <p>
                      Include your preferred contact details
                      and enough information for the
                      Secretariat to assist you efficiently.
                    </p>
                  </div>
                </div>
              </aside>

              {/* RIGHT — FORM */}
              <div className="contact-form-wrapper">
                {submissionSuccess ? (
                  <div className="contact-success">
                    <div className="contact-success__icon">
                      <CheckCircle2 size={32} />
                    </div>

                    <span className="contact-success__eyebrow">
                      Message received
                    </span>

                    <h2>Thank you for reaching out.</h2>

                    <p>
                      Your message has been successfully sent to
                      the JVP Secretariat. We&apos;ll review your
                      enquiry and get back to you.
                    </p>

                    {submissionResult?.contact?.reference && (
                      <div className="contact-reference">
                        <span>Reference Number</span>
                        <strong>
                          {submissionResult.contact.reference}
                        </strong>
                      </div>
                    )}

                    <button
                      type="button"
                      className="contact-button contact-button--secondary"
                      onClick={handleNewMessage}
                    >
                      Send another message
                      <ArrowRight size={17} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="contact-form-header">
                      <div>
                        <span>Send us a message</span>
                        <h2>How can we help?</h2>
                      </div>

                      <div className="contact-form-icon">
                        <Send size={19} />
                      </div>
                    </div>

                    {submissionError && (
                      <div className="contact-alert contact-alert--error">
                        <strong>Unable to send message</strong>
                        <span>{submissionError}</span>
                      </div>
                    )}

                    <form
                      className="contact-form"
                      onSubmit={handleSubmit}
                      noValidate
                    >
                      <div className="contact-form-row">
                        <div className="contact-field">
                          <label htmlFor="name">
                            Full Name
                            <span>*</span>
                          </label>

                          <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            autoComplete="name"
                            className={
                              errors.name
                                ? "has-error"
                                : ""
                            }
                          />

                          {errors.name && (
                            <small className="contact-field-error">
                              {errors.name}
                            </small>
                          )}
                        </div>

                        <div className="contact-field">
                          <label htmlFor="email">
                            Email Address
                            <span>*</span>
                          </label>

                          <input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            autoComplete="email"
                            className={
                              errors.email
                                ? "has-error"
                                : ""
                            }
                          />

                          {errors.email && (
                            <small className="contact-field-error">
                              {errors.email}
                            </small>
                          )}
                        </div>
                      </div>

                      <div className="contact-form-row">
                        <div className="contact-field">
                          <label htmlFor="phone">
                            Phone Number
                            <small>Optional</small>
                          </label>

                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="07XX XXX XXX"
                            autoComplete="tel"
                          />
                        </div>

                        <div className="contact-field">
                          <label htmlFor="category">
                            Enquiry Type
                            <span>*</span>
                          </label>

                          <select
                            id="category"
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                          >
                            {CONTACT_CATEGORIES.map(
                              (category) => (
                                <option
                                  key={category.value}
                                  value={category.value}
                                >
                                  {category.label}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="contact-field">
                        <label htmlFor="subject">
                          Subject
                          <span>*</span>
                        </label>

                        <input
                          id="subject"
                          name="subject"
                          type="text"
                          value={form.subject}
                          onChange={handleChange}
                          placeholder="What would you like to talk about?"
                          className={
                            errors.subject
                              ? "has-error"
                              : ""
                          }
                        />

                        {errors.subject && (
                          <small className="contact-field-error">
                            {errors.subject}
                          </small>
                        )}
                      </div>

                      <div className="contact-field">
                        <div className="contact-message-label">
                          <label htmlFor="message">
                            Message
                            <span>*</span>
                          </label>

                          <small>
                            {form.message.length}/5000
                          </small>
                        </div>

                        <textarea
                          id="message"
                          name="message"
                          rows="7"
                          maxLength="5000"
                          value={form.message}
                          onChange={handleChange}
                          placeholder="Write your message here..."
                          className={
                            errors.message
                              ? "has-error"
                              : ""
                          }
                        />

                        {errors.message && (
                          <small className="contact-field-error">
                            {errors.message}
                          </small>
                        )}
                      </div>

                      <div className="contact-form-footer">
                        <p>
                          By submitting this form, your message
                          will be sent to the JVP Secretariat for
                          review.
                        </p>

                        <button
                          type="submit"
                          className="contact-button"
                          disabled={submissionLoading}
                        >
                          {submissionLoading ? (
                            <>
                              <span className="contact-spinner" />
                              Sending...
                            </>
                          ) : (
                            <>
                              Send Message
                              <ArrowRight size={17} />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageLayout>
  );
}

export default Contact;
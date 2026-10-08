import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";

import { useContact } from "../../../../context/ContactContext";

import "./ContactReplyBox.css";

const MAX_LENGTH = 10000;

function ContactReplyBox({ contact }) {
  const {
    respondToContact,
    fetchContact,
  } = useContact();

  const [response, setResponse] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | RESET WHEN CONTACT CHANGES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setResponse("");
    setSending(false);
    setError("");
    setSuccess(false);
  }, [contact?._id]);

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const value = event.target.value;

    setResponse(value);

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT RESPONSE
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = response.trim();

    if (!message) {
      setError("Please enter a response before sending.");
      return;
    }

    if (message.length > MAX_LENGTH) {
      setError(
        `Response cannot exceed ${MAX_LENGTH.toLocaleString()} characters.`
      );
      return;
    }

    if (!contact?._id) {
      setError("No contact enquiry has been selected.");
      return;
    }

    setSending(true);
    setError("");
    setSuccess(false);

    try {
      await respondToContact(
        contact._id,
        message
      );

      /*
       * Refresh the selected contact so the drawer immediately
       * reflects the newly saved response and responded status.
       */
      await fetchContact(contact._id);

      setResponse("");
      setSuccess(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to send the response. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="contact-reply">
      <div className="contact-reply__header">
        <div>
          <span>Reply to enquiry</span>
          <h3>Send a response</h3>
        </div>

        <div className="contact-reply__icon">
          <Send size={16} />
        </div>
      </div>

      {success && (
        <div className="contact-reply__success">
          <CheckCircle2 size={15} />

          <span>
            Response saved successfully.
          </span>
        </div>
      )}

      {error && (
        <div className="contact-reply__error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="contact-reply__field">
          <textarea
            value={response}
            onChange={handleChange}
            maxLength={MAX_LENGTH}
            rows={5}
            placeholder="Write your response to the sender..."
            disabled={sending}
          />

          <div className="contact-reply__counter">
            <span>
              Your response will be recorded against this
              enquiry.
            </span>

            <strong>
              {response.length.toLocaleString()}/
              {MAX_LENGTH.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="contact-reply__footer">
          <p>
            The response will be saved to the contact record.
          </p>

          <button
            type="submit"
            disabled={
              sending ||
              !response.trim()
            }
          >
            {sending ? (
              <>
                <Loader2
                  size={15}
                  className="contact-reply__spinner"
                />
                Sending...
              </>
            ) : (
              <>
                <Send size={15} />
                Send Response
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ContactReplyBox;
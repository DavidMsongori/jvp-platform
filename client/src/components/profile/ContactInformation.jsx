import { useEffect, useState } from "react";

import {
  Mail,
  Phone,
  MapPin,
  Save,
  Pencil,
  X,
} from "lucide-react";

import {
  updateMyProfile,
} from "../../services/member.service";

import {
  useProfile,
} from "../../context/ProfileContext";

import "./ContactInformation.css";

function ContactInformation() {

  const {

    profile,

    reloadProfile,

  } = useProfile();

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [form, setForm] =
    useState({

      phone: "",

      county: "",

    });

  useEffect(() => {

    if (!profile) return;

    setForm({

      phone:

        profile.phone || "",

      county:

        profile.county || "",

    });

  }, [profile]);

  const handleChange = (event) => {

    setForm({

      ...form,

      [event.target.name]:

        event.target.value,

    });

  };

  const handleSubmit = async (event) => {

    event.preventDefault();

    try {

      setSaving(true);

      setError("");

      setSuccess("");

      await updateMyProfile(form);

      await reloadProfile();

      setEditing(false);

      setSuccess(

        "Contact information updated successfully."

      );

    } catch (err) {

      console.error(err);

      setError(

        err.response?.data?.message ||

        "Unable to update contact information."

      );

    } finally {

      setSaving(false);

    }

  };

  return (

    <section className="contact-information">

      <div className="section-header">

        <div>

          <h2>

            <Phone size={22} />

            Contact Information

          </h2>

          <p>

            Keep your contact details up to date.

          </p>

        </div>

        {

          !editing ? (

            <button

              className="edit-btn"

              onClick={() =>

                setEditing(true)

              }

            >

              <Pencil size={16} />

              Edit

            </button>

          ) : (

            <button

              className="cancel-btn"

              onClick={() =>

                setEditing(false)

              }

            >

              <X size={16} />

              Cancel

            </button>

          )

        }

      </div>

      <form
        onSubmit={handleSubmit}
      >

        <div className="contact-grid">

          {/* EMAIL */}

          <div className="form-group">

            <label>

              Email Address

            </label>

            <div className="input-icon">

              <Mail size={18} />

              <input

                value={

                  profile?.user?.email ||

                  profile?.email ||

                  ""

                }

                disabled

              />

            </div>

          </div>

          {/* PHONE */}

          <div className="form-group">

            <label>

              Phone Number

            </label>

            <div className="input-icon">

              <Phone size={18} />

              <input

                name="phone"

                value={form.phone}

                onChange={handleChange}

                disabled={!editing}

              />

            </div>

          </div>

          {/* COUNTY */}

          <div className="form-group">

            <label>

              County

            </label>

            <div className="input-icon">

              <MapPin size={18} />

              <select

                name="county"

                value={form.county}

                onChange={handleChange}

                disabled={!editing}

              >

                <option>

                  Mombasa

                </option>

                <option>

                  Kwale

                </option>

                <option>

                  Kilifi

                </option>

                <option>

                  Tana River

                </option>

                <option>

                  Lamu

                </option>

                <option>

                  Taita Taveta

                </option>

              </select>

            </div>

          </div>

        </div>

        {

          error && (

            <div className="form-error">

              {error}

            </div>

          )

        }

        {

          success && (

            <div className="form-success">

              {success}

            </div>

          )

        }

        {

          editing && (

            <div className="form-actions">

              <button

                className="save-btn"

                disabled={saving}

              >

                <Save size={18} />

                {

                  saving

                    ? "Saving..."

                    : "Save Changes"

                }

              </button>

            </div>

          )

        }

      </form>

    </section>

  );

}

export default ContactInformation;
import { useEffect, useState } from "react";

import {
  User,
  Briefcase,
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

import "./PersonalInformation.css";

function PersonalInformation() {

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

      firstName: "",

      middleName: "",

      lastName: "",

      gender: "",

      dateOfBirth: "",

      occupation: "",

    });

  useEffect(() => {

    if (!profile) return;

    setForm({

      firstName:
        profile.firstName || "",

      middleName:
        profile.middleName || "",

      lastName:
        profile.lastName || "",

      gender:
        profile.gender || "",

      dateOfBirth:
        profile.dateOfBirth
          ? profile.dateOfBirth.substring(0,10)
          : "",

      occupation:
        profile.occupation || "",

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

        "Personal information updated successfully."

      );

    } catch (err) {

      console.error(err);

      setError(

        err.response?.data?.message ||

        "Unable to update profile."

      );

    } finally {

      setSaving(false);

    }

  };

  return (

    <section className="personal-information">

      <div className="section-header">

        <div>

          <h2>

            <User size={22} />

            Personal Information

          </h2>

          <p>

            Manage your personal details.

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

              Edit Profile

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

        <div className="profile-grid">

          <div className="form-group">

            <label>

              First Name

            </label>

            <input

              name="firstName"

              value={form.firstName}

              onChange={handleChange}

              disabled={!editing}

            />

          </div>

          <div className="form-group">

            <label>

              Middle Name

            </label>

            <input

              name="middleName"

              value={form.middleName}

              onChange={handleChange}

              disabled={!editing}

            />

          </div>

          <div className="form-group">

            <label>

              Last Name

            </label>

            <input

              name="lastName"

              value={form.lastName}

              onChange={handleChange}

              disabled={!editing}

            />

          </div>

          <div className="form-group">

            <label>

              Gender

            </label>

            <select

              name="gender"

              value={form.gender}

              onChange={handleChange}

              disabled={!editing}

            >

              <option value="">

                Select Gender

              </option>

              <option value="male">

                Male

              </option>

              <option value="female">

                Female

              </option>

            </select>

          </div>

          <div className="form-group">

            <label>

              Date of Birth

            </label>

            <input

              type="date"

              name="dateOfBirth"

              value={form.dateOfBirth}

              onChange={handleChange}

              disabled={!editing}

            />

          </div>

          <div className="form-group">

            <label>

              Occupation

            </label>

            <div className="input-icon">

              <Briefcase size={18} />

              <input

                name="occupation"

                value={form.occupation}

                onChange={handleChange}

                disabled={!editing}

              />

            </div>

          </div>

        </div>

        {

          error &&

          <div className="form-error">

            {error}

          </div>

        }

        {

          success &&

          <div className="form-success">

            {success}

          </div>

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

export default PersonalInformation;
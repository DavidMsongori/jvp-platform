import { useEffect, useState } from "react";
import {
  getAdminAwardCategories,
  createAwardCategory,
  updateAwardCategoryStatus,
  updateAwardCategoryNominationSettings,
} from "../../../services/awardService";

import "./AwardsAdmin.css";
import "./AwardsNominationReview.jsx";  
import AwardsNominationReview from "./AwardsNominationReview.jsx";

const initialForm = {
  name: "",
  description: "",
  icon: "🏆",
  categoryType: "open",
  minAge: 18,
  maxAge: 35,
  displayOrder: 0,
};

const defaultOpensAt = "2026-11-01T00:00";
const defaultClosesAt = "2026-11-14T23:59";

const getLocalDateTimeValue = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const getInitialNominationSettings = (category) => ({
  enabled: category.nominationSettings?.enabled ?? false,
  opensAt:
    getLocalDateTimeValue(category.nominationSettings?.opensAt) ||
    defaultOpensAt,
  closesAt:
    getLocalDateTimeValue(category.nominationSettings?.closesAt) ||
    defaultClosesAt,
});

export default function AwardsAdmin() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [nominationForms, setNominationForms] = useState({});
  const [savingSettings, setSavingSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAdminAwardCategories();
      const data = response?.data;
      const loadedCategories = Array.isArray(data) ? data : [];

      setCategories(loadedCategories);

      setNominationForms((previous) => {
        const next = {};

        loadedCategories.forEach((category) => {
          next[category._id] = {
            ...getInitialNominationSettings(category),
            ...(previous[category._id] || {}),
          };
        });

        return next;
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load award categories. Check your administrator access."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: ["minAge", "maxAge", "displayOrder"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleNominationChange = (categoryId, field, value) => {
    setNominationForms((previous) => ({
      ...previous,
      [categoryId]: {
        ...previous[categoryId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (form.minAge > form.maxAge) {
      setError("Minimum age cannot exceed maximum age.");
      return;
    }

    setSaving(true);

    try {
      await createAwardCategory({
        name: form.name.trim(),
        description: form.description.trim(),
        icon: form.icon.trim(),
        categoryType: form.categoryType,
        eligibility: {
          minAge: form.minAge,
          maxAge: form.maxAge,
          eligibleCounties: [
            "Mombasa",
            "Kwale",
            "Kilifi",
            "Tana River",
            "Lamu",
            "Taita Taveta",
          ],
        },
        displayOrder: form.displayOrder,
      });

      setMessage(
        "Category created successfully as a draft. It is not yet publicly visible."
      );

      setForm({ ...initialForm });
      setShowForm(false);
      await loadCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create the category. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (category) => {
    const nextStatus =
      category.status === "active" ? "inactive" : "active";

    const action = nextStatus === "active" ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${category.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await updateAwardCategoryStatus(category._id, nextStatus);

      setMessage(
        `Category "${category.name}" ${
          nextStatus === "active" ? "activated" : "deactivated"
        } successfully.`
      );

      await loadCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update the category status. Please try again."
      );
    }
  };

  const handleSaveNominationSettings = async (category) => {
    const settings = nominationForms[category._id];

    if (!settings) {
      setError(
        "Nomination settings could not be loaded. Refresh and try again."
      );
      return;
    }

    setError("");
    setMessage("");

    if (!settings.opensAt || !settings.closesAt) {
      setError("Please provide both the opening and closing date and time.");
      return;
    }

    const opensAt = new Date(settings.opensAt);
    const closesAt = new Date(settings.closesAt);

    if (
      Number.isNaN(opensAt.getTime()) ||
      Number.isNaN(closesAt.getTime())
    ) {
      setError("Please enter valid opening and closing dates.");
      return;
    }

    if (closesAt <= opensAt) {
      setError(
        "The closing date and time must be after the opening date and time."
      );
      return;
    }

    setSavingSettings((previous) => ({
      ...previous,
      [category._id]: true,
    }));

    try {
      await updateAwardCategoryNominationSettings(category._id, {
        enabled: settings.enabled,
        opensAt: opensAt.toISOString(),
        closesAt: closesAt.toISOString(),
      });

      setMessage(`Nomination settings saved for "${category.name}".`);
      await loadCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Unable to save nomination settings for "${category.name}".`
      );
    } finally {
      setSavingSettings((previous) => ({
        ...previous,
        [category._id]: false,
      }));
    }
  };

  const draftCount = categories.filter(
    (category) => category.status === "draft"
  ).length;

  const activeCount = categories.filter(
    (category) => category.status === "active"
  ).length;

  const enabledNominationCount = categories.filter(
    (category) => category.nominationSettings?.enabled
  ).length;

  return (
    <main className="awards-admin">
      <header className="awards-admin-header">
        <div>
          <p className="awards-admin-eyebrow">
            JVP COASTAL YOUTH EXCELLENCE AWARDS
          </p>
          <h1>Awards Secretariat</h1>
          <p>
            Manage award categories and prepare the competition for
            official approval.
          </p>
        </div>

        <button
          className="awards-primary-button"
          type="button"
          onClick={() => {
            setShowForm((previous) => !previous);
            setError("");
            setMessage("");
          }}
        >
          {showForm ? "Cancel" : "+ New Category"}
        </button>
      </header>

      {error && (
        <div className="awards-admin-alert error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="awards-admin-alert success" role="status">
          {message}
        </div>
      )}

      <section className="awards-admin-stats">
        <article className="awards-stat-card">
          <span>Total Categories</span>
          <strong>{categories.length}</strong>
        </article>

        <article className="awards-stat-card">
          <span>Draft Categories</span>
          <strong>{draftCount}</strong>
        </article>

        <article className="awards-stat-card">
          <span>Published Categories</span>
          <strong>{activeCount}</strong>
        </article>

        <article className="awards-stat-card">
          <span>Nominations Enabled</span>
          <strong>{enabledNominationCount}</strong>
        </article>
      </section>

      {showForm && (
        <section className="awards-admin-panel">
          <h2>Create Award Category</h2>
          <p>
            New categories are saved as drafts. Creating a category does
            not open nominations or voting.
          </p>

          <form className="awards-category-form" onSubmit={handleSubmit}>
            <label>
              Category name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={120}
                placeholder="e.g. Coastal Youth Leader of the Year"
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                maxLength={1000}
                placeholder="Describe the achievements this award recognises."
              />
            </label>

            <div className="awards-form-grid">
              <label>
                Icon or emoji
                <input
                  name="icon"
                  value={form.icon}
                  onChange={handleChange}
                  maxLength={20}
                />
              </label>

              <label>
                Category type
                <select
                  name="categoryType"
                  value={form.categoryType}
                  onChange={handleChange}
                >
                  <option value="open">Open category</option>
                  <option value="jvp_officeholder">
                    JVP officeholders
                  </option>
                  <option value="jvp_appointee">JVP appointees</option>
                </select>
              </label>

              <label>
                Minimum age
                <input
                  type="number"
                  name="minAge"
                  min="18"
                  max="100"
                  value={form.minAge}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Maximum age
                <input
                  type="number"
                  name="maxAge"
                  min="18"
                  max="100"
                  value={form.maxAge}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Display order
                <input
                  type="number"
                  name="displayOrder"
                  min="0"
                  value={form.displayOrder}
                  onChange={handleChange}
                />
              </label>
            </div>

            <button
              className="awards-primary-button"
              type="submit"
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Draft Category"}
            </button>
          </form>
        </section>
      )}

      <section className="awards-admin-panel">
        <div className="awards-panel-heading">
          <div>
            <h2>Award Categories</h2>
            <p>Manage category status and nomination availability.</p>
          </div>

          <button
            className="awards-secondary-button"
            type="button"
            onClick={loadCategories}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p>Loading award categories...</p>
        ) : categories.length === 0 ? (
          <div className="awards-admin-empty">
            <span>🏆</span>
            <h3>No categories yet</h3>
            <p>
              Create the first draft category when the Secretariat is
              ready to begin preparing the awards.
            </p>
          </div>
        ) : (
          <div className="awards-category-list">
            {categories.map((category) => {
              const settings =
                nominationForms[category._id] ||
                getInitialNominationSettings(category);

              const isSaving = Boolean(savingSettings[category._id]);

              return (
                <article
                  className="awards-admin-category-card"
                  key={category._id || category.slug}
                >
                  <div className="awards-admin-category-heading">
                    <div>
                      <h3>
                        {category.icon ? `${category.icon} ` : ""}
                        {category.name}
                      </h3>

                      <p>
                        {category.description || "No description added"}
                      </p>

                      <div className="awards-admin-category-meta">
                        <span>
                          {category.categoryType === "jvp_officeholder"
                            ? "JVP officeholders"
                            : category.categoryType === "jvp_appointee"
                              ? "JVP appointees"
                              : "Open category"}
                        </span>

                        <span>
                          Age {category.eligibility?.minAge ?? 18}–
                          {category.eligibility?.maxAge ?? 35}
                        </span>

                        <span
                          className={`awards-status ${
                            category.status || "draft"
                          }`}
                        >
                          {category.status || "draft"}
                        </span>
                      </div>
                    </div>

                    <button
                      className="awards-secondary-button"
                      type="button"
                      onClick={() => handleStatusChange(category)}
                      disabled={
                        !category._id ||
                        !["draft", "active", "inactive"].includes(
                          category.status || "draft"
                        )
                      }
                    >
                      {category.status === "active"
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </div>

                  <div className="awards-nomination-settings">
                    <div className="awards-nomination-settings-heading">
                      <div>
                        <h4>Nomination window</h4>
                        <p>
                          Configure when nominations are allowed for this
                          category.
                        </p>
                      </div>

                      <label className="awards-nomination-toggle">
                        <input
                          type="checkbox"
                          checked={Boolean(settings.enabled)}
                          onChange={(event) =>
                            handleNominationChange(
                              category._id,
                              "enabled",
                              event.target.checked
                            )
                          }
                          disabled={isSaving}
                        />
                        <span>
                          {settings.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </label>
                    </div>

                    <div className="awards-form-grid">
                      <label>
                        Opens at
                        <input
                          type="datetime-local"
                          value={settings.opensAt}
                          onChange={(event) =>
                            handleNominationChange(
                              category._id,
                              "opensAt",
                              event.target.value
                            )
                          }
                          disabled={isSaving}
                          required
                        />
                      </label>

                      <label>
                        Closes at
                        <input
                          type="datetime-local"
                          value={settings.closesAt}
                          onChange={(event) =>
                            handleNominationChange(
                              category._id,
                              "closesAt",
                              event.target.value
                            )
                          }
                          disabled={isSaving}
                          required
                        />
                      </label>
                    </div>

                    <p className="awards-admin-note">
                      Intended schedule: 1 November 2026, 12:00 AM to
                      14 November 2026, 11:59 PM (East Africa Time).
                      Save settings separately for each category.
                    </p>

                    <button
                      className="awards-primary-button"
                      type="button"
                      onClick={() =>
                        handleSaveNominationSettings(category)
                      }
                      disabled={isSaving || loading || !category._id}
                    >
                      {isSaving
                        ? "Saving settings..."
                        : "Save Nomination Settings"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="awards-admin-note">
          Enabling nominations here saves the category's nomination
          settings. The backend must also enforce the opening and closing
          times when a nomination is submitted.
        </p>
      </section>
      <AwardsNominationReview />
    </main>
  );
}

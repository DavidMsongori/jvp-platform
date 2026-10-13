
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Save,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { useProgram } from "../../../context/ProgramContext";
import "./ProgramImpactForm.css";

const getId = (item) => item?._id || item?.id || "";

const getTitle = (program) =>
  program?.title || program?.name || "Programme impact";

const getRecordType = (program) =>
  program?.recordType === "activity" ? "Activity" : "Programme";

const toAchievements = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string"
        ? item
        : item?.title || item?.name || item?.description || ""
    );
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return toAchievements(parsed);
    } catch {
      return value.split("\n").map((item) => item.trim());
    }
  }

  return [""];
};

const cleanAchievements = (items) =>
  items.map((item) => item.trim()).filter(Boolean);

const initialValues = (program) => ({
  youthsAttended: String(program?.youthsAttended ?? 0),
  youthsBenefited: String(program?.youthsBenefited ?? 0),
  impactSummary: program?.impactSummary || "",
  achievements: toAchievements(program?.achievements),
});

export default function ProgramImpactForm({
  program: suppliedProgram = null,
  programId: suppliedProgramId,
  onSuccess,
  onCancel,
  showHeader = true,
}) {
  const { id: routeId } = useParams();

  const {
    selectedProgram,
    loadProgramById,
    updateProgramImpact,
    loading,
    submitting,
    error,
    clearError,
  } = useProgram();

  const programId = suppliedProgramId || routeId || getId(suppliedProgram);

  const program = useMemo(() => {
    if (suppliedProgram) return suppliedProgram;

    if (
      selectedProgram &&
      (!programId || getId(selectedProgram) === programId)
    ) {
      return selectedProgram;
    }

    return null;
  }, [suppliedProgram, selectedProgram, programId]);

  const [form, setForm] = useState(() => initialValues(program));
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savedValues, setSavedValues] = useState(() =>
    initialValues(program)
  );

  useEffect(() => {
    if (program) {
      const values = initialValues(program);
      setForm(values);
      setSavedValues(values);
    }
  }, [program]);

  useEffect(() => {
    if (!programId || program || suppliedProgram) return;
    loadProgramById?.(programId);
  }, [programId, program, suppliedProgram, loadProgramById]);

  const attended = Number(form.youthsAttended);
  const benefited = Number(form.youthsBenefited);

  const hasValidNumbers =
    form.youthsAttended.trim() !== "" &&
    form.youthsBenefited.trim() !== "" &&
    Number.isSafeInteger(attended) &&
    Number.isSafeInteger(benefited) &&
    attended >= 0 &&
    benefited >= 0;

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedValues),
    [form, savedValues]
  );

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFormError("");
    setSuccessMessage("");
  };

  const updateAchievement = (index, value) => {
    setForm((previous) => ({
      ...previous,
      achievements: previous.achievements.map((item, itemIndex) =>
        itemIndex === index ? value : item
      ),
    }));

    setFormError("");
    setSuccessMessage("");
  };

  const addAchievement = () => {
    setForm((previous) => ({
      ...previous,
      achievements: [...previous.achievements, ""],
    }));
  };

  const removeAchievement = (index) => {
    setForm((previous) => {
      const next = previous.achievements.filter(
        (_, itemIndex) => itemIndex !== index
      );

      return {
        ...previous,
        achievements: next.length ? next : [""],
      };
    });

    setFormError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    clearError?.();

    if (!programId) {
      setFormError("The programme ID is missing. Please reopen this form.");
      return;
    }

    if (!hasValidNumbers) {
      setFormError(
        "Enter valid whole numbers of zero or greater for both impact figures."
      );
      return;
    }

    if (!form.impactSummary.trim()) {
      setFormError(
        "Add an impact summary describing the results achieved so far."
      );
      return;
    }

    const payload = {
      youthsAttended: attended,
      youthsBenefited: benefited,
      impactSummary: form.impactSummary.trim(),
      achievements: cleanAchievements(form.achievements),
    };

    try {
      const result = await updateProgramImpact(programId, payload);

      if (result === false) {
        setFormError("The impact record was not saved. Please try again.");
        return;
      }

      const updatedValues = {
        youthsAttended: String(payload.youthsAttended),
        youthsBenefited: String(payload.youthsBenefited),
        impactSummary: payload.impactSummary,
        achievements: payload.achievements.length
          ? payload.achievements
          : [""],
      };

      setForm(updatedValues);
      setSavedValues(updatedValues);
      setSuccessMessage("Programme impact has been saved successfully.");

      if (onSuccess) onSuccess(result);
    } catch (submitError) {
      setFormError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to save programme impact. Please try again."
      );
    }
  };

  if (loading && !program) {
    return (
      <div className="program-impact-state">
        <span className="program-impact-spinner" />
        <p>Loading programme impact...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="program-impact-state">
        <FileText size={30} />
        <h2>Programme not found</h2>
        <p>We could not load this programme or activity.</p>
        <Link
          to="/admin/programs"
          className="program-impact-button program-impact-button-secondary"
        >
          <ArrowLeft size={16} />
          Back to programmes
        </Link>
      </div>
    );
  }

  return (
    <div className="program-impact-page">
      {showHeader && (
        <header className="program-impact-header">
          <div className="program-impact-header-title">
            <div className="program-impact-header-icon">
              <TrendingUp size={22} />
            </div>

            <div>
              <p className="program-impact-eyebrow">
                JVP CONNECT / IMPACT TRACKING
              </p>
              <h1>Programme impact</h1>
              <p className="program-impact-subtitle">
                Record participation, beneficiaries and outcomes.
              </p>
            </div>
          </div>

          <Link
            to={`/admin/programs/${programId}`}
            className="program-impact-back-link"
          >
            <ArrowLeft size={16} />
            Back to record
          </Link>
        </header>
      )}

      <section className="program-impact-record">
        <div className="program-impact-record-type">
          {getRecordType(program)}
        </div>
        <h2>{getTitle(program)}</h2>
        <p>
          {program.county || program.location || "Location not specified"}
          {program.status ? ` · ${program.status}` : ""}
        </p>
      </section>

      <div className="program-impact-metrics">
        <article className="program-impact-metric">
          <div className="program-impact-metric-icon attended">
            <Users size={20} />
          </div>
          <div>
            <span>Youths attended</span>
            <strong>
              {hasValidNumbers
                ? attended.toLocaleString()
                : "—"}
            </strong>
            <small>Participation and attendance</small>
          </div>
        </article>

        <article className="program-impact-metric">
          <div className="program-impact-metric-icon benefited">
            <Target size={20} />
          </div>
          <div>
            <span>Youths benefited</span>
            <strong>
              {hasValidNumbers
                ? benefited.toLocaleString()
                : "—"}
            </strong>
            <small>Direct or measurable benefit</small>
          </div>
        </article>
      </div>

      <form className="program-impact-form" onSubmit={handleSubmit}>
        {(formError || error) && (
          <div className="program-impact-alert error" role="alert">
            <span>{formError || error}</span>
            <button
              type="button"
              onClick={() => {
                setFormError("");
                clearError?.();
              }}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div className="program-impact-alert success" role="status">
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}

        <section className="program-impact-section">
          <div className="program-impact-section-heading">
            <div>
              <h3>Impact figures</h3>
              <p>
                Enter the latest verified figures for this programme or
                activity.
              </p>
            </div>
          </div>

          <div className="program-impact-number-grid">
            <div className="program-impact-field">
              <label htmlFor="impact-attended">
                Youths attended <span>*</span>
              </label>
              <input
                id="impact-attended"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.youthsAttended}
                onChange={(event) =>
                  updateField("youthsAttended", event.target.value)
                }
                required
              />
              <small>
                Young people who participated or attended. This is not
                automatically the same as the number who benefited.
              </small>
            </div>

            <div className="program-impact-field">
              <label htmlFor="impact-benefited">
                Youths benefited <span>*</span>
              </label>
              <input
                id="impact-benefited"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.youthsBenefited}
                onChange={(event) =>
                  updateField("youthsBenefited", event.target.value)
                }
                required
              />
              <small>
                Young people who received a direct or measurable benefit.
              </small>
            </div>
          </div>

          {hasValidNumbers && benefited > attended && (
            <div className="program-impact-inline-note">
              Beneficiaries exceed attendance. This can be valid when benefits
              reach young people beyond recorded event attendance; verify the
              figures before saving.
            </div>
          )}
        </section>

        <section className="program-impact-section">
          <div className="program-impact-section-heading">
            <div>
              <h3>Impact summary</h3>
              <p>
                Describe what changed, what was delivered and what evidence
                supports the results.
              </p>
            </div>
          </div>

          <div className="program-impact-field">
            <label htmlFor="impact-summary">
              Summary of results <span>*</span>
            </label>
            <textarea
              id="impact-summary"
              rows={5}
              value={form.impactSummary}
              onChange={(event) =>
                updateField("impactSummary", event.target.value)
              }
              placeholder="Describe the outcomes, changes achieved, skills gained, services delivered or other measurable results..."
              required
            />
            <small>
              Be specific where possible. Include evidence or figures that
              substantiate the reported impact.
            </small>
          </div>
        </section>

        <section className="program-impact-section">
          <div className="program-impact-section-heading program-impact-achievements-heading">
            <div>
              <h3>Achievements and outcomes</h3>
              <p>
                Record notable milestones, deliverables or verified results.
              </p>
            </div>

            <button
              type="button"
              className="program-impact-add-button"
              onClick={addAchievement}
            >
              + Add achievement
            </button>
          </div>

          <div className="program-impact-achievements">
            {form.achievements.map((achievement, index) => (
              <div className="program-impact-achievement-row" key={index}>
                <span className="program-impact-achievement-number">
                  {index + 1}
                </span>

                <input
                  type="text"
                  value={achievement}
                  onChange={(event) =>
                    updateAchievement(index, event.target.value)
                  }
                  placeholder="Describe an achievement or measurable outcome"
                  aria-label={`Achievement ${index + 1}`}
                />

                <button
                  type="button"
                  className="program-impact-remove-button"
                  onClick={() => removeAchievement(index)}
                  aria-label={`Remove achievement ${index + 1}`}
                  title="Remove achievement"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>

        <footer className="program-impact-form-footer">
          <p>
            <span>*</span> Required fields
            {hasChanges && " · Unsaved changes"}
          </p>

          <div className="program-impact-footer-actions">
            <button
              type="button"
              className="program-impact-button program-impact-button-secondary"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                  return;
                }

                setForm(savedValues);
                setFormError("");
                setSuccessMessage("");
              }}
              disabled={Boolean(submitting)}
            >
              {onCancel ? "Cancel" : "Reset changes"}
            </button>

            <button
              type="submit"
              className="program-impact-button program-impact-button-primary"
              disabled={Boolean(submitting) || !hasChanges}
            >
              <Save size={16} />
              {submitting ? "Saving impact..." : "Save impact"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
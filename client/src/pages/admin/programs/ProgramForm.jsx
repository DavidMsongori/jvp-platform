
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  ImagePlus,
  MapPin,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { useProgram } from "../../../context/ProgramContext";
import "./ProgramForm.css";

const CATEGORIES = [
  "Youth Empowerment",
  "Education & Skills Development",
  "Agriculture & Food Security",
  "Climate Change & Environment",
  "Leadership & Governance",
  "Entrepreneurship & Employment",
  "Health & Wellbeing",
  "Sports & Talent Development",
  "Blue Economy",
  "Gender & Social Inclusion",
  "Community Development",
  "Other",
];

const COUNTIES = [
  "Kilifi",
  "Mombasa",
  "Kwale",
  "Taita Taveta",
  "Tana River",
  "Lamu",
];

const STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const EMPTY_FORM = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  recordType: "programme",
  category: "",
  parentProgram: "",
  objectives: [""],
  startDate: "",
  endDate: "",
  county: "",
  subCounty: "",
  ward: "",
  location: "",
  status: "planned",
  isFeatured: false,
  isPublished: false,
  youthsAttended: "0",
  youthsBenefited: "0",
  impactSummary: "",
  achievements: [""],
  partners: [""],
  coverImageAlt: "",
  coverImageCaption: "",
};

const getId = (item) =>
  item?._id || item?.id || item?.programId || "";

const getProgramTitle = (program) =>
  program?.title || program?.name || "Untitled programme";

const toDateInput = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const toList = (value) => {
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
      if (Array.isArray(parsed)) return toList(parsed);
    } catch {
      return value
        .split("\n")
        .map((item) => item.trim());
    }
  }

  return [""];
};

const getInitialValues = (program) => {
  if (!program) return { ...EMPTY_FORM };

  return {
    ...EMPTY_FORM,
    title: program.title || "",
    slug: program.slug || "",
    summary: program.summary || "",
    description: program.description || "",
    recordType: program.recordType || "programme",
    category: program.category || "",
    parentProgram:
      typeof program.parentProgram === "object"
        ? getId(program.parentProgram)
        : program.parentProgram || "",
    objectives: toList(program.objectives),
    startDate: toDateInput(program.startDate),
    endDate: toDateInput(program.endDate),
    county: program.county || "",
    subCounty: program.subCounty || "",
    ward: program.ward || "",
    location: program.location || "",
    status: program.status || "planned",
    isFeatured: Boolean(program.isFeatured),
    isPublished: Boolean(program.isPublished),
    youthsAttended: String(program.youthsAttended ?? 0),
    youthsBenefited: String(program.youthsBenefited ?? 0),
    impactSummary: program.impactSummary || "",
    achievements: toList(program.achievements),
    partners: toList(program.partners),
    coverImageAlt: program.coverImageAlt || program.coverImage?.alt || "",
    coverImageCaption:
      program.coverImageCaption || program.coverImage?.caption || "",
  };
};

const normalizeList = (items) =>
  items.map((item) => item.trim()).filter(Boolean);

function ListEditor({
  label,
  description,
  items,
  onChange,
  placeholder,
}) {
  const updateItem = (index, value) => {
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? value : item
      )
    );
  };

  const addItem = () => onChange([...items, ""]);

  const removeItem = (index) => {
    const next = items.filter((_, itemIndex) => itemIndex !== index);
    onChange(next.length ? next : [""]);
  };

  return (
    <div className="program-form-list-editor">
      <div className="program-form-list-heading">
        <div>
          <label className="program-form-label">{label}</label>
          {description && (
            <p className="program-form-help">{description}</p>
          )}
        </div>

        <button
          type="button"
          className="program-form-add-button"
          onClick={addItem}
        >
          <Plus size={15} />
          Add item
        </button>
      </div>

      <div className="program-form-list-items">
        {items.map((item, index) => (
          <div className="program-form-list-row" key={index}>
            <input
              type="text"
              value={item}
              onChange={(event) =>
                updateItem(index, event.target.value)
              }
              placeholder={placeholder}
              aria-label={`${label} item ${index + 1}`}
            />

            <button
              type="button"
              className="program-form-icon-button"
              onClick={() => removeItem(index)}
              aria-label={`Remove ${label.toLowerCase()} item`}
              title="Remove item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProgramForm({
  initialProgram: suppliedProgram = null,
  mode: suppliedMode,
  onSuccess,
  onCancel,
}) {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    programs = [],
    selectedProgram,
    loadPrograms,
    loadProgramById,
    createProgram,
    updateProgram,
    loading,
    submitting,
    error,
    clearError,
    setError,
  } = useProgram();

  const routeMode = id ? "edit" : "create";
  const mode = suppliedMode || routeMode;
  const isEditing = mode === "edit";

  const editingId = id || getId(suppliedProgram);
  const currentProgram = useMemo(
    () =>
      suppliedProgram ||
      (isEditing &&
      selectedProgram &&
      getId(selectedProgram) === editingId
        ? selectedProgram
        : null),
    [suppliedProgram, selectedProgram, editingId, isEditing]
  );

  const [form, setForm] = useState(() =>
    getInitialValues(currentProgram)
  );
  const [coverImage, setCoverImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [existingCoverPreview, setExistingCoverPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isEditing || !editingId || suppliedProgram) return;
    if (currentProgram) return;

    loadProgramById?.(editingId);
  }, [
    isEditing,
    editingId,
    suppliedProgram,
    currentProgram,
    loadProgramById,
  ]);

  useEffect(() => {
    if (!currentProgram) return;

    setForm(getInitialValues(currentProgram));

    const image =
      typeof currentProgram.coverImage === "string"
        ? currentProgram.coverImage
        : currentProgram.coverImage?.url ||
          currentProgram.coverImage?.secure_url ||
          currentProgram.coverImage?.path ||
          "";

    setExistingCoverPreview(image);
  }, [currentProgram]);

  useEffect(() => {
    if (programs.length > 0) return;
    loadPrograms?.({ limit: 100 });
  }, [programs.length, loadPrograms]);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      galleryPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [coverPreview, galleryPreviews]);

  const parentPrograms = useMemo(
    () =>
      programs.filter(
        (program) =>
          program.recordType !== "activity" &&
          getId(program) !== editingId
      ),
    [programs, editingId]
  );

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFormError("");
    setSuccessMessage("");
  };

  const handleTitleChange = (value) => {
    setForm((previous) => ({
      ...previous,
      title: value,
      slug:
        previous.slug &&
        previous.slug !== slugify(previous.title)
          ? previous.slug
          : slugify(value),
    }));
  };

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file for the cover.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("The cover image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    if (coverPreview) URL.revokeObjectURL(coverPreview);

    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
    setFormError("");
  };

  const handleGalleryChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const invalidFile = files.find(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFile) {
      setFormError("Gallery uploads must all be image files.");
      event.target.value = "";
      return;
    }

    const tooLarge = files.find(
      (file) => file.size > 5 * 1024 * 1024
    );

    if (tooLarge) {
      setFormError("Each gallery image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    galleryPreviews.forEach((url) => URL.revokeObjectURL(url));

    setGalleryImages(files);
    setGalleryPreviews(files.map((file) => URL.createObjectURL(file)));
    setFormError("");
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Enter a programme or activity title.";
    if (!form.summary.trim()) return "Enter a short summary.";
    if (!form.description.trim()) return "Enter a description.";
    if (!form.category) return "Select a category.";
    if (!form.startDate) return "Select a start date.";

    if (
      form.endDate &&
      new Date(form.endDate) < new Date(form.startDate)
    ) {
      return "The end date cannot be earlier than the start date.";
    }

    const attended = Number(form.youthsAttended);
    const benefited = Number(form.youthsBenefited);

    if (
      !Number.isInteger(attended) ||
      attended < 0 ||
      !Number.isInteger(benefited) ||
      benefited < 0
    ) {
      return "Youth impact figures must be whole numbers greater than or equal to zero.";
    }

    if (
      form.recordType === "activity" &&
      form.parentProgram &&
      !parentPrograms.some(
        (program) => getId(program) === form.parentProgram
      )
    ) {
      return "Select a valid parent programme.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    clearError?.();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      ...form,
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      summary: form.summary.trim(),
      description: form.description.trim(),
      parentProgram:
        form.recordType === "activity" && form.parentProgram
          ? form.parentProgram
          : null,
      objectives: normalizeList(form.objectives),
      achievements: normalizeList(form.achievements),
      partners: normalizeList(form.partners),
      youthsAttended: Number(form.youthsAttended),
      youthsBenefited: Number(form.youthsBenefited),
      coverImageAlt: form.coverImageAlt.trim(),
      coverImageCaption: form.coverImageCaption.trim(),
      ...(coverImage ? { coverImage } : {}),
      ...(galleryImages.length ? { galleryImages } : {}),
    };

    try {
      const result = isEditing
        ? await updateProgram(editingId, payload)
        : await createProgram(payload);

      if (result === false) {
        setFormError("The programme could not be saved. Please try again.");
        return;
      }

      setSuccessMessage(
        isEditing
          ? "Your changes have been saved."
          : "The programme has been created successfully."
      );

      if (onSuccess) {
        onSuccess(result);
      } else {
        navigate("/admin/programs");
      }
    } catch (submitError) {
      setFormError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to save this record. Please try again."
      );
    }
  };

  const isBusy = Boolean(submitting);
  const previewImage = coverPreview || existingCoverPreview;

  if (isEditing && loading && !currentProgram) {
    return (
      <div className="program-form-loading">
        <span className="program-form-spinner" />
        <p>Loading programme details...</p>
      </div>
    );
  }

  if (isEditing && !currentProgram && !loading && !suppliedProgram) {
    return (
      <div className="program-form-state">
        <FileText size={30} />
        <h2>Programme not found</h2>
        <p>The requested programme could not be loaded.</p>
        <Link to="/admin/programs" className="program-form-secondary-button">
          <ArrowLeft size={16} />
          Back to programmes
        </Link>
      </div>
    );
  }

  return (
    <div className="program-form-page">
      <header className="program-form-page-header">
        <div className="program-form-heading">
          <Link
            to="/admin/programs"
            className="program-form-back-link"
            aria-label="Back to programmes"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <p className="program-form-eyebrow">JVP CONNECT / PROGRAMMES</p>
            <h1>{isEditing ? "Edit record" : "Create a record"}</h1>
            <p className="program-form-subtitle">
              {isEditing
                ? "Update the details, activities and impact of this record."
                : "Create a programme or record an individual activity."}
            </p>
          </div>
        </div>

        <div className="program-form-header-actions">
          <span className="program-form-save-note">
            <CheckCircle2 size={15} />
            Changes are saved when you submit
          </span>
        </div>
      </header>

      <form className="program-form" onSubmit={handleSubmit}>
        {(formError || error) && (
          <div className="program-form-alert program-form-alert-error" role="alert">
            <X size={18} />
            <span>{formError || error}</span>
            <button
              type="button"
              onClick={() => {
                setFormError("");
                clearError?.();
              }}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="program-form-alert program-form-alert-success" role="status">
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}

        <div className="program-form-layout">
          <div className="program-form-main">
            <section className="program-form-card">
              <div className="program-form-section-heading">
                <div className="program-form-section-icon">
                  <FileText size={19} />
                </div>
                <div>
                  <h2>Basic information</h2>
                  <p>Introduce the programme or activity.</p>
                </div>
              </div>

              <div className="program-form-grid">
                <div className="program-form-field program-form-field-full">
                  <label htmlFor="program-title" className="program-form-label">
                    Title <span className="required">*</span>
                  </label>
                  <input
                    id="program-title"
                    value={form.title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    placeholder="e.g. Coast Youth Empowerment Programme"
                    required
                  />
                </div>

                <div className="program-form-field program-form-field-full">
                  <label htmlFor="program-slug" className="program-form-label">
                    URL slug
                  </label>
                  <input
                    id="program-slug"
                    value={form.slug}
                    onChange={(event) =>
                      updateField("slug", slugify(event.target.value))
                    }
                    placeholder="coast-youth-empowerment"
                  />
                  <p className="program-form-help">
                    Generated from the title. You can edit it if necessary.
                  </p>
                </div>

                <div className="program-form-field">
                  <label htmlFor="program-type" className="program-form-label">
                    Record type <span className="required">*</span>
                  </label>
                  <select
                    id="program-type"
                    value={form.recordType}
                    onChange={(event) => {
                      const recordType = event.target.value;
                      setForm((previous) => ({
                        ...previous,
                        recordType,
                        parentProgram:
                          recordType === "programme"
                            ? ""
                            : previous.parentProgram,
                      }));
                    }}
                  >
                    <option value="programme">Programme</option>
                    <option value="activity">Individual activity</option>
                  </select>
                </div>

                <div className="program-form-field">
                  <label htmlFor="program-category" className="program-form-label">
                    Category <span className="required">*</span>
                  </label>
                  <select
                    id="program-category"
                    value={form.category}
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {form.recordType === "activity" && (
                  <div className="program-form-field program-form-field-full">
                    <label
                      htmlFor="program-parent"
                      className="program-form-label"
                    >
                      Parent programme
                    </label>
                    <select
                      id="program-parent"
                      value={form.parentProgram}
                      onChange={(event) =>
                        updateField("parentProgram", event.target.value)
                      }
                    >
                      <option value="">No parent programme</option>
                      {parentPrograms.map((program) => (
                        <option key={getId(program)} value={getId(program)}>
                          {getProgramTitle(program)}
                        </option>
                      ))}
                    </select>
                    <p className="program-form-help">
                      Link this activity to a larger programme, or leave it
                      independent.
                    </p>
                  </div>
                )}

                <div className="program-form-field program-form-field-full">
                  <label htmlFor="program-summary" className="program-form-label">
                    Short summary <span className="required">*</span>
                  </label>
                  <textarea
                    id="program-summary"
                    rows={3}
                    maxLength={300}
                    value={form.summary}
                    onChange={(event) =>
                      updateField("summary", event.target.value)
                    }
                    placeholder="Write a concise overview for programme listings."
                    required
                  />
                  <div className="program-form-character-count">
                    {form.summary.length}/300 characters
                  </div>
                </div>

                <div className="program-form-field program-form-field-full">
                  <label
                    htmlFor="program-description"
                    className="program-form-label"
                  >
                    Full description <span className="required">*</span>
                  </label>
                  <textarea
                    id="program-description"
                    rows={6}
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    placeholder="Describe the need, approach, activities and expected outcomes."
                    required
                  />
                </div>
              </div>
            </section>

            <section className="program-form-card">
              <div className="program-form-section-heading">
                <div className="program-form-section-icon">
                  <CalendarDays size={19} />
                </div>
                <div>
                  <h2>Schedule and location</h2>
                  <p>Set the delivery period and geographical coverage.</p>
                </div>
              </div>

              <div className="program-form-grid">
                <div className="program-form-field">
                  <label htmlFor="program-start-date" className="program-form-label">
                    Start date <span className="required">*</span>
                  </label>
                  <input
                    id="program-start-date"
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      updateField("startDate", event.target.value)
                    }
                    required
                  />
                </div>

                <div className="program-form-field">
                  <label htmlFor="program-end-date" className="program-form-label">
                    End date
                  </label>
                  <input
                    id="program-end-date"
                    type="date"
                    min={form.startDate || undefined}
                    value={form.endDate}
                    onChange={(event) =>
                      updateField("endDate", event.target.value)
                    }
                  />
                </div>

                <div className="program-form-field">
                  <label htmlFor="program-status" className="program-form-label">
                    Delivery status
                  </label>
                  <select
                    id="program-status"
                    value={form.status}
                    onChange={(event) =>
                      updateField("status", event.target.value)
                    }
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="program-form-field">
                  <label htmlFor="program-county" className="program-form-label">
                    County
                  </label>
                  <select
                    id="program-county"
                    value={form.county}
                    onChange={(event) =>
                      updateField("county", event.target.value)
                    }
                  >
                    <option value="">Select county</option>
                    {COUNTIES.map((county) => (
                      <option key={county} value={county}>
                        {county}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="program-form-field">
                  <label htmlFor="program-subcounty" className="program-form-label">
                    Sub-county
                  </label>
                  <input
                    id="program-subcounty"
                    value={form.subCounty}
                    onChange={(event) =>
                      updateField("subCounty", event.target.value)
                    }
                    placeholder="Enter sub-county"
                  />
                </div>

                <div className="program-form-field">
                  <label htmlFor="program-ward" className="program-form-label">
                    Ward
                  </label>
                  <input
                    id="program-ward"
                    value={form.ward}
                    onChange={(event) =>
                      updateField("ward", event.target.value)
                    }
                    placeholder="Enter ward"
                  />
                </div>

                <div className="program-form-field program-form-field-full">
                  <label htmlFor="program-location" className="program-form-label">
                    Venue or specific location
                  </label>
                  <div className="program-form-input-icon">
                    <MapPin size={17} />
                    <input
                      id="program-location"
                      value={form.location}
                      onChange={(event) =>
                        updateField("location", event.target.value)
                      }
                      placeholder="e.g. Kibaoni Social Hall, Kilifi"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="program-form-card">
              <div className="program-form-section-heading">
                <div className="program-form-section-icon">
                  <Users size={19} />
                </div>
                <div>
                  <h2>Impact and outcomes</h2>
                  <p>Record attendance separately from the number benefiting.</p>
                </div>
              </div>

              <div className="program-form-grid">
                <div className="program-form-field">
                  <label
                    htmlFor="program-youths-attended"
                    className="program-form-label"
                  >
                    Youths attended
                  </label>
                  <input
                    id="program-youths-attended"
                    type="number"
                    min="0"
                    step="1"
                    value={form.youthsAttended}
                    onChange={(event) =>
                      updateField("youthsAttended", event.target.value)
                    }
                  />
                  <p className="program-form-help">
                    Number of young people who participated or attended.
                  </p>
                </div>

                <div className="program-form-field">
                  <label
                    htmlFor="program-youths-benefited"
                    className="program-form-label"
                  >
                    Youths benefited
                  </label>
                  <input
                    id="program-youths-benefited"
                    type="number"
                    min="0"
                    step="1"
                    value={form.youthsBenefited}
                    onChange={(event) =>
                      updateField("youthsBenefited", event.target.value)
                    }
                  />
                  <p className="program-form-help">
                    Number who received a direct or measurable benefit.
                  </p>
                </div>

                <div className="program-form-field program-form-field-full">
                  <label
                    htmlFor="program-impact-summary"
                    className="program-form-label"
                  >
                    Impact summary
                  </label>
                  <textarea
                    id="program-impact-summary"
                    rows={4}
                    value={form.impactSummary}
                    onChange={(event) =>
                      updateField("impactSummary", event.target.value)
                    }
                    placeholder="Describe outcomes, changes achieved and evidence of impact."
                  />
                </div>

                <div className="program-form-field program-form-field-full">
                  <ListEditor
                    label="Achievements and outcomes"
                    description="Add the key milestones, achievements or results."
                    items={form.achievements}
                    onChange={(value) => updateField("achievements", value)}
                    placeholder="Describe an achievement or outcome"
                  />
                </div>
              </div>
            </section>

            <section className="program-form-card">
              <div className="program-form-section-heading">
                <div className="program-form-section-icon">
                  <CheckCircle2 size={19} />
                </div>
                <div>
                  <h2>Objectives and partnerships</h2>
                  <p>Define the purpose and record participating partners.</p>
                </div>
              </div>

              <div className="program-form-stacked-fields">
                <ListEditor
                  label="Objectives"
                  description="What is this programme or activity intended to achieve?"
                  items={form.objectives}
                  onChange={(value) => updateField("objectives", value)}
                  placeholder="Enter an objective"
                />

                <div className="program-form-divider" />

                <ListEditor
                  label="Partners and supporting organisations"
                  description="Include institutions, funders and implementation partners."
                  items={form.partners}
                  onChange={(value) => updateField("partners", value)}
                  placeholder="Enter a partner or supporting organisation"
                />
              </div>
            </section>

            <section className="program-form-card">
              <div className="program-form-section-heading">
                <div className="program-form-section-icon">
                  <ImagePlus size={19} />
                </div>
                <div>
                  <h2>Media and images</h2>
                  <p>Add a cover image and optional gallery.</p>
                </div>
              </div>

              <div className="program-form-grid">
                <div className="program-form-field program-form-field-full">
                  <label className="program-form-label" htmlFor="program-cover">
                    Cover image
                  </label>
                  <input
                    id="program-cover"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                  />
                  <p className="program-form-help">
                    Select an image up to 5 MB. Uploading a new image replaces
                    the current cover, if supported by your backend.
                  </p>

                  {previewImage && (
                    <div className="program-form-cover-preview">
                      <img src={previewImage} alt="Cover preview" />
                      <button
                        type="button"
                        className="program-form-remove-image"
                        onClick={() => {
                          if (coverPreview) URL.revokeObjectURL(coverPreview);
                          setCoverImage(null);
                          setCoverPreview("");
                          setExistingCoverPreview("");
                        }}
                      >
                        <X size={15} />
                        Remove preview
                      </button>
                    </div>
                  )}
                </div>

                <div className="program-form-field">
                  <label
                    htmlFor="program-cover-alt"
                    className="program-form-label"
                  >
                    Image alt text
                  </label>
                  <input
                    id="program-cover-alt"
                    value={form.coverImageAlt}
                    onChange={(event) =>
                      updateField("coverImageAlt", event.target.value)
                    }
                    placeholder="Describe the image"
                  />
                </div>

                <div className="program-form-field">
                  <label
                    htmlFor="program-cover-caption"
                    className="program-form-label"
                  >
                    Image caption
                  </label>
                  <input
                    id="program-cover-caption"
                    value={form.coverImageCaption}
                    onChange={(event) =>
                      updateField("coverImageCaption", event.target.value)
                    }
                    placeholder="Optional caption"
                  />
                </div>

                <div className="program-form-field program-form-field-full">
                  <label
                    htmlFor="program-gallery"
                    className="program-form-label"
                  >
                    Gallery images
                  </label>
                  <input
                    id="program-gallery"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryChange}
                  />
                  <p className="program-form-help">
                    Select up to 5 MB per image. Selecting new files replaces
                    the current selection for this submission.
                  </p>

                  {galleryPreviews.length > 0 && (
                    <div className="program-form-gallery-preview">
                      {galleryPreviews.map((url, index) => (
                        <img
                          src={url}
                          alt={`Selected gallery image ${index + 1}`}
                          key={url}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="program-form-sidebar">
            <section className="program-form-card program-form-publish-card">
              <div className="program-form-section-heading">
                <div className="program-form-section-icon">
                  <Save size={18} />
                </div>
                <div>
                  <h2>Publishing</h2>
                  <p>Manage visibility on JVP Connect.</p>
                </div>
              </div>

              <label className="program-form-toggle-row">
                <span>
                  <strong>Publish record</strong>
                  <small>Make this record available publicly.</small>
                </span>
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) =>
                    updateField("isPublished", event.target.checked)
                  }
                />
                <span className="program-form-toggle" />
              </label>

              <label className="program-form-toggle-row">
                <span>
                  <strong>Featured record</strong>
                  <small>Highlight it in featured sections.</small>
                </span>
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) =>
                    updateField("isFeatured", event.target.checked)
                  }
                />
                <span className="program-form-toggle" />
              </label>

              <div className="program-form-publish-summary">
                <span
                  className={`program-form-status-dot ${
                    form.isPublished ? "is-published" : ""
                  }`}
                />
                <div>
                  <strong>
                    {form.isPublished ? "Public record" : "Draft visibility"}
                  </strong>
                  <p>
                    {form.isPublished
                      ? "Visitors may be able to view this record."
                      : "Only authorised users should see unpublished records."}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="program-form-primary-button"
                disabled={isBusy}
              >
                <Save size={17} />
                {isBusy
                  ? "Saving..."
                  : isEditing
                    ? "Save changes"
                    : "Create record"}
              </button>

              <button
                type="button"
                className="program-form-secondary-button program-form-cancel-button"
                onClick={() =>
                  onCancel ? onCancel() : navigate("/admin/programs")
                }
                disabled={isBusy}
              >
                Cancel
              </button>

              <p className="program-form-required-note">
                <span className="required">*</span> Required fields
              </p>
            </section>

            <section className="program-form-card program-form-tip-card">
              <div className="program-form-tip-icon">
                <FileText size={18} />
              </div>
              <h3>Before you publish</h3>
              <ul>
                <li>Check the dates and location.</li>
                <li>Verify attendance and beneficiary figures.</li>
                <li>Confirm that partner names are accurate.</li>
                <li>Use clear, descriptive image alt text.</li>
              </ul>
            </section>
          </aside>
        </div>

        <div className="program-form-mobile-actions">
          <button
            type="button"
            className="program-form-secondary-button"
            onClick={() =>
              onCancel ? onCancel() : navigate("/admin/programs")
            }
            disabled={isBusy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="program-form-primary-button"
            disabled={isBusy}
          >
            <Save size={17} />
            {isBusy ? "Saving..." : isEditing ? "Save changes" : "Create record"}
          </button>
        </div>
      </form>
    </div>
  );
}

function slugify(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
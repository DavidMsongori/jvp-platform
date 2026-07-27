import {
  useMemo,
  useState,
} from "react";

import {
  FiDownload,
  FiExternalLink,
  FiFile,
  FiFilePlus,
  FiLink,
  FiPaperclip,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";

import {
  addMeetingDocument,
  removeMeetingDocument,
} from "../../services/meeting.service";

import "./MeetingDocuments.css";

const DOCUMENT_TYPES = [
  {
    value: "agenda",
    label: "Agenda",
  },
  {
    value: "minutes",
    label: "Minutes",
  },
  {
    value: "report",
    label: "Report",
  },
  {
    value: "presentation",
    label: "Presentation",
  },
  {
    value: "policy",
    label: "Policy document",
  },
  {
    value: "attachment",
    label: "General attachment",
  },
  {
    value: "other",
    label: "Other",
  },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  documentType: "attachment",
  fileUrl: "",
};

const getDocumentId = (document) => {
  return document?._id || document?.id || "";
};

const getDocumentTitle = (document) => {
  return (
    document?.title ||
    document?.name ||
    document?.fileName ||
    "Meeting document"
  );
};

const getDocumentUrl = (document) => {
  return (
    document?.fileUrl ||
    document?.url ||
    document?.documentUrl ||
    document?.file?.url ||
    ""
  );
};

const getDocumentType = (document) => {
  return (
    document?.documentType ||
    document?.type ||
    "attachment"
  );
};

const getDocumentDescription = (document) => {
  return document?.description || "";
};

const getUploadedByName = (document) => {
  const uploadedBy =
    document?.uploadedBy ||
    document?.createdBy ||
    document?.addedBy;

  if (!uploadedBy) {
    return "";
  }

  if (typeof uploadedBy === "string") {
    return "";
  }

  return (
    uploadedBy.fullName ||
    uploadedBy.name ||
    uploadedBy.email ||
    ""
  );
};

const formatDocumentType = (value) => {
  const configuredType = DOCUMENT_TYPES.find(
    (type) => type.value === value
  );

  if (configuredType) {
    return configuredType.label;
  }

  return String(value || "Attachment")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const isValidUrl = (value) => {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
};

const getFileExtension = (url = "") => {
  const cleanUrl = url.split("?")[0];

  const fileName =
    cleanUrl.split("/").pop() || "";

  const pieces = fileName.split(".");

  if (pieces.length < 2) {
    return "";
  }

  return pieces.pop().toUpperCase();
};

const MeetingDocuments = ({
  meetingId,
  documents = [],
  canManage = false,
  onMeetingRefresh,
}) => {
  const [showDocumentForm, setShowDocumentForm] =
    useState(false);

  const [formData, setFormData] =
    useState(EMPTY_FORM);

  const [submitting, setSubmitting] =
    useState(false);

  const [
    removingDocumentId,
    setRemovingDocumentId,
  ] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const normalizedDocuments = useMemo(() => {
    if (!Array.isArray(documents)) {
      return [];
    }

    return documents.map((document, index) => ({
      raw: document,

      id: getDocumentId(document),

      key:
        getDocumentId(document) ||
        `${getDocumentTitle(document)}-${index}`,

      title: getDocumentTitle(document),

      description:
        getDocumentDescription(document),

      fileUrl: getDocumentUrl(document),

      documentType:
        getDocumentType(document),

      uploadedBy:
        getUploadedByName(document),

      uploadedAt:
        document?.uploadedAt ||
        document?.createdAt ||
        document?.addedAt ||
        "",

      fileExtension: getFileExtension(
        getDocumentUrl(document)
      ),
    }));
  }, [documents]);

  const handleInputChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setShowDocumentForm(false);
  };

  const handleAddDocument = async (event) => {
    event.preventDefault();

    const title = formData.title.trim();
    const fileUrl = formData.fileUrl.trim();

    if (!title) {
      setError(
        "Please enter a title for the document."
      );

      return;
    }

    if (!fileUrl) {
      setError(
        "Please enter the document link."
      );

      return;
    }

    if (!isValidUrl(fileUrl)) {
      setError(
        "Please enter a valid HTTP or HTTPS document link."
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const documentData = {
        title,
        description:
          formData.description.trim(),
        documentType:
          formData.documentType,
        fileUrl,
      };

      await addMeetingDocument(
        meetingId,
        documentData
      );

      setSuccessMessage(
        "Document added successfully."
      );

      resetForm();

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to add the meeting document."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveDocument = async (
    document
  ) => {
    if (!document.id) {
      setError(
        "This document does not have a valid ID."
      );

      return;
    }

    const confirmed = window.confirm(
      `Remove "${document.title}" from this meeting?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingDocumentId(document.id);
      setError("");
      setSuccessMessage("");

      await removeMeetingDocument(
        meetingId,
        document.id
      );

      setSuccessMessage(
        "Document removed successfully."
      );

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to remove the meeting document."
      );
    } finally {
      setRemovingDocumentId("");
    }
  };

  const handleOpenDocument = (fileUrl) => {
    if (!fileUrl) {
      return;
    }

    window.open(
      fileUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <section className="meeting-documents">
      <div className="meeting-documents__header">
        <div>
          <span className="meeting-documents__eyebrow">
            Meeting resources
          </span>

          <h2>
            <FiPaperclip />
            Documents
          </h2>

          <p>
            Access agendas, reports, presentations
            and other files related to this meeting.
          </p>
        </div>

        <div className="meeting-documents__header-actions">
          <div className="meeting-documents__count">
            <strong>
              {normalizedDocuments.length}
            </strong>

            <span>
              document
              {normalizedDocuments.length === 1
                ? ""
                : "s"}
            </span>
          </div>

          {canManage && (
            <button
              type="button"
              className="meeting-documents__add-button"
              onClick={() =>
                setShowDocumentForm(
                  (currentValue) =>
                    !currentValue
                )
              }
            >
              {showDocumentForm ? (
                <>
                  <FiX />
                  Close
                </>
              ) : (
                <>
                  <FiFilePlus />
                  Add document
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="meeting-documents__alert meeting-documents__alert--error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="meeting-documents__alert meeting-documents__alert--success">
          {successMessage}
        </div>
      )}

      {canManage && showDocumentForm && (
        <form
          className="meeting-documents__form"
          onSubmit={handleAddDocument}
        >
          <div className="meeting-documents__form-heading">
            <div className="meeting-documents__form-icon">
              <FiUploadCloud />
            </div>

            <div>
              <h3>Add meeting document</h3>

              <p>
                Add a secure link to a file already
                uploaded to Cloudinary, Google Drive
                or another approved location.
              </p>
            </div>
          </div>

          <div className="meeting-documents__form-grid">
            <label>
              <span>Document title</span>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Example: Meeting agenda"
                maxLength={150}
                required
              />
            </label>

            <label>
              <span>Document type</span>

              <select
                name="documentType"
                value={
                  formData.documentType
                }
                onChange={handleInputChange}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="meeting-documents__form-full-width">
              <span>Document link</span>

              <div className="meeting-documents__url-input">
                <FiLink />

                <input
                  type="url"
                  name="fileUrl"
                  value={formData.fileUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/document.pdf"
                  required
                />
              </div>
            </label>

            <label className="meeting-documents__form-full-width">
              <span>
                Description
                <small>Optional</small>
              </span>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                maxLength={500}
                placeholder="Briefly describe the document and its purpose."
              />
            </label>
          </div>

          <div className="meeting-documents__form-footer">
            <button
              type="button"
              className="meeting-documents__cancel-button"
              onClick={resetForm}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="meeting-documents__submit-button"
              disabled={submitting}
            >
              <FiFilePlus />

              {submitting
                ? "Adding document..."
                : "Add document"}
            </button>
          </div>
        </form>
      )}

      {!normalizedDocuments.length ? (
        <div className="meeting-documents__empty">
          <div className="meeting-documents__empty-icon">
            <FiFile />
          </div>

          <h3>No meeting documents</h3>

          <p>
            Documents attached to this meeting will
            appear here.
          </p>

          {canManage && !showDocumentForm && (
            <button
              type="button"
              onClick={() =>
                setShowDocumentForm(true)
              }
            >
              <FiFilePlus />
              Add the first document
            </button>
          )}
        </div>
      ) : (
        <div className="meeting-documents__grid">
          {normalizedDocuments.map(
            (document) => {
              const isRemoving =
                removingDocumentId ===
                document.id;

              return (
                <article
                  key={document.key}
                  className="meeting-documents__card"
                >
                  <div className="meeting-documents__card-top">
                    <div className="meeting-documents__file-icon">
                      <FiFile />

                      {document.fileExtension && (
                        <span>
                          {
                            document.fileExtension
                          }
                        </span>
                      )}
                    </div>

                    <div className="meeting-documents__type">
                      {formatDocumentType(
                        document.documentType
                      )}
                    </div>
                  </div>

                  <div className="meeting-documents__card-content">
                    <h3>{document.title}</h3>

                    {document.description && (
                      <p>
                        {document.description}
                      </p>
                    )}
                  </div>

                  <div className="meeting-documents__metadata">
                    {document.uploadedBy && (
                      <span>
                        Added by{" "}
                        <strong>
                          {document.uploadedBy}
                        </strong>
                      </span>
                    )}

                    {document.uploadedAt && (
                      <span>
                        {formatDate(
                          document.uploadedAt
                        )}
                      </span>
                    )}
                  </div>

                  <div className="meeting-documents__card-actions">
                    {document.fileUrl ? (
                      <>
                        <button
                          type="button"
                          className="meeting-documents__view-button"
                          onClick={() =>
                            handleOpenDocument(
                              document.fileUrl
                            )
                          }
                        >
                          <FiExternalLink />
                          Open
                        </button>

                        <a
                          className="meeting-documents__download-button"
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <FiDownload />
                          Download
                        </a>
                      </>
                    ) : (
                      <span className="meeting-documents__missing-link">
                        File link unavailable
                      </span>
                    )}

                    {canManage && (
                      <button
                        type="button"
                        className="meeting-documents__remove-button"
                        onClick={() =>
                          handleRemoveDocument(
                            document
                          )
                        }
                        disabled={
                          isRemoving ||
                          !document.id
                        }
                      >
                        <FiTrash2 />

                        {isRemoving
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
};

export default MeetingDocuments;
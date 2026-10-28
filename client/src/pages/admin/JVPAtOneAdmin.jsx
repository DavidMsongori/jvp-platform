
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaCamera,
  FaCloudUploadAlt,
  FaTrash,
  FaSyncAlt,
  FaImages,
  FaExclamationCircle,
  FaCheckCircle,
  FaUsers,
  FaSearch,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
} from "react-icons/fa";

import {
  getJVPAtOnePhotos,
  uploadJVPAtOnePhoto,
  deleteJVPAtOnePhoto,
  getJVPAtOneRegistrations,
} from "../../services/jvpAtOneService";

import "./JVPAtOneAdmin.css";

const CONSTITUENCIES = ["Lamu East", "Lamu West"];

const WARDS = {
  "Lamu East": ["Faza", "Kiunga", "Basuba"],
  "Lamu West": [
    "Shela",
    "Mkomani",
    "Hindi",
    "Mkunumbi",
    "Hongwe",
    "Bahari",
    "Witu",
    "Mpeketoni",
  ],
};

function JVPAtOneAdmin() {
const fileInputRef = useRef(null);
const previewUrlsRef = useRef(new Map());
const [photos, setPhotos] = useState([]);
const [selectedFiles, setSelectedFiles] = useState([]);
const [uploadProgress, setUploadProgress] = useState({
  completed: 0,
  total: 0,
  currentName: "",
  failed: [],
});
const [title, setTitle] = useState("");
const [caption, setCaption] = useState("");

const [loading, setLoading] = useState(true);
const [uploading, setUploading] = useState(false);
const [deletingId, setDeletingId] = useState(null);

  const [registrations, setRegistrations] = useState([]);
  const [registrationLoading, setRegistrationLoading] = useState(true);
  const [registrationError, setRegistrationError] = useState("");
  const [registrationPagination, setRegistrationPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [constituencyFilter, setConstituencyFilter] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("registered");
  const [page, setPage] = useState(1);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPhotos = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getJVPAtOnePhotos();
      const data = response?.data ?? response;

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.photos)
          ? data.photos
          : Array.isArray(data?.data?.photos)
            ? data.data.photos
            : [];

      setPhotos(items);
    } catch (err) {
      setError(err.message || "Unable to load anniversary photos.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRegistrations = useCallback(async () => {
    setRegistrationLoading(true);
    setRegistrationError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await getJVPAtOneRegistrations(
        {
          search,
          constituency: constituencyFilter,
          ward: wardFilter,
          status: statusFilter,
          page,
          limit: 20,
        },
        token
      );

      const data = response?.data ?? response;

      setRegistrations(
        Array.isArray(data?.registrations)
          ? data.registrations
          : Array.isArray(data?.data?.registrations)
            ? data.data.registrations
            : []
      );

      const pagination =
        data?.pagination ?? data?.data?.pagination;

      if (pagination) {
        setRegistrationPagination({
          total: Number(pagination.total) || 0,
          page: Number(pagination.page) || page,
          limit: Number(pagination.limit) || 20,
          totalPages: Math.max(
            1,
            Number(pagination.totalPages) || 1
          ),
        });
      } else {
        setRegistrationPagination({
          total: 0,
          page,
          limit: 20,
          totalPages: 1,
        });
      }
    } catch (err) {
      setRegistrations([]);
      setRegistrationError(
        err.message || "Unable to load registered youths."
      );
    } finally {
      setRegistrationLoading(false);
    }
  }, [search, constituencyFilter, wardFilter, statusFilter, page]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);


useEffect(() => {
  return () => {
    previewUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    previewUrlsRef.current.clear();
  };
}, []);

const getPreviewUrl = (item) => {
  if (!previewUrlsRef.current.has(item.id)) {
    previewUrlsRef.current.set(
      item.id,
      URL.createObjectURL(item.file)
    );
  }

  return previewUrlsRef.current.get(item.id);
};

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleConstituencyChange = (event) => {
    setConstituencyFilter(event.target.value);
    setWardFilter("");
    setPage(1);
  };

  const handleWardChange = (event) => {
    setWardFilter(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const handleFileChange = (event) => {
  const incomingFiles = Array.from(event.target.files || []);
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];
  const maxSize = 10 * 1024 * 1024;

  setError("");
  setMessage("");

  const validFiles = [];
  const rejectedFiles = [];

  incomingFiles.forEach((file) => {
    if (!allowedTypes.includes(file.type)) {
      rejectedFiles.push(`${file.name}: unsupported format`);
      return;
    }

    if (file.size > maxSize) {
      rejectedFiles.push(`${file.name}: exceeds 10 MB`);
      return;
    }

    const alreadySelected = selectedFiles.some(
      (item) =>
        item.file.name === file.name &&
        item.file.size === file.size &&
        item.file.lastModified === file.lastModified
    );

    if (!alreadySelected) {
      validFiles.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
      });
    }
  });

  setSelectedFiles((current) => [...current, ...validFiles]);

  if (rejectedFiles.length) {
    setError(
      `Some files were skipped: ${rejectedFiles.join("; ")}.`
    );
  } else if (validFiles.length) {
    setMessage(
      `${validFiles.length} photo(s) added to your upload queue.`
    );
  }

  // Allows the same file to be selected again after removal.
  event.target.value = "";
};

const removeSelectedFile = (id) => {
  const previewUrl = previewUrlsRef.current.get(id);

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrlsRef.current.delete(id);
  }

  setSelectedFiles((current) =>
    current.filter((item) => item.id !== id)
  );
};

  const handleUpload = async (event) => {
  event.preventDefault();

  setError("");
  setMessage("");

  if (!selectedFiles.length) {
    setError("Please select at least one photo to upload.");
    return;
  }

  if (!title.trim()) {
    setError("Please enter a photo title.");
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    setError("Your session has expired. Please log in again.");
    return;
  }

  const queue = [...selectedFiles];

  setUploading(true);
  setUploadProgress({
    completed: 0,
    total: queue.length,
    currentName: "",
    failed: [],
  });

  const failed = [];
  let completed = 0;

  try {
    for (const item of queue) {
      setUploadProgress((current) => ({
        ...current,
        currentName: item.file.name,
        completed,
        failed: [...failed],
      }));

      try {
        const filenameWithoutExtension = item.file.name.replace(
          /\.[^.]+$/,
          ""
        );

        // Give each uploaded photo a distinct title when
        // several photos are selected together.
        const photoTitle =
          queue.length === 1
            ? title.trim()
            : `${title.trim()} - ${filenameWithoutExtension}`;

        await uploadJVPAtOnePhoto({
          file: item.file,
          title: photoTitle,
          caption,
          token,
        });

       completed++;

const previewUrl = previewUrlsRef.current.get(item.id);

if (previewUrl) {
  URL.revokeObjectURL(previewUrl);
  previewUrlsRef.current.delete(item.id);
}

setUploadProgress((current) => ({
  ...current,
  completed,
  failed: [...failed],
}));

setSelectedFiles((current) =>
  current.filter((selected) => selected.id !== item.id)
);
      } catch (err) {
        failed.push({
          name: item.file.name,
          message: err.message || "Upload failed.",
        });

        setUploadProgress((current) => ({
          ...current,
          completed,
          failed: [...failed],
        }));
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    await loadPhotos();

    if (failed.length === 0) {
      setMessage(
        `Successfully uploaded all ${completed} photo(s).`
      );
      setTitle("");
      setCaption("");
    } else {
      setError(
        `${completed} photo(s) uploaded successfully; ${failed.length} failed. Failed photos remain selected so you can retry them.`
      );
    }
  } catch (err) {
    setError(err.message || "Unable to refresh the gallery.");
  } finally {
    setUploading(false);
    setUploadProgress((current) => ({
      ...current,
      currentName: "",
      completed,
      failed: [...failed],
    }));
  }
};

  const handleDelete = async (photo) => {
    const photoId = photo._id || photo.id;

    if (!photoId) {
      setError("This photo has no valid record ID.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${photo.title || "this photo"}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setDeletingId(photoId);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      await deleteJVPAtOnePhoto(photoId, token);

      setPhotos((current) =>
        current.filter(
          (item) => (item._id || item.id) !== photoId
        )
      );

      setMessage("Photo deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete this photo.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatPhone = (phone) => phone || "—";

  const refreshAll = () => {
    setError("");
    setMessage("");
    loadPhotos();
    loadRegistrations();
  };

  return (
    <div className="jvp-one-admin">
      <header className="jvp-one-admin-header">
        <div>
          <span className="jvp-one-eyebrow">
            JUMUIYA YA VIJANA WA PWANI
          </span>

          <h1>JVP @ 1 Management</h1>

          <p>
            Manage anniversary registrations and photos celebrating
            youth leadership across the Coast.
          </p>
        </div>

        <button
          type="button"
          className="jvp-one-refresh"
          onClick={refreshAll}
          disabled={loading || registrationLoading}
        >
          <FaSyncAlt />
          Refresh
        </button>
      </header>

      {error && (
        <div className="jvp-one-alert error" role="alert">
          <FaExclamationCircle />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="jvp-one-alert success" role="status">
          <FaCheckCircle />
          <span>{message}</span>
        </div>
      )}

      <section className="jvp-one-stats jvp-one-stats-grid">
        <div className="jvp-one-stat-icon">
          <FaUsers />
        </div>

        <div>
          <span>Registered youths</span>
          <strong>
            {registrationLoading
              ? "…"
              : registrationPagination.total}
          </strong>
        </div>

        <div className="jvp-one-stat-icon">
          <FaImages />
        </div>

        <div>
          <span>Gallery photos</span>
          <strong>{photos.length}</strong>
        </div>
      </section>

      <section className="jvp-one-registrations">
        <div className="jvp-one-gallery-heading">
          <div>
            <h2>
              <FaUsers /> Registered youths
            </h2>
            <p>
              View and filter registrations for the JVP @ 1
              anniversary celebration.
            </p>
          </div>

          <span className="jvp-one-count">
            {registrationPagination.total}{" "}
            {registrationPagination.total === 1
              ? "registration"
              : "registrations"}
          </span>
        </div>

        <div className="jvp-one-registration-filters">
          <div className="jvp-one-search-field">
            <FaSearch />
            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search name or phone number"
              aria-label="Search registered youths"
            />
          </div>

          <div className="jvp-one-filter-field">
            <FaFilter />
            <select
              value={constituencyFilter}
              onChange={handleConstituencyChange}
              aria-label="Filter by constituency"
            >
              <option value="">All constituencies</option>
              {CONSTITUENCIES.map((constituency) => (
                <option key={constituency} value={constituency}>
                  {constituency}
                </option>
              ))}
            </select>
          </div>

          <div className="jvp-one-filter-field">
            <FaMapMarkerAlt />
            <select
              value={wardFilter}
              onChange={handleWardChange}
              aria-label="Filter by ward"
              disabled={!constituencyFilter}
            >
              <option value="">All wards</option>
              {(WARDS[constituencyFilter] || []).map((ward) => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
            </select>
          </div>

          <div className="jvp-one-filter-field">
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              aria-label="Filter by registration status"
            >
              <option value="registered">Registered</option>
              <option value="cancelled">Cancelled</option>
              <option value="all">All statuses</option>
            </select>
          </div>
        </div>

        {registrationError && (
          <div className="jvp-one-alert error" role="alert">
            <FaExclamationCircle />
            <span>{registrationError}</span>
            <button
              type="button"
              onClick={loadRegistrations}
              className="jvp-one-inline-retry"
            >
              Try again
            </button>
          </div>
        )}

        {registrationLoading ? (
          <div className="jvp-one-empty">
            <FaSyncAlt className="jvp-one-loading-icon" />
            <p>Loading registrations...</p>
          </div>
        ) : registrationError ? null : registrations.length === 0 ? (
          <div className="jvp-one-empty">
            <FaUsers />
            <h3>No registrations found</h3>
            <p>
              Try changing your search or filters to see other
              registrations.
            </p>
          </div>
        ) : (
          <>
            <div className="jvp-one-table-wrapper">
              <table className="jvp-one-registration-table">
                <thead>
                  <tr>
                    <th>Youth</th>
                    <th>Phone number</th>
                    <th>Constituency</th>
                    <th>Ward</th>
                    <th>Date registered</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {registrations.map((registration, index) => {
                    const id =
                      registration._id ||
                      registration.id ||
                      `${registration.phone}-${index}`;

                    const status =
                      registration.registrationStatus || "registered";

                    return (
                      <tr key={id}>
                        <td>
                          <div className="jvp-one-youth-name">
                            <span className="jvp-one-avatar">
                              {(registration.fullName || "Y")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                            <strong>
                              {registration.fullName || "Unnamed youth"}
                            </strong>
                          </div>
                        </td>

                        <td>
                          <span className="jvp-one-table-detail">
                            <FaPhone />
                            {formatPhone(registration.phone)}
                          </span>
                        </td>

                        <td>{registration.constituency || "—"}</td>

                        <td>{registration.ward || "—"}</td>

                        <td>
                          <span className="jvp-one-table-detail">
                            <FaCalendarAlt />
                            {formatDate(registration.createdAt)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`jvp-one-status ${status.toLowerCase()}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="jvp-one-pagination">
              <span>
                Page {registrationPagination.page} of{" "}
                {registrationPagination.totalPages}
              </span>

              <div>
                <button
                  type="button"
                  onClick={() => setPage((current) => current - 1)}
                  disabled={
                    page <= 1 ||
                    registrationLoading
                  }
                  aria-label="Previous page"
                >
                  <FaChevronLeft />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={
                    page >= registrationPagination.totalPages ||
                    registrationLoading
                  }
                  aria-label="Next page"
                >
                  Next
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="jvp-one-upload-card">
  <div className="jvp-one-section-heading">
    <div className="jvp-one-heading-icon">
      <FaCloudUploadAlt />
    </div>

    <div>
      <h2>Bulk photo upload</h2>
      <p>
        Select multiple anniversary photos, preview them, and
        upload them together.
      </p>
    </div>
  </div>

  <form onSubmit={handleUpload}>
    <div className="jvp-one-form-grid">
      <div className="jvp-one-field">
        <label htmlFor="jvp-photo-title">Photo title *</label>

        <input
          id="jvp-photo-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. JVP @ 1 Anniversary"
          maxLength={120}
          required
        />

        <small>
          When uploading multiple photos, each title will include
          its filename.
        </small>
      </div>

      <div className="jvp-one-field">
        <label htmlFor="jvp-photo-caption">Caption</label>

        <input
          id="jvp-photo-caption"
          type="text"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Add a short description"
          maxLength={500}
        />
      </div>
    </div>

    <div className="jvp-one-field jvp-one-file-field">
      <label htmlFor="jvp-photo-file">Select photos *</label>

      <input
        ref={fileInputRef}
        id="jvp-photo-file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
      />

      <small>
        JPG, PNG or WEBP. Maximum 10 MB per photo. You can select
        more photos after your first selection.
      </small>
    </div>

    {selectedFiles.length > 0 && (
      <div className="jvp-one-selected-section">
        <div className="jvp-one-selected-heading">
          <h3>Selected photos</h3>
          <span>{selectedFiles.length} queued</span>
        </div>

        <div className="jvp-one-preview-grid">
          {selectedFiles.map((item) => (
            <article className="jvp-one-preview-card" key={item.id}>
              <div className="jvp-one-preview-image">
                <img
  src={getPreviewUrl(item)}
  alt={item.file.name}
/>
              </div>

              <div className="jvp-one-preview-details">
                <strong title={item.file.name}>
                  {item.file.name}
                </strong>

                <small>
                  {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                </small>

                <button
                  type="button"
                  className="jvp-one-remove-selected"
                  onClick={() => removeSelectedFile(item.id)}
                  disabled={uploading}
                >
                  <FaTrash />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    )}

    {uploading && (
      <div className="jvp-one-upload-progress" role="status">
        <div className="jvp-one-progress-heading">
          <strong>Uploading photos...</strong>
          <span>
            {uploadProgress.completed} of {uploadProgress.total}
          </span>
        </div>

        <div
          className="jvp-one-progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={uploadProgress.total}
          aria-valuenow={uploadProgress.completed}
        >
          <div
            className="jvp-one-progress-fill"
            style={{
              width: `${
                uploadProgress.total
                  ? (uploadProgress.completed /
                      uploadProgress.total) *
                    100
                  : 0
              }%`,
            }}
          />
        </div>

        {uploadProgress.currentName && (
          <small>
            Processing: {uploadProgress.currentName}
          </small>
        )}
      </div>
    )}

    {uploadProgress.failed.length > 0 && (
      <div className="jvp-one-upload-failures">
        <h3>Photos that failed</h3>

        <ul>
          {uploadProgress.failed.map((item) => (
            <li key={`${item.name}-${item.message}`}>
              <strong>{item.name}</strong>: {item.message}
            </li>
          ))}
        </ul>
      </div>
    )}

    <button
      type="submit"
      className="jvp-one-upload-button"
      disabled={uploading || selectedFiles.length === 0}
    >
      <FaCloudUploadAlt />
      {uploading
        ? `Uploading ${uploadProgress.completed}/${uploadProgress.total}...`
        : `Upload ${selectedFiles.length || ""} photo${
            selectedFiles.length === 1 ? "" : "s"
          }`}
    </button>
  </form>
</section>

      <section className="jvp-one-gallery-section">
        <div className="jvp-one-gallery-heading">
          <div>
            <h2>Uploaded photos</h2>
            <p>
              Photos stored for the JVP @ 1 anniversary gallery.
            </p>
          </div>

          <span className="jvp-one-count">
            {photos.length} {photos.length === 1 ? "photo" : "photos"}
          </span>
        </div>

        {loading ? (
          <div className="jvp-one-empty">
            <FaSyncAlt className="jvp-one-loading-icon" />
            <p>Loading gallery photos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="jvp-one-empty">
            <FaImages />
            <h3>No photos uploaded yet</h3>
            <p>
              Upload your first photo to start building the gallery.
            </p>
          </div>
        ) : (
          <div className="jvp-one-photo-grid">
            {photos.map((photo) => {
              const id = photo._id || photo.id;
              const imageUrl =
                photo.secureUrl ||
                photo.secure_url ||
                photo.imageUrl ||
                photo.url;

              return (
                <article className="jvp-one-photo-card" key={id}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={photo.title || "JVP anniversary"}
                      loading="lazy"
                    />
                  ) : (
                    <div className="jvp-one-missing-image">
                      <FaImages />
                      <span>Image unavailable</span>
                    </div>
                  )}

                  <div className="jvp-one-photo-details">
                    <h3>{photo.title || "Untitled photo"}</h3>

                    {photo.caption && <p>{photo.caption}</p>}

                    <button
                      type="button"
                      className="jvp-one-delete-button"
                      onClick={() => handleDelete(photo)}
                      disabled={deletingId === (photo._id || photo.id)}
                    >
                      <FaTrash />
                      {deletingId === (photo._id || photo.id)
                        ? "Deleting..."
                        : "Delete photo"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default JVPAtOneAdmin;

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaCloudUploadAlt,
  FaTrash,
  FaSyncAlt,
  FaImages,
  FaExclamationCircle,
  FaCheckCircle,
  FaArrowLeft,
} from "react-icons/fa";

import {
  getJVPAtOnePhotos,
  uploadJVPAtOnePhoto,
  deleteJVPAtOnePhoto,
} from "../../services/jvpAtOneService";

import "./JVPAtOneAdmin.css";

export default function JVPAtOnePhotosAdmin() {
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef(new Map());

  const [photos, setPhotos] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [uploadProgress, setUploadProgress] = useState({
    completed: 0,
    total: 0,
    currentName: "",
    failed: [],
  });

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

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

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

          setSelectedFiles((current) =>
            current.filter((selected) => selected.id !== item.id)
          );

          setUploadProgress((current) => ({
            ...current,
            completed,
            failed: [...failed],
          }));
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

  return (
    <div className="jvp-one-admin">
      <header className="jvp-one-admin-header">
        <div>
          <span className="jvp-one-eyebrow">
            JUMUIYA YA VIJANA WA PWANI
          </span>

          <h1>Photo Management</h1>

          <p>
            Upload, view and manage photos for the JVP @ 1
            anniversary gallery.
          </p>
        </div>

        <button
          type="button"
          className="jvp-one-refresh"
          onClick={loadPhotos}
          disabled={loading}
        >
          <FaSyncAlt />
          Refresh
        </button>
      </header>

      <div style={{ marginBottom: "20px" }}>
        <Link
          to="/admin/jvp-at-one"
          className="jvp-one-back-link"
        >
          <FaArrowLeft />
          Back to JVP @ 1 Dashboard
        </Link>
      </div>

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

      <section className="jvp-one-upload-card">
        <div className="jvp-one-section-heading">
          <div className="jvp-one-heading-icon">
            <FaCloudUploadAlt />
          </div>

          <div>
            <h2>Bulk photo upload</h2>
            <p>
              Select multiple anniversary photos, preview them,
              and upload them together.
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
                When uploading multiple photos, each title will
                include its filename.
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
              JPG, PNG or WEBP. Maximum 10 MB per photo. You can
              select more photos after your first selection.
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
                  <article
                    className="jvp-one-preview-card"
                    key={item.id}
                  >
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
                      disabled={deletingId === id}
                    >
                      <FaTrash />
                      {deletingId === id
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
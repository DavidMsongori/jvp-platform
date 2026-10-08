import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaSave,
  FaPaperPlane,
  FaStar,
  FaImage,
  FaSearch,
  FaEye,
  FaArchive,
  FaCloudUploadAlt,
  FaTimes,
  FaCheckCircle,
} from "react-icons/fa";

import { useNews } from "../../../context/NewsContext";

import {
  NEWS_CATEGORY_OPTIONS,
  NEWS_STATUS_OPTIONS,
  NEWS_DEFAULTS,
  NEWS_CONTENT_LIMITS,
  NEWS_MEDIA,
} from "../../../constants/news.constants.js";

import "./NewsEditor.css";


/* ==========================================================
   HELPERS
========================================================== */

const createSlug = (value = "") => {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};


const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",

  featuredImage: "",
  featuredImagePublicId: "",

  category: "",
  tags: "",

  status: NEWS_DEFAULTS?.STATUS || "draft",

  featured: false,

  seo: {
    metaTitle: "",
    metaDescription: "",
    keywords: "",
  },
};


const getUploadError = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Failed to upload the featured image."
  );
};


/* ==========================================================
   COMPONENT
========================================================== */

const NewsEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditing = Boolean(id);


  /* ========================================================
     CONTEXT
  ======================================================== */

  const {
    currentArticle,
    loading,
    error,

    imageUploading,
    imageUploadError,

    fetchArticle,
    createNews,
    updateNews,
    publishNews,
    uploadNewsImage,

    clearCurrentArticle,
    clearError,
  } = useNews();


  /* ========================================================
     STATE
  ======================================================== */

  const [form, setForm] = useState(emptyForm);

  const [slugManuallyEdited, setSlugManuallyEdited] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [publishing, setPublishing] = useState(false);

  const [validationErrors, setValidationErrors] =
    useState({});

  const [localUploadError, setLocalUploadError] =
    useState("");

  const [imageInputKey, setImageInputKey] =
    useState(0);


  /* ========================================================
     LOAD ARTICLE
  ======================================================== */

  useEffect(() => {
    clearError();
    clearCurrentArticle();

    if (isEditing) {
      fetchArticle(id);
    }

    return () => {
      clearCurrentArticle();
    };
  }, [id, isEditing]);


  /* ========================================================
     POPULATE EDIT FORM
  ======================================================== */

  useEffect(() => {
    if (!isEditing || !currentArticle) {
      return;
    }

    setForm({
      title: currentArticle.title || "",

      slug: currentArticle.slug || "",

      excerpt: currentArticle.excerpt || "",

      content: currentArticle.content || "",

      featuredImage:
        currentArticle.featuredImage || "",

      featuredImagePublicId:
        currentArticle.featuredImagePublicId || "",

      category:
        currentArticle.category || "",

      tags: Array.isArray(currentArticle.tags)
        ? currentArticle.tags.join(", ")
        : currentArticle.tags || "",

      status:
        currentArticle.status || "draft",

      featured:
        Boolean(currentArticle.featured),

      seo: {
        metaTitle:
          currentArticle.seo?.metaTitle || "",

        metaDescription:
          currentArticle.seo?.metaDescription || "",

        keywords:
          Array.isArray(currentArticle.seo?.keywords)
            ? currentArticle.seo.keywords.join(", ")
            : currentArticle.seo?.keywords || "",
      },
    });

    setSlugManuallyEdited(true);
    setLocalUploadError("");
  }, [currentArticle, isEditing]);


  /* ========================================================
     DERIVED VALUES
  ======================================================== */

  const titleCount = form.title.length;

  const excerptCount = form.excerpt.length;

  const contentCount = form.content.length;

  const metaTitleCount =
    form.seo.metaTitle.length;

  const metaDescriptionCount =
    form.seo.metaDescription.length;


  const editorTitle = useMemo(
    () =>
      isEditing
        ? "Edit News Article"
        : "Create News Article",
    [isEditing]
  );


  /* ========================================================
     FIELD HANDLERS
  ======================================================== */

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setValidationErrors((previous) => ({
      ...previous,
      [field]: "",
    }));


    /* --------------------------------------
       AUTO SLUG
    -------------------------------------- */

    if (
      field === "title" &&
      !slugManuallyEdited
    ) {
      setForm((previous) => ({
        ...previous,
        slug: createSlug(value),
      }));
    }
  };


  const updateSeoField = (field, value) => {
    setForm((previous) => ({
      ...previous,

      seo: {
        ...previous.seo,
        [field]: value,
      },
    }));

    setValidationErrors((previous) => ({
      ...previous,
      [`seo.${field}`]: "",
    }));
  };


  const handleSlugChange = (value) => {
    setSlugManuallyEdited(true);

    updateField(
      "slug",
      createSlug(value)
    );
  };


  /* ========================================================
     FEATURED IMAGE UPLOAD
  ======================================================== */

  const handleFeaturedImageUpload = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setLocalUploadError("");
    clearError();

    const maxFileSize =
      NEWS_MEDIA?.MAX_FILE_SIZE ||
      2 * 1024 * 1024;

    const allowedMimeTypes =
      NEWS_MEDIA?.ALLOWED_MIME_TYPES || [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];


    /* --------------------------------------
       FILE TYPE
    -------------------------------------- */

    if (
      !allowedMimeTypes.includes(
        file.type
      )
    ) {
      setLocalUploadError(
        "Invalid image format. Please upload JPG, JPEG, PNG or WEBP."
      );

      setImageInputKey(
        (previous) => previous + 1
      );

      return;
    }


    /* --------------------------------------
       FILE SIZE
    -------------------------------------- */

    if (file.size > maxFileSize) {
      const maxSizeMb =
        NEWS_MEDIA?.MAX_FILE_SIZE_MB || 2;

      setLocalUploadError(
        `Image is too large. Maximum allowed size is ${maxSizeMb} MB.`
      );

      setImageInputKey(
        (previous) => previous + 1
      );

      return;
    }


    try {
      const response =
        await uploadNewsImage(file);

      const image =
        response?.image || response?.data?.image;

      const imageUrl =
        image?.secureUrl ||
        image?.url ||
        "";

      const publicId =
        image?.publicId ||
        "";


      if (!imageUrl) {
        throw new Error(
          "The image was uploaded but no image URL was returned."
        );
      }


      setForm((previous) => ({
        ...previous,

        featuredImage:
          imageUrl,

        featuredImagePublicId:
          publicId,
      }));

      setValidationErrors((previous) => ({
        ...previous,
        featuredImage: "",
      }));

    } catch (uploadError) {
      console.error(
        "Featured image upload failed:",
        uploadError
      );

      setLocalUploadError(
        getUploadError(uploadError)
      );

      setImageInputKey(
        (previous) => previous + 1
      );
    }
  };


  /* ========================================================
     REMOVE FEATURED IMAGE
  ======================================================== */

  const handleRemoveFeaturedImage = () => {
    setForm((previous) => ({
      ...previous,

      featuredImage: "",

      featuredImagePublicId: "",
    }));

    setLocalUploadError("");

    setImageInputKey(
      (previous) => previous + 1
    );
  };


  /* ========================================================
     VALIDATION
  ======================================================== */

  const validateForm = () => {
    const errors = {};


    if (!form.title.trim()) {
      errors.title =
        "Article title is required.";
    }


    if (!form.category) {
      errors.category =
        "Please select a category.";
    }


    if (!form.excerpt.trim()) {
      errors.excerpt =
        "Article excerpt is required.";
    }


    if (!form.content.trim()) {
      errors.content =
        "Article content is required.";
    }


    if (
      form.title.length >
      NEWS_CONTENT_LIMITS?.TITLE_MAX
    ) {
      errors.title =
        `Title cannot exceed ${NEWS_CONTENT_LIMITS.TITLE_MAX} characters.`;
    }


    if (
      form.excerpt.length >
      NEWS_CONTENT_LIMITS?.EXCERPT_MAX
    ) {
      errors.excerpt =
        `Excerpt cannot exceed ${NEWS_CONTENT_LIMITS.EXCERPT_MAX} characters.`;
    }


    if (
      form.seo.metaTitle.length >
      NEWS_CONTENT_LIMITS?.SEO_TITLE_MAX
    ) {
      errors["seo.metaTitle"] =
        `Meta title cannot exceed ${NEWS_CONTENT_LIMITS.SEO_TITLE_MAX} characters.`;
    }


    if (
      form.seo.metaDescription.length >
      NEWS_CONTENT_LIMITS?.SEO_DESCRIPTION_MAX
    ) {
      errors["seo.metaDescription"] =
        `Meta description cannot exceed ${NEWS_CONTENT_LIMITS.SEO_DESCRIPTION_MAX} characters.`;
    }


    setValidationErrors(errors);

    return (
      Object.keys(errors).length === 0
    );
  };


  /* ========================================================
     BUILD PAYLOAD
  ======================================================== */

  const buildPayload = (
    status = form.status
  ) => {
    return {
      title:
        form.title.trim(),

      slug:
        form.slug.trim(),

      excerpt:
        form.excerpt.trim(),

      content:
        form.content,

      featuredImage:
        form.featuredImage.trim(),

      featuredImagePublicId:
        form.featuredImagePublicId.trim(),

      category:
        form.category,

      tags:
        form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),

      status,

      featured:
        Boolean(form.featured),

      seo: {
        metaTitle:
          form.seo.metaTitle.trim(),

        metaDescription:
          form.seo.metaDescription.trim(),

        keywords:
          form.seo.keywords
            .split(",")
            .map((keyword) =>
              keyword.trim()
            )
            .filter(Boolean),
      },
    };
  };


  /* ========================================================
     SAVE DRAFT
  ======================================================== */

  const handleSaveDraft = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    clearError();

    try {
      const payload =
        buildPayload("draft");


      if (isEditing) {
        await updateNews(
          id,
          payload
        );
      } else {
        const result =
          await createNews(
            payload
          );

        const createdId =
          result?.article?._id ||
          result?.data?._id ||
          result?._id;

        if (createdId) {
          navigate(
            `/admin/news/${createdId}/edit`
          );

          return;
        }
      }

      navigate("/admin/news");

    } catch (err) {
      console.error(
        "Failed to save news article:",
        err
      );
    } finally {
      setSaving(false);
    }
  };


  /* ========================================================
     PUBLISH
  ======================================================== */

  const handlePublish = async () => {
    if (!validateForm()) {
      return;
    }

    setPublishing(true);
    clearError();

    try {
      const payload =
        buildPayload("published");


      if (isEditing) {
        await updateNews(
          id,
          payload
        );

        await publishNews(id);

      } else {
        const result =
          await createNews(
            payload
          );

        const createdId =
          result?.article?._id ||
          result?.data?._id ||
          result?._id;

        if (createdId) {
          await publishNews(
            createdId
          );
        }
      }

      navigate("/admin/news");

    } catch (err) {
      console.error(
        "Failed to publish news article:",
        err
      );
    } finally {
      setPublishing(false);
    }
  };


  /* ========================================================
     CANCEL
  ======================================================== */

  const handleCancel = () => {
    navigate("/admin/news");
  };


  /* ========================================================
     LOADING EDITOR
  ======================================================== */

  if (
    isEditing &&
    loading &&
    !currentArticle
  ) {
    return (
      <div className="news-editor-page">
        <div className="news-editor-loading">
          <div className="news-editor-spinner" />

          <p>
            Loading article...
          </p>
        </div>
      </div>
    );
  }


  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="news-editor-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="news-editor-header">

        <div className="news-editor-heading">

          <button
            type="button"
            className="news-editor-back"
            onClick={handleCancel}
            aria-label="Back to News"
          >
            <FaArrowLeft />
          </button>

          <div>
            <span className="news-editor-eyebrow">
              News Management
            </span>

            <h1>
              {editorTitle}
            </h1>

            <p>
              {isEditing
                ? "Update and manage this JVP news article."
                : "Create and publish a new JVP news article."
              }
            </p>
          </div>

        </div>


        <div className="news-editor-header-actions">

          <button
            type="button"
            className="news-editor-btn news-editor-btn-secondary"
            onClick={handleCancel}
            disabled={
              saving ||
              publishing ||
              imageUploading
            }
          >
            Cancel
          </button>


          <button
            type="button"
            className="news-editor-btn news-editor-btn-outline"
            onClick={handleSaveDraft}
            disabled={
              saving ||
              publishing ||
              imageUploading
            }
          >
            <FaSave />

            {saving
              ? "Saving..."
              : "Save Draft"
            }
          </button>


          <button
            type="button"
            className="news-editor-btn news-editor-btn-primary"
            onClick={handlePublish}
            disabled={
              saving ||
              publishing ||
              imageUploading
            }
          >
            <FaPaperPlane />

            {publishing
              ? "Publishing..."
              : "Publish"
            }
          </button>

        </div>

      </header>


      {/* ====================================================
          ERROR
      ==================================================== */}

      {(error ||
        imageUploadError ||
        localUploadError ||
        Object.keys(validationErrors).length > 0) && (

        <div className="news-editor-alert">

          {localUploadError && (
            <span>
              {localUploadError}
            </span>
          )}

          {!localUploadError &&
            imageUploadError && (
              <span>
                {imageUploadError}
              </span>
            )}

          {!localUploadError &&
            !imageUploadError &&
            error && (
              <span>
                {typeof error === "string"
                  ? error
                  : error?.message ||
                    "Something went wrong."
                }
              </span>
            )}

          {!localUploadError &&
            !imageUploadError &&
            !error &&
            Object.values(
              validationErrors
            )[0] && (
              <span>
                {
                  Object.values(
                    validationErrors
                  )[0]
                }
              </span>
            )}

        </div>
      )}


      {/* ====================================================
          CONTENT
      ==================================================== */}

      <form
        className="news-editor-layout"
        onSubmit={(event) => {
          event.preventDefault();
          handleSaveDraft();
        }}
      >

        {/* ==================================================
            MAIN COLUMN
        ================================================== */}

        <main className="news-editor-main">

          {/* -----------------------------------------------
              BASIC INFORMATION
          ----------------------------------------------- */}

          <section className="news-editor-card">

            <div className="news-editor-card-header">

              <div>
                <h2>
                  Article Information
                </h2>

                <p>
                  Add the main details of your news article.
                </p>
              </div>

            </div>


            {/* TITLE */}

            <div className="news-editor-field">

              <label htmlFor="news-title">
                Article Title
                <span>*</span>
              </label>

              <input
                id="news-title"
                type="text"
                value={form.title}
                onChange={(event) =>
                  updateField(
                    "title",
                    event.target.value
                  )
                }
                placeholder="Enter article title"
                maxLength={
                  NEWS_CONTENT_LIMITS?.TITLE_MAX
                }
                className={
                  validationErrors.title
                    ? "has-error"
                    : ""
                }
              />

              <div className="news-editor-field-meta">

                <span className="news-editor-error">
                  {validationErrors.title}
                </span>

                <span>
                  {titleCount}/
                  {NEWS_CONTENT_LIMITS?.TITLE_MAX}
                </span>

              </div>

            </div>


            {/* SLUG */}

            <div className="news-editor-field">

              <label htmlFor="news-slug">
                URL Slug
              </label>

              <input
                id="news-slug"
                type="text"
                value={form.slug}
                onChange={(event) =>
                  handleSlugChange(
                    event.target.value
                  )
                }
                placeholder="article-url-slug"
              />

              <small>
                Used in the public article URL.
              </small>

            </div>


            {/* EXCERPT */}

            <div className="news-editor-field">

              <label htmlFor="news-excerpt">
                Excerpt
                <span>*</span>
              </label>

              <textarea
                id="news-excerpt"
                rows="4"
                value={form.excerpt}
                onChange={(event) =>
                  updateField(
                    "excerpt",
                    event.target.value
                  )
                }
                placeholder="Write a short summary of the article..."
                maxLength={
                  NEWS_CONTENT_LIMITS?.EXCERPT_MAX
                }
                className={
                  validationErrors.excerpt
                    ? "has-error"
                    : ""
                }
              />

              <div className="news-editor-field-meta">

                <span className="news-editor-error">
                  {validationErrors.excerpt}
                </span>

                <span>
                  {excerptCount}/
                  {NEWS_CONTENT_LIMITS?.EXCERPT_MAX}
                </span>

              </div>

            </div>


            {/* CONTENT */}

            <div className="news-editor-field">

              <label htmlFor="news-content">
                Article Content
                <span>*</span>
              </label>

              <textarea
                id="news-content"
                rows="18"
                value={form.content}
                onChange={(event) =>
                  updateField(
                    "content",
                    event.target.value
                  )
                }
                placeholder="Write the full news article here..."
                className={
                  validationErrors.content
                    ? "has-error"
                    : ""
                }
              />

              <div className="news-editor-field-meta">

                <span className="news-editor-error">
                  {validationErrors.content}
                </span>

                <span>
                  {contentCount.toLocaleString()} characters
                </span>

              </div>

            </div>

          </section>


          {/* -----------------------------------------------
              FEATURED IMAGE
          ----------------------------------------------- */}

          <section className="news-editor-card">

            <div className="news-editor-card-header">

              <div>
                <h2>
                  Featured Image
                </h2>

                <p>
                  Upload the main image displayed with the article.
                </p>
              </div>

              <FaImage />

            </div>


            {!form.featuredImage ? (

              <div className="news-editor-upload">

                <input
                  key={imageInputKey}
                  id="news-image"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={
                    handleFeaturedImageUpload
                  }
                  disabled={imageUploading}
                />

                <label
                  htmlFor="news-image"
                  className={
                    imageUploading
                      ? "is-uploading"
                      : ""
                  }
                >

                  <div className="news-editor-upload-icon">

                    {imageUploading ? (
                      <div className="news-editor-upload-spinner" />
                    ) : (
                      <FaCloudUploadAlt />
                    )}

                  </div>

                  <strong>
                    {imageUploading
                      ? "Uploading image..."
                      : "Upload featured image"
                    }
                  </strong>

                  <span>
                    JPG, JPEG, PNG or WEBP
                  </span>

                  <small>
                    Maximum file size: 10 MB
                  </small>

                </label>

              </div>

            ) : (

              <div className="news-editor-image-wrapper">

                <div className="news-editor-image-preview">

                  <img
                    src={form.featuredImage}
                    alt={
                      form.title ||
                      "Featured preview"
                    }
                  />

                  <div className="news-editor-image-overlay">

                    <span>
                      <FaCheckCircle />
                      Image uploaded
                    </span>

                  </div>

                  <button
                    type="button"
                    className="news-editor-image-remove"
                    onClick={
                      handleRemoveFeaturedImage
                    }
                    disabled={
                      imageUploading ||
                      saving ||
                      publishing
                    }
                    aria-label="Remove featured image"
                    title="Remove featured image"
                  >
                    <FaTimes />
                  </button>

                </div>


                <div className="news-editor-image-info">

                  <div>
                    <strong>
                      Featured image ready
                    </strong>

                    <span>
                      Uploaded to Cloudinary
                    </span>
                  </div>

                  <button
                    type="button"
                    className="news-editor-change-image"
                    onClick={() =>
                      document
                        .getElementById(
                          "news-image-replace"
                        )
                        ?.click()
                    }
                    disabled={
                      imageUploading ||
                      saving ||
                      publishing
                    }
                  >
                    <FaImage />
                    Replace
                  </button>

                </div>


                <input
                  key={`replace-${imageInputKey}`}
                  id="news-image-replace"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={
                    handleFeaturedImageUpload
                  }
                  disabled={imageUploading}
                  hidden
                />

              </div>
            )}


            {form.featuredImagePublicId && (
              <div className="news-editor-upload-success">
                <FaCheckCircle />

                <span>
                  Image successfully uploaded and linked to this article.
                </span>
              </div>
            )}

          </section>


          {/* -----------------------------------------------
              SEO
          ----------------------------------------------- */}

          <section className="news-editor-card">

            <div className="news-editor-card-header">

              <div>
                <h2>
                  Search Engine Optimization
                </h2>

                <p>
                  Optimize this article for search engines.
                </p>
              </div>

              <FaSearch />

            </div>


            <div className="news-editor-field">

              <label htmlFor="meta-title">
                Meta Title
              </label>

              <input
                id="meta-title"
                type="text"
                value={form.seo.metaTitle}
                onChange={(event) =>
                  updateSeoField(
                    "metaTitle",
                    event.target.value
                  )
                }
                placeholder="SEO title"
                maxLength={
                  NEWS_CONTENT_LIMITS?.SEO_TITLE_MAX
                }
                className={
                  validationErrors[
                    "seo.metaTitle"
                  ]
                    ? "has-error"
                    : ""
                }
              />

              <div className="news-editor-field-meta">

                <span className="news-editor-error">
                  {
                    validationErrors[
                      "seo.metaTitle"
                    ]
                  }
                </span>

                <span>
                  {metaTitleCount}/
                  {NEWS_CONTENT_LIMITS?.SEO_TITLE_MAX}
                </span>

              </div>

            </div>


            <div className="news-editor-field">

              <label htmlFor="meta-description">
                Meta Description
              </label>

              <textarea
                id="meta-description"
                rows="4"
                value={
                  form.seo.metaDescription
                }
                onChange={(event) =>
                  updateSeoField(
                    "metaDescription",
                    event.target.value
                  )
                }
                placeholder="Brief description for search engines..."
                maxLength={
                  NEWS_CONTENT_LIMITS?.SEO_DESCRIPTION_MAX
                }
                className={
                  validationErrors[
                    "seo.metaDescription"
                  ]
                    ? "has-error"
                    : ""
                }
              />

              <div className="news-editor-field-meta">

                <span className="news-editor-error">
                  {
                    validationErrors[
                      "seo.metaDescription"
                    ]
                  }
                </span>

                <span>
                  {metaDescriptionCount}/
                  {NEWS_CONTENT_LIMITS?.SEO_DESCRIPTION_MAX}
                </span>

              </div>

            </div>


            <div className="news-editor-field">

              <label htmlFor="seo-keywords">
                Keywords
              </label>

              <input
                id="seo-keywords"
                type="text"
                value={
                  form.seo.keywords
                }
                onChange={(event) =>
                  updateSeoField(
                    "keywords",
                    event.target.value
                  )
                }
                placeholder="JVP, youth, Coast, Kenya"
              />

              <small>
                Separate keywords with commas.
              </small>

            </div>

          </section>

        </main>


        {/* ==================================================
            SIDEBAR
        ================================================== */}

        <aside className="news-editor-sidebar">

          {/* -----------------------------------------------
              PUBLISHING
          ----------------------------------------------- */}

          <section className="news-editor-card">

            <div className="news-editor-card-header">

              <div>
                <h2>
                  Publishing
                </h2>

                <p>
                  Manage article visibility.
                </p>
              </div>

              <FaPaperPlane />

            </div>


            <div className="news-editor-field">

              <label htmlFor="news-status">
                Status
              </label>

              <select
                id="news-status"
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value
                  )
                }
              >
                {NEWS_STATUS_OPTIONS?.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>

            </div>


            <label className="news-editor-checkbox">

              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  updateField(
                    "featured",
                    event.target.checked
                  )
                }
              />

              <span className="news-editor-checkbox-icon">
                <FaStar />
              </span>

              <span>
                <strong>
                  Featured Article
                </strong>

                <small>
                  Highlight this article on the News homepage.
                </small>
              </span>

            </label>

          </section>


          {/* -----------------------------------------------
              CATEGORY
          ----------------------------------------------- */}

          <section className="news-editor-card">

            <div className="news-editor-card-header">

              <div>
                <h2>
                  Category
                </h2>

                <p>
                  Organize your article.
                </p>
              </div>

            </div>


            <div className="news-editor-field">

              <label htmlFor="news-category">
                News Category
                <span>*</span>
              </label>

              <select
                id="news-category"
                value={form.category}
                onChange={(event) =>
                  updateField(
                    "category",
                    event.target.value
                  )
                }
                className={
                  validationErrors.category
                    ? "has-error"
                    : ""
                }
              >
                <option value="">
                  Select category
                </option>

                {NEWS_CATEGORY_OPTIONS?.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>

              {validationErrors.category && (
                <span className="news-editor-error">
                  {validationErrors.category}
                </span>
              )}

            </div>


            <div className="news-editor-field">

              <label htmlFor="news-tags">
                Tags
              </label>

              <input
                id="news-tags"
                type="text"
                value={form.tags}
                onChange={(event) =>
                  updateField(
                    "tags",
                    event.target.value
                  )
                }
                placeholder="Youth, Leadership, JVP"
              />

              <small>
                Separate tags with commas.
              </small>

            </div>

          </section>


          {/* -----------------------------------------------
              PREVIEW
          ----------------------------------------------- */}

          <section className="news-editor-preview-card">

            <div className="news-editor-preview-icon">
              <FaEye />
            </div>

            <div>
              <strong>
                Public Article
              </strong>

              <p>
                {form.slug
                  ? `/news/${form.slug}`
                  : "Article URL will appear here"
                }
              </p>
            </div>

          </section>


          {/* -----------------------------------------------
              QUICK ACTIONS
          ----------------------------------------------- */}

          <section className="news-editor-actions-card">

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={
                saving ||
                publishing ||
                imageUploading
              }
            >
              <FaSave />

              {saving
                ? "Saving..."
                : "Save Draft"
              }
            </button>


            <button
              type="button"
              onClick={handlePublish}
              disabled={
                saving ||
                publishing ||
                imageUploading
              }
            >
              <FaPaperPlane />

              {publishing
                ? "Publishing..."
                : "Publish Article"
              }
            </button>


            {isEditing &&
              form.status === "archived" && (
                <div className="news-editor-archived-note">

                  <FaArchive />

                  <span>
                    This article is archived.
                  </span>

                </div>
              )}

          </section>

        </aside>

      </form>

    </div>
  );
};


export default NewsEditor;
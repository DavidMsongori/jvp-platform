
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  ExternalLink,
  FileText,
  FolderOpen,
  Megaphone,
  Search,
  Speech,
} from "lucide-react";
import { Link } from "react-router-dom";

import api from "../../services/api";
import "./Resources.css";

/*
 * Update this path to match the public resources endpoint
 * implemented in your backend.
 */
const RESOURCES_ENDPOINT = "/presidential-resources";

const RESOURCE_CATEGORIES = [
  { value: "all", label: "All resources" },
  { value: "statement", label: "Statements" },
  { value: "speech", label: "Speeches" },
  { value: "announcement", label: "Announcements" },
  { value: "document", label: "Documents" },
  { value: "report", label: "Reports" },
];

/* ===========================================================
   HELPERS
=========================================================== */

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();

const extractResources = (response) => {
  const candidates = [
    response?.resources,
    response?.items,
    response?.results,
    response?.data?.resources,
    response?.data?.items,
    response?.data?.results,
    response?.data?.data?.resources,
    response?.data?.data?.items,
    response?.data?.data,
    response?.data,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

const getResourceId = (resource = {}) =>
  resource._id || resource.id || resource.slug;

const getResourceTitle = (resource = {}) =>
  resource.title ||
  resource.name ||
  resource.heading ||
  "Presidential resource";

const getResourceDescription = (resource = {}) =>
  resource.summary ||
  resource.excerpt ||
  resource.description ||
  resource.shortDescription ||
  "";

const getResourceCategory = (resource = {}) => {
  const value =
    resource.category?.name ||
    resource.category ||
    resource.resourceType ||
    resource.type ||
    resource.documentType ||
    "document";

  return normalize(value);
};

const getResourceDate = (resource = {}) =>
  resource.publishedAt ||
  resource.publicationDate ||
  resource.releaseDate ||
  resource.createdAt ||
  resource.date ||
  null;

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getResourceUrl = (resource = {}) =>
  resource.fileUrl ||
  resource.documentUrl ||
  resource.downloadUrl ||
  resource.url ||
  resource.externalUrl ||
  resource.link ||
  "";

const getResourceAction = (resource = {}) => {
  const category = getResourceCategory(resource);

  if (
    resource.fileUrl ||
    resource.documentUrl ||
    resource.downloadUrl ||
    resource.file
  ) {
    return "download";
  }

  if (
    ["statement", "speech", "announcement"].some((type) =>
      category.includes(type)
    )
  ) {
    return "read";
  }

  return "open";
};

const getResourceLabel = (resource = {}) => {
  const action = getResourceAction(resource);

  if (action === "download") return "Download resource";
  if (action === "read") return "Read publication";

  return "View resource";
};

const getCategoryLabel = (category) => {
  const matched = RESOURCE_CATEGORIES.find(
    (item) =>
      item.value !== "all" &&
      normalize(item.value) === normalize(category)
  );

  if (matched) return matched.label;

  return String(category || "Resource")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getCategoryIcon = (category) => {
  const normalized = normalize(category);

  if (normalized.includes("speech")) return Speech;
  if (normalized.includes("announcement")) return Megaphone;
  if (normalized.includes("statement")) return Speech;

  return FileText;
};

const getResourceSearchText = (resource) =>
  [
    getResourceTitle(resource),
    getResourceDescription(resource),
    getCategoryLabel(getResourceCategory(resource)),
    resource.author,
    resource.department,
    resource.ministry,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PresidentialResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchResources = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(RESOURCES_ENDPOINT);
        const items = extractResources(response.data);

        if (!cancelled) {
          setResources(items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Presidential publications are temporarily unavailable."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchResources();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const category = getResourceCategory(resource);
      const matchesCategory =
        activeCategory === "all" ||
        category.includes(normalize(activeCategory));

      const matchesSearch =
        !searchTerm.trim() ||
        getResourceSearchText(resource).includes(
          searchTerm.trim().toLowerCase()
        );

      return matchesCategory && matchesSearch;
    });
  }, [resources, activeCategory, searchTerm]);

  const featuredResource = filteredResources[0] || null;
  const otherResources = filteredResources.slice(1);

  return (
    <section
      className="presidential-resources"
      id="presidential-resources"
      aria-labelledby="presidential-resources-title"
    >
      <div className="presidential-resources__container">
        {/* Header */}
        <header className="presidential-resources__header">
          <div className="presidential-resources__heading">
            <span className="presidential-resources__eyebrow">
              <FolderOpen size={16} aria-hidden="true" />
              Official Information
            </span>

            <h2 id="presidential-resources-title">
              Statements and Resources
            </h2>

            <p>
              Access official presidential messages, speeches,
              announcements, reports and documents relating to the
              work and priorities of Jumuiya ya Vijana wa Pwani.
            </p>
          </div>

          <div
            className="presidential-resources__header-icon"
            aria-hidden="true"
          >
            <FileText size={29} />
          </div>
        </header>

        {/* Resource tools */}
        <div className="presidential-resources__tools">
          <div className="presidential-resources__search">
            <Search size={18} aria-hidden="true" />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search statements, speeches and documents"
              aria-label="Search presidential resources"
            />
          </div>

          <div
            className="presidential-resources__filters"
            aria-label="Filter resources by category"
          >
            {RESOURCE_CATEGORIES.map((category) => (
              <button
                type="button"
                key={category.value}
                className={
                  activeCategory === category.value
                    ? "presidential-resources__filter is-active"
                    : "presidential-resources__filter"
                }
                aria-pressed={activeCategory === category.value}
                onClick={() => setActiveCategory(category.value)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div
            className="presidential-resources__state"
            role="status"
            aria-live="polite"
          >
            <span className="presidential-resources__spinner" />
            <p>Loading official publications…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="presidential-resources__state presidential-resources__state--error">
            <FileText size={28} aria-hidden="true" />
            <h3>Resources could not be loaded</h3>
            <p>{error}</p>
            <p className="presidential-resources__state-note">
              Check that the configured endpoint exists and is
              accessible to public visitors.
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredResources.length === 0 && (
          <div className="presidential-resources__state">
            <span className="presidential-resources__empty-icon">
              <FolderOpen size={27} aria-hidden="true" />
            </span>

            <h3>
              {searchTerm || activeCategory !== "all"
                ? "No matching resources"
                : "Publications will appear here"}
            </h3>

            <p>
              {searchTerm || activeCategory !== "all"
                ? "Try another search term or choose a different category."
                : "Official statements, announcements and approved documents will appear here once published."}
            </p>

            {(searchTerm || activeCategory !== "all") && (
              <button
                type="button"
                className="presidential-resources__reset"
                onClick={() => {
                  setSearchTerm("");
                  setActiveCategory("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Featured resource */}
        {!loading && !error && featuredResource && (
          <div className="presidential-resources__content">
            <div className="presidential-resources__results-heading">
              <div>
                <span className="presidential-resources__small-label">
                  Presidency Library
                </span>
                <h3>
                  {searchTerm || activeCategory !== "all"
                    ? "Matching publications"
                    : "Latest publications"}
                </h3>
              </div>

              <span className="presidential-resources__count">
                {filteredResources.length}{" "}
                {filteredResources.length === 1
                  ? "resource"
                  : "resources"}
              </span>
            </div>

            <article className="presidential-resources__featured">
              <div className="presidential-resources__featured-icon">
                {(() => {
                  const Icon = getCategoryIcon(
                    getResourceCategory(featuredResource)
                  );
                  return <Icon size={31} aria-hidden="true" />;
                })()}
              </div>

              <div className="presidential-resources__featured-content">
                <div className="presidential-resources__metadata">
                  <span className="presidential-resources__category">
                    {getCategoryLabel(
                      getResourceCategory(featuredResource)
                    )}
                  </span>

                  {getResourceDate(featuredResource) && (
                    <span className="presidential-resources__date">
                      <CalendarDays size={14} aria-hidden="true" />
                      {formatDate(getResourceDate(featuredResource))}
                    </span>
                  )}
                </div>

                <h3>{getResourceTitle(featuredResource)}</h3>

                {getResourceDescription(featuredResource) && (
                  <p>
                    {getResourceDescription(featuredResource)}
                  </p>
                )}

                {featuredResource.author && (
                  <span className="presidential-resources__author">
                    By {featuredResource.author}
                  </span>
                )}

                <ResourceAction resource={featuredResource} />
              </div>
            </article>

            {otherResources.length > 0 && (
              <div className="presidential-resources__list">
                {otherResources.map((resource, index) => {
                  const Icon = getCategoryIcon(
                    getResourceCategory(resource)
                  );

                  return (
                    <article
                      className="presidential-resources__item"
                      key={
                        getResourceId(resource) ||
                        `${getResourceTitle(resource)}-${index}`
                      }
                    >
                      <div className="presidential-resources__item-icon">
                        <Icon size={21} aria-hidden="true" />
                      </div>

                      <div className="presidential-resources__item-content">
                        <div className="presidential-resources__metadata">
                          <span className="presidential-resources__category">
                            {getCategoryLabel(
                              getResourceCategory(resource)
                            )}
                          </span>

                          {getResourceDate(resource) && (
                            <span className="presidential-resources__date">
                              <CalendarDays size={13} aria-hidden="true" />
                              {formatDate(getResourceDate(resource))}
                            </span>
                          )}
                        </div>

                        <h4>{getResourceTitle(resource)}</h4>

                        {getResourceDescription(resource) && (
                          <p>{getResourceDescription(resource)}</p>
                        )}
                      </div>

                      <div className="presidential-resources__item-action">
                        <ResourceAction resource={resource} compact />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="presidential-resources__footer">
          <div className="presidential-resources__footer-copy">
            <span className="presidential-resources__footer-icon">
              <Megaphone size={22} aria-hidden="true" />
            </span>

            <div>
              <h3>Stay informed about the Presidency</h3>
              <p>
                Follow official JVP communications for announcements,
                leadership updates and public information.
              </p>
            </div>
          </div>

          <Link
            to="/news"
            className="presidential-resources__news-link"
          >
            Visit JVP news
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </section>
  );
}

/* ===========================================================
   RESOURCE ACTION
=========================================================== */

function ResourceAction({ resource, compact = false }) {
  const url = getResourceUrl(resource);
  const action = getResourceAction(resource);
  const label = compact
    ? action === "download"
      ? "Download"
      : "Open"
    : getResourceLabel(resource);

  if (!url) {
    return (
      <span className="presidential-resources__unavailable">
        Resource link unavailable
      </span>
    );
  }

  const isExternal = /^https?:\/\//i.test(url);
  const isDownload = action === "download";

  return (
    <a
      className={
        compact
          ? "presidential-resources__action presidential-resources__action--compact"
          : "presidential-resources__action"
      }
      href={url}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      download={isDownload ? true : undefined}
    >
      {isDownload ? (
        <ArrowDownToLine size={15} aria-hidden="true" />
      ) : (
        <ExternalLink size={15} aria-hidden="true" />
      )}

      <span>{label}</span>
    </a>
  );
}

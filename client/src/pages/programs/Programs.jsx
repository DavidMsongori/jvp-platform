
import { useCallback, useEffect, useMemo, useState } from "react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import ProgramsHero from "../../components/programs/ProgramsHero";
import ProgramImpact from "../../components/programs/ProgramImpact";
import FeaturedPrograms from "../../components/programs/FeaturedPrograms";
import ProgramsListing from "../../components/programs/ProgramsListing";
import ProgramsCTA from "../../components/programs/ProgramsCTA";

import { useProgram } from "../../context/ProgramContext";

const CATEGORIES = [
  "All Programmes",
  "Leadership",
  "Entrepreneurship",
  "Climate Action",
  "Agriculture",
  "Blue Economy",
  "Education",
  "Innovation",
  "Community Service",
  "Youth Empowerment",
];

const getProgramId = (program) =>
  program?._id ?? program?.id ?? program?.slug ?? "";

const getProgramTitle = (program) =>
  program?.title ??
  program?.name ??
  program?.programName ??
  program?.activityName ??
  "JVP Programme";

const getProgramDescription = (program) =>
  program?.summary ||
  program?.shortDescription ||
  program?.description ||
  "Discover how JVP is creating opportunities for young people and strengthening communities across the Coast region.";

const getProgramCategory = (program) => {
  const category = program?.category;

  if (typeof category === "string") return category;

  return (
    category?.name ||
    category?.label ||
    program?.focusArea ||
    program?.programCategory ||
    "Youth Empowerment"
  );
};

const getProgramLocation = (program) => {
  const location = program?.location;

  if (typeof location === "string" && location.trim()) {
    return location;
  }

  if (location && typeof location === "object") {
    return (
      location.name ||
      location.venue ||
      location.county ||
      [
        location.ward,
        location.subCounty,
        location.county,
      ]
        .filter(Boolean)
        .join(", ") ||
      "Coast Region, Kenya"
    );
  }

  return (
    [
      program?.ward,
      program?.subCounty,
      program?.county,
    ]
      .filter(Boolean)
      .join(", ") ||
    program?.venue ||
    program?.locationName ||
    "Coast Region, Kenya"
  );
};

const getParentProgramId = (program) => {
  const parent = program?.parentProgram;

  if (!parent) return "";

  if (typeof parent === "object") {
    return String(parent._id || parent.id || parent.slug || "");
  }

  return String(parent);
};

const isActivity = (program) =>
  String(program?.recordType || program?.type || "").toLowerCase() ===
    "activity" ||
  Boolean(program?.parentProgram);

const normalizeText = (value) =>
  String(value ?? "").toLowerCase().trim();

function Programs() {
  const {
    programs = [],
    featuredPrograms = [],
    loading = false,
    error = "",
    loadPrograms,
    loadFeaturedPrograms,
    clearError,
  } = useProgram();

  const [activeCategory, setActiveCategory] =
    useState("All Programmes");

  const [searchTerm, setSearchTerm] = useState("");

  const [showActivities, setShowActivities] = useState(false);

  const safePrograms = Array.isArray(programs) ? programs : [];

  const safeFeaturedPrograms = Array.isArray(featuredPrograms)
    ? featuredPrograms
    : [];

  // Load programmes and featured records.
  const loadPagePrograms = useCallback(async () => {
    const requests = [];

    if (typeof loadPrograms === "function") {
      requests.push(
        Promise.resolve().then(() =>
          loadPrograms({ limit: 50 })
        )
      );
    }

    if (typeof loadFeaturedPrograms === "function") {
      requests.push(
        Promise.resolve().then(() =>
          loadFeaturedPrograms(3)
        )
      );
    }

    const results = await Promise.allSettled(requests);

    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error(
          "Unable to load JVP programme data:",
          result.reason
        );
      }
    });
  }, [loadPrograms, loadFeaturedPrograms]);

  useEffect(() => {
    loadPagePrograms();
  }, [loadPagePrograms]);

  // Filter programmes by category and search term.
  const visiblePrograms = useMemo(() => {
    const query = normalizeText(searchTerm);

    return safePrograms.filter((program) => {
      const hasParent = Boolean(getParentProgramId(program));

      if (
        !showActivities &&
        isActivity(program) &&
        hasParent
      ) {
        return false;
      }

      const category = normalizeText(
        getProgramCategory(program)
      );

      const matchesCategory =
        activeCategory === "All Programmes" ||
        category === normalizeText(activeCategory) ||
        normalizeText(program?.focusArea) ===
          normalizeText(activeCategory);

      if (!matchesCategory) return false;

      if (query) {
        const searchableFields = [
          getProgramTitle(program),
          getProgramDescription(program),
          getProgramCategory(program),
          getProgramLocation(program),
          program?.county,
          program?.subCounty,
          program?.ward,
          program?.focusArea,
          program?.objectives,
          program?.targetGroup,
          program?.status,
        ];

        const matchesSearch = searchableFields.some((value) => {
          if (Array.isArray(value)) {
            return value.some((item) => {
              const searchableValue =
                typeof item === "object" && item !== null
                  ? item.title ||
                    item.name ||
                    item.description ||
                    ""
                  : item;

              return normalizeText(searchableValue).includes(query);
            });
          }

          if (value && typeof value === "object") {
            return Object.values(value).some((item) =>
              normalizeText(item).includes(query)
            );
          }

          return normalizeText(value).includes(query);
        });

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [
    safePrograms,
    activeCategory,
    searchTerm,
    showActivities,
  ]);

  // Prefer the dedicated featured response, with a fallback.
  const featured = useMemo(() => {
    const source =
      safeFeaturedPrograms.length > 0
        ? safeFeaturedPrograms
        : safePrograms.filter(
            (program) =>
              program?.isFeatured === true ||
              program?.featured === true
          );

    const seen = new Set();

    return source
      .filter((program) => !isActivity(program))
      .filter((program) => {
        const id = getProgramId(program);

        if (!id) return true;
        if (seen.has(id)) return false;

        seen.add(id);
        return true;
      })
      .slice(0, 3);
  }, [safeFeaturedPrograms, safePrograms]);

  // Preserve all records for impact calculations,
// matching the original Programs.jsx behavior.
const impactPrograms = safePrograms;

  const handleRetry = useCallback(async () => {
    if (typeof clearError === "function") {
      clearError();
    }

    await loadPagePrograms();
  }, [clearError, loadPagePrograms]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setActiveCategory("All Programmes");
    setShowActivities(false);
  }, []);

  const errorMessage =
    typeof error === "string"
      ? error
      : error?.message || "";

  return (
    <>
      <Navbar />

      <main className="programs-page">
        <ProgramsHero />

        <ProgramImpact
          programs={impactPrograms}
          loading={loading}
        />

        <FeaturedPrograms
          programs={featured}
          loading={loading}
          error={errorMessage}
          onRetry={handleRetry}
        />

        <ProgramsListing
          programs={visiblePrograms}
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showActivities={showActivities}
          onShowActivitiesChange={setShowActivities}
          loading={loading}
          error={errorMessage}
          onRetry={handleRetry}
          onClearFilters={handleClearFilters}
        />

        <ProgramsCTA />
      </main>

      <Footer />
    </>
  );
}

export default Programs;
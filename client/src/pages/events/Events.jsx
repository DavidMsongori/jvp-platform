import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import Hero from "../../components/event/Hero";
import Filters from "../../components/event/Filters";
import FeaturedEvent from "../../components/event/FeaturedEvent";
import Grid from "../../components/event/Grid";
import Pagination from "../../components/event/Pagination";
import NewsletterCTA from "../../components/event/NewsletterCTA";

import { useEvent } from "../../context/EventContext";

function getEventId(event) {
  return event?._id || event?.id || event?.slug || null;
}

const DEFAULT_QUERY = {
  page: 1,
  limit: 9,
  search: "",
  category: "",
  eventType: "",
  featured: "",
  sort: "date_asc",
};

function Events() {
  const {
    events,
    featuredEvents,
    pagination,
    loading,
    error,
    loadEvents,
    loadFeaturedEvents,
  } = useEvent();

  const [query, setQuery] = useState(DEFAULT_QUERY);

  const lastQueryRef = useRef("");
  const featuredLoadedRef = useRef(false);

  const safeEvents = Array.isArray(events)
    ? events
    : [];

  const safeFeaturedEvents = Array.isArray(
    featuredEvents
  )
    ? featuredEvents
    : [];

  /* =========================================================
     LOAD EVENTS
  ========================================================= */

  useEffect(() => {
    const queryKey = JSON.stringify(query);

    if (lastQueryRef.current === queryKey) {
      return;
    }

    lastQueryRef.current = queryKey;

    let cancelled = false;

    const fetchEvents = async () => {
      try {
        await loadEvents(query);
      } catch (err) {
        if (cancelled) return;

        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load events."
        );
      }
    };

    fetchEvents();

    return () => {
      cancelled = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  /* =========================================================
     LOAD FEATURED EVENTS
  ========================================================= */

  useEffect(() => {
    if (featuredLoadedRef.current) {
      return;
    }

    featuredLoadedRef.current = true;

    let cancelled = false;

    const fetchFeaturedEvents = async () => {
      try {
        await loadFeaturedEvents(1);
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Unable to load featured events:",
          err
        );
      }
    };

    fetchFeaturedEvents();

    return () => {
      cancelled = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     VALID FEATURED EVENT
  ========================================================= */

  const featured = useMemo(() => {
    if (
      safeEvents.length === 0 ||
      safeFeaturedEvents.length === 0
    ) {
      return null;
    }

    const currentEventIds = new Set(
      safeEvents
        .map(getEventId)
        .filter(Boolean)
    );

    return (
      safeFeaturedEvents.find((event) => {
        const id = getEventId(event);

        return (
          id &&
          currentEventIds.has(id) &&
          event?.featured === true
        );
      }) || null
    );
  }, [
    safeEvents,
    safeFeaturedEvents,
  ]);

  /* =========================================================
     FILTERS
  ========================================================= */

  const handleFiltersChange = (filters) => {
    setQuery((previous) => {
      const nextQuery = {
        ...previous,
        page: 1,
        search:
          filters.search ??
          previous.search,
        category:
          filters.category ??
          previous.category,
        eventType:
          filters.eventType ??
          previous.eventType,
        featured:
          filters.featured ??
          previous.featured,
        sort:
          filters.sort ??
          previous.sort,
      };

      return JSON.stringify(previous) ===
        JSON.stringify(nextQuery)
        ? previous
        : nextQuery;
    });
  };

  const handleSearch = (search) => {
    setQuery((previous) => {
      if (
        previous.search === search &&
        previous.page === 1
      ) {
        return previous;
      }

      return {
        ...previous,
        page: 1,
        search,
      };
    });
  };

  const handleResetFilters = () => {
    setQuery((previous) => {
      return JSON.stringify(previous) ===
        JSON.stringify(DEFAULT_QUERY)
        ? previous
        : { ...DEFAULT_QUERY };
    });
  };

  /* =========================================================
     PAGINATION
  ========================================================= */

  const handlePageChange = (page) => {
    if (
      page ===
      (pagination?.page ?? 1)
    ) {
      return;
    }

    setQuery((previous) => ({
      ...previous,
      page,
    }));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     RETRY
  ========================================================= */

  const handleRetry = async () => {
    lastQueryRef.current = "";

    try {
      await loadEvents(query);
      await loadFeaturedEvents(1);

      featuredLoadedRef.current = true;
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to reload events."
      );
    }
  };

  /* =========================================================
     STATISTICS
  ========================================================= */

  const totalEvents =
    pagination?.total ??
    safeEvents.length;

  const upcomingEvents =
    safeEvents.filter(
      (event) => !event?.hasEnded
    ).length;

  const featuredCount =
    safeEvents.filter(
      (event) =>
        event?.featured === true
    ).length;

  const heroStatistics = {
    totalEvents,
    upcomingEvents,
    featuredEvents:
      featuredCount,
  };

  /* =========================================================
     PAGINATION DATA
  ========================================================= */

  const paginationData = {
    page:
      pagination?.page ?? 1,

    limit:
      pagination?.limit ?? 9,

    total:
      pagination?.total ?? 0,

    totalPages:
      pagination?.totalPages ?? 1,

    hasNextPage:
      pagination?.hasNextPage ??
      false,

    hasPrevPage:
      pagination?.hasPrevPage ??
      false,
  };

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <>
      <Navbar />

      <main className="public-events-page">
        {/* Hero */}
        <Hero
          search={query.search}
          statistics={heroStatistics}
          onSearch={handleSearch}
        />

        {/* Filters */}
        <Filters
          filters={query}
          onChange={handleFiltersChange}
          onReset={handleResetFilters}
        />

        {/* Featured */}
        {featured && (
          <FeaturedEvent
            event={featured}
          />
        )}

        {/* Event directory */}
        <Grid
          events={safeEvents}
          loading={loading}
          error={error}
          onRetry={handleRetry}
        />

        {/* Pagination */}
        {!loading &&
          !error &&
          paginationData.totalPages >
            1 && (
            <Pagination
              {...paginationData}
              onPageChange={
                handlePageChange
              }
            />
          )}
      </main>

      {/* =====================================================
          PAGE-LEVEL CTA
          Intentionally outside public-events-page
      ===================================================== */}

      <NewsletterCTA />

      <Footer />
    </>
  );
}

export default Events;
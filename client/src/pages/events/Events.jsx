// src/pages/events/Events.jsx

import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    ChevronRight,
    Sparkles,
} from "lucide-react";
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

import "./Events.css";

const DEFAULT_QUERY = {
    page: 1,
    limit: 9,
    search: "",
    category: "",
    eventType: "",
    featured: "",
    sort: "date_asc",
};

const Events = () => {

    /* ======================================================
       EVENT CONTEXT
    ====================================================== */

    const {
        events,
        featuredEvents,
        pagination,
        loading,
        error,
        loadEvents,
        loadFeaturedEvents,
    } = useEvent();

    /* ======================================================
       QUERY
    ====================================================== */

    const [query, setQuery] =
        useState(DEFAULT_QUERY);

    /* ======================================================
       LOAD EVENTS
       
       IMPORTANT:
       We intentionally depend only on query here.
       If loadEvents is recreated by EventContext on every
       render, including it in this dependency array can
       cause repeated API requests.
    ====================================================== */

    useEffect(() => {

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

    }, [query]);

    /* ======================================================
       LOAD FEATURED EVENTS
       
       Run once when the page mounts.
    ====================================================== */

    useEffect(() => {

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

    }, []);

    /* ======================================================
       SAFE DATA
    ====================================================== */

    const safeEvents =
        Array.isArray(events)
            ? events
            : [];

    const safeFeaturedEvents =
        Array.isArray(featuredEvents)
            ? featuredEvents
            : [];

    /* ======================================================
       FILTER HANDLER
    ====================================================== */

    const handleFiltersChange = (filters) => {

        setQuery((previous) => ({
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
        }));

    };

    /* ======================================================
       SEARCH
    ====================================================== */

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

    /* ======================================================
       RESET
    ====================================================== */

    const handleResetFilters = () => {

        setQuery({
            ...DEFAULT_QUERY,
        });

    };

    /* ======================================================
       PAGINATION
    ====================================================== */

    const handlePageChange = (page) => {

        if (
            page === pagination?.page
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

    /* ======================================================
       RETRY
    ====================================================== */

    const handleRetry = async () => {

        try {

            await loadEvents(query);

            await loadFeaturedEvents(1);

        } catch (err) {

            toast.error(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to reload events."
            );

        }

    };

    /* ======================================================
       FEATURED EVENT
    ====================================================== */

    const featured =
        safeFeaturedEvents[0] ??
        safeEvents.find(
            (event) => event?.featured
        ) ??
        null;

    const hasFeaturedEvent =
        Boolean(featured);

    /* ======================================================
       EVENT COUNT
    ====================================================== */

    const totalEvents =
        pagination?.total ??
        safeEvents.length;

    const pageTitle =
        totalEvents === 1
            ? "1 Event Found"
            : `${totalEvents} Events Found`;

    const pageDescription =
        loading
            ? "Loading the latest JVP events..."
            : totalEvents === 0
                ? "No events matched your current search or filters."
                : `Showing ${safeEvents.length} of ${totalEvents} event${
                    totalEvents === 1
                        ? ""
                        : "s"
                }.`;

    /* ======================================================
       HERO STATISTICS
    ====================================================== */

    const heroStatistics = useMemo(() => {

        const upcomingEvents =
            safeEvents.filter(
                (event) =>
                    !event?.hasEnded
            ).length;

        const featuredCount =
            safeEvents.filter(
                (event) =>
                    event?.featured
            ).length;

        return {

            totalEvents:
                pagination?.total ??
                safeEvents.length,

            upcomingEvents,

            featuredEvents:
                featuredCount,
        };

    }, [
        safeEvents,
        pagination,
    ]);

    /* ======================================================
       PAGINATION DATA
    ====================================================== */

    const paginationData = {

        page:
            pagination?.page ??
            1,

        limit:
            pagination?.limit ??
            9,

        total:
            pagination?.total ??
            0,

        totalPages:
            pagination?.totalPages ??
            1,

        hasNextPage:
            pagination?.hasNextPage ??
            false,

        hasPrevPage:
            pagination?.hasPrevPage ??
            false,
    };

    /* ======================================================
       RENDER
    ====================================================== */

    return (
        <div className="events-page-shell">

            <Navbar />

            <main className="events-page">

                {/* ==================================================
                   HERO
                ================================================== */}

                <section className="events-hero-wrapper">

                    <Hero
                        search={query.search}
                        statistics={heroStatistics}
                        onSearch={handleSearch}
                    />

                </section>

                {/* ==================================================
                   FILTERS
                ================================================== */}

                <section className="events-filter-wrapper">

                    <Filters
                        filters={query}
                        onChange={handleFiltersChange}
                        onReset={handleResetFilters}
                    />

                </section>

                {/* ==================================================
                   FEATURED EVENT
                ================================================== */}

                {hasFeaturedEvent && (

                    <section className="events-featured-wrapper">

                        <div className="container">

                            <div className="events-section-label">

                                <div className="events-section-label-icon">
                                    <Sparkles size={15} />
                                </div>

                                <span>
                                    Featured Event
                                </span>

                            </div>

                            <FeaturedEvent
                                event={featured}
                            />

                        </div>

                    </section>

                )}

                {/* ==================================================
                   EVENT DIRECTORY
                ================================================== */}

                <section className="events-section">

                    <div className="container">

                        <div className="events-grid-header">

                            <div className="events-grid-title">

                                <div className="events-grid-icon">
                                    <CalendarDays size={19} />
                                </div>

                                <div>

                                    <span className="events-eyebrow">
                                        JVP Events
                                    </span>

                                    <h2>
                                        {pageTitle}
                                    </h2>

                                    <p>
                                        {pageDescription}
                                    </p>

                                </div>

                            </div>

                            {totalEvents > 0 && (

                                <div className="events-results-indicator">

                                    <span className="events-results-dot" />

                                    <span>
                                        Live event directory
                                    </span>

                                </div>

                            )}

                        </div>

                        <Grid
                            events={safeEvents}
                            loading={loading}
                            error={error}
                            onRetry={handleRetry}
                        />

                        {!loading &&
                            !error &&
                            (pagination?.totalPages ?? 0) > 1 && (

                                <div className="events-pagination-wrapper">

                                    <Pagination
                                        {...paginationData}
                                        onPageChange={
                                            handlePageChange
                                        }
                                    />

                                </div>

                            )}

                    </div>

                </section>

                {/* ==================================================
                   NEWSLETTER
                ================================================== */}

                <section className="events-newsletter-wrapper">

                    <div className="container">

                        <NewsletterCTA />

                    </div>

                </section>

                {/* ==================================================
                   BOTTOM BRAND STRIP
                ================================================== */}

                <section className="events-bottom-strip">

                    <div className="container">

                        <div className="events-bottom-strip-inner">

                            <div className="events-bottom-brand">

                                <div className="events-bottom-icon">
                                    <CalendarDays size={17} />
                                </div>

                                <div>

                                    <strong>
                                        Stay Connected with JVP
                                    </strong>

                                    <span>
                                        Discover opportunities,
                                        forums and youth events
                                        across the Coast.
                                    </span>

                                </div>

                            </div>

                            <div className="events-bottom-arrow">
                                <ChevronRight size={18} />
                            </div>

                        </div>

                    </div>

                </section>

            </main>

            <Footer />

        </div>
    );
};

export default Events;
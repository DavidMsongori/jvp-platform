import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

import "./Pagination.css";

const Pagination = (props) => {
  /*
   * Supports both:
   *
   * <Pagination pagination={pagination} />
   *
   * and:
   *
   * <Pagination {...pagination} />
   */

  const pagination = props.pagination || props;
  const onPageChange = props.onPageChange;

  if (!pagination) {
    return null;
  }

  const {
    page = 1,
    totalPages = 1,
    total = 0,
    limit = 9,
    hasPrevPage,
    hasNextPage,
  } = pagination;

  const currentPage = Math.max(
    1,
    Number(page) || 1
  );

  const pagesCount = Math.max(
    1,
    Number(totalPages) || 1
  );

  const itemsPerPage = Math.max(
    1,
    Number(limit) || 9
  );

  const totalItems = Math.max(
    0,
    Number(total) || 0
  );

  if (pagesCount <= 1 || totalItems === 0) {
    return null;
  }

  const previousPageAvailable =
    typeof hasPrevPage === "boolean"
      ? hasPrevPage
      : currentPage > 1;

  const nextPageAvailable =
    typeof hasNextPage === "boolean"
      ? hasNextPage
      : currentPage < pagesCount;

  const startItem =
    totalItems === 0
      ? 0
      : (currentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(
    currentPage * itemsPerPage,
    totalItems
  );

  /* ==========================================
     PAGE NUMBERS
  ========================================== */

  const pages = [];

  if (pagesCount <= 7) {
    for (let index = 1; index <= pagesCount; index += 1) {
      pages.push(index);
    }
  } else {
    pages.push(1);

    if (currentPage > 3) {
      pages.push("left-ellipsis");
    }

    const start = Math.max(
      2,
      currentPage - 1
    );

    const end = Math.min(
      pagesCount - 1,
      currentPage + 1
    );

    for (let index = start; index <= end; index += 1) {
      pages.push(index);
    }

    if (currentPage < pagesCount - 2) {
      pages.push("right-ellipsis");
    }

    pages.push(pagesCount);
  }

  const changePage = (nextPage) => {
    if (
      !onPageChange ||
      nextPage < 1 ||
      nextPage > pagesCount ||
      nextPage === currentPage
    ) {
      return;
    }

    onPageChange(nextPage);
  };

  return (
    <section className="events-pagination">
      <div className="events-pagination__container">

        {/* ======================================
            INFORMATION
        ====================================== */}

        <div className="events-pagination__info">
          <span>Showing</span>
          <strong>{startItem}</strong>
          <span>–</span>
          <strong>{endItem}</strong>
          <span>of</span>
          <strong>{totalItems}</strong>
          <span>
            {totalItems === 1 ? "event" : "events"}
          </span>
        </div>

        {/* ======================================
            CONTROLS
        ====================================== */}

        <nav
          className="events-pagination__controls"
          aria-label="Events pagination"
        >
          <button
            type="button"
            className="events-pagination__nav"
            disabled={!previousPageAvailable}
            onClick={() =>
              changePage(currentPage - 1)
            }
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>

          <div className="events-pagination__pages">
            {pages.map((item, index) => {
              if (
                item === "left-ellipsis" ||
                item === "right-ellipsis"
              ) {
                return (
                  <span
                    key={`${item}-${index}`}
                    className="events-pagination__ellipsis"
                    aria-hidden="true"
                  >
                    <MoreHorizontal size={14} />
                  </span>
                );
              }

              const isActive =
                currentPage === item;

              return (
                <button
                  key={item}
                  type="button"
                  className={`events-pagination__page ${
                    isActive ? "is-active" : ""
                  }`}
                  aria-current={
                    isActive ? "page" : undefined
                  }
                  onClick={() =>
                    changePage(item)
                  }
                >
                  {item}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="events-pagination__nav"
            disabled={!nextPageAvailable}
            onClick={() =>
              changePage(currentPage + 1)
            }
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </nav>
      </div>
    </section>
  );
};

export default Pagination;
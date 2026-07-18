import {
  FaSearch,
  FaSyncAlt,
  FaDownload,
} from "react-icons/fa";
import "./Payments.css";

function PaymentFilters({
  filters,
  setFilters,
  onRefresh,
  onExport,
}) {
  const updateFilter = (field, value) => {
    setFilters((previous) => ({
      ...previous,
      page: 1,
      [field]: value,
    }));
  };

  return (
    <div className="payment-filters">
      <div className="payment-search">
        <FaSearch />

        <input
          type="text"
          placeholder="Search member, receipt or transaction..."
          value={filters.search}
          onChange={(e) =>
            updateFilter(
              "search",
              e.target.value
            )
          }
        />
      </div>

      <select
        value={filters.status}
        onChange={(e) =>
          updateFilter(
            "status",
            e.target.value
          )
        }
      >
        <option value="">
          All Status
        </option>

        <option value="completed">
          Completed
        </option>

        <option value="pending">
          Pending
        </option>

        <option value="failed">
          Failed
        </option>
      </select>

      <select
        value={filters.paymentMethod}
        onChange={(e) =>
          updateFilter(
            "paymentMethod",
            e.target.value
          )
        }
      >
        <option value="">
          All Methods
        </option>

        <option value="mpesa">
          M-Pesa
        </option>

        <option value="bank">
          Bank
        </option>

        <option value="cash">
          Cash
        </option>

        <option value="card">
          Card
        </option>
      </select>

      <button
        className="filter-btn"
        onClick={onRefresh}
      >
        <FaSyncAlt />
        Refresh
      </button>

      <button
        className="filter-btn export"
        onClick={onExport}
      >
        <FaDownload />
        Export
      </button>
    </div>
  );
}

export default PaymentFilters;
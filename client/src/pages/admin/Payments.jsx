import { useEffect, useState } from "react";
import { FaMoneyCheckAlt } from "react-icons/fa";

import {
  getPayments,
  verifyPayment,
} from "../../services/admin.service";

import ManualMpesaQueue from "../../components/admin/payments/ManualMpesaQueue";
import PaymentSummary from "../../components/admin/payments/PaymentSummary";
import PaymentFilters from "../../components/admin/payments/PaymentFilters";
import PaymentsTable from "../../components/admin/payments/PaymentsTable";

import "../../components/admin/payments/Payments.css";

function Payments() {

  /* ==========================================
     STATE
  ========================================== */

  const [loading, setLoading] = useState(true);

  const [payments, setPayments] = useState([]);

  const [summary, setSummary] = useState({});

  const [pagination, setPagination] = useState({});

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    paymentMethod: "",
    sortBy: "createdAt",
    order: "desc",
  });

  /* ==========================================
     LOAD PAYMENTS
  ========================================== */

  const loadPayments = async () => {

    try {

      setLoading(true);

      const response =
        await getPayments(filters);

      /*
       * Your API currently returns response.data
       * from admin.service.js.
       *
       * Support both direct and nested response
       * structures.
       */

      const data =
        response?.data || response;

      setSummary(
        data?.summary || {}
      );

      setPayments(
        data?.payments || []
      );

      setPagination(
        data?.pagination || {}
      );

    } catch (error) {

      console.error(
        "Failed to load payments",
        error
      );

    } finally {

      setLoading(false);

    }

  };

  /* ==========================================
     EFFECT
  ========================================== */

  useEffect(() => {

    loadPayments();

  }, [filters]);

  /* ==========================================
     VERIFY PAYMENT
  ========================================== */

  const handleVerify = async (
    payment
  ) => {

    const confirmed =
      window.confirm(
        `Verify payment from ${
          payment.member?.firstName ||
          "member"
        }?`
      );

    if (!confirmed) return;

    try {

      await verifyPayment(
        payment._id
      );

      loadPayments();

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        "Unable to verify payment."
      );

    }

  };

  /* ==========================================
     EXPORT
  ========================================== */

  const handleExport = () => {

    console.log(
      "Export payments"
    );

  };

  /* ==========================================
     PAGE
  ========================================== */

  return (

    <div className="admin-page">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="page-header">

        <div>

          <h1 className="page-title">

            <FaMoneyCheckAlt />

            Payments

          </h1>

          <p className="page-subtitle">

            Membership payment management
            and manual M-Pesa verification.

          </p>

        </div>

      </div>

      {/* ======================================
          MANUAL M-PESA QUEUE
      ======================================= */}

      <ManualMpesaQueue />

      {/* ======================================
          PAYMENT SUMMARY
      ======================================= */}

      <PaymentSummary
        summary={summary}
      />

      {/* ======================================
          FILTERS
      ======================================= */}

      <PaymentFilters
        filters={filters}
        setFilters={setFilters}
        onRefresh={loadPayments}
        onExport={handleExport}
      />

      {/* ======================================
          PAYMENT TABLE
      ======================================= */}

      <PaymentsTable
        payments={payments}
        loading={loading}
        pagination={pagination}
        filters={filters}
        setFilters={setFilters}
        onVerify={handleVerify}
      />

    </div>

  );

}

export default Payments;
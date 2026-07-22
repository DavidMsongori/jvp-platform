import { useEffect, useState } from "react";
import {
  FaIdCard,
  FaCheckCircle,
  FaCalendarAlt,
  FaShieldAlt,
  FaSyncAlt,
  FaExternalLinkAlt,
} from "react-icons/fa";

import leadershipCardService from "../../services/leadershipCard.service";

import "./LeadershipCard.css";

function LeadershipCard() {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* ==========================================================
     LOAD CARD
  ========================================================== */

  const loadCard = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await leadershipCardService.getMyLeadershipCard();

      setCard(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load leadership card."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCard();
  }, []);

  /* ==========================================================
     REFRESH
  ========================================================== */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      const response =
        await leadershipCardService.getMyLeadershipCard();

      setCard(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  /* ==========================================================
     STATES
  ========================================================== */

  if (loading) {
    return (
      <div className="leadership-card-page">
        <div className="leadership-card-loading">
          Loading Leadership Card...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leadership-card-page">
        <div className="leadership-card-error">
          {error}
        </div>
      </div>
    );
  }

  const leader = card?.leader;
  const details = card?.card;

  return (
    <div className="leadership-card-page">
      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div className="leadership-card-header">
        <div>
          <h1>
            <FaIdCard />
            {" "}
            My Leadership Card
          </h1>

          <p>
            Your official digital leadership
            identification.
          </p>
        </div>

        <button
          className="refresh-card-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FaSyncAlt />

          {refreshing
            ? " Refreshing..."
            : " Refresh"}
        </button>
      </div>

      {/* ==========================================
          CARD
      ========================================== */}

      <div className="digital-leadership-card">

        <div className="card-top">

          <img
            src={leader?.profilePhoto}
            alt={leader?.fullName}
          />

          <div>

            <h2>{leader?.fullName}</h2>

            <h3>{leader?.position}</h3>

            <p>
              {leader?.category
                ?.replace(/_/g, " ")
                ?.replace(/\b\w/g, c =>
                  c.toUpperCase()
                )}
            </p>

          </div>

        </div>

        <div className="card-body">

          <div className="card-item">

            <span>Member Number</span>

            <strong>
              {leader?.memberNumber}
            </strong>

          </div>

          <div className="card-item">

            <span>County</span>

            <strong>
              {leader?.county}
            </strong>

          </div>

          <div className="card-item">

            <span>Term</span>

            <strong>
              {new Date(
                leader?.termStart
              ).toLocaleDateString()}
              {" - "}
              {new Date(
                leader?.termEnd
              ).toLocaleDateString()}
            </strong>

          </div>

        </div>

        <div className="card-footer">

          <div>

            <FaShieldAlt />

            <span>
              Verification Code
            </span>

            <strong>
              {details?.verificationCode}
            </strong>

          </div>

          <div>

            <FaCalendarAlt />

            <span>Expires</span>

            <strong>
              {new Date(
                details?.expiresAt
              ).toLocaleDateString()}
            </strong>

          </div>

          <div className="card-status active">

            <FaCheckCircle />

            Verified

          </div>

        </div>

      </div>

      {/* ==========================================
          VERIFICATION
      ========================================== */}

      <div className="leadership-card-info">

        <h2>
          Verification
        </h2>

        <p>

          Anyone can verify this leadership
          card using the verification code
          below.

        </p>

        <code>
          {details?.verificationCode}
        </code>

        <a
          href={details?.verificationUrl}
          target="_blank"
          rel="noreferrer"
          className="verification-link"
        >

          <FaExternalLinkAlt />

          View Public Verification

        </a>

      </div>

    </div>
  );
}

export default LeadershipCard;
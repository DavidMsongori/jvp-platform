import { useMemo, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import MembershipCard from "./components/MembershipCard";
import CardActions from "./components/CardActions";

import { useProfile } from "../../context/ProfileContext";

import "./styles/membership-card.css";
import "./styles/membership-card-front.css";
import "./styles/membership-card-back.css";
import "./styles/membership-card-actions.css";

const MembershipCardPage = () => {
  const {
    profile,
    loading,
    reloadProfile,
    fullName,
    memberNumber,
    membershipStatus,
    joinedDate,
  } = useProfile();

  const cardRef = useRef(null);

  /* ==========================================
     FORMAT DATES
  ========================================== */

  const formattedJoinedDate = useMemo(() => {
    if (!joinedDate) return "-";

    return new Date(joinedDate).toLocaleDateString(
      "en-KE",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }, [joinedDate]);

  /* ==========================================
     PRINT
  ========================================== */

  const handlePrint = () => {
    window.print();
  };

  /* ==========================================
     DOWNLOAD PDF
  ========================================== */

  const handleDownload = async () => {
    if (!cardRef.current) return;

    const canvas = await html2canvas(cardRef.current, {
      scale: 4,
      useCORS: true,
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();

    const cardWidth = 180;
    const cardHeight = cardWidth / 1.6;

    const x = (pageWidth - cardWidth) / 2;
    const y = 45;

    pdf.addImage(
      imgData,
      "PNG",
      x,
      y,
      cardWidth,
      cardHeight
    );

    pdf.save(
      `${memberNumber || "membership-card"}.pdf`
    );
  };

  /* ==========================================
     SHARE
  ========================================== */

  const handleShare = async () => {
    const verificationUrl =
      `${window.location.origin}/verify/${encodeURIComponent(
        memberNumber || ""
      )}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "JVP Membership Card",
          text: `${fullName}'s JVP Membership Card`,
          url: verificationUrl,
        });

        return;
      } catch {
        // Share cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(
        verificationUrl
      );

      alert(
        "Verification link copied to clipboard."
      );
    } catch {
      alert(
        "Unable to copy the verification link."
      );
    }
  };

  /* ==========================================
     REFRESH
  ========================================== */

  const handleRefresh = async () => {
    await reloadProfile(false);
  };

  /* ==========================================
     LOADING
  ========================================== */

  if (loading && !profile) {
    return (
      <div className="membership-card-page-loading">
        Loading membership card...
      </div>
    );
  }

  /* ==========================================
     NO PROFILE
  ========================================== */

  if (!profile) {
    return (
      <div className="membership-card-page-loading">
        Unable to load your membership card.
      </div>
    );
  }

  /* ==========================================
     PAGE
  ========================================== */

  return (
    <div className="membership-card-page">

      <div className="membership-card-header">

        <h1>Membership Card</h1>

        <p>
          Your official JVP Connect digital
          membership card.
        </p>

      </div>

      <div ref={cardRef}>

        <MembershipCard
          member={profile}
          profile={profile}
          fullName={fullName}
          memberNumber={memberNumber}
          membershipStatus={membershipStatus}
          joinedDate={formattedJoinedDate}
        />

      </div>

      <CardActions
        loading={loading}
        onPrint={handlePrint}
        onDownload={handleDownload}
        onShare={handleShare}
        onRefresh={handleRefresh}
      />

    </div>
  );
};

export default MembershipCardPage;
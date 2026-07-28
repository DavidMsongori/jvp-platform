/* ==========================================
   HTML ESCAPING
========================================== */

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

/* ==========================================
   DATE FORMATTING
========================================== */

const formatSummitDate = ({
  summitDate,
  dateStatus,
}) => {
  if (
    dateStatus === "to_be_announced" ||
    dateStatus === "tba" ||
    !summitDate
  ) {
    return "To be communicated";
  }

  const parsedDate = new Date(summitDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return "To be communicated";
  }

  return new Intl.DateTimeFormat("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};

/* ==========================================
   VENUE FORMATTING
========================================== */

const formatVenue = (venue) => {
  if (!venue) {
    return "Kilifi County – exact venue to be communicated";
  }

  if (typeof venue === "string") {
    return venue;
  }

  if (typeof venue === "object") {
    return [
      venue.name,
      venue.address,
      venue.town,
      venue.county,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return "Kilifi County – exact venue to be communicated";
};

/* ==========================================
   TEXT FALLBACK
========================================== */

const buildPlainTextEmail = ({
  participant,
  ticket,
  summitEvent,
  summitDate,
  venue,
}) => {
  return `
Dear ${participant.fullName},

Your registration for ${
    summitEvent.title || "Coast Youth Summit 2026"
  } has been confirmed.

TICKET DETAILS

Ticket Number: ${ticket.ticketNumber}
Participant: ${participant.fullName}
County: ${participant.county}
Constituency: ${participant.constituency}
Ward: ${participant.ward}
Date: ${summitDate}
Venue: ${venue}

Your PDF ticket is attached to this email.

Ticket verification:
${ticket.verificationUrl || "Verification link unavailable"}

Registration details:
${ticket.registrationUrl || "Registration link unavailable"}

Please keep your ticket safe and present it during summit check-in.

${
  summitEvent.logisticsMessage ||
  "The final summit date, venue and transport logistics will be communicated through email and phone."
}

For enquiries:
Email: ${
    summitEvent.contactEmail || "admin@jvp.co.ke"
  }
Phone: ${
    summitEvent.contactPhone || "To be communicated"
  }

Regards,

Jumuiya ya Vijana wa Pwani
Coast Youth Summit 2026
  `.trim();
};

/* ==========================================
   SUMMIT TICKET EMAIL TEMPLATE
========================================== */

export const summitTicketEmailTemplate = ({
  participant,
  ticket,
  summitEvent,
}) => {
  if (!participant?.fullName) {
    throw new Error(
      "Participant full name is required for the summit email template."
    );
  }

  if (!ticket?.ticketNumber) {
    throw new Error(
      "Ticket number is required for the summit email template."
    );
  }

  const summitTitle =
    summitEvent?.title ||
    "Coast Youth Summit 2026";

  const summitDate = formatSummitDate({
    summitDate: summitEvent?.summitDate,
    dateStatus: summitEvent?.dateStatus,
  });

  const venue = formatVenue(
    summitEvent?.venue
  );

  const subject =
    `Your ${summitTitle} Ticket – ` +
    ticket.ticketNumber;

  const safeParticipantName = escapeHtml(
    participant.fullName
  );

  const safeTicketNumber = escapeHtml(
    ticket.ticketNumber
  );

  const safeCounty = escapeHtml(
    participant.county || "Not provided"
  );

  const safeConstituency = escapeHtml(
    participant.constituency ||
      "Not provided"
  );

  const safeWard = escapeHtml(
    participant.ward || "Not provided"
  );

  const safeSummitTitle =
    escapeHtml(summitTitle);

  const safeSummitDate =
    escapeHtml(summitDate);

  const safeVenue = escapeHtml(venue);

  const safeLogisticsMessage =
    escapeHtml(
      summitEvent?.logisticsMessage ||
        "The final summit date, venue and transport logistics will be communicated through email and phone."
    );

  const safeContactEmail =
    escapeHtml(
      summitEvent?.contactEmail ||
        "admin@jvp.co.ke"
    );

  const safeContactPhone =
    escapeHtml(
      summitEvent?.contactPhone ||
        "To be communicated"
    );

  const verificationButton =
    ticket.verificationUrl
      ? `
        <a
          href="${escapeHtml(
            ticket.verificationUrl
          )}"
          style="
            display:inline-block;
            padding:13px 24px;
            background:#0b6b3a;
            color:#ffffff;
            text-decoration:none;
            border-radius:8px;
            font-size:14px;
            font-weight:700;
            margin-right:8px;
            margin-bottom:8px;
          "
        >
          Verify Ticket
        </a>
      `
      : "";

  const registrationButton =
    ticket.registrationUrl
      ? `
        <a
          href="${escapeHtml(
            ticket.registrationUrl
          )}"
          style="
            display:inline-block;
            padding:13px 24px;
            background:#ffffff;
            color:#0b6b3a;
            text-decoration:none;
            border:1px solid #0b6b3a;
            border-radius:8px;
            font-size:14px;
            font-weight:700;
            margin-bottom:8px;
          "
        >
          View Registration
        </a>
      `
      : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>${safeSummitTitle}</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f2f5f3;
    font-family:Arial, Helvetica, sans-serif;
    color:#26332c;
  "
>
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    role="presentation"
    style="background:#f2f5f3;"
  >
    <tr>
      <td
        align="center"
        style="padding:32px 14px;"
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
          style="
            max-width:650px;
            background:#ffffff;
            border-radius:14px;
            overflow:hidden;
            box-shadow:0 8px 25px rgba(0,0,0,0.08);
          "
        >
          <tr>
            <td
              style="
                background:#0b6b3a;
                padding:30px 30px 24px;
                text-align:center;
              "
            >
              <div
                style="
                  display:inline-block;
                  background:#ffffff;
                  color:#0b6b3a;
                  border-radius:30px;
                  padding:7px 16px;
                  font-size:12px;
                  font-weight:700;
                  letter-spacing:1px;
                  text-transform:uppercase;
                  margin-bottom:15px;
                "
              >
                Registration Confirmed
              </div>

              <h1
                style="
                  margin:0;
                  color:#ffffff;
                  font-size:28px;
                  line-height:1.3;
                "
              >
                ${safeSummitTitle}
              </h1>

              <p
                style="
                  margin:10px 0 0;
                  color:#d9f2e3;
                  font-size:15px;
                "
              >
                Jumuiya ya Vijana wa Pwani
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px;">
              <p
                style="
                  margin:0 0 15px;
                  font-size:16px;
                  line-height:1.7;
                "
              >
                Dear
                <strong>
                  ${safeParticipantName}
                </strong>,
              </p>

              <p
                style="
                  margin:0 0 22px;
                  font-size:15px;
                  line-height:1.7;
                  color:#536159;
                "
              >
                Your registration has been
                successfully received and confirmed.
                Your official PDF ticket is attached
                to this email.
              </p>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="
                  border:1px solid #dce5df;
                  border-radius:12px;
                  overflow:hidden;
                  margin-bottom:24px;
                "
              >
                <tr>
                  <td
                    colspan="2"
                    style="
                      padding:18px 20px;
                      background:#f0f8f3;
                      border-bottom:1px solid #dce5df;
                    "
                  >
                    <div
                      style="
                        color:#536159;
                        font-size:12px;
                        font-weight:700;
                        text-transform:uppercase;
                        letter-spacing:1px;
                        margin-bottom:6px;
                      "
                    >
                      Ticket Number
                    </div>

                    <div
                      style="
                        color:#0b6b3a;
                        font-size:25px;
                        font-weight:800;
                        letter-spacing:1px;
                      "
                    >
                      ${safeTicketNumber}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:12px 20px;
                      width:38%;
                      border-bottom:1px solid #edf1ee;
                      color:#68766e;
                      font-size:13px;
                    "
                  >
                    Participant
                  </td>

                  <td
                    style="
                      padding:12px 20px;
                      border-bottom:1px solid #edf1ee;
                      color:#26332c;
                      font-size:14px;
                      font-weight:700;
                    "
                  >
                    ${safeParticipantName}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:12px 20px;
                      border-bottom:1px solid #edf1ee;
                      color:#68766e;
                      font-size:13px;
                    "
                  >
                    County
                  </td>

                  <td
                    style="
                      padding:12px 20px;
                      border-bottom:1px solid #edf1ee;
                      color:#26332c;
                      font-size:14px;
                    "
                  >
                    ${safeCounty}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:12px 20px;
                      border-bottom:1px solid #edf1ee;
                      color:#68766e;
                      font-size:13px;
                    "
                  >
                    Constituency
                  </td>

                  <td
                    style="
                      padding:12px 20px;
                      border-bottom:1px solid #edf1ee;
                      color:#26332c;
                      font-size:14px;
                    "
                  >
                    ${safeConstituency}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:12px 20px;
                      border-bottom:1px solid #edf1ee;
                      color:#68766e;
                      font-size:13px;
                    "
                  >
                    Ward
                  </td>

                  <td
                    style="
                      padding:12px 20px;
                      border-bottom:1px solid #edf1ee;
                      color:#26332c;
                      font-size:14px;
                    "
                  >
                    ${safeWard}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:12px 20px;
                      border-bottom:1px solid #edf1ee;
                      color:#68766e;
                      font-size:13px;
                    "
                  >
                    Summit Date
                  </td>

                  <td
                    style="
                      padding:12px 20px;
                      border-bottom:1px solid #edf1ee;
                      color:#26332c;
                      font-size:14px;
                    "
                  >
                    ${safeSummitDate}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:12px 20px;
                      color:#68766e;
                      font-size:13px;
                    "
                  >
                    Venue
                  </td>

                  <td
                    style="
                      padding:12px 20px;
                      color:#26332c;
                      font-size:14px;
                    "
                  >
                    ${safeVenue}
                  </td>
                </tr>
              </table>

              <div
                style="
                  background:#fff8e5;
                  border-left:4px solid #d89c16;
                  padding:15px 17px;
                  border-radius:6px;
                  margin-bottom:24px;
                "
              >
                <p
                  style="
                    margin:0;
                    color:#725814;
                    font-size:14px;
                    line-height:1.6;
                  "
                >
                  <strong>Logistics update:</strong>
                  ${safeLogisticsMessage}
                </p>
              </div>

              <div
                style="
                  text-align:center;
                  padding:4px 0 20px;
                "
              >
                ${verificationButton}
                ${registrationButton}
              </div>

              <div
                style="
                  border-top:1px solid #e4e9e6;
                  padding-top:20px;
                  color:#68766e;
                  font-size:13px;
                  line-height:1.7;
                "
              >
                <strong style="color:#26332c;">
                  Important:
                </strong>

                Keep your ticket safe and present
                either the printed PDF ticket or its
                digital copy during summit check-in.
                Each ticket is valid for one participant.
              </div>
            </td>
          </tr>

          <tr>
            <td
              style="
                background:#17251d;
                padding:24px 30px;
                text-align:center;
                color:#dce8e0;
              "
            >
              <p
                style="
                  margin:0 0 7px;
                  font-size:14px;
                  font-weight:700;
                "
              >
                Jumuiya ya Vijana wa Pwani
              </p>

              <p
                style="
                  margin:0;
                  font-size:12px;
                  line-height:1.7;
                  color:#aebdb4;
                "
              >
                Email: ${safeContactEmail}<br />
                Phone: ${safeContactPhone}
              </p>
            </td>
          </tr>
        </table>

        <p
          style="
            max-width:650px;
            margin:18px auto 0;
            color:#849087;
            font-size:11px;
            line-height:1.6;
            text-align:center;
          "
        >
          This email was sent because you
          registered for the Coast Youth Summit.
          Please do not share your ticket or
          verification link with another person.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = buildPlainTextEmail({
    participant,
    ticket,
    summitEvent,
    summitDate,
    venue,
  });

  return {
    subject,
    html,
    text,
  };
};
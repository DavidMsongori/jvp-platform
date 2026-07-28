const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatMessage = (message = "") =>
  escapeHtml(message)
    .split(/\r?\n/)
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;line-height:1.7;color:#374151;">${paragraph}</p>`
    )
    .join("");

export const buildSummitLogisticsEmail = ({
  fullName,
  ticketNumber,
  subject,
  message,
  summitEvent,
  ticketPdfUrl,
}) => {
  const participantName =
    escapeHtml(fullName || "Participant");

  const safeTicketNumber =
    escapeHtml(ticketNumber || "Not available");

  const summitTitle = escapeHtml(
    summitEvent?.title ||
      "Coast Youth Summit 2026"
  );

  const venueName = escapeHtml(
    summitEvent?.venue?.name ||
      "To be communicated"
  );

  const venueAddress = escapeHtml(
    summitEvent?.venue?.address ||
      "To be communicated"
  );

  const summitDate = summitEvent?.summitDate
    ? new Date(
        summitEvent.summitDate
      ).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "To be communicated";

  return {
    subject,

    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>${escapeHtml(subject)}</title>
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background:#f3f4f6;
            font-family:Arial,Helvetica,sans-serif;
          "
        >
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="background:#f3f4f6;padding:30px 12px;"
          >
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    max-width:640px;
                    background:#ffffff;
                    border-radius:14px;
                    overflow:hidden;
                    box-shadow:0 8px 24px rgba(0,0,0,0.08);
                  "
                >
                  <tr>
                    <td
                      style="
                        padding:28px;
                        background:#064e3b;
                        color:#ffffff;
                        text-align:center;
                      "
                    >
                      <h1
                        style="
                          margin:0;
                          font-size:25px;
                          line-height:1.3;
                        "
                      >
                        ${summitTitle}
                      </h1>

                      <p
                        style="
                          margin:8px 0 0;
                          font-size:14px;
                          opacity:0.9;
                        "
                      >
                        Official Participant Logistics Update
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:30px;">
                      <p
                        style="
                          margin:0 0 18px;
                          color:#111827;
                          font-size:16px;
                        "
                      >
                        Dear ${participantName},
                      </p>

                      ${formatMessage(message)}

                      <table
                        role="presentation"
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        style="
                          margin:24px 0;
                          background:#f9fafb;
                          border:1px solid #e5e7eb;
                          border-radius:10px;
                        "
                      >
                        <tr>
                          <td
                            style="
                              padding:18px;
                              color:#374151;
                              font-size:14px;
                              line-height:1.8;
                            "
                          >
                            <strong>Ticket:</strong>
                            ${safeTicketNumber}
                            <br />

                            <strong>Date:</strong>
                            ${summitDate}
                            <br />

                            <strong>Venue:</strong>
                            ${venueName}
                            <br />

                            <strong>Address:</strong>
                            ${venueAddress}
                          </td>
                        </tr>
                      </table>

                      ${
                        ticketPdfUrl
                          ? `
                            <div
                              style="
                                text-align:center;
                                margin:28px 0;
                              "
                            >
                              <a
                                href="${escapeHtml(
                                  ticketPdfUrl
                                )}"
                                style="
                                  display:inline-block;
                                  padding:13px 24px;
                                  background:#f59e0b;
                                  color:#111827;
                                  text-decoration:none;
                                  border-radius:8px;
                                  font-weight:bold;
                                "
                              >
                                View Summit Ticket
                              </a>
                            </div>
                          `
                          : ""
                      }

                      <p
                        style="
                          margin:22px 0 0;
                          color:#374151;
                          line-height:1.7;
                        "
                      >
                        Please keep your ticket safely and
                        present it during summit check-in.
                      </p>

                      <p
                        style="
                          margin:24px 0 0;
                          color:#374151;
                          line-height:1.7;
                        "
                      >
                        Regards,<br />
                        <strong>
                          Jumuiya ya Vijana wa Pwani
                        </strong>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:20px;
                        background:#111827;
                        color:#d1d5db;
                        text-align:center;
                        font-size:12px;
                        line-height:1.6;
                      "
                    >
                      This email was sent regarding your
                      registration for ${summitTitle}.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };
};
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import { registerJVPAtOne } from '../services/jvpAtOneService'
import './JVPAtOneRegister.css'

const wardsByConstituency = {
  'Lamu East': ['Faza', 'Kiunga', 'Basuba'],
  'Lamu West': [
    'Shela',
    'Mkomani',
    'Hindi',
    'Mkunumbi',
    'Hongwe',
    'Bahari',
    'Witu',
    'Mpeketoni',
  ],
}

export default function JVPAtOneRegister() {
  const [registration, setRegistration] = useState({
    fullName: '',
    phone: '',
    constituency: '',
    ward: '',
  })

  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [ticket, setTicket] = useState(null)
  const [isExistingTicket, setIsExistingTicket] = useState(false)

  const availableWards =
    wardsByConstituency[registration.constituency] || []

  function handleChange(event) {
    const { name, value } = event.target

    setRegistration((current) => ({
      ...current,
      [name]: value,
      ...(name === 'constituency' ? { ward: '' } : {}),
    }))

    setError('')
    setSuccess('')
    setTicket(null)
    setIsExistingTicket(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setTicket(null)
    setIsExistingTicket(false)

    if (!availableWards.includes(registration.ward)) {
      setError('Please select a valid constituency and ward.')
      return
    }

    setLoading(true)

    try {
      const response = await registerJVPAtOne(registration)
      const returnedTicket = response?.registration

      if (!returnedTicket?.registrationNumber) {
        throw new Error(
          'The server did not return a registration ticket number. Please contact the JVP team before submitting again.'
        )
      }

      setTicket(returnedTicket)
      setIsExistingTicket(Boolean(response.existingRegistration))
      setSuccess(
        response.message ||
          (response.existingRegistration
            ? 'Your existing registration ticket has been retrieved.'
            : 'Your registration was successful.')
      )

      setRegistration({
        fullName: '',
        phone: '',
        constituency: '',
        ward: '',
      })
    } catch (err) {
      setError(
        err.message || 'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function downloadTicket() {
    if (!ticket || downloading) return

    setDownloading(true)
    setError('')

    try {
    const pdf = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
})

const pageWidth = pdf.internal.pageSize.getWidth()
const pageHeight = pdf.internal.pageSize.getHeight()
      const navy = [16, 59, 115]
      const gold = [233, 183, 46]
      const dark = [20, 45, 78]
      const muted = [92, 108, 128]
      const margin = 14

      // Page background
      pdf.setFillColor(247, 248, 250)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')

      // Main ticket panel
      pdf.setFillColor(255, 255, 255)
      pdf.roundedRect(
        7,
        7,
        pageWidth - 14,
        pageHeight - 14,
        4,
        4,
        'F'
      )

      // Anniversary header
      pdf.setFillColor(...navy)
      pdf.roundedRect(
        7,
        7,
        pageWidth - 14,
        48,
        4,
        4,
        'F'
      )
      pdf.rect(7, 42, pageWidth - 14, 13, 'F')

      // Gold accent
      pdf.setFillColor(...gold)
      pdf.rect(7, 53, pageWidth - 14, 2, 'F')

      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.text(
        'JUMUIYA YA VIJANA WA PWANI',
        pageWidth / 2,
        19,
        { align: 'center' }
      )

      pdf.setTextColor(...gold)
      pdf.setFontSize(30)
      pdf.text('JVP @ 1', pageWidth / 2, 32, {
        align: 'center',
      })

      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(9)
      pdf.text(
        'FIRST ANNIVERSARY CELEBRATION',
        pageWidth / 2,
        43,
        { align: 'center' }
      )

      // Ticket status
      pdf.setTextColor(...navy)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text(
        isExistingTicket
          ? 'EXISTING REGISTRATION TICKET'
          : 'REGISTRATION CONFIRMED',
        pageWidth / 2,
        66,
        { align: 'center' }
      )

      // Registration number
      pdf.setTextColor(...muted)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.text('REGISTRATION NUMBER', pageWidth / 2, 77, {
        align: 'center',
      })

      pdf.setTextColor(...navy)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(17)
      pdf.text(
        String(ticket.registrationNumber),
        pageWidth / 2,
        87,
        { align: 'center' }
      )

      // Gold separator
      pdf.setDrawColor(...gold)
      pdf.setLineWidth(0.7)
      pdf.line(margin, 95, pageWidth - margin, 95)

      // Attendee details
      const details = [
        ['FULL NAME', ticket.fullName],
        ['CONSTITUENCY', ticket.constituency],
        ['WARD', ticket.ward],
        ['EVENT DATE', 'Tuesday, 22 December 2026'],
        ['LOCATION', 'Lamu County, Kenya'],
        ['VENUE', 'To be announced'],
      ]

      let y = 107

      details.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.setTextColor(...muted)
        pdf.text(label, margin, y)

        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.setTextColor(...dark)

        const valueLines = pdf.splitTextToSize(
          String(value || 'Not provided'),
          pageWidth - margin * 2
        )

        pdf.text(valueLines, margin, y + 6)
        y += 13 + Math.max(0, valueLines.length - 1) * 4
      })

      // Footer
      const footerY = pageHeight - 18

      pdf.setDrawColor(...gold)
      pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.setTextColor(...navy)
      pdf.text(
        'ONE COAST. ONE VISION. ONE FUTURE.',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      )

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(...muted)

      const footerLines = pdf.splitTextToSize(
        'Keep this ticket and present your registration number during event check-in.',
        pageWidth - margin * 2
      )

      pdf.text(footerLines, pageWidth / 2, footerY + 6, {
        align: 'center',
      })

      // Prevent accidental overflow on unusually long details.
      if (y > footerY - 8) {
        throw new Error(
          'The ticket details are too long to fit on the PDF. Please check the registration details.'
        )
      }

      const safeNumber = String(ticket.registrationNumber).replace(
        /[^a-zA-Z0-9-_]/g,
        '-'
      )

      pdf.save(`${safeNumber}-JVP-At-One-Ticket.pdf`)
    } catch (err) {
      setError(
        err.message || 'Unable to download the ticket. Please try again.'
      )
    } finally {
      setDownloading(false)
    }
  }

  function closeTicket() {
    setTicket(null)
    setIsExistingTicket(false)
    setSuccess('')
    setError('')
  }

  return (
    <main className="jvp-register-page">
      <section className="jvp-register-hero">
        <div className="jvp-register-container">
          <span className="jvp-eyebrow">
            JUMUIYA YA VIJANA WA PWANI
          </span>

          <h1>Register for JVP @ 1</h1>

          <p className="jvp-register-intro">
            Do you come from Lamu County? Join us as we celebrate
            one year of youth leadership, unity, and impact across
            the Coast.
          </p>

          <div className="jvp-register-event-details">
            <p>
              <span aria-hidden="true">📅</span>
              <strong>Tuesday, 22 December 2026</strong>
            </p>

            <p>
              <span aria-hidden="true">📍</span>
              <strong>Lamu County, Kenya</strong>
            </p>

            <p className="jvp-register-venue">
              Venue to be announced
            </p>
          </div>

          <div className="jvp-register-card">
            <h2>Youth Registration Form</h2>

            <p className="jvp-register-card-intro">
              Complete the details below to register for the
              anniversary celebration.
            </p>

            {error && (
              <div
                className="jvp-register-message error"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="jvp-register-message success"
                role="status"
              >
                {success}
              </div>
            )}

            {ticket && (
              <div
                className="jvp-registration-ticket"
                id="jvp-registration-ticket"
                aria-label="JVP @ 1 registration ticket"
              >
                <div className="jvp-ticket-header">
                  <span>JUMUIYA YA VIJANA WA PWANI</span>
                  <h2>JVP @ 1</h2>
                  <p>FIRST ANNIVERSARY CELEBRATION</p>
                </div>

                <div className="jvp-ticket-body">
                  <p className="jvp-ticket-status">
                    {isExistingTicket
                      ? 'YOUR EXISTING TICKET'
                      : 'REGISTRATION CONFIRMED'}
                  </p>

                  <p className="jvp-ticket-label">
                    Registration Number
                  </p>

                  <p className="jvp-ticket-number">
                    {ticket.registrationNumber}
                  </p>

                  <div className="jvp-ticket-details">
                    <div>
                      <span>Full name</span>
                      <strong>{ticket.fullName}</strong>
                    </div>

                    <div>
                      <span>Constituency</span>
                      <strong>{ticket.constituency}</strong>
                    </div>

                    <div>
                      <span>Ward</span>
                      <strong>{ticket.ward}</strong>
                    </div>

                    <div>
                      <span>Event date</span>
                      <strong>22 December 2026</strong>
                    </div>

                    <div>
                      <span>Location</span>
                      <strong>Lamu County, Kenya</strong>
                    </div>
                  </div>

                  <p className="jvp-ticket-footer">
                    Please keep this ticket and present your
                    registration number during event check-in.
                  </p>
                </div>

                <div className="jvp-ticket-actions">
                  <button
                    type="button"
                    className="jvp-button jvp-button-gold"
                    onClick={downloadTicket}
                    disabled={downloading}
                  >
                    {downloading
                      ? 'Preparing PDF...'
                      : 'Download Ticket (PDF)'}
                  </button>

                  <button
                    type="button"
                    className="jvp-ticket-close"
                    onClick={closeTicket}
                  >
                    Close Ticket
                  </button>
                </div>
              </div>
            )}

            {!ticket && (
              <form onSubmit={handleSubmit}>
                <div className="jvp-register-field">
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={registration.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    maxLength={120}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="jvp-register-field">
                  <label htmlFor="phone">Phone number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={registration.phone}
                    onChange={handleChange}
                    placeholder="e.g. 0712 345 678"
                    maxLength={20}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="jvp-register-field">
                  <label htmlFor="constituency">Constituency</label>
                  <select
                    id="constituency"
                    name="constituency"
                    value={registration.constituency}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select constituency</option>
                    <option value="Lamu East">Lamu East</option>
                    <option value="Lamu West">Lamu West</option>
                  </select>
                </div>

                <div className="jvp-register-field">
                  <label htmlFor="ward">Ward</label>
                  <select
                    id="ward"
                    name="ward"
                    value={registration.ward}
                    onChange={handleChange}
                    required
                    disabled={loading || !registration.constituency}
                  >
                    <option value="">Select ward</option>

                    {availableWards.map((ward) => (
                      <option key={ward} value={ward}>
                        {ward}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="jvp-button jvp-button-gold jvp-register-submit"
                  disabled={loading}
                >
                  {loading
                    ? 'Submitting registration...'
                    : 'Register for JVP @ 1'}
                </button>

                <p className="jvp-register-privacy">
                  Please ensure your details are correct before
                  submitting your registration.
                </p>
              </form>
            )}
          </div>

          <Link className="jvp-register-back" to="/jvp-at-one">
            ← Back to the anniversary website
          </Link>
        </div>
      </section>
    </main>
  )
}
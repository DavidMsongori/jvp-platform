import { useEffect, useState } from 'react'
import './HeroAnni.css'

const ANNIVERSARY_DATE = new Date('2026-12-22T00:00:00+03:00').getTime()

function getTimeLeft() {
  const difference = Math.max(0, ANNIVERSARY_DATE - Date.now())

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

export default function HeroAnniversary() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="anniversary-hero">
      <div className="anniversary-hero__decoration anniversary-hero__decoration--one" />
      <div className="anniversary-hero__decoration anniversary-hero__decoration--two" />

      <div className="anniversary-hero__container">
        <div className="anniversary-hero__content">
          <span className="anniversary-hero__eyebrow">
            One year of purpose · 2025–2026
          </span>

          <h1>
            One Year of Purpose,
            <span>A Future of Possibilities.</span>
          </h1>

          <p className="anniversary-hero__description">
            Celebrating a year of youth leadership, unity and transformative
            impact across the Coast. One movement, many voices, a shared
            vision for a better future.
          </p>

          <div className="anniversary-hero__actions">
            <a href="#social" className="anniversary-btn anniversary-btn--gold">
              Follow Our Journey <span aria-hidden="true">↗</span>
            </a>

            <a
              href="#celebration"
              className="anniversary-btn anniversary-btn--outline"
            >
              Celebrate JVP @ 1
            </a>
          </div>

          <div className="anniversary-countdown">
            <div className="anniversary-countdown__heading">
              Countdown to JVP @ 1
            </div>

            <div className="anniversary-countdown__grid">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Minutes', value: timeLeft.minutes },
                { label: 'Seconds', value: timeLeft.seconds },
              ].map((item) => (
                <div className="anniversary-countdown__item" key={item.label}>
                  <strong>{String(item.value).padStart(2, '0')}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <p className="anniversary-countdown__date">
              22 December 2026 <span aria-hidden="true">·</span> Lamu County
            </p>
          </div>
        </div>

        <div className="anniversary-hero__visual">
          <div className="anniversary-hero__ring">
            <div className="anniversary-hero__mark">
              <div className="anniversary-hero__number">
                1<span>st</span>
              </div>

              <div className="anniversary-hero__label">ANNIVERSARY</div>

              <div className="anniversary-hero__organization">
                JUMUIYA YA VIJANA WA PWANI
              </div>

              <div className="anniversary-hero__date">22 · 12 · 2026</div>
            </div>
          </div>

          <div className="anniversary-hero__floating-note">
            <span aria-hidden="true">✦</span>
            One Coast. One Vision. One Future.
          </div>
        </div>
      </div>

      <div className="anniversary-hero__wave" />
    </section>
  )
}
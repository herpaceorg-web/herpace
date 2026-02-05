/**
 * Hormone Wave Background Component
 *
 * Displays subtle hormone curve waves as background decoration
 * using the same colors and patterns as the HormoneCycleChart.
 */

interface HormoneWaveBackgroundProps {
  opacity?: number
}

const HORMONE_COLORS = {
  estrogen: "#efa910",
  progesterone: "#a14139",
  fsh: "#677344",
  lh: "#597d93",
}

export function HormoneWaveBackground({ opacity = 0.15 }: HormoneWaveBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        {/* Estrogen wave - golden */}
        <path
          fill={`${HORMONE_COLORS.estrogen}26`}
          d="M0,120L48,104C96,88,192,56,288,66.7C384,77,480,131,576,125.3C672,120,768,56,864,50.7C960,45,1056,99,1152,104C1248,109,1344,67,1392,45.3L1440,24L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />

        {/* Progesterone wave - burgundy */}
        <path
          fill={`${HORMONE_COLORS.progesterone}26`}
          d="M0,184L48,173.3C96,163,192,141,288,141.3C384,141,480,163,576,173.3C672,184,768,184,864,168C960,152,1056,120,1152,114.7C1248,109,1344,131,1392,141.3L1440,152L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />

        {/* FSH wave - olive green */}
        <path
          fill={`${HORMONE_COLORS.fsh}26`}
          d="M0,232L48,221.3C96,211,192,189,288,184C384,179,480,189,576,205.3C672,221,768,243,864,237.3C960,232,1056,200,1152,189.3C1248,179,1344,189,1392,194.7L1440,200L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />

        {/* LH wave - blue */}
        <path
          fill={`${HORMONE_COLORS.lh}26`}
          d="M0,276L48,265.3C96,255,192,233,288,233.3C384,233,480,255,576,254.7C672,255,768,233,864,222.7C960,212,1056,212,1152,222.7C1248,233,1344,255,1392,265.3L1440,276L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
    </div>
  )
}

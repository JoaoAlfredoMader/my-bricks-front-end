import { seeded } from '../../lib/seeded'

const WIDTH = 1600
const HEIGHT = 900

interface Tower {
  x: number
  width: number
  height: number
  lights: { x: number; y: number }[]
}

function buildSkyline(seed: number, baseHeight: number, spread: number, lightChance: number): Tower[] {
  const random = seeded(seed)
  const towers: Tower[] = []
  let x = -20
  while (x < WIDTH + 20) {
    const width = 50 + Math.round(random() * 70)
    const height = baseHeight + Math.round(random() * spread)
    const lights: Tower['lights'] = []
    for (let row = HEIGHT - height + 14; row < HEIGHT - 10; row += 18) {
      for (let col = x + 8; col < x + width - 10; col += 14) {
        if (random() < lightChance) lights.push({ x: col, y: row })
      }
    }
    towers.push({ x, width, height, lights })
    x += width + 4 + Math.round(random() * 10)
  }
  return towers
}

const FAR_SKYLINE = buildSkyline(7, 150, 170, 0)
const NEAR_SKYLINE = buildSkyline(21, 90, 130, 0.12)

const STARS = (() => {
  const random = seeded(3)
  return Array.from({ length: 70 }, () => ({
    x: Math.round(random() * WIDTH),
    y: Math.round(random() * 520),
    r: 0.8 + random() * 1.6,
    delay: Math.round(random() * 4000),
  }))
})()

function Cloud({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g className="cloud" transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="90" ry="26" />
      <ellipse cx="-38" cy="-16" rx="40" ry="28" />
      <ellipse cx="22" cy="-26" rx="52" ry="36" />
      <ellipse cx="70" cy="-6" rx="36" ry="22" />
    </g>
  )
}

/** Background layer: sky, sun and moon, stars, clouds and the distant city. */
export function Sky() {
  return (
    <svg
      className="scene-sky"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6FA6C6" />
          <stop offset="0.7" stopColor="#B9D5DE" />
          <stop offset="1" stopColor="#DCE8E2" />
        </linearGradient>
        <linearGradient id="sky-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#081227" />
          <stop offset="0.65" stopColor="#1A2B52" />
          <stop offset="1" stopColor="#33466F" />
        </linearGradient>
        <radialGradient id="sun-glow">
          <stop offset="0" stopColor="#FFE6A8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFE6A8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moon-glow">
          <stop offset="0" stopColor="#DDE6FF" stopOpacity="0.45" />
          <stop offset="1" stopColor="#DDE6FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={WIDTH} height={HEIGHT} fill="url(#sky-day)" />
      <rect className="sky-night" width={WIDTH} height={HEIGHT} fill="url(#sky-night)" />

      <g className="stars">
        {STARS.map((star) => (
          <circle
            key={`${star.x}-${star.y}`}
            className="star"
            cx={star.x}
            cy={star.y}
            r={star.r}
            style={{ animationDelay: `${star.delay}ms` }}
          />
        ))}
      </g>

      <g className="sun">
        <circle cx="1240" cy="230" r="170" fill="url(#sun-glow)" />
        <circle cx="1240" cy="230" r="64" fill="#FFF1C9" />
      </g>

      <g className="moon">
        <circle cx="330" cy="200" r="150" fill="url(#moon-glow)" />
        <circle cx="330" cy="200" r="46" fill="#EEF1F6" />
        <circle cx="316" cy="188" r="9" fill="#D9DEE8" />
        <circle cx="344" cy="214" r="6" fill="#D9DEE8" />
        <circle cx="338" cy="182" r="4" fill="#D9DEE8" />
      </g>

      <g className="clouds">
        <Cloud x={260} y={330} scale={1.1} />
        <Cloud x={900} y={170} scale={0.8} />
        <Cloud x={1380} y={400} scale={1.3} />
      </g>

      <g className="skyline-far">
        {FAR_SKYLINE.map((tower) => (
          <rect key={tower.x} x={tower.x} y={HEIGHT - tower.height} width={tower.width} height={tower.height} />
        ))}
      </g>
      <g className="skyline-near">
        {NEAR_SKYLINE.map((tower) => (
          <rect key={tower.x} x={tower.x} y={HEIGHT - tower.height} width={tower.width} height={tower.height} />
        ))}
      </g>
      <g className="skyline-lights">
        {NEAR_SKYLINE.flatMap((tower) =>
          tower.lights.map((light) => (
            <rect key={`${light.x}-${light.y}`} x={light.x} y={light.y} width="5" height="7" />
          )),
        )}
      </g>
    </svg>
  )
}

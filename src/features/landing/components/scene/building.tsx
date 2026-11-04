import type { CSSProperties } from 'react'
import { seeded } from '../../lib/seeded'

export const FOREGROUND_WIDTH = 1000
export const FOREGROUND_HEIGHT = 760

interface Window {
  x: number
  y: number
  width: number
  height: number
  lit: boolean
  delay: number
}

interface Block {
  /** Left edge and width of the facade. */
  x: number
  width: number
  /** Top of the first residential floor; floors go down to the podium. */
  top: number
  floors: number
  columns: number[]
  windowWidth: number
}

const FLOOR_HEIGHT = 50
const PODIUM_TOP = 680

// Building coordinates live in a 600-wide box shifted to the middle of the scene.
const OFFSET_X = 200

const TOWER: Block = { x: 150, width: 300, top: 80, floors: 12, columns: [168, 238, 308, 378], windowWidth: 54 }
const LEFT_WING: Block = { x: 30, width: 130, top: 380, floors: 6, columns: [46, 98], windowWidth: 42 }
const RIGHT_WING: Block = { x: 440, width: 130, top: 430, floors: 5, columns: [458, 510], windowWidth: 42 }

function windowsOf(block: Block, seed: number): Window[] {
  const random = seeded(seed)
  const windows: Window[] = []
  for (let floor = 0; floor < block.floors; floor++) {
    const y = block.top + floor * FLOOR_HEIGHT + 8
    for (const x of block.columns) {
      windows.push({
        x,
        y,
        width: block.windowWidth,
        height: 30,
        lit: random() < 0.45,
        delay: Math.round(random() * 1400),
      })
    }
  }
  return windows
}

const WINDOWS = [...windowsOf(LEFT_WING, 11), ...windowsOf(RIGHT_WING, 12), ...windowsOf(TOWER, 13)]

const TOWER_FLOORS = Array.from({ length: TOWER.floors }, (_, floor) => TOWER.top + floor * FLOOR_HEIGHT)

// Balconies that have a plant, by floor index.
const PLANTED_FLOORS = new Set([1, 3, 4, 7, 9, 10])

function Facade({ block }: { block: Block }) {
  return (
    <>
      <rect className="wall" x={block.x} y={block.top - 20} width={block.width} height={PODIUM_TOP - block.top + 20} />
      <rect className="slab" x={block.x - 4} y={block.top - 24} width={block.width + 8} height="8" />
    </>
  )
}

function Tree({ x, scale }: { x: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${FOREGROUND_HEIGHT}) scale(${scale})`}>
      <rect className="trunk" x="-6" y="-120" width="12" height="120" />
      <circle className="leaves" cx="0" cy="-150" r="56" />
      <circle className="leaves" cx="-38" cy="-120" r="40" />
      <circle className="leaves leaves-light" cx="34" cy="-128" r="44" />
      <circle className="leaves leaves-light" cx="8" cy="-190" r="34" />
    </g>
  )
}

function StreetLamp({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} ${FOREGROUND_HEIGHT})`}>
      <circle className="lamp-glow" cx="0" cy="-196" r="90" fill="url(#lamp-glow)" />
      <rect className="lamp-pole" x="-3" y="-190" width="6" height="190" />
      <rect className="lamp-pole" x="-14" y="-200" width="28" height="8" rx="4" />
      <rect className="lamp-bulb" x="-10" y="-193" width="20" height="5" rx="2.5" />
    </g>
  )
}

/** Foreground layer: the residential building, trees and street lamps. */
export function Building() {
  return (
    <svg
      className="scene-building"
      viewBox={`0 0 ${FOREGROUND_WIDTH} ${FOREGROUND_HEIGHT}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id="bricks" width="28" height="14" patternUnits="userSpaceOnUse">
          <rect className="brick" width="28" height="14" />
          <path className="mortar" d="M0 0.5H28M0 7.5H28M7 0V7M21 7V14" />
        </pattern>
        <radialGradient id="lamp-glow">
          <stop offset="0" stopColor="#FFD58A" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFD58A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g transform={`translate(${OFFSET_X} 0)`}>
        <Facade block={LEFT_WING} />
        <Facade block={RIGHT_WING} />

        {/* Tower with its rooftop machine room. */}
        <rect className="wall wall-light" x="210" y="22" width="80" height="40" />
        <rect className="wall wall-light" x={TOWER.x} y="50" width={TOWER.width} height={PODIUM_TOP - 50} />
        <rect className="slab" x={TOWER.x - 6} y="48" width={TOWER.width + 12} height="12" />

        {WINDOWS.map((w) => (
          <g key={`${w.x}-${w.y}`}>
            <rect
              className={w.lit ? 'window window-lit' : 'window'}
              x={w.x}
              y={w.y}
              width={w.width}
              height={w.height}
              style={{ '--delay': `${w.delay}ms` } as CSSProperties}
            />
            <path className="glint" d={`M${w.x + 6} ${w.y + w.height}L${w.x + 20} ${w.y}H${w.x + 28}L${w.x + 14} ${w.y + w.height}Z`} />
          </g>
        ))}

        {TOWER_FLOORS.map((y, floor) => (
          <g key={y}>
            <rect className="rail" x={TOWER.x - 6} y={y + 30} width={TOWER.width + 12} height="14" />
            <rect className="slab" x={TOWER.x - 10} y={y + 44} width={TOWER.width + 20} height="6" />
            {PLANTED_FLOORS.has(floor) ? (
              <circle className="leaves" cx={floor % 2 === 0 ? 172 : 428} cy={y + 30} r="9" />
            ) : null}
          </g>
        ))}

        {/* Brick podium with the entrance. */}
        <rect x="20" y={PODIUM_TOP} width="560" height={FOREGROUND_HEIGHT - PODIUM_TOP} fill="url(#bricks)" />
        <rect className="slab" x="14" y={PODIUM_TOP - 6} width="572" height="8" />
        <rect className="window window-lit" x="262" y="700" width="76" height="60" style={{ '--delay': '0ms' } as CSSProperties} />
        <rect className="frame" x="298" y="700" width="4" height="60" />
        <rect className="frame" x="240" y="690" width="120" height="8" />
      </g>

      <StreetLamp x={150} />
      <StreetLamp x={850} />
      <Tree x={70} scale={1.05} />
      <Tree x={190} scale={0.8} />
      <Tree x={815} scale={0.85} />
      <Tree x={935} scale={1.1} />
    </svg>
  )
}

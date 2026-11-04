import type { Scene } from '../../hooks/use-scene'
import manifest from '../../assets/hero/manifest.json'
import { seeded } from '../../lib/seeded'

// Built by `npm run hero:images`: <scene>-<width>.webp next to manifest.json.
const FILES = import.meta.glob<string>('../../assets/hero/*.webp', { eager: true, query: '?url', import: 'default' })

function fileUrl(scene: Scene, width: number) {
  const url = FILES[`../../assets/hero/${scene}-${width}.webp`]
  if (!url) throw new Error(`Missing hero image ${scene}-${width}.webp; run npm run hero:images`)
  return url
}

function srcSet(scene: Scene) {
  return manifest.widths.map((width) => `${fileUrl(scene, width)} ${width}w`).join(', ')
}

const LARGEST = Math.max(...manifest.widths)
// The image covers the hero, so it is drawn at least as wide as the viewport
// and as tall as it: whichever is larger decides the file the browser picks.
const SIZES = `max(100vw, calc(100svh * ${(manifest.width / manifest.height).toFixed(3)}))`

const TWINKLES = (() => {
  const random = seeded(5)
  return Array.from({ length: 22 }, () => ({
    left: `${(random() * 100).toFixed(2)}%`,
    top: `${(random() * 28).toFixed(2)}%`,
    delay: `${Math.round(random() * 4000)}ms`,
  }))
})()

interface PhotoSceneProps {
  scene: Scene
}

/** The day and night renders stacked; night is revealed over day when the scene changes. */
export function PhotoScene({ scene }: PhotoSceneProps) {
  return (
    <div className="scene-photo" aria-hidden="true">
      <img
        className="scene-photo-day"
        src={fileUrl('day', LARGEST)}
        srcSet={srcSet('day')}
        sizes={SIZES}
        alt=""
        fetchPriority={scene === 'day' ? 'high' : 'low'}
        decoding="async"
      />
      <img
        className="scene-photo-night"
        src={fileUrl('night', LARGEST)}
        srcSet={srcSet('night')}
        sizes={SIZES}
        alt=""
        fetchPriority={scene === 'night' ? 'high' : 'low'}
        decoding="async"
      />
      <div className="twinkles">
        {TWINKLES.map((star) => (
          <span key={`${star.left}-${star.top}`} style={{ left: star.left, top: star.top, animationDelay: star.delay }} />
        ))}
      </div>
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import type { Scene } from '../hooks/use-scene'
import { BrandMark } from './brand-mark'
import { Building } from './scene/building'
import { Sky } from './scene/sky'
import { SceneToggle } from './scene-toggle'

interface HeroProps {
  scene: Scene
  onToggleScene: () => void
  onReadStory: () => void
}

export function Hero({ scene, onToggleScene, onReadStory }: HeroProps) {
  return (
    <section className="relative h-svh min-h-[34rem] overflow-hidden" aria-labelledby="hero-title">
      <Sky />
      <h1 id="hero-title" className="hero-title">
        MyBricks
      </h1>
      <div className="hero-ground" />
      <Building />
      <div className="hero-frame" />

      <header className="absolute inset-x-(--frame-inset) top-(--frame-inset) flex items-center justify-between p-3 sm:p-5">
        <Link to="/" className="flex items-center gap-2 rounded-full text-(--ink)" aria-label="MyBricks, início">
          <BrandMark className="size-9" />
        </Link>
        <div className="flex items-center gap-2">
          <SceneToggle scene={scene} onToggle={onToggleScene} />
          <Link
            to="/login"
            className="inline-flex h-11 items-center rounded-full bg-(--ink) px-6 font-semibold text-(--paper) transition-colors"
          >
            Entrar
          </Link>
        </div>
      </header>

      <div className="hero-teaser absolute inset-x-0 bottom-[calc(var(--frame-inset)+12px)] flex justify-center px-6 sm:bottom-(--frame-bottom) sm:translate-y-1/2">
        <div className="flex max-w-3xl flex-col items-center gap-3 rounded-3xl bg-(--card) p-3 pl-6 text-(--ink) shadow-lg backdrop-blur-md sm:flex-row sm:gap-6 sm:rounded-full">
          <p className="text-center text-pretty sm:text-left">
            Uma carteira de imóveis inteira num só painel.{' '}
            <span className="hidden sm:inline">Veja por que e como ele foi construído.</span>
          </p>
          <button
            type="button"
            onClick={onReadStory}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-(--ink) px-5 font-semibold text-(--paper)"
          >
            Ler a história
            <ChevronDown aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

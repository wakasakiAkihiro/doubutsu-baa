import { useCallback, useEffect, useRef, useState } from 'react'
import { animals, reactions, type Animal } from '../data/animals'
import { ShuffleBag } from '../game/shuffleBag'
import type { SoundPlayer } from '../audio/SoundPlayer'
export const REVEAL_DURATION = 7000
export const NEXT_DELAY = 1600
export const TRANSITION_DURATION = 400
export const REVEAL_REACTION_DURATION = 720
export const hidingPlaces = ['bush', 'box', 'cloud', 'leaf', 'water'] as const
export type HidingPlace = (typeof hidingPlaces)[number]
type Phase = 'intro' | 'hiding' | 'revealed' | 'leaving'
type GameState = {
  phase: Phase
  animal: Animal
  turn: number
  reaction: number
  ready: boolean
}
export function useGame(sound: SoundPlayer) {
  const bag = useRef<ShuffleBag<Animal> | null>(null)
  const [game, setGame] = useState<GameState>({
    phase: 'intro',
    animal: animals[0],
    turn: 0,
    reaction: 0,
    ready: false,
  })
  const [paused, setPaused] = useState(document.hidden)
  const lastTap = useRef(-Infinity)
  const locked = useRef(false)
  const celebratingUntil = useRef(0)
  useEffect(() => {
    const onVisibility = () => {
      setPaused(document.hidden)
      if (document.hidden) sound.suspend()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [sound])
  const next = useCallback(() => {
    if (locked.current) return
    locked.current = true
    sound.silence()
    sound.play('next')
    setGame((previous) => ({ ...previous, phase: 'leaving', ready: false }))
  }, [sound])
  useEffect(() => {
    if (paused || game.phase !== 'revealed') return
    const timeout = window.setTimeout(next, REVEAL_DURATION)
    return () => window.clearTimeout(timeout)
  }, [game.phase, game.reaction, next, paused])
  useEffect(() => {
    if (paused || game.phase !== 'revealed') return
    const timeout = window.setTimeout(
      () => setGame((previous) => ({ ...previous, ready: true })),
      NEXT_DELAY,
    )
    return () => window.clearTimeout(timeout)
  }, [game.phase, paused])
  useEffect(() => {
    if (paused || game.phase !== 'leaving') return
    const timeout = window.setTimeout(() => {
      const animal = bag.current!.next()
      setGame((previous) => ({
        phase: 'hiding',
        animal,
        turn: previous.turn + 1,
        reaction: 0,
        ready: false,
      }))
      lastTap.current = Date.now()
      locked.current = false
      sound.playCue('hide')
    }, TRANSITION_DURATION)
    return () => window.clearTimeout(timeout)
  }, [game.phase, paused, sound])
  useEffect(() => {
    const paths = [game.animal.image]
    if (bag.current) paths.push(bag.current.peek().image)
    paths.forEach((path) => {
      const image = new Image()
      image.src = path
    })
  }, [game.animal])
  const tap = () => {
    if (paused || locked.current || Date.now() - lastTap.current < 140) return
    lastTap.current = Date.now()
    if (game.phase === 'intro') {
      sound.unlock()
      sound.playCue('hide')
      bag.current = new ShuffleBag(animals)
      setGame({
        phase: 'hiding',
        animal: bag.current.next(),
        turn: 0,
        reaction: 0,
        ready: false,
      })
    } else if (game.phase === 'hiding') {
      locked.current = true
      sound.playCue('reveal', () => {
        locked.current = false
        celebratingUntil.current = Date.now() + REVEAL_REACTION_DURATION
        setGame((previous) => ({ ...previous, phase: 'revealed', reaction: 0 }))
      })
    } else if (game.phase === 'revealed') {
      if (Date.now() < celebratingUntil.current) return
      sound.play(game.reaction % 3 === 2 ? 'sparkle' : 'tap')
      setGame((previous) => ({ ...previous, reaction: previous.reaction + 1 }))
    }
  }
  return {
    ...game,
    tap,
    next: () => {
      if (game.phase === 'revealed' && game.ready) next()
    },
    hidingPlace: hidingPlaces[game.turn % hidingPlaces.length],
    animation:
      game.reaction === 0
        ? game.animal.reaction
        : reactions[game.reaction % reactions.length],
  }
}

import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import {
  NEXT_DELAY,
  REVEAL_DURATION,
  TRANSITION_DURATION,
  REVEAL_REACTION_DURATION,
} from '../src/hooks/useGame'
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))
const tap = () => {
  advance(180)
  fireEvent.click(screen.getByTestId('play-area'))
}
const start = () => {
  fireEvent.click(screen.getByRole('button', { name: 'あそぼう' }))
  tap()
}
describe('toddler play flow', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })
  it('shows a large welcome animal and starts with one tap', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'どうぶつ',
    )
    expect(screen.getByAltText('いぬ')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'あそぼう' }))
    expect(
      screen.getByRole('button', { name: 'かくれんぼをタップ' }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('animal')).not.toBeInTheDocument()
  })
  it('reveals, reacts, and moves to a different animal and hiding place', () => {
    render(<App />)
    start()
    const first = screen.getByTestId('animal').getAttribute('data-animal')
    tap()
    expect(screen.getByTestId('animal')).toHaveAttribute('data-reaction', '0')
    advance(REVEAL_REACTION_DURATION)
    tap()
    expect(screen.getByTestId('animal')).toHaveAttribute('data-reaction', '1')
    advance(NEXT_DELAY)
    fireEvent.click(screen.getByRole('button', { name: 'つぎのどうぶつ' }))
    advance(TRANSITION_DURATION)
    expect(screen.getByRole('main')).toHaveAttribute('data-phase', 'hiding')
    expect(document.querySelector('.hiding-box')).toBeInTheDocument()
    tap()
    expect(screen.getByTestId('animal').getAttribute('data-animal')).not.toBe(
      first,
    )
  })
  it('absorbs rapid taps without duplicate transitions', () => {
    render(<App />)
    start()
    for (let i = 0; i < 150; i++)
      fireEvent.click(screen.getByTestId('play-area'))
    expect(screen.getByRole('main')).toHaveAttribute('data-turn', '0')
    advance(NEXT_DELAY)
    const next = screen.getByRole('button', { name: 'つぎのどうぶつ' })
    for (let i = 0; i < 100; i++) fireEvent.click(next)
    advance(TRANSITION_DURATION)
    expect(screen.getByRole('main')).toHaveAttribute('data-turn', '1')
    expect(screen.getByRole('main')).toHaveAttribute('data-phase', 'hiding')
  })
  it('advances after inactivity and resets that delay while playing', () => {
    render(<App />)
    start()
    advance(REVEAL_DURATION - 200)
    tap()
    advance(REVEAL_DURATION - 200)
    expect(screen.getByRole('main')).toHaveAttribute('data-phase', 'revealed')
    advance(210)
    expect(screen.getByRole('main')).toHaveAttribute('data-phase', 'leaving')
    advance(TRANSITION_DURATION)
    expect(screen.getByRole('main')).toHaveAttribute('data-phase', 'hiding')
  })
  it('keeps the game playable when audio construction fails', () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('Audio unavailable')
        }
      },
    )
    render(<App />)
    start()
    advance(REVEAL_REACTION_DURATION)
    tap()
    expect(screen.getByTestId('animal')).toHaveAttribute('data-reaction', '1')
    advance(NEXT_DELAY)
    fireEvent.click(screen.getByRole('button', { name: 'つぎのどうぶつ' }))
    advance(TRANSITION_DURATION)
    expect(screen.getByRole('main')).toHaveAttribute('data-turn', '1')
  })
  it('can mute before the first play gesture', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '音をオフにする' }))
    expect(
      screen.getByRole('button', { name: '音をオンにする' }),
    ).toHaveAttribute('aria-pressed', 'true')
    start()
    expect(screen.getByTestId('animal')).toBeInTheDocument()
  })
  it('pauses timers in a background tab and resumes safely', () => {
    render(<App />)
    start()
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    })
    fireEvent(document, new Event('visibilitychange'))
    advance(REVEAL_DURATION * 2)
    expect(screen.getByRole('main')).toHaveAttribute('data-phase', 'revealed')
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    })
    fireEvent(document, new Event('visibilitychange'))
    advance(REVEAL_DURATION)
    advance(TRANSITION_DURATION)
    expect(screen.getByRole('main')).toHaveAttribute('data-phase', 'hiding')
  })
  it('renders a local fallback if a downloaded image fails', () => {
    render(<App />)
    fireEvent.error(screen.getByAltText('いぬ'))
    expect(screen.getByAltText('いぬ')).toHaveAttribute('src', '/fallback.svg')
  })
})

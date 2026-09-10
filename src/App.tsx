import { useEffect, useState } from 'react'
import { SoundPlayer } from './audio/SoundPlayer'
import { AnimalPicture } from './components/AnimalPicture'
import { Arrow, Flower, SoundIcon } from './components/Icons'
import { HidingPlace } from './components/HidingPlace'
import { useGame } from './hooks/useGame'
import './styles/app.css'
function App() {
  const [sound] = useState(() => new SoundPlayer())
  const [muted, setMuted] = useState(false)
  const game = useGame(sound)
  const intro = game.phase === 'intro'
  const revealed = game.phase === 'revealed' || game.phase === 'leaving'
  useEffect(() => () => sound.dispose(), [sound])
  const toggleSound = () => {
    const value = !muted
    setMuted(value)
    sound.setMuted(value)
    if (!value) {
      sound.unlock()
      sound.play('tap')
    }
  }
  return (
    <div className={`app ${intro ? 'intro' : 'playing'}`}>
      <header className="header">
        <div className="brand">
          <Flower />
          <span>どうぶつ ばあ！</span>
        </div>
        <button
          className="sound-button"
          type="button"
          onClick={toggleSound}
          aria-label={muted ? '音をオンにする' : '音をオフにする'}
          aria-pressed={muted}
        >
          <SoundIcon muted={muted} />
          <span>おと {muted ? 'OFF' : 'ON'}</span>
        </button>
      </header>
      <main
        className={`main phase-${game.phase}`}
        data-phase={game.phase}
        data-turn={game.turn}
      >
        <div className="heading-area">
          {intro ? (
            <>
              <p className="eyebrow">タッチで あそぶ、はじめての えほん</p>
              <h1>
                どうぶつ{' '}
                <span>
                  ばあ<em>！</em>
                </span>
              </h1>
              <p className="intro-copy">だれが かくれているのかな？</p>
            </>
          ) : (
            <div className="game-heading" aria-live="polite" aria-atomic="true">
              <p className="eyebrow">
                {revealed ? 'ばあ！ みーつけた' : 'だれが いるのかな？'}
              </p>
              <h1>{revealed ? `${game.animal.name}！` : 'いない いな〜い'}</h1>
            </div>
          )}
        </div>
        <div className="scene-wrap">
          <div className="scene-cloud cloud-one" aria-hidden="true" />
          <div className="scene-cloud cloud-two" aria-hidden="true" />
          <span className="scene-sun" aria-hidden="true" />
          <button
            className="scene"
            type="button"
            onClick={game.tap}
            aria-label={
              intro
                ? 'どうぶつとあそぶ'
                : revealed
                  ? `${game.animal.name}をタップ`
                  : 'かくれんぼをタップ'
            }
            aria-disabled={game.phase === 'leaving'}
            data-testid="play-area"
          >
            <span className="ground" aria-hidden="true" />
            {(intro || revealed) && (
              <span
                key={`${game.turn}-${game.reaction}`}
                className={`animal-wrap ${intro ? 'welcome-animal' : `react-${game.animation}`}`}
                data-testid="animal"
                data-animal={game.animal.id}
                data-reaction={game.reaction}
              >
                <AnimalPicture
                  key={game.animal.id}
                  animal={game.animal}
                  priority={intro}
                />
              </span>
            )}
            {!intro && <HidingPlace place={game.hidingPlace} open={revealed} />}
            {intro && (
              <>
                <span className="grass grass-left" aria-hidden="true" />
                <span className="grass grass-right" aria-hidden="true" />
              </>
            )}
            {revealed && (
              <span
                className="sparkles"
                key={`sparkle-${game.turn}-${game.reaction}`}
                aria-hidden="true"
              >
                <Flower />
                <i />
                <Flower />
                <i />
              </span>
            )}
            <Flower className="scene-flower flower-left" />
            <Flower className="scene-flower flower-right" />
          </button>
        </div>
        <div className="action-area">
          {intro ? (
            <>
              <button
                className="primary-button"
                type="button"
                onClick={game.tap}
              >
                あそぼう <Arrow />
              </button>
              <p className="action-hint">ぽんっと さわって、こんにちは。</p>
            </>
          ) : (
            <>
              <p className="touch-hint" aria-hidden="true">
                {revealed ? 'さわると、うれしいね' : 'ぽんっ と さわってね'}
                <span>· · ·</span>
              </p>
              <button
                className={`next-button ${game.ready ? 'is-ready' : ''}`}
                type="button"
                onClick={game.next}
                disabled={!game.ready}
                aria-label="つぎのどうぶつ"
              >
                つぎは だあれ？ <Arrow />
              </button>
            </>
          )}
        </div>
      </main>
      <footer>
        <span className="footer-leaf" aria-hidden="true" />
        {intro
          ? 'おやこで、のんびり。なんどでも。'
          : 'ちいさな「できた」を、なんどでも。'}
      </footer>
    </div>
  )
}
export default App

import { useState } from 'react'
import type { Animal } from '../data/animals'
export function AnimalPicture({
  animal,
  priority = false,
}: {
  animal: Animal
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)
  return (
    <img
      className="animal-image"
      src={failed ? '/fallback.svg' : animal.image}
      alt={animal.name}
      width="600"
      height="600"
      draggable="false"
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onError={() => setFailed(true)}
    />
  )
}

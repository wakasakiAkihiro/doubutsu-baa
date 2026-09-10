import type { HidingPlace as Place } from '../hooks/useGame'
export function HidingPlace({ place, open }: { place: Place; open: boolean }) {
  return (
    <div
      className={`hiding-place hiding-${place} ${open ? 'is-open' : ''}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 460 300" fill="none">
        {place === 'bush' && (
          <>
            <path
              fill="#9eb984"
              d="M49 247C9 213 35 157 85 157c-12-69 56-98 98-60 16-74 103-76 123-6 62-22 98 26 78 68 66-8 93 63 36 91Z"
            />
            <path
              fill="#789b68"
              d="M32 260c-40-62 17-108 62-75 2-67 76-88 112-26 38-67 105-45 111 6 59-23 102 11 94 50 57-11 68 58 25 60H54Z"
            />
            <path
              stroke="#c3d3a6"
              strokeWidth="6"
              strokeLinecap="round"
              d="m88 217 11 12m-3-35 10 7m76 29 3 17m67-51 12 6m80 27 14-8m-28-65 6 10"
            />
          </>
        )}
        {place === 'box' && (
          <>
            <path fill="#deb087" d="m91 136 139-37 141 37-141 39Z" />
            <path fill="#e9be97" d="M91 136v121l139 31V175Z" />
            <path fill="#d79d72" d="M230 175v113l141-31V136Z" />
            <path fill="#f3cfaa" d="m230 175-142-31-34-52 147 21Z" />
            <path fill="#f2c89f" d="m230 175 141-31 35-52-147 21Z" />
            <path
              stroke="#cb936b"
              strokeWidth="5"
              strokeLinecap="round"
              d="m120 213 53 12m-53 3 32 7"
            />
          </>
        )}
        {place === 'cloud' && (
          <>
            <path
              fill="#d5e3df"
              d="M63 263c-67-19-48-101 10-98-24-70 65-120 105-67 30-90 127-66 127 4 53-41 111 2 94 51 71-6 84 93 9 110Z"
            />
            <path
              fill="#f1f3e9"
              d="M60 242c-58-19-44-81 12-78-10-63 64-99 103-43 29-68 107-56 119 7 50-36 105 6 92 43 52-2 62 63 12 71Z"
            />
          </>
        )}
        {place === 'leaf' && (
          <>
            <path
              fill="#94b889"
              d="M220 271C22 259 22 77 62 30c121 7 223 78 158 241Z"
            />
            <path
              fill="#b2c899"
              d="M225 269c-45-170 38-231 179-239 21 116-8 219-179 239Z"
            />
            <path
              stroke="#698f64"
              strokeWidth="7"
              strokeLinecap="round"
              d="M232 282 94 83m29 74 40 6-1-52m66 164L370 76m-72 103 47-7m-48 6 1-52"
            />
          </>
        )}
        {place === 'water' && (
          <>
            <ellipse cx="230" cy="204" rx="209" ry="76" fill="#bddbdb" />
            <path
              fill="#91bfc2"
              d="M36 216c23-39 61 13 92-11 34-27 62 21 94-2 30-22 66 24 101 1 33-22 62 14 99 2-5 89-358 104-386 10Z"
            />
            <path
              stroke="#e0eeea"
              strokeWidth="7"
              strokeLinecap="round"
              d="M77 237h50m61 13h75m56-20h51"
            />
            <path
              fill="#9bb786"
              d="M322 151c-32-34-64-8-44 8 13 11 41 7 44-8Z"
            />
          </>
        )}
      </svg>
      {!open && (
        <span className="peek-marks">
          <i />
          <i />
        </span>
      )}
    </div>
  )
}

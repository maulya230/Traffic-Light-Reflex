# Traffic Light Reflex

A reaction-time game built around a real intersection: wait at the red light, react the instant it turns green, and try not to jump the gun. 5 rounds, graded on average reaction time at the end.

**[Live demo →](#)** *(add your GitHub Pages link here once deployed)*

## Features

- Fully drawn traffic-light intersection scene (road, lane markings, signal pole, car) — all Canvas 2D, no image assets
- Randomized red-light hold time (1.3s–4.3s) per round so you can't anticipate the exact moment
- False-start detection: react before green and the car stalls with a little shake instead of launching
- Ease-in launch animation with a motion trail once you react correctly — faster reaction reads as a punchier launch
- Idle "engine bob" animation while waiting, so the scene never feels static
- Live best/average reaction time in the HUD, updated after every round
- End screen with a reflex grade, from "Lightning reflexes ⚡" down to "maybe let the car behind honk first"

## Tech

- Plain HTML, CSS, and JavaScript — no game engine, no libraries
- 2D Canvas API for the entire scene and animation
- `performance.now()` for millisecond-accurate reaction timing
- Simple eased tweening (quadratic ease-in) for the launch animation, no animation library

## Project structure

```
traffic-light-reflex/
├── index.html   → markup and layout
├── style.css    → theming
└── script.js    → game state machine, rendering, timing, input handling
```

## Running locally

Open `index.html` directly in a browser, or serve the folder:

```bash
npx serve .
```

## How the timing works

- `phase` tracks where the round is: `waiting` (red) → `go` (green, timer starts) → `launching` (reacted correctly) or `fault` (reacted too early).
- Reaction time is `performance.now()` at input minus the timestamp recorded the instant the light switched to green — accurate to sub-millisecond precision, unlike `Date.now()`.
- The launch animation duration is fixed; only the *timing of the reaction* varies, so the grading reflects reflexes, not animation speed.

## Deploying with GitHub Pages

1. Push these three files to a GitHub repo (or upload via **Add file → Upload files**)
2. Go to **Settings → Pages**, set the source to your main branch (root)
3. Your live URL will be `https://<username>.github.io/<repo-name>/`

---

Built by Maulya Shetty.

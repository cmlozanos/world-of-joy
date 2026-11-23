# World of Joy — native refinement handoff

## Changes owned
- `src/world/World.js`, `src/world/Room.js`: baked grass/soil grain, instanced distant ridges, warmer road, wood-grain schoolroom floor and painted window/dado walls (same wall mesh count, no additional room point lights).
- `src/entities/Character.js`, `src/entities/RacingCar.js`: rounder native character silhouette using existing mesh count; paint/chrome racing-car materials, no vehicle physics changes.
- `src/engine/Quality.js`: native day/night background, fog and existing rig adjustment/restoration across all four modes; per-scenario original values retained without compounding intensity on theme toggles.
- `src/engine/ParticleSystem.js`, `src/main.js`, decorative `src/entities/*Manager.js`: motionAllowed stops pickup bob/spin, beacons, wildlife ambience and new particles without disabling character/car physics, collection checks or shooting-star required descent/expiry. Existing collected-item lifecycle still advances.
- `src/engine/ThirdPersonCamera.js`, `src/styles/main.css`: remove alternate diagnostic/CSS font.
- `tools/check-performance.cjs`, `tools/check-browser.cjs`: native theme roundtrip and visible-pickup no-motion regressions, explicit gameplay keyboard focus after isolated shell tests, day/night 1024×768 and 740×360 captures in each mode.

## Checks
`make check` PASS. `node tools/check-performance.cjs` PASS: Character/RacingCar identical physical results at 10/15/20/30/60 FPS, empty-fuel reverse and collision escape retained, 600 fruits/80 bottles/30 gems batching/culling/collection/disposal guards, quality/no-motion/theme roundtrip checks. Prior full browser pass with native theme/materials completed all four modes, explorer mission and all six race rounds, Home/audio/ten-minute gate/offline. Latest expanded day/night screenshot pass also PASS: all four modes, actual explorer mission, all six racing rounds, pauses, native Home, audio and offline gate (terminal Chromium 151 line recorded in `browser.txt`). Captures `<mode-button>-1024/740-light/dark.png` cover native scenes, rooms and racing; schoolroom short-landscape and explorer tablet visually inspected. No 100-round or all-object mission completion claim.

## Scope and integration
Approved bounded native visual pass, 23 November 2026. Work directly in the shared checkout; no commit/push. No shared `family-v2/` or service-worker edits by this worker. Those diff entries belong to Main's propagated kit/cache revision. Pre-existing `.DS_Store` left untouched. No new engines, paid artwork, packages, antialiasing, postprocessing or shadow-map budgets. Existing normal-quality shadows remain optional; default light mode unchanged. Audio OFF on load, saves, unlocked choices, Home and educational lock behavior preserved.

School lettering uses the existing FamilyV2 font, not a substitute. Existing source-generated Canvas/3D text waits on fontReady (Banana now also defers initial Phaser construction). Theme getters have OS/light fallback; motion getters gate decorative animation, not physical movement or mission clocks. Main owns shared-kernel CSS/font/cache exact-copy verification.

## Evidence and limits
`check.txt` and `browser.txt` hold the executed native checks and Chromium 151.0.7922.34 browser results. Screenshots are bounded task evidence in this folder. `browser-first-failures.txt`, where present, preserves early diagnostic failures; it is not the final result. `git diff --check` passed for all four checkouts. No Chromium 95 download or execution; no physical old-tablet CPU/GPU, battery, native OS gestures or exhaustive level playthrough certification. Rendering samples are desktop observations only. No claim of photorealism or exhaustive visual audit.

A green model/build test is not substituted for browser interaction. Tests continue to exercise native inputs, educational pauses, audio, Home and offline reload. No physics tuning was introduced. The bounded pass stops after focused implementation and evidenced fixes rather than extending to every track.

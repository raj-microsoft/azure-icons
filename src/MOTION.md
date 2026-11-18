# Icon motion layer

This is a refinement of the existing material library, not a redesign. The explicit animation brief supersedes DESIGN.md's previous no-artwork-motion direction; original downloaded assets and the settled preview remain unchanged.

## Motion thesis
- **Focal moment:** a selected service builds itself from its own SVG parts in reading order, over 1.2 seconds, then holds. Networking routes; storage stacks; security closes; compute slots; analytics draws; AI connects; integration links; other services assemble. No added shapes, effects, rotations or perpetual loops.
- **Continuity:** comparison uses the same signature and synchronized clock for both styles, with instance-local IDs. Original painting order, transforms, gradients and opacity are preserved.
- **Feedback:** Replay repeats the finite sequence. Grid hover/keyboard focus uses a 400ms shorthand on the image wrapper. Newly visible cards enter once, with a capped stagger.
- **Budget:** Web Animations performs only transform/opacity animation. All geometry reads precede animation writes; the grid never inlines SVGs. Offscreen, hidden, disconnected and modal-obscured cards stop. The explicit Motion preference and the system reduced-motion preference stop all animation immediately.

## Implementation and verification
`motion.ts` owns the sanitizer, category mapping, pure time-to-frame function and finite animations. A normalized critically damped spring is sampled into deterministic keyframes (not a linear tween or bouncy spring). Animations can be paused and scrubbed with the browser's Animation API; at 1200ms every effect is exactly identity. Finishing/cancelling removes the effect, never the artwork's own transforms. Replay resets the same clock; there is no autoplay loop or crossfade.

The SVG sanitizer accepts only inert SVG geometry/resources, turns permitted embedded presentation CSS into inline declarations, removes executable content and external references, and rewrites every ID/local reference. Invalid/empty assets retain their original image and receive the explicitly requested whole-icon fade-up fallback. SVG response caching is bounded to 48 assets.

Run `npm run test:motion` with the built site served on port 4173. This uses headless Microsoft Edge to validate all 643 × 2 assets, sanitizer attack fixtures, final identity, source raster fidelity, eight categories in both styles at two times, comparison IDs, offscreen/once-only grid motion, reduced motion, preferences, responsive layout, keyboard replay and WCAG checks. Captures and the machine report go to `.impeccable/review/motion/`; these verification artifacts are not published. Demo export is an explicit optional `--demo` flag. No originals or variants are changed.

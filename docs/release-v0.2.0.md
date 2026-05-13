# Aperture v0.2.0 Release Notes

## Highlights

- Added README feature gallery with all-English public demo screenshots.
- Added a public demo vault at `docs/demo-vault/` and static mock capture source at `docs/mock-captures/aperture-captures.html` for reproducible screenshots without private note content.
- Added Wiki Skills upgrade positioning: Zettelkasten-style atomic notes, MOCs, candidate workflow, provenance, and agent-readable surfaces.
- Added static showcase page at `docs/showcase/aperture-showcase.html`.
- Added HyperFrames launch video source and rendered MP4 at `docs/hyperframes/aperture-launch/renders/aperture-launch.mp4`.
- Bumped package version to `0.2.0`.

## Verification

- Local Aperture dev server ran successfully with `WIKI_ROOT=/Users/jean/Documents/AI/project/aperture/docs/demo-vault`.
- README screenshots rendered from public mock captures at 1280x720.
- HyperFrames `lint` completed with one maintainability warning about four scene clips in one file.
- HyperFrames `validate --timeout 12000` passed with no console errors and all text passing WCAG AA.
- Rendered MP4 verified as H.264, 1920x1080, 30fps, 18.0 seconds.

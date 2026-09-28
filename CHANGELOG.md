# Changelog

All notable changes to OpenCode Metrics are recorded here. Versions follow
[Semantic Versioning](https://semver.org/).

## Unreleased

### Fixed

- `scripts/ocmetrics` now writes query output inside a private `mktemp -d`
  sandbox (mode 0700) with trap cleanup instead of predictable `/tmp` paths.

### Added

- Root `preview.png`, `assets/` bar and panel screenshots, and an expanded
  README for the marketplace listing.

## 1.0.0 - 2026-09-28

### Added

- Offline Omarchy bar widget showing today's OpenCode spend and tokens.
- Per-session panel with last-14-days chart and by-month totals.
- Configurable refresh interval, cost toggle, and token toggle.
- Read-only local sqlite access; graceful `OC n/a` when the store is absent.

# Roadmap

Prioritized, non-binding. Grouped by horizon. Avoids rewrites; each item is incremental.

## Immediate (days) — low risk, high leverage

> ✅ **All four completed 2026-07-15.** Firefox rebuilt & version aligned to 2.2.7;
> stale v1.3 root files moved to `chrome/legacy/`; CI added
> (`.github/workflows/ci.yml`); zip/apk artifacts untracked + gitignored.
> Retained below for the record.

1. **Wire Firefox build parity & confirm versions.** Verify `firefox/prod/manifest.json`
   version and that `prod/dist` matches `src`. Align Chrome (2.2.7) and Firefox versions
   intentionally. *(Trade-off: none; pure hygiene.)*
2. **Decide the fate of stale root `chrome/` artifacts** (`manifest.json` v1.3,
   `chrome/dist/`, `popup.html`, `styles/`). Move to `chrome/legacy/` or delete.
   *(Trade-off: deleting loses nothing tracked; keeps repo honest.)*
3. **Add a minimal CI** (GitHub Actions): `npm ci && npm run typecheck && npm run build`
   on push, and `flutter analyze && flutter test` for the app. *(Catches the src↔dist
   drift that caused the original confusion.)*
4. **Stop committing `prod*.zip` and the 23 MB `.apk`.** Move release artifacts to
   GitHub Releases; gitignore them. *(Trade-off: history already carries the bloat —
   full cleanup needs history rewrite, deferred to long-term.)*

## Medium-term (weeks)

5. **De-duplicate Chrome/Firefox logic.** Extract the shared core (words list, search
   URL building, scheduling math) into one typed module consumed by both, keeping only
   the `chrome.*`/`browser.*` shim per target. *(Trade-off: introduces a build step /
   light bundler; pays off every time behavior changes — today it must be edited twice.)*
6. **Add a test suite.** Unit-test the pure helpers (`getRandomNumber`, query building,
   `checkLastOpened` date logic) and the mobile `SearchRepositoryImpl` / BLoC with
   `bloc_test`. Target the 80% bar on new/changed code first, not retroactively.
7. **Harden the Bing DOM dependency.** The daily-set selectors are brittle. Add a
   fallback/logging path so a Microsoft markup change fails loudly, not silently.
8. **Fix or formally accept the `parseInt(x) ?? DEFAULT` bug** with a test that pins the
   chosen behavior.

## Long-term (months)

9. **Single source of truth for the words list and settings schema** shared across all
   three clients (generate the Dart and TS from one file).
10. **Repo history cleanup** (remove large binaries via `git filter-repo`) — coordinate,
    since it rewrites history.
11. **Resilience/robustness pass on the mobile app** — notification scheduling, WebView
    error states, background execution limits on modern Android/iOS.
12. **ToS / compliance decision** documented as an ADR (see `architecture.md` risk note).

## Explicitly NOT recommended

- A full rewrite or a heavyweight framework (React/Svelte popup, native mobile). The
  current footprint is appropriate for the problem; complexity would be net-negative.

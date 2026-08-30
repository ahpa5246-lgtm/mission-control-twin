# Submission evidence checklist

## Automated repository gates

- [x] Canonical implementation is documented under `ibm8/`.
- [x] Installation uses the committed npm lockfile.
- [x] Tests, syntax checks, production build, and generated-client verification run in CI.
- [x] Core operation requires no paid API or secret.
- [x] Timeouts, validation, bounded caches, partial/stale states, and browser fallbacks are tested.
- [x] Earth/cloud assets are local and their provenance is documented.
- [x] Unsupported NASA, flight-control, eclipse, AI-provider, and real-time claims are explicitly excluded.
- [x] Team roles, judge quick start, judging guide, and a two-minute script are documented.

## Team-owned items before submission

- [ ] Add the verified HTTPS demo URL to the GitHub About section and submission form.
- [ ] Set a concise GitHub description and useful topics such as `ibm`, `iss`, `space`, `webgl`, `digital-twin`, and `education`.
- [ ] Confirm the exact current portal duration and required fields; keep the video under the portal limit.
- [ ] Record, caption, and watch the final video after export.
- [ ] Verify the hosted site on desktop and a real mobile viewport.
- [ ] Capture genuine IBM Bob and IBM SkillsBuild evidence required by the current challenge.
- [ ] Verify eligibility, team-member names, emails, and consent.
- [ ] Deliberately select and add a repository license if reuse rights are intended. Do not infer a license from public visibility.
- [ ] Review current NASA/ISS branding guidance and avoid endorsement implications.
- [ ] Submit the final form and retain confirmation evidence.

## Final smoke test

Run from a clean checkout using Node.js 20+:

```bash
npm ci
npm test
npm run check
npm run build
npm start
```

Then verify:

- [ ] `/api/health` returns process health without exposing internal errors.
- [ ] The homepage loads with no browser-console error.
- [ ] The globe supports drag, wheel, keyboard, Reset, and Follow ISS.
- [ ] The timestamp and fresh/partial/stale state are legible.
- [ ] Low-power mode persists after refresh.
- [ ] Reduced-motion behavior is acceptable.
- [ ] The Canvas fallback remains understandable when WebGL is unavailable.
- [ ] No API key, secret, local path, private email, or personal data appears in the repository, UI, video, or browser console.

## Truthfulness gate

Do not claim:

- current/live telemetry when the UI labels the packet stale;
- certified navigation or operational flight control;
- full ISS eclipse geometry;
- authoritative crew/location data when optional sources are unavailable;
- NASA imagery or NASA endorsement;
- AI-provider use when the deterministic briefing ran;
- a visible pass that N2YO did not return;
- successful public deployment before opening and testing the final HTTPS URL;
- IBM activity completion without genuine evidence.

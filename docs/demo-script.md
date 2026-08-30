# Three-minute demonstration script

**0:00–0:20 — Problem.** “Public ISS data is fascinating but fragmented. Mission Control Twin turns it into an honest, resilient learning experience for museums, classrooms, and curious explorers.” Show the title and live-link label.

**0:20–0:55 — Orbital view.** Drag the globe and point to the ISS marker and bounded trail. “The backend fetches a real CelesTrak TLE and satellite.js propagates latitude, longitude, altitude, and inertial speed. This is educational orbital modelling, not flight navigation.”

**0:55–1:25 — Explain the state.** Highlight telemetry cards, timestamp, freshness, and the daylight label. “Daylight means daylight at the point beneath the station; it is not a full spacecraft eclipse calculation.” Show crew/location only if present—never rehearse names or places that the live response does not contain.

**1:25–1:50 — Resilience.** Demonstrate a mocked/offline mode or stop outbound access. “Optional crew and location failures preserve the orbit. A core outage keeps the last verified packet and labels it stale. Requests time out and caches are bounded.” Do not deliberately disrupt a shared deployment.

**1:50–2:15 — Narration.** Click **Read briefing**. “No AI key is required. The deterministic briefing uses only normalized fields. Any future AI adapter must obey the checked-in grounding prompt and fall back on timeout, rate limit, or unsupported claims.” Stop speech.

**2:15–2:35 — Visible passes.** Enter valid observer coordinates. Without a key, show the explicit unavailable message. “N2YO is optional; we never ask a visitor for a key and never fabricate a pass.”

**2:35–2:55 — Engineering evidence.** Briefly show tests/CI: fixed TLE fixture, validation edges, timeout cancellation, cache eviction, partial data, stale fallback, and HTTP smoke tests.

**2:55–3:00 — Close.** “Mission Control Twin makes real orbital data legible, grounded, and free to demonstrate—bringing Mission Beyond Earth into learning spaces.”

Human required: capture truthful browser footage, captions, voice-over, competition branding review, IBM SkillsBuild evidence, and final upload/submission.

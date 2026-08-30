# Two-minute demonstration script

One speaker presents on behalf of Mina, Hawraa, Huda, and Worood. Keep the screen recording truthful: describe only values and states visible during the recording.

## 0:00–0:15 — Problem and team

“Public information about the International Space Station is powerful, but it is scattered and difficult for learners to interpret. We are Mina from Mechatronics Engineering Technologies, and Hawraa, Huda, and Worood from Artificial Intelligence. We built Mission Control Twin to turn orbital data into an understandable educational experience.”

Show the title, team names, and the globe.

## 0:15–0:45 — Live orbital view

“The backend obtains ISS orbital elements from CelesTrak and uses orbital propagation to display latitude, longitude, altitude, and inertial speed. The interactive globe shows the station marker and a bounded recent trail.”

Drag the globe once, then use Follow ISS. Do not call a packet live when the interface labels it stale.

## 0:45–1:10 — Honest telemetry

“The interface distinguishes fresh, partial, and stale information instead of inventing missing values. The daylight label describes the point beneath the station; it is not a full spacecraft-eclipse calculation. Optional crew and location sources can fail without losing the core orbit.”

Point briefly to the timestamp, source/quality state, and telemetry cards. Mention crew or location only if displayed.

## 1:10–1:30 — Grounded briefing and accessibility

“The briefing is deterministic and grounded only in the verified telemetry, so the core needs no paid AI key. The experience supports mouse, touch, keyboard controls, reduced motion, low-power mode, and an accessible Canvas fallback when WebGL is unavailable.”

Trigger Read briefing only if speech is appropriate for the recording.

## 1:30–1:48 — Engineering evidence

“Timeouts, validation, bounded caches, stale-state recovery, local assets, and browser fallbacks are covered by automated tests. Every pull request is installed from the committed lockfile, tested, syntax-checked, and rebuilt in GitHub Actions.”

Show the successful CI check or the test summary.

## 1:48–2:00 — Close

“Mission Control Twin makes space data legible, resilient, and free to explore—bringing Mission Beyond Earth into classrooms and learning spaces.”

End on the globe and project title.

## Recording safeguards

- Target **1:50–1:58** so platform encoding never pushes the video beyond two minutes.
- Add English captions and verify names, numbers, and units against the recorded screen.
- Do not claim deployment, IBM coursework, official NASA imagery, full eclipse geometry, authoritative crew data, or optional pass availability unless the evidence is visible and true.
- Replace the duration only if the current submission portal explicitly specifies a different limit.

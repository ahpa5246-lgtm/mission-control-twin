# Visual asset provenance

## Offline Earth and clouds

`earth-fallback.svg` is a deterministic project-authored equirectangular illustration created for this repository on 2026-08-29. It is **not NASA imagery**. Its continent silhouettes are deliberately approximate. `earth-clouds.svg` is a deterministic procedural fractal-noise cloud mask created for this repository on 2026-08-29. Both are available under the repository license.

## Optional NASA Earthdata GIBS imagery

The visualizer accepts an explicitly configured `window.MISSION_EARTH_TEXTURE` only when it is a same-origin `/assets/` path; the production build uses the local fallback and never makes a mandatory third-party request. A future maintainer may download and validate an equirectangular image from the official NASA Earthdata GIBS WMTS service, commit it under `/client/assets/`, and configure that local path.

Research recorded 2026-08-29:

- NASA Earthdata GIBS service capabilities: `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml`
- NASA Worldview/GIBS documentation: `https://nasa-gibs.github.io/gibs-api-docs/`
- NASA media usage guidance: `https://www.nasa.gov/nasa-brand-center/images-and-media/`

NASA content generally is not subject to copyright in the United States, but NASA identifiers, third-party material, people, and commercial use have additional restrictions. NASA does not endorse this project.

## Renderer research

Globe.GL (`vasturiano/globe.gl`, MIT) and its Three.js dependency were evaluated through their official documentation and repository on 2026-08-29. The build environment denied registry and source access (HTTP 403), so no unverifiable package or CDN artifact was introduced. The checked-in renderer remains dependency-free and locally bundled rather than falsely claiming a Globe.GL installation. Upgrade reference: `https://globe.gl/` and `https://github.com/vasturiano/globe.gl`.

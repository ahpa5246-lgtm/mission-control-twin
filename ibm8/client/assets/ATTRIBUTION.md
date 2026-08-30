# Visual asset provenance

## Offline Earth and clouds

`earth-fallback.svg` is an original deterministic equirectangular illustration created for this repository on 2026-08-29. It is **not NASA imagery** and its continent silhouettes are deliberately approximate.

`earth-clouds.svg` is an original deterministic procedural cloud mask created for this repository on 2026-08-29.

The repository currently has no explicit open-source license. These files may be viewed with the public repository, but no separate permission to reuse or redistribute them is asserted until the owner deliberately adds a license. Public visibility alone is not described as a reuse license.

## Optional NASA Earthdata GIBS imagery

The renderer accepts an explicitly configured `window.MISSION_EARTH_TEXTURE` only when it is a same-origin `/assets/` path. The production build uses the local fallback and makes no mandatory third-party texture request.

A future maintainer may download and validate an equirectangular image from an official NASA source, commit it locally, preserve the exact source and retrieval date, and visually verify the mapping before use.

Official references reviewed on 2026-08-29:

- NASA Earthdata GIBS capabilities: `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml`
- NASA Worldview/GIBS documentation: `https://nasa-gibs.github.io/gibs-api-docs/`
- NASA media usage guidance: `https://www.nasa.gov/nasa-brand-center/images-and-media/`

NASA content is often not subject to United States copyright, but NASA identifiers, third-party material, depicted people, and commercial use can carry additional restrictions. NASA does not endorse this project.

## Renderer research

Globe.GL (`vasturiano/globe.gl`, MIT) and Three.js were evaluated through their official documentation and repositories. The build environment denied registry/source access, so no unverifiable package or CDN artifact was introduced. The checked-in renderer is local and dependency-free; the project does not claim a Globe.GL installation.

Upgrade references:

- `https://globe.gl/`
- `https://github.com/vasturiano/globe.gl`

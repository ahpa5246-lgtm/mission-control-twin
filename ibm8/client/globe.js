(function (root) {
  'use strict';

  const MAX_TRAIL = 36;
  const ORBIT_LANES = [
    { inclination: 51.6, phase: 0.16, radius: 1.16, color: 'rgba(107, 231, 255, .94)', label: 'ISS · 51.6°', marker: 'ISS' },
    { inclination: 72, phase: 1.82, radius: 1.22, color: 'rgba(255, 173, 83, .68)', label: 'POLAR REFERENCE', marker: 'POLAR' },
    { inclination: 34, phase: 3.42, radius: 1.28, color: 'rgba(105, 229, 156, .62)', label: 'EQUATORIAL ARC', marker: 'ARC' },
    { inclination: 98.2, phase: .74, radius: 1.31, color: 'rgba(255, 117, 173, .48)', label: null },
    { inclination: 63.4, phase: 4.31, radius: 1.19, color: 'rgba(169, 137, 255, .5)', label: null },
    { inclination: 17, phase: 5.2, radius: 1.25, color: 'rgba(255, 223, 114, .42)', label: null },
    { inclination: 83, phase: 2.65, radius: 1.35, color: 'rgba(105, 210, 255, .43)', label: null },
    { inclination: 43, phase: 5.71, radius: 1.14, color: 'rgba(92, 246, 201, .4)', label: null }
  ];

  function appendBoundedTrail(trail, point, max = MAX_TRAIL) {
    return trail.concat([{ lat: point.lat, lng: point.lng }]).slice(-max);
  }

  function localAsset(url) {
    return typeof url === 'string' && /^\/assets\/[a-z0-9._/-]+$/i.test(url);
  }

  function shader(gl, type, source) {
    const value = gl.createShader(type);
    gl.shaderSource(value, source);
    gl.compileShader(value);
    if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw Error('WebGL shader compilation failed');
    return value;
  }

  function program(gl, vertex, fragment) {
    const value = gl.createProgram();
    gl.attachShader(value, shader(gl, gl.VERTEX_SHADER, vertex));
    gl.attachShader(value, shader(gl, gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(value);
    if (!gl.getProgramParameter(value, gl.LINK_STATUS)) throw Error('WebGL program link failed');
    return value;
  }

  function geometry(segments = 96, rings = 48) {
    const vertices = [], indices = [];
    for (let y = 0; y <= rings; y++) {
      const lat = (y / rings - .5) * Math.PI;
      for (let x = 0; x <= segments; x++) {
        const lon = (x / segments - .5) * Math.PI * 2;
        vertices.push(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon), x / segments, 1 - y / rings);
      }
    }
    for (let y = 0; y < rings; y++) for (let x = 0; x < segments; x++) {
      const a = y * (segments + 1) + x, b = a + segments +1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
  }

  function orbitPoint(inclination, phase) {
    const i = inclination * Math.PI / 180;
    return {
      lat: Math.asin(Math.sin(i) * Math.sin(phase)) * 180 / Math.PI,
      lng: Math.atan2(Math.cos(i) * Math.sin(phase), Math.cos(phase)) * 180 / Math.PI
    };
  }

  function createGlobe({
    canvas, overlay, interaction = canvas, container, marker, fallback,
    textureUrl = '/assets/earth-observatory-v1.png', cloudUrl = '/assets/earth-clouds.svg',
    reducedMotion = false, lowPower = false
  }) {
    if (!canvas || !overlay || !localAsset(textureUrl) || !localAsset(cloudUrl)) throw Error('A local Earth texture is required');
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'high-performance' });
    if (!gl) throw Error('WebGL is unavailable');

    const vs = 'attribute vec3 p;attribute vec2 uv;uniform float yaw;uniform float pitch;uniform float aspect;uniform float scale;varying vec2 vuv;varying vec3 normal;void main(){mat3 ry=mat3(cos(yaw),0.,-sin(yaw),0.,1.,0.,sin(yaw),0.,cos(yaw));mat3 rx=mat3(1.,0.,0.,0.,cos(pitch),sin(pitch),0.,-sin(pitch),cos(pitch));vec3 q=rx*ry*p;normal=q;float depth=1.05-q.z*.11;gl_Position=vec4(q.x*scale/aspect/depth,q.y*scale/depth,q.z*.2,1.);vuv=uv;}';
    const fs = 'precision mediump float;varying vec2 vuv;varying vec3 normal;uniform sampler2D earth;uniform sampler2D clouds;uniform float cloudShift;void main(){vec3 n=normalize(normal);vec3 light=normalize(vec3(-.64,.52,.74));float sun=dot(n,light);float day=smoothstep(-.18,.24,sun);float rim=pow(1.-max(n.z,0.),2.25);vec3 tex=texture2D(earth,vuv).rgb;float ocean=1.-smoothstep(.17,.36,tex.g);float spec=pow(max(dot(reflect(-light,n),vec3(0.,0.,1.)),0.),72.)*ocean;float cloud=texture2D(clouds,vec2(fract(vuv.x+cloudShift),vuv.y)).r*.18;vec3 night=tex*(.018+.06*max(sun+.2,0.))+vec3(.006,.015,.032);vec3 daylit=tex*(.30+.88*max(sun,0.))+vec3(spec*.55)+vec3(cloud);vec3 atmosphere=vec3(.05,.38,.80)*rim*(.12+.42*day);gl_FragColor=vec4(mix(night,daylit,day)+atmosphere,1.);}';
    const prog = program(gl, vs, fs), geo = geometry();
    gl.useProgram(prog);
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, geo.vertices, gl.STATIC_DRAW);
    const stride = 20;
    for (const [name, size, offset] of [['p', 3, 0], ['uv', 2, 12]]) {
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
    }
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([8, 31, 54, 255]));
    const cloudTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, cloudTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

    let yaw = -.42, pitch = .16, scale = .94, trail = [], state = null, drag = false, px = 0, py = 0;
    let raf = 0, animationRaf = 0, visible = !document.hidden, destroyed = false, cloudShift = 0, lastFrame = 0;
    const ctx = overlay.getContext('2d');

    function bindImage(target, image, unit) {
      gl.activeTexture(unit);
      gl.bindTexture(gl.TEXTURE_2D, target);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    const image = new Image();
    image.onload = () => { bindImage(texture, image, gl.TEXTURE0); container.classList.add('webgl-ready'); fallback.hidden = true; render(); };
    image.onerror = () => fail();
    image.src = textureUrl;
    const cloudImage = new Image();
    cloudImage.onload = () => { bindImage(cloudTexture, cloudImage, gl.TEXTURE1); render(); };
    cloudImage.src = cloudUrl;

    function resize() {
      const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      for (const value of [canvas, overlay]) {
        value.width = Math.max(1, Math.floor(rect.width * dpr));
        value.height = Math.max(1, Math.floor(rect.height * dpr));
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      render();
    }

    function rotate(point) {
      const a = point.lng * Math.PI / 180 + yaw, b = point.lat * Math.PI / 180;
      const x = Math.cos(b) * Math.sin(a), y = Math.sin(b), z = Math.cos(b) * Math.cos(a);
      return { x, y: y * Math.cos(pitch) + z * Math.sin(pitch), z: -y * Math.sin(pitch) + z * Math.cos(pitch) };
    }

    function position(point, radial = 1) {
      const q = rotate(point), rect = canvas.getBoundingClientRect(), radius = Math.min(rect.width, rect.height) * scale / 2 * radial;
      return { x: rect.width / 2 + q.x * radius, y: rect.height / 2 - q.y * radius, visible: q.z > 0, z: q.z };
    }

    function strokeOrbit(lane, rect) {
      ctx.save();
      ctx.lineWidth = lane.label === 'ISS · 51.6°' ? 1.7 : 1;
      ctx.strokeStyle = lane.color;
      ctx.setLineDash(lane.label === 'ISS · 51.6°' ? [] : [4, 7]);
      let drawing = false, started = false;
      for (let step = 0; step <= 180; step++) {
        const point = position(orbitPoint(lane.inclination, lane.phase + step / 180 * Math.PI * 2), lane.radius);
        if (point.visible) {
          if (!drawing) { ctx.beginPath(); ctx.moveTo(point.x, point.y); started = true; } else ctx.lineTo(point.x, point.y);
          drawing = true;
        } else if (drawing) { ctx.globalAlpha = .72; ctx.stroke(); drawing = false; }
      }
      if (drawing && started) { ctx.globalAlpha = 1; ctx.stroke(); }
      ctx.setLineDash([]);
      const label = position(orbitPoint(lane.inclination, lane.phase + .78), lane.radius);
      if (lane.label && label.visible && label.x > 10 && label.x < rect.width - 110) {
        ctx.fillStyle = lane.color;
        ctx.font = '600 10px ui-monospace, SFMono-Regular, monospace';
        ctx.fillText(lane.label, label.x + 8, label.y - 8);
      }
      const satellite = position(orbitPoint(lane.inclination, lane.phase + 1.9), lane.radius);
      if (lane.marker && satellite.visible) {
        ctx.fillStyle = lane.color; ctx.shadowColor = lane.color; ctx.shadowBlur = 9;
        ctx.beginPath(); ctx.arc(satellite.x, satellite.y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(232,250,255,.9)';
        ctx.font = '700 8px ui-monospace, SFMono-Regular, monospace'; ctx.fillText(lane.marker, satellite.x + 6, satellite.y - 6);
      }
      ctx.restore();
    }

    function overlayDraw() {
      const rect = overlay.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      ORBIT_LANES.forEach(lane => strokeOrbit(lane, rect));
      const points = trail.map(point => position(point, 1.018)).filter(point => point.visible);
      if (points.length > 1) {
        ctx.strokeStyle = 'rgba(238, 254, 255, .86)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
        ctx.stroke();
      }
      if (state) {
        const point = position(state, 1.02);
        marker.hidden = !point.visible;
        marker.style.left = `${point.x}px`;
        marker.style.top = `${point.y}px`;
        marker.setAttribute('aria-label', `ISS at ${state.lat.toFixed(2)} degrees latitude and ${state.lng.toFixed(2)} degrees longitude`);
      }
    }

    function render() {
      if (destroyed || !visible) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect();
        gl.useProgram(prog);
        gl.uniform1f(gl.getUniformLocation(prog, 'yaw'), yaw);
        gl.uniform1f(gl.getUniformLocation(prog, 'pitch'), pitch);
        gl.uniform1f(gl.getUniformLocation(prog, 'aspect'), rect.width / Math.max(rect.height, 1));
        gl.uniform1f(gl.getUniformLocation(prog, 'scale'), scale);
        gl.uniform1i(gl.getUniformLocation(prog, 'earth'), 0);
        gl.uniform1i(gl.getUniformLocation(prog, 'clouds'), 1);
        gl.uniform1f(gl.getUniformLocation(prog, 'cloudShift'), cloudShift);
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, cloudTexture);
        gl.drawElements(gl.TRIANGLES, geo.indices.length, gl.UNSIGNED_SHORT, 0);
        overlayDraw();
      });
    }

    function fail() { container.classList.remove('webgl-ready'); fallback.hidden = false; marker.hidden = true; }
    function down(event) { drag = true; px = event.clientX; py = event.clientY; interaction.setPointerCapture(event.pointerId); }
    function move(event) { if (!drag) return; yaw += (event.clientX - px) * .008; pitch = Math.max(-.8, Math.min(.8, pitch + (event.clientY - py) * .006)); px = event.clientX; py = event.clientY; render(); }
    function up() { drag = false; }
    function wheel(event) { event.preventDefault(); scale = Math.max(.58, Math.min(1.06, scale - event.deltaY * .0007)); render(); }
    function key(event) {
      const keys = { ArrowLeft: [-.08, 0], ArrowRight: [.08, 0], ArrowUp: [0, -.06], ArrowDown: [0, .06] };
      if (!keys[event.key]) return;
      event.preventDefault(); yaw += keys[event.key][0]; pitch = Math.max(-.8, Math.min(.8, pitch + keys[event.key][1])); render();
    }

    interaction.addEventListener('pointerdown', down);
    interaction.addEventListener('pointermove', move);
    interaction.addEventListener('pointerup', up);
    interaction.addEventListener('wheel', wheel, { passive: false });
    interaction.addEventListener('keydown', key);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const visibilityChange = () => { visible = !document.hidden; if (visible) render(); };
    document.addEventListener('visibilitychange', visibilityChange);
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fail(); });

    function scheduleAnimation() {
      cancelAnimationFrame(animationRaf); animationRaf = 0;
      if (!destroyed && !reducedMotion && !lowPower) animationRaf = requestAnimationFrame(animate);
    }
    function animate(now) {
      if (destroyed || lowPower) return;
      if (visible && !reducedMotion && now - lastFrame > 33) {
        cloudShift = (cloudShift + .00002 * (now - lastFrame || 16)) % 1;
        lastFrame = now; render();
      }
      animationRaf = requestAnimationFrame(animate);
    }

    resize(); scheduleAnimation();
    return {
      setTelemetry(value) { state = { lat: value.latitude, lng: value.longitude }; trail = appendBoundedTrail(trail, state); render(); },
      getTrail: () => trail.slice(),
      setLowPower(enabled) { lowPower = Boolean(enabled); lastFrame = 0; scheduleAnimation(); render(); },
      reset() { yaw = -.42; pitch = .16; scale = .94; render(); },
      follow() { if (state) { yaw = -state.lng * Math.PI / 180; pitch = -state.lat * Math.PI / 180; render(); } },
      destroy() {
        destroyed = true; cancelAnimationFrame(raf); cancelAnimationFrame(animationRaf); observer.disconnect();
        document.removeEventListener('visibilitychange', visibilityChange);
        interaction.removeEventListener('pointerdown', down); interaction.removeEventListener('pointermove', move); interaction.removeEventListener('pointerup', up); interaction.removeEventListener('wheel', wheel); interaction.removeEventListener('keydown', key);
        gl.deleteTexture(texture); gl.deleteTexture(cloudTexture); gl.deleteBuffer(vb); gl.deleteBuffer(ib); gl.deleteProgram(prog);
      },
      render
    };
  }

  const api = { createGlobe, appendBoundedTrail, localAsset, MAX_TRAIL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MissionGlobe = api;
})(typeof window === 'undefined' ? null : window);

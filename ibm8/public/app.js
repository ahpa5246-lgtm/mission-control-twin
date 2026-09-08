(() => {
  const API = (window.MISSION_CONTROL_API_URL || '').replace(/\/$/, '');
  const $ = id => document.getElementById(id);
  const ui = { connection: $('connection'), notice: $('notice'), timestamp: $('timestamp'), narration: $('narration-text'), speak: $('speak') };
  let lastState = null, controller = null, timer = null, speaking = false;
  const trail = [];
  const format = (value, digits = 2) => Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) : 'Unavailable';
  function status(kind, text) { ui.connection.className = `status ${kind}`; ui.connection.innerHTML = `<i></i>${text}`; }
  function render(data) {
    lastState = data; trail.push({ lat: data.latitude, lng: data.longitude }); if (trail.length > 36) trail.shift();
    $('latitude').textContent = format(data.latitude); $('longitude').textContent = format(data.longitude);
    $('altitude').textContent = format(data.altitudeKm, 1); document.querySelectorAll('[data-duplicate="altitude"]').forEach(node => { node.textContent = format(data.altitudeKm, 1); }); $('speed').textContent = format(data.speedKmh, 0);
    $('light').textContent = data.illumination === 'daylight-below' ? 'Daylight' : data.illumination === 'night-below' ? 'Night' : 'Unavailable';
    $('location').textContent = data.location?.name || 'Unavailable'; $('location-type').textContent = data.location?.type || 'optional enrichment';
    ui.timestamp.textContent = new Date(data.timestamp).toLocaleString();
    if (Array.isArray(data.astronauts)) { $('crew-count').textContent = `${data.astronautCount} listed aboard`; $('crew-list').innerHTML = data.astronauts.length ? data.astronauts.map(a => `<li>${escapeHtml(a.name)}</li>`).join('') : '<li>No ISS crew listed by source</li>'; }
    else { $('crew-count').textContent = 'Crew unavailable'; $('crew-list').innerHTML = '<li>Optional crew source did not respond</li>'; }
    if (data.meta.stale) { status('stale', 'LAST KNOWN DATA'); ui.notice.className='notice warn'; ui.notice.textContent=`Live refresh failed. Showing verified telemetry from ${new Date(data.timestamp).toLocaleString()}.`; }
    else if (data.meta.degraded) { status('online', 'PARTIAL LIVE LINK'); ui.notice.className='notice warn'; ui.notice.textContent=`Core orbit is live; optional data unavailable: ${data.meta.partialReasons.join(', ')}.`; }
    else { status('online', 'LIVE LINK'); ui.notice.className='notice'; ui.notice.textContent='Verified orbital telemetry received.'; }
    globe3d?.setTelemetry(data); draw(); narration(data);
  }
  function escapeHtml(text) { const node=document.createElement('span'); node.textContent=text; return node.innerHTML; }
  async function narration(state) { try { const r=await fetch(`${API}/api/narration`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({telemetry:state})}); if(!r.ok) throw Error(); const n=await r.json(); ui.narration.textContent=n.text; ui.speak.disabled=!('speechSynthesis' in window); } catch { ui.narration.textContent='Grounded narration is temporarily unavailable. Telemetry remains active.'; } }
  async function poll() {
    if (controller) return; controller = new AbortController(); status(lastState ? 'stale' : 'loading', lastState ? 'RECONNECTING' : 'ESTABLISHING LINK');
    try { const r=await fetch(`${API}/api/state`,{signal:controller.signal}); if(!r.ok) throw Error(`HTTP ${r.status}`); render(await r.json()); }
    catch { status(lastState?'stale':'error',lastState?'RECONNECTING':'LINK UNAVAILABLE'); ui.notice.className='notice error'; ui.notice.textContent=lastState?`Connection interrupted. Last verified packet remains visible from ${new Date(lastState.timestamp).toLocaleString()}.`:'No verified telemetry is available. The server will retry automatically.'; }
    finally { controller=null; clearTimeout(timer); timer=setTimeout(poll,5000); }
  }
  const canvas=$('globe'), ctx=canvas.getContext && canvas.getContext('2d'); let rotation=0, dragging=false, previous=0, zoom=1, globe3d=null;
  const powerButton=$('power-mode'), initialLowPower=localStorage.getItem('mission-low-power')==='true';
  powerButton.setAttribute('aria-pressed',String(initialLowPower)); powerButton.textContent=initialLowPower?'Low power: on':'Low power';
  try { globe3d=window.MissionGlobe.createGlobe({canvas:$('earth-webgl'),textureUrl:window.MISSION_EARTH_TEXTURE||'/assets/earth-observatory-v2.jpg',overlay:$('orbit-overlay'),interaction:canvas,container:$('globe-wrap'),marker:$('iss-marker'),fallback:$('globe-fallback'),reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,lowPower:initialLowPower}); }
  catch { $('globe-fallback').hidden=false; }
  function project(lat,lng,cx,cy,r){const phi=lat*Math.PI/180,lambda=(lng+rotation)*Math.PI/180;const visible=Math.cos(phi)*Math.cos(lambda)>0;return {x:cx+r*Math.cos(phi)*Math.sin(lambda),y:cy-r*Math.sin(phi),visible};}
  function draw(){
    if(!ctx){$('globe-fallback').hidden=false;return}
    if(globe3d) return;
    const dpr=Math.min(devicePixelRatio||1,2),rect=canvas.getBoundingClientRect();
    canvas.width=Math.max(1,Math.floor(rect.width*dpr));canvas.height=Math.max(1,Math.floor(rect.height*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const w=rect.width,h=rect.height,cx=w/2,cy=h/2,r=Math.min(w,h)*.37*zoom;
    ctx.clearRect(0,0,w,h);
    const atmosphere=ctx.createRadialGradient(cx-r*.28,cy-r*.42,r*.08,cx,cy,r*1.18);
    atmosphere.addColorStop(0,'rgba(54,177,220,.72)');atmosphere.addColorStop(.52,'rgba(12,61,98,.92)');atmosphere.addColorStop(.84,'rgba(4,18,34,.98)');atmosphere.addColorStop(1,'rgba(16,126,176,0)');
    ctx.fillStyle=atmosphere;ctx.beginPath();ctx.arc(cx,cy,r*1.15,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
    const sea=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);sea.addColorStop(0,'#1c6d96');sea.addColorStop(.48,'#0c3c61');sea.addColorStop(1,'#04131f');
    ctx.fillStyle=sea;ctx.fillRect(cx-r,cy-r,r*2,r*2);
    for(let lat=-78;lat<=78;lat+=6){for(let lng=-174;lng<=174;lng+=6){
      const phi=lat*Math.PI/180,lambda=(lng+rotation)*Math.PI/180;
      if(Math.cos(phi)*Math.cos(lambda)<=0) continue;
      const texture=Math.sin(phi*4.7+lambda*2.1)+Math.cos(lambda*3.6-phi*2.4)+Math.sin((phi+lambda)*7);
      const p=project(lat,lng,cx,cy,r),next=project(lat+5.8,lng+5.8,cx,cy,r);
      if(texture>1.18){ctx.fillStyle=texture>1.9?'#9ac69a':'#487f72';ctx.globalAlpha=.28+Math.min(.26,(texture-1.18)*.18);ctx.fillRect(p.x,p.y,Math.max(1,next.x-p.x+1),Math.max(1,Math.abs(next.y-p.y)+1));}
      else if(texture<-1.5&&lat<-50){ctx.fillStyle='#d9f5ff';ctx.globalAlpha=.25;ctx.fillRect(p.x,p.y,3,3);}
    }}
    ctx.globalAlpha=1;ctx.strokeStyle='rgba(147,231,245,.22)';ctx.lineWidth=.75;
    for(let lat=-60;lat<=60;lat+=30){ctx.beginPath();for(let lng=-90;lng<=90;lng+=3){const p=project(lat,lng-rotation,cx,cy,r);lng===-90?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)}ctx.stroke();}
    for(let lng=-60;lng<=60;lng+=30){ctx.beginPath();for(let lat=-86;lat<=86;lat+=3){const p=project(lat,lng-rotation,cx,cy,r);lat===-86?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)}ctx.stroke();}
    ctx.strokeStyle='rgba(95,230,245,.28)';ctx.setLineDash([5,7]);ctx.beginPath();ctx.ellipse(cx,cy,r*1.13,r*.42,-.22,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    trail.forEach((point,i)=>{const p=project(point.lat,point.lng,cx,cy,r);if(p.visible){ctx.fillStyle=`rgba(142,245,255,${.1+(i+1)/Math.max(trail.length,1)*.62})`;ctx.beginPath();ctx.arc(p.x,p.y,1.2+(i/trail.length)*1.4,0,Math.PI*2);ctx.fill();}});
    if(lastState){const p=project(lastState.latitude,lastState.longitude,cx,cy,r);if(p.visible){ctx.fillStyle='#ffffff';ctx.shadowColor='#4de8ff';ctx.shadowBlur=22;ctx.beginPath();ctx.arc(p.x,p.y,5.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#dffaff';ctx.font='700 10px ui-monospace,monospace';ctx.letterSpacing='1px';ctx.fillText('ISS',p.x+13,p.y+4);}}
    ctx.restore();
  }
  canvas.addEventListener('pointerdown',e=>{dragging=true;previous=e.clientX;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(dragging){rotation+=(e.clientX-previous)*.5;previous=e.clientX;draw()}});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.7,Math.min(1.25,zoom-e.deltaY*.001));draw()},{passive:false});addEventListener('resize',draw);
  $('reset-view').addEventListener('click',()=>{if(globe3d)globe3d.reset();else{rotation=0;zoom=1;draw();}});$('follow-iss').addEventListener('click',()=>{if(globe3d)globe3d.follow();else if(lastState){rotation=-lastState.longitude;draw();}});powerButton.addEventListener('click',e=>{const enabled=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(enabled));localStorage.setItem('mission-low-power',String(enabled));e.currentTarget.textContent=enabled?'Low power: on':'Low power';globe3d?.setLowPower(enabled);});
  const telemetryPanel=$('telemetry'),telemetryToggle=$('telemetry-toggle'),telemetryClose=$('telemetry-close');
  function setTelemetryPanel(open){telemetryPanel.classList.toggle('is-open',open);telemetryPanel.setAttribute('aria-hidden',String(!open));telemetryToggle.setAttribute('aria-expanded',String(open));telemetryToggle.innerHTML=open?'CLOSE INSTRUMENTS <span>−</span>':'OPEN INSTRUMENTS <span>+</span>';}
  telemetryToggle.addEventListener('click',()=>setTelemetryPanel(!telemetryPanel.classList.contains('is-open')));
  telemetryClose.addEventListener('click',()=>setTelemetryPanel(false));
  $('refresh').addEventListener('click',()=>{if(controller)controller.abort();controller=null;clearTimeout(timer);poll()});
  ui.speak.addEventListener('click',()=>{if(!('speechSynthesis'in window))return;if(speaking){speechSynthesis.cancel();speaking=false;ui.speak.textContent='▶ Read briefing'}else{const utterance=new SpeechSynthesisUtterance(ui.narration.textContent);utterance.onend=()=>{speaking=false;ui.speak.textContent='▶ Read briefing'};speechSynthesis.speak(utterance);speaking=true;ui.speak.textContent='■ Stop briefing'}});
  $('pass-form').addEventListener('submit',async e=>{e.preventDefault();const data=new FormData(e.currentTarget),out=$('pass-result');out.textContent='Checking…';try{const r=await fetch(`${API}/api/visualpass?lat=${encodeURIComponent(data.get('lat'))}&lng=${encodeURIComponent(data.get('lng'))}`),body=await r.json();if(!r.ok)throw Error(body.error?.message);if(!body.available)out.textContent='Visible-pass lookup is unavailable because the optional N2YO key is not configured.';else if(body.passes.length&&body.passes[0].startUTC)out.textContent=`Next predicted visible pass: ${new Date(body.passes[0].startUTC*1000).toLocaleString()}`;else out.textContent='No valid future visible pass was returned.'}catch(error){out.textContent=error.message||'Visible-pass lookup failed.'}});
  addEventListener('beforeunload',()=>{clearTimeout(timer);controller?.abort();globe3d?.destroy();speechSynthesis?.cancel()});draw();poll();
})();

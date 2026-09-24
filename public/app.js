const $ = id => document.getElementById(id);
let selected = null, busy = false, ready = false, started = 0, poll = null;
async function api(url, data) {
  const response = await fetch(url, data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed');
  return result;
}
function error(message) { $('error').textContent = message; $('error').hidden = !message; }
function controls() {
  $('render').disabled = busy || !ready;
  $('upscale').disabled = busy || !selected || selected.kind !== 'render' || !ready;
  $('cancel').hidden = !busy;
}
function select(panel) {
  selected = panel;
  const img = $('panel-image'); img.src = `/outputs/${panel.id}.png`; img.hidden = false; img.classList.remove('reveal');
  img.onload = () => img.classList.add('reveal');
  $('empty').hidden = true;
  $('frame-label').textContent = panel.kind === 'upscale' ? '4× / FINAL PANEL' : 'MONOCHROME / ORIGINAL';
  $('panel-meta').textContent = `${panel.scene.shot.toUpperCase()} · ${panel.scene.mood.toUpperCase()} · SEED ${panel.scene.seed}`;
  for (const [key, ext] of [['download', 'png'], ['metadata', 'json']]) {
    $(key).href = `/outputs/${panel.id}.${ext}`; $(key).download = `frame-${panel.id}.${ext}`; $(key).classList.remove('disabled'); $(key).setAttribute('aria-disabled', 'false');
  }
  document.querySelectorAll('.thumbnail').forEach(el => el.classList.toggle('selected', el.dataset.id === panel.id));
  controls();
}
async function gallery(preferred) {
  const panels = await api('/api/panels');
  $('panel-count').textContent = `${panels.length} PANEL${panels.length === 1 ? '' : 'S'}`;
  if (!panels.length) return;
  $('panels').replaceChildren();
  panels.forEach((panel, i) => {
    const button = document.createElement('button'); button.className = 'thumbnail'; button.dataset.id = panel.id; button.title = panel.scene.prompt;
    const image = document.createElement('img'); image.src = `/outputs/${panel.id}.png`; image.alt = panel.scene.prompt; image.loading = 'lazy';
    const caption = document.createElement('span'); caption.textContent = `${String(panels.length - i).padStart(2, '0')} / ${panel.scene.shot.toUpperCase()}${panel.kind === 'upscale' ? ' / 4×' : ''}`;
    button.append(image, caption); button.onclick = () => select(panel); $('panels').append(button);
  });
  select(panels.find(p => p.id === preferred || p.id === selected?.id) || panels[0]);
}
function follow(id) {
  busy = true; controls(); $('progress').hidden = false; $('progress').removeAttribute('value');
  started = Date.now();
  async function tick() {
    try {
      const job = await api(`/api/jobs/${id}`);
      $('status').textContent = job.message;
      $('elapsed').textContent = `${Math.floor((Date.now() - started) / 1000)}s`;
      $('logs').textContent = job.logs.join(''); $('logs').scrollTop = $('logs').scrollHeight;
      if (job.totalSteps) $('progress').value = job.step / job.totalSteps * 100;
      if (job.status !== 'running') {
        busy = false; $('progress').hidden = true; controls();
        if (job.status === 'complete') await gallery(job.result.id);
        if (job.status === 'failed') error(job.message);
        return;
      }
      poll = setTimeout(tick, 800);
    } catch (e) { busy = false; $('progress').hidden = true; controls(); error(`Connection lost: ${e.message}. Refresh to reconnect; the render may still be running.`); }
  }
  tick();
}
$('scene-form').onsubmit = async event => {
  event.preventDefault(); if (busy) return;
  busy = true; controls(); error('');
  try {
    const scene = { prompt: $('prompt').value, shot: $('shot').value, mood: $('mood').value, format: $('format').value, steps: Number($('steps').value), seed: Number($('seed').value) };
    try { localStorage.setItem('frame-draft', JSON.stringify(scene)); } catch { /* Rendering also works when browser storage is disabled. */ }
    const job = await api('/api/render', scene); follow(job.id);
  } catch (e) { busy = false; controls(); error(e.message); }
};
$('upscale').onclick = async () => {
  if (!selected || busy) return;
  busy = true; controls(); error('');
  try { follow((await api('/api/upscale', { sourceId: selected.id })).id); }
  catch (e) { busy = false; controls(); error(e.message); }
};
$('cancel').onclick = async () => { try { await api('/api/cancel', {}); } catch (e) { error(e.message); } };
$('prompt').oninput = () => $('count').textContent = `${$('prompt').value.length} / 1500`;
$('example').onclick = () => { $('prompt').value = 'A single minimalist metal stool beside a wooden table with dark sunglasses. Empty concrete room. A shaft of sunlight enters through a tall window.'; $('prompt').oninput(); $('prompt').focus(); };
$('random').onclick = () => { $('seed').value = crypto.getRandomValues(new Uint32Array(1))[0] % 2147483648; };
try { const draft = JSON.parse(localStorage.getItem('frame-draft')); if (draft) for (const key of ['prompt','shot','mood','format','steps','seed']) if (draft[key] !== undefined) $(key).value = draft[key]; } catch {}
$('prompt').oninput();
try {
  const state = await api('/api/status'); ready = state.modelsReady;
  if (!ready) { $('setup').textContent = `FIRST-TIME SETUP\n${state.modelError}\nDownloads total about 2.39 GB. Refresh this page when setup finishes.`; $('setup').hidden = false; }
  await gallery(); controls();
  if (state.active) follow(state.active);
} catch (e) { error(e.message); }

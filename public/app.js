import { buildBoard } from './board.js';
const $ = id => document.getElementById(id);
let selected = null, busy = false, ready = false, upscaleReady = false, started = 0;
let allPanels = [];
const included = new Set();
try { for (const id of JSON.parse(localStorage.getItem('frame-board') || '[]')) if (typeof id === 'string') included.add(id); } catch {}
const briefs = {
  product: { title: 'Product hero — morning light', prompt: 'An amber glass skincare bottle with a plain white label on a cream stone plinth, sage green backdrop, a small eucalyptus branch, morning sunlight from the left', shot:'close', mood:'daylight', format:'square', notes:'Props: amber bottle, cream stone, eucalyptus.\nLight: window camera-left; white bounce card right.\nAction: slow push-in. Leave room above bottle for campaign copy.', steps:28, seed:42 },
  cafe: { title:'Café establishing shot', prompt:'A welcoming small cafe interior, terracotta walls, oak tables, green plants, sunlight through large windows, an empty table in the foreground', shot:'wide', mood:'golden', format:'wide', notes:'Scout: confirm window direction and quiet filming hours.\nProps: two coffee cups on foreground table.\nAction: slow lateral move revealing the seating area.', steps:28, seed:142 },
  outdoor: { title:'Outdoor brand — campsite hero', prompt:'An orange camping tent on a grassy lakeshore, pine trees and distant mountains, still blue water, peaceful early morning, no people', shot:'wide', mood:'daylight', format:'wide', notes:'Scout: safe level ground and lake access.\nProps: tent, backpack, camping cup.\nAction: locked-off wide, then a close detail of tent fabric. Check weather before travel.', steps:28, seed:242 }
};
function draft(scene) {
  for (const key of ['title','prompt','notes','shot','mood','format','steps','seed']) if (scene[key] !== undefined) $(key).value = scene[key];
  if (!$('steps').value) $('steps').value = '28';
  $('prompt').dispatchEvent(new Event('input'));
}
function boardControls() {
  const count = allPanels.filter(p => included.has(p.id)).length;
  $('export-board').disabled = !count;
  $('selection-count').textContent = count ? `${count} SELECTED / IN SELECTION ORDER` : 'SELECT FRAMES BELOW';
  try { localStorage.setItem('frame-board',JSON.stringify([...included])); } catch {}
}
async function api(url, data) {
  const response = await fetch(url, data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed');
  return result;
}
function error(message) { $('error').textContent = message; $('error').hidden = !message; }
function controls() {
  $('render').disabled = busy || !ready;
  $('upscale').disabled = busy || !selected || selected.kind !== 'render' || !upscaleReady;
  $('reuse').disabled = !selected || busy;
  $('cancel').hidden = !busy;
}
function select(panel) {
  selected = panel;
  const img = $('panel-image'); img.src = `/outputs/${panel.id}.png`; img.hidden = false; img.classList.remove('reveal');
  img.onload = () => img.classList.add('reveal');
  $('empty').hidden = true;
  $('frame-label').textContent = panel.kind === 'upscale' ? '4× / UPSCALED' : panel.colorMode === 'natural' ? 'NATURAL COLOR / SDXL' : 'LEGACY / SD 2.1';
  $('shot-summary').hidden = false;
  $('selected-title').textContent = panel.scene.title || 'Untitled shot';
  $('selected-notes').textContent = panel.scene.notes || panel.scene.prompt;
  $('panel-meta').textContent = `${panel.scene.shot.toUpperCase()} · ${panel.scene.mood.toUpperCase()} · SEED ${panel.scene.seed}`;
  for (const [key, ext] of [['download', 'png'], ['metadata', 'json']]) {
    $(key).href = `/outputs/${panel.id}.${ext}`; $(key).download = `frame-${panel.id}.${ext}`; $(key).classList.remove('disabled'); $(key).setAttribute('aria-disabled', 'false');
  }
  document.querySelectorAll('.thumbnail').forEach(el => el.classList.toggle('selected', el.dataset.id === panel.id));
  controls();
}
async function gallery(preferred) {
  const panels = await api('/api/panels'); allPanels = panels;
  $('panel-count').textContent = `${panels.length} PANEL${panels.length === 1 ? '' : 'S'}`;
  boardControls(); if (!panels.length) return;
  $('panels').replaceChildren();
  panels.forEach((panel, i) => {
    const button = document.createElement('button'); button.className = 'thumbnail'; button.dataset.id = panel.id; button.title = panel.scene.prompt;
    const image = document.createElement('img'); image.src = `/outputs/${panel.id}.png`; image.alt = panel.scene.prompt; image.loading = 'lazy';
    const caption = document.createElement('span'); caption.textContent = panel.scene.title || `${String(panels.length - i).padStart(2, '0')} / ${panel.scene.shot.toUpperCase()}`;
    button.append(image, caption); button.onclick = () => select(panel);
    const card = document.createElement('div'); card.className = 'board-card';
    const label = document.createElement('label'); label.className = 'include-control';
    const check = document.createElement('input'); check.type = 'checkbox'; check.checked = included.has(panel.id); check.setAttribute('aria-label',`Include ${panel.scene.title || panel.id} in crew board`);
    check.onchange = () => { if (check.checked) included.add(panel.id); else included.delete(panel.id); boardControls(); };
    label.append(check,document.createTextNode(panel.kind === 'upscale' ? 'Include 4× frame' : 'Include in crew board'));
    card.append(button,label); $('panels').append(card);
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
        if (job.status === 'complete') { included.add(job.result.id); await gallery(job.result.id); }
        if (job.status === 'failed') error(job.message);
        return;
      }
      setTimeout(tick, 800);
    } catch (e) { busy = false; $('progress').hidden = true; controls(); error(`Connection lost: ${e.message}. Refresh to reconnect; the render may still be running.`); }
  }
  tick();
}
$('scene-form').onsubmit = async event => {
  event.preventDefault(); if (busy) return;
  busy = true; controls(); error('');
  try {
    const scene = { title:$('title').value, notes:$('notes').value, prompt: $('prompt').value, shot: $('shot').value, mood: $('mood').value, format: $('format').value, steps: Number($('steps').value), seed: Number($('seed').value) };
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
$('prompt').oninput = () => {
  $('count').textContent = `${$('prompt').value.length} / 1000`;
  $('prompt-hint').textContent = $('prompt').value.split(/\s+/).length > 60 ? 'Long prompts can lose detail. Keep the main subject first; move shoot logistics into Shot notes.' : 'Focus on one subject, its materials, and its setting. Short, concrete descriptions work best.';
};
$('example').onclick = () => { draft(briefs[$('template').value]); $('prompt').focus(); };
$('reuse').onclick = () => { if (selected) { draft(selected.scene); $('prompt').focus(); } };
$('export-board').onclick = async () => {
  $('export-board').disabled = true; error('');
  try {
    const ordered = [...included].map(id=>allPanels.find(p=>p.id===id)).filter(Boolean);
    const panels = [];
    for (const panel of ordered) {
      const response = await fetch(`/outputs/${panel.id}.png`);
      if (!response.ok) throw new Error('A selected frame could not be read. Refresh the page and retry.');
      const blob = await response.blob();
      const imageData = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
      panels.push({...panel,imageData});
    }
    const url = URL.createObjectURL(new Blob([buildBoard($('project').value || 'Shoot plan',panels)],{type:'text/html'}));
    const link = document.createElement('a'); link.href=url; link.download='frame-crew-board.html'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),60000);
  } catch (e) { error(e.message); } finally { boardControls(); }
};
$('project').oninput = () => { try { localStorage.setItem('frame-project',$('project').value); } catch {} };
$('random').onclick = () => { $('seed').value = crypto.getRandomValues(new Uint32Array(1))[0] % 2147483648; };
try { const saved = JSON.parse(localStorage.getItem('frame-draft')); if (saved) draft(saved); $('project').value = localStorage.getItem('frame-project') || 'My next shoot'; } catch {}
$('prompt').oninput();
async function refreshReadiness() {
  const state = await api('/api/status');
  ready = state.modelsReady; upscaleReady = state.upscaleReady;
  $('setup').hidden = ready;
  if (!ready) $('setup').textContent = `MODEL SETUP\n${state.modelError}\nSDXL is 3.94 GB. This page will enable rendering automatically when setup finishes.`;
  $('upscale-setup').hidden = !ready || upscaleReady;
  $('upscale').title = upscaleReady ? 'Enlarge an original frame by 4×' : 'Run npm run setup to install the optional 67 MB upscaler';
  controls();
  if (state.active && !busy) follow(state.active);
}
try { await refreshReadiness(); await gallery(); } catch (e) { error(e.message); }
// Detect completed setup without discarding the user's current shot brief.
setInterval(() => {
  if (!ready || !upscaleReady) refreshReadiness().catch(() => {});
}, 3000);

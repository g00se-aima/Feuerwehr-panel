// Consolidated minimal areas & vehicle definitions (migrated from areas.js & buttons.js)
// These provide the runtime defaults so `spa.js` can run standalone.
if (!window.AREA_TITLES) {
  window.AREA_TITLES = [
    'Sprungretter',
    'Atemschutzgeräte',
    'Fluchthauben',
    'Technikflaschen',
    'Sicherheitstrupptasche',
    'CSA',
    'Messgeräte',
    'Atemschutzmasken',
    'Persoenliche Atemschutzmasken',
    'GWG Geräte'
  ];
}

// Area registry and helpers (from areas.js)
if (!window.areas) window.areas = {};
window.createAllAreas = function(container) {
  window.AREA_TITLES.forEach(title => {
    const areaId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const area = document.createElement('div');
    area.className = 'moveable-area';
    area.dataset.areaId = areaId;
    const h3 = document.createElement('h3');
    h3.textContent = title;
    h3.className = 'area-title';
    area.appendChild(h3);
    window.registerArea(areaId, area);
    if (container) container.appendChild(area);
  });
};

window.registerArea = function(areaId, element) {
  window.areas[areaId] = element;
  if (!element.classList.contains('moveable-area')) element.classList.add('moveable-area');
  element.addEventListener('dragover', function(e) { e.preventDefault(); element.classList.add('area-dragover'); });
  element.addEventListener('dragleave', function(e) { element.classList.remove('area-dragover'); });
  element.addEventListener('drop', function(e) {
    e.preventDefault();
    element.classList.remove('area-dragover');
    const btnId = e.dataTransfer.getData('moveable-btn-id');
    const btn = document.getElementById(btnId);
    if (btn && btn.classList.contains('moveable-btn')) {
      element.appendChild(btn);
      btn.dataset.currentArea = areaId;
    }
  });
};

window.getArea = function(areaId) { return window.areas[areaId] || null; };

window.makeButtonMoveable = function(btn, homeAreaId) {
  btn.classList.add('moveable-btn');
  btn.draggable = true;
  btn.dataset.homeArea = homeAreaId;
  btn.dataset.currentArea = homeAreaId;
  if (!btn.id) btn.id = 'moveable-btn-' + Math.random().toString(36).slice(2,10);
  btn.addEventListener('dragstart', function(e){ e.dataTransfer.setData('moveable-btn-id', btn.id); setTimeout(()=>btn.classList.add('dragging'),0); });
  btn.addEventListener('dragend', function(){ btn.classList.remove('dragging'); });
  // dblclick behavior is intentionally minimal here; spa.js may patch it later
  btn.addEventListener('dblclick', function(){
    const currentArea = btn.dataset.currentArea;
    const home = btn.dataset.homeArea;
    if (currentArea && home && currentArea === home) return;
    if (btn.parentNode) btn.parentNode.removeChild(btn);
  });
};

window.resetAreaButtons = function(areaId) {
  const area = window.getArea(areaId);
  if (!area) return;
  Array.from(area.querySelectorAll('.moveable-btn')).forEach(btn => {
    const home = window.getArea(btn.dataset.homeArea);
    if (home) home.appendChild(btn);
    btn.dataset.currentArea = btn.dataset.homeArea;
  });
};

// ---- Double-Tap Emulation for Mobile Devices ----
// Enables dblclick handlers to work on iPad Safari and other touch devices
// by detecting two taps in quick succession and preventing default zoom behavior.
window.enableDoubleTapEmulation = function(element, callback) {
  if (!element || typeof callback !== 'function') return;
  
  let lastTapTime = 0;
  let lastTapTarget = null;
  const DOUBLE_TAP_THRESHOLD = 300; // milliseconds
  
  const handleTouchEnd = function(e) {
    const currentTime = Date.now();
    const currentTarget = e.target;
    const timeDelta = currentTime - lastTapTime;
    
    // Check if this is a double-tap: same target (or parent), within threshold
    const isSameTarget = currentTarget === lastTapTarget || 
                         (currentTarget && lastTapTarget && currentTarget.contains && currentTarget.contains(lastTapTarget)) ||
                         (lastTapTarget && currentTarget && lastTapTarget.contains && lastTapTarget.contains(currentTarget));
    
    if (isSameTarget && timeDelta < DOUBLE_TAP_THRESHOLD && timeDelta > 0) {
      // Prevent default zoom behavior on double-tap
      e.preventDefault();
      // Call the callback (equivalent to dblclick handler)
      callback.call(element, e);
      // Reset to prevent triple-tap from triggering another double-tap
      lastTapTime = 0;
      lastTapTarget = null;
    } else {
      // Record this tap for potential double-tap detection
      lastTapTime = currentTime;
      lastTapTarget = currentTarget;
    }
  };
  
  // Use passive: false to allow preventDefault
  element.addEventListener('touchend', handleTouchEnd, { passive: false });
};

// Minimal vehicle list and assignment buttons (from buttons.js)
if (!window.VEHICLE_LIST) {
  window.VEHICLE_LIST = [
    ['1 DLK23 1', '1-dlk23-1.html'],
    ['1 HLF20 1', '1-hlf20-1.html'],
    ['1 HLF20 2', '1-hlf20-2.html'],
    ['1 HLF20 3', '1-hlf20-3.html'],
    ['1 TLF4000 1', '1-tlf4000-1.html'],
    ['2 LF10 1', '2-lf10-1.html'],
    ['2 RW 1', '2-rw-1.html'],
    ['3 HLF20 1', '3-hlf20-1.html'],
    ['3 LfKat20', '3-lfkat20.html'],
    ['4 LF10 1', '4-lf10-1.html'],
    ['4 TLF3000 1', '4-tlf3000-1.html'],
    ['5 HLF20 1', '5-hlf20-1.html'],
    ['GWG', 'gwg.html']
  ];
}

function getEl(container) { return typeof container === 'string' ? document.querySelector(container) : container; }

window.getSelectedVehicles = function(container) {
  const el = getEl(container); if (!el) return [];
  return Array.from(el.querySelectorAll('button.vehicle-btn')).filter(b=>b.dataset.selected==='true').map(b=>({ title: b.textContent, file: b.dataset.file }));
};

window.clearVehicleSelection = function(container) { const el = getEl(container); if (!el) return; el.querySelectorAll('button.vehicle-btn').forEach(b=>{ b.dataset.selected='false'; b.style.outline=''; b.style.background=''; }); };

function makeSelectableBtn(title, file, onToggle) {
  const btn = document.createElement('button'); btn.textContent = title; btn.className='btn btn-black vehicle-btn'; btn.dataset.file = file; btn.dataset.selected='false';
  btn.addEventListener('click', ()=>{
    const sel = btn.dataset.selected === 'true'; btn.dataset.selected = String(!sel);
    if (!sel) { btn.style.outline='3px solid #2ecc71'; btn.style.background='#1f1f1f'; } else { btn.style.outline=''; btn.style.background=''; }
    if (typeof onToggle === 'function') { const list = window.getSelectedVehicles(btn.closest('.page-buttons')||btn.parentNode); onToggle(list); }
  });
  return btn;
}

window.renderSelectableVehicleButtons = function(container, opts) { const el = getEl(container); if (!el) return; const onToggle = opts && opts.onToggle; el.innerHTML=''; window.VEHICLE_LIST.forEach(([title,file])=>{ el.appendChild(makeSelectableBtn(title,file,onToggle)); }); };

window.callSelectedVehicles = function(container) { const vehicles = window.getSelectedVehicles(container); const payload = { when: Date.now(), vehicles }; try{ localStorage.setItem('called_vehicles', JSON.stringify(payload)); }catch(e){} document.dispatchEvent(new CustomEvent('vehicles:called',{ detail: payload })); return vehicles; };

// Assignment destinations helper
const STATIC_DESTINATIONS = ['AGW','Für Silschede','Von Silschede','TLF Azubi','Lager Hauptwache','Klutertbad','GWG'];
function getAssignmentDestinations() { const vehicleTitles = (window.VEHICLE_LIST||[]).map(v=>v[0]); const seen=new Set(); return [...STATIC_DESTINATIONS, ...vehicleTitles].filter(t=>{ if(seen.has(t)) return false; seen.add(t); return true; }); }

if (!window.AREA_ASSIGNMENT_BUTTONS) {
  window.AREA_ASSIGNMENT_BUTTONS = [
    'Sprungretter',
    'Atemschutzgeräte',
    'Fluchthauben',
    'Technikflaschen',
    'Sicherheitstrupptasche',
    'CSA',
    'Messgeräte',
    'Atemschutzmasken',
    'GWG Geräte'
  ];
}

// Initialize globals needed by SPA if not already provided by other scripts
(function initSpaGlobals() {
  try {
    if (!window.ASSIGNMENT_DESTINATIONS) {
      const staticDestinations = [
        'AGW',
        'Für Silschede',
        'Von Silschede',
        'TLF Azubi',
        'Lager Hauptwache',
        'Klutertbad',
        'GWG'
      ];
      const vehicleNames = Array.isArray(window.VEHICLE_LIST)
        ? window.VEHICLE_LIST.map(([title]) => title)
        : [];
      window.ASSIGNMENT_DESTINATIONS = staticDestinations.concat(vehicleNames);
    }
    // Prepare a map for custom vehicles (label -> file slug.html)
    if (!window.CUSTOM_VEHICLE_MAP) {
      window.CUSTOM_VEHICLE_MAP = {};
    }
    // Ensure static non-vehicle pages that should accept assignments are mapped
    if (!window.CUSTOM_VEHICLE_MAP['Klutertbad']) {
      window.CUSTOM_VEHICLE_MAP['Klutertbad'] = 'klutertbad.html';
    } 
    // Map TLF Azubi explicitly so assignments target its page
    window.CUSTOM_VEHICLE_MAP['TLF Azubi'] = 'tlf-azubi.html';
    // Ensure Lager AGW appears as a destination and maps to its SPA page
    const dests = (window.ASSIGNMENT_DESTINATIONS = window.ASSIGNMENT_DESTINATIONS || []);
    if (!dests.includes('Lager AGW')) dests.push('Lager AGW');
    window.CUSTOM_VEHICLE_MAP['Lager AGW'] = 'lager-hauptwache-container.html';
    // Allow direct assignment to Silschede areas
    if (!dests.includes('Silschede')) dests.push('Silschede');
    window.CUSTOM_VEHICLE_MAP['Silschede'] = 'silschede.html';
    window.CUSTOM_VEHICLE_MAP['Für Silschede'] = 'fuer-silschede.html';
    window.CUSTOM_VEHICLE_MAP['Von Silschede'] = 'von-silschede.html';
  } catch (e) {
    // Non-fatal; sidebar will just show static items or none if something goes wrong
  }
})();

// Allow SPA to opt-out of specific built-in areas without editing areas.js.
// The project owner asked to avoid editing areas.js directly, so remove
// the 'GWG Geräte' area at runtime by filtering AREA_TITLES here.
(function removeGwgAreaAtRuntime() {
  try {
    if (Array.isArray(window.AREA_TITLES)) {
      window.AREA_TITLES = window.AREA_TITLES.filter(function(t) {
        if (!t) return false;
        const s = String(t).trim().toLowerCase();
        return s !== 'gwg geräte' && s !== 'gwg';
      });
    }
  } catch (e) { /* non-fatal */ }
})();

// ---- Simple 60-min authentication gate (password + name) ----
const AUTH_UNTIL_KEY = 'auth_until_ms';
const AUTH_NAME_KEY = 'auth_user_name';
const AUTH_LOG_KEY = 'auth_login_log_v1';

// Monkey-patch makeButtonMoveable to intercept double-clicks in capture phase
// This prevents the original dblclick handler (which unassigns buttons) from
// running when a user double-clicks a button while it is still in its home area.
// Also adds double-tap emulation for mobile devices.
if (typeof window.makeButtonMoveable === 'function') {
  const _origMakeButtonMoveable = window.makeButtonMoveable;
  window.makeButtonMoveable = function(btn, homeAreaId) {
    try {
      const captureHandler = function(e) {
        try {
          // Determine current area from dataset or parent
          const currentArea = btn.dataset && btn.dataset.currentArea ? btn.dataset.currentArea : (btn.parentNode && btn.parentNode.dataset ? btn.parentNode.dataset.areaId : null);
          const home = homeAreaId || (btn.dataset && btn.dataset.homeArea) || null;
          if (currentArea && home && String(currentArea) === String(home)) {
            // Prevent the default unassigning dblclick handler in areas.js from running
            e.stopImmediatePropagation();
            e.preventDefault();
            return;
          }
        } catch (_) {}
      };
      // Add as capturing listener so it runs before bubble listeners added by original
      btn.addEventListener('dblclick', captureHandler, true);
      
      // Enable double-tap emulation for mobile devices
      if (typeof window.enableDoubleTapEmulation === 'function') {
        window.enableDoubleTapEmulation(btn, captureHandler);
      }
    } catch (_) {}
    // Call original implementation to wire drag/drop and other behavior
    try { _origMakeButtonMoveable(btn, homeAreaId); } catch (err) { /* fallback */ }
  };
}

function isAuthValid() {
  try {
    const t = parseInt(localStorage.getItem(AUTH_UNTIL_KEY) || '0', 10);
    return Number.isFinite(t) && Date.now() < t;
  } catch (_) { return false; }
}

function setAuthSession(name, minutes = 60) {
  const until = Date.now() + minutes * 60 * 1000;
  try {
    localStorage.setItem(AUTH_UNTIL_KEY, String(until));
    localStorage.setItem(AUTH_NAME_KEY, String(name || ''));
  } catch (_) {}
}

function getLoginLog() {
  try {
    const arr = JSON.parse(localStorage.getItem(AUTH_LOG_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (_) { return []; }
}
function saveLoginLog(list) {
  try { localStorage.setItem(AUTH_LOG_KEY, JSON.stringify(list || [])); } catch (_) {}
}
function addLoginLog(name) {
  const list = getLoginLog();
  list.unshift({ name: String(name || ''), timeMs: Date.now() });
  while (list.length > 5) list.pop();
  saveLoginLog(list);
}

function renderLoginLogWidget() {
  let w = document.getElementById('login-log-widget');
  if (!w) {
    w = document.createElement('div');
    w.id = 'login-log-widget';
    w.style.position = 'fixed';
    w.style.left = '10px';
    w.style.bottom = '10px';
    w.style.background = 'rgba(255,255,255,0.95)';
    w.style.border = '1px solid #e9e9e9';
    w.style.borderRadius = '10px';
    w.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
    w.style.padding = '8px 10px';
    w.style.fontSize = '12px';
    w.style.lineHeight = '1.3';
    w.style.color = '#222';
    w.style.zIndex = '60';
    w.style.maxWidth = '280px';
    document.body.appendChild(w);
  }
  const list = getLoginLog();
  const header = '<div style="font-weight:700;margin-bottom:4px">Letzte Logins</div>';
  if (!list.length) {
    w.innerHTML = header + '<div class="meta-muted">–</div>';
    return;
  }
  const rows = list.map(item => {
    const d = new Date(item.timeMs || item.time || 0);
    const dateStr = isNaN(d.getTime()) ? '' : d.toLocaleDateString('de-DE');
    const timeStr = isNaN(d.getTime()) ? '' : d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const nm = (item.name || '').trim() || '—';
    return `<div>• ${dateStr} ${timeStr} — ${nm}</div>`;
  }).join('');
  w.innerHTML = header + rows;
}

function showAuthModal(onSuccess) {
  // Reuse if already visible
  let overlay = document.getElementById('auth-overlay');
  if (overlay) { overlay.remove(); }
  overlay = document.createElement('div');
  overlay.id = 'auth-overlay';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.45)';
  overlay.style.zIndex = '2000';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';

  const card = document.createElement('div');
  card.style.background = '#fff';
  card.style.borderRadius = '12px';
  card.style.boxShadow = '0 16px 40px rgba(0,0,0,0.25)';
  card.style.width = 'min(420px, 92vw)';
  card.style.padding = '18px';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '12px';

  const title = document.createElement('div');
  title.textContent = 'Zugang erforderlich';
  title.style.fontWeight = '800';
  title.style.fontSize = '1.2rem';
  card.appendChild(title);

  const stageInfo = document.createElement('div');
  stageInfo.className = 'meta-muted';
  stageInfo.textContent = 'Bitte Passwort eingeben.';
  card.appendChild(stageInfo);

  const pwWrap = document.createElement('div');
  const pwInput = document.createElement('input');
  pwInput.type = 'password';
  pwInput.placeholder = 'Passwort';
  pwInput.className = 'search-input';
  pwInput.style.width = '100%';
  pwInput.style.color = '#000';
  pwInput.style.background = '#fff';
  pwInput.style.border = '1px solid #ccc';
  pwInput.style.padding = '8px 10px';
  pwInput.style.borderRadius = '8px';
  pwInput.autocomplete = 'off';
  pwWrap.appendChild(pwInput);
  card.appendChild(pwWrap);

  const nameWrap = document.createElement('div');
  nameWrap.style.display = 'none';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Name (Pflichtfeld)';
  nameInput.className = 'search-input';
  nameInput.style.width = '100%';
  nameInput.style.color = '#000';
  nameInput.style.background = '#fff';
  nameInput.style.border = '1px solid #ccc';
  nameInput.style.padding = '8px 10px';
  nameInput.style.borderRadius = '8px';
  nameInput.autocomplete = 'off';
  nameWrap.appendChild(nameInput);
  card.appendChild(nameWrap);

  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = '8px';
  row.style.justifyContent = 'flex-end';
  const cancel = document.createElement('button');
  cancel.className = 'btn btn-grey';
  cancel.textContent = 'Abbrechen';
  cancel.onclick = () => { document.body.removeChild(overlay); };
  const next = document.createElement('button');
  next.className = 'btn btn-black';
  next.textContent = 'Weiter';
  row.appendChild(cancel);
  row.appendChild(next);
  card.appendChild(row);

  function toNameStage() {
    stageInfo.textContent = 'Bitte Namen eingeben (Pflichtfeld).';
    pwWrap.style.display = 'none';
    nameWrap.style.display = 'block';
    next.textContent = 'Bestätigen';
    setTimeout(() => nameInput.focus(), 0);
  }

  next.addEventListener('click', () => {
    if (pwWrap.style.display !== 'none') {
      const val = (pwInput.value || '').trim();
      if (val !== 'atemsch') {
        alert('Falsches Passwort.');
        pwInput.focus();
        return;
      }
      toNameStage();
      return;
    }
    const nm = (nameInput.value || '').trim();
    if (!nm) { alert('Bitte Name eingeben.'); nameInput.focus(); return; }
    setAuthSession(nm, 60);
    addLoginLog(nm);
    try { document.body.removeChild(overlay); } catch (_) {}
    renderLoginLogWidget();
    if (typeof onSuccess === 'function') onSuccess();
  });

  pwInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') next.click(); });
  nameInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') next.click(); });

  overlay.appendChild(card);
  document.body.appendChild(overlay);
  setTimeout(() => pwInput.focus(), 0);
}

function requireAuthThen(onSuccess) {
  if (isAuthValid()) { if (typeof onSuccess === 'function') onSuccess(); return; }
  showAuthModal(onSuccess);
}

// ---- Custom Vehicles: helpers and registration ----
// Pages that show vehicle button groups
const VEHICLE_GROUP_PAGES = [
  'hauptwache',
  'loeschzug-milspe',
  'loeschgruppe-voerde',
  'loeschgruppe-oberbauer',
  'loeschgruppe-rueggeberg',
  'loeschgruppe-kuelchen'
];

function slugFromLabel(label) {
  return String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureUniqueSlug(base) {
  let slug = base;
  let n = 2;
  while (window.pages[slug]) {
    slug = base + '-' + n;
    n++;
  }
  return slug;
}

function getCustomVehiclesForGroup(groupKey) {
  try {
    const arr = JSON.parse(localStorage.getItem('custom_vehicles_' + groupKey) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}
// --- Backup export / import helpers ---
function collectBackupData() {
  const out = { createdAt: Date.now(), origin: window.location.origin || null, localStorage: {} };
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try { out.localStorage[key] = localStorage.getItem(key); } catch (_) { out.localStorage[key] = null; }
    }
  } catch (_) {}
  return out;
}

async function downloadBlobAsFile(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('download failed', e);
    alert('Download failed: ' + (e && e.message));
  }
}

async function exportBackup() {
  const data = collectBackupData();
  const content = JSON.stringify(data, null, 2);
  const filename = `FireDeptApp-backup-${(new Date()).toISOString().replace(/[:.]/g,'-')}.json`;
  // Prefer showSaveFilePicker when available
  try {
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      alert('Backup saved.');
      return;
    }
    // Fallback: showDirectoryPicker then write file (Chrome-based)
    if (window.showDirectoryPicker) {
      const dir = await window.showDirectoryPicker();
      const fh = await dir.getFileHandle(filename, { create: true });
      const writable = await fh.createWritable();
      await writable.write(content);
      await writable.close();
      alert('Backup saved to selected folder.');
      return;
    }
  } catch (err) {
    // user cancelled or API not permitted; fall through to download
    console.warn('File System Access API not used or cancelled', err);
  }
  // Last-resort: trigger download
  const blob = new Blob([content], { type: 'application/json' });
  await downloadBlobAsFile(blob, filename);
}

function restoreBackupFromObject(obj) {
  if (!obj || typeof obj !== 'object' || !obj.localStorage) {
    alert('Ungültiges Backup-Format.');
    return;
  }
  try {
    // Overwrite existing keys where present
    Object.keys(obj.localStorage).forEach(k => {
      try { localStorage.setItem(k, obj.localStorage[k]); } catch (_) {}
    });
    alert('Backup wiederhergestellt. Seite wird neu geladen.');
    setTimeout(() => location.reload(), 300);
  } catch (e) {
    console.error('restore failed', e);
    alert('Wiederherstellung fehlgeschlagen: ' + (e && e.message));
  }
}


function saveCustomVehiclesForGroup(groupKey, list) {
  try { localStorage.setItem('custom_vehicles_' + groupKey, JSON.stringify(list || [])); } catch (_) {}
}

function getHiddenVehiclesForGroup(groupKey) {
  try {
    const arr = JSON.parse(localStorage.getItem('hidden_vehicles_' + groupKey) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function saveHiddenVehiclesForGroup(groupKey, list) {
  try { localStorage.setItem('hidden_vehicles_' + groupKey, JSON.stringify(list || [])); } catch (_) {}
}

function registerCustomVehiclePage(vehicle) {
  if (!vehicle || !vehicle.slug) return;
  if (!window.pages[vehicle.slug]) {
    window.pages[vehicle.slug] = {
      title: vehicle.label || vehicle.slug,
      content: `<div id="areas-container" class="card" style="margin-top:80px;"></div>`
    };
  }
  // Add to sidebar destinations if not present
  if (vehicle.label) {
    const list = (window.ASSIGNMENT_DESTINATIONS = window.ASSIGNMENT_DESTINATIONS || []);
    if (!list.includes(vehicle.label)) list.push(vehicle.label);
    // Map label -> file for sidebar assignment
    window.CUSTOM_VEHICLE_MAP = window.CUSTOM_VEHICLE_MAP || {};
    window.CUSTOM_VEHICLE_MAP[vehicle.label] = vehicle.slug + '.html';
  }
}

function addCustomVehicleToGroup(groupKey, label) {
  const base = slugFromLabel(label);
  if (!base) return null;
  const slug = ensureUniqueSlug(base);
  const list = getCustomVehiclesForGroup(groupKey);
  const entry = { label, slug };
  list.push(entry);
  saveCustomVehiclesForGroup(groupKey, list);
  registerCustomVehiclePage(entry);
  return entry;
}

function renderCustomVehicleButtons(containerId, groupKey) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const items = getCustomVehiclesForGroup(groupKey);
  const hidden = new Set(getHiddenVehiclesForGroup(groupKey));
  items.forEach(({ label, slug }) => {
    if (hidden.has(label)) return; // skip hidden labels
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = 'btn btn-black vehicle-btn';
    btn.dataset.type = 'custom';
    btn.dataset.slug = slug;
    btn.addEventListener('click', () => navigate(slug));
    container.appendChild(btn);
  });
}

function injectAddVehicleButton(containerId, groupKey) {
  const container = document.getElementById(containerId);
  if (!container) return;
  // Wrapper row below existing buttons
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.justifyContent = 'center';
  wrap.style.gap = '10px';
  wrap.style.marginTop = '14px';
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-purple';
  addBtn.textContent = 'Fahrzeug hinzufügen';
  addBtn.title = 'Neues Fahrzeug für diese Seite hinzufügen';
  addBtn.addEventListener('click', () => {
    const input = prompt('Name des Fahrzeugs (z.B. "6 HLF20 1")');
    if (!input) return;
    const entry = addCustomVehicleToGroup(groupKey, input.trim());
    if (entry) {
      // Re-render this page so the new button appears
      renderPage(groupKey);
    }
  });
  // Delete button
  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-red';
  delBtn.textContent = 'Fahrzeug löschen';
  delBtn.title = 'Fahrzeug von dieser Seite entfernen';
  delBtn.addEventListener('click', () => {
    showDeleteVehicleModal(containerId, groupKey);
  });
  wrap.appendChild(addBtn);
  wrap.appendChild(delBtn);
  // Insert after container
  container.parentNode.insertBefore(wrap, container.nextSibling);
}

function enhanceVehicleSection(containerId, groupKey) {
  // Remove statically-rendered vehicles that are hidden for this group
  applyHiddenFilter(containerId, groupKey);
  // Then render custom vehicles (also respects hidden)
  renderCustomVehicleButtons(containerId, groupKey);
  injectAddVehicleButton(containerId, groupKey);
}

function applyHiddenFilter(containerId, groupKey) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const hidden = new Set(getHiddenVehiclesForGroup(groupKey));
  container.querySelectorAll('button.vehicle-btn').forEach(btn => {
    const label = (btn.textContent || '').trim();
    if (hidden.has(label)) {
      btn.remove();
    }
  });
}

function showDeleteVehicleModal(containerId, groupKey) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const buttons = Array.from(container.querySelectorAll('button.vehicle-btn'));
  if (buttons.length === 0) return;

  // Overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.4)';
  overlay.style.zIndex = '1000';
  overlay.addEventListener('click', (e) => { if (e.target === overlay) document.body.removeChild(overlay); });

  // Modal
  const modal = document.createElement('div');
  modal.style.position = 'absolute';
  modal.style.left = '50%';
  modal.style.top = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.background = '#fff';
  modal.style.borderRadius = '12px';
  modal.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
  modal.style.width = 'min(520px, 92vw)';
  modal.style.maxHeight = '70vh';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.padding = '16px';

  const title = document.createElement('div');
  title.textContent = 'Fahrzeug auf dieser Seite löschen';
  title.style.fontWeight = '700';
  title.style.fontSize = '1.1rem';
  title.style.marginBottom = '10px';
  modal.appendChild(title);

  const listWrap = document.createElement('div');
  listWrap.style.overflow = 'auto';
  listWrap.style.padding = '6px 0';
  listWrap.style.flex = '1';
  listWrap.style.display = 'grid';
  listWrap.style.gridTemplateColumns = '1fr';
  listWrap.style.gap = '8px';

  // Build list of vehicle labels present on this page only
  const labels = buttons.map(b => (b.textContent || '').trim());
  labels.forEach(label => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.border = '1px solid #eee';
    row.style.borderRadius = '8px';
    row.style.padding = '8px 10px';
    const span = document.createElement('span');
    span.textContent = label;
    const del = document.createElement('button');
    del.className = 'btn btn-red';
    del.textContent = 'Entfernen';
    del.addEventListener('click', () => {
      const pw = prompt('Passwort eingeben, um zu löschen:');
      if (pw !== 'atemsch') {
        alert('Falsches Passwort.');
        return;
      }
      handleDeleteVehicle(groupKey, label);
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
    });
    row.appendChild(span);
    row.appendChild(del);
    listWrap.appendChild(row);
  });
  modal.appendChild(listWrap);

  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.justifyContent = 'flex-end';
  footer.style.gap = '8px';
  footer.style.marginTop = '10px';
  const cancel = document.createElement('button');
  cancel.className = 'btn btn-grey';
  cancel.textContent = 'Abbrechen';
  cancel.addEventListener('click', () => document.body.removeChild(overlay));
  footer.appendChild(cancel);
  modal.appendChild(footer);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function handleDeleteVehicle(groupKey, label) {
  // Try to remove from custom vehicles in this group first
  let list = getCustomVehiclesForGroup(groupKey);
  const idx = list.findIndex(v => v.label === label);
  if (idx !== -1) {
    list.splice(idx, 1);
    saveCustomVehiclesForGroup(groupKey, list);
  } else {
    // Otherwise hide a static vehicle button by label for this group
    const hidden = getHiddenVehiclesForGroup(groupKey);
    if (!hidden.includes(label)) {
      hidden.push(label);
      saveHiddenVehiclesForGroup(groupKey, hidden);
    }
  }
  // Re-render the page to reflect removal
  renderPage(groupKey);
}

// --- Render Hauptwache Page ---
function renderHauptwachePage() {
  const main = document.getElementById('app-main');
  main.innerHTML = `
      <div class="card" style="margin-top:80px;">
      <div id="vehicle-btns-haupt" class="page-buttons">
        <button class="btn btn-black vehicle-btn" onclick="navigate('1-hlf20-1')">1 HLF20 1</button>
        <button class="btn btn-black vehicle-btn" onclick="navigate('1-hlf20-3')">1 HLF20 3</button>
        <button class="btn btn-black vehicle-btn" onclick="navigate('1-dlk23-1')">1 DLK23 1</button>
        <button class="btn btn-black vehicle-btn" onclick="navigate('1-tlf4000-1')">1 TLF4000 1</button>
        <!-- Add more here if needed -->
        <!-- <button class=\"btn btn-black vehicle-btn\" onclick=\"navigate('tlf-azubi')\">TLF Azubi</button> -->
      </div>
    </div>
    <div id="areas-container" class="card" style="margin-top:18px;"></div>
  `;
  // Ensure a fallback button for TLF Azubi is present if a mapping exists but
  // the custom-vehicles list was not created/registered. This preserves the
  // user's previously added TLF Azubi even if localStorage entries were lost
  // or the registration step ran earlier than page rendering.
  try {
    const container = document.getElementById('vehicle-btns-haupt');
    const customs = getCustomVehiclesForGroup('hauptwache');
    const hasCustom = customs.some(cv => String(cv.label || '').trim().toLowerCase() === 'tlf azubi');
    if (!hasCustom && window.CUSTOM_VEHICLE_MAP && window.CUSTOM_VEHICLE_MAP['TLF Azubi']) {
      // create a simple button that navigates to the mapped page file
      const mapped = String(window.CUSTOM_VEHICLE_MAP['TLF Azubi'] || '').replace(/\.html$/i, '');
      // Avoid duplicating if a static button already exists
      const existsStatic = Array.from(document.querySelectorAll('#vehicle-btns-haupt button.vehicle-btn')).some(b => (b.textContent||'').trim() === 'TLF Azubi');
      if (!existsStatic) {
        const b = document.createElement('button');
        b.className = 'btn btn-black vehicle-btn';
        b.textContent = 'TLF Azubi';
        // Ensure a vehicle page exists for this mapped slug so navigate() will
        // open a proper vehicle view with areas. Prefer the higher-level helper
        // registerCustomVehiclePage if available; otherwise create the page entry.
        try {
          if (typeof registerCustomVehiclePage === 'function') {
            registerCustomVehiclePage({ label: 'TLF Azubi', slug: mapped });
          } else {
            if (!window.pages) window.pages = window.pages || {};
            if (!window.pages[mapped]) {
              window.pages[mapped] = { title: 'TLF Azubi', content: `<div id="areas-container" class="card" style="margin-top:80px;"></div>` };
            }
            window.CUSTOM_VEHICLE_MAP = window.CUSTOM_VEHICLE_MAP || {};
            window.CUSTOM_VEHICLE_MAP['TLF Azubi'] = mapped + '.html';
          }
        } catch (_) {}
        b.addEventListener('click', () => navigate(mapped));
        // append before rendering custom section so hidden-filter and add/delete UI still work
        container.appendChild(b);

        // Offer a one-click migration to persist this mapped vehicle into
        // custom_vehicles_hauptwache. This avoids losing the mapping on reloads.
        try {
          const existing = getCustomVehiclesForGroup('hauptwache');
          const alreadySaved = existing.some(cv => (cv.label||'').trim().toLowerCase() === 'tlf azubi');
          if (!alreadySaved) {
            const saveBtn = document.createElement('button');
            saveBtn.className = 'btn btn-purple';
            saveBtn.textContent = 'Als Fahrzeug speichern';
            saveBtn.title = 'Speichert TLF Azubi dauerhaft auf dieser Seite';
            saveBtn.style.marginLeft = '8px';
            saveBtn.addEventListener('click', () => {
              try {
                addCustomVehicleToGroup('hauptwache', 'TLF Azubi');
                // re-render the hauptwache page so the new saved vehicle appears
                renderPage('hauptwache');
              } catch (e) {
                alert('Speichern fehlgeschlagen. Siehe Konsole.');
                console.error(e);
              }
            });
            container.appendChild(saveBtn);
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
  // Append any custom vehicles and the add button
  enhanceVehicleSection('vehicle-btns-haupt', 'hauptwache');
  // Place the Lager Hauptwache button after custom vehicles so it isn't inserted
  // between the TLF Azubi fallback and other static vehicle buttons.
  try {
    const container = document.getElementById('vehicle-btns-haupt');
    if (container && !Array.from(container.querySelectorAll('button')).some(b => (b.textContent||'').trim() === 'Lager Hauptwache')) {
      const lb = document.createElement('button');
      lb.className = 'btn btn-grey vehicle-btn';
      lb.textContent = 'Lager Hauptwache';
      lb.addEventListener('click', () => navigate('lager-hauptwache'));
      container.appendChild(lb);
    }
  } catch (_) {}
  // Ensure setupGlobalSearch from script.js is available on window for SPA use
  if (typeof window.setupGlobalSearch !== 'function' && typeof setupGlobalSearch === 'function') {
    window.setupGlobalSearch = setupGlobalSearch;
  }
  // Call setupGlobalSearch to initialize the search functionality
  if (typeof window.setupGlobalSearch === 'function') {
    window.setupGlobalSearch();
  }
  // Build and show areas for this page
  try { renderVehiclePage('hauptwache'); } catch (_) {}
} // <-- Add this closing brace to properly close renderHauptwachePage
// --- Generic moveable button renderer for FL, TF, FH, etc. ---
function renderMoveableButtons(container, numbers, prefix, className, styleFn) {

  numbers.forEach(num => {
    const btn = document.createElement('button');
    btn.textContent = prefix + ' ' + num;
    btn.setAttribute('draggable', 'true');
    btn.className = 'btn ' + (className || '');
    if (typeof styleFn === 'function') styleFn(btn, num);
    btn.addEventListener('click', function() { showAssignmentSidebar(btn); });
    container.appendChild(btn);
  });
}
// --- Render Löschzug Milspe Page ---
function renderLoeschzugMilspePage() {
  const main = document.getElementById('app-main');
  main.innerHTML = `
    <div class="card" style="margin-top:80px;">
      <div id="vehicle-btns-milspe" class="page-buttons">
        <button class="btn btn-black vehicle-btn" onclick="navigate('1-hlf20-2')">1 HLF20 2</button>
        <button class="btn btn-black vehicle-btn" onclick="navigate('3-lfkat20')">3 LFKat20</button>
        <button class="btn btn-black vehicle-btn" onclick="navigate('gwg')">GWG</button>
      </div>
    </div>
    <div id="areas-container" class="card" style="margin-top:18px;"></div>
  `;
  enhanceVehicleSection('vehicle-btns-milspe', 'loeschzug-milspe');
  if (typeof window.setupGlobalSearch === 'function') {
    window.setupGlobalSearch();
  }
  try { renderVehiclePage('loeschzug-milspe'); } catch (_) {}
}
// --- Render Löschgruppe Külchen Page ---
function renderLoeschgruppeKuelchenPage() {
  const main = document.getElementById('app-main');
  main.innerHTML = `
    <div class="card" style="margin-top:80px;">
      <div id="vehicle-btns-kuelchen" class="page-buttons">
        <button class="btn btn-black vehicle-btn" onclick="navigate('5-hlf20-1')">5 HLF20 1</button>
      </div>
    </div>
    <div id="areas-container" class="card" style="margin-top:18px;"></div>
  `;
  enhanceVehicleSection('vehicle-btns-kuelchen', 'loeschgruppe-kuelchen');
  if (typeof window.setupGlobalSearch === 'function') {
    window.setupGlobalSearch();
  }
  try { renderVehiclePage('loeschgruppe-kuelchen'); } catch (_) {}
}
// --- Render Löschgruppe Rüggeberg Page ---
function renderLoeschgruppeRueggebergPage() {
  const main = document.getElementById('app-main');
  main.innerHTML = `
    <div class="card" style="margin-top:80px;">
      <div id="vehicle-btns-rueggeberg" class="page-buttons">
        <button class="btn btn-black vehicle-btn" onclick="navigate('4-lf10-1')">4 LF10 1</button>
        <button class="btn btn-black vehicle-btn" onclick="navigate('4-tlf3000-1')">4 TLF3000 1</button>
      </div>
    </div>
    <div id="areas-container" class="card" style="margin-top:18px;"></div>
  `;
  enhanceVehicleSection('vehicle-btns-rueggeberg', 'loeschgruppe-rueggeberg');
  if (typeof window.setupGlobalSearch === 'function') {
    window.setupGlobalSearch();
  }
  try { renderVehiclePage('loeschgruppe-rueggeberg'); } catch (_) {}
}
// --- Render Löschgruppe Oberbauer Page ---
function renderLoeschgruppeOberbauerPage() {
  const main = document.getElementById('app-main');
  main.innerHTML = `
    <div class="card" style="margin-top:80px;">
      <div id="vehicle-btns-oberbauer" class="page-buttons">
        <button class="btn btn-black vehicle-btn" onclick="navigate('3-hlf20-1')">3 HLF20 1</button>
      </div>
    </div>
    <div id="areas-container" class="card" style="margin-top:18px;"></div>
  `;
  enhanceVehicleSection('vehicle-btns-oberbauer', 'loeschgruppe-oberbauer');
  if (typeof window.setupGlobalSearch === 'function') {
    window.setupGlobalSearch();
  }
  try { renderVehiclePage('loeschgruppe-oberbauer'); } catch (_) {}
}
function showAssignmentSidebar(moveableBtn) {
  if (!window.sidebar) {
    const sb = document.createElement('div');
    sb.id = 'assignment-sidebar';
    sb.style.position = 'fixed';
    sb.style.top = '0';
    sb.style.right = '0';
    sb.style.width = '340px';
    sb.style.height = '100%';
    sb.style.background = '#fff';
    sb.style.boxShadow = '-4px 0 24px rgba(0,0,0,0.12)';
    sb.style.zIndex = '200';
    sb.style.display = 'flex';
    sb.style.flexDirection = 'column';
    sb.style.padding = '24px 18px 18px 18px';
    sb.style.overflowY = 'auto';
    window.sidebar = sb;
  }
  const sidebar = window.sidebar;
  // Clear sidebar content before adding new elements
  while (sidebar.firstChild) sidebar.removeChild(sidebar.firstChild);
  sidebar.style.display = 'flex';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'sidebar-close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.title = 'Schließen';
  closeBtn.onclick = () => { sidebar.style.display = 'none'; };
  sidebar.appendChild(closeBtn);

  // Title
  const title = document.createElement('h2');
  title.textContent = `Wohin soll ${moveableBtn.textContent} verschoben werden?`;
  title.style.fontSize = '1.2rem';
  title.style.margin = '0 0 18px 0';
  sidebar.appendChild(title);

  // --- PA+FL join/split helpers ---
  function isPA(btn){ return /^\s*PA\s+\d+/i.test((btn.textContent||'')); }
  function isCombinedPA(btn){
    if (btn && btn.dataset && btn.dataset.combo === '1') return true;
    return /\bPA\s+\d+\s+mit\s+FL\s+\d+/i.test((btn.textContent||''));
  }
  function parseCombined(btn){
    if (btn && btn.dataset && btn.dataset.combo === '1') {
      const pa = parseInt(btn.dataset.paNumber || '', 10);
      const fl = parseInt(btn.dataset.flNumber || '', 10);
      if (!isNaN(pa) && !isNaN(fl)) return { pa, fl };
    }
    const m = (btn.textContent||'').match(/PA\s+(\d+)\s+mit\s+FL\s+(\d+)/i);
    return m ? { pa: parseInt(m[1],10), fl: parseInt(m[2],10) } : null;
  }
  // SI helpers (combine Si + FL)
  function isSi(btn){ return /^\s*Si\s+\d+/i.test((btn.textContent||'')); }
  function isCombinedSi(btn){
    if (btn && btn.dataset && btn.dataset.combo === '1' && btn.dataset.siNumber) return true;
    return /\bSi\s+\d+\s+mit\s+FL\s+\d+/i.test((btn.textContent||''));
  }
  function parseCombinedSi(btn){
    if (btn && btn.dataset && btn.dataset.combo === '1' && btn.dataset.siNumber && btn.dataset.flNumber) {
      const si = parseInt(btn.dataset.siNumber || '', 10);
      const fl = parseInt(btn.dataset.flNumber || '', 10);
      if (!isNaN(si) && !isNaN(fl)) return { si, fl };
    }
    const m = (btn.textContent||'').match(/Si\s+(\d+)\s+mit\s+FL\s+(\d+)/i);
    return m ? { si: parseInt(m[1],10), fl: parseInt(m[2],10) } : null;
  }
  function decorateCombinedPAInline(btn, flNumber, flStyle){
    // Melted two-segment button: left PA, right FL, each keeps original colors
    const baseText = (btn.textContent||'').trim();
    const baseMatch = baseText.match(/^\s*PA\s+\d+/i);
    const paTxt = baseMatch ? baseMatch[0] : (baseText || 'PA');
    const paNumMatch = paTxt.match(/PA\s+(\d+)/i);
    const paNum = paNumMatch ? parseInt(paNumMatch[1],10) : null;
    // Outer button layout
    btn.innerHTML = '';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'stretch';
    btn.style.padding = '0';
    btn.style.background = 'transparent';
    btn.style.borderRadius = '8px';
    // Left: PA segment (keep PA style: black background)
    const left = document.createElement('span');
    left.textContent = paTxt;
    left.style.background = '#111';
    left.style.color = '#bbb';
    left.style.padding = '6px 10px';
    left.style.borderTopLeftRadius = '8px';
    left.style.borderBottomLeftRadius = '8px';
    left.style.display = 'inline-flex';
    left.style.alignItems = 'center';
    // Right: FL segment (gold or grey)
    const right = document.createElement('span');
    right.textContent = `FL ${flNumber}`;
    right.style.padding = '6px 10px';
    right.style.display = 'inline-flex';
    right.style.alignItems = 'center';
    if (flStyle === 'grey') {
      right.style.background = '#444';
      right.style.color = '#bbb';
    } else {
      right.style.background = '#bfa100';
      right.style.color = '#fff';
    }
    right.style.borderTopRightRadius = '8px';
    right.style.borderBottomRightRadius = '8px';
    // Optional inner divider
    const divider = document.createElement('span');
    divider.style.width = '1px';
    divider.style.background = 'rgba(255,255,255,0.2)';
    divider.style.margin = '0';
    // Append
    btn.appendChild(left);
    btn.appendChild(divider);
    // Add an invisible separator that contains the literal ' mit ' so textContent() includes the word
    const mitHidden = document.createElement('span');
    mitHidden.textContent = ' mit ';
    mitHidden.style.display = 'none';
    btn.appendChild(mitHidden);
    btn.appendChild(right);
    // Mark class and dataset for persistence/restoration
    btn.classList.remove('combo-fl-gold','combo-fl-grey');
    btn.classList.add(flStyle === 'grey' ? 'combo-fl-grey' : 'combo-fl-gold');
    if (paNum != null) btn.dataset.paNumber = String(paNum);
    btn.dataset.flNumber = String(flNumber);
    btn.dataset.flStyle = flStyle === 'grey' ? 'grey' : 'gold';
    btn.dataset.combo = '1';
  }
  function decorateCombinedSiInline(btn, flNumber, flStyle){
    // Similar to PA decorator but left segment styled as Si (green accent)
    const baseText = (btn.textContent||'').trim();
    const baseMatch = baseText.match(/^\s*Si\s+\d+/i);
    const siTxt = baseMatch ? baseMatch[0] : (baseText || 'Si');
    btn.innerHTML = '';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'stretch';
    btn.style.padding = '0';
    btn.style.background = 'transparent';
    btn.style.borderRadius = '8px';
    const left = document.createElement('span');
    left.textContent = siTxt;
    left.style.background = '#111';
    left.style.color = '#bfff00';
    left.style.padding = '6px 10px';
    left.style.borderTopLeftRadius = '8px';
    left.style.borderBottomLeftRadius = '8px';
    left.style.display = 'inline-flex';
    left.style.alignItems = 'center';
    const right = document.createElement('span');
    right.textContent = `FL ${flNumber}`;
    right.style.padding = '6px 10px';
    right.style.display = 'inline-flex';
    right.style.alignItems = 'center';
    if (flStyle === 'grey') {
      right.style.background = '#444';
      right.style.color = '#bbb';
    } else {
      right.style.background = '#bfa100';
      right.style.color = '#fff';
    }
    right.style.borderTopRightRadius = '8px';
    right.style.borderBottomRightRadius = '8px';
    const divider = document.createElement('span');
    divider.style.width = '1px';
    divider.style.background = 'rgba(255,255,255,0.2)';
    divider.style.margin = '0';
    btn.appendChild(left);
    btn.appendChild(divider);
  // Add an invisible separator containing the word ' mit ' so textContent() matches stored label
  const mitHiddenSi = document.createElement('span');
  mitHiddenSi.textContent = ' mit ';
  mitHiddenSi.style.display = 'none';
  btn.appendChild(mitHiddenSi);
  btn.appendChild(right);
    btn.classList.remove('combo-fl-gold','combo-fl-grey');
    btn.classList.add(flStyle === 'grey' ? 'combo-fl-grey' : 'combo-fl-gold');
    const siNumMatch = siTxt.match(/Si\s+(\d+)/i);
    if (siNumMatch) btn.dataset.siNumber = String(parseInt(siNumMatch[1],10));
    btn.dataset.flNumber = String(flNumber);
    btn.dataset.flStyle = flStyle === 'grey' ? 'grey' : 'gold';
    btn.dataset.combo = '1';
  }
  function updateRemovedFL(label, add){
    try {
      let arr = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]');
      arr = Array.isArray(arr) ? arr : [];
      const idx = arr.indexOf(label);
      if (add) { if (idx === -1) arr.push(label); }
      else { if (idx !== -1) arr.splice(idx,1); }
      localStorage.setItem('removed_fls_liste_atemluftflaschen', JSON.stringify(arr));
    } catch (_) {}
  }
  function computeAvailableFLNumbers(){
    const vehiclePages = [
      '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
      '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html'
    ];
    const assigned = new Set();
    vehiclePages.forEach(page => {
      try {
        const moveables = JSON.parse(localStorage.getItem('moveables_' + page) || '[]');
        (moveables||[]).forEach(m => {
          if (m.areaId === 'fl' && m.label && /^FL\s+\d+/.test(m.label)) assigned.add(m.label.trim());
        });
      } catch (_) {}
    });
    let removedFLs = [];
    try { removedFLs = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]'); } catch (_) {}
    const removedSet = new Set(removedFLs);
    const goldenFL = [126,212,202,149,209,173,164,156,154,196,163,216,205,181,203,208,160,227,136,120,188,218,225,177,153,198,138,127,215,213,192,174,206,158,210,140,130,155,190,221,178,143,122,180,171,175,131,152,128,172,129,169,123,199,219,229,194,157,195,207,220,124,226,224,197,161,170,201,119,193,183,214,121,125,159,135,176,139,179,141,142,184,145,185,144,186,146,147,189,148,191,150,200,151,204,162,211,165,217,166,222,167,223,168,228,182,238,137,187,8,43,57,93,167,189,211,289];
    const greyFL = [73,24,61,22,85,19,71,70,1,102,16,82,26,29,9,46,17,72,53,86,84,116,118,40,8,51,11,57,33,59,66,93,79,81,44,42,4,6,10,12,13,14,15,18,20,21,23,25,27,28,30,31,32,34,35,36,43,48,49,52,56,60,64,65,67,69,75,76,77,78,87,88,91,95,100,101,104,105,107,108,109,110,111,112,113,114,115,117];
    const all = [...new Set([...goldenFL, ...greyFL])];
    const available = all.filter(num => !assigned.has(`FL ${num}`) && !removedSet.has(`FL ${num}`));
    const goldSet = new Set(goldenFL);
    return { available: available.sort((a,b)=>a-b), isGold: (n)=>goldSet.has(n) };
  }

  // Join option for PA
  if (isPA(moveableBtn) && !isCombinedPA(moveableBtn)) {
    const joinBtn = document.createElement('button');
    joinBtn.textContent = 'Mit FL verbinden';
    joinBtn.className = 'btn btn-purple';
    joinBtn.style.marginBottom = '12px';
    joinBtn.addEventListener('click', () => {
      let flSidebar = document.getElementById('fl-select-sidebar');
      if (flSidebar) flSidebar.remove();
      flSidebar = document.createElement('div');
      flSidebar.id = 'fl-select-sidebar';
      flSidebar.style.position = 'fixed';
      flSidebar.style.top = '0';
      flSidebar.style.right = '0';
      flSidebar.style.width = '360px';
      flSidebar.style.height = '100%';
      flSidebar.style.background = '#fff';
      flSidebar.style.boxShadow = '-4px 0 24px rgba(0,0,0,0.12)';
      flSidebar.style.zIndex = '202';
      flSidebar.style.display = 'flex';
      flSidebar.style.flexDirection = 'column';
      flSidebar.style.padding = '24px 18px 18px 18px';
      flSidebar.style.overflowY = 'auto';
      const close2 = document.createElement('button');
      close2.className = 'sidebar-close-btn';
      close2.innerHTML = '&times;';
      close2.title = 'Schließen';
      close2.onclick = () => { flSidebar.style.display='none'; };
      flSidebar.appendChild(close2);
      const h2 = document.createElement('h2');
      h2.textContent = 'FL wählen (verfügbar)';
      h2.style.fontSize = '1.1rem';
      h2.style.margin = '0 0 8px 0';
      flSidebar.appendChild(h2);
      const grid = document.createElement('div');
      grid.style.display = 'flex';
      grid.style.flexWrap = 'wrap';
      grid.style.gap = '8px';
      const { available, isGold } = computeAvailableFLNumbers();
      available.forEach(num => {
        const b = document.createElement('button');
        b.textContent = 'FL ' + num;
        b.className = 'btn fl-btn';
        b.style.minWidth = '64px';
        b.style.minHeight = '44px';
        b.style.fontWeight = '700';
        b.style.fontSize = '1.05rem';
        b.style.margin = '4px';
        const styleKind = isGold(num) ? 'gold' : 'grey';
        if (styleKind === 'gold') {
          b.style.border = '2px solid #bfa100';
          b.style.color = '#fff';
          b.style.background = '#bfa100';
        } else {
          b.style.border = '2px solid #888';
          b.style.color = '#bbb';
          b.style.background = '#444';
        }
        b.addEventListener('click', () => {
          decorateCombinedPAInline(moveableBtn, num, styleKind);
          updateRemovedFL('FL ' + num, true);
          // Persist join state on Liste PA so it survives navigation if not assigned yet
          try {
            const current = window.location.hash.replace(/^#/, '') || 'hauptmenu';
            if (current === 'liste-pa') {
              const paMatch = (moveableBtn.textContent||'').match(/PA\s+(\d+)/i);
              const paNum = paMatch ? parseInt(paMatch[1], 10) : null;
              if (paNum) upsertCombinedPA(paNum, num);
            }
          } catch (_) {}
          flSidebar.style.display = 'none';
          sidebar.style.display = 'none';
        });
        grid.appendChild(b);
      });
      flSidebar.appendChild(grid);
      document.body.appendChild(flSidebar);
    });
    sidebar.appendChild(joinBtn);
  }

  // Join option for Si (Sicherheitstrupptasche) -> allow combining with FL as well
  if (isSi(moveableBtn) && !isCombinedSi(moveableBtn)) {
    const joinSiBtn = document.createElement('button');
    joinSiBtn.textContent = 'Mit FL verbinden';
    joinSiBtn.className = 'btn btn-purple';
    joinSiBtn.style.marginBottom = '12px';
    joinSiBtn.addEventListener('click', () => {
      let flSidebar = document.getElementById('fl-select-sidebar');
      if (flSidebar) flSidebar.remove();
      flSidebar = document.createElement('div');
      flSidebar.id = 'fl-select-sidebar';
      flSidebar.style.position = 'fixed';
      flSidebar.style.top = '0';
      flSidebar.style.right = '0';
      flSidebar.style.width = '360px';
      flSidebar.style.height = '100%';
      flSidebar.style.background = '#fff';
      flSidebar.style.boxShadow = '-4px 0 24px rgba(0,0,0,0.12)';
      flSidebar.style.zIndex = '202';
      flSidebar.style.display = 'flex';
      flSidebar.style.flexDirection = 'column';
      flSidebar.style.padding = '24px 18px 18px 18px';
      flSidebar.style.overflowY = 'auto';
      const close2 = document.createElement('button');
      close2.className = 'sidebar-close-btn';
      close2.innerHTML = '&times;';
      close2.title = 'Schließen';
      close2.onclick = () => { flSidebar.style.display='none'; };
      flSidebar.appendChild(close2);
      const h2 = document.createElement('h2');
      h2.textContent = 'FL wählen (verfügbar)';
      h2.style.fontSize = '1.1rem';
      h2.style.margin = '0 0 8px 0';
      flSidebar.appendChild(h2);
      const grid = document.createElement('div');
      grid.style.display = 'flex';
      grid.style.flexWrap = 'wrap';
      grid.style.gap = '8px';
      const { available, isGold } = computeAvailableFLNumbers();
      available.forEach(num => {
        const b = document.createElement('button');
        b.textContent = 'FL ' + num;
        b.className = 'btn fl-btn';
        b.style.minWidth = '64px';
        b.style.minHeight = '44px';
        b.style.fontWeight = '700';
        b.style.fontSize = '1.05rem';
        b.style.margin = '4px';
        const styleKind = isGold(num) ? 'gold' : 'grey';
        if (styleKind === 'gold') {
          b.style.border = '2px solid #bfa100';
          b.style.color = '#fff';
          b.style.background = '#bfa100';
        } else {
          b.style.border = '2px solid #888';
          b.style.color = '#bbb';
          b.style.background = '#444';
        }
        b.addEventListener('click', () => {
          decorateCombinedSiInline(moveableBtn, num, styleKind);
          updateRemovedFL('FL ' + num, true);
          // Persist join state on Liste Si so it survives navigation if not assigned yet
          try {
            const current = window.location.hash.replace(/^#/, '') || 'hauptmenu';
            if (current === 'liste-sicherheitstrupptaschen') {
              const siMatch = (moveableBtn.textContent||'').match(/Si\s+(\d+)/i);
              const siNum = siMatch ? parseInt(siMatch[1], 10) : null;
              if (siNum) upsertCombinedSi(siNum, num);
            }
          } catch (_) {}
          flSidebar.style.display = 'none';
          sidebar.style.display = 'none';
        });
        grid.appendChild(b);
      });
      flSidebar.appendChild(grid);
      document.body.appendChild(flSidebar);
    });
    sidebar.appendChild(joinSiBtn);
  }

  // Split option for combined PA+FL
  if (isCombinedPA(moveableBtn)) {
    const splitBtn = document.createElement('button');
    splitBtn.textContent = 'PA und FL trennen (FL zurück)';
    splitBtn.className = 'btn btn-grey';
    splitBtn.style.marginBottom = '12px';
    splitBtn.addEventListener('click', () => {
      const combo = parseCombined(moveableBtn);
      if (!combo) return;
      const paOnly = (moveableBtn.textContent||'').match(/PA\s+\d+/i);
      moveableBtn.textContent = paOnly ? paOnly[0] : 'PA';
      moveableBtn.classList.remove('combo-fl-gold','combo-fl-grey');
      if (moveableBtn.dataset) {
        delete moveableBtn.dataset.combo;
        delete moveableBtn.dataset.paNumber;
        delete moveableBtn.dataset.flNumber;
        delete moveableBtn.dataset.flStyle;
      }
      updateRemovedFL('FL ' + combo.fl, false);
      // If split occurs on Liste PA, remove the combined mapping and refresh list
      try {
        const current = window.location.hash.replace(/^#/, '') || 'hauptmenu';
        if (current === 'liste-pa') {
          removeCombinedPA(combo.pa);
          if (typeof renderPAListePage === 'function') renderPAListePage();
        }
      } catch (_) {}
      // If this PA is stored on the current page, update its label in storage too
      try {
        const current = window.location.hash.replace(/^#/, '') || 'hauptmenu';
        const pageFile = current.endsWith('.html') ? current : current + '.html';
        const key = 'moveables_' + pageFile;
        let arr = JSON.parse(localStorage.getItem(key) || '[]');
        let changed = false;
        const oldComboLabel = `PA ${combo.pa} mit FL ${combo.fl}`;
        const newBaseLabel = `PA ${combo.pa}`;
        arr = arr.map(m => {
          if (m.label === oldComboLabel) { changed = true; return { ...m, label: newBaseLabel }; }
          return m;
        });
        if (changed) localStorage.setItem(key, JSON.stringify(arr));
      } catch (_) {}
      sidebar.style.display = 'none';
    });
    sidebar.appendChild(splitBtn);
  }
  // Split option for combined Si+FL
  if (isCombinedSi(moveableBtn)) {
    const splitSiBtn = document.createElement('button');
    splitSiBtn.textContent = 'Si und FL trennen (FL zurück)';
    splitSiBtn.className = 'btn btn-grey';
    splitSiBtn.style.marginBottom = '12px';
    splitSiBtn.addEventListener('click', () => {
      const combo = parseCombinedSi(moveableBtn);
      if (!combo) return;
      const siOnly = (moveableBtn.textContent||'').match(/Si\s+\d+/i);
      moveableBtn.textContent = siOnly ? siOnly[0] : 'Si';
      moveableBtn.classList.remove('combo-fl-gold','combo-fl-grey');
      if (moveableBtn.dataset) {
        delete moveableBtn.dataset.combo;
        delete moveableBtn.dataset.siNumber;
        delete moveableBtn.dataset.flNumber;
        delete moveableBtn.dataset.flStyle;
      }
      updateRemovedFL('FL ' + combo.fl, false);
      // If split occurs on Liste Si, remove the combined mapping and refresh list
      try {
        const current = window.location.hash.replace(/^#/, '') || 'hauptmenu';
        if (current === 'liste-sicherheitstrupptaschen') {
          removeCombinedSi(combo.si);
          if (typeof renderSIListePage === 'function') renderSIListePage();
        }
      } catch (_) {}
      // If this Si is stored on the current page, update its label in storage too
      try {
        const current = window.location.hash.replace(/^#/, '') || 'hauptmenu';
        const pageFile = current.endsWith('.html') ? current : current + '.html';
        const key = 'moveables_' + pageFile;
        let arr = JSON.parse(localStorage.getItem(key) || '[]');
        let changed = false;
        const oldComboLabel = `Si ${combo.si} mit FL ${combo.fl}`;
        const newBaseLabel = `Si ${combo.si}`;
        arr = arr.map(m => {
          if (m.label === oldComboLabel) { changed = true; return { ...m, label: newBaseLabel }; }
          return m;
        });
        if (changed) localStorage.setItem(key, JSON.stringify(arr));
      } catch (_) {}
      sidebar.style.display = 'none';
    });
    sidebar.appendChild(splitSiBtn);
  }

  // Edit button (purple)
  const editBtn = document.createElement('button');
  editBtn.textContent = 'Text bearbeiten';
  editBtn.className = 'btn btn-purple';
  editBtn.style.marginBottom = '18px';
  editBtn.addEventListener('click', function() {
    const newText = prompt('Neuer Text für Button:', moveableBtn.textContent);
    if (newText) moveableBtn.textContent = newText;
    sidebar.style.display = 'none';
  });
  sidebar.appendChild(editBtn);

  // Personal mask assignment: allow turning an AM into a personal mask and moving it to
  // a specified site with a person's name. Only for AM buttons.
  try {
    if (/^\s*AM\s+\d+/i.test((moveableBtn.textContent||''))) {
      const personalBtn = document.createElement('button');
      personalBtn.textContent = 'Persönliche Maske';
      personalBtn.className = 'btn btn-purple';
      personalBtn.style.marginBottom = '12px';
      personalBtn.addEventListener('click', () => {
        // open a small sidebar to choose which site to assign to
        let pSidebar = document.getElementById('personal-select-sidebar');
        if (pSidebar) pSidebar.remove();
        pSidebar = document.createElement('div');
        pSidebar.id = 'personal-select-sidebar';
        pSidebar.style.position = 'fixed';
        pSidebar.style.top = '0';
        pSidebar.style.right = '0';
        pSidebar.style.width = '360px';
        pSidebar.style.height = '100%';
        pSidebar.style.background = '#fff';
        pSidebar.style.boxShadow = '-4px 0 24px rgba(0,0,0,0.12)';
        pSidebar.style.zIndex = '203';
        pSidebar.style.display = 'flex';
        pSidebar.style.flexDirection = 'column';
        pSidebar.style.padding = '24px 18px 18px 18px';
        pSidebar.style.overflowY = 'auto';
        const close2 = document.createElement('button');
        close2.className = 'sidebar-close-btn';
        close2.innerHTML = '&times;';
        close2.title = 'Schließen';
        close2.onclick = () => { pSidebar.style.display = 'none'; };
        pSidebar.appendChild(close2);
        const h2 = document.createElement('h2');
        h2.textContent = 'Ziel auswählen (Persönliche Maske)';
        h2.style.fontSize = '1.1rem';
        h2.style.margin = '0 0 8px 0';
        pSidebar.appendChild(h2);
        const grid = document.createElement('div');
        grid.style.display = 'flex';
        grid.style.flexWrap = 'wrap';
        grid.style.gap = '8px';

        // Pages where personal masks should be visible (label -> pageFile)
        const siteList = [
          { label: 'Hauptwache', file: 'hauptwache.html' },
          { label: 'Löschzug Milspe', file: 'loeschzug-milspe.html' },
          { label: 'Löschgruppe Voerde', file: 'loeschgruppe-voerde.html' },
          { label: 'Löschgruppe Oberbauer', file: 'loeschgruppe-oberbauer.html' },
          { label: 'Löschgruppe Rüggeberg', file: 'loeschgruppe-rueggeberg.html' },
          { label: 'Löschgruppe Külchen', file: 'loeschgruppe-kuelchen.html' }
        ];

        siteList.forEach(site => {
          const b = document.createElement('button');
          b.textContent = site.label;
          b.className = 'btn btn-grey';
          b.style.minWidth = '48%';
          b.style.margin = '4px 1%';
          b.addEventListener('click', () => {
            const name = prompt('Name der Person (Vorname Nachname):');
            if (!name) return;
            // Build new label
            const m = (moveableBtn.textContent||'').match(/AM\s+(\d+)/i);
            const amNum = m ? parseInt(m[1],10) : null;
            if (!amNum) return;
            const newLabel = `AM ${amNum} (${name})`;

            // Persist to target site under personal area
            const areaId = 'persoenliche-atemschutzmasken';
            const areaTitle = 'Persoenliche Atemschutzmasken';
            const targetFile = site.file; // includes .html
            try {
              // Remove from DOM
              if (moveableBtn.parentNode) moveableBtn.parentNode.removeChild(moveableBtn);
              // Save into target moveables
              const moveablesKey = 'moveables_' + targetFile;
              let moveables = [];
              try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) { moveables = []; }
              moveables.push({
                label: newLabel,
                areaId: areaId,
                areaTitle: areaTitle,
                className: moveableBtn.className,
                style: moveableBtn.getAttribute('style'),
                fromPage: (window.location.hash.replace(/^#/, '') || ''),
                assignedToPage: targetFile,
                timestamp: Date.now()
              });
              localStorage.setItem(moveablesKey, JSON.stringify(moveables));
              // Remove from origin storage
              try {
                const origin = (window.location.hash.replace(/^#/, '') || '');
                const originKey = 'moveables_' + (origin.endsWith('.html') ? origin : origin + '.html');
                let originArr = [];
                try { originArr = JSON.parse(localStorage.getItem(originKey) || '[]'); } catch (_) { originArr = []; }
                originArr = originArr.filter(mv => mv.label !== (moveableBtn.textContent || '').trim());
                localStorage.setItem(originKey, JSON.stringify(originArr));
              } catch (_) {}
              // Mark this AM as removed from the public AM list so it no longer appears there
              try {
                let removedAMs = [];
                try { removedAMs = JSON.parse(localStorage.getItem('removed_ams_liste_atemanschluesse') || '[]'); } catch(_) { removedAMs = []; }
                if (!Array.isArray(removedAMs)) removedAMs = [];
                const labelBase = `AM ${amNum}`;
                if (removedAMs.indexOf(labelBase) === -1) removedAMs.push(labelBase);
                localStorage.setItem('removed_ams_liste_atemanschluesse', JSON.stringify(removedAMs));
              } catch (_) {}
            } catch (_) {}
            // If target page is the currently visible page, render the button immediately
            try {
              const currentPageFile = window.currentPageFile || ((window.location.hash.replace(/^#/, '') || '') + '.html');
              if (currentPageFile === targetFile) {
                const areaRoot = (typeof window.getArea === 'function' ? window.getArea(areaId) : null) || document.querySelector(`.moveable-area[data-area-id="${areaId}"]`);
                if (areaRoot) {
                  const btnNew = document.createElement('button');
                  btnNew.textContent = newLabel;
                  btnNew.className = moveableBtn.className || 'btn';
                  const s = moveableBtn.getAttribute && moveableBtn.getAttribute('style');
                  if (s) btnNew.setAttribute('style', s);
                  // Place into the area content element if present
                  const content = areaRoot.querySelector('.area-content') || areaRoot;
                  content.appendChild(btnNew);
                  if (typeof window.makeButtonMoveable === 'function') window.makeButtonMoveable(btnNew, areaId);
                }
              }
            } catch (_) {}
            pSidebar.style.display = 'none';
            sidebar.style.display = 'none';
          });
          grid.appendChild(b);
        });
        pSidebar.appendChild(grid);
        document.body.appendChild(pSidebar);
      });
      sidebar.appendChild(personalBtn);
    }
  } catch (_) {}

  // Assignment destinations grid
  const btnGrid = document.createElement('div');
  btnGrid.className = 'sidebar-assignment-grid';
  let selectedVehicleFile = null;

  // Ensure Silschede destinations exist and are mapped to SPA pages
  window.CUSTOM_VEHICLE_MAP = window.CUSTOM_VEHICLE_MAP || {};
  if (!window.CUSTOM_VEHICLE_MAP['Silschede']) window.CUSTOM_VEHICLE_MAP['Silschede'] = 'silschede.html';
  if (!window.CUSTOM_VEHICLE_MAP['Von Silschede']) window.CUSTOM_VEHICLE_MAP['Von Silschede'] = 'von-silschede.html';
  if (!window.CUSTOM_VEHICLE_MAP['Für Silschede']) window.CUSTOM_VEHICLE_MAP['Für Silschede'] = 'fuer-silschede.html';

  const quickDestinations = ['Silschede', 'Von Silschede', 'Für Silschede'];
  // Build a set of vehicle labels to style them in black/white (needed for grouping)
  let vehicleLabelSet = new Set();
  try {
    const vehicles = (typeof collectAllVehicles === 'function') ? collectAllVehicles() : [];
    vehicles.forEach(v => { if (v && v.label) vehicleLabelSet.add(v.label); });
  } catch (_) {}
  // Ensure 'TLF Azubi' is treated as a vehicle even if not present in VEHICLE_LIST
  vehicleLabelSet.add('TLF Azubi');
  // Build a deterministic list grouped as: vehicles first, then lager/grey, then others, and
  // finally the Silschede quick destinations (blue) at the bottom as requested.
  const sourceDests = Array.isArray(window.ASSIGNMENT_DESTINATIONS) ? window.ASSIGNMENT_DESTINATIONS.slice() : [];
  // Ensure uniqueness while preserving order
  const uniq = [];
  const seen = new Set();
  sourceDests.forEach(d => { if (!seen.has(d)) { uniq.push(d); seen.add(d); } });
  // Partition
  const sils = uniq.filter(d => quickDestinations.includes(d));
  const vehiclesList = uniq.filter(d => vehicleLabelSet.has(d) && !sils.includes(d));
  const lagersList = uniq.filter(d => /lager/i.test(d) && !sils.includes(d) && !vehicleLabelSet.has(d));
  const othersList = uniq.filter(d => !sils.includes(d) && !vehiclesList.includes(d) && !lagersList.includes(d));
  const allDestinations = [].concat(vehiclesList, lagersList, othersList, sils);

  allDestinations.forEach(dest => {
    // If the item being assigned is an FL, do not offer vehicle (black) destinations.
    // However always allow the quick Silschede destinations (blue) even for FL.
    try {
      const text = (moveableBtn && (moveableBtn.textContent || '')).trim();
      const isFL = text.startsWith('FL ');
      const quickDestinations = ['Silschede', 'Von Silschede', 'Für Silschede'];
      if (isFL && vehicleLabelSet.has(dest) && quickDestinations.indexOf(dest) === -1) return; // skip vehicle dests for FL (but keep quicks)
    } catch (_) {}
    const abtn = document.createElement('button');
    abtn.textContent = dest;
    // Styling rules:
    // - Silschede buttons: blue with white text
    // - Lager buttons: keep default grey
    // - Vehicle buttons: black with white text
    // - Others: grey
    let cls = 'btn sidebar-assignment-btn ';
    if (quickDestinations.includes(dest)) {
      cls += 'btn-blue';
    } else if (/lager/i.test(dest)) {
      cls += 'btn-grey';
    } else if (vehicleLabelSet.has(dest)) {
      cls += 'btn-black';
    } else {
      cls += 'btn-grey';
    }
    abtn.className = cls;
    abtn.addEventListener('click', function() {
      const fromList = (window.VEHICLE_LIST || []).find(([title, file]) => title === dest);
  selectedVehicleFile = fromList ? fromList[1] : ((window.CUSTOM_VEHICLE_MAP || {})[dest] || null);
      sidebar.style.display = 'none';
      setTimeout(() => {
        let areaSidebar = document.getElementById('area-select-sidebar');
        if (!areaSidebar) {
          areaSidebar = document.createElement('div');
          areaSidebar.id = 'area-select-sidebar';
          areaSidebar.style.position = 'fixed';
          areaSidebar.style.top = '0';
          areaSidebar.style.right = '0';
          areaSidebar.style.width = '340px';
          areaSidebar.style.height = '100%';
          areaSidebar.style.background = '#fff';
          areaSidebar.style.boxShadow = '-4px 0 24px rgba(0,0,0,0.12)';
          areaSidebar.style.zIndex = '201';
          areaSidebar.style.display = 'flex';
          areaSidebar.style.flexDirection = 'column';
          areaSidebar.style.padding = '24px 18px 18px 18px';
          areaSidebar.style.overflowY = 'auto';
        } else {
          while (areaSidebar.firstChild) areaSidebar.removeChild(areaSidebar.firstChild);
        }
        const closeBtn = document.createElement('button');
        closeBtn.className = 'sidebar-close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.title = 'Schließen';
        closeBtn.onclick = () => { areaSidebar.style.display = 'none'; };
        areaSidebar.appendChild(closeBtn);
        const title = document.createElement('h2');
        title.textContent = 'Wähle einen Bereich (z.B. Fluchthauben):';
        title.style.fontSize = '1.2rem';
        title.style.margin = '0 0 18px 0';
        areaSidebar.appendChild(title);
        const grid = document.createElement('div');
        grid.className = 'sidebar-assignment-grid';
        grid.style.display = 'flex';
        grid.style.flexWrap = 'wrap';
        grid.style.gap = '10px';
        grid.style.marginBottom = '10px';
  let filteredAreas = window.AREA_ASSIGNMENT_BUTTONS || window.AREA_TITLES || [];
        // Area restrictions:
        // - PA (and combined PA+FL) => only 'Atemschutzgeräte'
        // - FH => only 'Fluchthauben'
        // - TF when assigning to a specific vehicle => 'Sprungretter'|'Technikflaschen'
        try {
          const text = (moveableBtn && (moveableBtn.textContent || '')).trim();
          const isFH = text.startsWith('FH ');
          const isTF = text.startsWith('TF ');
          // Use helper functions defined earlier in this scope to detect PA/combined PA
          const isPAItem = (typeof isPA === 'function' && isPA(moveableBtn)) || (typeof isCombinedPA === 'function' && isCombinedPA(moveableBtn)) || (/^\s*PA\s+\d+/i).test(text) || (/\bPA\s+\d+\s+mit\s+FL\s+\d+/i).test(text);
          const isAMItem = (/^\s*AM\s+\d+/i).test(text);
          const isSiItem = (typeof isSi === 'function' && isSi(moveableBtn)) || (typeof isCombinedSi === 'function' && isCombinedSi(moveableBtn)) || (/^\s*Si\s+\d+/i).test(text) || (/\bSi\s+\d+\s+mit\s+FL\s+\d+/i).test(text);
          if (isSiItem) {
            filteredAreas = ['Sicherheitstrupptasche'];
          } else if (isPAItem || isAMItem) {
            if (isAMItem) {
              filteredAreas = ['Atemschutzmasken'];
            } else {
              filteredAreas = ['Atemschutzgeräte'];
            }
          } else if (isFH) {
            filteredAreas = ['Fluchthauben'];
          } else if (selectedVehicleFile && isTF) {
            filteredAreas = ['Sprungretter', 'Technikflaschen'];
          }
        } catch (_) {}
        grid.innerHTML = '';
        filteredAreas.forEach(areaTitle => {
          const areaId = areaTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const btn = document.createElement('button');
          btn.textContent = areaTitle;
          btn.className = 'btn btn-grey sidebar-assignment-btn';
          btn.style.flex = '1 1 48%';
          btn.style.maxWidth = '48%';
          btn.style.minWidth = '120px';
          btn.style.boxSizing = 'border-box';
          btn.addEventListener('click', function() {
            const fromPage = window.location.hash.replace(/^#/, '');
            const targetFile = selectedVehicleFile || fromPage;
            if (moveableBtn.parentNode) moveableBtn.parentNode.removeChild(moveableBtn);
            const moveablesKey = 'moveables_' + targetFile;
            let moveables = [];
            try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
            // Build a clean label to persist (avoid duplicate badge text)
            let labelToSave = (moveableBtn.textContent || '').trim();
            const comboSel = ((typeof parseCombined === 'function') ? parseCombined(moveableBtn) : null) || ((typeof parseCombinedSi === 'function') ? parseCombinedSi(moveableBtn) : null);
            if (comboSel) {
              if (comboSel.pa) labelToSave = `PA ${comboSel.pa} mit FL ${comboSel.fl}`;
              else if (comboSel.si) labelToSave = `Si ${comboSel.si} mit FL ${comboSel.fl}`;
            }
            moveables.push({
              label: labelToSave,
              areaId,
              areaTitle,
              className: moveableBtn.className,
              style: moveableBtn.getAttribute('style'),
              fromPage,
              assignedToPage: targetFile,
              timestamp: Date.now()
            });
            localStorage.setItem(moveablesKey, JSON.stringify(moveables));
            const originKey = 'moveables_' + (String(fromPage || '').endsWith('.html') ? fromPage : (fromPage + '.html'));
            let originMoveables = [];
            try { originMoveables = JSON.parse(localStorage.getItem(originKey) || '[]'); } catch (e) {}
            // Remove by current label, and if combined, also remove any prior base label (PA or Si)
            if (comboSel) {
              if (comboSel.pa) {
                const baseLabel = `PA ${comboSel.pa}`;
                originMoveables = originMoveables.filter(m => m.label !== moveableBtn.textContent && m.label !== baseLabel);
              } else if (comboSel.si) {
                const baseLabel = `Si ${comboSel.si}`;
                originMoveables = originMoveables.filter(m => m.label !== moveableBtn.textContent && m.label !== baseLabel);
              } else {
                originMoveables = originMoveables.filter(m => m.label !== moveableBtn.textContent);
              }
            } else {
              originMoveables = originMoveables.filter(m => m.label !== moveableBtn.textContent);
            }
            localStorage.setItem(originKey, JSON.stringify(originMoveables));
            // If assigning from Liste PA and item was a combined PA, clear its persisted combined mapping
            try {
              const current = window.location.hash.replace(/^#/, '') || 'hauptmenu';
              if (current === 'liste-pa' && comboSel && comboSel.pa) {
                removeCombinedPA(comboSel.pa);
              }
              if (current === 'liste-sicherheitstrupptaschen' && comboSel && comboSel.si) {
                try { removeCombinedSi(comboSel.si); } catch (_) {}
              }
            } catch (_) {}
            areaSidebar.style.display = 'none';
          });
          grid.appendChild(btn);
        });
        areaSidebar.appendChild(grid);
        if (!document.body.contains(areaSidebar)) {
          document.body.appendChild(areaSidebar);
        }
        areaSidebar.style.display = 'flex';
      }, 0);
    });
    btnGrid.appendChild(abtn);
  });
  sidebar.appendChild(btnGrid);

  // Dismiss sidebar when clicking outside
  setTimeout(() => {
    function handler(e) {
      if (sidebar.style.display !== 'none' && !sidebar.contains(e.target)) {
        sidebar.style.display = 'none';
        document.removeEventListener('mousedown', handler);
      }
    }
    document.addEventListener('mousedown', handler);
  }, 100);

  if (!document.body.contains(sidebar)) {
    document.body.appendChild(sidebar);
  }
  sidebar.style.display = 'flex';
}
// --- Global helpers for PA+FL join/split (used by sidebar and renderers) ---
function _textFrom(elOrText) {
  if (!elOrText) return '';
  if (typeof elOrText === 'string') return elOrText;
  if (elOrText.textContent != null) return elOrText.textContent;
  return String(elOrText);
}
function isPA(elOrText){
  const t = _textFrom(elOrText);
  return /^\s*PA\s+\d+/i.test(t);
}
function isCombinedPA(elOrText){
  const t = _textFrom(elOrText);
  return /\bPA\s+\d+\s+mit\s+FL\s+\d+/i.test(t);
}
function parseCombined(elOrText){
  // Prefer dataset hints if present
  if (elOrText && elOrText.dataset && elOrText.dataset.combo === '1') {
    const pa = parseInt(elOrText.dataset.paNumber || '', 10);
    const fl = parseInt(elOrText.dataset.flNumber || '', 10);
    if (!isNaN(pa) && !isNaN(fl)) return { pa, fl };
  }
  const t = _textFrom(elOrText);
  const m = t.match(/PA\s+(\d+)\s+mit\s+FL\s+(\d+)/i);
  return m ? { pa: parseInt(m[1],10), fl: parseInt(m[2],10) } : null;
}
function decorateCombinedPAInline(btn, flNumber, flStyle){
  const baseText = _textFrom(btn);
  const baseMatch = baseText.match(/^\s*PA\s+\d+/i);
  const paTxt = baseMatch ? baseMatch[0] : (baseText && baseText.trim() ? baseText : 'PA');
  // Rebuild as two-segment melted button
  btn.innerHTML = '';
  btn.style.display = 'inline-flex';
  btn.style.alignItems = 'stretch';
  btn.style.padding = '0';
  btn.style.background = 'transparent';
  btn.style.borderRadius = '8px';
  const left = document.createElement('span');
  left.textContent = paTxt;
  left.style.background = '#111';
  left.style.color = '#bbb';
  left.style.padding = '6px 10px';
  left.style.borderTopLeftRadius = '8px';
  left.style.borderBottomLeftRadius = '8px';
  left.style.display = 'inline-flex';
  left.style.alignItems = 'center';
  const right = document.createElement('span');
  right.textContent = `FL ${flNumber}`;
  right.style.padding = '6px 10px';
  right.style.display = 'inline-flex';
  right.style.alignItems = 'center';
  if (flStyle === 'grey') {
    right.style.background = '#444';
    right.style.color = '#bbb';
  } else {
    right.style.background = '#bfa100';
    right.style.color = '#fff';
  }
  right.style.borderTopRightRadius = '8px';
  right.style.borderBottomRightRadius = '8px';
  const divider = document.createElement('span');
  divider.style.width = '1px';
  divider.style.background = 'rgba(255,255,255,0.2)';
  divider.style.margin = '0';
  btn.appendChild(left);
  btn.appendChild(divider);
  // Add an invisible separator containing the word ' mit ' so textContent() matches stored label
  const mitHiddenGlobal = document.createElement('span');
  mitHiddenGlobal.textContent = ' mit ';
  mitHiddenGlobal.style.display = 'none';
  btn.appendChild(mitHiddenGlobal);
  btn.appendChild(right);
  btn.classList.remove('combo-fl-gold','combo-fl-grey');
  btn.classList.add(flStyle === 'grey' ? 'combo-fl-grey' : 'combo-fl-gold');
  const paNumMatch = paTxt.match(/PA\s+(\d+)/i);
  if (paNumMatch) btn.dataset.paNumber = String(parseInt(paNumMatch[1],10));
  btn.dataset.flNumber = String(flNumber);
  btn.dataset.flStyle = flStyle === 'grey' ? 'grey' : 'gold';
  btn.dataset.combo = '1';
}
// --- Global SI helpers (mirror PA helpers) ---
function isSi(elOrText){
  const t = _textFrom(elOrText);
  return /^\s*Si\s+\d+/i.test(t);
}
function isCombinedSi(elOrText){
  // dataset hint or textual match
  if (elOrText && elOrText.dataset && elOrText.dataset.combo === '1' && elOrText.dataset.siNumber) return true;
  const t = _textFrom(elOrText);
  return /\bSi\s+\d+\s+mit\s+FL\s+\d+/i.test(t);
}
function parseCombinedSi(elOrText){
  if (elOrText && elOrText.dataset && elOrText.dataset.combo === '1') {
    const si = parseInt(elOrText.dataset.siNumber || '', 10);
    const fl = parseInt(elOrText.dataset.flNumber || '', 10);
    if (!isNaN(si) && !isNaN(fl)) return { si, fl };
  }
  const t = _textFrom(elOrText);
  const m = t.match(/Si\s+(\d+)\s+mit\s+FL\s+(\d+)/i);
  return m ? { si: parseInt(m[1],10), fl: parseInt(m[2],10) } : null;
}
function decorateCombinedSiInline(btn, flNumber, flStyle){
  const baseText = _textFrom(btn);
  const baseMatch = baseText.match(/^\s*Si\s+\d+/i);
  const siTxt = baseMatch ? baseMatch[0] : (baseText && baseText.trim() ? baseText : 'Si');
  btn.innerHTML = '';
  btn.style.display = 'inline-flex';
  btn.style.alignItems = 'stretch';
  btn.style.padding = '0';
  btn.style.background = 'transparent';
  btn.style.borderRadius = '8px';
  const left = document.createElement('span');
  left.textContent = siTxt;
  left.style.background = '#111';
  left.style.color = '#bfff00';
  left.style.padding = '6px 10px';
  left.style.borderTopLeftRadius = '8px';
  left.style.borderBottomLeftRadius = '8px';
  left.style.display = 'inline-flex';
  left.style.alignItems = 'center';
  const right = document.createElement('span');
  right.textContent = `FL ${flNumber}`;
  right.style.padding = '6px 10px';
  right.style.display = 'inline-flex';
  right.style.alignItems = 'center';
  if (flStyle === 'grey') {
    right.style.background = '#444';
    right.style.color = '#bbb';
  } else {
    right.style.background = '#bfa100';
    right.style.color = '#fff';
  }
  right.style.borderTopRightRadius = '8px';
  right.style.borderBottomRightRadius = '8px';
  const divider = document.createElement('span');
  divider.style.width = '1px';
  divider.style.background = 'rgba(255,255,255,0.2)';
  divider.style.margin = '0';
  btn.appendChild(left);
  // hidden separator so textContent contains ' mit '
  const mitHiddenSi = document.createElement('span');
  mitHiddenSi.textContent = ' mit ';
  mitHiddenSi.style.display = 'none';
  btn.appendChild(divider);
  btn.appendChild(mitHiddenSi);
  btn.appendChild(right);
  btn.classList.remove('combo-fl-gold','combo-fl-grey');
  btn.classList.add(flStyle === 'grey' ? 'combo-fl-grey' : 'combo-fl-gold');
  const siNumMatch = siTxt.match(/Si\s+(\d+)/i);
  if (siNumMatch) btn.dataset.siNumber = String(parseInt(siNumMatch[1],10));
  btn.dataset.flNumber = String(flNumber);
  btn.dataset.flStyle = flStyle === 'grey' ? 'grey' : 'gold';
  btn.dataset.combo = '1';
}
function updateRemovedFL(label, add){
  try {
    let arr = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]');
    arr = Array.isArray(arr) ? arr : [];
    const idx = arr.indexOf(label);
    if (add) { if (idx === -1) arr.push(label); }
    else { if (idx !== -1) arr.splice(idx,1); }
    localStorage.setItem('removed_fls_liste_atemluftflaschen', JSON.stringify(arr));
  } catch (_) {}
}
function computeAvailableFLNumbers(){
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html'
  ];
  const assigned = new Set();
  vehiclePages.forEach(page => {
    try {
      const moveables = JSON.parse(localStorage.getItem('moveables_' + page) || '[]');
      (moveables||[]).forEach(m => {
        if (m.areaId === 'fl' && m.label && /^FL\s+\d+/.test(m.label)) assigned.add(m.label.trim());
      });
    } catch (_) {}
  });
  let removedFLs = [];
  try { removedFLs = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]'); } catch (_) {}
  const removedSet = new Set(removedFLs);
  const goldenFL = [126,212,202,149,209,173,164,156,154,196,163,216,205,181,203,208,160,227,136,120,188,218,225,177,153,198,138,127,215,213,192,174,206,158,210,140,130,155,190,221,178,143,122,180,171,175,131,152,128,172,129,169,123,199,219,229,194,157,195,207,220,124,226,224,197,161,170,201,119,193,183,214,121,125,159,135,176,139,179,141,142,184,145,185,144,186,146,147,189,148,191,150,200,151,204,162,211,165,217,166,222,167,223,168,228,182,238,137,187,8,43,57,93,167,189,211,289];
  const greyFL = [73,24,61,22,85,19,71,70,1,102,16,82,26,29,9,46,17,72,53,86,84,116,118,40,8,51,11,57,33,59,66,93,79,81,44,42,4,6,10,12,13,14,15,18,20,21,23,25,27,28,30,31,32,34,35,36,43,48,49,52,56,60,64,65,67,69,75,76,77,78,87,88,91,95,100,101,104,105,107,108,109,110,111,112,113,114,115,117];
  const all = [...new Set([...goldenFL, ...greyFL])];
  const available = all.filter(num => !assigned.has(`FL ${num}`) && !removedSet.has(`FL ${num}`));
  const goldSet = new Set(goldenFL);
  return { available: available.sort((a,b)=>a-b), isGold: (n)=>goldSet.has(n) };
}
// --- Combined PA storage helpers (persist join state while still in Liste PA) ---
function getCombinedPAMap() {
  try {
    const arr = JSON.parse(localStorage.getItem('combined_pa_map_liste-pa') || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}
function saveCombinedPAMap(arr) {
  try { localStorage.setItem('combined_pa_map_liste-pa', JSON.stringify(arr || [])); } catch (_) {}
}
function upsertCombinedPA(pa, fl) {
  const arr = getCombinedPAMap();
  const idx = arr.findIndex(x => x && x.pa === pa);
  if (idx === -1) arr.push({ pa, fl }); else arr[idx] = { pa, fl };
  saveCombinedPAMap(arr);
}
function removeCombinedPA(pa) {
  const arr = getCombinedPAMap().filter(x => x && x.pa !== pa);
  saveCombinedPAMap(arr);
}
// --- Combined SI storage helpers (persist join state while still in Liste Si) ---
function getCombinedSiMap() {
  try {
    const arr = JSON.parse(localStorage.getItem('combined_si_map_liste-sicherheitstrupptaschen') || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (_) { return []; }
}
function saveCombinedSiMap(arr) {
  try { localStorage.setItem('combined_si_map_liste-sicherheitstrupptaschen', JSON.stringify(arr || [])); } catch (_) {}
}
function upsertCombinedSi(si, fl) {
  const arr = getCombinedSiMap();
  const idx = arr.findIndex(x => x && x.si === si);
  if (idx === -1) arr.push({ si, fl }); else arr[idx] = { si, fl };
  saveCombinedSiMap(arr);
}
function removeCombinedSi(si) {
  const arr = getCombinedSiMap().filter(x => x && x.si !== si);
  saveCombinedSiMap(arr);
}
// --- SPA Pages Object: All page definitions at top level ---
window.pages = {
  'hauptmenu': {
    title: 'Hauptmenü',
    buttons: [
      { label: 'Liste PA', page: 'liste-pa' },
      { label: 'Liste Atemluftflaschen', page: 'liste-atemluftflaschen' },
      { label: 'Liste Atemanschlüsse', page: 'liste-atemanschluesse' },
      { label: 'Liste Fluchthauben', page: 'liste-fluchthauben' },
      { label: 'Liste Technikflaschen', page: 'liste-technikflaschen' },
      { label: 'Liste Sicherheitstrupptaschen', page: 'liste-sicherheitstrupptaschen' },
  // ERK area removed
      { label: 'CSA', page: 'csa' },
      { label: 'Messgeräte', page: 'messgeraete' },
      { label: 'Atemschutzeinsatz', page: 'atemschutzeinsatz' },
      { label: 'Lager Hauptwache Container', page: 'lager-hauptwache-container' },
      { label: 'Silschede', page: 'silschede' },
      { label: 'Für Silschede', page: 'fuer-silschede' },
      { label: 'Von Silschede', page: 'von-silschede' },
      { label: '3 LFKat20', page: '3-lfkat20' },
      { label: '4 LF10 1', page: '4-lf10-1' },
      { label: '4 TLF3000 1', page: '4-tlf3000-1' },
      { label: '5 HLF20 1', page: '5-hlf20-1' },
      { label: 'GWG', page: 'gwg' },
      { label: 'AGW', page: 'AGW' },
      { label: 'Löschzug Milspe', page: 'loeschzug-milspe' },
      { label: 'Löschgruppe Külchen', page: 'loeschgruppe-kuelchen' },
      { label: 'Klutertbad', page: 'klutertbad' }
    ]
  },
  'uebersicht': {
    title: 'Übersicht',
    content: ''
  },
  'hauptwache': {
    title: 'Hauptwache',
    content: '' // Rendered by renderHauptwachePage
  },
  'lager-hauptwache': {
    title: 'Lager Hauptwache',
    content: `<div id="areas-container" class="card" style="margin-top:80px;"></div>`
  },
  '1-hlf20-1': {
    title: '1 HLF20 1',
    content: `<div id="areas-container" class="card" style="margin-top:80px;"></div>`
  },
  'liste-pa': {
    title: 'Liste PA',
    content: `<div class="card"><div id="pa-btn-list"></div></div>`
  },
  'nummern-psa': {
    title: 'Nummern PSA',
    content: `<div class="card"><div id="nummern-psa-root"></div></div>`
  },
  'liste-atemluftflaschen': {
    title: 'Liste Atemluftflaschen',
    content: `<div class="card"><div id="fl-btn-list"></div></div>`
  },
  'liste-atemanschluesse': {
    title: 'Liste Atemanschlüsse',
    content: `<div class="card"><div id="am-btn-list"></div></div>`
  },
  'liste-fluchthauben': {
    title: 'Liste Fluchthauben',
    content: `<div class="card"><div id="fh-btn-list"></div></div>`
  },
  'liste-technikflaschen': {
    title: 'Liste Technikflaschen',
    content: `<div class="card"><div id="tf-btn-list"></div></div>`
  },
  'liste-sicherheitstrupptaschen': {
    title: 'Liste Sicherheitstrupptaschen',
    content: `<div class="card"><div id="si-btn-list"></div></div>`
  },
  // ERK page removed
  
  'csa': {
    title: 'CSA',
    content: `<div class="card" id="app"></div>`
  },
  'messgeraete': {
    title: 'Messgeräte',
    content: `<h1 class="page-title">Messgeräte</h1>`
  },
  'atemschutzeinsatz': {
    title: 'Atemschutzeinsatz',
    content: `<div class="card center-col">
      <div id="einsatz-info-area" style="width:100%;max-width:900px;"></div>
      <form class="einsatz-form" style="width:100%;max-width:500px;display:flex;flex-direction:column;gap:16px;margin:16px 0 24px 0;">
        <label style="font-weight:600;">Einsatznummer:
          <input type="text" class="search-input" placeholder="Einsatznummer" style="width:100%;margin-top:6px;" />
        </label>
        <label style="font-weight:600;">Straße:
          <input type="text" class="search-input" placeholder="Straße" style="width:100%;margin-top:6px;" />
        </label>
        <label style="font-weight:600;">Ort:
          <input type="text" class="search-input" placeholder="Ort" style="width:100%;margin-top:6px;" />
        </label>
        <button type="button" class="btn btn-purple" id="btn-open-einsatz" style="margin-top:12px;font-size:1.1rem;">Einsatz eröffnen</button>
      </form>
      <button class="btn btn-grey" onclick="navigate('nummern-psa')">Nummern PSA</button>
    </div>`
  },
  'lager-hauptwache-container': {
    title: 'Lager AGW',
    content: `<div id="areas-container" class="card" style="margin-top:80px;"></div>`
  },
  'silschede': {
    title: 'In Silschede',
    content: `<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px">
      <button class="btn btn-blue" onclick="navigate('von-silschede')">Von Silschede</button>
      <button class="btn btn-blue" onclick="navigate('fuer-silschede')">Für Silschede</button>
    </div>
    <div id="areas-container" class="card" style="margin-top:8px;"></div>`
  },
  'fuer-silschede': {
    title: 'Für Silschede',
    content: `<div style="margin-top:80px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">
        <button class="btn btn-grey" onclick="navigate('silschede')">Zurück zu In Silschede</button>
      </div>
      <div id="areas-container" class="card"></div>
    </div>`
  },
  'von-silschede': {
    title: 'Von Silschede',
    content: `<div style="margin-top:80px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">
        <button class="btn btn-grey" onclick="navigate('silschede')">Zurück zu In Silschede</button>
      </div>
      <div id="areas-container" class="card"></div>
    </div>`
  },
  '3-lfkat20': {
    title: '3 LFKat20',
    content: `<div id="areas-container" class="card" style="margin-top:80px;"></div>`
  },
  '4-lf10-1': {
    title: '4 LF10 1',
    content: `<div id="areas-container" class="card" style="margin-top:80px;"></div>`
  },
  '4-tlf3000-1': {
    title: '4 TLF3000 1',
    content: `<div id="areas-container" class="card" style="margin-top:80px;"></div>`
  },
  '5-hlf20-1': {
    title: '5 HLF20 1',
    content: `<div id="areas-container" class="card" style="margin-top:80px;"></div>`
  },
  'gwg': {
    title: 'GWG',
    content: `<div id="areas-container"></div>`
  },
  'AGW': {
    title: 'AGW',
    content: `<div class="card center-col">
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="btn btn-black" onclick="navigate('hauptmenu')">Hauptmenu</button>
      </div>
  <!-- Title shown in header; removed duplicate page title here -->
      <div class="page-buttons" style="margin-bottom:18px">
    <button class="btn btn-grey" style="font-size:1.1rem" onclick="navigate('lager-hauptwache-container')">Lager AGW</button>
    <button class="btn btn-blue" style="font-size:1.1rem" onclick="navigate('silschede')">Silschede</button>
  <button class="btn btn-black" style="color:#c0c0c0;border:2px solid #777;font-size:1.1rem" onclick="navigate('liste-pa')">PA</button>
  <button class="btn fl-btn gold" style="background:#bfa100;color:#fff;border:2px solid #bfa100;font-weight:700;margin:6px;min-width:54px;min-height:44px;font-size:1.1rem" onclick="navigate('liste-atemluftflaschen')">Atemluftflaschen</button>
  <button class="btn am-btn" style="background:#fff;color:#000;border:1px solid #000;font-size:1.1rem" onclick="navigate('liste-atemanschluesse')">Atemanschlüsse</button>
  <button class="btn btn-black" style="color:var(--gold);border:2px solid #b8860b;font-size:1.1rem" onclick="navigate('liste-fluchthauben')">Fluchthauben</button>
  <button class="btn tf-btn" style="background:#176a2a;color:#fff;border:2px solid #15511f;font-size:1.1rem" onclick="navigate('liste-technikflaschen')">Technikflaschen</button>
  <button class="btn btn-black" style="color:lime;border:2px solid lime;font-size:1.1rem" onclick="navigate('liste-sicherheitstrupptaschen')">Sicherheitstrupptaschen</button>
  <!-- ERK Geräte removed -->
    <button class="btn" style="background:orange;color:#000;border:1px solid #000;font-size:1.1rem" onclick="navigate('csa')">CSA</button>
    <button class="btn" style="background:#6b3e26;color:#fff;border:1px solid #4e2b18;font-size:1.1rem" onclick="navigate('messgeraete')">Messgeräte</button>
      </div>
  <button class="btn btn-red-black" onclick="navigate('atemschutzeinsatz')" style="margin-bottom:12px">Atemschutzeinsatz</button>
      <div class="small-footer" style="margin-top:18px;text-align:center;color:#666;font-size:0.9rem">
        <span class="meta-muted">Automatisches Speichern aktiv. Änderungen werden sofort gesichert.</span>
      </div>
    </div>`
  },
  'loeschgruppe-voerde': {
    title: 'Löschgruppe Voerde',
    content: '' // Rendered by renderLoeschgruppeVoerdePage
  },
  'loeschzug-milspe': {
    title: 'Löschzug Milspe',
    content: `<div class="card" style="margin-top:80px;">
      <div class="page-title-row">
        <strong>Löschzug Milspe</strong>
        <div style="margin-left:auto">
          <button class="btn btn-small" id="vehicle-edit-btn">Fahrzeuge bearbeiten</button>
        </div>
      </div>
      <div id="vehicle-btns" style="display:flex;gap:12px;flex-wrap:wrap;margin:24px 0 0 0"></div>
    </div>`
  },
  'loeschgruppe-kuelchen': {
    title: 'Löschgruppe Külchen',
    content: '' // Rendered by renderLoeschgruppeKuelchenPage
  },
  'loeschgruppe-rueggeberg': {
    title: 'Löschgruppe Rüggeberg',
    content: '' // Rendered by renderLoeschgruppeRueggebergPage
  },
  'loeschgruppe-oberbauer': {
    title: 'Löschgruppe Oberbauer',
    content: '' // Rendered by renderLoeschgruppeOberbauerPage
  },
  'klutertbad': {
    title: 'Klutertbad',
    content: `<div id="areas-container" class="card" style="margin-top:80px;"></div>`
  }

};
// Auto-register vehicle pages from VEHICLE_LIST so each vehicle button opens an areas view
(function registerVehiclePages() {
  try {
    const list = Array.isArray(window.VEHICLE_LIST) ? window.VEHICLE_LIST : [];
    list.forEach(([title, file]) => {
      if (!file) return;
      const key = String(file).replace(/\.html$/i, '');
      if (!window.pages[key]) {
        window.pages[key] = {
          title: title || key,
          content: `<div id="areas-container" class="card" style="margin-top:80px;"></div>`
        };
      }
    });
  } catch (_) {}
})();
// Use area logic from areas.js; do not override here

// Simple SPA router
function navigate(page) {
  if (!window.pages[page]) page = 'hauptmenu';
  const proceed = () => {
    window.location.hash = '#' + page;
    renderPage(page);
    if (typeof window.setupGlobalSearch === 'function') {
      window.setupGlobalSearch();
    }
  };
  if (page !== 'hauptmenu' && !isAuthValid()) {
    requireAuthThen(proceed);
    return;
  }
  proceed();
}
// --- Overview (Übersicht) helpers ---
function renderOverviewVehicles() {
  const container = document.getElementById('overview-vehicles');
  if (!container) return;
  container.innerHTML = '';
  const items = [];
  // Built-in vehicles from VEHICLE_LIST
  (Array.isArray(window.VEHICLE_LIST) ? window.VEHICLE_LIST : []).forEach(([title, file]) => {
    if (!file) return;
    const key = String(file).replace(/\.html$/i, '');
    items.push({ label: title, page: key });
  });
  // Custom vehicles across all groups
  try {
    VEHICLE_GROUP_PAGES.forEach(g => {
      getCustomVehiclesForGroup(g).forEach(v => {
        items.push({ label: v.label, page: v.slug });
      });
    });
  } catch (_) {}
  // Dedupe by label (keep first occurrence)
  const seen = new Set();
  items.forEach(it => {
    if (seen.has(it.label)) return;
    seen.add(it.label);
    const btn = document.createElement('button');
    btn.textContent = it.label;
    btn.className = 'btn btn-black vehicle-btn';
    btn.addEventListener('click', () => navigate(it.page));
    container.appendChild(btn);
  });
  // Nudge search to index buttons
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    const event = new Event('input', { bubbles: true });
    searchInput.dispatchEvent(event);
  }
}

function collectAllVehicles() {
  const items = [];
  // built-ins
  (Array.isArray(window.VEHICLE_LIST) ? window.VEHICLE_LIST : []).forEach(([title, file]) => {
    if (!file) return;
    const pageKey = String(file).replace(/\.html$/i, '');
    const pageFile = pageKey + '.html';
    items.push({ label: title, pageKey, pageFile });
  });
  // customs
  try {
    VEHICLE_GROUP_PAGES.forEach(g => {
      getCustomVehiclesForGroup(g).forEach(v => {
        const pageKey = v.slug;
        const pageFile = v.slug + '.html';
        items.push({ label: v.label, pageKey, pageFile });
      });
    });
  } catch (_) {}
  // static location pages for Silschede
  items.push(
    { label: 'In Silschede', pageKey: 'silschede', pageFile: 'silschede.html' },
    { label: 'Für Silschede', pageKey: 'fuer-silschede', pageFile: 'fuer-silschede.html' },
    { label: 'Von Silschede', pageKey: 'von-silschede', pageFile: 'von-silschede.html' }
  );
  // dedupe by label then by pageKey
  const seen = new Set();
  const out = [];
  items.forEach(it => {
    const key = it.label + '|' + it.pageKey;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(it);
  });
  // sort by label naturally
  out.sort((a,b) => (a.label||'').localeCompare(b.label||'', 'de')); 
  return out;
}

function getAssignmentsForPage(pageFile) {
  let moveables = [];
  try { moveables = JSON.parse(localStorage.getItem('moveables_' + pageFile) || '[]'); } catch (e) {}
  const buckets = { PA: [], FL: [], FH: [], TF: [], Si: [], Other: [] };
  moveables.forEach(m => {
    const label = (m.label || '').trim();
    if (!label) return;
    if (label.startsWith('PA ')) buckets.PA.push(label);
    else if (label.startsWith('FL ')) buckets.FL.push(label);
    else if (label.startsWith('FH ')) buckets.FH.push(label);
    else if (label.startsWith('TF ')) buckets.TF.push(label);
    else if (label.startsWith('Si ')) buckets.Si.push(label);
  // ERK items are no longer treated as a separate area; fall through to Other
    else buckets.Other.push(label);
  });
  // For ERK show counts compactly later
  // Sort numerically where applicable
  const numSort = (a,b) => {
    const na = parseInt(a.replace(/[^0-9]/g,''),10); 
    const nb = parseInt(b.replace(/[^0-9]/g,''),10);
    if (isNaN(na) || isNaN(nb)) return (a||'').localeCompare(b||'', 'de');
    return na-nb;
  };
  ['PA','FL','FH','TF','Si'].forEach(k => buckets[k].sort(numSort));
  buckets.Other.sort((a,b)=>a.localeCompare(b,'de'));
  return buckets;
}

function renderInventoryOverview() {
  const container = document.getElementById('inventory-table-container');
  if (!container) return;
  // Build per-vehicle sections
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(260px, 1fr))';
  grid.style.gap = '12px';
  grid.style.width = '100%';
  const vehicles = collectAllVehicles();
  vehicles.forEach(v => {
    const buckets = getAssignmentsForPage(v.pageFile);
    const card = document.createElement('div');
    card.style.border = '1px solid #ddd';
    card.style.borderRadius = '10px';
    card.style.background = '#fff';
    card.style.padding = '10px 12px';
    card.style.breakInside = 'avoid-page';
    const title = document.createElement('div');
    title.textContent = v.label;
    title.style.fontWeight = '700';
    title.style.textDecoration = 'underline';
    title.style.marginBottom = '8px';
    card.appendChild(title);
    const rows = [
      ['PA', buckets.PA],
      ['FL', buckets.FL],
      ['FH', buckets.FH],
      ['TF', buckets.TF],
      ['Si', buckets.Si],
      ['Sonstiges', buckets.Other]
    ];
    rows.forEach(([label, list]) => {
      const arr = Array.isArray(list) ? list : [];
      let hasContent = false;
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'flex-start';
      row.style.gap = '8px';
      row.style.margin = '2px 0';
      const k = document.createElement('div');
      k.textContent = label + ':';
      k.style.minWidth = '88px';
      k.style.fontWeight = '600';
      const vDiv = document.createElement('div');
      vDiv.style.display = 'flex';
      vDiv.style.flexWrap = 'wrap';
      vDiv.style.gap = '6px';

      if (label !== 'ERK') {
        arr.forEach(txt => {
          const chip = document.createElement('span');
          chip.textContent = txt;
          chip.style.display = 'inline-block';
          chip.style.padding = '2px 6px';
          chip.style.border = '1px solid #bbb';
          chip.style.borderRadius = '6px';
          chip.style.background = '#f7f7f7';
          chip.style.fontSize = '0.9em';
          vDiv.appendChild(chip);
        });
        hasContent = arr.length > 0;
      }

      if (hasContent) {
        row.appendChild(k);
        row.appendChild(vDiv);
        card.appendChild(row);
      }
    });
    grid.appendChild(card);
  });
  container.appendChild(grid);
}
// --- Render Löschgruppe Voerde Page ---
function renderLoeschgruppeVoerdePage() {
  const main = document.getElementById('app-main');
  main.innerHTML = `
    <div class="card" style="margin-top:80px;">
      <div id="vehicle-btns-voerde" class="page-buttons">
        <button class="btn btn-black vehicle-btn" onclick="navigate('2-lf10-1')">2 LF10 1</button>
        <button class="btn btn-black vehicle-btn" onclick="navigate('2-rw-1')">2 RW 1</button>
      </div>
    </div>
    <div id="areas-container" class="card" style="margin-top:18px;"></div>
  `;
  enhanceVehicleSection('vehicle-btns-voerde', 'loeschgruppe-voerde');
  if (typeof window.setupGlobalSearch === 'function') {
    window.setupGlobalSearch();
  }
  try { renderVehiclePage('loeschgruppe-voerde'); } catch (_) {}
}

// Render a compact overview showing which pages have "Persoenliche Atemschutzmasken"
function renderPersonalMasksOverview() {
  const container = document.getElementById('personal-masks-overview');
  if (!container) return;
  container.innerHTML = '';
  const pagesWithPersonalMasks = [
    'hauptwache',
    'loeschzug-milspe',
    'loeschgruppe-voerde',
    'loeschgruppe-oberbauer',
    'loeschgruppe-rueggeberg',
    'loeschgruppe-kuelchen'
  ];

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
  grid.style.gap = '12px';

  pagesWithPersonalMasks.forEach(pageKey => {
    const pageTitle = (window.pages && window.pages[pageKey] && window.pages[pageKey].title) ? window.pages[pageKey].title : pageKey;
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem('moveables_' + pageKey + '.html') || '[]'); } catch (e) { moveables = []; }
    const personal = (moveables || []).filter(m => (m.areaId === 'persoenliche-atemschutzmasken' || m.areaId === 'persoenliche-atemschutzmasken') );
    const card = document.createElement('div');
    card.style.border = '1px solid #eee';
    card.style.borderRadius = '10px';
    card.style.background = '#fff';
    card.style.padding = '10px 12px';
    card.style.minHeight = '60px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '8px';

    const h = document.createElement('div');
    h.style.display = 'flex';
    h.style.justifyContent = 'space-between';
    h.style.alignItems = 'center';
    const title = document.createElement('div');
    title.textContent = pageTitle;
    title.style.fontWeight = '700';
    const count = document.createElement('div');
    count.textContent = personal.length ? `${personal.length}×` : '0';
    count.style.color = '#666';
    h.appendChild(title);
    h.appendChild(count);
    card.appendChild(h);

    if (personal.length) {
      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.flexWrap = 'wrap';
      wrap.style.gap = '6px';
      personal.forEach(m => {
        const chip = document.createElement('span');
        // Show the assigned label (likely AM N (Name))
        chip.textContent = (m.label || '').replace(/^AM\s+/, '');
        chip.style.display = 'inline-block';
        chip.style.padding = '4px 8px';
        chip.style.border = '1px solid #ddd';
        chip.style.borderRadius = '12px';
        chip.style.background = '#f7f7f7';
        chip.style.fontSize = '0.9rem';
        chip.title = m.label || '';
        wrap.appendChild(chip);
      });
      card.appendChild(wrap);
    } else {
      const none = document.createElement('div');
      none.textContent = 'keine persönlichen Masken';
      none.style.color = '#777';
      card.appendChild(none);
    }

    grid.appendChild(card);
  });

  container.appendChild(grid);
}
function renderHeader(page) {
  const el = document.getElementById('app-header');
  if (!el) return;
  const pageTitleSafe = (window && window.pages && window.pages[page] && window.pages[page].title) ? window.pages[page].title : String(page || '');
  el.innerHTML = `
    <div class="left-controls">
      <button class="btn btn-grey btn-small" onclick="navigate('uebersicht')">Übersicht</button>
      ${page !== 'hauptmenu' && page !== 'index' ? `<button class="btn btn-black btn-small" id="btn-hauptmenu">Hauptmenu</button>` : ''}
      <div class="meta" id="page-indicator">Seite: <strong id="current-page-name">${pageTitleSafe}</strong></div>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <div style="position:relative">
        <input id="global-search" class="search-input" placeholder="Suche (Seiten & Inhalte)..." />
        <div id="search-dropdown" style="display:none;position:absolute;right:0;top:38px;background:#fff;border:1px solid #eee;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.06);z-index:100;width:360px;max-width:90vw;overflow:auto"></div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-grey btn-small" id="btn-export">Backup download</button>
        <button class="btn btn-grey btn-small" id="btn-import">Restore backup</button>
        <input type="file" id="import-file" style="display:none" accept=".json"/>
      </div>
    </div>
  `;
  // Immediately wire export/import inputs (attach handlers now so clicks work even
  // if later wiring (global) doesn't run or is delayed).
  try {
    // Wire all export buttons on the page (some static pages include duplicates)
    const expBtns = Array.from(document.querySelectorAll('#btn-export'));
    expBtns.forEach(expBtn => {
      try { expBtn.addEventListener('click', (ev) => { ev.preventDefault(); exportBackup().catch(e=>{console.error(e); alert('Backup fehlgeschlagen: '+(e&&e.message))}); }); } catch (_) {}
    });

    // Ensure there's at least one file input to use for imports. If none exist, create one.
    let impInputs = Array.from(document.querySelectorAll('#import-file'));
    if (impInputs.length === 0) {
      const created = document.createElement('input');
      created.type = 'file';
      created.id = 'import-file';
      created.style.display = 'none';
      created.accept = '.json';
      document.body.appendChild(created);
      impInputs = [created];
    }

    // Wire all import buttons to trigger the first available file input
    const impBtns = Array.from(document.querySelectorAll('#btn-import'));
    impBtns.forEach(impBtn => {
      try { impBtn.addEventListener('click', (ev) => { ev.preventDefault(); (impInputs[0] && impInputs[0].click()); }); } catch (_) {}
    });

    // Wire change handler on all import inputs
    impInputs.forEach(impInput => {
      try {
        impInput.addEventListener('change', async (ev) => {
          const f = impInput.files && impInput.files[0];
          if (!f) return;
          try {
            const text = await f.text();
            const obj = JSON.parse(text);
            restoreBackupFromObject(obj);
          } catch (e) {
            console.error('restore error', e);
            alert('Fehler beim Wiederherstellen: ' + (e && e.message));
          } finally { impInput.value = ''; }
        });
      } catch (_) {}
    });
  } catch (_) {}
  // Add Hauptmenu button logic if not on hauptmenu or index
  if (page !== 'hauptmenu' && page !== 'index') {
    setTimeout(() => {
      const btn = document.getElementById('btn-hauptmenu');
      if (btn) {
        btn.addEventListener('click', () => {
          navigate('hauptmenu');
        });
      }
    }, 0);
  }
  // Setup global search after header is rendered
  if (typeof window.setupGlobalSearch === 'function') {
    window.setupGlobalSearch();
  }
}

// --- Global search implementation (migrated from script.js) ---
// This implementation lives inside spa.js so the SPA can fully control
// navigation and never open separate .html files.
function setupGlobalSearch() {
  const globalSearch = document.getElementById('global-search');
  const searchDropdown = document.getElementById('search-dropdown');
  if (!globalSearch || !searchDropdown) return;
  globalSearch.addEventListener('input', async () => {
    const q = globalSearch.value.trim().toLowerCase();
    if (!q) { searchDropdown.style.display = 'none'; searchDropdown.innerHTML = ''; return; }
    // Build the list of page files from SPA pages + custom vehicle map when available
    let files = [];
    try {
      if (window && window.pages) {
        files = Object.keys(window.pages).map(k => k + '.html');
      }
      if (window && window.CUSTOM_VEHICLE_MAP) {
        Object.values(window.CUSTOM_VEHICLE_MAP).forEach(f => {
          try { if (f && !files.includes(f)) files.push(f); } catch (_) {}
        });
      }
    } catch (e) {
      files = ['index.html'];
    }
    const results = [];
    // 1. Search assigned moveables stored in localStorage
    for (const file of files) {
      try {
        const moveablesKey = 'moveables_' + file;
        let moveables = [];
        try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) { moveables = []; }
        (moveables||[]).forEach(m => {
          if (m.label && m.label.toLowerCase().includes(q)) {
            results.push({type:'button', title: m.label, page: file, snippet: m.areaTitle || m.areaId || ''});
          }
        });
      } catch (e) {}
    }
    // Search some persistent removed-lists
    try {
      let removedPAs = JSON.parse(localStorage.getItem('removed_pas_liste_pa') || '[]');
      (removedPAs||[]).forEach(label => { if (label.toLowerCase().includes(q)) results.push({type:'button', title: label, page: 'liste-pa.html', snippet: 'Entfernt'}); });
    } catch (e) {}
    try {
      let removedTFs = JSON.parse(localStorage.getItem('removed_tfs_liste_technikflaschen') || '[]');
      (removedTFs||[]).forEach(label => { if (label.toLowerCase().includes(q)) results.push({type:'button', title: label, page: 'liste-technikflaschen.html', snippet: 'Entfernt'}); });
    } catch (e) {}

    // 2. Search SPA page definitions (avoid fetching separate HTML files)
    try {
      for (const file of files) {
        try {
          const pageKey = String(file).replace(/\.html$/i, '');
          if (pageKey === (window.location.hash.replace(/^#/, '') || '')) continue;
          const pageObj = (window && window.pages) ? window.pages[pageKey] : null;
          if (pageObj) {
            const title = String(pageObj.title || pageKey || '').trim();
            if (title && title.toLowerCase().includes(q)) results.push({ type: 'page', title, page: file, snippet: '' });
            const content = String(pageObj.content || '');
            if (content && content.toLowerCase().includes(q)) results.push({ type: 'page', title, page: file, snippet: '' });
            try {
              const tmp = document.createElement('div');
              tmp.innerHTML = content || '';
              Array.from(tmp.querySelectorAll('button')).forEach(b => {
                const lbl = (b.textContent || '').trim();
                if (lbl && lbl.toLowerCase().includes(q)) results.push({ type: 'button', title: lbl, page: file, snippet: '' });
              });
            } catch (_) {}
          }
        } catch (_) {}
      }
    } catch (e) {}

    if (results.length === 0) { searchDropdown.style.display = 'block'; searchDropdown.innerHTML = '<div style="padding:8px">Keine Ergebnisse</div>'; return; }
    searchDropdown.style.display = 'block';
    searchDropdown.innerHTML = results.map(r => {
      if (r.type === 'page') {
        return `<div class="list-item" data-type="page" data-page="${encodeURIComponent(r.page)}" style="cursor:pointer;padding:8px 10px"><strong>${r.title}</strong><div class='meta-muted'>Seite</div></div>`;
      } else {
        const snippetEncoded = encodeURIComponent(r.snippet || '');
        return `<div class="list-item" data-type="${encodeURIComponent(r.type || 'item')}" data-page="${encodeURIComponent(r.page)}" data-btn="${encodeURIComponent(r.title)}" data-snippet="${snippetEncoded}" style="cursor:pointer;padding:8px 10px"><strong>${r.title}</strong><div class='meta-muted'>${r.snippet ? 'Bereich: ' + r.snippet : ''}</div></div>`;
      }
    }).join('');

    Array.from(searchDropdown.querySelectorAll('.list-item')).forEach(n => n.addEventListener('click', () => {
      const type = n.getAttribute('data-type') || '';
      const pageRaw = decodeURIComponent(n.getAttribute('data-page'));
      const btn = n.getAttribute('data-btn') ? decodeURIComponent(n.getAttribute('data-btn')) : null;
      const snippet = n.getAttribute('data-snippet') ? decodeURIComponent(n.getAttribute('data-snippet')) : null;
      if (type === 'code') {
        try { searchDropdown.style.display = 'none'; globalSearch.value = '';
          let modal = document.getElementById('search-code-modal'); if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
          modal = document.createElement('div'); modal.id = 'search-code-modal'; modal.style.position = 'fixed'; modal.style.left = '0'; modal.style.top = '0'; modal.style.width = '100%'; modal.style.height = '100%'; modal.style.background = 'rgba(0,0,0,0.5)'; modal.style.zIndex = '2000'; modal.style.display = 'flex'; modal.style.alignItems = 'center'; modal.style.justifyContent = 'center';
          const box = document.createElement('div'); box.style.background = '#fff'; box.style.padding = '14px'; box.style.borderRadius = '8px'; box.style.maxWidth = '90%'; box.style.maxHeight = '80%'; box.style.overflow = 'auto';
          const h = document.createElement('div'); h.style.display = 'flex'; h.style.justifyContent = 'space-between'; h.style.alignItems = 'center'; const title = document.createElement('strong'); title.textContent = btn || pageRaw || 'Code snippet'; const close = document.createElement('button'); close.className = 'btn btn-small'; close.textContent = 'Schließen'; close.addEventListener('click', () => { modal.remove(); });
          h.appendChild(title); h.appendChild(close); box.appendChild(h);
          const pre = document.createElement('pre'); pre.style.whiteSpace = 'pre-wrap'; pre.style.fontSize = '0.9rem'; pre.style.marginTop = '8px'; pre.textContent = snippet || '';
          box.appendChild(pre); modal.appendChild(box); modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); }); document.body.appendChild(modal); return;
        } catch (e) { console.error(e); }
      }
      try {
        const pageKey = String(pageRaw).replace(/\.html$/i, '');
        if (window && window.pages && window.pages[pageKey]) {
          if (typeof window.navigate === 'function') window.navigate(pageKey); else window.location.hash = '#' + pageKey;
          if (btn) {
            setTimeout(() => {
              try {
                const all = Array.from(document.querySelectorAll('button'));
                const target = all.find(b => (b.textContent || '').trim() === btn.trim() || decodeURIComponent(b.textContent || '').trim() === btn.trim());
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  const orig = target.style.boxShadow; target.style.transition = 'box-shadow 160ms ease-in-out'; target.style.boxShadow = '0 0 0 6px rgba(255,215,0,0.9)'; setTimeout(() => { target.style.boxShadow = orig || 'none'; }, 1400);
                }
              } catch (e) {}
            }, 120);
          }
          searchDropdown.style.display = 'none'; globalSearch.value = ''; return;
        }
      } catch (e) {}
      (async () => {
        try {
          const pageKey = String(pageRaw).replace(/\.html$/i, '');
          let text = '';
          if (window && window.pages && window.pages[pageKey]) text = String(window.pages[pageKey].content || window.pages[pageKey].title || '');
          searchDropdown.style.display = 'none'; globalSearch.value = '';
          let viewer = document.getElementById('search-page-viewer'); if (viewer && viewer.parentNode) viewer.parentNode.removeChild(viewer);
          viewer = document.createElement('div'); viewer.id = 'search-page-viewer'; viewer.style.position = 'fixed'; viewer.style.left = '0'; viewer.style.top = '0'; viewer.style.width = '100%'; viewer.style.height = '100%'; viewer.style.background = 'rgba(0,0,0,0.6)'; viewer.style.zIndex = '2100'; viewer.style.display = 'flex'; viewer.style.alignItems = 'center'; viewer.style.justifyContent = 'center';
          const box = document.createElement('div'); box.style.background = '#fff'; box.style.padding = '12px'; box.style.borderRadius = '8px'; box.style.maxWidth = '92%'; box.style.maxHeight = '88%'; box.style.overflow = 'auto';
          const head = document.createElement('div'); head.style.display = 'flex'; head.style.justifyContent = 'space-between'; head.style.alignItems = 'center'; const title = document.createElement('strong'); title.textContent = pageRaw; const close = document.createElement('button'); close.className = 'btn btn-small'; close.textContent = 'Schließen'; close.addEventListener('click', () => { viewer.remove(); });
          const controls = document.createElement('div'); controls.appendChild(close); head.appendChild(title); head.appendChild(controls); box.appendChild(head);
          const pre = document.createElement('pre'); pre.style.whiteSpace = 'pre-wrap'; pre.style.fontSize = '0.9rem'; pre.style.marginTop = '8px'; pre.textContent = (text || '').slice(0, 10000) || 'Keine Vorschau verfügbar.'; box.appendChild(pre); viewer.appendChild(box); viewer.addEventListener('click', (ev) => { if (ev.target === viewer) viewer.remove(); }); document.body.appendChild(viewer); return;
        } catch (err) { searchDropdown.style.display = 'none'; globalSearch.value = ''; }
      })();
    }));
  });
  document.addEventListener('click', function(e) { if (!searchDropdown.contains(e.target) && e.target !== globalSearch) searchDropdown.style.display = 'none'; });
}

function renderPage(page) {
  renderHeader(page);
  const main = document.getElementById('app-main');
  // Cleanup floating PSA buttons when navigating between pages
  ['psa-book-fab','psa-back-fab'].forEach(id => {
    const el = document.getElementById(id);
    if (el && page !== 'nummern-psa') {
      try { el.remove(); } catch (_) {}
    }
  });
  const pageObj = window.pages[page];
  if (!pageObj) return;
  if (page === 'hauptmenu') {
    main.innerHTML = `
      <div class="card center-col">
        <h1 class="page-title">Hauptmenu</h1>
        <div class="main-grid" style="margin-bottom:18px">
          <button class="btn btn-grey" onclick="navigate('AGW')">AGW</button>
          <button class="btn btn-grey" onclick="navigate('hauptwache')">Hauptwache</button>
          <button class="btn btn-grey" onclick="navigate('loeschzug-milspe')">Löschzug Milspe (LZ 1)</button>
          <button class="btn btn-grey" onclick="navigate('loeschgruppe-voerde')">Löschgruppe Voerde (LG 2)</button>
          <button class="btn btn-grey" onclick="navigate('loeschgruppe-oberbauer')">Löschgruppe Oberbauer (LG 3)</button>
          <button class="btn btn-grey" onclick="navigate('loeschgruppe-rueggeberg')">Löschgruppe Rüggeberg (LG 4)</button>
          <button class="btn btn-grey" onclick="navigate('loeschgruppe-kuelchen')">Löschgruppe Külchen (LG 5)</button>
          <button class="btn btn-grey" onclick="navigate('klutertbad')">Klutertbad</button>
        </div>
        <div class="small-footer" style="margin-top:18px;text-align:center;color:#666;font-size:0.9rem">
          <span class="meta-muted">Automatisches Speichern aktiv. Änderungen werden sofort gesichert.</span>
        </div>
      </div>`;
    return;
  } else if (page === 'hauptwache') {
    renderHauptwachePage();
    return;
  } else if (page === 'loeschzug-milspe') {
    renderLoeschzugMilspePage();
    return;
  } else if (page === 'loeschgruppe-voerde') {
    renderLoeschgruppeVoerdePage();
    return;
  } else if (page === 'loeschgruppe-rueggeberg') {
    renderLoeschgruppeRueggebergPage();
    return;
  } else if (page === 'loeschgruppe-oberbauer') {
    renderLoeschgruppeOberbauerPage();
    return;
  } else if (page === 'loeschgruppe-kuelchen') {
    renderLoeschgruppeKuelchenPage();
    return;
  } else if (page === 'liste-pa') {
    main.innerHTML = `
      <div class="card center-col">
        <h1 class="page-title">${pageObj.title}</h1>
        ${pageObj.content || ''}
      </div>
    `;
    renderPAListePage();
  } else if (page === 'liste-atemluftflaschen') {
    main.innerHTML = `
      <div class="card center-col">
        <h1 class="page-title">${pageObj.title}</h1>
        ${pageObj.content || ''}
      </div>
    `;
    renderFLListePage();
  } else if (page === 'liste-technikflaschen') {
    main.innerHTML = `
      <div class="card center-col">
        <h1 class="page-title">${pageObj.title}</h1>
        ${pageObj.content || ''}
      </div>
    `;
    renderTFListePage();
  } else if (page === 'liste-atemanschluesse') {
    main.innerHTML = `
      <div class="card center-col">
        <h1 class="page-title">${pageObj.title}</h1>
        ${pageObj.content || ''}
      </div>
    `;
    renderAMListePage();
  } else if (page === 'liste-fluchthauben') {
    main.innerHTML = `
      <div class="card center-col">
        <h1 class="page-title">${pageObj.title}</h1>
        ${pageObj.content || ''}
      </div>
    `;
    renderFHListePage();
  } else if (page === 'liste-sicherheitstrupptaschen') {
    main.innerHTML = `
      <div class="card center-col">
        <h1 class="page-title">${pageObj.title}</h1>
        ${pageObj.content || ''}
      </div>
    `;
    renderSIListePage();
  } else if (page === 'nummern-psa') {
    main.innerHTML = `
      <div class="card center-col">
        <h1 class="page-title">${pageObj.title}</h1>
        ${pageObj.content || ''}
      </div>
    `;
    renderNummernPSAPage();
  } else if (page === 'atemschutzeinsatz') {
    main.innerHTML = `
      <div class="card center-col">
        <h1 class="page-title">${pageObj.title}</h1>
        ${pageObj.content || ''}
      </div>
    `;
    initAtemschutzEinsatzPage();
  } else if (page === 'uebersicht') {
    main.innerHTML = `
      <div class="card center-col">
        <h1 class="page-title">Übersicht</h1>
        <div style=\"width:100%;max-width:1200px;margin-top:24px\">
          <div style=\"display:flex;align-items:center;gap:12px;justify-content:space-between\">
            <h2 class=\"page-title\" style=\"margin:0\">Inventar-Übersicht (druckbar)</h2>
            <button id=\"btn-print-inventory\" class=\"btn btn-grey\" title=\"Druckansicht öffnen\">Drucken</button>
          </div>
          <div id=\"inventory-table-container\" style=\"width:100%;overflow:auto;margin-top:8px\"></div>
          <div id=\"personal-masks-overview\" style=\"width:100%;margin-top:16px\"></div>
        </div>
        <div class=\"small-footer\" style=\"margin-top:18px;text-align:center;color:#666;font-size:0.9rem\">
          <span class=\"meta-muted\">Automatisches Speichern aktiv. Änderungen werden sofort gesichert.</span>
        </div>
      </div>
    `;
    renderInventoryOverview();
    // Render personal masks overview (locations and assigned names)
    try { renderPersonalMasksOverview(); } catch (_) {}
    const printBtn = document.getElementById('btn-print-inventory');
    if (printBtn) printBtn.addEventListener('click', () => window.print());
  } else {
    main.innerHTML = `
      <div class="card center-col">
        <h1 class="page-title">${pageObj.title}</h1>
        ${pageObj.content || ''}
      </div>
    `;
    // If this page contains an areas container, render vehicle areas
    if (document.getElementById('areas-container')) {
      renderVehiclePage(page);
    }
  }
}

// Register a simple service worker to enable Add-to-Home-Screen standalone behavior
try {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('ServiceWorker registered', reg.scope);
    }).catch(err => {
      console.warn('ServiceWorker registration failed:', err);
    });
  }
} catch (_) {}

// Fix for iOS/Android mobile viewports: expose a CSS --vh unit representing 1% of the
// current innerHeight so we can size fullscreen elements reliably despite dynamic
// browser chrome (addressing the problem where 100vh doesn't match visible viewport).
(function watchViewportHeight() {
  try {
    function updateVh() {
      try {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      } catch (_) {}
    }
    updateVh();
    window.addEventListener('resize', updateVh, { passive: true });
    window.addEventListener('orientationchange', updateVh, { passive: true });
    document.addEventListener('visibilitychange', function() { if (document.visibilityState === 'visible') updateVh(); });
  } catch (_) {}
})();
// --- Vehicle page renderer: builds areas and restores assigned moveables ---
function renderVehiclePage(page) {
  const mainContainer = document.getElementById('areas-container');
  if (!mainContainer) return;
  // Define current page file for areas.js dblclick logic
  const pageFile = page.endsWith('.html') ? page : page + '.html';
  window.currentPageFile = pageFile;
  // Build areas
  if (typeof window.createAllAreas === 'function') {
    // Clear and recreate areas
    mainContainer.innerHTML = '';
    window.createAllAreas(mainContainer);
  }
  // Only show the personal masks area on a selected set of pages
  try {
    const personalAreaId = 'persoenliche-atemschutzmasken';
    const pagesWithPersonalMasks = new Set([
      'hauptwache',
      'loeschzug-milspe',
      'loeschgruppe-voerde',
      'loeschgruppe-oberbauer',
      'loeschgruppe-rueggeberg',
      'loeschgruppe-kuelchen'
    ]);
    if (pagesWithPersonalMasks.has(page)) {
      // Keep only the personal masks area on these pages
      Array.from(mainContainer.querySelectorAll('.moveable-area')).forEach(area => {
        try {
          if (area.dataset && area.dataset.areaId !== personalAreaId) {
            if (area.parentNode) area.parentNode.removeChild(area);
            if (window.areas && window.areas[area.dataset.areaId]) delete window.areas[area.dataset.areaId];
          }
        } catch (_) {}
      });
    } else {
      // Remove the personal masks area on other pages
      const el = mainContainer.querySelector(`.moveable-area[data-area-id="${personalAreaId}"]`);
      if (el && el.parentNode) el.parentNode.removeChild(el);
      if (window.areas && window.areas[personalAreaId]) delete window.areas[personalAreaId];
    }
  } catch (_) {}
  // Restore assigned moveables for this page
  let moveables = [];
  try { moveables = JSON.parse(localStorage.getItem('moveables_' + pageFile) || '[]'); } catch (e) {}
  moveables.forEach(m => {
  const areaRoot = (typeof window.getArea === 'function' ? window.getArea(m.areaId) : null) ||
           mainContainer.querySelector(`.moveable-area[data-area-id="${m.areaId}"]`);
  if (!areaRoot) return;
  // Use the area root element as container (restore original behavior)
  const areaEl = areaRoot;
  const btn = document.createElement('button');
    // If this is a combined PA label, render with a badge using stored className
    if (/^PA\s+\d+\s+mit\s+FL\s+\d+$/i.test(m.label || '')) {
      const match = (m.label||'').match(/PA\s+(\d+)\s+mit\s+FL\s+(\d+)/i);
      if (match) {
        const paNum = match ? parseInt(match[1],10) : null;
        const flNum = match ? parseInt(match[2],10) : null;
        const styleKind = (m.className||'').includes('combo-fl-gold') ? 'gold' : ((m.className||'').includes('combo-fl-grey') ? 'grey' : null);
        if (paNum && flNum && styleKind) {
          // Ensure the decorator can read the PA part: set a simple text before decorating
          btn.textContent = `PA ${paNum}`;
          decorateCombinedPAInline(btn, flNum, styleKind);
          // Keep a machine-readable copy of the full label so other code can match exactly if needed
          try { btn.dataset.fullLabel = m.label; } catch (_) {}
        } else {
          btn.textContent = m.label || 'Item';
        }
      } else {
        btn.textContent = m.label || 'Item';
      }
    } else if (/^Si\s+\d+\s+mit\s+FL\s+\d+$/i.test(m.label || '')) {
      // Combined Si + FL stored label (restore with decorator)
      const match = (m.label||'').match(/Si\s+(\d+)\s+mit\s+FL\s+(\d+)/i);
      if (match) {
        const siNum = match ? parseInt(match[1],10) : null;
        const flNum = match ? parseInt(match[2],10) : null;
        const styleKind = (m.className||'').includes('combo-fl-gold') ? 'gold' : ((m.className||'').includes('combo-fl-grey') ? 'grey' : null);
        if (siNum && flNum && styleKind) {
          btn.textContent = `Si ${siNum}`;
          decorateCombinedSiInline(btn, flNum, styleKind);
          try { btn.dataset.fullLabel = m.label; } catch (_) {}
        } else {
          btn.textContent = m.label || 'Item';
        }
      } else {
        btn.textContent = m.label || 'Item';
      }
    } else {
      btn.textContent = m.label || 'Item';
    }
    btn.className = m.className || 'btn';
    if (m.style) btn.setAttribute('style', m.style);
    areaEl.appendChild(btn);
    if (typeof window.makeButtonMoveable === 'function') {
      // Determine the original home area id so dblclick can return the button there.
      // Prefer the stored fromPage, fall back to label prefixes.
      let homeArea = null;
      try {
        const from = (m.fromPage || '').replace(/\.html$/i, '');
        if (from.includes('liste-atemluftflaschen') || from.includes('liste-atemluftflaschen')) homeArea = 'fl-btn-list';
        else if (from.includes('liste-pa') || from.includes('liste-pa')) homeArea = 'pa-btn-list';
        else if (from.includes('liste-sicherheitstrupptaschen') || from.includes('liste-sicherheitstrupptaschen')) homeArea = 'si-btn-list';
        else if (from.includes('liste-technikflaschen') || from.includes('liste-technikflaschen')) homeArea = 'tf-btn-list';
  else if (from.includes('liste-fluchthauben') || from.includes('liste-fluchthauben')) homeArea = 'fh-btn-list';
  else if (from.includes('liste-atemanschluesse') || from.includes('liste-atemanschluesse')) homeArea = 'am-btn-list';
        // ERK list removed — no special home area
      } catch (_) {}
      if (!homeArea) {
        const lbl = (m.label || '').trim();
        if (lbl.startsWith('FL ')) homeArea = 'fl-btn-list';
        else if (lbl.startsWith('PA ')) homeArea = 'pa-btn-list';
        else if (lbl.startsWith('Si ')) homeArea = 'si-btn-list';
  else if (lbl.startsWith('TF ')) homeArea = 'tf-btn-list';
  else if (lbl.startsWith('FH ')) homeArea = 'fh-btn-list';
  else if (lbl.startsWith('AM ')) homeArea = 'am-btn-list';
        // ERK labels no longer have a dedicated home list
      }
      // Default to the stored area id if we still don't know
      if (!homeArea) homeArea = m.areaId || null;
      try { window.makeButtonMoveable(btn, homeArea); } catch (_) { if (window.makeButtonMoveable) window.makeButtonMoveable(btn, homeArea); }
      // The button is currently placed on a vehicle area; ensure currentArea reflects that
      try { btn.dataset.currentArea = m.areaId || btn.dataset.currentArea || ''; } catch (_) {}
    }
  });
}
// --- Example: render FL and TF pages with moveable buttons and sidebar ---
function renderFLListePage() {
  // Golden and grey FL numbers (source from standalone HTML)
  const goldenFL = [126,212,202,149,209,173,164,156,154,196,163,216,205,181,203,208,160,227,136,120,188,218,225,177,153,198,138,127,215,213,192,174,206,158,210,140,130,155,190,221,178,143,122,180,171,175,131,152,128,172,129,169,123,199,219,229,194,157,195,207,220,124,226,224,197,161,170,201,119,193,183,214,121,125,159,135,176,139,179,141,142,184,145,185,144,186,146,147,189,148,191,150,200,151,204,162,211,165,217,166,222,167,223,168,228,182,238,137,187,8,43,57,93,167,189,211,289];
  const greyFL = [73,24,61,22,85,19,71,70,1,102,16,82,26,29,9,46,17,72,53,86,84,116,118,40,8,51,11,57,33,59,66,93,79,81,44,42,4,6,10,12,13,14,15,18,20,21,23,25,27,28,30,31,32,34,35,36,43,48,49,52,56,60,64,65,67,69,75,76,77,78,87,88,91,95,100,101,104,105,107,108,109,110,111,112,113,114,115,117];
  let assignedFLLabels = [];
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html'
  ];
  vehiclePages.forEach(page => {
    const moveablesKey = 'moveables_' + page;
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
    moveables.forEach(m => {
      if (m.areaId === 'fl' && m.label && m.label.startsWith('FL ')) {
        assignedFLLabels.push(m.label.trim());
      }
    });
  });
  // Also filter out FLs that have been removed from this page (persistently)
  let removedFLs = [];
  try { removedFLs = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]'); } catch (e) {}

  // Only render unassigned FL buttons in the list
  const unassignedGolden = goldenFL.filter(num => {
    const label = `FL ${num}`;
    return !assignedFLLabels.includes(label) && !removedFLs.includes(label);
  });
  const unassignedGrey = greyFL.filter(num => {
    const label = `FL ${num}`;
    return !assignedFLLabels.includes(label) && !removedFLs.includes(label);
  });

  const container = document.getElementById('fl-btn-list');
  if (container) container.innerHTML = '';
  // Register the fl-btn-list as a moveable area (for home logic)
  let flBtnListArea = container;
  if (container && !container.classList.contains('moveable-area')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'moveable-area';
    wrapper.dataset.areaId = 'fl-btn-list';
    container.parentNode.insertBefore(wrapper, container);
    wrapper.appendChild(container);
    flBtnListArea = wrapper;
  }
  if (window.registerArea) window.registerArea('fl-btn-list', flBtnListArea);
  if (window.renderMoveableButtons) {
    // Golden
    window.renderMoveableButtons(container, unassignedGolden, 'FL', 'fl-btn fl-gold', function(btn, num) {
      btn.style.border = '2px solid #bfa100';
      btn.style.color = '#fff';
      btn.style.background = '#bfa100';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'fl-btn-list');
    });
    // Grey
    window.renderMoveableButtons(container, unassignedGrey, 'FL', 'fl-btn fl-grey', function(btn, num) {
      btn.style.border = '2px solid #888';
      btn.style.color = '#bbb';
      btn.style.background = '#444';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'fl-btn-list');
    });
    // Update global search highlighting after render
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  }

  // Render removed FLs in the FL area (if present on this page)
  const flArea = document.querySelector('.moveable-area[data-area-id="fl"] .area-content');
  if (flArea) flArea.innerHTML = '';
  if (flArea) {
    const removedButNotAssigned = removedFLs.filter(label => !assignedFLLabels.includes(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('FL ', ''), 10)).filter(n => !isNaN(n));
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      btn.textContent = 'FL ' + num;
      btn.className = 'btn fl-btn fl-grey';
      btn.style.border = '2px solid #888';
      btn.style.color = '#bbb';
      btn.style.background = '#444';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      const dblclickHandler = function() {
        let removedFLs = [];
        try { removedFLs = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]'); } catch (e) {}
        const label = 'FL ' + num;
        const idx = removedFLs.indexOf(label);
        if (idx !== -1) {
          removedFLs.splice(idx, 1);
          localStorage.setItem('removed_fls_liste_atemluftflaschen', JSON.stringify(removedFLs));
          renderFLListePage();
        }
      };
      btn.addEventListener('dblclick', dblclickHandler);
      // Enable double-tap emulation for mobile devices
      if (typeof window.enableDoubleTapEmulation === 'function') {
        window.enableDoubleTapEmulation(btn, dblclickHandler);
      }
      flArea.appendChild(btn);
    });
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  }
}

function renderTFListePage() {
  // Correct TF numbers and styles from original HTML
  const tfNumbers = [117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136];
  let assignedTFLabels = [];
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html'
  ];
  vehiclePages.forEach(page => {
    const moveablesKey = 'moveables_' + page;
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
    moveables.forEach(m => {
      if (m.areaId === 'technikflaschen' && m.label && m.label.startsWith('TF ')) {
        assignedTFLabels.push(m.label.trim());
          }
    });
  });  

  // ...existing code...
  let removedTFs = [];
  try { removedTFs = JSON.parse(localStorage.getItem('removed_tfs_liste_technikflaschen') || '[]'); } catch (e) {}
  const unassignedTFNumbers = tfNumbers.filter(num => {
    const label = `TF ${num}`;
    return !assignedTFLabels.includes(label) && !removedTFs.includes(label);
  });
  const container = document.getElementById('tf-btn-list');
  if (container) container.innerHTML = '';
  let tfBtnListArea = container;
  if (container && !container.classList.contains('moveable-area')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'moveable-area';
    wrapper.dataset.areaId = 'tf-btn-list';
    container.parentNode.insertBefore(wrapper, container);
    wrapper.appendChild(container);
    tfBtnListArea = wrapper;
  }
  if (window.registerArea) window.registerArea('tf-btn-list', tfBtnListArea);
  if (window.renderMoveableButtons) {
    window.renderMoveableButtons(container, unassignedTFNumbers, 'TF', 'tf-btn', function(btn, num) {
      btn.style.border = '2px solid #176a2a';
      btn.style.color = '#fff';
      btn.style.background = '#176a2a';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'tf-btn-list');
    });
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  }
  
  const technikflaschenArea = document.querySelector('.moveable-area[data-area-id="technikflaschen"] .area-content');
  if (technikflaschenArea) technikflaschenArea.innerHTML = '';
  if (technikflaschenArea && window.renderMoveableButtons) {
    const removedButNotAssigned = removedTFs.filter(label => !assignedTFLabels.includes(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('TF ', ''), 10)).filter(n => !isNaN(n));
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      btn.textContent = 'TF ' + num;
      btn.className = 'btn tf-btn';
      btn.style.border = '2px solid #176a2a';
      btn.style.color = '#fff';
      btn.style.background = '#176a2a';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      const dblclickHandler = function(e) {
        let removedTFs = [];
        try { removedTFs = JSON.parse(localStorage.getItem('removed_tfs_liste_technikflaschen') || '[]'); } catch (e) {}
        const label = 'TF ' + num;
        const idx = removedTFs.indexOf(label);
        if (idx !== -1) {
          removedTFs.splice(idx, 1);
          localStorage.setItem('removed_tfs_liste_technikflaschen', JSON.stringify(removedTFs));
          renderTFListePage();
        }
      };
      btn.addEventListener('dblclick', dblclickHandler);
      // Enable double-tap emulation for mobile devices
      if (typeof window.enableDoubleTapEmulation === 'function') {
        window.enableDoubleTapEmulation(btn, dblclickHandler);
      }
      technikflaschenArea.appendChild(btn);
    });
    // After rendering, re-dispatch input event on search bar to update search results
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    
    }
  }
}
// --- SPA-specific: render Fluchthauben (FH) list page ---
function renderFHListePage() {
  // Numbers from original liste-fluchthauben.html
  const fhNumbers = [320,322,339,337,355,358,351,350,356,346,347,358,317,335,330,336,340,352,302,303,304,305,306,307,308,310,311,314,315,316,317,319,321,323,325,324,326,327,328,329,331,332,333,334,338,341,343,345,344,348,349,354,357,301,315];
  let assignedFHLabels = [];
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html'
  ];
  vehiclePages.forEach(page => {
    const moveablesKey = 'moveables_' + page;
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
    moveables.forEach(m => {
      // Accept both 'fluchthauben' (SPA) and legacy 'fh' area ids
      if ((m.areaId === 'fluchthauben' || m.areaId === 'fh') && m.label && m.label.startsWith('FH ')) {
        assignedFHLabels.push(m.label.trim());
      }
    });
  });

  let removedFHs = [];
  try { removedFHs = JSON.parse(localStorage.getItem('removed_fhs_liste_fluchthauben') || '[]'); } catch (e) {}

  const unassignedFHNumbers = fhNumbers.filter(num => {
    const label = `FH ${num}`;
    return !assignedFHLabels.includes(label) && !removedFHs.includes(label);
  });

  const container = document.getElementById('fh-btn-list');
  if (container) container.innerHTML = '';
  let fhBtnListArea = container;
  if (container && !container.classList.contains('moveable-area')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'moveable-area';
    wrapper.dataset.areaId = 'fh-btn-list';
    container.parentNode.insertBefore(wrapper, container);
    wrapper.appendChild(container);
    fhBtnListArea = wrapper;
  }
  if (window.registerArea) window.registerArea('fh-btn-list', fhBtnListArea);

  if (window.renderMoveableButtons) {
    window.renderMoveableButtons(container, unassignedFHNumbers, 'FH', 'fh-btn', function(btn, num) {
      btn.style.border = '2px solid #bfa100';
      btn.style.color = '#bfa100';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'fh-btn-list');
    });
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  }

  // Optional: show removed-but-not-assigned FH items in the Fluchthauben area
  const fhArea = document.querySelector('.moveable-area[data-area-id="fluchthauben"] .area-content');
  if (fhArea) fhArea.innerHTML = '';
  if (fhArea) {
    const removedButNotAssigned = removedFHs.filter(label => !assignedFHLabels.includes(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('FH ', ''), 10)).filter(n => !isNaN(n));
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      btn.textContent = 'FH ' + num;
      btn.className = 'btn fh-btn';
      btn.style.border = '2px solid #bfa100';
      btn.style.color = '#bfa100';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      const dblclickHandler = function() {
        let removedFHs = [];
        try { removedFHs = JSON.parse(localStorage.getItem('removed_fhs_liste_fluchthauben') || '[]'); } catch (e) {}
        const label = 'FH ' + num;
        const idx = removedFHs.indexOf(label);
        if (idx !== -1) {
          removedFHs.splice(idx, 1);
          localStorage.setItem('removed_fhs_liste_fluchthauben', JSON.stringify(removedFHs));
          renderFHListePage();
        }
      };
      btn.addEventListener('dblclick', dblclickHandler);
      // Enable double-tap emulation for mobile devices
      if (typeof window.enableDoubleTapEmulation === 'function') {
        window.enableDoubleTapEmulation(btn, dblclickHandler);
      }
      fhArea.appendChild(btn);
    });
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  }
}

// --- SPA-specific: render Atemanschluesse (AM) list page ---
function renderAMListePage() {
  // AM numbers 1..264
  const amNumbers = Array.from({length: 264}, (_,i) => i+1);
  let assignedAMLabels = [];
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html'
  ];
  vehiclePages.forEach(page => {
    const moveablesKey = 'moveables_' + page;
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
    moveables.forEach(m => {
      if ((m.areaId === 'atemanschluesse' || m.areaId === 'am') && m.label && m.label.startsWith('AM ')) {
        assignedAMLabels.push(m.label.trim());
      }
    });
  });

  let removedAMs = [];
  try { removedAMs = JSON.parse(localStorage.getItem('removed_ams_liste_atemanschluesse') || '[]'); } catch (e) {}

  const unassignedAMNumbers = amNumbers.filter(num => {
    const label = `AM ${num}`;
    return !assignedAMLabels.includes(label) && !removedAMs.includes(label);
  });

  const container = document.getElementById('am-btn-list');
  if (container) container.innerHTML = '';
  let amBtnListArea = container;
  if (container && !container.classList.contains('moveable-area')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'moveable-area';
    wrapper.dataset.areaId = 'am-btn-list';
    container.parentNode.insertBefore(wrapper, container);
    wrapper.appendChild(container);
    amBtnListArea = wrapper;
  }
  if (window.registerArea) window.registerArea('am-btn-list', amBtnListArea);

  if (window.renderMoveableButtons) {
    window.renderMoveableButtons(container, unassignedAMNumbers, 'AM', 'am-btn', function(btn, num) {
      // white background, black text
      btn.style.border = '1px solid #000';
      btn.style.color = '#000';
      btn.style.background = '#fff';
      btn.style.fontWeight = '600';
      btn.style.margin = '6px';
      btn.style.minWidth = '48px';
      btn.style.minHeight = '40px';
      btn.style.fontSize = '1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'am-btn-list');
    });
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  }

  const amAreaContent = document.querySelector('.moveable-area[data-area-id="atemanschluesse"] .area-content');
  if (amAreaContent) amAreaContent.innerHTML = '';
  if (amAreaContent) {
    const removedButNotAssigned = removedAMs.filter(label => !assignedAMLabels.includes(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('AM ', ''), 10)).filter(n => !isNaN(n));
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      btn.textContent = 'AM ' + num;
      btn.className = 'btn am-btn';
      btn.style.border = '1px solid #000';
      btn.style.color = '#000';
      btn.style.background = '#fff';
      btn.style.fontWeight = '600';
      btn.style.margin = '6px';
      btn.style.minWidth = '48px';
      btn.style.minHeight = '40px';
      btn.style.fontSize = '1rem';
      const dblclickHandler = function(e) {
        let removedAMs = [];
        try { removedAMs = JSON.parse(localStorage.getItem('removed_ams_liste_atemanschluesse') || '[]'); } catch (e) {}
        const label = 'AM ' + num;
        const idx = removedAMs.indexOf(label);
        if (idx !== -1) {
          removedAMs.splice(idx, 1);
          localStorage.setItem('removed_ams_liste_atemanschluesse', JSON.stringify(removedAMs));
          renderAMListePage();
        }
      };
      btn.addEventListener('dblclick', dblclickHandler);
      // Enable double-tap emulation for mobile devices
      if (typeof window.enableDoubleTapEmulation === 'function') {
        window.enableDoubleTapEmulation(btn, dblclickHandler);
      }
      amAreaContent.appendChild(btn);
    });
  }
}
// --- SPA-specific: render ERK Geräte list page ---
// ERK list page and renderer removed — ERK is no longer a separate SPA page or area.
// --- SPA-specific: render Nummern PSA page ---
function renderNummernPSAPage() {
  const root = document.getElementById('nummern-psa-root');
  if (!root) return;
  root.innerHTML = '';

  // Define groups and ranges exactly as in nummern-psa.html
  const groups = [
    { title: 'Hauptwache', from: 1, to: 60 },
    { title: 'LZ 1', from: 100, to: 140 },
    { title: 'LG 2', from: 200, to: 240 },
    { title: 'LG 3', from: 300, to: 400 },
    { title: 'LG 4', from: 400, to: 440 },
    { title: 'LG 5', from: 500, to: 540 }
  ];

  // In-memory selection set (persists while on this page)
  const selected = new Set();
  const numToBtn = new Map();

  // Helper: big fat black X overlay to mark as booked
  function applyCross(btn, on) {
    if (!btn) return;
    const SIZE = parseInt(btn.dataset.size || '44', 10);
    const thickness = Math.max(6, Math.round(SIZE * 0.16));
    if (on) {
      btn.dataset.booked = '1';
      btn.style.position = 'relative';
      // Clear selection ring
      btn.style.boxShadow = 'none';
      // Add two crossing lines if not present
      if (!btn.querySelector('.x-line-1')) {
        const l1 = document.createElement('div');
        l1.className = 'x-line-1';
        l1.style.position = 'absolute';
        l1.style.top = '50%';
        l1.style.left = '50%';
        l1.style.width = Math.round(SIZE * 0.9) + 'px';
        l1.style.height = thickness + 'px';
        l1.style.background = '#000';
        l1.style.transform = 'translate(-50%, -50%) rotate(45deg)';
        l1.style.borderRadius = '4px';
        l1.style.pointerEvents = 'none';
        btn.appendChild(l1);
      }
      if (!btn.querySelector('.x-line-2')) {
        const l2 = document.createElement('div');
        l2.className = 'x-line-2';
        l2.style.position = 'absolute';
        l2.style.top = '50%';
        l2.style.left = '50%';
        l2.style.width = Math.round(SIZE * 0.9) + 'px';
        l2.style.height = thickness + 'px';
        l2.style.background = '#000';
        l2.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
        l2.style.borderRadius = '4px';
        l2.style.pointerEvents = 'none';
        btn.appendChild(l2);
      }
    } else {
      btn.removeAttribute('data-booked');
      const l1 = btn.querySelector('.x-line-1');
      const l2 = btn.querySelector('.x-line-2');
      if (l1) l1.remove();
      if (l2) l2.remove();
    }
  }

  const container = document.createElement('div');
  container.className = 'psa-container-spa';
  // Arrange groups as full-width rows stacked vertically; buttons flow left-to-right within each row
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '14px';
  container.style.width = '100%';

  function makeRoundRedButton(num) {
    const b = document.createElement('button');
    b.textContent = String(num);
    b.className = 'btn';
    b.style.background = '#c62828';
    b.style.color = '#fff';
    b.style.fontWeight = '700';
    b.style.border = '2px solid #8e0000';
    b.style.borderRadius = '999px';
    // Ensure a circle that fits 2-3 digits
    const large = num >= 100;
    const size = large ? 48 : 44;
    b.style.width = size + 'px';
    b.style.height = size + 'px';
    b.style.lineHeight = size - 4 + 'px';
    b.style.padding = '0';
    b.style.textAlign = 'center';
    b.style.fontSize = large ? '0.95rem' : '1.05rem';
  b.style.cursor = 'pointer';
    b.setAttribute('aria-pressed', 'false');
    b.dataset.num = String(num);
  b.dataset.size = String(size);

    const applyRing = (on) => {
      if (on) {
        // Darker, wider lime ring for better visibility
        b.style.boxShadow = '0 0 0 5px #9acd32';
      } else {
        b.style.boxShadow = 'none';
      }
    };
    b.addEventListener('click', () => {
      // Ignore toggling if already booked
      if (b.dataset.booked === '1') return;
      if (selected.has(num)) {
        selected.delete(num);
        b.setAttribute('aria-pressed', 'false');
        applyRing(false);
      } else {
        selected.add(num);
        b.setAttribute('aria-pressed', 'true');
        applyRing(true);
      }
    });
    numToBtn.set(num, b);
    return b;
  }

  groups.forEach(g => {
    const section = document.createElement('div');
    section.style.border = '1px solid #eee';
    section.style.borderRadius = '10px';
    section.style.background = '#fff';
    section.style.padding = '10px 12px';
    section.style.display = 'flex';
    section.style.flexDirection = 'column';
    section.style.gap = '8px';
  // Make each group span full width so its buttons fill left-to-right
  section.style.width = '100%';

    const title = document.createElement('div');
    title.textContent = g.title;
    title.style.fontWeight = '700';
    title.style.fontSize = '1.05rem';
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.style.display = 'flex';
    grid.style.flexWrap = 'wrap';
    grid.style.gap = '8px';

    for (let n = g.from; n <= g.to; n++) {
      grid.appendChild(makeRoundRedButton(n));
    }
    section.appendChild(grid);
    container.appendChild(section);
  });

  root.appendChild(container);

  // Pre-mark numbers already booked in the currently selected open Einsatz
  try {
    const selId = (typeof getSelectedEinsatzId === 'function') ? getSelectedEinsatzId() : null;
    const eins = (typeof findOpenEinsatzById === 'function') ? findOpenEinsatzById(selId) : null;
    const booked = Array.isArray(eins && eins.psaNummern) ? eins.psaNummern : [];
    const bookedSet = new Set(booked.map(x => parseInt(x, 10)).filter(n => !isNaN(n)));
    bookedSet.forEach(n => {
      const btn = numToBtn.get(n);
      if (btn) applyCross(btn, true);
    });
  } catch (_) {}

  // Let global search index content after rendering
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    const event = new Event('input', { bubbles: true });
    searchInput.dispatchEvent(event);
  }

  // Floating action button to book into laufenden Einsatz
  let fab = document.getElementById('psa-book-fab');
  if (fab && fab.parentNode) fab.parentNode.removeChild(fab);
  fab = document.createElement('button');
  fab.id = 'psa-book-fab';
  fab.textContent = 'In laufenden Einsatz buchen';
  fab.className = 'btn';
  fab.style.position = 'fixed';
  fab.style.right = '16px';
  fab.style.bottom = '24px';
  fab.style.zIndex = '999';
  fab.style.background = '#111';
  fab.style.color = '#fff';
  fab.style.border = '2px solid #000';
  fab.style.borderRadius = '999px';
  // Make ~1.5x bigger and bolder
  fab.style.padding = '16px 24px';
  fab.style.fontWeight = '800';
  fab.style.fontSize = '1.25rem';
  fab.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
  fab.title = 'Fügt ausgewählte Nummern dem ausgewählten offenen Einsatz hinzu';
  fab.addEventListener('click', () => {
    const nums = Array.from(selected.values());
    if (nums.length === 0) {
      alert('Keine Nummern ausgewählt.');
      return;
    }
    if (typeof getSelectedEinsatzId !== 'function' || typeof findOpenEinsatzById !== 'function' || typeof upsertOpenEinsatz !== 'function') {
      alert('Einsatz-Verwaltung nicht verfügbar. Öffne zuerst die Seite "Atemschutzeinsatz".');
      return;
    }
    const selId = getSelectedEinsatzId();
    const eins = findOpenEinsatzById(selId);
    if (!eins) {
      alert('Kein offener Einsatz ausgewählt. Bitte im Atemschutzeinsatz einen Einsatz eröffnen oder wählen.');
      return;
    }
    const existing = Array.isArray(eins.psaNummern) ? eins.psaNummern.slice() : [];
    const mergedSet = new Set(existing.map(x => parseInt(x, 10)).filter(n => !isNaN(n)));
    nums.forEach(n => mergedSet.add(parseInt(n, 10)));
    const merged = Array.from(mergedSet.values()).sort((a,b)=>a-b);
    const updated = { ...eins, psaNummern: merged, updatedAt: Date.now() };
    upsertOpenEinsatz(updated);
    // Mark buttons as booked and clear selection ring
    nums.forEach(n => {
      const btn = numToBtn.get(n);
      if (btn) {
        applyCross(btn, true);
        btn.setAttribute('aria-pressed', 'false');
      }
    });
    selected.clear();
  });
  document.body.appendChild(fab);

  // Back floating button (left side)
  let backFab = document.getElementById('psa-back-fab');
  if (backFab && backFab.parentNode) backFab.parentNode.removeChild(backFab);
  backFab = document.createElement('button');
  backFab.id = 'psa-back-fab';
  backFab.textContent = 'Zurück zum Atemschutzeinsatz';
  backFab.className = 'btn';
  backFab.style.position = 'fixed';
  backFab.style.left = '16px';
  backFab.style.bottom = '24px';
  backFab.style.zIndex = '999';
  backFab.style.background = '#111';
  backFab.style.color = '#fff';
  backFab.style.border = '2px solid #000';
  backFab.style.borderRadius = '999px';
  backFab.style.padding = '16px 24px';
  backFab.style.fontWeight = '800';
  backFab.style.fontSize = '1.05rem';
  backFab.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
  backFab.title = 'Zurück zur Seite Atemschutzeinsatz';
  backFab.addEventListener('click', () => {
    if (typeof navigate === 'function') navigate('atemschutzeinsatz');
    else window.location.hash = '#atemschutzeinsatz';
  });
  document.body.appendChild(backFab);
}
// --- SPA-specific: render Sicherheitstrupptaschen (Si) list page ---
function renderSIListePage() {
  // Numbers from original liste-sicherheitstrupptaschen.html
  const siNumbers = [305, 302, 304, 303, 306, 301];
  let assignedSiLabels = [];
  // Vehicle pages to scan for assigned moveables
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html'
  ];
  vehiclePages.forEach(page => {
    const moveablesKey = 'moveables_' + page;
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
    moveables.forEach(m => {
      // In SPA, the target area for Sicherheitstrupptasche is 'sicherheitstrupptasche'
      if (m.areaId === 'sicherheitstrupptasche' && m.label && m.label.startsWith('Si ')) {
        assignedSiLabels.push(m.label.trim());
      }
    });
  });

  // Exclude Sis that the user removed from the list page
  let removedSis = [];
  try { removedSis = JSON.parse(localStorage.getItem('removed_sis_liste_sicherheitstrupptaschen') || '[]'); } catch (e) {}

  // Only show unassigned and not-removed numbers
  const unassignedSiNumbers = siNumbers.filter(num => {
    const label = `Si ${num}`;
    return !assignedSiLabels.includes(label) && !removedSis.includes(label);
  });

  // Render into the list container
  const container = document.getElementById('si-btn-list');
  if (container) container.innerHTML = '';
  // Register home area for Si list for drag/dblclick home logic
  let siBtnListArea = container;
  if (container && !container.classList.contains('moveable-area')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'moveable-area';
    wrapper.dataset.areaId = 'si-btn-list';
    container.parentNode.insertBefore(wrapper, container);
    wrapper.appendChild(container);
    siBtnListArea = wrapper;
  }
  if (window.registerArea) window.registerArea('si-btn-list', siBtnListArea);

  if (window.renderMoveableButtons) {
    // First render any combined Si+FL mappings so they appear before base Si buttons
    try {
      const combinedMapSi = getCombinedSiMap();
      (combinedMapSi||[]).forEach(entry => {
        const label = `Si ${entry.si}`;
        const fullLabel = `Si ${entry.si} mit FL ${entry.fl}`;
        // Skip if assigned or removed
        if (assignedSiLabels.includes(label)) return;
        const btn = document.createElement('button');
        btn.className = 'si-btn';
        btn.style.border = '2px solid #bfff00';
        btn.style.color = '#bfff00';
        btn.style.background = '#111';
        btn.style.fontWeight = 'bold';
        btn.style.margin = '6px';
        btn.style.minWidth = '54px';
        btn.style.minHeight = '44px';
        btn.style.fontSize = '1.1rem';
        btn.textContent = label;
        const styleKind = ((entry.fl && (function(n){ const goldenFL=[126,212,202,149,209,173,164,156,154,196,163,216,205,181,203,208,160,227,136,120,188,218,225,177,153,198,138,127,215,213,192,174,206,158,210,140,130,155,190,221,178,143,122,180,171,175,131,152,128,172,129,169,123,199,219,229,194,157,195,207,220,124,226,224,197,161,170,201,119,193,183,214,121,125,159,135,176,139,179,141,142,184,145,185,144,186,146,147,189,148,191,150,200,151,204,162,211,165,217,166,222,167,223,168,228,182,238,137,187,8,43,57,93,167,189,211,289]; return goldenFL.includes(n); })(entry.fl))) ? 'gold' : 'grey';
        decorateCombinedSiInline(btn, entry.fl, styleKind);
        btn.addEventListener('click', function() { showAssignmentSidebar(btn); });
        if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'si-btn-list');
        container.appendChild(btn);
      });
    } catch (_) {}

    window.renderMoveableButtons(container, unassignedSiNumbers, 'Si', 'si-btn', function(btn, num) {
      // Apply colors consistent with original page
      btn.style.border = '2px solid #bfff00';
      btn.style.color = '#bfff00';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'si-btn-list');
    });
    // Nudge global search to index new DOM
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  }

  // Render removed-but-not-assigned Sis in the Sicherheitstrupptasche area if present (on any page with that area)
  const siArea = document.querySelector('.moveable-area[data-area-id="sicherheitstrupptasche"] .area-content');
  if (siArea) siArea.innerHTML = '';
  if (siArea) {
    const removedButNotAssigned = removedSis.filter(label => !assignedSiLabels.includes(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('Si ', ''), 10)).filter(n => !isNaN(n));
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      btn.textContent = 'Si ' + num;
      btn.className = 'btn si-btn';
      btn.style.border = '2px solid #bfff00';
      btn.style.color = '#bfff00';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      const dblclickHandler = function() {
        let removedSis = [];
        try { removedSis = JSON.parse(localStorage.getItem('removed_sis_liste_sicherheitstrupptaschen') || '[]'); } catch (e) {}
        const label = 'Si ' + num;
        const idx = removedSis.indexOf(label);
        if (idx !== -1) {
          removedSis.splice(idx, 1);
          localStorage.setItem('removed_sis_liste_sicherheitstrupptaschen', JSON.stringify(removedSis));
          renderSIListePage();
        }
      };
      btn.addEventListener('dblclick', dblclickHandler);
      // Enable double-tap emulation for mobile devices
      if (typeof window.enableDoubleTapEmulation === 'function') {
        window.enableDoubleTapEmulation(btn, dblclickHandler);
      }
      siArea.appendChild(btn);
    });
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  }
}
// ---- Atemschutzeinsatz: multi-open entries + live summary + print ----
const EINSATZ_KEY = 'current_einsatz_v1'; // legacy single-entry key (for migration)
const OPEN_EINSAETZE_KEY = 'open_einsaetze_v1';
const SELECTED_EINSATZ_ID_KEY = 'selected_einsatz_id_v1';
const EINSATZ_HISTORY_KEY = 'einsatz_history_v1';

// Legacy single-entry helpers (used for migration only)
function getCurrentEinsatz() {
  try { return JSON.parse(localStorage.getItem(EINSATZ_KEY) || 'null'); } catch (_) { return null; }
}
function clearCurrentEinsatz() {
  try { localStorage.removeItem(EINSATZ_KEY); } catch (_) {}
}

// Multi-entry helpers
function getOpenEinsaetze() {
  try {
    const arr = JSON.parse(localStorage.getItem(OPEN_EINSAETZE_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (_) { return []; }
}
function saveOpenEinsaetze(list) {
  try { localStorage.setItem(OPEN_EINSAETZE_KEY, JSON.stringify(list || [])); } catch (_) {}
}
function getSelectedEinsatzId() {
  try { return localStorage.getItem(SELECTED_EINSATZ_ID_KEY) || null; } catch (_) { return null; }
}
function setSelectedEinsatzId(id) {
  try {
    if (id) localStorage.setItem(SELECTED_EINSATZ_ID_KEY, String(id));
    else localStorage.removeItem(SELECTED_EINSATZ_ID_KEY);
  } catch (_) {}
}
function findOpenEinsatzById(id) {
  if (!id) return null;
  let list = getOpenEinsaetze();
  // Sort by most recently updated/started first
  list = list.slice().sort((a,b) => {
    const ta = (a.updatedAt || a.startedAt || 0);
    const tb = (b.updatedAt || b.startedAt || 0);
    return tb - ta;
  });
  return list.find(e => String(e.id) === String(id)) || null;
}
function upsertOpenEinsatz(einsatz) {
  const list = getOpenEinsaetze();
  const idx = list.findIndex(e => String(e.id) === String(einsatz.id));
  if (idx === -1) list.unshift(einsatz); else list[idx] = einsatz;
  saveOpenEinsaetze(list);
}
function removeOpenEinsatz(id) {
  const list = getOpenEinsaetze().filter(e => String(e.id) !== String(id));
  saveOpenEinsaetze(list);
}
function getEinsatzHistory() {
  try { const arr = JSON.parse(localStorage.getItem(EINSATZ_HISTORY_KEY) || '[]'); return Array.isArray(arr) ? arr : []; } catch (_) { return []; }
}
function saveEinsatzHistory(list) {
  try { localStorage.setItem(EINSATZ_HISTORY_KEY, JSON.stringify(list || [])); } catch (_) {}
}

// Form helpers
function collectEinsatzFormValues() {
  const root = document;
  const number = (root.querySelector('.einsatz-form input[placeholder="Einsatznummer"]') || {}).value || '';
  const strasse = (root.querySelector('.einsatz-form input[placeholder="Straße"]') || {}).value || '';
  const ort = (root.querySelector('.einsatz-form input[placeholder="Ort"]') || {}).value || '';
  return { number, strasse, ort };
}
function fillEinsatzFormFrom(data) {
  if (!data) return;
  const root = document;
  const n = root.querySelector('.einsatz-form input[placeholder="Einsatznummer"]');
  const s = root.querySelector('.einsatz-form input[placeholder="Straße"]');
  const o = root.querySelector('.einsatz-form input[placeholder="Ort"]');
  if (n) n.value = data.number || '';
  if (s) s.value = data.strasse || '';
  if (o) o.value = data.ort || '';
}

// Migration: move legacy single current entry into multi-open list
function migrateSingleEinsatzIfNeeded() {
  const legacy = getCurrentEinsatz();
  if (!legacy) return;
  const list = getOpenEinsaetze();
  // Avoid duplicates if already migrated
  const exists = list.some(e => e.number === legacy.number && e.strasse === legacy.strasse && e.ort === legacy.ort && legacy.startedAt && e.startedAt === legacy.startedAt);
  const id = 'E' + (legacy.startedAt || Date.now());
  if (!exists) {
    list.unshift({
      id,
      number: legacy.number || '',
      strasse: legacy.strasse || '',
      ort: legacy.ort || '',
      status: legacy.status || 'open',
      startedAt: legacy.startedAt || Date.now(),
      finalizedAt: legacy.finalizedAt || null,
      updatedAt: Date.now()
    });
    saveOpenEinsaetze(list);
    setSelectedEinsatzId(id);
  }
  clearCurrentEinsatz();
}

function renderOpenEinsaetzeBar() {
  const host = document.querySelector('.card.center-col');
  if (!host) return;
  let bar = document.getElementById('open-einsaetze-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'open-einsaetze-bar';
    bar.style.display = 'flex';
    bar.style.alignItems = 'center';
    bar.style.flexWrap = 'wrap';
    bar.style.gap = '8px';
    bar.style.margin = '6px 0 10px 0';
    // Find the form within the same host to avoid DOMException when inserting before a node from a different parent
    const form = host.querySelector('.einsatz-form');
    try {
      if (form && form.parentNode === host) {
        host.insertBefore(bar, form);
      } else if (host.firstChild) {
        host.insertBefore(bar, host.firstChild.nextSibling || host.firstChild);
      } else {
        host.appendChild(bar);
      }
    } catch (err) {
      // Fallback: just append the bar to host
      host.appendChild(bar);
    }
  } else {
    while (bar.firstChild) bar.removeChild(bar.firstChild);
  }
  const title = document.createElement('div');
  title.textContent = 'Offene Einsätze:';
  title.style.fontWeight = '600';
  bar.appendChild(title);
  const list = getOpenEinsaetze();
  const selectedId = getSelectedEinsatzId();
  if (list.length === 0) {
    const empty = document.createElement('span');
    empty.textContent = 'keine';
    empty.style.color = '#777';
    bar.appendChild(empty);
  } else {
    list.forEach(e => {
      const chip = document.createElement('button');
      const label = (e.number && e.number.trim()) ? `#${e.number.trim()}` : [e.strasse, e.ort].filter(Boolean).join(', ');
      chip.textContent = label || 'Unbenannt';
      chip.className = 'btn btn-grey';
      chip.style.padding = '4px 8px';
      chip.style.borderRadius = '16px';
      chip.style.background = String(e.id) === String(selectedId) ? '#e9e9e9' : '#f7f7f7';
      chip.addEventListener('click', () => {
        setSelectedEinsatzId(e.id);
        fillEinsatzFormFrom(e);
        renderEinsatzInfo();
        renderOpenEinsaetzeBar();
      });
      bar.appendChild(chip);
    });
  }
  const newBtn = document.createElement('button');
  newBtn.className = 'btn btn-purple';
  newBtn.textContent = 'Neuen Einsatz';
  newBtn.addEventListener('click', () => {
    const vals = collectEinsatzFormValues();
    const id = 'E' + Date.now();
    const neu = { id, ...vals, status: 'open', startedAt: Date.now(), finalizedAt: null, updatedAt: Date.now() };
    upsertOpenEinsatz(neu);
    setSelectedEinsatzId(id);
    fillEinsatzFormFrom(neu);
    renderOpenEinsaetzeBar();
    renderEinsatzInfo();
  });
  bar.appendChild(newBtn);
}

function renderEinsatzInfo() {
  const area = document.getElementById('einsatz-info-area');
  if (!area) return;
  area.innerHTML = '';
  const list = getOpenEinsaetze();
  let selected = findOpenEinsatzById(getSelectedEinsatzId());
  if (!selected && list.length > 0) {
    selected = list[0];
    setSelectedEinsatzId(selected.id);
    // Do not auto-fill form here; keep inputs as-is until user chooses
  }

  if (!list.length) {
    const wrap = document.createElement('div');
    wrap.style.width = '100%';
    wrap.style.maxWidth = '900px';
    wrap.style.marginTop = '12px';
    wrap.style.border = '1px dashed #ccc';
    wrap.style.borderRadius = '10px';
    wrap.style.padding = '12px';
    const empty = document.createElement('div');
    empty.textContent = 'Noch keine offenen Einsätze. Erstelle einen neuen oder beginne mit dem Formular unten.';
    empty.style.color = '#555';
    wrap.appendChild(empty);
    area.appendChild(wrap);
    return;
  }

  // Render all open Einsätze as cards
  const gridWrap = document.createElement('div');
  gridWrap.style.display = 'grid';
  gridWrap.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
  gridWrap.style.gap = '12px';
  gridWrap.style.width = '100%';

  const makeRow = (label, value) => {
    const d = document.createElement('div');
    d.innerHTML = `<div style="font-weight:600">${label}</div><div>${value || '<span style=\'color:#888\'>–</span>'}</div>`;
    return d;
  };

  // Helper for relative time (very small, German)
  const rel = (t) => {
    if (!t) return '';
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return `vor ${s}s`;
    const m = Math.floor(s/60);
    if (m < 60) return `vor ${m} Min`;
    const h = Math.floor(m/60);
    if (h < 24) return `vor ${h} Std`;
    const d = Math.floor(h/24);
    return `vor ${d} Tg`;
  };

  list.forEach(e => {
    const card = document.createElement('div');
    card.style.border = String(selected && selected.id) === String(e.id) ? '2px solid #1976d2' : '1px solid #eee';
    card.style.borderRadius = '10px';
    card.style.background = '#fff';
    card.style.padding = '12px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '8px';
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      setSelectedEinsatzId(e.id);
      fillEinsatzFormFrom(e);
      renderOpenEinsaetzeBar();
      renderEinsatzInfo();
    });

  const head = document.createElement('div');
  head.style.display = 'flex';
  head.style.flexWrap = 'wrap';
  head.style.justifyContent = 'space-between';
  head.style.alignItems = 'center';
  const left = document.createElement('div');
  const startedDt = e.startedAt ? new Date(e.startedAt) : null;
  const headerTime = startedDt ? startedDt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
  const small = startedDt ? `<div style="font-size:0.85rem;color:#666;margin-top:2px">seit ${headerTime} (${rel(e.startedAt)})</div>` : '';
  left.innerHTML = `<strong>Aktueller Einsatz</strong> · Status: <span style="${e.status==='open'?'color:#176a2a':'color:#888'}">${e.status==='open'?'laufend':'finalisiert'}</span>${small}`;
    const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.flexWrap = 'wrap';
  right.style.gap = '8px';
    // PSA count badge
    const psaNumbers = Array.isArray(e.psaNummern)
      ? e.psaNummern.slice().map(n => parseInt(n, 10)).filter(n => !isNaN(n)).sort((a,b)=>a-b)
      : [];
    const psaCount = psaNumbers.length;
    const psaBadge = document.createElement('span');
    psaBadge.textContent = `PSA ${psaCount}`;
    psaBadge.style.background = '#222';
    psaBadge.style.color = '#fff';
    psaBadge.style.borderRadius = '12px';
    psaBadge.style.padding = '2px 8px';
    psaBadge.style.fontSize = '0.85rem';
    psaBadge.style.fontWeight = '700';
    psaBadge.title = psaCount ? `Gebuchte PSA-Nummern: ${psaNumbers.join(', ')}` : 'Keine PSA-Nummern gebucht';
    right.appendChild(psaBadge);
  const pdfBtn = document.createElement('button');
    pdfBtn.className = 'btn btn-grey';
  pdfBtn.style.padding = '4px 8px';
  pdfBtn.style.fontSize = '0.9rem';
    pdfBtn.textContent = 'PDF';
    pdfBtn.title = 'PDF/ Druckansicht öffnen';
    pdfBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openEinsatzPrintView(e); });
  const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-grey';
  editBtn.style.padding = '4px 8px';
  editBtn.style.fontSize = '0.9rem';
    editBtn.textContent = 'Bearbeiten';
    editBtn.title = 'In Formular laden';
    editBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      setSelectedEinsatzId(e.id);
      fillEinsatzFormFrom(e);
      renderOpenEinsaetzeBar();
      renderEinsatzInfo();
    });
  const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-grey';
  resetBtn.style.padding = '4px 8px';
  resetBtn.style.fontSize = '0.9rem';
    resetBtn.textContent = 'Zurücksetzen';
    resetBtn.title = 'Diesen Einsatz verwerfen (nicht archivieren)';
    resetBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const ok = confirm('Diesen Einsatz wirklich verwerfen?');
      if (!ok) return;
      removeOpenEinsatz(e.id);
      // Update selection if needed
      if (String(getSelectedEinsatzId()) === String(e.id)) {
        const remaining = getOpenEinsaetze();
        if (remaining.length) {
          setSelectedEinsatzId(remaining[0].id);
          fillEinsatzFormFrom(remaining[0]);
        } else {
          setSelectedEinsatzId(null);
          fillEinsatzFormFrom({ number:'', strasse:'', ort:'' });
        }
      }
      renderOpenEinsaetzeBar();
      renderEinsatzInfo();
    });
  const finalizeBtn = document.createElement('button');
    finalizeBtn.className = 'btn btn-red';
  finalizeBtn.style.padding = '4px 8px';
  finalizeBtn.style.fontSize = '0.9rem';
    finalizeBtn.textContent = 'Finalisieren';
    finalizeBtn.title = 'Einsatz abschließen und archivieren';
    finalizeBtn.disabled = e.status === 'finalized';
    finalizeBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const ok = confirm('Einsatz finalisieren? Danach ist er nicht mehr bearbeitbar und wird archiviert.');
      if (!ok) return;
      const current = findOpenEinsatzById(e.id);
      if (!current) return;
      current.status = 'finalized';
      current.finalizedAt = Date.now();
      current.updatedAt = Date.now();
      const hist = getEinsatzHistory();
      hist.unshift(current);
      saveEinsatzHistory(hist);
      removeOpenEinsatz(current.id);
      // Selection adjustment
      const remaining = getOpenEinsaetze();
      if (remaining.length) {
        if (String(getSelectedEinsatzId()) === String(e.id)) {
          setSelectedEinsatzId(remaining[0].id);
          fillEinsatzFormFrom(remaining[0]);
        }
      } else {
        setSelectedEinsatzId(null);
        fillEinsatzFormFrom({ number:'', strasse:'', ort:'' });
      }
      renderOpenEinsaetzeBar();
      renderEinsatzInfo();
    });
    right.appendChild(pdfBtn);
    right.appendChild(editBtn);
    right.appendChild(resetBtn);
    right.appendChild(finalizeBtn);
    head.appendChild(left);
    head.appendChild(right);
    card.appendChild(head);

    const hr = document.createElement('hr');
    hr.style.border = 'none';
    hr.style.borderTop = '1px solid #eee';
    hr.style.margin = '8px 0';
    card.appendChild(hr);

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
    grid.style.gap = '8px';
  const dt = e.startedAt ? new Date(e.startedAt) : null;
    const startedDate = dt ? dt.toLocaleDateString('de-DE') : '–';
    const startedTime = dt ? dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '–';
    const finalizedStr = e.finalizedAt ? new Date(e.finalizedAt).toLocaleString('de-DE') : '–';
    grid.appendChild(makeRow('Einsatznummer', e.number));
    grid.appendChild(makeRow('Straße', e.strasse));
    grid.appendChild(makeRow('Ort', e.ort));
    const beginBlock = document.createElement('div');
    beginBlock.innerHTML = `<div style=\"font-weight:600\">Einsatzbegin</div><div>Datum: ${startedDate}</div><div>Uhrzeit: ${startedTime}</div>`;
    grid.appendChild(beginBlock);
    grid.appendChild(makeRow('Finalisiert', finalizedStr));
  // PSA details
  grid.appendChild(makeRow('Anzahl PSA', String(psaNumbers.length)));
  grid.appendChild(makeRow('PSA-Nummern', psaNumbers.length ? psaNumbers.join(', ') : ''));
    card.appendChild(grid);

    // PSA chips for quick scanning
    if (psaNumbers.length) {
      const chipsWrap = document.createElement('div');
      chipsWrap.style.display = 'flex';
      chipsWrap.style.flexWrap = 'wrap';
      chipsWrap.style.gap = '6px';
      chipsWrap.style.marginTop = '4px';
      psaNumbers.forEach(n => {
        const chip = document.createElement('span');
        chip.textContent = String(n);
        chip.style.background = '#f1f1f1';
        chip.style.border = '1px solid #ddd';
        chip.style.borderRadius = '999px';
        chip.style.padding = '2px 8px';
        chip.style.fontSize = '0.85rem';
        chip.style.color = '#333';
        chipsWrap.appendChild(chip);
      });
      card.appendChild(chipsWrap);
    }

    gridWrap.appendChild(card);
  });

  area.appendChild(gridWrap);
}

function openEinsatzPrintView(e) {
  const w = window.open('', '_blank');
  if (!w) return;
  const dt = e.startedAt ? new Date(e.startedAt) : null;
  const startedDate = dt ? dt.toLocaleDateString('de-DE') : '–';
  const startedTime = dt ? dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '–';
  const finalized = e.finalizedAt ? new Date(e.finalizedAt).toLocaleString('de-DE') : '–';
  const psaNums = Array.isArray(e.psaNummern)
    ? e.psaNummern.slice().map(n => parseInt(n, 10)).filter(n => !isNaN(n)).sort((a,b)=>a-b)
    : [];
  const psaCount = psaNums.length;
  const psaListStr = psaNums.length ? psaNums.join(', ') : '–';
  const html = `<!doctype html>
  <html lang="de">
  <head>
    <meta charset="utf-8" />
    <title>Atemschutzeinsatz ${e.number || ''}</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 24px; }
      .hdr { display:flex; justify-content: space-between; align-items:center; margin-bottom: 16px; }
      .title { font-size: 22px; font-weight: 700; }
      .meta { color:#555; }
      .card { border:1px solid #ddd; border-radius:10px; padding:16px; }
      .row { display:grid; grid-template-columns: 200px 1fr; gap:10px; margin:6px 0; }
      .label { font-weight:600; }
      @media print {
        .no-print { display:none; }
      }
    </style>
  </head>
  <body>
    <div class="hdr">
      <div class="title">Atemschutzeinsatz</div>
      <div class="meta">Status: ${e.status==='finalized' ? 'finalisiert' : 'laufend'}</div>
    </div>
    <div class="card">
      <div class="row"><div class="label">Einsatznummer</div><div>${e.number || '–'}</div></div>
      <div class="row"><div class="label">Straße</div><div>${e.strasse || '–'}</div></div>
      <div class="row"><div class="label">Ort</div><div>${e.ort || '–'}</div></div>
      <div class="row"><div class="label">Einsatzbegin</div><div>Datum: ${startedDate}<br/>Uhrzeit: ${startedTime}</div></div>
      <div class="row"><div class="label">Finalisiert</div><div>${finalized}</div></div>
      <div class="row"><div class="label">Anzahl PSA</div><div>${psaCount}</div></div>
      <div class="row"><div class="label">PSA-Nummern</div><div>${psaListStr}</div></div>
    </div>
    <div style="margin-top:16px">
      <button class="no-print" onclick="window.print()">Drucken / Als PDF sichern</button>
      <button class="no-print" onclick="window.close()">Schließen</button>
    </div>
    <script>window.addEventListener('load',()=>{ setTimeout(()=>window.print(), 10); });</script>
  </body>
  </html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function initAtemschutzEinsatzPage() {
  // Update button text to be clearer
  const openBtn = document.getElementById('btn-open-einsatz');
  if (openBtn) openBtn.textContent = 'Einsatz eröffnen';
  // Ensure form inputs are readable
  const formInputs = document.querySelectorAll('.einsatz-form input');
  formInputs.forEach(inp => {
    inp.style.color = '#000';
    inp.style.background = '#fff';
    inp.style.caretColor = '#000';
  });
  // Prevent accidental form submission reload and enable Enter key behavior
  const form = document.querySelector('.einsatz-form');
  if (form && !form.dataset.submitWired) {
    form.dataset.submitWired = '1';
    form.addEventListener('submit', (ev) => ev.preventDefault());
  }

  // Migrate legacy single entry if present
  migrateSingleEinsatzIfNeeded();

  // Restore selection or select first
  const list = getOpenEinsaetze();
  let sel = findOpenEinsatzById(getSelectedEinsatzId());
  if (!sel && list.length) {
    sel = list[0];
    setSelectedEinsatzId(sel.id);
  }
  // Fill form from selected
  if (sel) fillEinsatzFormFrom(sel); else fillEinsatzFormFrom({ number:'', strasse:'', ort:'' });

  // Wire create-new button
  if (openBtn) {
    // Avoid multiple handlers across re-renders
    const handleOpen = () => {
      const vals = collectEinsatzFormValues();
      const id = 'E' + Date.now();
      const neu = { id, ...vals, status: 'open', startedAt: Date.now(), finalizedAt: null, updatedAt: Date.now() };
      upsertOpenEinsatz(neu);
      setSelectedEinsatzId(id);
      // Clear visible inputs after opening; info panel remains for the selected Einsatz
      fillEinsatzFormFrom({ number: '', strasse: '', ort: '' });
      renderOpenEinsaetzeBar();
      renderEinsatzInfo();
    };
    openBtn.style.pointerEvents = 'auto';
    // Deduplicate event wiring
    if (!openBtn.dataset.wired) {
      openBtn.dataset.wired = '1';
      openBtn.onclick = null;
      openBtn.addEventListener('click', handleOpen);
    }
  }
  // Auto-create/select on first input if nothing selected; always update selected on input
  if (form && !form.dataset.wired) {
    form.dataset.wired = '1';
    form.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        const selected = findOpenEinsatzById(getSelectedEinsatzId());
        if (!selected) {
          // Do NOT auto-create on input; wait for explicit "Einsatz eröffnen"
          return;
        }
        const vals = collectEinsatzFormValues();
        const updated = { ...selected, ...vals, updatedAt: Date.now() };
        upsertOpenEinsatz(updated);
        renderOpenEinsaetzeBar();
        renderEinsatzInfo();
      });
    });
  }
  // Initial renders
  renderOpenEinsaetzeBar();
  renderEinsatzInfo();
}
// --- SPA-specific: render PA list page ---
function renderPAListePage() {
  // PA numbers provided by user
  const paNumbers = [29,62,36,15,47,60,20,43,26,19,50,31,21,8,46,24,48,12,61,57,23,34,44,54,39,63,55,22,66,58,18,1,17,25,11,4,14,28,3,9,64,7,10,59,49,45,16,32,56,33,2,42,41,65,38,6,5,27,30];
  // Compute PAs assigned across all vehicles
  let assignedPALabels = [];
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html'
  ];
  vehiclePages.forEach(pageFile => {
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem('moveables_' + pageFile) || '[]'); } catch (e) {}
    (moveables||[]).forEach(m => {
      if (m.areaId === 'pa' && m.label && /^PA\s+\d+/.test(m.label)) {
        assignedPALabels.push(m.label.trim());
      }
    });
  });
  const paNumbersSet = new Set(paNumbers.map(n => `PA ${n}`));
  const assignedSet = new Set(assignedPALabels);
  let removedPAs = [];
  try { removedPAs = JSON.parse(localStorage.getItem('removed_pas_liste_pa') || '[]'); } catch (e) {}
  // Read combined PA mapping for unassigned buttons
  const combinedMap = getCombinedPAMap();
  const combinedPASet = new Set(combinedMap.map(x => `PA ${x.pa}`));
  const unassignedPANumbers = paNumbers.filter(n => {
    const label = `PA ${n}`;
    // Exclude any that appear as combined entries
    return !assignedSet.has(label) && !removedPAs.includes(label) && !combinedPASet.has(label);
  });
  const container = document.getElementById('pa-btn-list');
  if (container) container.innerHTML = '';
  let paBtnListArea = container;
  if (container && !container.classList.contains('moveable-area')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'moveable-area';
    wrapper.dataset.areaId = 'pa-btn-list';
    container.parentNode.insertBefore(wrapper, container);
    wrapper.appendChild(container);
    paBtnListArea = wrapper;
  }
  if (window.registerArea) window.registerArea('pa-btn-list', paBtnListArea);
  // First render combined PA+FL buttons from mapping (only if not assigned and not removed)
  combinedMap.forEach(entry => {
    const label = `PA ${entry.pa}`;
    const fullLabel = `PA ${entry.pa} mit FL ${entry.fl}`;
    if (assignedSet.has(label) || removedPAs.includes(label)) return;
    const btn = document.createElement('button');
    btn.className = 'pa-btn';
    // Style base PA button appearance
    btn.style.border = '2px solid #888';
    btn.style.color = '#bbb';
    btn.style.background = '#111';
    btn.style.fontWeight = 'bold';
    btn.style.margin = '6px';
    btn.style.minWidth = '54px';
    btn.style.minHeight = '44px';
    btn.style.fontSize = '1.1rem';
    // Set base label so decorator can extract PA number
    btn.textContent = label;
    // Decorate inline with badge based on FL group
    const isGold = (() => {
      const goldenFL = [126,212,202,149,209,173,164,156,154,196,163,216,205,181,203,208,160,227,136,120,188,218,225,177,153,198,138,127,215,213,192,174,206,158,210,140,130,155,190,221,178,143,122,180,171,175,131,152,128,172,129,169,123,199,219,229,194,157,195,207,220,124,226,224,197,161,170,201,119,193,183,214,121,125,159,135,176,139,179,141,142,184,145,185,144,186,146,147,189,148,191,150,200,151,204,162,211,165,217,166,222,167,223,168,228,182,238,137,187,8,43,57,93,167,189,211,289];
      return goldenFL.includes(entry.fl);
    })();
    decorateCombinedPAInline(btn, entry.fl, isGold ? 'gold' : 'grey');
    btn.addEventListener('click', function() { showAssignmentSidebar(btn); });
    if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'pa-btn-list');
    container.appendChild(btn);
  });
  // Then render the remaining unassigned base PAs
  unassignedPANumbers.forEach(num => {
    const btn = document.createElement('button');
    btn.textContent = `PA ${num}`;
    btn.className = 'pa-btn';
    btn.style.border = '2px solid #888';
    btn.style.color = '#bbb';
    btn.style.background = '#111';
    btn.style.fontWeight = 'bold';
    btn.style.margin = '6px';
    btn.style.minWidth = '54px';
    btn.style.minHeight = '44px';
    btn.style.fontSize = '1.1rem';
    if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'pa-btn-list');
    btn.addEventListener('click', function() { showAssignmentSidebar(btn); });
    container.appendChild(btn);
  });
  const paArea = document.querySelector('.moveable-area[data-area-id="pa"] .area-content');
  if (paArea) paArea.innerHTML = '';
  if (paArea) {
    const removedButNotAssigned = removedPAs.filter(label => !assignedSet.has(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('PA ', ''), 10)).filter(n => !isNaN(n));
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      btn.textContent = 'PA ' + num;
      btn.className = 'pa-btn';
      btn.style.border = '2px solid #888';
      btn.style.color = '#bbb';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      const dblclickHandler = function(e) {
        let removedPAs = [];
        try { removedPAs = JSON.parse(localStorage.getItem('removed_pas_liste_pa') || '[]'); } catch (e) {}
        const label = 'PA ' + num;
        const idx = removedPAs.indexOf(label);
        if (idx !== -1) {
          removedPAs.splice(idx, 1);
          localStorage.setItem('removed_pas_liste_pa', JSON.stringify(removedPAs));
          renderPAListePage();
        }
      };
      btn.addEventListener('dblclick', dblclickHandler);
      // Enable double-tap emulation for mobile devices
      if (typeof window.enableDoubleTapEmulation === 'function') {
        window.enableDoubleTapEmulation(btn, dblclickHandler);
      }
      paArea.appendChild(btn);
    });
  }
}
// Listen for hash changes (routing)
window.addEventListener('hashchange', function() {
  const page = window.location.hash.replace(/^#/, '') || 'hauptmenu';
  renderPage(page);
});
// Initial load
window.addEventListener('DOMContentLoaded', function() {
  const requested = window.location.hash.replace(/^#/, '') || 'hauptmenu';
  // Register any custom vehicle pages saved previously
  try {
    VEHICLE_GROUP_PAGES.forEach(g => {
      getCustomVehiclesForGroup(g).forEach(registerCustomVehiclePage);
    });
  } catch (_) {}
  // Ensure pages for any entries in CUSTOM_VEHICLE_MAP are registered early.
  // This prevents navigation or search from falling back to opening raw
  // .html files for mapped labels (e.g. "TLF Azubi") when the page
  // hasn't been created yet.
  try {
    if (window.CUSTOM_VEHICLE_MAP && typeof registerCustomVehiclePage === 'function') {
      Object.keys(window.CUSTOM_VEHICLE_MAP).forEach(label => {
        try {
          const file = String(window.CUSTOM_VEHICLE_MAP[label] || '').trim();
          if (!file) return;
          const slug = file.replace(/\.html$/i, '');
          // If page doesn't exist yet, register a minimal page so SPA
          // navigation/rendering will build areas and restore moveables.
          if (!window.pages[slug]) {
            registerCustomVehiclePage({ label: label, slug: slug });
          } else {
            // Normalize stored mapping to ensure it ends with .html
            window.CUSTOM_VEHICLE_MAP[label] = slug + '.html';
          }
        } catch (_) {}
      });
    }
  } catch (_) {}
  if (requested !== 'hauptmenu' && !isAuthValid()) {
    renderPage('hauptmenu');
    showAuthModal(() => navigate(requested));
  } else {
    renderPage(requested);
  }
  window.navigate = navigate; // Expose for inline onclick
  // Render login log widget on load
  try { renderLoginLogWidget(); } catch (_) {}
  // Wire header backup/import/fullscreen buttons (if present)
  setTimeout(() => {
    try {
      // Wire all export/import buttons/inputs on the page (handles duplicate IDs in static pages)
      const expBtns = Array.from(document.querySelectorAll('#btn-export'));
      expBtns.forEach(expBtn => { try { expBtn.addEventListener('click', (ev) => { ev.preventDefault(); exportBackup().catch(e=>{console.error(e); alert('Backup fehlgeschlagen: '+(e&&e.message))}); }); } catch(_){} });

      // Ensure at least one import-file input exists
      let inputs = Array.from(document.querySelectorAll('#import-file'));
      if (inputs.length === 0) {
        const created = document.createElement('input');
        created.type = 'file'; created.id = 'import-file'; created.style.display = 'none'; created.accept = '.json';
        document.body.appendChild(created);
        inputs = [created];
      }

      const impBtns = Array.from(document.querySelectorAll('#btn-import'));
      impBtns.forEach(impBtn => { try { impBtn.addEventListener('click', (ev) => { ev.preventDefault(); (inputs[0] && inputs[0].click()); }); } catch(_){} });
      inputs.forEach(inp => { try { inp.addEventListener('change', async (ev) => {
        const f = inp.files && inp.files[0]; if (!f) return; try { const text = await f.text(); const obj = JSON.parse(text); restoreBackupFromObject(obj); } catch (e) { console.error('restore error', e); alert('Fehler beim Wiederherstellen: ' + (e && e.message)); } finally { inp.value = ''; }
      }); } catch(_){} });
      // header fullscreen button removed; persistent FAB at bottom-right remains
    } catch (_) {}
  }, 40);
  // Create a persistent floating fullscreen button so users can enter fullscreen from any page
  setTimeout(() => {
    try {
      if (!document.getElementById('global-fullscreen-fab')) {
        const fab = document.createElement('button');
        fab.id = 'global-fullscreen-fab';
        fab.className = 'btn btn-small';
        fab.title = 'Vollbild umschalten';
        fab.textContent = 'Vollbild';
        fab.style.position = 'fixed';
        fab.style.right = '12px';
        fab.style.bottom = '12px';
        fab.style.zIndex = '1200';
        fab.style.padding = '8px 10px';
        fab.style.borderRadius = '8px';
        fab.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
        fab.addEventListener('click', () => {
          try {
            // Detect iOS / iPadOS - Safari will exit native fullscreen when the keyboard opens.
            const isIOS = (/iP(ad|hone|od)/.test(navigator.userAgent)) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            if (isIOS) {
              // Toggle an in-page 'simulated' fullscreen class instead of using the Fullscreen API.
              const root = document.documentElement;
              const isFull = root.classList.toggle('app-full');
              fab.textContent = isFull ? 'Beenden' : 'Vollbild';
              // If we're on iOS but not running as a Home-Screen PWA, advise the user
              // that true fullscreen (no Safari UI) requires adding the app to the Home Screen.
              const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
              if (!isStandalone && isFull) {
                try {
                  // show a small modal with instructions
                  if (!document.getElementById('a2hs-modal')) {
                    const modal = document.createElement('div');
                    modal.id = 'a2hs-modal';
                    modal.style.position = 'fixed';
                    modal.style.inset = '0';
                    modal.style.background = 'rgba(0,0,0,0.45)';
                    modal.style.display = 'flex';
                    modal.style.alignItems = 'center';
                    modal.style.justifyContent = 'center';
                    modal.style.zIndex = '3000';
                    const card = document.createElement('div');
                    card.style.background = '#fff';
                    card.style.padding = '14px';
                    card.style.borderRadius = '10px';
                    card.style.maxWidth = '92%';
                    card.style.fontSize = '15px';
                    card.innerHTML = `<div style="font-weight:700;margin-bottom:8px">Tipp für iPad</div>
                      <div style="margin-bottom:8px">Um die Safari-Leiste zu entfernen und die App wirklich bildschirmfüllend zu benutzen, füge diese Seite zum Home-Bildschirm hinzu:</div>
                      <ol style="padding-left:18px;margin:0 0 10px 0">
                        <li>Tippe auf das Teilen-Symbol in Safari</li>
                        <li>Wähle "Zum Home-Bildschirm"</li>
                        <li>Starte die App vom Home-Bildschirm</li>
                      </ol>
                      <div style="color:#666;font-size:0.9rem;margin-bottom:10px">Hinweis: Die Seite muss über HTTPS geladen werden, damit das Hinzufügen zum Home-Bildschirm optimal funktioniert (GitHub Pages oder Netlify sind einfache Optionen).</div>`;
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-small';
                    btn.textContent = 'Verstanden';
                    btn.addEventListener('click', () => { try { modal.remove(); } catch(_){} });
                    card.appendChild(btn);
                    modal.appendChild(card);
                    document.body.appendChild(modal);
                  }
                } catch (_) {}
              }
              return;
            }
            if (!document.fullscreenElement) {
              const el = document.documentElement;
              if (el.requestFullscreen) el.requestFullscreen();
              else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            } else {
              if (document.exitFullscreen) document.exitFullscreen();
              else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
          } catch (e) { console.warn('fullscreen toggle failed', e); }
        });
        document.body.appendChild(fab);
      }
    } catch (_) {}
  }, 120);
});
  
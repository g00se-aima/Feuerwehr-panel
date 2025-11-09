// areas.js
// Logic for defining and managing zone areas where moveable buttons can be placed.

// Area registry
window.areas = {};

// Global list of all area titles (union of all per-page titles)
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

// Create and register all global areas
window.createAllAreas = function(container) {
  window.AREA_TITLES.forEach(title => {
    const areaId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    // Only one .moveable-area per area
    const area = document.createElement('div');
    area.className = 'moveable-area';
    area.dataset.areaId = areaId;
    // Area title
    const h3 = document.createElement('h3');
    h3.textContent = title;
    h3.className = 'area-title';
  area.appendChild(h3);
    // Register area (the whole area div is the drop zone)
    window.registerArea(areaId, area);
    // Add to container if provided
    if (container) container.appendChild(area);
  });
};

/**
 * Register a new area (zone) for moveable buttons.
 * @param {string} areaId - Unique identifier for the area.
 * @param {HTMLElement} element - The DOM element representing the area.
 */
window.registerArea = function(areaId, element) {
  window.areas[areaId] = element;
  if (!element.classList.contains('moveable-area')) {
    element.classList.add('moveable-area');
  }
  // Make area a drop target
  element.addEventListener('dragover', function(e) {
    e.preventDefault();
    element.classList.add('area-dragover');
  });
  element.addEventListener('dragleave', function(e) {
    element.classList.remove('area-dragover');
  });
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

/**
 * Get a registered area by ID.
 * @param {string} areaId
 * @returns {HTMLElement|null}
 */
window.getArea = function(areaId) {
  return window.areas[areaId] || null;
};

/**
 * Make a button moveable: draggable, double-click to return home, and track home area.
 * @param {HTMLElement} btn - The button element.
 * @param {string} homeAreaId - The areaId where this button belongs by default.
 */
window.makeButtonMoveable = function(btn, homeAreaId) {
  btn.classList.add('moveable-btn');
  btn.draggable = true;
  btn.dataset.homeArea = homeAreaId;
  btn.dataset.currentArea = homeAreaId;
  if (!btn.id) btn.id = 'moveable-btn-' + Math.random().toString(36).slice(2, 10);

  // Drag events
  btn.addEventListener('dragstart', function(e) {
    e.dataTransfer.setData('moveable-btn-id', btn.id);
    setTimeout(() => btn.classList.add('dragging'), 0);
  });
  btn.addEventListener('dragend', function() {
    btn.classList.remove('dragging');
  });

  // Double-click returns to home area and unassigns from localStorage/state
  btn.addEventListener('dblclick', function() {
    // Only unassign (remove persistent assignment) when the button is currently
    // in a different area than its home area (i.e., it's on a vehicle/area).
    // If the button is double-clicked while already in its home area/list, do nothing.
    const currentArea = btn.dataset.currentArea;
    const homeArea = btn.dataset.homeArea;
    if (currentArea && homeArea && currentArea === homeArea) {
      // No-op when double-clicked in the home/list area
      return;
    }
    // Remove from DOM
    if (btn.parentNode) btn.parentNode.removeChild(btn);
    // Remove from localStorage for the current page (if assigned there)
    const thisPage = (window.currentPageFile) || (window.location.hash ? window.location.hash.replace(/^#/, '') + '.html' : '') || window.location.pathname.split('/').pop();
    const moveablesKey = 'moveables_' + thisPage;
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
    moveables = moveables.filter(mv => mv.label !== btn.textContent);
    try { localStorage.setItem(moveablesKey, JSON.stringify(moveables)); } catch (_) {}
    // Restore to home/source list if needed by removing from removed-* lists
    const label = btn.textContent.trim();
    if (label.startsWith('TF ')) {
      let removedTFs = [];
      try { removedTFs = JSON.parse(localStorage.getItem('removed_tfs_liste_technikflaschen') || '[]'); } catch (e) {}
      const idx = removedTFs.indexOf(label);
      if (idx !== -1) { removedTFs.splice(idx, 1); try { localStorage.setItem('removed_tfs_liste_technikflaschen', JSON.stringify(removedTFs)); } catch(_){} }
    } else if (label.startsWith('FL ')) {
      let removedFLs = [];
      try { removedFLs = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]'); } catch (e) {}
      const idx = removedFLs.indexOf(label);
      if (idx !== -1) { removedFLs.splice(idx, 1); try { localStorage.setItem('removed_fls_liste_atemluftflaschen', JSON.stringify(removedFLs)); } catch(_){} }
    } else if (label.startsWith('PA ')) {
      let removedPAs = [];
      try { removedPAs = JSON.parse(localStorage.getItem('removed_pas_liste-pa') || '[]'); } catch (e) {}
      const idx = removedPAs.indexOf(label);
      if (idx !== -1) { removedPAs.splice(idx, 1); try { localStorage.setItem('removed_pas_liste-pa', JSON.stringify(removedPAs)); } catch(_){} }
    } else if (label.startsWith('Si ')) {
      let removedSis = [];
      try { removedSis = JSON.parse(localStorage.getItem('removed_sis_liste_sicherheitstrupptaschen') || '[]'); } catch (e) {}
      const idx = removedSis.indexOf(label);
      if (idx !== -1) { removedSis.splice(idx, 1); try { localStorage.setItem('removed_sis_liste_sicherheitstrupptaschen', JSON.stringify(removedSis)); } catch(_){} }
    }
    else if (label.startsWith('AM ')) {
      // If an AM (possibly personalised like "AM 12 (Name)") is double-clicked
      // while assigned, remove the base AM entry from the removed-AMs list so
      // it returns to the public AM list (liste-atemanschluesse).
      try {
        let removedAMs = [];
        try { removedAMs = JSON.parse(localStorage.getItem('removed_ams_liste_atemanschluesse') || '[]'); } catch (e) { removedAMs = []; }
        // Base label is like "AM 12"
        const baseMatch = label.match(/^AM\s+\d+/i);
        if (baseMatch) {
          const base = baseMatch[0];
          const idx = removedAMs.indexOf(base);
          if (idx !== -1) {
            removedAMs.splice(idx, 1);
            try { localStorage.setItem('removed_ams_liste_atemanschluesse', JSON.stringify(removedAMs)); } catch (_) {}
            // If the AM list renderer exists, refresh it so the button reappears
            try { if (typeof renderAMListePage === 'function') renderAMListePage(); } catch(_) {}
          }
        }
      } catch (_) {}
    }
    // Optionally, trigger a re-render on the source page if needed
    // (e.g. window.renderTFLists() if on liste-technikflaschen.html)
  });
};

// Utility: Move all moveable buttons in a given area back to their home
window.resetAreaButtons = function(areaId) {
  const area = window.getArea(areaId);
  if (!area) return;
  Array.from(area.querySelectorAll('.moveable-btn')).forEach(btn => {
    const home = window.getArea(btn.dataset.homeArea);
    if (home) home.appendChild(btn);
    btn.dataset.currentArea = btn.dataset.homeArea;
  });
};

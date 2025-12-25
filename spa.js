// Consolidated minimal areas & vehicle definitions (migrated from areas.js & buttons.js)
// These provide the runtime defaults so `spa.js` can run standalone.

// Helper: Add click-to-expand with remove button (unified for desktop and iPad)
// Only enable if enableRemove is true (i.e., button is not in home area)
function addClickToRemove(btn, callback, enableRemove = true) {
  if (!enableRemove) {
    // Remove if it exists
    removeClickToRemove(btn);
    return;
  }
  
  // Don't add if already exists
  if (btn.dataset.hasClickToRemove === 'true') return;
  
  // Mark that this button has click-to-remove enabled
  btn.dataset.hasClickToRemove = 'true';
  
  let isExpanded = false;
  let removeBtn = null;
  let touchStartTime = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  
  const toggleExpanded = function(e) {
    // Don't expand during drag
    if (btn.classList.contains('dragging')) return;
    
    // For touch events, check if this was a drag (movement) or a tap
    if (e.type === 'touchend') {
      const touch = e.changedTouches && e.changedTouches[0];
      if (touch) {
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);
        const deltaTime = Date.now() - touchStartTime;
        // If moved more than 10px or took longer than 500ms, it's a drag, not a tap
        if (deltaX > 10 || deltaY > 10 || deltaTime > 500) {
          return;
        }
      }
    }
    
    // Check if button is in home area - if so, let the sidebar handler work instead
    const currentArea = btn.dataset && btn.dataset.currentArea;
    const homeArea = btn.dataset && btn.dataset.homeArea;
    const isInHomeArea = currentArea && homeArea && String(currentArea) === String(homeArea);
    if (isInHomeArea) return; // Let other handlers work
    
    // Prevent event from bubbling
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (!isExpanded) {
      // Expand the button
      btn.style.transform = 'scale(1.2)';
      btn.style.zIndex = '1000';
      btn.style.transition = 'transform 0.2s ease';
      btn.style.position = 'relative';
      
      // Create and show remove button
      if (!removeBtn) {
        removeBtn = document.createElement('div');
        removeBtn.innerHTML = '×';
        removeBtn.className = 'remove-x-button'; // Add class for identification
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = '-10px';
        removeBtn.style.right = '-10px';
        removeBtn.style.width = '28px';
        removeBtn.style.height = '28px';
        removeBtn.style.borderRadius = '4px';
        removeBtn.style.background = '#e00';
        removeBtn.style.color = '#fff';
        removeBtn.style.border = '2px solid #fff';
        removeBtn.style.fontSize = '20px';
        removeBtn.style.lineHeight = '24px';
        removeBtn.style.textAlign = 'center';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.zIndex = '1001';
        removeBtn.style.fontWeight = 'bold';
        removeBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
        removeBtn.style.userSelect = 'none';
        removeBtn.style.pointerEvents = 'auto'; // Ensure it's clickable
        
        const handleRemove = function(ev) {
          if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
          }
          // Reset button state
          btn.style.transform = '';
          btn.style.zIndex = '';
          if (removeBtn && removeBtn.parentNode) {
            removeBtn.parentNode.removeChild(removeBtn);
          }
          removeBtn = null;
          isExpanded = false;
          // Call the remove callback
          callback.call(btn, ev);
        };
        
        // Add both click and touch events for iPad compatibility
        removeBtn.addEventListener('click', handleRemove);
        removeBtn.addEventListener('touchend', handleRemove);
        
        btn.appendChild(removeBtn);
      }
      
      isExpanded = true;
    } else {
      // Collapse the button
      btn.style.transform = '';
      btn.style.zIndex = '';
      if (removeBtn && removeBtn.parentNode) {
        removeBtn.parentNode.removeChild(removeBtn);
      }
      removeBtn = null;
      isExpanded = false;
    }
  };
  
  // Store the toggle handler so we can remove it later
  btn._toggleExpandedHandler = toggleExpanded;
  
  // Track touch start for drag detection
  const touchStartHandler = function(e) {
    const touch = e.touches && e.touches[0];
    if (touch) {
      touchStartTime = Date.now();
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }
  };
  btn._touchStartHandler = touchStartHandler;
  
  btn.addEventListener('click', toggleExpanded);
  btn.addEventListener('touchstart', touchStartHandler, { passive: true });
  btn.addEventListener('touchend', toggleExpanded);
  
  // Close expanded state when clicking outside
  const outsideClickHandler = function(e) {
    if (isExpanded && !btn.contains(e.target)) {
      btn.style.transform = '';
      btn.style.zIndex = '';
      if (removeBtn && removeBtn.parentNode) {
        removeBtn.parentNode.removeChild(removeBtn);
      }
      removeBtn = null;
      isExpanded = false;
    }
  };
  
  document.addEventListener('click', outsideClickHandler);
  document.addEventListener('touchend', outsideClickHandler);
  btn._outsideClickHandler = outsideClickHandler;
}

// Helper: Remove click-to-remove functionality from a button
function removeClickToRemove(btn) {
  if (!btn || btn.dataset.hasClickToRemove !== 'true') return;
  
  // Remove event listeners
  if (btn._toggleExpandedHandler) {
    btn.removeEventListener('click', btn._toggleExpandedHandler);
    btn.removeEventListener('touchend', btn._toggleExpandedHandler);
    delete btn._toggleExpandedHandler;
  }
  if (btn._touchStartHandler) {
    btn.removeEventListener('touchstart', btn._touchStartHandler);
    delete btn._touchStartHandler;
  }
  if (btn._outsideClickHandler) {
    document.removeEventListener('click', btn._outsideClickHandler);
    document.removeEventListener('touchend', btn._outsideClickHandler);
    delete btn._outsideClickHandler;
  }
  
  // Clean up any existing remove button
  const existingRemoveBtn = btn.querySelector('.remove-x-button');
  if (existingRemoveBtn) {
    existingRemoveBtn.remove();
  }
  
  // Reset styles
  btn.style.transform = '';
  btn.style.zIndex = '';
  
  // Remove marker
  delete btn.dataset.hasClickToRemove;
}

// Helper: Update click-to-remove state based on current vs home area
function updateClickToRemoveState(btn) {
  if (!btn) return btn;
  
  const currentArea = btn.dataset && btn.dataset.currentArea;
  const homeArea = btn.dataset && btn.dataset.homeArea;
  const isInHomeArea = currentArea && homeArea && String(currentArea) === String(homeArea);
  
  // Get the removal handler
  const removalHandler = btn.removalHandler || function() {
    try {
      const pageFile = getCurrentPageFile();
      const isListPage = /(^|\/)liste-/i.test(pageFile || '');
      const label = (btn.dataset && btn.dataset.fullLabel) ? btn.dataset.fullLabel : ((btn.textContent||'').trim());
      const customId = btn.dataset && btn.dataset.customId;
      const isERKBtn = btn.dataset && btn.dataset.erkType === 'erk';
      const erkId = btn.dataset && btn.dataset.erkId;
      
      if (!isListPage && pageFile) {
        // For ERK buttons, use erkId as identifier; for others use moveableId or label
        const id = isERKBtn ? erkId : ((btn.dataset && btn.dataset.moveableId) ? String(btn.dataset.moveableId) : (label || ''));
        try { removeMoveable(pageFile, id); } catch (_) {}
        if (btn.parentNode) btn.parentNode.removeChild(btn);
        
        // If this is an ERK button, return it to silschede
        if (isERKBtn) {
          try {
            // Navigate to silschede and refresh to show the ERK button again
            navigate('silschede');
          } catch (_) {}
          return;
        }
        
        // Remove from removed-* lists to restore the button on home page after refresh
        // NOTE: Only update removed-* flags for PRE-DEFINED buttons. Custom buttons are tracked via isAssigned
        // (checking if they're in any vehicle page's moveables), so just removing them from moveables is enough.
        if (!customId) {
          try {
            const baseLabel = (btn.dataset && btn.dataset.fullLabel) || '';
            let prefix = '';
            
            // Determine prefix: extract from baseLabel for pre-defined buttons
            if (baseLabel) {
              const match = baseLabel.match(/^([A-Z]+)/i);
              if (match) {
                prefix = match[1].toUpperCase();
              }
            }
            
            if (prefix === 'PA') {
              let removedPAs = JSON.parse(localStorage.getItem('removed_pas_liste_pa') || '[]');
              const idx = removedPAs.indexOf(baseLabel);
              if (idx !== -1) {
                removedPAs.splice(idx, 1);
                localStorage.setItem('removed_pas_liste_pa', JSON.stringify(removedPAs));
              }
            } else if (prefix === 'FL') {
              let removedFLs = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]');
              const idx = removedFLs.indexOf(baseLabel);
              if (idx !== -1) {
                removedFLs.splice(idx, 1);
                localStorage.setItem('removed_fls_liste_atemluftflaschen', JSON.stringify(removedFLs));
              }
            } else if (prefix === 'TF') {
              let removedTFs = JSON.parse(localStorage.getItem('removed_tfs_liste_technikflaschen') || '[]');
              const idx = removedTFs.indexOf(baseLabel);
              if (idx !== -1) {
                removedTFs.splice(idx, 1);
                localStorage.setItem('removed_tfs_liste_technikflaschen', JSON.stringify(removedTFs));
              }
            } else if (prefix === 'FH') {
              let removedFHs = JSON.parse(localStorage.getItem('removed_fhs_liste_fluchthauben') || '[]');
              const idx = removedFHs.indexOf(baseLabel);
              if (idx !== -1) {
                removedFHs.splice(idx, 1);
                localStorage.setItem('removed_fhs_liste_fluchthauben', JSON.stringify(removedFHs));
              }
            } else if (prefix === 'AM') {
              let removedAMs = JSON.parse(localStorage.getItem('removed_ams_liste_atemanschluesse') || '[]');
              const idx = removedAMs.indexOf(baseLabel);
              if (idx !== -1) {
                removedAMs.splice(idx, 1);
                localStorage.setItem('removed_ams_liste_atemanschluesse', JSON.stringify(removedAMs));
              }
            } else if (prefix === 'SI') {
              let removedSis = JSON.parse(localStorage.getItem('removed_sis_liste_sicherheitstrupptaschen') || '[]');
              const idx = removedSis.indexOf(baseLabel);
              if (idx !== -1) {
                removedSis.splice(idx, 1);
                localStorage.setItem('removed_sis_liste_sicherheitstrupptaschen', JSON.stringify(removedSis));
              }
            } else if (prefix === 'X') {
              let removedXs = JSON.parse(localStorage.getItem('removed_xs_liste_messgeraete') || '[]');
              const idx = removedXs.indexOf(baseLabel);
              if (idx !== -1) {
                removedXs.splice(idx, 1);
                localStorage.setItem('removed_xs_liste_messgeraete', JSON.stringify(removedXs));
              }
            } else if (prefix === 'CSA') {
              let removedCSAs = JSON.parse(localStorage.getItem('removed_csas_liste_csa') || '[]');
              const idx = removedCSAs.indexOf(baseLabel);
              if (idx !== -1) {
                removedCSAs.splice(idx, 1);
                localStorage.setItem('removed_csas_liste_csa', JSON.stringify(removedCSAs));
              }
            }
          } catch (_) {}
        }
        
        return;
      }
      if (homeArea) {
        const homeRoot = (typeof window.getArea === 'function' ? window.getArea(homeArea) : null) || document.querySelector(`.moveable-area[data-area-id="${homeArea}"]`);
        if (!homeRoot) return;
        const target = homeRoot.querySelector('.area-content') || homeRoot;
        if (btn.parentNode) btn.parentNode.removeChild(btn);
        target.appendChild(btn);
        btn.dataset.currentArea = homeArea;
        updateClickToRemoveState(btn);
      }
    } catch (_) {}
  };
  
  if (!isInHomeArea) {
    // Not in home area - add click-to-remove
    addClickToRemove(btn, removalHandler, true);
  } else {
    // In home area - remove click-to-remove
    removeClickToRemove(btn);
  }
  
  return btn;
}

if (!window.AREA_TITLES) {
  window.AREA_TITLES = [
    'Sprungretter',
    'Atemschutzgeräte',
    'Fluchthauben',
    'Technikflaschen',
    'Atemluftflaschen',
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
    // Provide a consistent inner content container for drops and appends
    const content = document.createElement('div');
    content.className = 'area-content';
    area.appendChild(content);
    window.registerArea(areaId, area);
    if (container) container.appendChild(area);
  });
};

window.registerArea = function(areaId, element) {
  window.areas[areaId] = element;
  if (!element.classList.contains('moveable-area')) element.classList.add('moveable-area');
  const dropTarget = () => element.querySelector('.area-content') || element;
  element.addEventListener('dragover', function(e) { e.preventDefault(); element.classList.add('area-dragover'); });
  element.addEventListener('dragleave', function(e) { element.classList.remove('area-dragover'); });
  element.addEventListener('drop', function(e) {
    e.preventDefault();
    element.classList.remove('area-dragover');
    const btnId = e.dataTransfer.getData('moveable-btn-id');
    const btn = document.getElementById(btnId);
    if (btn && btn.classList.contains('moveable-btn')) {
      dropTarget().appendChild(btn);
      btn.dataset.currentArea = areaId;
      // Rewire button handlers in the context of this page/area (but preserve homeArea)
      try { if (typeof window.makeButtonMoveable === 'function') window.makeButtonMoveable(btn, (btn.dataset && btn.dataset.homeArea) || areaId); } catch (_) {}
      // Update click-to-remove state based on current vs home area (after makeButtonMoveable)
      updateClickToRemoveState(btn);
      // Remove any duplicate DOM nodes with the same base label on this page
      try {
        const baseLabel = (btn.dataset && btn.dataset.fullLabel) ? btn.dataset.fullLabel : ((btn.textContent||'').trim());
        const dups = Array.from(document.querySelectorAll('.moveable-btn')).filter(b => b !== btn && ((b.dataset && b.dataset.fullLabel) ? b.dataset.fullLabel : (b.textContent||'').trim()) === baseLabel);
        dups.forEach(b => { try { b.remove(); } catch(_) {} });
      } catch(_) {}
      // Persist assignment when on vehicle/static pages (non-liste pages)
      try {
        const pageFile = getCurrentPageFile();
        const isListPage = /(^|\/)liste-/i.test(pageFile);
        if (!isListPage) {
          const label = (btn.dataset && btn.dataset.fullLabel) ? btn.dataset.fullLabel : ((btn.textContent||'').trim());
          const id = (btn.dataset && btn.dataset.moveableId) ? String(btn.dataset.moveableId) : (function(){ try{ const nid = makeMoveableId(); btn.dataset.moveableId = nid; return nid; }catch(_){ return null; } })();
          const saved = upsertMoveable(pageFile, {
            id: id || undefined,
            label,
            className: btn.className || '',
            style: btn.getAttribute('style') || '',
            areaId: areaId,
            fromPage: (function(){
              try {
                if (/^PA\s+\d+/.test(label)) return 'liste-pa.html';
                if (/^FL\s+\d+/.test(label)) return 'liste-atemluftflaschen.html';
                if (/^FH\s+\d+/.test(label)) return 'liste-fluchthauben.html';
                if (/^TF\s+\d+/.test(label)) return 'liste-technikflaschen.html';
                if (/^Si\s+\d+/.test(label)) return 'liste-sicherheitstrupptaschen.html';
                if (/^AM\s+\d+/.test(label)) return 'liste-atemanschluesse.html';
                if (/^X\s+\d+/.test(label)) return 'liste-messgeraete.html';
                if (/^CSA\s+\d+/.test(label)) return 'liste-csa.html';
              } catch(_) {}
              return '';
            })(),
            timestamp: Date.now()
          });
          try { console.log && console.log('[persist] drop saved', { key: moveablesKeyFor(pageFile), pageFile, areaId, label, id: saved && saved.id }); } catch(_) {}
        }
      } catch(_) {}
      // Update global removal/restoration flags for list inventories regardless of current page
      try {
        const label = (btn.dataset && btn.dataset.fullLabel) ? btn.dataset.fullLabel : ((btn.textContent||'').trim());
        const customId = btn.dataset && btn.dataset.customId;
        // CSA
        if (label.startsWith('CSA ') || (customId && customId.startsWith('custom_csa_'))) {
          let removedCSAs = [];
          try { removedCSAs = JSON.parse(localStorage.getItem('removed_csas_liste_csa') || '[]'); } catch (e) {}
          if (!removedCSAs.includes(label)) {
            removedCSAs.push(label);
            localStorage.setItem('removed_csas_liste_csa', JSON.stringify(removedCSAs));
          }
        }
        // Technikflaschen (TF)
        if (/^TF\s+\d+$/i.test(label) || (customId && customId.startsWith('custom_tf_'))) {
          let removed = [];
          try { removed = JSON.parse(localStorage.getItem('removed_tfs_liste_technikflaschen') || '[]'); } catch(_) { removed = []; }
          const idx = removed.indexOf(label);
          if (areaId === 'tf-btn-list') { if (idx !== -1) removed.splice(idx,1); } else if (idx === -1) removed.push(label);
          try { localStorage.setItem('removed_tfs_liste_technikflaschen', JSON.stringify(removed)); } catch(_) {}
        }
        // Fluchthauben (FH)
        else if (/^FH\s+\d+$/i.test(label) || (customId && customId.startsWith('custom_fh_'))) {
          let removed = [];
          try { removed = JSON.parse(localStorage.getItem('removed_fhs_liste_fluchthauben') || '[]'); } catch(_) { removed = []; }
          const idx = removed.indexOf(label);
          if (areaId === 'fh-btn-list') { if (idx !== -1) removed.splice(idx,1); } else if (idx === -1) removed.push(label);
          try { localStorage.setItem('removed_fhs_liste_fluchthauben', JSON.stringify(removed)); } catch(_) {}
        }
        // PA
        else if (/^PA\s+\d+/.test(label) || (customId && customId.startsWith('custom_pa_'))) {
          let removed = [];
          try { removed = JSON.parse(localStorage.getItem('removed_pas_liste_pa') || '[]'); } catch(_) { removed = []; }
          const base = (label.match(/^PA\s+\d+/i)||[''])[0] || label;
          const idx = removed.indexOf(base);
          if (areaId === 'pa-btn-list') { if (idx !== -1) removed.splice(idx,1); } else if (idx === -1) removed.push(base);
          try { localStorage.setItem('removed_pas_liste_pa', JSON.stringify(removed)); } catch(_) {}
          
          // If it's a combined PA+FL button, also handle the FL removal
          if (label.includes(' mit FL ')) {
            const flMatch = label.match(/FL\s+(\d+)/);
            if (flMatch) {
              const flNumber = parseInt(flMatch[1], 10);
              const paNumber = parseInt((label.match(/^PA\s+(\d+)/)||['',''])[1], 10);
              
              if (areaId !== 'pa-btn-list') {
                // Button is being moved away from list, mark FL as removed
                let removedFLs = [];
                try { removedFLs = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]'); } catch(_) { removedFLs = []; }
                const flLabel = `FL ${flNumber}`;
                if (!removedFLs.includes(flLabel)) removedFLs.push(flLabel);
                try { localStorage.setItem('removed_fls_liste_atemluftflaschen', JSON.stringify(removedFLs)); } catch(_) {}
              } else {
                // Button is returning to list, unmark FL as removed
                let removedFLs = [];
                try { removedFLs = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]'); } catch(_) { removedFLs = []; }
                const flLabel = `FL ${flNumber}`;
                const flIdx = removedFLs.indexOf(flLabel);
                if (flIdx !== -1) removedFLs.splice(flIdx, 1);
                try { localStorage.setItem('removed_fls_liste_atemluftflaschen', JSON.stringify(removedFLs)); } catch(_) {}
              }
            }
          }
        }
        // Sicherheitstrupptaschen (Si)
        else if (/^Si\s+\d+$/i.test(label) || (customId && customId.startsWith('custom_si_'))) {
          let removed = [];
          try { removed = JSON.parse(localStorage.getItem('removed_sis_liste_sicherheitstrupptaschen') || '[]'); } catch(_) { removed = []; }
          const idx = removed.indexOf(label);
          if (areaId === 'si-btn-list') { if (idx !== -1) removed.splice(idx,1); } else if (idx === -1) removed.push(label);
          try { localStorage.setItem('removed_sis_liste_sicherheitstrupptaschen', JSON.stringify(removed)); } catch(_) {}
        }
        // Atemanschlüsse (AM)
        else if (/^AM\s+\d+$/i.test(label) || (customId && customId.startsWith('custom_am_'))) {
          let removed = [];
          try { removed = JSON.parse(localStorage.getItem('removed_ams_liste_atemanschluesse') || '[]'); } catch(_) { removed = []; }
          const base = (label.match(/^AM\s+\d+/i)||[''])[0] || label;
          const idx = removed.indexOf(base);
          if (areaId === 'am-btn-list') { if (idx !== -1) removed.splice(idx,1); } else if (idx === -1) removed.push(base);
          try { localStorage.setItem('removed_ams_liste_atemanschluesse', JSON.stringify(removed)); } catch(_) {}
        }
        // FL (Atemluftflaschen) - handle both pre-defined and custom
        else if (/^FL\s+\d+$/i.test(label) || (customId && customId.startsWith('custom_fl_'))) {
          let removed = [];
          try { removed = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]'); } catch(_) { removed = []; }
          const idx = removed.indexOf(label);
          if (areaId === 'fl-btn-list') { if (idx !== -1) removed.splice(idx,1); } else if (idx === -1) removed.push(label);
          try { localStorage.setItem('removed_fls_liste_atemluftflaschen', JSON.stringify(removed)); } catch(_) {}
        }
        // X (Messgeräte) - handle both pre-defined and custom
        else if (/^X\s+\d+$/i.test(label) || (customId && customId.startsWith('custom_x_'))) {
          let removed = [];
          try { removed = JSON.parse(localStorage.getItem('removed_xs_liste_messgeraete') || '[]'); } catch(_) { removed = []; }
          const idx = removed.indexOf(label);
          if (areaId === 'x-btn-list') { if (idx !== -1) removed.splice(idx,1); } else if (idx === -1) removed.push(label);
          try { localStorage.setItem('removed_xs_liste_messgeraete', JSON.stringify(removed)); } catch(_) {}
        }
      } catch(_) {}
    }
  });
};

window.getArea = function(areaId) { return window.areas[areaId] || null; };

window.makeButtonMoveable = function(btn, homeAreaId) {
  btn.classList.add('moveable-btn');
  btn.draggable = true;
  // Only set homeArea if it's not already set (preserve original home)
  if (!btn.dataset.homeArea) {
    btn.dataset.homeArea = homeAreaId;
  }
  // Update currentArea to the area it's being made moveable in
  if (!btn.dataset.currentArea) {
    btn.dataset.currentArea = homeAreaId;
  }
  if (!btn.id) btn.id = 'moveable-btn-' + Math.random().toString(36).slice(2,10);
  
  // Remove old drag handlers to avoid duplicates
  btn.ondragstart = null;
  btn.ondragend = null;
  
  btn.addEventListener('dragstart', function(e){ e.dataTransfer.setData('moveable-btn-id', btn.id); setTimeout(()=>btn.classList.add('dragging'),0); });
  btn.addEventListener('dragend', function(){ btn.classList.remove('dragging'); });
  
  // Store the removal handler for later use by click-to-remove
  const removalHandler = function(){
    try {
      const pageFile = getCurrentPageFile();
      const isListPage = /(^|\/)liste-/i.test(pageFile || '');
      const currentArea = btn.dataset && btn.dataset.currentArea;
      const home = btn.dataset && btn.dataset.homeArea;
      const label = (btn.dataset && btn.dataset.fullLabel) ? btn.dataset.fullLabel : ((btn.textContent||'').trim());
      // Vehicle/static pages: treat as unassign
      if (!isListPage && pageFile) {
        const id = (btn.dataset && btn.dataset.moveableId) ? String(btn.dataset.moveableId) : (label || '');
        try { removeMoveable(pageFile, id); } catch (_) {}
        // Clear removed_* flags so item reappears in its list
        try {
          const customId = btn.dataset && btn.dataset.customId;
          // Check if this is a combined PA+FL button
          const combinedMatch = label.match(/^PA\s+\d+\s+mit\s+FL\s+\d+/i);
          if (combinedMatch) {
            // Extract FL number from combined label and restore it
            const flMatch = label.match(/FL\s+(\d+)/i);
            if (flMatch) {
              const flLabel = `FL ${flMatch[1]}`;
              let arr = []; try { arr = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen')||'[]'); } catch(_) {}
              if (Array.isArray(arr)) { const i = arr.indexOf(flLabel); if (i !== -1) arr.splice(i,1); localStorage.setItem('removed_fls_liste_atemluftflaschen', JSON.stringify(arr)); }
            }
            // Also handle the PA part
            const paMatch = label.match(/^PA\s+\d+/i);
            if (paMatch) {
              let arr = []; try { arr = JSON.parse(localStorage.getItem('removed_pas_liste_pa')||'[]'); } catch(_) {}
              if (Array.isArray(arr)) { const i = arr.indexOf(paMatch[0]); if (i !== -1) arr.splice(i,1); localStorage.setItem('removed_pas_liste_pa', JSON.stringify(arr)); }
            }
          } else if (/^PA\s+\d+/.test(label) || (customId && customId.startsWith('custom_pa_'))) {
            const base = (label.match(/^PA\s+\d+/i)||[''])[0];
            let arr = []; try { arr = JSON.parse(localStorage.getItem('removed_pas_liste_pa')||'[]'); } catch(_) {}
            if (Array.isArray(arr)) { const i = arr.indexOf(base); if (i !== -1) arr.splice(i,1); localStorage.setItem('removed_pas_liste_pa', JSON.stringify(arr)); }
          } else if (/^AM\s+\d+/.test(label) || (customId && customId.startsWith('custom_am_'))) {
            const base = (label.match(/^AM\s+\d+/i)||[''])[0];
            let arr = []; try { arr = JSON.parse(localStorage.getItem('removed_ams_liste_atemanschluesse')||'[]'); } catch(_) {}
            if (Array.isArray(arr)) { const i = arr.indexOf(base); if (i !== -1) arr.splice(i,1); localStorage.setItem('removed_ams_liste_atemanschluesse', JSON.stringify(arr)); }
          } else if (/^TF\s+\d+/.test(label) || (customId && customId.startsWith('custom_tf_'))) {
            let arr = []; try { arr = JSON.parse(localStorage.getItem('removed_tfs_liste_technikflaschen')||'[]'); } catch(_) {}
            if (Array.isArray(arr)) { const i = arr.indexOf(label); if (i !== -1) arr.splice(i,1); localStorage.setItem('removed_tfs_liste_technikflaschen', JSON.stringify(arr)); }
          } else if (/^FH\s+\d+/.test(label) || (customId && customId.startsWith('custom_fh_'))) {
            let arr = []; try { arr = JSON.parse(localStorage.getItem('removed_fhs_liste_fluchthauben')||'[]'); } catch(_) {}
            if (Array.isArray(arr)) { const i = arr.indexOf(label); if (i !== -1) arr.splice(i,1); localStorage.setItem('removed_fhs_liste_fluchthauben', JSON.stringify(arr)); }
          } else if (/^Si\s+\d+/.test(label) || (customId && customId.startsWith('custom_si_'))) {
            let arr = []; try { arr = JSON.parse(localStorage.getItem('removed_sis_liste_sicherheitstrupptaschen')||'[]'); } catch(_) {}
            if (Array.isArray(arr)) { const i = arr.indexOf(label); if (i !== -1) arr.splice(i,1); localStorage.setItem('removed_sis_liste_sicherheitstrupptaschen', JSON.stringify(arr)); }
          } else if (/^FL\s+\d+/.test(label) || (customId && customId.startsWith('custom_fl_'))) {
            let arr = []; try { arr = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen')||'[]'); } catch(_) {}
            if (Array.isArray(arr)) { const i = arr.indexOf(label); if (i !== -1) arr.splice(i,1); localStorage.setItem('removed_fls_liste_atemluftflaschen', JSON.stringify(arr)); }
          } else if (/^X\s+\d+/.test(label) || (customId && customId.startsWith('custom_x_'))) {
            let arr = []; try { arr = JSON.parse(localStorage.getItem('removed_xs_liste_messgeraete')||'[]'); } catch(_) {}
            if (Array.isArray(arr)) { const i = arr.indexOf(label); if (i !== -1) arr.splice(i,1); localStorage.setItem('removed_xs_liste_messgeraete', JSON.stringify(arr)); }
          } else if (/^CSA\s+\d+/.test(label) || (customId && customId.startsWith('custom_csa_'))) {
            let arr = []; try { arr = JSON.parse(localStorage.getItem('removed_csas_liste_csa')||'[]'); } catch(_) {}
            if (Array.isArray(arr)) { const i = arr.indexOf(label); if (i !== -1) arr.splice(i,1); localStorage.setItem('removed_csas_liste_csa', JSON.stringify(arr)); }
          }
        } catch (_) {}
        if (btn.parentNode) btn.parentNode.removeChild(btn);
        return;
      }
      // List pages: move back to home area within page and persist area change
      if (home) {
        if (currentArea && String(currentArea) === String(home)) return;
        const homeRoot = (typeof window.getArea === 'function' ? window.getArea(home) : null) || document.querySelector(`.moveable-area[data-area-id="${home}"]`);
        if (!homeRoot) return;
        const target = homeRoot.querySelector('.area-content') || homeRoot;
        if (btn.parentNode) btn.parentNode.removeChild(btn);
        target.appendChild(btn);
        btn.dataset.currentArea = home;
        // Update click-to-remove state after moving back home
        updateClickToRemoveState(btn);
        if (pageFile) {
          const id = (btn.dataset && btn.dataset.moveableId) ? String(btn.dataset.moveableId) : (function(){ try{ const nid = makeMoveableId(); btn.dataset.moveableId = nid; return nid; }catch(_){ return null; } })();
          upsertMoveable(pageFile, {
            id: id || undefined,
            label,
            areaId: home,
            className: btn.className || '',
            style: btn.getAttribute('style') || '',
            assignedToPage: pageFile,
            timestamp: Date.now()
          });
        }
      }
    } catch (_) {}
  };
  
  // Store handler on button for use by updateClickToRemoveState
  btn.removalHandler = removalHandler;
};

window.resetAreaButtons = function(areaId) {
  const area = window.getArea(areaId);
  if (!area) return;
  const allButtons = Array.from(area.querySelectorAll('.moveable-btn'));
  allButtons.forEach(btn => {
    const home = window.getArea(btn.dataset.homeArea);
    if (home) {
      const homeTarget = home.querySelector('.area-content') || home;
      homeTarget.appendChild(btn);
    }
    btn.dataset.currentArea = btn.dataset.homeArea;
  });
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
    ['GWG', 'gwg.html'],
    ['Lager AGW', 'lager-hauptwache-container.html'],
    ['Lager Hauptwache', 'lager-hauptwache.html'],
    ['In Silschede', 'silschede.html'],
    ['Für Silschede', 'fuer-silschede.html'],
    ['Von Silschede', 'von-silschede.html']
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
  const toggleHandler = ()=>{
    const sel = btn.dataset.selected === 'true'; btn.dataset.selected = String(!sel);
    if (!sel) { btn.style.outline='3px solid #2ecc71'; btn.style.background='#1f1f1f'; } else { btn.style.outline=''; btn.style.background=''; }
    if (typeof onToggle === 'function') { const list = window.getSelectedVehicles(btn.closest('.page-buttons')||btn.parentNode); onToggle(list); }
  };
  btn.addEventListener('click', toggleHandler);
  btn.addEventListener('touchend', (e) => {
    if (!btn.classList.contains('dragging')) {
      e.preventDefault();
      e.stopPropagation();
      toggleHandler();
    }
  }, { passive: false });
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
    'Atemluftflaschen',
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

// Sidebar disabled: remove global click delegation that opened it on moveable buttons

// Ensure a global `window.showAssignmentSidebar` exists that will call the
// original implementation when available, or fall back to a minimal sidebar
// with a working "Entfernen (persist)" action so the UI is reachable from
// the console or when other wiring fails.
try {
  (function installShowAssignmentSidebarFallback(){
    const existing = typeof window.showAssignmentSidebar === 'function' ? window.showAssignmentSidebar : null;
    window.showAssignmentSidebar = function(btn){
      try {
        if (existing && existing !== window.showAssignmentSidebar) {
          try { return existing(btn); } catch(_) {}
        }
      } catch (_) {}
      // Only show the fallback sidebar if the button is inside a moveable area
      try {
        const inArea = btn && typeof btn.closest === 'function' && btn.closest('.moveable-area');
        if (!inArea) return null;
      } catch (_) {}

      // Fallback: build a minimal sidebar with a remove button that mirrors
      // the removal logic used elsewhere.
      try {
        if (!btn) return null;
        let sb = document.getElementById('assignment-sidebar');
        if (!sb) {
          sb = document.createElement('div'); sb.id = 'assignment-sidebar';
          sb.style.position = 'fixed'; sb.style.top='0'; sb.style.right='0'; sb.style.width='340px';
          sb.style.height='100%'; sb.style.background='#fff'; sb.style.boxShadow='-4px 0 24px rgba(0,0,0,0.12)';
          sb.style.zIndex='100000000'; sb.style.display='flex'; sb.style.flexDirection='column';
          sb.style.padding='24px 18px 18px 18px'; sb.style.overflowY='auto';
          document.body.appendChild(sb);
        }
        sb.innerHTML = '';
        const close = document.createElement('button'); close.innerHTML='&times;'; close.className='sidebar-close-btn';
        const closeSimpleHandler = ()=>{ sb.style.display='none'; };
        close.onclick = closeSimpleHandler;
        close.addEventListener('touchend', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeSimpleHandler();
        }, { passive: false });
        sb.appendChild(close);
        const title = document.createElement('h2'); title.textContent = `Wohin soll ${btn.textContent} verschoben werden?`; title.style.fontSize='1.1rem'; title.style.margin='0 0 12px 0'; sb.appendChild(title);
        const rem = document.createElement('button'); rem.textContent = 'Entfernen (persist)'; rem.className='btn btn-red'; rem.style.marginBottom='12px';
        const removeHandler = function(){
          try {
            const current = (window.currentPageFile || (window.location.hash.replace(/^#/, '') || '') + '.html') || '';
            const pageFile = String(current).endsWith('.html') ? String(current) : String(current) + '.html';
            const keyCanon = moveablesKeyFor(pageFile);
            const keyLegacy = moveablesLegacyKeyFor(pageFile);
            // remove from canonical
            try {
              let arr = [];
              try { arr = JSON.parse(localStorage.getItem(keyCanon) || '[]'); } catch(_) { arr = []; }
              arr = Array.isArray(arr) ? arr : [];
              if (btn && btn.dataset && btn.dataset.moveableId) arr = arr.filter(m => String(m.id||'') !== String(btn.dataset.moveableId));
              else if (btn && btn.dataset && btn.dataset.fullLabel) arr = arr.filter(m => String(m.label||'') !== String(btn.dataset.fullLabel));
              else arr = arr.filter(m => String(m.label||'') !== String((btn.textContent||'').trim()));
              try { localStorage.setItem(keyCanon, JSON.stringify(arr)); } catch(_) {}
              try { console.debug && console.debug('RemovePersist(fallback): removed from', keyCanon); } catch(_) {}
            } catch(_){}
            // legacy
            try {
              let arr2 = [];
              try { arr2 = JSON.parse(localStorage.getItem(keyLegacy) || '[]'); } catch(_) { arr2 = []; }
              arr2 = Array.isArray(arr2) ? arr2 : [];
              if (btn && btn.dataset && btn.dataset.moveableId) arr2 = arr2.filter(m => String(m.id||'') !== String(btn.dataset.moveableId));
              else if (btn && btn.dataset && btn.dataset.fullLabel) arr2 = arr2.filter(m => String(m.label||'') !== String(btn.dataset.fullLabel));
              else arr2 = arr2.filter(m => String(m.label||'') !== String((btn.textContent||'').trim()));
              try { localStorage.setItem(keyLegacy, JSON.stringify(arr2)); } catch(_) {}
              try { console.debug && console.debug('RemovePersist(fallback): removed from', keyLegacy); } catch(_) {}
            } catch(_){}
            // PA removed list
            try {
              const txt = (btn.dataset.fullLabel || btn.textContent || '').trim();
              const paMatch = (txt || '').match(/PA\s+(\d+)/i);
              if (paMatch) {
                const base = `PA ${parseInt(paMatch[1],10)}`;
                let removedPAs = [];
                try { removedPAs = JSON.parse(localStorage.getItem('removed_pas_liste_pa') || '[]'); } catch(_) { removedPAs = []; }
                removedPAs = Array.isArray(removedPAs) ? removedPAs : [];
                if (removedPAs.indexOf(base) === -1) { removedPAs.push(base); try { localStorage.setItem('removed_pas_liste_pa', JSON.stringify(removedPAs)); } catch(_) {} }
              }
            } catch(_){}
            // X removed list
            try {
              const txt = (btn.dataset.fullLabel || btn.textContent || '').trim();
              const xMatch = (txt || '').match(/X\s+(\d+)/i);
              if (xMatch) {
                const base = `X ${parseInt(xMatch[1],10)}`;
                let removedXs = [];
                try { removedXs = JSON.parse(localStorage.getItem('removed_xs_liste_messgeraete') || '[]'); } catch(_) { removedXs = []; }
                removedXs = Array.isArray(removedXs) ? removedXs : [];
                if (removedXs.indexOf(base) === -1) { removedXs.push(base); try { localStorage.setItem('removed_xs_liste_messgeraete', JSON.stringify(removedXs)); } catch(_) {} }
              }
            } catch(_){}
            // return to home area visually
            try {
              let homeArea = (btn && btn.dataset && btn.dataset.homeArea) ? btn.dataset.homeArea : null;
              if (!homeArea) {
                const lbl = (btn.dataset.fullLabel || btn.textContent || '').trim();
                if (lbl.startsWith('FL ')) homeArea = 'fl-btn-list';
                else if (lbl.startsWith('PA ')) homeArea = 'pa-btn-list';
                else if (lbl.startsWith('Si ')) homeArea = 'si-btn-list';
                else if (lbl.startsWith('TF ')) homeArea = 'tf-btn-list';
                else if (lbl.startsWith('FH ')) homeArea = 'fh-btn-list';
                else if (lbl.startsWith('AM ')) homeArea = 'am-btn-list';
                else if (lbl.startsWith('X ')) homeArea = 'x-btn-list';
                else if (lbl.startsWith('CSA ')) homeArea = 'csa-btn-list';
              }
              let homeContainer = null;
              try { homeContainer = document.getElementById(homeArea); } catch(_) { homeContainer = null; }
              if (!homeContainer) try { homeContainer = document.querySelector(`.moveable-area[data-area-id="${homeArea}"] .area-content`); } catch(_) { homeContainer = null; }
              if (!homeContainer) try { homeContainer = document.querySelector(`.moveable-area[data-area-id="${homeArea}"]`); } catch(_) { homeContainer = null; }
              try { if (btn.parentNode) btn.parentNode.removeChild(btn); } catch(_) {}
              if (homeContainer) {
                try { homeContainer.appendChild(btn); if (btn.dataset) { btn.dataset.currentArea = homeArea; btn.dataset.homeArea = homeArea; } if (typeof window.makeButtonMoveable === 'function') try { window.makeButtonMoveable(btn, homeArea); } catch(_) {} } catch(_) {}
              }
            } catch(_){}
          } catch(_){}
          try { sb.style.display='none'; } catch(_){}
        };
        rem.addEventListener('click', removeHandler);
        rem.addEventListener('touchend', (e) => {
          e.preventDefault();
          e.stopPropagation();
          removeHandler();
        }, { passive: false });
        sb.appendChild(rem);
        sb.style.display='flex';
        return sb;
      } catch (e) { return null; }
    };
  })();
} catch (_) {}

// Helper: canonicalize moveables localStorage key for a page or slug
function moveablesKeyFor(pageOrFile) {
  try {
    const p = String(pageOrFile || '');
    const file = p.endsWith('.html') ? p : (p + '.html');
    return 'moveables_' + file;
  } catch (_) { return 'moveables_' + String(pageOrFile || ''); }
}

// Helper: get the current SPA page filename in canonical form (single .html suffix)
function getCurrentPageFile() {
  try {
    const raw = String(window.currentPageFile || (window.location.hash || '')).replace(/^#/, '');
    if (!raw) return '';
      let file = raw.endsWith('.html') ? raw : (raw + '.html');
    return file.replace(/(\.html)+$/i, '.html');
  } catch (_) { return ''; }
}

// App version (for quick sanity that latest SPA is loaded)
try { window.APP_VERSION = '20251119.1'; } catch (_) {}

// Helper: generate a compact stable id for moveable entries
function makeMoveableId() {
  try { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8); } catch (_) { return String(Math.random()).slice(2); }
}

// Helper: legacy key form used in older persisted data (slug-only)
function moveablesLegacyKeyFor(pageOrFile) {
  try {
    const p = String(pageOrFile || '');
    // If a filename was passed, strip .html to produce the legacy slug
    const slug = p.endsWith('.html') ? p.slice(0, -5) : p;
    return 'moveables_' + slug;
  } catch (_) { return 'moveables_' + String(pageOrFile || ''); }
}

// --- Durable Moveables Helpers (read/upsert/remove/dedupe) ---
function readMoveables(pageFile) {
  try {
    const key = moveablesKeyFor(pageFile);
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (_) { return []; }
}

function writeMoveables(pageFile, list) {
  try { localStorage.setItem(moveablesKeyFor(pageFile), JSON.stringify(Array.isArray(list) ? list : [])); } catch (_) {}
}

function normalizeMoveableItem(item) {
  const m = item || {};
  const out = {
    id: m.id || m.timestamp || null,
    label: (m.label || '').trim(),
    baseLabel: m.baseLabel || '',
    className: m.className || '',
    style: m.style || '',
    areaId: m.areaId || '',
    areaTitle: m.areaTitle || '',
    fromPage: m.fromPage || '',
    assignedToPage: m.assignedToPage || '',
    timestamp: m.timestamp || Date.now()
  };
  if (!out.id) out.id = makeMoveableId();
  return out;
}

function dedupeMoveables(list) {
  const byKey = new Map();
  (Array.isArray(list) ? list : []).forEach(raw => {
    const it = normalizeMoveableItem(raw);
    // Prefer uniqueness by label
    const key = (it.label || '').trim();
    const prev = byKey.get(key);
    if (!prev) byKey.set(key, it);
    else {
      // Keep the most recent
      byKey.set(key, (it.timestamp || 0) >= (prev.timestamp || 0) ? it : prev);
    }
  });
  return Array.from(byKey.values());
}

function upsertMoveable(pageFile, partial) {
  const it = normalizeMoveableItem(partial);
    let list = readMoveables(pageFile) || [];
  // Replace by id first, else by label
  let replaced = false;
  list = list.map(m => {
    const mid = String(m.id || m.timestamp || '');
    if (mid && it.id && String(it.id) === mid) { replaced = true; return it; }
    if (!replaced && (m.label || '').trim() === it.label) { replaced = true; return it; }
    return m;
  });
  if (!replaced) list.push(it);
  list = dedupeMoveables(list);
  writeMoveables(pageFile, list);
  return it;
}

function removeMoveable(pageFile, idOrLabel) {
  const key = moveablesKeyFor(pageFile);
  let list = readMoveables(pageFile);
  const needle = String(idOrLabel || '').trim();
  list = list.filter(m => {
    const mid = String(m.id || m.timestamp || '');
    if (mid && needle && mid === needle) return false;
    if ((m.label || '').trim() === needle) return false;
    return true;
  });
  list = dedupeMoveables(list);
  writeMoveables(pageFile, list);
}

// Export moveable helpers to global scope for cross-file access
window.upsertMoveable = upsertMoveable;
window.readMoveables = readMoveables;
window.writeMoveables = writeMoveables;
window.removeMoveable = removeMoveable;

// Normalize/migrate any legacy `moveables_<slug>` keys to the canonical
// `moveables_<slug>.html` form at startup. This avoids inconsistent key
// usage across the codebase where some writers/readers use the slug-only
// key and others use the `.html` filename. The migration is idempotent and
// merges duplicates while deduping by label+areaId+assignedToPage.
(function normalizeMoveablesLocalStorageKeys() {
  try {
    const prefix = 'moveables_';
    const allKeys = Object.keys(localStorage || {});
    const moveableKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(prefix));
    moveableKeys.forEach(k => {
      try {
        // if already in canonical form, skip
        const name = k.substring(prefix.length);
        if (/\.html$/i.test(name)) return;
        const canonical = prefix + name + '.html';
        // Read both arrays (old and canonical)
        let oldArr = [];
        try { oldArr = JSON.parse(localStorage.getItem(k) || '[]'); } catch (_) { oldArr = []; }
        let newArr = [];
        try { newArr = JSON.parse(localStorage.getItem(canonical) || '[]'); } catch (_) { newArr = []; }
        if (!Array.isArray(oldArr)) oldArr = [];
        if (!Array.isArray(newArr)) newArr = [];
        // Merge and dedupe by label+areaId+assignedToPage
        const map = new Map();
        newArr.concat(oldArr).forEach(item => {
          try {
            // Ensure every persisted item has a stable id so future removals
            // can reliably target items by id. Assign ids to legacy entries
            // that lack one (migration is idempotent).
            if (item && !item.id) {
              try { item.id = makeMoveableId(); } catch (_) { item.id = String(Math.random()).slice(2); }
            }
            const key = (String((item && item.label) || '') + '|' + String((item && item.areaId) || '') + '|' + String((item && item.assignedToPage) || '')).trim();
            if (!map.has(key)) map.set(key, item);
          } catch (_) {}
        });
        const out = Array.from(map.values());
        try { localStorage.setItem(canonical, JSON.stringify(out)); } catch (_) {}
        try { localStorage.removeItem(k); } catch (_) {}
      } catch (_) {}
    });

    // Dedupe canonical keys as well, by label with latest timestamp
    const canonicalKeys = allKeys.filter(k => /^moveables_.+\.html$/i.test(k));
    canonicalKeys.forEach(cKey => {
      try {
        let arr = JSON.parse(localStorage.getItem(cKey) || '[]');
        arr = dedupeMoveables(arr);
        localStorage.setItem(cKey, JSON.stringify(arr));
      } catch (_) {}
    });
  } catch (_) {}
})();

// Expose a manual cleanup utility to re-run migration + dedupe on demand
try {
  window.runMoveablesCleanup = function() {
    try {
      const prefix = 'moveables_';
      const allKeys = Object.keys(localStorage || {});
      // First migrate legacy -> canonical
      allKeys.filter(k => k.startsWith(prefix)).forEach(k => {
        const name = k.substring(prefix.length);
        if (/\.html$/i.test(name)) return; // already canonical
        const canonical = prefix + name + '.html';
        let oldArr = [];
        let newArr = [];
        try { oldArr = JSON.parse(localStorage.getItem(k) || '[]'); } catch (_) { oldArr = []; }
        try { newArr = JSON.parse(localStorage.getItem(canonical) || '[]'); } catch (_) { newArr = []; }
        if (!Array.isArray(oldArr)) oldArr = [];
        if (!Array.isArray(newArr)) newArr = [];
        const merged = dedupeMoveables([].concat(newArr, oldArr));
        try { localStorage.setItem(canonical, JSON.stringify(merged)); } catch (_) {}
        try { localStorage.removeItem(k); } catch (_) {}
      });
      // Then dedupe all canonical
      const refreshed = Object.keys(localStorage || {}).filter(k => /^moveables_.+\.html$/i.test(k));
      refreshed.forEach(cKey => {
        try {
          let arr = JSON.parse(localStorage.getItem(cKey) || '[]');
          arr = dedupeMoveables(arr);
          localStorage.setItem(cKey, JSON.stringify(arr));
        } catch (_) {}
      });
      console.log('[cleanup] Moveables cleanup completed. Keys:', refreshed || []);
    } catch (e) {
      console.error('[cleanup] Failed:', e);
    }
  };
} catch (_) {}

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

// (Removed) DOM MutationObserver persistence to align with baseline behavior

// ---- Simple 60-min authentication gate (password + name) ----
const AUTH_UNTIL_KEY = 'auth_until_ms';
const AUTH_NAME_KEY = 'auth_user_name';
const AUTH_LOG_KEY = 'auth_login_log_v1';

// Note: Removed legacy dblclick interception shim. All dblclick behavior
// is handled in the canonical window.makeButtonMoveable above.

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
  // Only show on hauptmenu page (check SPA routing hash)
  const currentSpaPage = window.location.hash.replace(/^#/, '') || 'hauptmenu';
  const isMainPage = currentSpaPage === 'hauptmenu' || currentSpaPage === '';
  
  let w = document.getElementById('login-log-widget');
  if (!isMainPage) {
    // Remove widget if on other pages
    try { if (w) w.remove(); } catch (_) {}
    return;
  }
  
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
  pwInput.style.boxSizing = 'border-box';
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
  nameInput.style.boxSizing = 'border-box';
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
    if (typeof onSuccess === 'function') onSuccess();
    // Render login widget after navigation has completed (delay to ensure hash is updated)
    setTimeout(() => { try { renderLoginLogWidget(); } catch (_) {} }, 100);
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

// --- Button and Storage Helpers ---
// List of all vehicle pages (used by all button list renders)
const VEHICLE_PAGES = ['1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html','2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html','tlf-azubi.html','hauptwache.html'];

// Get custom text for a button label from localStorage
function getCustomButtonText(baseLabel) {
  try {
    const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
    return customButtonTexts[baseLabel] || baseLabel;
  } catch (e) {
    return baseLabel;
  }
}

// Store custom text for a button label in localStorage
function setCustomButtonText(baseLabel, customText) {
  try {
    const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
    customButtonTexts[baseLabel] = customText;
    localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
  } catch (e) {}
}

// Get removed items from localStorage
function getRemovedItems(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    return [];
  }
}

// Set removed items in localStorage
function setRemovedItems(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {}
}

// Get custom numbers from localStorage
function getCustomNumbers(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    return [];
  }
}

// Set custom numbers in localStorage
function setCustomNumbers(key, numbers) {
  try {
    localStorage.setItem(key, JSON.stringify(numbers));
  } catch (e) {}
}

// Extract numeric value from a button label for sorting (e.g., "PA 60" -> 60, "PA 60 mit FL 126" -> 60)
function getButtonSortNumber(label) {
  if (!label) return Infinity;
  const match = String(label).match(/^[A-Za-z\s]+(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
}

// Sort moveables by their numeric value for consistent ordering
function sortMoveablesByNumber(moveables) {
  return (moveables || []).slice().sort((a, b) => {
    const numA = getButtonSortNumber(a.label);
    const numB = getButtonSortNumber(b.label);
    return numA - numB;
  });
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

// --- Render Silschede Page with ERK buttons ---
function renderSilschede() {
  const container = document.getElementById('areas-container');
  if (!container) return;
  
  // Define the two areas for ERK buttons
  const areas = [
    { title: 'Atemanschlüsse', areaId: 'atemanschluesse' },
    { title: 'Atemschutzgeräte', areaId: 'atemschutzgeraete' }
  ];
  
  // Create area divs
  areas.forEach(area => {
    const areaDiv = document.createElement('div');
    areaDiv.className = 'moveable-area';
    areaDiv.dataset.areaId = area.areaId;
    
    const title = document.createElement('h3');
    title.className = 'area-title';
    title.textContent = area.title;
    areaDiv.appendChild(title);
    
    const content = document.createElement('div');
    content.className = 'area-content';
    areaDiv.appendChild(content);
    
    if (window.registerArea) window.registerArea(area.areaId, areaDiv);
    container.appendChild(areaDiv);
  });
  
  // Render 100 ERK buttons (50 in each area)
  const erkCount = 100;
  const buttonsPerArea = erkCount / 2;
  
  for (let i = 1; i <= erkCount; i++) {
    const erkLabel = 'ERK';
    const erkId = String(i);
    
    // Check if this ERK is assigned to a vehicle
    let isAssigned = false;
    const vehiclePages = [
      '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
      '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html',
      'tlf-azubi.html','hauptwache.html'
    ];
    
    vehiclePages.forEach(pageFile => {
      let moveables = [];
      try { moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageFile)) || '[]'); } catch (e) {}
      (moveables||[]).forEach(m => {
        if (m && m.label === erkLabel && m.type === 'erk' && m.erkId === erkId) {
          isAssigned = true;
        }
      });
    });
    
    // Only show unassigned ERK buttons in silschede
    if (!isAssigned) {
      const btn = document.createElement('button');
      btn.textContent = erkLabel;
      btn.className = 'btn';
      btn.dataset.fullLabel = erkLabel;
      btn.dataset.erkType = 'erk';
      btn.dataset.erkId = erkId;
      btn.style.border = '2px solid #3b82f6';
      btn.style.color = '#fff';
      btn.style.background = '#3b82f6';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      btn.style.cursor = 'grab';
      
      // Wire up sidebar handler
      try {
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          }, { passive: false });
        }
      } catch(_) {}
      
      // Determine which area to add button to (first 50 go to area 0, next 50 to area 1)
      const areaIndex = i <= buttonsPerArea ? 0 : 1;
      const areaId = areas[areaIndex].areaId;
      
      // Make button moveable
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, areaId);
      
      // Add to appropriate area
      const areaContent = container.querySelector(`[data-area-id="${areaId}"] .area-content`);
      if (areaContent) areaContent.appendChild(btn);
    }
  }
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

// --- Helper function to identify button location ---
function getButtonLocation(btn) {
  try {
    // Try to find the closest parent section with id (page name)
    const section = btn.closest('section[id]');
    if (section && section.id) {
      return section.id.replace(/-page$/, '').replace(/-/g, ' ');
    }
    // Check if it's on a vehicle page
    const currentPage = window.location.hash.replace(/^#/, '') || 'hauptmenu';
    if (currentPage && currentPage !== 'hauptmenu') {
      return currentPage.replace(/.html$/, '').replace(/-/g, ' ');
    }
    return 'einer Liste';
  } catch (_) {
    return 'einer Liste';
  }
}

// --- Global search function to find button in all locations ---
function findButtonGlobally(buttonText) {
  try {
    const buttonText_trim = (buttonText || '').trim();
    if (!buttonText_trim) return null;
    
    // 1. Search in currently visible buttons on DOM
    const allVisibleButtons = document.querySelectorAll('button.moveable-btn, button.pa-btn, button.fl-btn, button.tf-btn, button.fh-btn, button.am-btn, button.si-btn, button.x-btn, button.csa-btn');
    for (const btn of allVisibleButtons) {
      if ((btn.textContent || '').trim() === buttonText_trim) {
        return {
          found: true,
          location: getButtonLocation(btn),
          type: 'visible'
        };
      }
    }
    
    // 2. Search in vehicle pages (moveables)
    const vehiclePages = ['1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html','2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html','tlf-azubi.html','hauptwache.html'];
    for (const pageFile of vehiclePages) {
      try {
        const moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageFile)) || '[]');
        for (const m of moveables) {
          if ((m.label || '').trim() === buttonText_trim) {
            return {
              found: true,
              location: pageFile.replace(/.html$/, '').replace(/-/g, ' '),
              type: 'vehicle_page'
            };
          }
        }
      } catch (_) {}
    }
    
    // 3. Search in home list pages (removed buttons)
    const homePages = ['liste_pa', 'liste_fl', 'liste_tf', 'liste_fh', 'liste_am', 'liste_si', 'liste_x', 'liste_csa'];
    const prefixes = ['PA', 'FL', 'TF', 'FH', 'AM', 'Si', 'X', 'CSA'];
    for (const prefix of prefixes) {
      try {
        const removedKey = `removed_${prefix.toLowerCase()}_liste_${prefix.toLowerCase()}`;
        const removed = JSON.parse(localStorage.getItem(removedKey) || '[]');
        for (const item of removed) {
          const itemLabel = (typeof item === 'object' ? item.label : item) || '';
          if (itemLabel.trim() === buttonText_trim) {
            return {
              found: true,
              location: `liste ${prefix.toLowerCase()}`,
              type: 'removed'
            };
          }
        }
      } catch (_) {}
    }
    
    return { found: false };
  } catch (_) {
    return { found: false };
  }
}

// Helper function to extract number from button text for sorting
function extractButtonNumber(text) {
  const match = text.match(/^\w+\s+(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
}

// Sort buttons in a container by their numeric value
function sortButtonsByNumber(container) {
  if (!container) return;
  const buttons = Array.from(container.querySelectorAll('button'));
  buttons.sort((a, b) => {
    const numA = extractButtonNumber(a.textContent);
    const numB = extractButtonNumber(b.textContent);
    return numA - numB;
  });
  buttons.forEach(btn => container.appendChild(btn));
}

// --- Generic moveable button renderer for FL, TF, FH, etc. ---
function renderMoveableButtons(container, numbers, prefix, className, styleFn) {

  numbers.forEach(num => {
    const btn = document.createElement('button');
    const defaultLabel = prefix + ' ' + num;
    
    // Check if there's a custom text stored for this button
    let buttonText = defaultLabel;
    try {
      const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
      if (customButtonTexts[defaultLabel]) {
        buttonText = customButtonTexts[defaultLabel];
      }
    } catch (e) {}
    
    btn.textContent = buttonText;
    btn.dataset.fullLabel = defaultLabel;
    btn.setAttribute('draggable', 'true');
    btn.className = 'btn ' + (className || '');
    if (typeof styleFn === 'function') styleFn(btn, num);
    // Always wire moveable behavior so dragstart sets dataTransfer id
    try {
      const c = typeof container === 'string' ? document.querySelector(container) : container;
      const homeAreaId = (c && c.id) || (c && c.closest && c.closest('.moveable-area') && c.closest('.moveable-area').dataset && c.closest('.moveable-area').dataset.areaId) || '';
      if (typeof window.makeButtonMoveable === 'function') window.makeButtonMoveable(btn, homeAreaId);
    } catch(_) {}
    // Home list buttons: open the assignment sidebar on click
    try { 
      if (typeof showAssignmentSidebar === 'function') {
        const sidebarHandler = function() { showAssignmentSidebar(btn); };
        btn.addEventListener('click', sidebarHandler);
        // Add touch support for iPad
        btn.addEventListener('touchend', function(e) {
          // Only trigger if it's a tap, not a drag
          const touch = e.changedTouches && e.changedTouches[0];
          if (touch && !btn.classList.contains('dragging')) {
            e.preventDefault();
            e.stopPropagation();
            sidebarHandler();
          }
        });
      }
    } catch(_) {}
    container.appendChild(btn);
  });
}
// Expose globally so renderers can call it
window.renderMoveableButtons = renderMoveableButtons;
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
  try { console.log && console.log('showAssignmentSidebar start', moveableBtn && (moveableBtn.textContent||moveableBtn)); } catch(_) {}
  // Remove any existing sidebars to avoid overlaying the next one
  try {
    ['assignment-sidebar','area-select-sidebar','fl-select-sidebar','personal-select-sidebar'].forEach(function(id){
      const el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  } catch(_) {}
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
    sb.style.zIndex = '100000000';
    sb.style.display = 'flex';
    sb.style.flexDirection = 'column';
    sb.style.padding = '24px 18px 18px 18px';
    sb.style.overflowY = 'auto';
    window.sidebar = sb;
    try { if (!sb.parentNode) document.body.appendChild(sb); } catch(e) { try { console.error('showAssignmentSidebar: initial append failed', e); } catch(_) {} }
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
  const closeSidebarHandler = () => { sidebar.style.display = 'none'; };
  closeBtn.onclick = closeSidebarHandler;
  closeBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeSidebarHandler();
  }, { passive: false });
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
    // Check if flNumber is a custom FL button (doesn't start with a number)
    const isCustomFL = isNaN(parseInt(flNumber, 10));
    right.textContent = isCustomFL ? flNumber : `FL ${flNumber}`;
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
    
    // Set the full label for persistence - construct it before adding any HTML
    const flText = isCustomFL ? flNumber : `FL ${flNumber}`;
    const fullLabel = `${paTxt} mit ${flText}`;
    btn.dataset.fullLabel = fullLabel;
    
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
    // Check if flNumber is a custom FL button (doesn't start with a number)
    const isCustomFL = isNaN(parseInt(flNumber, 10));
    right.textContent = isCustomFL ? flNumber : `FL ${flNumber}`;
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
  
  // Set the full label for persistence
  const isCustomFlSi = isNaN(parseInt(flNumber, 10));
  const flTextSi = isCustomFlSi ? flNumber : `FL ${flNumber}`;
  const fullLabelSi = `${siTxt} mit ${flTextSi}`;
  btn.dataset.fullLabel = fullLabelSi;
  
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
    
    // Get custom button texts for comparison
    const customButtonTexts = {};
    try {
      const stored = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
      Object.assign(customButtonTexts, stored);
    } catch (e) {}
    
    vehiclePages.forEach(page => {
      try {
        const moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(page)) || '[]');
        (moveables||[]).forEach(m => {
          if (m.areaId === 'fl' && m.label) {
            // Check for pre-defined FL buttons
            if (/^FL\s+\d+/.test(m.label)) {
              assigned.add(m.label.trim());
            } else {
              // Check if this is a custom FL button - match by the display text
              const displayText = customButtonTexts[m.label] || m.label;
              assigned.add(displayText);
            }
          }
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
    
    // Also include custom FL buttons (they have text labels, not just numbers)
    let customFLButtons = [];
    try { customFLButtons = JSON.parse(localStorage.getItem('custom_fl_buttons') || '[]'); } catch (e) {}
    
    // Add custom buttons to available list if not assigned
    const customAvailable = customFLButtons
      .filter(btn => {
        const text = customButtonTexts[btn.label] || btn.label;
        return !assigned.has(text) && !removedSet.has(text);
      })
      .map(btn => ({
        isCustom: true,
        customId: btn.id,
        text: customButtonTexts[btn.label] || btn.label,
        color: btn.color || 'golden'
      }));
    
    const goldSet = new Set(goldenFL);
    const isGold = (n) => goldSet.has(n);
    
    return { 
      available: available.sort((a,b)=>a-b),
      customAvailable: customAvailable,
      isGold: isGold
    };
  }

  // Join option for PA
  if (isPA(moveableBtn) && !isCombinedPA(moveableBtn)) {
    const joinBtn = document.createElement('button');
    joinBtn.textContent = 'Mit FL verbinden';
    joinBtn.className = 'btn btn-purple';
    joinBtn.style.marginBottom = '12px';
    joinBtn.addEventListener('click', () => {
      // Remove the main assignment sidebar before opening FL selector
      const assignmentSidebar = document.getElementById('assignment-sidebar');
      if (assignmentSidebar && assignmentSidebar.parentNode) {
        assignmentSidebar.parentNode.removeChild(assignmentSidebar);
      }
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
      flSidebar.style.zIndex = '100000001';
      flSidebar.style.display = 'flex';
      flSidebar.style.flexDirection = 'column';
      flSidebar.style.padding = '24px 18px 18px 18px';
      flSidebar.style.overflowY = 'auto';
      const close2 = document.createElement('button');
      close2.className = 'sidebar-close-btn';
      close2.innerHTML = '&times;';
      close2.title = 'Schließen';
      const closeFLHandler = () => { flSidebar.style.display='none'; };
      close2.onclick = closeFLHandler;
      close2.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeFLHandler();
      }, { passive: false });
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
      const { available, customAvailable, isGold } = computeAvailableFLNumbers();
      
      // Create combined sorted list of pre-defined and custom buttons
      const allButtons = [];
      available.forEach(num => {
        allButtons.push({ type: 'predefined', num: num, text: 'FL ' + num });
      });
      
      // Load custom FL buttons fresh from localStorage
      let customFLButtonsFromStorage = [];
      let customButtonTextsFromStorage = {};
      try { 
        customFLButtonsFromStorage = JSON.parse(localStorage.getItem('custom_fl_buttons') || '[]');
        customButtonTextsFromStorage = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
      } catch (e) {}
      
      customAvailable.forEach(btn => {
        const match = btn.text.match(/(\d+)/);
        const sortNum = match ? parseInt(match[1], 10) : 999999;
        allButtons.push({ type: 'custom', num: sortNum, text: btn.text, color: btn.color, customId: btn.customId });
      });
      
      // Also add any custom FL buttons directly from localStorage that might have been missed
      customFLButtonsFromStorage.forEach(customBtn => {
        const displayText = customButtonTextsFromStorage[customBtn.label] || customBtn.label;
        // Check if this button is already in allButtons
        const alreadyAdded = allButtons.some(b => b.type === 'custom' && b.customId === customBtn.id);
        if (!alreadyAdded && customAvailable.some(c => c.customId === customBtn.id)) {
          // Already in customAvailable, skip
          return;
        }
        if (!alreadyAdded) {
          const match = displayText.match(/(\d+)/);
          const sortNum = match ? parseInt(match[1], 10) : 999999;
          allButtons.push({ type: 'custom', num: sortNum, text: displayText, color: customBtn.color, customId: customBtn.id });
        }
      });
      
      allButtons.sort((a, b) => a.num - b.num);
      
      allButtons.forEach(btnData => {
        const b = document.createElement('button');
        b.textContent = btnData.text;
        b.className = 'btn fl-btn';
        b.style.minWidth = '64px';
        b.style.minHeight = '44px';
        b.style.fontWeight = '700';
        b.style.fontSize = '1.05rem';
        b.style.margin = '4px';
        
        let styleKind;
        if (btnData.type === 'custom') {
          styleKind = btnData.color === 'grey' ? 'grey' : 'gold';
        } else {
          styleKind = isGold(btnData.num) ? 'gold' : 'grey';
        }
        
        if (styleKind === 'gold') {
          b.style.border = '2px solid #000';
          b.style.color = '#fff';
          b.style.background = '#bfa100';
        } else {
          b.style.border = '2px solid #888';
          b.style.color = '#bbb';
          b.style.background = '#444';
        }
        
        b.addEventListener('click', () => {
          if (btnData.type === 'custom') {
            // For custom FL buttons, pass just the display text (without "FL " prefix)
            decorateCombinedPAInline(moveableBtn, btnData.text, styleKind);
            updateRemovedFL(btnData.text, true);
          } else {
            // For predefined FL buttons, pass the number only
            decorateCombinedPAInline(moveableBtn, btnData.num, styleKind);
            updateRemovedFL('FL ' + btnData.num, true);
            // Persist join state on Liste PA so it survives navigation if not assigned yet
            try {
              const current = window.location.hash.replace(/^#/, '') || 'hauptmenu';
              if (current === 'liste-pa') {
                const paMatch = (moveableBtn.textContent||'').match(/PA\s+(\d+)/i);
                const paNum = paMatch ? parseInt(paMatch[1], 10) : null;
                if (paNum) upsertCombinedPA(paNum, btnData.num);
              }
            } catch (_) {}
          }
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
      // Remove the main assignment sidebar before opening FL selector
      const assignmentSidebar = document.getElementById('assignment-sidebar');
      if (assignmentSidebar && assignmentSidebar.parentNode) {
        assignmentSidebar.parentNode.removeChild(assignmentSidebar);
      }
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
      flSidebar.style.zIndex = '100000001';
      flSidebar.style.display = 'flex';
      flSidebar.style.flexDirection = 'column';
      flSidebar.style.padding = '24px 18px 18px 18px';
      flSidebar.style.overflowY = 'auto';
      const close2 = document.createElement('button');
      close2.className = 'sidebar-close-btn';
      close2.innerHTML = '&times;';
      close2.title = 'Schließen';
      const closeSiFLHandler = () => { flSidebar.style.display='none'; };
      close2.onclick = closeSiFLHandler;
      close2.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeSiFLHandler();
      }, { passive: false });
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
      const { available, customAvailable, isGold } = computeAvailableFLNumbers();
      
      // Load custom FL buttons fresh from localStorage
      let customFLButtonsFromStorage = [];
      let customButtonTextsFromStorage = {};
      try { 
        customFLButtonsFromStorage = JSON.parse(localStorage.getItem('custom_fl_buttons') || '[]');
        customButtonTextsFromStorage = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
      } catch (e) {}
      
      // Create combined sorted list of pre-defined and custom buttons
      const allButtons = [];
      available.forEach(num => {
        allButtons.push({ type: 'predefined', num: num, text: 'FL ' + num });
      });
      
      customAvailable.forEach(btn => {
        const match = btn.text.match(/(\d+)/);
        const sortNum = match ? parseInt(match[1], 10) : 999999;
        allButtons.push({ type: 'custom', num: sortNum, text: btn.text, color: btn.color, customId: btn.customId });
      });
      
      // Also add any custom FL buttons directly from localStorage that might have been missed
      customFLButtonsFromStorage.forEach(customBtn => {
        const displayText = customButtonTextsFromStorage[customBtn.label] || customBtn.label;
        const alreadyAdded = allButtons.some(b => b.type === 'custom' && b.customId === customBtn.id);
        if (!alreadyAdded && customAvailable.some(c => c.customId === customBtn.id)) {
          return;
        }
        if (!alreadyAdded) {
          const match = displayText.match(/(\d+)/);
          const sortNum = match ? parseInt(match[1], 10) : 999999;
          allButtons.push({ type: 'custom', num: sortNum, text: displayText, color: customBtn.color, customId: customBtn.id });
        }
      });
      
      allButtons.sort((a, b) => a.num - b.num);
      
      allButtons.forEach(btnData => {
        const b = document.createElement('button');
        b.textContent = btnData.text;
        b.className = 'btn fl-btn';
        b.style.minWidth = '64px';
        b.style.minHeight = '44px';
        b.style.fontWeight = '700';
        b.style.fontSize = '1.05rem';
        b.style.margin = '4px';
        
        let styleKind;
        if (btnData.type === 'custom') {
          styleKind = btnData.color === 'grey' ? 'grey' : 'gold';
        } else {
          styleKind = isGold(btnData.num) ? 'gold' : 'grey';
        }
        
        if (styleKind === 'gold') {
          b.style.border = '2px solid #000';
          b.style.color = '#fff';
          b.style.background = '#bfa100';
        } else {
          b.style.border = '2px solid #888';
          b.style.color = '#bbb';
          b.style.background = '#444';
        }
        
        b.addEventListener('click', () => {
          if (btnData.type === 'custom') {
            // For custom FL buttons, pass just the display text (without "FL " prefix)
            decorateCombinedSiInline(moveableBtn, btnData.text, styleKind);
            updateRemovedFL(btnData.text, true);
          } else {
            // For predefined FL buttons, pass the number only
            decorateCombinedSiInline(moveableBtn, btnData.num, styleKind);
            updateRemovedFL('FL ' + btnData.num, true);
            // Persist join state on Liste Si so it survives navigation if not assigned yet
            try {
              const current = window.location.hash.replace(/^#/, '') || 'hauptmenu';
              if (current === 'liste-sicherheitstrupptaschen') {
                const siMatch = (moveableBtn.textContent||'').match(/Si\s+(\d+)/i);
                const siNum = siMatch ? parseInt(siMatch[1], 10) : null;
                if (siNum) upsertCombinedSi(siNum, btnData.num);
              }
            } catch (_) {}
          }
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
      // Restore PA button styling
      moveableBtn.style.border = '2px solid #888';
      moveableBtn.style.color = '#bbb';
      moveableBtn.style.background = '#111';
      moveableBtn.style.fontWeight = 'bold';
      moveableBtn.style.display = 'flex';
      moveableBtn.style.alignItems = 'center';
      moveableBtn.style.justifyContent = 'center';
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
        const key = moveablesKeyFor(pageFile);
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
        const key = moveablesKeyFor(pageFile);
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

  // Edit button (purple) - disabled for ERK buttons
  const editBtn = document.createElement('button');
  editBtn.textContent = 'Text bearbeiten';
  editBtn.className = 'btn btn-purple';
  editBtn.style.marginBottom = '18px';
  
  // Check if this is an ERK button
  const isERKBtn = moveableBtn.dataset && moveableBtn.dataset.erkType === 'erk';
  if (isERKBtn) {
    editBtn.style.opacity = '0.5';
    editBtn.style.cursor = 'not-allowed';
    editBtn.disabled = true;
  }
  
  editBtn.addEventListener('click', function() {
    const oldText = moveableBtn.textContent;
    const newText = prompt('Neuer Text für Button:', oldText);
    if (newText && newText !== oldText) {
      // DON'T change the button text yet - first check for duplicates globally
      
      // Use dataset.fullLabel if available (canonical label), otherwise extract from oldText
      let baseLabel = (moveableBtn.dataset && moveableBtn.dataset.fullLabel) || oldText;
      
      // If no fullLabel set, try to extract the base label from oldText
      if (!baseLabel || baseLabel === oldText) {
        const paMatch = oldText.match(/^PA\s+\d+/i);
        const flMatch = oldText.match(/^FL\s+\d+/i);
        const tfMatch = oldText.match(/^TF\s+\d+/i);
        const fhMatch = oldText.match(/^FH\s+\d+/i);
        const amMatch = oldText.match(/^AM\s+\d+/i);
        const siMatch = oldText.match(/^Si\s+\d+/i);
        const xMatch = oldText.match(/^X\s+\d+/i);
        const csaMatch = oldText.match(/^CSA\s+\d+/i);
        
        if (paMatch) baseLabel = paMatch[0];
        else if (flMatch) baseLabel = flMatch[0];
        else if (tfMatch) baseLabel = tfMatch[0];
        else if (fhMatch) baseLabel = fhMatch[0];
        else if (amMatch) baseLabel = amMatch[0];
        else if (siMatch) baseLabel = siMatch[0];
        else if (xMatch) baseLabel = xMatch[0];
        else if (csaMatch) baseLabel = csaMatch[0];
      }
      
      // CHECK FOR DUPLICATES FIRST - before making any changes
      const duplicateCheck = findButtonGlobally(newText);
      if (duplicateCheck.found) {
        alert(`${newText} existiert bereits in: ${duplicateCheck.location}`);
        // Don't make any changes - return early
        sidebar.style.display = 'none';
        return;
      }
      
      // NOW it's safe to make the change
      moveableBtn.textContent = newText;
      
      // Store custom button text in localStorage using baseLabel as key
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        customButtonTexts[baseLabel] = newText;
        localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
      } catch (e) {}
      
      // If this is a custom button (has customId), update its label in the custom buttons list
      const customId = moveableBtn.dataset && moveableBtn.dataset.customId;
      if (customId) {
        // Determine the button type from customId (e.g., "custom_pa_..." -> "pa")
        const typeMatch = customId.match(/^custom_(\w+)_/);
        if (typeMatch) {
          const buttonType = typeMatch[1].toUpperCase();
          const storageKey = 'custom_' + buttonType.toLowerCase() + '_buttons';
          try {
            let customButtons = JSON.parse(localStorage.getItem(storageKey) || '[]');
            customButtons = customButtons.map(btn => 
              btn.id === customId ? { ...btn, label: newText } : btn
            );
            localStorage.setItem(storageKey, JSON.stringify(customButtons));
            
            // For FL buttons, preserve the color styling
            if (buttonType === 'FL' && customButtons.find(b => b.id === customId)) {
              const buttonData = customButtons.find(b => b.id === customId);
              if (buttonData && buttonData.color === 'grey') {
                moveableBtn.classList.remove('fl-gold');
                moveableBtn.style.border = '2px solid #888';
                moveableBtn.style.color = '#bbb';
              } else {
                moveableBtn.classList.add('fl-gold');
                moveableBtn.style.border = '2px solid #4ade80';
                moveableBtn.style.color = '#4ade80';
              }
            }
          } catch (e) {}
        }
      }
      
      // Ensure dataset.fullLabel is preserved and set to the canonical base label
      moveableBtn.dataset.fullLabel = baseLabel;
    }
    sidebar.style.display = 'none';
  });
  sidebar.appendChild(editBtn);

  // Personal mask assignment: allow turning an AM into a personal mask and moving it to
  // a specified site with a person's name. Only for AM buttons.
  try {
    const isAMButton = /^\s*AM\s+\d+/i.test((moveableBtn.textContent||'')) || (moveableBtn.dataset && moveableBtn.dataset.customId && moveableBtn.dataset.customId.startsWith('custom_am_'));
    if (isAMButton) {
      const personalBtn = document.createElement('button');
      personalBtn.textContent = 'Persönliche Maske';
      personalBtn.className = 'btn btn-purple';
      personalBtn.style.marginBottom = '12px';
      personalBtn.addEventListener('click', () => {
        // Remove the main assignment sidebar completely before opening personal selection
        const assignmentSidebar = document.getElementById('assignment-sidebar');
        if (assignmentSidebar && assignmentSidebar.parentNode) {
          assignmentSidebar.parentNode.removeChild(assignmentSidebar);
        }
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
        pSidebar.style.zIndex = '100000001';
        pSidebar.style.display = 'flex';
        pSidebar.style.flexDirection = 'column';
        pSidebar.style.padding = '24px 18px 18px 18px';
        pSidebar.style.overflowY = 'auto';
        
        document.body.appendChild(pSidebar);
        
        const close2 = document.createElement('button');
        close2.className = 'sidebar-close-btn';
        close2.innerHTML = '&times;';
        close2.title = 'Schließen';
        close2.style.position = 'absolute';
        close2.style.top = '8px';
        close2.style.right = '14px';
        const closePersonalHandler = () => { try { if (pSidebar && pSidebar.parentNode) pSidebar.parentNode.removeChild(pSidebar); } catch(_) {} };
        close2.onclick = closePersonalHandler;
        close2.addEventListener('touchend', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closePersonalHandler();
        }, { passive: false });
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
          const siteSelectHandler = () => {
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
              // Save into target moveables (use canonical key and stable id)
              const idToUse = (moveableBtn && moveableBtn.dataset && moveableBtn.dataset.moveableId) ? moveableBtn.dataset.moveableId : makeMoveableId();
              // Determine baseLabel (the original AM number)
              const amBaseMatch = (moveableBtn.textContent || '').match(/^AM\s+\d+/i);
              const amBaseLabel = amBaseMatch ? amBaseMatch[0] : '';
              upsertMoveable(targetFile, {
                id: idToUse,
                label: newLabel,
                baseLabel: amBaseLabel,
                areaId: areaId,
                areaTitle: areaTitle,
                className: moveableBtn.className,
                style: moveableBtn.getAttribute('style'),
                fromPage: (window.location.hash.replace(/^#/, '') || ''),
                assignedToPage: targetFile,
                timestamp: Date.now()
              });
              // Remove from origin storage (try canonical and legacy keys). Prefer id-based removal.
              try {
                const origin = (window.location.hash.replace(/^#/, '') || '');
                const originKeyCanon = moveablesKeyFor(origin);
                const originKeyLegacy = moveablesLegacyKeyFor(origin);
                [originKeyCanon, originKeyLegacy].forEach(origK => {
                  try {
                    let originArr = JSON.parse(localStorage.getItem(origK) || '[]');
                    if (!Array.isArray(originArr)) originArr = [];
                    if (moveableBtn && moveableBtn.dataset && moveableBtn.dataset.moveableId) {
                      originArr = originArr.filter(mv => String(mv.id || '') !== String(moveableBtn.dataset.moveableId));
                    } else {
                      originArr = originArr.filter(mv => mv.label !== (moveableBtn.textContent || '').trim());
                    }
                    try { localStorage.setItem(origK, JSON.stringify(originArr)); } catch (_) {}
                  } catch (_) {}
                });
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
                  try { if (typeof idToUse !== 'undefined') btnNew.dataset.moveableId = String(idToUse); } catch (_) {}
                  // Place into the area content element if present
                  const content = areaRoot.querySelector('.area-content') || areaRoot;
                  content.appendChild(btnNew);
                  if (typeof window.makeButtonMoveable === 'function') window.makeButtonMoveable(btnNew, areaId);
                  // Update click-to-remove state since this is a new assignment
                  btnNew.dataset.currentArea = areaId;
                  updateClickToRemoveState(btnNew);
                }
              }
            } catch (_) {}
            // Fully close/remove any sidebars to prevent overlaying the next one
            try { if (pSidebar && pSidebar.parentNode) pSidebar.parentNode.removeChild(pSidebar); } catch(_) {}
            try { sidebar.style.display = 'none'; } catch(_) {}
          };
          b.addEventListener('click', siteSelectHandler);
          b.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            siteSelectHandler();
          }, { passive: false });
          grid.appendChild(b);
        });
        pSidebar.appendChild(grid);
      }); // Close personalBtn addEventListener('click')
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
    // FL buttons can now be assigned to any destination, just like PA buttons
    // (previously they were restricted to Lager destinations only)
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
    const destSelectHandler = function() {
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
          areaSidebar.style.zIndex = '100000001';
          areaSidebar.style.display = 'flex';
          areaSidebar.style.flexDirection = 'column';
          areaSidebar.style.padding = '24px 18px 18px 18px';
          areaSidebar.style.overflowY = 'auto';
        } else {
          while (areaSidebar.firstChild) areaSidebar.removeChild(areaSidebar.firstChild);
        }
        try { if (!areaSidebar.parentNode) document.body.appendChild(areaSidebar); } catch(_) {}
        const closeBtn = document.createElement('button');
        closeBtn.className = 'sidebar-close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.title = 'Schließen';
        const closeAreaSidebarHandler = () => { areaSidebar.style.display = 'none'; };
        closeBtn.onclick = closeAreaSidebarHandler;
        closeBtn.addEventListener('touchend', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeAreaSidebarHandler();
        }, { passive: false });
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
        // - FL => only 'Atemluftflaschen' (regardless of destination)
        // - FH => only 'Fluchthauben'
        // - TF when assigning to a specific vehicle => 'Sprungretter'|'Technikflaschen'
        // - X => only 'Messgeräte'
        // - CSA => only 'CSA'
        // - ERK => only 'Atemanschlüsse' and 'Atemschutzgeräte'
        try {
          const text = (moveableBtn && (moveableBtn.textContent || '')).trim();
          const isFH = text.startsWith('FH ');
          const isTF = text.startsWith('TF ');
          const isFL = text.startsWith('FL ');
          const isX = text.startsWith('X ');
          const isCSA = text.startsWith('CSA ');
          const isERK = moveableBtn.dataset && moveableBtn.dataset.erkType === 'erk';
          // Use helper functions defined earlier in this scope to detect PA/combined PA
          const isPAItem = (typeof isPA === 'function' && isPA(moveableBtn)) || (typeof isCombinedPA === 'function' && isCombinedPA(moveableBtn)) || (/^\s*PA\s+\d+/i).test(text) || (/\bPA\s+\d+\s+mit\s+FL\s+\d+/i).test(text);
          const isAMItem = (/^\s*AM\s+\d+/i).test(text);
          const isSiItem = (typeof isSi === 'function' && isSi(moveableBtn)) || (typeof isCombinedSi === 'function' && isCombinedSi(moveableBtn)) || (/^\s*Si\s+\d+/i).test(text) || (/\bSi\s+\d+\s+mit\s+FL\s+\d+/i).test(text);
          const isLagerDest = dest && (/lager/i.test(dest) || dest === 'Lager Hauptwache' || dest === 'Lager AGW');
          if (isERK) {
            // ERK buttons can only go to two specific areas
            filteredAreas = ['Atemanschlüsse', 'Atemschutzgeräte'];
          } else if (isFL) {
            // FL buttons always go to Atemluftflaschen area, regardless of destination
            filteredAreas = ['Atemluftflaschen'];
          } else if (isSiItem) {
            filteredAreas = ['Sicherheitstrupptasche'];
          } else if (isPAItem || isAMItem) {
            if (isAMItem) {
              filteredAreas = ['Atemschutzmasken'];
            } else {
              filteredAreas = ['Atemschutzgeräte'];
            }
          } else if (isFH) {
            filteredAreas = ['Fluchthauben'];
          } else if (isX) {
            filteredAreas = ['Messgeräte'];
          } else if (isCSA) {
            filteredAreas = ['CSA'];
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
          const areaSelectHandler = function() {
            const fromPage = window.location.hash.replace(/^#/, '');
            const targetFile = selectedVehicleFile || fromPage;
            if (moveableBtn.parentNode) moveableBtn.parentNode.removeChild(moveableBtn);
            // Build a clean label to persist - use the DISPLAYED text (which might be custom edited)
            let labelToSave = (moveableBtn.textContent || '').trim();
            const comboSel = ((typeof parseCombined === 'function') ? parseCombined(moveableBtn) : null) || ((typeof parseCombinedSi === 'function') ? parseCombinedSi(moveableBtn) : null);
            if (comboSel) {
              if (comboSel.pa) labelToSave = `PA ${comboSel.pa} mit FL ${comboSel.fl}`;
              else if (comboSel.si) labelToSave = `Si ${comboSel.si} mit FL ${comboSel.fl}`;
            }
            
            // Extract and preserve the canonical base label from fullLabel, moveableId, or custom storage
            let baseLabel = '';
            try {
              // Try fullLabel first (most reliable - set during button creation)
              const fullLabel = (moveableBtn.dataset && moveableBtn.dataset.fullLabel) || '';
              if (fullLabel) {
                const baseMatch = fullLabel.match(/^(PA|FL|TF|FH|AM|Si|X|CSA)\s+(\d+)/i);
                if (baseMatch) {
                  const prefix = baseMatch[1].toUpperCase();
                  const num = baseMatch[2];
                  baseLabel = `${prefix} ${num}`;
                }
              }
              
              // Fallback: if no fullLabel match, check custom_button_texts keys to find the original label
              if (!baseLabel) {
                try {
                  const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
                  for (const [key, val] of Object.entries(customButtonTexts)) {
                    if (val === labelToSave && /^(PA|FL|TF|FH|AM|Si|X|CSA)\s+\d+/i.test(key)) {
                      baseLabel = key;
                      break;
                    }
                  }
                } catch (_) {}
              }
              
              // Last resort: try to extract pattern from labelToSave
              if (!baseLabel) {
                const baseMatch = labelToSave.match(/^(PA|FL|TF|FH|AM|Si|X|CSA)\s+(\d+)/i);
                if (baseMatch) {
                  const prefix = baseMatch[1].toUpperCase();
                  const num = baseMatch[2];
                  baseLabel = `${prefix} ${num}`;
                }
              }
            } catch (_) {}
            
            const idToUse = (moveableBtn && moveableBtn.dataset && moveableBtn.dataset.moveableId) ? moveableBtn.dataset.moveableId : makeMoveableId();
            // Use canonical upsert (handles dedupe by label/id)
            // Include baseLabel for future reference and to help with filtering
            upsertMoveable(targetFile, {
              id: idToUse,
              label: labelToSave,
              baseLabel: baseLabel,
              areaId,
              areaTitle,
              className: moveableBtn.className,
              style: moveableBtn.getAttribute('style'),
              fromPage,
              assignedToPage: targetFile,
              timestamp: Date.now()
            });
            // Remove from origin only if moving across pages
            const origin = (String(fromPage || '') || '');
            if (origin && origin !== targetFile) {
              const originKeyCanon = moveablesKeyFor(origin);
              const originKeyLegacy = moveablesLegacyKeyFor(origin);
              [originKeyCanon, originKeyLegacy].forEach(origK => {
                try {
                  let originMoveables = JSON.parse(localStorage.getItem(origK) || '[]');
                  if (!Array.isArray(originMoveables)) originMoveables = [];
                  if (moveableBtn && moveableBtn.dataset && moveableBtn.dataset.moveableId) {
                    originMoveables = originMoveables.filter(m => String(m.id || '') !== String(moveableBtn.dataset.moveableId));
                  } else if (comboSel) {
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
                  try { localStorage.setItem(origK, JSON.stringify(originMoveables)); } catch (_) {}
                } catch (_) {}
              });
            }
            // Clear combined mapping when assigning from list pages
            try {
              const current = window.location.hash.replace(/^#/, '') || 'hauptmenu';
              if (current === 'liste-pa' && comboSel && comboSel.pa) removeCombinedPA(comboSel.pa);
              if (current === 'liste-sicherheitstrupptaschen' && comboSel && comboSel.si) { try { removeCombinedSi(comboSel.si); } catch (_) {} }
            } catch (_) {}
            // Add button to the appropriate removed list so it doesn't reappear on home page after refresh
            try {
              if (baseLabel) {
                const prefix = baseLabel.match(/^([A-Z]+)/i)[1].toUpperCase();
                
                // Add to appropriate removed list
                if (prefix === 'PA') {
                  let removedPAs = JSON.parse(localStorage.getItem('removed_pas_liste_pa') || '[]');
                  if (!removedPAs.includes(baseLabel)) {
                    removedPAs.push(baseLabel);
                    localStorage.setItem('removed_pas_liste_pa', JSON.stringify(removedPAs));
                  }
                } else if (prefix === 'X') {
                  let removedXs = JSON.parse(localStorage.getItem('removed_xs_liste_messgeraete') || '[]');
                  if (!removedXs.includes(baseLabel)) {
                    removedXs.push(baseLabel);
                    localStorage.setItem('removed_xs_liste_messgeraete', JSON.stringify(removedXs));
                  }
                } else if (prefix === 'FL') {
                  let removedFLs = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]');
                  if (!removedFLs.includes(baseLabel)) {
                    removedFLs.push(baseLabel);
                    localStorage.setItem('removed_fls_liste_atemluftflaschen', JSON.stringify(removedFLs));
                  }
                } else if (prefix === 'TF') {
                  let removedTFs = JSON.parse(localStorage.getItem('removed_tfs_liste_technikflaschen') || '[]');
                  if (!removedTFs.includes(baseLabel)) {
                    removedTFs.push(baseLabel);
                    localStorage.setItem('removed_tfs_liste_technikflaschen', JSON.stringify(removedTFs));
                  }
                } else if (prefix === 'FH') {
                  let removedFHs = JSON.parse(localStorage.getItem('removed_fhs_liste_fluchthauben') || '[]');
                  if (!removedFHs.includes(baseLabel)) {
                    removedFHs.push(baseLabel);
                    localStorage.setItem('removed_fhs_liste_fluchthauben', JSON.stringify(removedFHs));
                  }
                } else if (prefix === 'AM') {
                  let removedAMs = JSON.parse(localStorage.getItem('removed_ams_liste_atemanschluesse') || '[]');
                  if (!removedAMs.includes(baseLabel)) {
                    removedAMs.push(baseLabel);
                    localStorage.setItem('removed_ams_liste_atemanschluesse', JSON.stringify(removedAMs));
                  }
                } else if (prefix === 'SI') {
                  let removedSis = JSON.parse(localStorage.getItem('removed_sis_liste_sicherheitstrupptaschen') || '[]');
                  if (!removedSis.includes(baseLabel)) {
                    removedSis.push(baseLabel);
                    localStorage.setItem('removed_sis_liste_sicherheitstrupptaschen', JSON.stringify(removedSis));
                  }
                } else if (prefix === 'CSA') {
                  let removedCSAs = JSON.parse(localStorage.getItem('removed_csas_liste_csa') || '[]');
                  if (!removedCSAs.includes(baseLabel)) {
                    removedCSAs.push(baseLabel);
                    localStorage.setItem('removed_csas_liste_csa', JSON.stringify(removedCSAs));
                  }
                }
              }
            } catch (err) {}
            areaSidebar.style.display = 'none';
          };
          btn.addEventListener('click', areaSelectHandler);
          btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            areaSelectHandler();
          }, { passive: false });
          grid.appendChild(btn);
        });
        areaSidebar.appendChild(grid);
        if (!document.body.contains(areaSidebar)) {
          document.body.appendChild(areaSidebar);
        }
        areaSidebar.style.display = 'flex';
      }, 0);
    };
    abtn.addEventListener('click', destSelectHandler);
    abtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      destSelectHandler();
    }, { passive: false });
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
  const isCustomFL = isNaN(parseInt(flNumber, 10));
  right.textContent = isCustomFL ? flNumber : `FL ${flNumber}`;
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
  const isCustomFL = isNaN(parseInt(flNumber, 10));
  right.textContent = isCustomFL ? flNumber : `FL ${flNumber}`;
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
        const moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(page)) || '[]');
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
      { label: 'Liste Messgeräte', page: 'liste-messgeraete' },
      { label: 'Liste CSA', page: 'liste-csa' },
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
  'liste-messgeraete': {
    title: 'Liste Messgeräte',
    content: `<div class="card"><div id="x-btn-list"></div></div>`
  },
  'liste-csa': {
    title: 'Liste CSA',
    content: `<div class="card"><div id="csa-btn-list"></div></div>`
  },
  // ERK page removed
  
  'csa': {
    title: 'CSA',
    content: `<div class="card"><div id="csa-btn-list"></div></div>`
  },
  'messgeraete': {
    title: 'Messgeräte',
    content: `<div class="card"><div id="x-btn-list"></div></div>`
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
    <button class="btn btn-grey" style="font-size:1.1rem;min-width:180px;padding:12px;border:none" onclick="navigate('lager-hauptwache-container')">Lager AGW</button>
    <button class="btn btn-blue" style="font-size:1.1rem;min-width:180px;padding:12px;border:none" onclick="navigate('silschede')">Silschede</button>
  <button class="btn btn-black" style="color:#c0c0c0;font-size:1.1rem;min-width:180px;padding:12px;border:none" onclick="navigate('liste-pa')">PA</button>
  <button class="btn fl-btn gold" style="background:#bfa100;color:#fff;font-size:1.1rem;min-width:180px;padding:12px;border:none;margin:0" onclick="navigate('liste-atemluftflaschen')">Atemluftflaschen</button>
  <button class="btn am-btn" style="background:#fff;color:#000;font-size:1.1rem;min-width:180px;padding:12px;border:2px solid #000" onclick="navigate('liste-atemanschluesse')">Atemanschlüsse</button>
  <button class="btn btn-black" style="color:var(--gold);font-size:1.1rem;min-width:180px;padding:12px;border:none" onclick="navigate('liste-fluchthauben')">Fluchthauben</button>
  <button class="btn tf-btn" style="background:#176a2a;color:#fff;font-size:1.1rem;min-width:180px;padding:12px;border:none" onclick="navigate('liste-technikflaschen')">Technikflaschen</button>
  <button class="btn btn-black" style="color:lime;font-size:1.1rem;min-width:180px;padding:12px;border:none" onclick="navigate('liste-sicherheitstrupptaschen')">Sicherheitstrupptaschen</button>
  <!-- ERK Geräte removed -->
    <button class="btn" style="background:orange;color:#000;font-size:1.1rem;min-width:180px;padding:12px;border:none" onclick="navigate('csa')">CSA</button>
    <button class="btn" style="background:#6b3e26;color:#fff;font-size:1.1rem;min-width:180px;padding:12px;border:none" onclick="navigate('messgeraete')">Messgeräte</button>
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
  // dedupe by label then by pageKey
  const seen = new Set();
  const out = [];
  items.forEach(it => {
    const key = it.label + '|' + it.pageKey;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(it);
  });
  // preserve insertion order (from VEHICLE_LIST)
  return out;
}

function getAssignmentsForPage(pageFile) {
  let moveables = [];
  try { moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageFile)) || '[]'); } catch (e) {}
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
  try { moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageKey)) || '[]'); } catch (e) { moveables = []; }
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
        <button class="btn btn-grey btn-small" id="btn-export">Speichern</button>
        <button class="btn btn-grey btn-small" id="btn-import">Aus Datei Laden</button>
        <input type="file" id="import-file" style="display:none" accept=".json"/>
        <span id="app-version" style="color:#888;font-size:12px;white-space:nowrap">v${(window.APP_VERSION||'')}</span>
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
        const moveablesKey = moveablesKeyFor(file);
        let moveables = [];
        try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) { moveables = []; }
        (moveables||[]).forEach(m => {
          if (m.label && m.label.toLowerCase().includes(q)) {
            results.push({type:'button', title: m.label, page: file, snippet: m.areaTitle || m.areaId || ''});
          }
        });
      } catch (e) {}
    }
    // Search some persistent removed-lists (COMMENTED OUT: removed buttons should not appear in search)
    // try {
    //   let removedPAs = JSON.parse(localStorage.getItem('removed_pas_liste_pa') || '[]');
    //   (removedPAs||[]).forEach(label => { if (label.toLowerCase().includes(q)) results.push({type:'button', title: label, page: 'liste-pa.html', snippet: 'Entfernt'}); });
    // } catch (e) {}
    // try {
    //   let removedTFs = JSON.parse(localStorage.getItem('removed_tfs_liste_technikflaschen') || '[]');
    //   (removedTFs||[]).forEach(label => { if (label.toLowerCase().includes(q)) results.push({type:'button', title: label, page: 'liste-technikflaschen.html', snippet: 'Entfernt'}); });
    // } catch (e) {}

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
  // Update login widget visibility based on current page
  try { renderLoginLogWidget(); } catch (_) {}
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
        <div style="display:flex;align-items:center;gap:12px;width:100%;margin-bottom:12px">
          <h1 class="page-title" style="margin:0;flex:1">${pageObj.title}</h1>
          <button id="add-pa-btn" class="btn" style="background:#4ade80;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">+</button>
          <button id="remove-pa-btn" class="btn" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">−</button>
        </div>
        ${pageObj.content || ''}
      </div>
    `;
    renderPAListePage();
  } else if (page === 'liste-atemluftflaschen') {
    main.innerHTML = `
      <div class="card center-col">
        <div style="display:flex;align-items:center;gap:12px;width:100%;margin-bottom:12px">
          <h1 class="page-title" style="margin:0;flex:1">${pageObj.title}</h1>
          <button id="add-fl-btn" class="btn" style="background:#4ade80;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">+</button>
          <button id="remove-fl-btn" class="btn" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">−</button>
        </div>
        ${pageObj.content || ''}
      </div>
    `;
    renderFLListePage();
  } else if (page === 'liste-technikflaschen') {
    main.innerHTML = `
      <div class="card center-col">
        <div style="display:flex;align-items:center;gap:12px;width:100%;margin-bottom:12px">
          <h1 class="page-title" style="margin:0;flex:1">${pageObj.title}</h1>
          <button id="add-tf-btn" class="btn" style="background:#4ade80;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">+</button>
          <button id="remove-tf-btn" class="btn" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">−</button>
        </div>
        ${pageObj.content || ''}
      </div>
    `;
    renderTFListePage();
  } else if (page === 'liste-atemanschluesse') {
    main.innerHTML = `
      <div class="card center-col">
        <div style="display:flex;align-items:center;gap:12px;width:100%;margin-bottom:12px">
          <h1 class="page-title" style="margin:0;flex:1">${pageObj.title}</h1>
          <button id="add-am-btn" class="btn" style="background:#4ade80;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">+</button>
          <button id="remove-am-btn" class="btn" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">−</button>
        </div>
        ${pageObj.content || ''}
      </div>
    `;
    renderAMListePage();
  } else if (page === 'liste-fluchthauben') {
    main.innerHTML = `
      <div class="card center-col">
        <div style="display:flex;align-items:center;gap:12px;width:100%;margin-bottom:12px">
          <h1 class="page-title" style="margin:0;flex:1">${pageObj.title}</h1>
          <button id="add-fh-btn" class="btn" style="background:#4ade80;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">+</button>
          <button id="remove-fh-btn" class="btn" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">−</button>
        </div>
        ${pageObj.content || ''}
      </div>
    `;
    renderFHListePage();
  } else if (page === 'liste-sicherheitstrupptaschen') {
    main.innerHTML = `
      <div class="card center-col">
        <div style="display:flex;align-items:center;gap:12px;width:100%;margin-bottom:12px">
          <h1 class="page-title" style="margin:0;flex:1">${pageObj.title}</h1>
          <button id="add-si-btn" class="btn" style="background:#4ade80;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">+</button>
          <button id="remove-si-btn" class="btn" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">−</button>
        </div>
        ${pageObj.content || ''}
      </div>
    `;
    renderSIListePage();
  } else if (page === 'liste-messgeraete') {
    main.innerHTML = `
      <div class="card center-col">
        <div style="display:flex;align-items:center;gap:12px;width:100%;margin-bottom:12px">
          <h1 class="page-title" style="margin:0;flex:1">${pageObj.title}</h1>
          <button id="add-x-btn" class="btn" style="background:#4ade80;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">+</button>
          <button id="remove-x-btn" class="btn" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">−</button>
        </div>
        ${pageObj.content || ''}
      </div>
    `;
    renderXListePage();
  } else if (page === 'messgeraete') {
    main.innerHTML = `
      <div class="card center-col">
        <div style="display:flex;align-items:center;gap:12px;width:100%;margin-bottom:12px">
          <h1 class="page-title" style="margin:0;flex:1">${pageObj.title}</h1>
          <button id="add-x-btn" class="btn" style="background:#4ade80;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">+</button>
          <button id="remove-x-btn" class="btn" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">−</button>
        </div>
        ${pageObj.content || ''}
      </div>
    `;
    renderXListePage();
  } else if (page === 'liste-csa') {
    main.innerHTML = `
      <div class="card center-col">
        <div style="display:flex;align-items:center;gap:12px;width:100%;margin-bottom:12px">
          <h1 class="page-title" style="margin:0;flex:1">${pageObj.title}</h1>
          <button id="add-csa-btn" class="btn" style="background:#4ade80;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">+</button>
          <button id="remove-csa-btn" class="btn" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">−</button>
        </div>
        ${pageObj.content || ''}
      </div>
    `;
    renderCSAListePage();
  } else if (page === 'csa') {
    main.innerHTML = `
      <div class="card center-col">
        <div style="display:flex;align-items:center;gap:12px;width:100%;margin-bottom:12px">
          <h1 class="page-title" style="margin:0;flex:1">${pageObj.title}</h1>
          <button id="add-csa-btn" class="btn" style="background:#4ade80;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">+</button>
          <button id="remove-csa-btn" class="btn" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:1.2rem;font-weight:bold;cursor:pointer;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">−</button>
        </div>
        ${pageObj.content || ''}
      </div>
    `;
    renderCSAListePage();
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
  } else if (page === 'silschede') {
    main.innerHTML = `
      <div class="card center-col">
        <h1 class="page-title">${pageObj.title}</h1>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px">
          <button class="btn btn-blue" onclick="navigate('von-silschede')">Von Silschede</button>
          <button class="btn btn-blue" onclick="navigate('fuer-silschede')">Für Silschede</button>
        </div>
        <div id="areas-container" class="card" style="margin-top:8px;"></div>
      </div>
    `;
    renderSilschede();
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

// Service Worker intentionally disabled for this app.
// Proactively unregister any existing service workers and clear this app's caches
// to avoid stale assets and caching bugs during development.
try {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(list => { (list||[]).forEach(r => { try { r.unregister(); } catch(_) {} }); })
      .catch(() => {});
  }
  if (typeof caches !== 'undefined' && caches && typeof caches.keys === 'function') {
    caches.keys().then(keys => {
      (keys||[])
        .filter(k => /^feuerwehr-app-/i.test(k) || /feuerwehr/i.test(k))
        .forEach(k => { try { caches.delete(k); } catch (_) {} });
    }).catch(() => {});
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
  // For Klutertbad, only show Atemschutzgeräte and Atemschutzmasken areas
  if (page === 'klutertbad') {
    const allowedAreaIds = new Set(['atemschutzger-te', 'atemschutzmasken']);
    Array.from(mainContainer.querySelectorAll('.moveable-area')).forEach(area => {
      try {
        if (area.dataset && !allowedAreaIds.has(area.dataset.areaId)) {
          if (area.parentNode) area.parentNode.removeChild(area);
          if (window.areas && window.areas[area.dataset.areaId]) delete window.areas[area.dataset.areaId];
        }
      } catch (_) {}
    });
  }
  // Restore assigned moveables for this page
  let moveables = [];
  try { moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageFile)) || '[]'); } catch (e) {}
  // Sort moveables by their numeric value for consistent ordering
  moveables = sortMoveablesByNumber(moveables);
  const isLagerOrSilschede = /lager|silschede/i.test(pageFile);
  moveables.forEach(m => {
  const areaRoot = (typeof window.getArea === 'function' ? window.getArea(m.areaId) : null) ||
           mainContainer.querySelector(`.moveable-area[data-area-id="${m.areaId}"]`);
  if (!areaRoot) return;
  // Use the area root element as container (restore original behavior)
  const areaEl = areaRoot;
  const btn = document.createElement('button');
    // If this is a combined PA label, render with a badge using stored className
    if (/^PA\s+\d+\s+mit\s+/i.test(m.label || '')) {
      // Extract PA number
      const paMatch = (m.label||'').match(/^PA\s+(\d+)\s+mit\s+(.+)$/i);
      if (paMatch) {
        const paNum = parseInt(paMatch[1],10);
        const flPart = paMatch[2]; // This could be "FL 154" or "Custom FL Name"
        const styleKind = (m.className||'').includes('combo-fl-gold') ? 'gold' : ((m.className||'').includes('combo-fl-grey') ? 'grey' : null);
        if (paNum && flPart && styleKind) {
          // Ensure the decorator can read the PA part: set a simple text before decorating
          btn.textContent = `PA ${paNum}`;
          decorateCombinedPAInline(btn, flPart, styleKind);
          // Keep a machine-readable copy of the full label so other code can match exactly if needed
          try { btn.dataset.fullLabel = m.label; } catch (_) {}
        } else {
          btn.textContent = m.label || 'Item';
        }
      } else {
        btn.textContent = m.label || 'Item';
      }
    } else if (/^Si\s+\d+\s+mit\s+/i.test(m.label || '')) {
      // Combined Si + FL stored label (restore with decorator)
      const siMatch = (m.label||'').match(/^Si\s+(\d+)\s+mit\s+(.+)$/i);
      if (siMatch) {
        const siNum = parseInt(siMatch[1],10);
        const flPart = siMatch[2]; // This could be "FL 154" or "Custom FL Name"
        const styleKind = (m.className||'').includes('combo-fl-gold') ? 'gold' : ((m.className||'').includes('combo-fl-grey') ? 'grey' : null);
        if (siNum && flPart && styleKind) {
          btn.textContent = `Si ${siNum}`;
          decorateCombinedSiInline(btn, flPart, styleKind);
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
    // Remove old double-click handler - we use click-to-remove instead
    // try {
    //   btn.addEventListener('dblclick', function(ev){
    // ... (commented out old double-click code)
    // });
    // } catch(_) {}
    if (typeof window.makeButtonMoveable === 'function') {
      try { if (m && (m.id || m.timestamp)) btn.dataset.moveableId = String(m.id || m.timestamp); } catch (_) {}
      // Determine the original home area id so removal handler can return the button there.
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
  else if (from.includes('liste-messgeraete') || from.includes('liste-messgeraete')) homeArea = 'x-btn-list';
  else if (from.includes('liste-csa') || from.includes('liste-csa')) homeArea = 'csa-btn-list';
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
  else if (lbl.startsWith('X ')) homeArea = 'x-btn-list';
  else if (lbl.startsWith('CSA ')) homeArea = 'csa-btn-list';
        // ERK labels no longer have a dedicated home list
      }
      // Default to the stored area id if we still don't know
      if (!homeArea) homeArea = m.areaId || null;
      try { window.makeButtonMoveable(btn, homeArea); } catch (_) { if (window.makeButtonMoveable) window.makeButtonMoveable(btn, homeArea); }
      // The button is currently placed on a vehicle area; ensure currentArea reflects that (NOT the home area)
      btn.dataset.currentArea = m.areaId;
      // Update click-to-remove state based on home vs current area
      updateClickToRemoveState(btn);
      // For lager and silschede pages, add click handler to open assignment sidebar
      if (isLagerOrSilschede && typeof showAssignmentSidebar === 'function') {
        btn.addEventListener('click', function(e) {
          if (e.button === 0 && !btn.classList.contains('dragging')) {
            showAssignmentSidebar(btn);
          }
        });
      }
    }
  });
}
// --- Example: render FL and TF pages with moveable buttons and sidebar ---
function renderFLListePage() {
  // Golden and grey FL numbers (source from standalone HTML), plus custom from localStorage
  const goldenFL = [126,212,202,149,209,173,164,156,154,196,163,216,205,181,203,208,160,227,136,120,188,218,225,177,153,198,138,127,215,213,192,174,206,158,210,140,130,155,190,221,178,143,122,180,171,175,131,152,128,172,129,169,123,199,219,229,194,157,195,207,220,124,226,224,197,161,170,201,119,193,183,214,121,125,159,135,176,139,179,141,142,184,145,185,144,186,146,147,189,148,191,150,200,151,204,162,211,165,217,166,222,167,223,168,228,182,238,137,187,8,43,57,93,167,189,211,289];
  const greyFL = [73,24,61,22,85,19,71,70,1,102,16,82,26,29,9,46,17,72,53,86,84,116,118,40,8,51,11,57,33,59,66,93,79,81,44,42,4,6,10,12,13,14,15,18,20,21,23,25,27,28,30,31,32,34,35,36,43,48,49,52,56,60,64,65,67,69,75,76,77,78,87,88,91,95,100,101,104,105,107,108,109,110,111,112,113,114,115,117];
  let customFLNumbers = [];
  try { customFLNumbers = JSON.parse(localStorage.getItem('custom_fl_numbers') || '[]'); } catch (e) {}
  // Add custom FL numbers to appropriate arrays based on whether they're gold or grey (default to gold if unknown)
  customFLNumbers.forEach(n => {
    if (!goldenFL.includes(n) && !greyFL.includes(n)) goldenFL.push(n);
  });
  let assignedFLLabels = [];
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html',
    'tlf-azubi.html','hauptwache.html'
  ];
  vehiclePages.forEach(page => {
    const moveablesKey = moveablesKeyFor(page);
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
    moveables.forEach(m => {
      if (m && m.label) {
        let baseLabel = m.baseLabel;
        if (!baseLabel && /^FL\s+\d+/.test(m.label)) {
          baseLabel = (m.label.match(/^FL\s+\d+/)||[''])[0].trim();
        }
        if (baseLabel) {
          assignedFLLabels.push(baseLabel);
        }
      }
    });
  });
  // Also filter out FLs that have been removed from this page (persistently)
  let removedFLs = [];
  try { removedFLs = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]'); } catch (e) {}

  // Only render unassigned FL buttons in the list
  let unassignedGolden = goldenFL.filter(num => {
    const label = `FL ${num}`;
    return !assignedFLLabels.includes(label) && !removedFLs.includes(label);
  });
  let unassignedGrey = greyFL.filter(num => {
    const label = `FL ${num}`;
    return !assignedFLLabels.includes(label) && !removedFLs.includes(label);
  });
  // Align with baseline: no fallback when all are removed; keep list empty
  unassignedGolden.sort((a, b) => a - b);
  unassignedGrey.sort((a, b) => a - b);

  const container = document.getElementById('fl-btn-list');
  if (container) container.innerHTML = '';
  // Register the fl-btn-list as a moveable area (for home logic)
  let flBtnListArea = container;
  // Check if the moveable-area wrapper already exists
  const existingFlWrapper = container ? container.parentNode : null;
  if (existingFlWrapper && existingFlWrapper.classList.contains('moveable-area') && existingFlWrapper.dataset.areaId === 'fl-btn-list') {
    flBtnListArea = existingFlWrapper;
  } else if (container && !container.classList.contains('moveable-area')) {
    // Only create wrapper if it doesn't already exist
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
      btn.style.border = '2px solid #000';
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
  if (flArea) {
    const removedButNotAssigned = removedFLs.filter(label => !assignedFLLabels.includes(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('FL ', ''), 10)).filter(n => !isNaN(n));
    
    // Remove old buttons first (by class, not innerHTML) to avoid flicker
    flArea.querySelectorAll('button.fl-btn').forEach(btn => btn.remove());
    
    // Build all new buttons in a fragment for atomic insertion
    const fragment = document.createDocumentFragment();
    
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      const defaultLabel = 'FL ' + num;
      btn.textContent = getCustomButtonText(defaultLabel);
      btn.className = 'btn fl-btn fl-grey';
      btn.style.border = '2px solid #888';
      btn.style.color = '#bbb';
      btn.style.background = '#444';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      const flDblClickHandler = function() {
        const removed = getRemovedItems('removed_fls_liste_atemluftflaschen');
        const label = 'FL ' + num;
        const idx = removed.indexOf(label);
        if (idx !== -1) {
          removed.splice(idx, 1);
          setRemovedItems('removed_fls_liste_atemluftflaschen', removed);
          renderFLListePage();
        }
      };
      // Don't add click-to-remove for removed area buttons
      fragment.appendChild(btn);
    });
    
    // Append all new buttons at once
    flArea.appendChild(fragment);
  }
  // Render custom FL buttons created via "+" button
  let customFLButtons = [];
  try { customFLButtons = JSON.parse(localStorage.getItem('custom_fl_buttons') || '[]'); } catch (e) {}
  let customButtonTexts = {};
  try { customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}'); } catch (e) {}
  const flBtnList = document.getElementById('fl-btn-list');
  customFLButtons.forEach(customBtn => {
    // Check if this custom button is already assigned somewhere
    let isAssigned = false;
    vehiclePages.forEach(pageFile => {
      let moveables = [];
      try { moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageFile)) || '[]'); } catch (e) {}
      (moveables||[]).forEach(m => {
        if (m && m.customId === customBtn.id) {
          isAssigned = true;
        }
      });
    });
    if (!isAssigned && flBtnList) {
      const btn = document.createElement('button');
      const savedText = customButtonTexts[customBtn.label];
      btn.textContent = savedText || 'FL';
      btn.dataset.fullLabel = customBtn.label;
      btn.dataset.customId = customBtn.id;
      btn.dataset.flColor = customBtn.color || 'golden';
      
      // Apply color styling based on stored color
      if (customBtn.color === 'grey') {
        btn.className = 'btn fl-btn';
        btn.style.border = '2px solid #888';
        btn.style.color = '#bbb';
        btn.style.background = '#444';
      } else {
        btn.className = 'btn fl-btn';
        btn.style.border = '2px solid #000';
        btn.style.color = '#fff';
        btn.style.background = '#bfa100';
      }
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'fl-btn-list');
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          }, { passive: false });
        }
      } catch(_) {}
      flBtnList.appendChild(btn);
    }
  });
  // Update global search highlighting after render
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    const event = new Event('input', { bubbles: true });
    searchInput.dispatchEvent(event);
  }
  // Add handler for "+" button to create new FL
  const addFLBtn = document.getElementById('add-fl-btn');
  if (addFLBtn && !addFLBtn.dataset.flClickWired) {
    addFLBtn.dataset.flClickWired = '1';
    const handleAddFL = function() {
      // Visual feedback: scale the button
      addFLBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { addFLBtn.style.transform = 'scale(1)'; }, 100);
      
      // Ask user to choose golden or grey with options
      const colorChoice = prompt('Flasche Farbe wählen:\n1 = Golden\n2 = Grau', '1');
      if (colorChoice === null) {
        // User clicked Cancel, abort
        return;
      }
      const flColor = colorChoice === '2' ? 'grey' : 'golden';
      
      // Prompt for button text
      const buttonText = prompt('Name für neue Atemluftflaschen-Button:', 'FL');
      if (buttonText === null || buttonText.trim() === '') {
        // User clicked Cancel or entered empty string
        return;
      }
      
      // CHECK FOR DUPLICATES - button text must be unique
      const duplicateCheck = findButtonGlobally(buttonText);
      if (duplicateCheck.found) {
        alert(`${buttonText} existiert bereits in: ${duplicateCheck.location}`);
        return;
      }
      
      // Generate a unique ID for this new button
      const buttonId = 'custom_fl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      
      // Store in custom buttons list with color
      let customButtons = [];  
      try { customButtons = JSON.parse(localStorage.getItem('custom_fl_buttons') || '[]'); } catch (e) {}
      customButtons.push({ id: buttonId, label: buttonId, color: flColor });
      localStorage.setItem('custom_fl_buttons', JSON.stringify(customButtons));
      
      // Store custom button text
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        customButtonTexts[buttonId] = buttonText;
        localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
      } catch (e) {}
      
      // Create button with entered text
      const btn = document.createElement('button');
      btn.textContent = buttonText;
      btn.className = 'btn fl-btn';
      
      // Apply color styling
      if (flColor === 'golden') {
        btn.style.border = '2px solid #000';
        btn.style.color = '#fff';
        btn.style.background = '#bfa100';
      } else {
        btn.style.border = '2px solid #888';
        btn.style.color = '#bbb';
        btn.style.background = '#444';
      }
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      btn.dataset.fullLabel = buttonId;
      btn.dataset.customId = buttonId;
      btn.dataset.flColor = flColor;
      
      // Wire up click handler for sidebar BEFORE adding to DOM
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          });
        }
      } catch(_) {}
      
      // Make it moveable and add to DOM
      const flBtnList = document.getElementById('fl-btn-list');
      if (flBtnList) {
        flBtnList.appendChild(btn);
        if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'fl-btn-list');
        // Sort buttons after adding the new one
        sortButtonsByNumber(flBtnList);
      }
    };
    addFLBtn.addEventListener('click', handleAddFL);
  }
  
  // Sort FL buttons by number after all buttons are rendered
  const flList = document.getElementById('fl-btn-list');
  if (flList) sortButtonsByNumber(flList);
  
  // Add handler for "-" button to remove the last FL
  const removeFLBtn = document.getElementById('remove-fl-btn');
  if (removeFLBtn && !removeFLBtn.dataset.flRemoveWired) {
    removeFLBtn.dataset.flRemoveWired = '1';
    const handleRemoveFL = function() {
      // Visual feedback: scale the button
      removeFLBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { removeFLBtn.style.transform = 'scale(1)'; }, 100);
      
      // Get custom FL buttons
      let customFLButtons = [];
      try { customFLButtons = JSON.parse(localStorage.getItem('custom_fl_buttons') || '[]'); } catch (e) {}
      
      // Remove the last custom button if any exist
      if (customFLButtons.length > 0) {
        const removedButton = customFLButtons.pop();
        localStorage.setItem('custom_fl_buttons', JSON.stringify(customFLButtons));
        
        // Also remove any stored custom text for this button
        try {
          const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
          if (removedButton.label && customButtonTexts[removedButton.label]) {
            delete customButtonTexts[removedButton.label];
            localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
          }
        } catch (e) {}
        
        // Re-render the page
        if (typeof renderFLListePage === 'function') {
          renderFLListePage();
        }
      }
    };
    removeFLBtn.addEventListener('click', handleRemoveFL);
  }
}

function renderTFListePage() {
  // Correct TF numbers and styles from original HTML, plus custom from localStorage
  const baseTFNumbers = [117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136];
  let customTFNumbers = [];
  try { customTFNumbers = JSON.parse(localStorage.getItem('custom_tf_numbers') || '[]'); } catch (e) {}
  const tfNumbers = [...new Set([...baseTFNumbers, ...customTFNumbers])].sort((a, b) => a - b);
  let assignedTFLabels = [];
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html',
    'tlf-azubi.html','hauptwache.html'
  ];
  vehiclePages.forEach(page => {
    const moveablesKey = moveablesKeyFor(page);
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
    moveables.forEach(m => {
      if (m && m.label) {
        let baseLabel = m.baseLabel;
        if (!baseLabel && /^TF\s+\d+/.test(m.label)) {
          baseLabel = (m.label.match(/^TF\s+\d+/)||[''])[0].trim();
        }
        if (baseLabel) {
          assignedTFLabels.push(baseLabel);
        }
      }
    });
  });  

  // ...existing code...
  let removedTFs = [];
  try { removedTFs = JSON.parse(localStorage.getItem('removed_tfs_liste_technikflaschen') || '[]'); } catch (e) {}
  let unassignedTFNumbers = tfNumbers.filter(num => {
    const label = `TF ${num}`;
    return !assignedTFLabels.includes(label) && !removedTFs.includes(label);
  });
  // Align with baseline: no fallback when all are removed; keep list empty
  unassignedTFNumbers.sort((a, b) => a - b);
  const container = document.getElementById('tf-btn-list');
  if (container) container.innerHTML = '';
  let tfBtnListArea = container;
  // Check if the moveable-area wrapper already exists
  const existingTfWrapper = container ? container.parentNode : null;
  if (existingTfWrapper && existingTfWrapper.classList.contains('moveable-area') && existingTfWrapper.dataset.areaId === 'tf-btn-list') {
    tfBtnListArea = existingTfWrapper;
  } else if (container && !container.classList.contains('moveable-area')) {
    // Only create wrapper if it doesn't already exist
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
  if (technikflaschenArea && window.renderMoveableButtons) {
    const removedButNotAssigned = removedTFs.filter(label => !assignedTFLabels.includes(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('TF ', ''), 10)).filter(n => !isNaN(n));
    
    // Remove old buttons first (by class, not innerHTML) to avoid flicker
    technikflaschenArea.querySelectorAll('button.tf-btn').forEach(btn => btn.remove());
    
    // Build all new buttons in a fragment for atomic insertion
    const fragment = document.createDocumentFragment();
    
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      const defaultLabel = 'TF ' + num;
      let buttonText = defaultLabel;
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        if (customButtonTexts[defaultLabel]) {
          buttonText = customButtonTexts[defaultLabel];
        }
      } catch (e) {}
      btn.textContent = buttonText;
      btn.className = 'btn tf-btn';
      btn.style.border = '2px solid #176a2a';
      btn.style.color = '#fff';
      btn.style.background = '#176a2a';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      const tfDblClickHandler = function(e) {
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
      // Don't add click-to-remove for removed area buttons
      fragment.appendChild(btn);
    });
    
    // Append all new buttons at once
    technikflaschenArea.appendChild(fragment);
  }
  // Render custom TF buttons created via "+" button
  let customTFButtons = [];
  try { customTFButtons = JSON.parse(localStorage.getItem('custom_tf_buttons') || '[]'); } catch (e) {}
  const tfBtnList = document.getElementById('tf-btn-list');
  customTFButtons.forEach(customBtn => {
    let isAssigned = false;
    vehiclePages.forEach(pageFile => {
      let moveables = [];
      try { moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageFile)) || '[]'); } catch (e) {}
      (moveables||[]).forEach(m => {
        if (m && m.customId === customBtn.id) {
          isAssigned = true;
        }
      });
    });
    if (!isAssigned && tfBtnList) {
      const btn = document.createElement('button');
      let customButtonTexts = {};
      try { customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}'); } catch (e) {}
      const savedText = customButtonTexts[customBtn.label];
      btn.textContent = savedText || 'TF';
      btn.dataset.fullLabel = customBtn.label;
      btn.dataset.customId = customBtn.id;
      btn.className = 'btn tf-btn';
      btn.style.border = '2px solid #9c27b0';
      btn.style.color = '#9c27b0';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'tf-btn-list');
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          }, { passive: false });
        }
      } catch(_) {}
      tfBtnList.appendChild(btn);
    }
  });
  // After rendering, re-dispatch input event on search bar to update search results
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    const event = new Event('input', { bubbles: true });
    searchInput.dispatchEvent(event);
  }
  // Add handler for "+" button to create new TF
  const addTFBtn = document.getElementById('add-tf-btn');
  if (addTFBtn && !addTFBtn.dataset.tfClickWired) {
    addTFBtn.dataset.tfClickWired = '1';
    const handleAddTF = function() {
      // Visual feedback: scale the button
      addTFBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { addTFBtn.style.transform = 'scale(1)'; }, 100);
      
      // Check if "TF" already exists globally
      const existsCheck = findButtonGlobally('TF');
      if (existsCheck.found) {
        alert(`TF existiert bereits in: ${existsCheck.location}`);
        return;
      }
      
      // Prompt for button text immediately
      const buttonText = prompt('Name für neue Technikflaschen-Button:', 'TF');
      if (buttonText === null || buttonText.trim() === '') {
        // User clicked Cancel or entered empty string
        return;
      }
      
      // CHECK FOR DUPLICATES - button text must be unique
      const duplicateCheck = findButtonGlobally(buttonText);
      if (duplicateCheck.found) {
        alert(`${buttonText} existiert bereits in: ${duplicateCheck.location}`);
        return;
      }
      
      // Generate a unique ID for this new button
      const buttonId = 'custom_tf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      
      // Store in custom buttons list
      let customButtons = [];  
      try { customButtons = JSON.parse(localStorage.getItem('custom_tf_buttons') || '[]'); } catch (e) {}
      customButtons.push({ id: buttonId, label: buttonId });
      localStorage.setItem('custom_tf_buttons', JSON.stringify(customButtons));
      
      // Store custom button text
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        customButtonTexts[buttonId] = buttonText;
        localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
      } catch (e) {}
      
      // Create button with entered text
      const btn = document.createElement('button');
      btn.textContent = buttonText;
      btn.className = 'btn tf-btn';
      btn.style.border = '2px solid #4ade80';
      btn.style.color = '#4ade80';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      btn.dataset.fullLabel = buttonId;
      btn.dataset.customId = buttonId;
      
      // Wire up click handler for sidebar BEFORE adding to DOM
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          });
        }
      } catch(_) {}
      
      // Make it moveable and add to DOM
      const tfBtnList = document.getElementById('tf-btn-list');
      if (tfBtnList) {
        tfBtnList.appendChild(btn);
        if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'tf-btn-list');
        // Sort buttons after adding the new one
        sortButtonsByNumber(tfBtnList);
      }
    };
    addTFBtn.addEventListener('click', handleAddTF);
  }
  
  // Sort TF buttons by number after all buttons are rendered
  const tfList = document.getElementById('tf-btn-list');
  if (tfList) sortButtonsByNumber(tfList);
  
  // Add handler for "-" button to remove the last TF
  const removeTFBtn = document.getElementById('remove-tf-btn');
  if (removeTFBtn && !removeTFBtn.dataset.tfRemoveWired) {
    removeTFBtn.dataset.tfRemoveWired = '1';
    const handleRemoveTF = function() {
      // Visual feedback: scale the button
      removeTFBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { removeTFBtn.style.transform = 'scale(1)'; }, 100);
      
      // Get custom TF buttons
      let customTFButtons = [];
      try { customTFButtons = JSON.parse(localStorage.getItem('custom_tf_buttons') || '[]'); } catch (e) {}
      
      // Remove the last custom button if any exist
      if (customTFButtons.length > 0) {
        const removedButton = customTFButtons.pop();
        localStorage.setItem('custom_tf_buttons', JSON.stringify(customTFButtons));
        
        // Also remove any stored custom text for this button
        try {
          const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
          if (removedButton.label && customButtonTexts[removedButton.label]) {
            delete customButtonTexts[removedButton.label];
            localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
          }
        } catch (e) {}
        
        // Re-render the page
        if (typeof renderTFListePage === 'function') {
          renderTFListePage();
        }
      }
    };
    removeTFBtn.addEventListener('click', handleRemoveTF);
  }
}
// --- SPA-specific: render Fluchthauben (FH) list page ---
function renderFHListePage() {
  // Numbers from original liste-fluchthauben.html, plus custom from localStorage
  const baseFHNumbers = [320,322,339,337,355,358,351,350,356,346,347,358,317,335,330,336,340,352,302,303,304,305,306,307,308,310,311,314,315,316,317,319,321,323,325,324,326,327,328,329,331,332,333,334,338,341,343,345,344,348,349,354,357,301,315];
  let customFHNumbers = [];
  try { customFHNumbers = JSON.parse(localStorage.getItem('custom_fh_numbers') || '[]'); } catch (e) {}
  const fhNumbers = [...new Set([...baseFHNumbers, ...customFHNumbers])].sort((a, b) => a - b);
  let assignedFHLabels = [];
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html',
    'tlf-azubi.html','hauptwache.html'
  ];
  vehiclePages.forEach(page => {
    const moveablesKey = moveablesKeyFor(page);
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
    moveables.forEach(m => {
      if (m && m.label) {
        let baseLabel = m.baseLabel;
        if (!baseLabel && /^FH\s+\d+/.test(m.label)) {
          baseLabel = (m.label.match(/^FH\s+\d+/)||[''])[0].trim();
        }
        if (baseLabel) {
          assignedFHLabels.push(baseLabel);
        }
      }
    });
  });

  let removedFHs = [];
  try { removedFHs = JSON.parse(localStorage.getItem('removed_fhs_liste_fluchthauben') || '[]'); } catch (e) {}

  let unassignedFHNumbers = fhNumbers.filter(num => {
    const label = `FH ${num}`;
    return !assignedFHLabels.includes(label) && !removedFHs.includes(label);
  });
  // Align with baseline: no fallback when all are removed; keep list empty
  unassignedFHNumbers.sort((a, b) => a - b);

  const container = document.getElementById('fh-btn-list');
  if (container) container.innerHTML = '';
  let fhBtnListArea = container;
  // Check if the moveable-area wrapper already exists
  const existingFhWrapper = container ? container.parentNode : null;
  if (existingFhWrapper && existingFhWrapper.classList.contains('moveable-area') && existingFhWrapper.dataset.areaId === 'fh-btn-list') {
    fhBtnListArea = existingFhWrapper;
  } else if (container && !container.classList.contains('moveable-area')) {
    // Only create wrapper if it doesn't already exist
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
  if (fhArea) {
    const removedButNotAssigned = removedFHs.filter(label => !assignedFHLabels.includes(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('FH ', ''), 10)).filter(n => !isNaN(n));
    
    // Remove old buttons first (by class, not innerHTML) to avoid flicker
    fhArea.querySelectorAll('button.fh-btn').forEach(btn => btn.remove());
    
    // Build all new buttons in a fragment for atomic insertion
    const fragment = document.createDocumentFragment();
    
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      const defaultLabel = 'FH ' + num;
      let buttonText = defaultLabel;
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        if (customButtonTexts[defaultLabel]) {
          buttonText = customButtonTexts[defaultLabel];
        }
      } catch (e) {}
      btn.textContent = buttonText;
      btn.className = 'btn fh-btn';
      btn.style.border = '2px solid #bfa100';
      btn.style.color = '#bfa100';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      const fhDblClickHandler = function() {
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
      // Don't add click-to-remove for removed area buttons
      fragment.appendChild(btn);
    });
    
    // Append all new buttons at once
    fhArea.appendChild(fragment);
  }
  // Render custom FH buttons created via "+" button
  let customFHButtons = [];
  try { customFHButtons = JSON.parse(localStorage.getItem('custom_fh_buttons') || '[]'); } catch (e) {}
  const fhBtnList = document.getElementById('fh-btn-list');
  customFHButtons.forEach(customBtn => {
    let isAssigned = false;
    vehiclePages.forEach(pageFile => {
      let moveables = [];
      try { moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageFile)) || '[]'); } catch (e) {}
      (moveables||[]).forEach(m => {
        if (m && m.customId === customBtn.id) {
          isAssigned = true;
        }
      });
    });
    if (!isAssigned && fhBtnList) {
      const btn = document.createElement('button');
      let customButtonTexts = {};
      try { customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}'); } catch (e) {}
      const savedText = customButtonTexts[customBtn.label];
      btn.textContent = savedText || 'FH';
      btn.dataset.fullLabel = customBtn.label;
      btn.dataset.customId = customBtn.id;
      btn.className = 'btn fh-btn';
      btn.style.border = '2px solid #bfa100';
      btn.style.color = '#bfa100';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'fh-btn-list');
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          }, { passive: false });
        }
      } catch(_) {}
      fhBtnList.appendChild(btn);
    }
  });
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    const event = new Event('input', { bubbles: true });
    searchInput.dispatchEvent(event);
  }
  // Add handler for "+" button to create new FH
  const addFHBtn = document.getElementById('add-fh-btn');
  if (addFHBtn && !addFHBtn.dataset.fhClickWired) {
    addFHBtn.dataset.fhClickWired = '1';
    const handleAddFH = function() {
      // Visual feedback: scale the button
      addFHBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { addFHBtn.style.transform = 'scale(1)'; }, 100);
      
      // Check if "FH" already exists globally
      const existsCheck = findButtonGlobally('FH');
      if (existsCheck.found) {
        alert(`FH existiert bereits in: ${existsCheck.location}`);
        return;
      }
      
      // Prompt for button text immediately
      const buttonText = prompt('Name für neuen Fluchthaube-Button:', 'FH');
      if (buttonText === null || buttonText.trim() === '') {
        // User clicked Cancel or entered empty string
        return;
      }
      
      // CHECK FOR DUPLICATES - button text must be unique
      const duplicateCheck = findButtonGlobally(buttonText);
      if (duplicateCheck.found) {
        alert(`${buttonText} existiert bereits in: ${duplicateCheck.location}`);
        return;
      }
      
      // Generate a unique ID for this new button
      const buttonId = 'custom_fh_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      
      // Store in custom buttons list
      let customButtons = [];  
      try { customButtons = JSON.parse(localStorage.getItem('custom_fh_buttons') || '[]'); } catch (e) {}
      customButtons.push({ id: buttonId, label: buttonId });
      localStorage.setItem('custom_fh_buttons', JSON.stringify(customButtons));
      
      // Store custom button text
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        customButtonTexts[buttonId] = buttonText;
        localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
      } catch (e) {}
      
      // Create button with entered text
      const btn = document.createElement('button');
      btn.textContent = buttonText;
      btn.className = 'btn fh-btn';
      btn.style.border = '2px solid #bfa100';
      btn.style.color = '#bfa100';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      btn.dataset.fullLabel = buttonId;
      btn.dataset.customId = buttonId;
      
      // Wire up click handler for sidebar BEFORE adding to DOM
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          });
        }
      } catch(_) {}
      
      // Make it moveable and add to DOM
      const fhBtnList = document.getElementById('fh-btn-list');
      if (fhBtnList) {
        fhBtnList.appendChild(btn);
        if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'fh-btn-list');
        // Sort buttons after adding the new one
        sortButtonsByNumber(fhBtnList);
      }
    };
    addFHBtn.addEventListener('click', handleAddFH);
  }
  
  // Sort FH buttons by number after all buttons are rendered
  const fhList = document.getElementById('fh-btn-list');
  if (fhList) sortButtonsByNumber(fhList);
  
  // Add handler for "-" button to remove the last FH
  const removeFHBtn = document.getElementById('remove-fh-btn');
  if (removeFHBtn && !removeFHBtn.dataset.fhRemoveWired) {
    removeFHBtn.dataset.fhRemoveWired = '1';
    const handleRemoveFH = function() {
      // Visual feedback: scale the button
      removeFHBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { removeFHBtn.style.transform = 'scale(1)'; }, 100);
      
      // Get custom FH buttons
      let customFHButtons = [];
      try { customFHButtons = JSON.parse(localStorage.getItem('custom_fh_buttons') || '[]'); } catch (e) {}
      
      // Remove the last custom button if any exist
      if (customFHButtons.length > 0) {
        const removedButton = customFHButtons.pop();
        localStorage.setItem('custom_fh_buttons', JSON.stringify(customFHButtons));
        
        // Also remove any stored custom text for this button
        try {
          const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
          if (removedButton.label && customButtonTexts[removedButton.label]) {
            delete customButtonTexts[removedButton.label];
            localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
          }
        } catch (e) {}
        
        // Re-render the page
        if (typeof renderFHListePage === 'function') {
          renderFHListePage();
        }
      }
    };
    removeFHBtn.addEventListener('click', handleRemoveFH);
  }
}

// --- SPA-specific: render Atemanschluesse (AM) list page ---
function renderAMListePage() {
  // AM numbers 1..264 plus custom from localStorage
  const baseAMNumbers = Array.from({length: 264}, (_,i) => i+1);
  let customAMNumbers = [];
  try { customAMNumbers = JSON.parse(localStorage.getItem('custom_am_numbers') || '[]'); } catch (e) {}
  const amNumbers = [...new Set([...baseAMNumbers, ...customAMNumbers])].sort((a, b) => a - b);
  let assignedAMLabels = [];
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html',
    'tlf-azubi.html','hauptwache.html'
  ];
  vehiclePages.forEach(page => {
    const moveablesKey = moveablesKeyFor(page);
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
    moveables.forEach(m => {
      if (m && m.label) {
        let baseLabel = m.baseLabel;
        if (!baseLabel && /^AM\s+\d+/.test(m.label)) {
          baseLabel = (m.label.match(/^AM\s+\d+/)||[''])[0].trim();
        }
        if (baseLabel) {
          assignedAMLabels.push(baseLabel);
        }
      }
    });
  });

  let removedAMs = [];
  try { removedAMs = JSON.parse(localStorage.getItem('removed_ams_liste_atemanschluesse') || '[]'); } catch (e) {}

  let unassignedAMNumbers = amNumbers.filter(num => {
    const label = `AM ${num}`;
    return !assignedAMLabels.includes(label) && !removedAMs.includes(label);
  });
  // Align with baseline: no fallback when all are removed; keep list empty
  unassignedAMNumbers.sort((a, b) => a - b);

  const container = document.getElementById('am-btn-list');
  if (container) container.innerHTML = '';
  let amBtnListArea = container;
  // Check if the moveable-area wrapper already exists
  const existingAmWrapper = container ? container.parentNode : null;
  if (existingAmWrapper && existingAmWrapper.classList.contains('moveable-area') && existingAmWrapper.dataset.areaId === 'am-btn-list') {
    amBtnListArea = existingAmWrapper;
  } else if (container && !container.classList.contains('moveable-area')) {
    // Only create wrapper if it doesn't already exist
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
  if (amAreaContent) {
    const removedButNotAssigned = removedAMs.filter(label => !assignedAMLabels.includes(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('AM ', ''), 10)).filter(n => !isNaN(n));
    
    // Remove old buttons first (by class, not innerHTML) to avoid flicker
    amAreaContent.querySelectorAll('button.am-btn').forEach(btn => btn.remove());
    
    // Build all new buttons in a fragment for atomic insertion
    const fragment = document.createDocumentFragment();
    
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      const defaultLabel = 'AM ' + num;
      let buttonText = defaultLabel;
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        if (customButtonTexts[defaultLabel]) {
          buttonText = customButtonTexts[defaultLabel];
        }
      } catch (e) {}
      btn.textContent = buttonText;
      btn.className = 'btn am-btn';
      btn.style.border = '1px solid #000';
      btn.style.color = '#000';
      btn.style.background = '#fff';
      btn.style.fontWeight = '600';
      btn.style.margin = '6px';
      btn.style.minWidth = '48px';
      btn.style.minHeight = '40px';
      btn.style.fontSize = '1rem';
      const amDblClickHandler = function(e) {
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
      // Don't add click-to-remove for removed area buttons
      fragment.appendChild(btn);
    });
    
    // Append all new buttons at once
    amAreaContent.appendChild(fragment);
  }
  // Render custom AM buttons created via "+" button
  let customAMButtons = [];
  try { customAMButtons = JSON.parse(localStorage.getItem('custom_am_buttons') || '[]'); } catch (e) {}
  const amBtnList = document.getElementById('am-btn-list');
  customAMButtons.forEach(customBtn => {
    let isAssigned = false;
    vehiclePages.forEach(pageFile => {
      let moveables = [];
      try { moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageFile)) || '[]'); } catch (e) {}
      (moveables||[]).forEach(m => {
        if (m && m.customId === customBtn.id) {
          isAssigned = true;
        }
      });
    });
    if (!isAssigned && amBtnList) {
      const btn = document.createElement('button');
      let customButtonTexts = {};
      try { customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}'); } catch (e) {}
      const savedText = customButtonTexts[customBtn.label];
      btn.textContent = savedText || 'AM';
      btn.dataset.fullLabel = customBtn.label;
      btn.dataset.customId = customBtn.id;
      btn.className = 'btn am-btn';
      btn.style.border = '1px solid #000';
      btn.style.color = '#000';
      btn.style.background = '#fff';
      btn.style.fontWeight = '600';
      btn.style.margin = '6px';
      btn.style.minWidth = '48px';
      btn.style.minHeight = '40px';
      btn.style.fontSize = '1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'am-btn-list');
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          }, { passive: false });
        }
      } catch(_) {}
      amBtnList.appendChild(btn);
    }
  });
  // Add handler for "+" button to create new AM
  const addAMBtn = document.getElementById('add-am-btn');
  if (addAMBtn && !addAMBtn.dataset.amClickWired) {
    addAMBtn.dataset.amClickWired = '1';
    const handleAddAM = function() {
      // Visual feedback: scale the button
      addAMBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { addAMBtn.style.transform = 'scale(1)'; }, 100);
      
      // Check if "AM" already exists globally
      const existsCheck = findButtonGlobally('AM');
      if (existsCheck.found) {
        alert(`AM existiert bereits in: ${existsCheck.location}`);
        return;
      }
      
      // Prompt for button text immediately
      const buttonText = prompt('Name für neuen Atemschutzmasken-Button:', 'AM');
      if (buttonText === null || buttonText.trim() === '') {
        // User clicked Cancel or entered empty string
        return;
      }
      
      // CHECK FOR DUPLICATES - button text must be unique
      const duplicateCheck = findButtonGlobally(buttonText);
      if (duplicateCheck.found) {
        alert(`${buttonText} existiert bereits in: ${duplicateCheck.location}`);
        return;
      }
      
      // Generate a unique ID for this new button
      const buttonId = 'custom_am_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      
      // Store in custom buttons list
      let customButtons = [];  
      try { customButtons = JSON.parse(localStorage.getItem('custom_am_buttons') || '[]'); } catch (e) {}
      customButtons.push({ id: buttonId, label: buttonId });
      localStorage.setItem('custom_am_buttons', JSON.stringify(customButtons));
      
      // Store custom button text
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        customButtonTexts[buttonId] = buttonText;
        localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
      } catch (e) {}
      
      // Create button with entered text
      const btn = document.createElement('button');
      btn.textContent = buttonText;
      btn.className = 'btn am-btn';
      btn.style.border = '1px solid #000';
      btn.style.color = '#000';
      btn.style.background = '#fff';
      btn.style.fontWeight = '600';
      btn.style.margin = '6px';
      btn.style.minWidth = '48px';
      btn.style.minHeight = '40px';
      btn.style.fontSize = '1rem';
      btn.dataset.fullLabel = buttonId;
      btn.dataset.customId = buttonId;
      
      // Wire up click handler for sidebar BEFORE adding to DOM
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          });
        }
      } catch(_) {}
      
      // Make it moveable and add to DOM
      const amBtnList = document.getElementById('am-btn-list');
      if (amBtnList) {
        amBtnList.appendChild(btn);
        if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'am-btn-list');
        // Sort buttons after adding the new one
        sortButtonsByNumber(amBtnList);
      }
    };
    addAMBtn.addEventListener('click', handleAddAM);
  }
  
  // Sort AM buttons by number after all buttons are rendered
  const amList = document.getElementById('am-btn-list');
  if (amList) sortButtonsByNumber(amList);
  
  // Add handler for "-" button to remove the last AM
  const removeAMBtn = document.getElementById('remove-am-btn');
  if (removeAMBtn && !removeAMBtn.dataset.amRemoveWired) {
    removeAMBtn.dataset.amRemoveWired = '1';
    const handleRemoveAM = function() {
      // Visual feedback: scale the button
      removeAMBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { removeAMBtn.style.transform = 'scale(1)'; }, 100);
      
      // Get custom AM buttons
      let customAMButtons = [];
      try { customAMButtons = JSON.parse(localStorage.getItem('custom_am_buttons') || '[]'); } catch (e) {}
      
      // Remove the last custom button if any exist
      if (customAMButtons.length > 0) {
        const removedButton = customAMButtons.pop();
        localStorage.setItem('custom_am_buttons', JSON.stringify(customAMButtons));
        
        // Also remove any stored custom text for this button
        try {
          const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
          if (removedButton.label && customButtonTexts[removedButton.label]) {
            delete customButtonTexts[removedButton.label];
            localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
          }
        } catch (e) {}
        
        // Re-render the page
        if (typeof renderAMListePage === 'function') {
          renderAMListePage();
        }
      }
    };
    removeAMBtn.addEventListener('click', handleRemoveAM);
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
  // Numbers from original liste-sicherheitstrupptaschen.html, plus custom from localStorage
  const baseSiNumbers = [305, 302, 304, 303, 306, 301];
  let customSiNumbers = [];
  try { customSiNumbers = JSON.parse(localStorage.getItem('custom_si_numbers') || '[]'); } catch (e) {}
  const siNumbers = [...new Set([...baseSiNumbers, ...customSiNumbers])].sort((a, b) => a - b);
  let assignedSiLabels = [];
  // Vehicle pages to scan for assigned moveables
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html',
    'tlf-azubi.html','hauptwache.html'
  ];
  vehiclePages.forEach(page => {
    const moveablesKey = moveablesKeyFor(page);
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
    moveables.forEach(m => {
      if (m && m.label) {
        let baseLabel = m.baseLabel;
        if (!baseLabel && /^Si\s+\d+/.test(m.label)) {
          baseLabel = (m.label.match(/^Si\s+\d+/)||[''])[0].trim();
        }
        if (baseLabel) {
          assignedSiLabels.push(baseLabel);
        }
      }
    });
  });

  // Exclude Sis that the user removed from the list page
  let removedSis = [];
  try { removedSis = JSON.parse(localStorage.getItem('removed_sis_liste_sicherheitstrupptaschen') || '[]'); } catch (e) {}

  // Only show unassigned and not-removed numbers
  let unassignedSiNumbers = siNumbers.filter(num => {
    const label = `Si ${num}`;
    return !assignedSiLabels.includes(label) && !removedSis.includes(label);
  });
  // Align with baseline: no fallback when all are removed; keep list empty
  unassignedSiNumbers.sort((a, b) => a - b);

  // Render into the list container
  const container = document.getElementById('si-btn-list');
  if (container) container.innerHTML = '';
  // Register home area for Si list for drag/dblclick home logic
  let siBtnListArea = container;
  // Check if the moveable-area wrapper already exists
  const existingSiWrapper = container ? container.parentNode : null;
  if (existingSiWrapper && existingSiWrapper.classList.contains('moveable-area') && existingSiWrapper.dataset.areaId === 'si-btn-list') {
    siBtnListArea = existingSiWrapper;
  } else if (container && !container.classList.contains('moveable-area')) {
    // Only create wrapper if it doesn't already exist
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
        // Check for custom text first
        let buttonText = label;
        try {
          const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
          if (customButtonTexts[label]) {
            buttonText = customButtonTexts[label];
          }
        } catch (e) {}
        btn.textContent = buttonText;
        const styleKind = ((entry.fl && (function(n){ const goldenFL=[126,212,202,149,209,173,164,156,154,196,163,216,205,181,203,208,160,227,136,120,188,218,225,177,153,198,138,127,215,213,192,174,206,158,210,140,130,155,190,221,178,143,122,180,171,175,131,152,128,172,129,169,123,199,219,229,194,157,195,207,220,124,226,224,197,161,170,201,119,193,183,214,121,125,159,135,176,139,179,141,142,184,145,185,144,186,146,147,189,148,191,150,200,151,204,162,211,165,217,166,222,167,223,168,228,182,238,137,187,8,43,57,93,167,189,211,289]; return goldenFL.includes(n); })(entry.fl))) ? 'gold' : 'grey';
        decorateCombinedSiInline(btn, entry.fl, styleKind);
        // Home list (Si) should open sidebar on click
        try { 
          if (typeof showAssignmentSidebar === 'function') {
            const sidebarHandler = function() { showAssignmentSidebar(btn); };
            btn.addEventListener('click', sidebarHandler);
            btn.addEventListener('touchend', function(e) {
              const touch = e.changedTouches && e.changedTouches[0];
              if (touch && !btn.classList.contains('dragging')) {
                e.preventDefault();
                e.stopPropagation();
                sidebarHandler();
              }
            }, { passive: false });
          }
        } catch(_) {}
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
  if (siArea) {
    const removedButNotAssigned = removedSis.filter(label => !assignedSiLabels.includes(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('Si ', ''), 10)).filter(n => !isNaN(n));
    
    // Remove old buttons first (by class, not innerHTML) to avoid flicker
    siArea.querySelectorAll('button.si-btn').forEach(btn => btn.remove());
    
    // Build all new buttons in a fragment for atomic insertion
    const fragment = document.createDocumentFragment();
    
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      const defaultLabel = 'Si ' + num;
      let buttonText = defaultLabel;
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        if (customButtonTexts[defaultLabel]) {
          buttonText = customButtonTexts[defaultLabel];
        }
      } catch (e) {}
      btn.textContent = buttonText;
      btn.className = 'btn si-btn';
      btn.style.border = '2px solid #bfff00';
      btn.style.color = '#bfff00';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      const siDblClickHandler = function() {
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
      // Don't add click-to-remove for removed area buttons
      fragment.appendChild(btn);
    });
    
    // Append all new buttons at once
    siArea.appendChild(fragment);
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  }
  // Render custom Si buttons created via "+" button
  let customSiButtons = [];
  try { customSiButtons = JSON.parse(localStorage.getItem('custom_si_buttons') || '[]'); } catch (e) {}
  const siBtnList = document.getElementById('si-btn-list');
  customSiButtons.forEach(customBtn => {
    let isAssigned = false;
    vehiclePages.forEach(pageFile => {
      let moveables = [];
      try { moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageFile)) || '[]'); } catch (e) {}
      (moveables||[]).forEach(m => {
        if (m && m.customId === customBtn.id) {
          isAssigned = true;
        }
      });
    });
    if (!isAssigned && siBtnList) {
      const btn = document.createElement('button');
      let customButtonTexts = {};
      try { customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}'); } catch (e) {}
      const savedText = customButtonTexts[customBtn.label];
      btn.textContent = savedText || 'Si';
      btn.dataset.fullLabel = customBtn.label;
      btn.dataset.customId = customBtn.id;
      btn.className = 'btn si-btn';
      btn.style.border = '2px solid #ff6b6b';
      btn.style.color = '#ff6b6b';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'si-btn-list');
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          }, { passive: false });
        }
      } catch(_) {}
      siBtnList.appendChild(btn);
    }
  });
  // Add handler for "+" button to create new Si
  const addSiBtn = document.getElementById('add-si-btn');
  if (addSiBtn && !addSiBtn.dataset.siClickWired) {
    addSiBtn.dataset.siClickWired = '1';
    const handleAddSi = function() {
      // Visual feedback: scale the button
      addSiBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { addSiBtn.style.transform = 'scale(1)'; }, 100);
      
      // Check globally if Si already exists
      const existsCheck = findButtonGlobally('Si');
      if (existsCheck.found) {
        alert(`Si existiert bereits in: ${existsCheck.location}`);
        return;
      }
      
      // Prompt for button text immediately
      const buttonText = prompt('Name für neue Sicherheitstrupptasche-Button:', 'Si');
      if (buttonText === null || buttonText.trim() === '') {
        // User clicked Cancel or entered empty string
        return;
      }
      
      // CHECK FOR DUPLICATES - button text must be unique
      const duplicateCheck = findButtonGlobally(buttonText);
      if (duplicateCheck.found) {
        alert(`${buttonText} existiert bereits in: ${duplicateCheck.location}`);
        return;
      }
      
      // Generate a unique ID for this new button
      const buttonId = 'custom_si_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      
      // Store in custom buttons list
      let customButtons = [];
      try { customButtons = JSON.parse(localStorage.getItem('custom_si_buttons') || '[]'); } catch (e) {}
      customButtons.push({ id: buttonId, label: buttonId });
      localStorage.setItem('custom_si_buttons', JSON.stringify(customButtons));
      
      // Store custom button text
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        customButtonTexts[buttonId] = buttonText;
        localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
      } catch (e) {}
      
      // Create button with entered text
      const btn = document.createElement('button');
      btn.textContent = buttonText;
      btn.className = 'btn si-btn';
      btn.style.border = '2px solid #ff6b6b';
      btn.style.color = '#ff6b6b';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      btn.dataset.fullLabel = buttonId;
      btn.dataset.customId = buttonId;
      
      // Wire up click handler for sidebar BEFORE adding to DOM
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          });
        }
      } catch(_) {}
      
      // Add to DOM and make moveable
      const siBtnList = document.getElementById('si-btn-list');
      if (siBtnList) {
        siBtnList.appendChild(btn);
        if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'si-btn-list');
        // Sort buttons after adding the new one
        sortButtonsByNumber(siBtnList);
      }
    };
    addSiBtn.addEventListener('click', handleAddSi);
  }
  
  // Sort Si buttons by number after all buttons are rendered
  const siList = document.getElementById('si-btn-list');
  if (siList) sortButtonsByNumber(siList);
  
  // Add handler for "-" button to remove the last Si
  const removeSiBtn = document.getElementById('remove-si-btn');
  if (removeSiBtn && !removeSiBtn.dataset.siRemoveWired) {
    removeSiBtn.dataset.siRemoveWired = '1';
    const handleRemoveSi = function() {
      // Visual feedback: scale the button
      removeSiBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { removeSiBtn.style.transform = 'scale(1)'; }, 100);
      
      // Get custom Si buttons
      let customSiButtons = [];
      try { customSiButtons = JSON.parse(localStorage.getItem('custom_si_buttons') || '[]'); } catch (e) {}
      
      // Remove the last custom button if any exist
      if (customSiButtons.length > 0) {
        const removedButton = customSiButtons.pop();
        localStorage.setItem('custom_si_buttons', JSON.stringify(customSiButtons));
        
        // Also remove any stored custom text for this button
        try {
          const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
          if (removedButton.label && customButtonTexts[removedButton.label]) {
            delete customButtonTexts[removedButton.label];
            localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
          }
        } catch (e) {}
        
        // Re-render the page
        if (typeof renderSIListePage === 'function') {
          renderSIListePage();
        }
      }
    };
    removeSiBtn.addEventListener('click', handleRemoveSi);
  }
}

function renderXListePage() {
  // X button numbers: base numbers 1-5, plus custom from localStorage
  const baseXNumbers = [1, 2, 3, 4, 5];
  let customXNumbers = [];
  try { customXNumbers = JSON.parse(localStorage.getItem('custom_x_numbers') || '[]'); } catch (e) {}
  const xNumbers = [...new Set([...baseXNumbers, ...customXNumbers])].sort((a, b) => a - b);
  
  let assignedXLabels = [];
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html',
    'tlf-azubi.html','hauptwache.html'
  ];
  vehiclePages.forEach(page => {
    const moveablesKey = moveablesKeyFor(page);
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
    moveables.forEach(m => {
      if (m && m.label) {
        let baseLabel = m.baseLabel;
        if (!baseLabel && /^X\s+\d+/.test(m.label)) {
          baseLabel = (m.label.match(/^X\s+\d+/)||[''])[0].trim();
        }
        if (baseLabel) {
          assignedXLabels.push(baseLabel);
        }
      }
    });
  });

  let removedXs = [];
  try { removedXs = JSON.parse(localStorage.getItem('removed_xs_liste_messgeraete') || '[]'); } catch (e) {}

  let unassignedXNumbers = xNumbers.filter(num => {
    const label = `X ${num}`;
    return !assignedXLabels.includes(label) && !removedXs.includes(label);
  });
  unassignedXNumbers.sort((a, b) => a - b);

  const container = document.getElementById('x-btn-list');
  if (container) container.innerHTML = '';
  let xBtnListArea = container;
  // Check if the moveable-area wrapper already exists
  const existingXWrapper = container ? container.parentNode : null;
  if (existingXWrapper && existingXWrapper.classList.contains('moveable-area') && existingXWrapper.dataset.areaId === 'x-btn-list') {
    xBtnListArea = existingXWrapper;
  } else if (container && !container.classList.contains('moveable-area')) {
    // Only create wrapper if it doesn't already exist
    const wrapper = document.createElement('div');
    wrapper.className = 'moveable-area';
    wrapper.dataset.areaId = 'x-btn-list';
    container.parentNode.insertBefore(wrapper, container);
    wrapper.appendChild(container);
    xBtnListArea = wrapper;
  }
  if (window.registerArea) window.registerArea('x-btn-list', xBtnListArea);

  if (window.renderMoveableButtons) {
    window.renderMoveableButtons(container, unassignedXNumbers, 'X', 'x-btn', function(btn, num) {
      btn.style.border = '2px solid #6b3e26';
      btn.style.color = '#fff';
      btn.style.background = '#6b3e26';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'x-btn-list');
    });
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  }

  // Optional: show removed-but-not-assigned X items in the Messgeräte area
  const xArea = document.querySelector('.moveable-area[data-area-id="messgeraete"] .area-content');
  if (xArea) {
    const removedButNotAssigned = removedXs.filter(label => !assignedXLabels.includes(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('X ', ''), 10)).filter(n => !isNaN(n));
    
    // Build all new buttons in a fragment for atomic insertion
    const fragment = document.createDocumentFragment();
    
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      const defaultLabel = 'X ' + num;
      let buttonText = defaultLabel;
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        if (customButtonTexts[defaultLabel]) {
          buttonText = customButtonTexts[defaultLabel];
        }
      } catch (e) {}
      btn.textContent = buttonText;
      btn.className = 'btn x-btn';
      btn.style.border = '2px solid #6b3e26';
      btn.style.color = '#fff';
      btn.style.background = '#6b3e26';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      const xDblClickHandler = function() {
        let removedXs = [];
        try { removedXs = JSON.parse(localStorage.getItem('removed_xs_liste_messgeraete') || '[]'); } catch (e) {}
        const label = 'X ' + num;
        const idx = removedXs.indexOf(label);
        if (idx !== -1) {
          removedXs.splice(idx, 1);
          localStorage.setItem('removed_xs_liste_messgeraete', JSON.stringify(removedXs));
          renderXListePage();
        }
      };
      // Don't add click-to-remove for removed area buttons
      fragment.appendChild(btn);
    });
    
    // Clear and repopulate in one atomic operation to avoid the "clearing one by one" effect
    xArea.innerHTML = '';
    xArea.appendChild(fragment);
  }
  // Render custom X buttons created via "+" button
  let customXButtons = [];
  try { customXButtons = JSON.parse(localStorage.getItem('custom_x_buttons') || '[]'); } catch (e) {}
  const xBtnList = document.getElementById('x-btn-list');
  customXButtons.forEach(customBtn => {
    let isAssigned = false;
    vehiclePages.forEach(pageFile => {
      let moveables = [];
      try { moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageFile)) || '[]'); } catch (e) {}
      (moveables||[]).forEach(m => {
        if (m && m.customId === customBtn.id) {
          isAssigned = true;
        }
      });
    });
    if (!isAssigned && xBtnList) {
      const btn = document.createElement('button');
      let customButtonTexts = {};
      try { customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}'); } catch (e) {}
      const savedText = customButtonTexts[customBtn.label];
      btn.textContent = savedText || customBtn.label;
      btn.dataset.fullLabel = customBtn.label;
      btn.dataset.customId = customBtn.id;
      btn.className = 'btn x-btn';
      btn.style.border = '2px solid #6b3e26';
      btn.style.color = '#fff';
      btn.style.background = '#6b3e26';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'x-btn-list');
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          }, { passive: false });
        }
      } catch(_) {}
      xBtnList.appendChild(btn);
    }
  });
  // Add handler for "+" button to create new X
  const addXBtn = document.getElementById('add-x-btn');
  if (addXBtn && !addXBtn.dataset.xClickWired) {
    addXBtn.dataset.xClickWired = '1';
    const handleAddX = function() {
      // Visual feedback: scale the button
      addXBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { addXBtn.style.transform = 'scale(1)'; }, 100);
      
      // Prompt for button text immediately
      const buttonText = prompt('Name für neue Messgeräte-Button:', 'X');
      if (buttonText === null || buttonText.trim() === '') {
        // User clicked Cancel or entered empty string
        return;
      }
      
      // CHECK FOR DUPLICATES - button text must be unique
      const duplicateCheck = findButtonGlobally(buttonText);
      if (duplicateCheck.found) {
        alert(`${buttonText} existiert bereits in: ${duplicateCheck.location}`);
        return;
      }
      
      // Generate a unique ID for this new button
      const buttonId = 'custom_x_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      
      // Store in custom buttons list
      let customButtons = [];
      try { customButtons = JSON.parse(localStorage.getItem('custom_x_buttons') || '[]'); } catch (e) {}
      customButtons.push({ id: buttonId, label: buttonId });
      localStorage.setItem('custom_x_buttons', JSON.stringify(customButtons));
      
      // Store custom button text
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        customButtonTexts[buttonId] = buttonText;
        localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
      } catch (e) {}
      
      // Create button with entered text
      const btn = document.createElement('button');
      btn.textContent = buttonText;
      btn.className = 'btn x-btn';
      btn.style.border = '2px solid #6b3e26';
      btn.style.color = '#fff';
      btn.style.background = '#6b3e26';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      btn.dataset.fullLabel = buttonId;
      btn.dataset.customId = buttonId;
      
      // Wire up click handler for sidebar BEFORE adding to DOM
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          });
        }
      } catch(_) {}
      
      // Add to DOM and make moveable
      const xBtnList = document.getElementById('x-btn-list');
      if (xBtnList) {
        xBtnList.appendChild(btn);
        if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'x-btn-list');
        // Sort buttons after adding the new one
        sortButtonsByNumber(xBtnList);
      }
    };
    addXBtn.addEventListener('click', handleAddX);
  }
  
  // Sort X buttons by number after all buttons are rendered
  const xList = document.getElementById('x-btn-list');
  if (xList) sortButtonsByNumber(xList);
  
  // Add handler for "-" button to remove the last X
  const removeXBtn = document.getElementById('remove-x-btn');
  if (removeXBtn && !removeXBtn.dataset.xRemoveWired) {
    removeXBtn.dataset.xRemoveWired = '1';
    const handleRemoveX = function() {
      // Visual feedback: scale the button
      removeXBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { removeXBtn.style.transform = 'scale(1)'; }, 100);
      
      // Get the X button list and remove the last button
      const xBtnList = document.getElementById('x-btn-list');
      if (xBtnList) {
        const buttons = xBtnList.querySelectorAll('button.x-btn');
        if (buttons.length > 0) {
          const lastBtn = buttons[buttons.length - 1];
          lastBtn.remove();
        }
      }
    };
    removeXBtn.addEventListener('click', handleRemoveX);
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
  // PA numbers provided by user, plus any custom ones from localStorage
  let baseNumbers = [29,62,36,15,47,60,20,43,26,19,50,31,21,8,46,24,48,12,61,57,23,34,44,54,39,63,55,22,66,58,18,1,17,25,11,4,14,28,3,9,64,7,10,59,49,45,16,32,56,33,2,42,41,65,38,6,5,27,30];
  let customPANumbers = [];
  try { customPANumbers = JSON.parse(localStorage.getItem('custom_pa_numbers') || '[]'); } catch (e) {}
  const paNumbers = [...new Set([...baseNumbers, ...customPANumbers])].sort((a, b) => a - b);
  // Compute PAs assigned across all vehicles
  let assignedPALabels = [];
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html',
    'tlf-azubi.html','hauptwache.html'
  ];
  vehiclePages.forEach(pageFile => {
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageFile)) || '[]'); } catch (e) {}
    (moveables||[]).forEach(m => {
      if (m && m.label) {
        // Use baseLabel if available (set during assignment), otherwise extract from label
        let baseLabel = m.baseLabel;
        if (!baseLabel && /^PA\s+\d+/.test(m.label)) {
          baseLabel = (m.label.match(/^PA\s+\d+/)||[''])[0].trim();
        }
        if (baseLabel) {
          assignedPALabels.push(baseLabel);
        }
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
  let unassignedPANumbers = paNumbers.filter(n => {
    const label = `PA ${n}`;
    // Exclude any that appear as combined entries
    return !assignedSet.has(label) && !removedPAs.includes(label) && !combinedPASet.has(label);
  });
  // Align with baseline: no fallback when all are removed; keep list empty
  unassignedPANumbers.sort((a, b) => a - b);
  const container = document.getElementById('pa-btn-list');
  if (container) container.innerHTML = '';
  let paBtnListArea = container;
  // Check if the moveable-area wrapper already exists
  const existingWrapper = container ? container.parentNode : null;
  if (existingWrapper && existingWrapper.classList.contains('moveable-area') && existingWrapper.dataset.areaId === 'pa-btn-list') {
    paBtnListArea = existingWrapper;
  } else if (container && !container.classList.contains('moveable-area')) {
    // Only create wrapper if it doesn't already exist
    const wrapper = document.createElement('div');
    wrapper.className = 'moveable-area';
    wrapper.dataset.areaId = 'pa-btn-list';
    container.parentNode.insertBefore(wrapper, container);
    wrapper.appendChild(container);
    paBtnListArea = wrapper;
  }
  if (window.registerArea) window.registerArea('pa-btn-list', paBtnListArea);
  // First render combined PA+FL buttons from mapping (only if not assigned and not removed)
  combinedMap.sort((a, b) => a.pa - b.pa);
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
    // Set base label so decorator can extract PA number, but check for custom text first
    let buttonText = label;
    try {
      const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
      if (customButtonTexts[label]) {
        buttonText = customButtonTexts[label];
      }
    } catch (e) {}
    btn.textContent = buttonText;
    // Store full label (with FL info) for proper identification
    btn.dataset.fullLabel = fullLabel;
    // Decorate inline with badge based on FL group
    const isGold = (() => {
      const goldenFL = [126,212,202,149,209,173,164,156,154,196,163,216,205,181,203,208,160,227,136,120,188,218,225,177,153,198,138,127,215,213,192,174,206,158,210,140,130,155,190,221,178,143,122,180,171,175,131,152,128,172,129,169,123,199,219,229,194,157,195,207,220,124,226,224,197,161,170,201,119,193,183,214,121,125,159,135,176,139,179,141,142,184,145,185,144,186,146,147,189,148,191,150,200,151,204,162,211,165,217,166,222,167,223,168,228,182,238,137,187,8,43,57,93,167,189,211,289];
      return goldenFL.includes(entry.fl);
    })();
    decorateCombinedPAInline(btn, entry.fl, isGold ? 'gold' : 'grey');
    // Home list (PA) should open sidebar on click
    try { 
      if (typeof showAssignmentSidebar === 'function') {
        const sidebarHandler = function() { showAssignmentSidebar(btn); };
        btn.addEventListener('click', sidebarHandler);
        btn.addEventListener('touchend', function(e) {
          const touch = e.changedTouches && e.changedTouches[0];
          if (touch && !btn.classList.contains('dragging')) {
            e.preventDefault();
            e.stopPropagation();
            sidebarHandler();
          }
        }, { passive: false });
      }
    } catch(_) {}
    if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'pa-btn-list');
    container.appendChild(btn);
  });
  // Then render the remaining unassigned base PAs
  unassignedPANumbers.forEach(num => {
    const btn = document.createElement('button');
    const defaultLabel = `PA ${num}`;
    
    // Check if there's a custom text stored for this button
    let buttonText = defaultLabel;
    try {
      const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
      if (customButtonTexts[defaultLabel]) {
        buttonText = customButtonTexts[defaultLabel];
      }
    } catch (e) {}
    
    btn.textContent = buttonText;
    btn.dataset.fullLabel = defaultLabel; // Store the canonical label for persistence
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
    // Home list (PA) should open sidebar on click
    try { 
      if (typeof showAssignmentSidebar === 'function') {
        const sidebarHandler = function() { showAssignmentSidebar(btn); };
        btn.addEventListener('click', sidebarHandler);
        btn.addEventListener('touchend', function(e) {
          const touch = e.changedTouches && e.changedTouches[0];
          if (touch && !btn.classList.contains('dragging')) {
            e.preventDefault();
            e.stopPropagation();
            sidebarHandler();
          }
        }, { passive: false });
      }
    } catch(_) {}
    container.appendChild(btn);
  });
  const paArea = document.querySelector('.moveable-area[data-area-id="pa"] .area-content');
  if (paArea) {
    const removedButNotAssigned = removedPAs.filter(label => !assignedSet.has(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('PA ', ''), 10)).filter(n => !isNaN(n));
    
    // Remove old buttons first (by class, not innerHTML) to avoid flicker
    paArea.querySelectorAll('button.pa-btn').forEach(btn => btn.remove());
    
    // Build all new buttons in a fragment for atomic insertion
    const fragment = document.createDocumentFragment();
    
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      const defaultLabel = `PA ${num}`;
      
      // Check if there's a custom text stored for this button
      let buttonText = defaultLabel;
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        if (customButtonTexts[defaultLabel]) {
          buttonText = customButtonTexts[defaultLabel];
        }
      } catch (e) {}
      
      btn.textContent = buttonText;
      btn.className = 'pa-btn';
      btn.style.border = '2px solid #888';
      btn.style.color = '#bbb';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      const paDblClickHandler = function(e) {
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
      // Don't add click-to-remove for removed area buttons
      fragment.appendChild(btn);
    });
    
    // Append all new buttons at once
    paArea.appendChild(fragment);
  }
  // Render custom PA buttons created via "+" button
  let customPAButtons = [];
  try { customPAButtons = JSON.parse(localStorage.getItem('custom_pa_buttons') || '[]'); } catch (e) {}
  customPAButtons.forEach(customBtn => {
    // Check if this custom button is already assigned somewhere
    let isAssigned = false;
    vehiclePages.forEach(pageFile => {
      let moveables = [];
      try { moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageFile)) || '[]'); } catch (e) {}
      (moveables||[]).forEach(m => {
        if (m && m.customId === customBtn.id) {
          isAssigned = true;
        }
      });
    });
    if (!isAssigned) {
      const btn = document.createElement('button');
      let customButtonTexts = {};
      try { customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}'); } catch (e) {}
      const savedText = customButtonTexts[customBtn.label];
      const buttonText = savedText || 'PA';
      btn.textContent = buttonText;
      btn.dataset.fullLabel = customBtn.label;
      btn.dataset.customId = customBtn.id;
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
      // Wire up click handler for sidebar
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          }, { passive: false });
        }
      } catch(_) {}
      container.appendChild(btn);
    }
  });
  // Add handler for "+" button to create new PA - simplified, no number logic
  const addPABtn = document.getElementById('add-pa-btn');
  if (addPABtn && !addPABtn.dataset.paClickWired) {
    addPABtn.dataset.paClickWired = '1';
    const handleAddPA = function() {
      // Visual feedback: scale the button
      addPABtn.style.transform = 'scale(0.9)';
      setTimeout(() => { addPABtn.style.transform = 'scale(1)'; }, 100);
      
      // Check if "PA" already exists globally
      const existsCheck = findButtonGlobally('PA');
      if (existsCheck.found) {
        alert(`PA existiert bereits in: ${existsCheck.location}`);
        return;
      }
      
      // Prompt for button text immediately
      const buttonText = prompt('Name für neue PA-Button:', 'PA');
      if (buttonText === null || buttonText.trim() === '') {
        // User clicked Cancel or entered empty string
        return;
      }
      
      // CHECK FOR DUPLICATES - button text must be unique
      const duplicateCheck = findButtonGlobally(buttonText);
      if (duplicateCheck.found) {
        alert(`${buttonText} existiert bereits in: ${duplicateCheck.location}`);
        return;
      }
      
      // Generate a unique ID for this new button
      const buttonId = 'custom_pa_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      
      // Store in custom buttons list
      let customButtons = [];
      try { customButtons = JSON.parse(localStorage.getItem('custom_pa_buttons') || '[]'); } catch (e) {}
      customButtons.push({ id: buttonId, label: buttonId });
      localStorage.setItem('custom_pa_buttons', JSON.stringify(customButtons));
      
      // Store custom button text
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        customButtonTexts[buttonId] = buttonText;
        localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
      } catch (e) {}
      
      // Create button with entered text
      const btn = document.createElement('button');
      btn.textContent = buttonText;
      btn.className = 'btn pa-btn';
      btn.style.border = '2px solid #888';
      btn.style.color = '#bbb';
      btn.style.background = '#111';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      btn.dataset.fullLabel = buttonId;
      btn.dataset.customId = buttonId;
      
      // Wire up click handler for sidebar BEFORE adding to DOM
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          });
        }
      } catch(_) {}
      
      // Make it moveable and add to DOM
      const paBtnList = document.getElementById('pa-btn-list');
      if (paBtnList) {
        paBtnList.appendChild(btn);
        if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'pa-btn-list');
        // Sort buttons after adding the new one
        sortButtonsByNumber(paBtnList);
      }
    };
    addPABtn.addEventListener('click', handleAddPA);
  }
  
  // Sort PA buttons by number after all buttons are rendered
  const paList = document.getElementById('pa-btn-list');
  if (paList) sortButtonsByNumber(paList);
  
  // Add handler for "-" button to remove the last PA - simplified
  const removePABtn = document.getElementById('remove-pa-btn');
  if (removePABtn && !removePABtn.dataset.paRemoveWired) {
    removePABtn.dataset.paRemoveWired = '1';
    const handleRemovePA = function() {
      // Visual feedback: scale the button
      removePABtn.style.transform = 'scale(0.9)';
      setTimeout(() => { removePABtn.style.transform = 'scale(1)'; }, 100);
      
      // Get custom PA buttons
      let customPAButtons = [];
      try { customPAButtons = JSON.parse(localStorage.getItem('custom_pa_buttons') || '[]'); } catch (e) {}
      
      // Remove the last custom button if any exist
      if (customPAButtons.length > 0) {
        const removedButton = customPAButtons.pop();
        localStorage.setItem('custom_pa_buttons', JSON.stringify(customPAButtons));
        
        // Also remove any stored custom text for this button
        try {
          const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
          if (removedButton.label && customButtonTexts[removedButton.label]) {
            delete customButtonTexts[removedButton.label];
            localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
          }
        } catch (e) {}
        
        // Re-render the page
        if (typeof renderPAListePage === 'function') {
          renderPAListePage();
        }
      }
    };
    removePABtn.addEventListener('click', handleRemovePA);
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
  // Render login log widget on load (only if on hauptmenu)
  const initialPage = window.location.hash.replace(/^#/, '') || 'hauptmenu';
  if (initialPage === 'hauptmenu') {
    try { renderLoginLogWidget(); } catch (_) {}
  }
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
      // Create a persistent floating fullscreen button so users can enter fullscreen from any page
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
            const isIOS = (/iP(ad|hone|od)/.test(navigator.userAgent)) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            if (isIOS) {
              const root = document.documentElement;
              const isFull = root.classList.toggle('app-full');
              fab.textContent = isFull ? 'Beenden' : 'Vollbild';
              const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
              if (!isStandalone && isFull) {
                try {
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
                    card.innerHTML = `<div style="font-weight:700;margin-bottom:8px">Tipp für iPad</div><div style="margin-bottom:8px">Um die Safari-Leiste zu entfernen und die App wirklich bildschirmfüllend zu benutzen, füge diese Seite zum Home-Bildschirm hinzu:</div><ol style="padding-left:18px;margin:0 0 10px 0"><li>Tippe auf das Teilen-Symbol in Safari</li><li>Wähle "Zum Home-Bildschirm"</li><li>Starte die App vom Home-Bildschirm</li></ol><div style="color:#666;font-size:0.9rem;margin-bottom:10px">Hinweis: Die Seite muss über HTTPS geladen werden, damit das Hinzufügen zum Home-Bildschirm optimal funktioniert.</div>`;
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
  }, 40);
  // Extra safety: recalculate header offset on various viewport events
  try {
    const updateHeaderOffset = function() {
      // Calculate and apply header offset if needed
      try {
        const header = document.getElementById('app-header');
        const main = document.getElementById('app-main');
        if (header && main) {
          const height = header.offsetHeight;
          main.style.paddingTop = (height + 12) + 'px';
        }
      } catch (_) {}
    };
    window.addEventListener('load', updateHeaderOffset);
    window.addEventListener('orientationchange', updateHeaderOffset);
    if (window.visualViewport && typeof window.visualViewport.addEventListener === 'function') {
      window.visualViewport.addEventListener('resize', updateHeaderOffset);
    }
    setTimeout(updateHeaderOffset, 600);
  } catch (_) {}
});

// ---- CSA List Page Rendering ----
function renderCSAListePage() {
  // CSA button numbers: base numbers 1-5, plus custom from localStorage
  const baseCSANumbers = [1, 2, 3, 4, 5];
  let customCSANumbers = [];
  try { customCSANumbers = JSON.parse(localStorage.getItem('custom_csa_numbers') || '[]'); } catch (e) {}
  const csaNumbers = [...new Set([...baseCSANumbers, ...customCSANumbers])].sort((a, b) => a - b);
  
  let assignedCSALabels = [];
  const vehiclePages = [
    '1-hlf20-1.html','1-hlf20-2.html','1-hlf20-3.html','1-dlk23-1.html','1-tlf4000-1.html',
    '2-lf10-1.html','2-rw-1.html','3-hlf20-1.html','3-lfkat20.html','4-lf10-1.html','4-tlf3000-1.html','5-hlf20-1.html','gwg.html',
    'tlf-azubi.html','hauptwache.html'
  ];
  vehiclePages.forEach(page => {
    const moveablesKey = moveablesKeyFor(page);
    let moveables = [];
    try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
    moveables.forEach(m => {
      if (m && m.label) {
        let baseLabel = m.baseLabel;
        if (!baseLabel && /^CSA\s+\d+/.test(m.label)) {
          baseLabel = (m.label.match(/^CSA\s+\d+/)||[''])[0].trim();
        }
        if (baseLabel) {
          assignedCSALabels.push(baseLabel);
        }
      }
    });
  });

  let removedCSAs = [];
  try { removedCSAs = JSON.parse(localStorage.getItem('removed_csas_liste_csa') || '[]'); } catch (e) {}

  let unassignedCSANumbers = csaNumbers.filter(num => {
    const label = `CSA ${num}`;
    return !assignedCSALabels.includes(label) && !removedCSAs.includes(label);
  });
  unassignedCSANumbers.sort((a, b) => a - b);

  const container = document.getElementById('csa-btn-list');
  if (container) container.innerHTML = '';
  let csaBtnListArea = container;
  // Check if the moveable-area wrapper already exists
  const existingCSAWrapper = container ? container.parentNode : null;
  if (existingCSAWrapper && existingCSAWrapper.classList.contains('moveable-area') && existingCSAWrapper.dataset.areaId === 'csa-btn-list') {
    csaBtnListArea = existingCSAWrapper;
  } else if (container && !container.classList.contains('moveable-area')) {
    // Only create wrapper if it doesn't already exist
    const wrapper = document.createElement('div');
    wrapper.className = 'moveable-area';
    wrapper.dataset.areaId = 'csa-btn-list';
    container.parentNode.insertBefore(wrapper, container);
    wrapper.appendChild(container);
    csaBtnListArea = wrapper;
  }
  if (window.registerArea) window.registerArea('csa-btn-list', csaBtnListArea);

  if (window.renderMoveableButtons) {
    window.renderMoveableButtons(container, unassignedCSANumbers, 'CSA', 'csa-btn', function(btn, num) {
      btn.style.border = '2px solid #ff8800';
      btn.style.color = '#000';
      btn.style.background = '#ff8800';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'csa-btn-list');
    });
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  }

  // Optional: show removed-but-not-assigned CSA items in the CSA area
  const csaArea = document.querySelector('.moveable-area[data-area-id="csa"] .area-content');
  if (csaArea) {
    const removedButNotAssigned = removedCSAs.filter(label => !assignedCSALabels.includes(label));
    const removedNumbers = removedButNotAssigned.map(label => parseInt(label.replace('CSA ', ''), 10)).filter(n => !isNaN(n));
    
    // Remove old buttons first (by class, not innerHTML) to avoid flicker
    csaArea.querySelectorAll('button.csa-btn').forEach(btn => btn.remove());
    
    // Build all new buttons in a fragment for atomic insertion
    const fragment = document.createDocumentFragment();
    
    removedNumbers.forEach(num => {
      const btn = document.createElement('button');
      const defaultLabel = 'CSA ' + num;
      let buttonText = defaultLabel;
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        if (customButtonTexts[defaultLabel]) {
          buttonText = customButtonTexts[defaultLabel];
        }
      } catch (e) {}
      btn.textContent = buttonText;
      btn.className = 'btn csa-btn';
      btn.style.border = '2px solid #ff8800';
      btn.style.color = '#000';
      btn.style.background = '#ff8800';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      fragment.appendChild(btn);
    });
    
    // Append all new buttons at once
    csaArea.appendChild(fragment);
  }
  // Render custom CSA buttons created via "+" button
  let customCSAButtons = [];
  try { customCSAButtons = JSON.parse(localStorage.getItem('custom_csa_buttons') || '[]'); } catch (e) {}
  const csaBtnList = document.getElementById('csa-btn-list');
  customCSAButtons.forEach(customBtn => {
    let isAssigned = false;
    vehiclePages.forEach(pageFile => {
      let moveables = [];
      try { moveables = JSON.parse(localStorage.getItem(moveablesKeyFor(pageFile)) || '[]'); } catch (e) {}
      (moveables||[]).forEach(m => {
        if (m && m.customId === customBtn.id) {
          isAssigned = true;
        }
      });
    });
    if (!isAssigned && csaBtnList) {
      const btn = document.createElement('button');
      let customButtonTexts = {};
      try { customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}'); } catch (e) {}
      const savedText = customButtonTexts[customBtn.label];
      btn.textContent = savedText || 'CSA';
      btn.dataset.fullLabel = customBtn.label;
      btn.dataset.customId = customBtn.id;
      btn.className = 'btn csa-btn';
      btn.style.border = '2px solid #ff8800';
      btn.style.color = '#000';
      btn.style.background = '#ff8800';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'csa-btn-list');
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          }, { passive: false });
        }
      } catch(_) {}
      csaBtnList.appendChild(btn);
    }
  });
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    const event = new Event('input', { bubbles: true });
    searchInput.dispatchEvent(event);
  }
  // Add handler for "+" button to create new CSA
  const addCSABtn = document.getElementById('add-csa-btn');
  if (addCSABtn && !addCSABtn.dataset.csaClickWired) {
    addCSABtn.dataset.csaClickWired = '1';
    const handleAddCSA = function() {
      // Visual feedback: scale the button
      addCSABtn.style.transform = 'scale(0.9)';
      setTimeout(() => { addCSABtn.style.transform = 'scale(1)'; }, 100);
      
      // Prompt for button text immediately
      const buttonText = prompt('Name für neue CSA-Button:', 'CSA');
      if (buttonText === null || buttonText.trim() === '') {
        // User clicked Cancel or entered empty string
        return;
      }
      
      // CHECK FOR DUPLICATES - button text must be unique
      const duplicateCheck = findButtonGlobally(buttonText);
      if (duplicateCheck.found) {
        alert(`${buttonText} existiert bereits in: ${duplicateCheck.location}`);
        return;
      }
      
      // Generate a unique ID for this new button
      const buttonId = 'custom_csa_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      
      // Store in custom buttons list
      let customButtons = [];
      try { customButtons = JSON.parse(localStorage.getItem('custom_csa_buttons') || '[]'); } catch (e) {}
      customButtons.push({ id: buttonId, label: buttonId });
      localStorage.setItem('custom_csa_buttons', JSON.stringify(customButtons));
      
      // Store custom button text
      try {
        const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
        customButtonTexts[buttonId] = buttonText;
        localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
      } catch (e) {}
      
      // Create button with entered text
      const btn = document.createElement('button');
      btn.textContent = buttonText;
      btn.className = 'btn csa-btn';
      btn.style.border = '2px solid #ff8800';
      btn.style.color = '#000';
      btn.style.background = '#ff8800';
      btn.style.fontWeight = 'bold';
      btn.style.margin = '6px';
      btn.style.minWidth = '54px';
      btn.style.minHeight = '44px';
      btn.style.fontSize = '1.1rem';
      btn.dataset.fullLabel = buttonId;
      btn.dataset.customId = buttonId;
      
      // Wire up click handler for sidebar BEFORE adding to DOM
      try { 
        if (typeof showAssignmentSidebar === 'function') {
          const sidebarHandler = function() { showAssignmentSidebar(btn); };
          btn.addEventListener('click', sidebarHandler);
          btn.addEventListener('touchend', function(e) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch && !btn.classList.contains('dragging')) {
              e.preventDefault();
              e.stopPropagation();
              sidebarHandler();
            }
          });
        }
      } catch(_) {}
      
      // Add to DOM and make moveable
      const csaBtnList = document.getElementById('csa-btn-list');
      if (csaBtnList) {
        csaBtnList.appendChild(btn);
        if (window.makeButtonMoveable) window.makeButtonMoveable(btn, 'csa-btn-list');
        // Sort buttons after adding the new one
        sortButtonsByNumber(csaBtnList);
      }
    };
    addCSABtn.addEventListener('click', handleAddCSA);
  }
  
  // Sort CSA buttons by number after all buttons are rendered
  const csaList = document.getElementById('csa-btn-list');
  if (csaList) sortButtonsByNumber(csaList);
  
  // Add handler for "-" button to remove the last CSA
  const removeCSABtn = document.getElementById('remove-csa-btn');
  if (removeCSABtn && !removeCSABtn.dataset.csaRemoveWired) {
    removeCSABtn.dataset.csaRemoveWired = '1';
    const handleRemoveCSA = function() {
      // Visual feedback: scale the button
      removeCSABtn.style.transform = 'scale(0.9)';
      setTimeout(() => { removeCSABtn.style.transform = 'scale(1)'; }, 100);
      
      // Get custom CSA buttons
      let customCSAButtons = [];
      try { customCSAButtons = JSON.parse(localStorage.getItem('custom_csa_buttons') || '[]'); } catch (e) {}
      
      // Remove the last custom button if any exist
      if (customCSAButtons.length > 0) {
        const removedButton = customCSAButtons.pop();
        localStorage.setItem('custom_csa_buttons', JSON.stringify(customCSAButtons));
        
        // Also remove any stored custom text for this button
        try {
          const customButtonTexts = JSON.parse(localStorage.getItem('custom_button_texts') || '{}');
          if (removedButton.label && customButtonTexts[removedButton.label]) {
            delete customButtonTexts[removedButton.label];
            localStorage.setItem('custom_button_texts', JSON.stringify(customButtonTexts));
          }
        } catch (e) {}
        
        // Re-render the page
        if (typeof renderCSAListePage === 'function') {
          renderCSAListePage();
        }
      }
    };
    removeCSABtn.addEventListener('click', handleRemoveCSA);
  }
}


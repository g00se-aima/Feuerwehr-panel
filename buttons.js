(function() {
  'use strict';

  // Vehicle list
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

  function getEl(container) {
    return typeof container === 'string' ? document.querySelector(container) : container;
  }

  function getSelectedVehicles(container) {
    const el = getEl(container);
    if (!el) return [];
    return Array.from(el.querySelectorAll('button.vehicle-btn'))
      .filter(b => b.dataset.selected === 'true')
      .map(b => ({ title: b.textContent, file: b.dataset.file }));
  }

  function clearVehicleSelection(container) {
    const el = getEl(container);
    if (!el) return;
    el.querySelectorAll('button.vehicle-btn').forEach(b => {
      b.dataset.selected = 'false';
      b.style.outline = '';
      b.style.background = '';
    });
  }

  function makeSelectableBtn(title, file, onToggle) {
    const btn = document.createElement('button');
    btn.textContent = title;
    btn.className = 'btn btn-black vehicle-btn';
    btn.dataset.file = file;
    btn.dataset.selected = 'false';
    btn.addEventListener('click', () => {
      const sel = btn.dataset.selected === 'true';
      btn.dataset.selected = String(!sel);
      if (!sel) {
        btn.style.outline = '3px solid #2ecc71';
        btn.style.background = '#1f1f1f';
      } else {
        btn.style.outline = '';
        btn.style.background = '';
      }
      if (typeof onToggle === 'function') {
        const list = getSelectedVehicles(btn.closest('.page-buttons') || btn.parentNode);
        onToggle(list);
      }
    });
    return btn;
  }

  // New: selectable vehicle buttons (no filtering)
  window.renderSelectableVehicleButtons = function(container, opts) {
    const el = getEl(container);
    if (!el) return;
    const onToggle = opts && opts.onToggle;
    el.innerHTML = '';
    window.VEHICLE_LIST.forEach(([title, file]) => {
      const btn = makeSelectableBtn(title, file, onToggle);
      el.appendChild(btn);
    });
  };

  // Action: "call" selected vehicles (stores to localStorage and dispatches event)
  window.callSelectedVehicles = function(container) {
    const vehicles = getSelectedVehicles(container);
    const payload = { when: Date.now(), vehicles };
    try { localStorage.setItem('called_vehicles', JSON.stringify(payload)); } catch (e) {}
    document.dispatchEvent(new CustomEvent('vehicles:called', { detail: payload }));
    return vehicles;
  };

  window.getSelectedVehicles = getSelectedVehicles;
  window.clearVehicleSelection = clearVehicleSelection;

  // Legacy: simple non-filtered renderer (navigates on click)
    window.renderVehicleButtons = function(container) {
    const el = getEl(container);
    if (!el) return;
    el.innerHTML = '';
    window.VEHICLE_LIST.forEach(([title, file]) => {
      const btn = document.createElement('button');
      btn.textContent = title;
      btn.className = 'btn btn-black vehicle-btn';
      // Prefer SPA navigation when available. Fall back to loading the file
      // (for environments where the SPA isn't initialized) to remain safe.
      btn.addEventListener('click', () => {
        const key = String(file).replace(/\.html$/i, '');
        if (typeof window.navigate === 'function') {
          try { window.navigate(key); } catch (e) { window.location.href = file; }
        } else {
          window.location.href = file;
        }
      });
      el.appendChild(btn);
    });
  };

  // --- Moveable resource buttons (PA, TF, FL, etc.) with assignment sidebar ---
  // Render a list of moveable buttons like "PA 12", "TF 117", "FL 126" that can be assigned via sidebar
  window.renderMoveableButtons = function(container, numbers, prefix, className, styleFn) {
    const el = getEl(container);
    if (!el) return;
    numbers.forEach(num => {
      const btn = document.createElement('button');
      btn.textContent = prefix + ' ' + num;
      btn.setAttribute('draggable', 'true');
      btn.className = 'btn ' + (className || '');
      if (typeof styleFn === 'function') styleFn(btn, num);
      btn.addEventListener('click', function() {
        showAssignmentSidebar(btn);
      });
      el.appendChild(btn);
    });
  };

  // Build destinations: static locations + vehicle titles from VEHICLE_LIST
  const STATIC_DESTINATIONS = [
    'AGW',
    'Für Silschede',
    'Von Silschede',
    'TLF Azubi',
    'Lager Hauptwache',
    'Klutertbad',
    'GWG'
  ];
  function getAssignmentDestinations() {
    const vehicleTitles = (window.VEHICLE_LIST || []).map(v => v[0]);
    // De-duplicate while preserving order
    const seen = new Set();
    const all = [...STATIC_DESTINATIONS, ...vehicleTitles].filter(t => {
      if (seen.has(t)) return false; seen.add(t); return true;
    });
    return all;
  }
  const AREA_ASSIGNMENT_BUTTONS = [
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

  // Open a sidebar to assign a moveable button to a destination page + area
  function showAssignmentSidebar(moveableBtn) {
    // Lazy create sidebar root
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

    // Optional edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Text bearbeiten';
    editBtn.className = 'btn btn-red';
    editBtn.style.marginBottom = '18px';
    editBtn.addEventListener('click', function() {
      const newText = prompt('Neuer Text für Button:', moveableBtn.textContent);
      if (newText) moveableBtn.textContent = newText;
      sidebar.style.display = 'none';
    });
    sidebar.appendChild(editBtn);

    // First step: pick destination page
    const btnGrid = document.createElement('div');
    btnGrid.className = 'sidebar-assignment-grid';
    let selectedVehicleFile = null;
    const QUICK_SILS = ['Silschede','Von Silschede','Für Silschede'];
    getAssignmentDestinations().forEach(dest => {
      // If the item being assigned is an FL, do not offer vehicle destinations
      // but always allow the quick Silschede buttons.
      try {
        const text = (moveableBtn && moveableBtn.textContent) ? String(moveableBtn.textContent).trim() : '';
        const isFL = text.startsWith('FL ');
        if (isFL) {
          const vehicleTitles = (window.VEHICLE_LIST || []).map(v => v[0]);
          if (vehicleTitles.indexOf(dest) !== -1 && QUICK_SILS.indexOf(dest) === -1) return; // skip vehicle dests for FL
        }
      } catch (_) {}
      const abtn = document.createElement('button');
      abtn.textContent = dest;
      // Style quick Silschede destinations as blue, vehicles as black, others grey
      try {
        const vehicleTitles = (window.VEHICLE_LIST || []).map(v => v[0]);
        let cls = 'btn sidebar-assignment-btn ';
        if (QUICK_SILS.indexOf(dest) !== -1) cls += 'btn-blue';
        else if (/lager/i.test(dest)) cls += 'btn-grey';
        else if (vehicleTitles.indexOf(dest) !== -1) cls += 'btn-black';
        else cls += 'btn-grey';
        abtn.className = cls;
      } catch (_) {
        abtn.className = 'btn btn-grey sidebar-assignment-btn';
      }
      abtn.addEventListener('click', function() {
        selectedVehicleFile = (window.VEHICLE_LIST || []).find(([title, file]) => title === dest)?.[1] || null;
        // Second step: pick area within destination
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
          const closeBtn2 = document.createElement('button');
          closeBtn2.className = 'sidebar-close-btn';
          closeBtn2.innerHTML = '&times;';
          closeBtn2.title = 'Schließen';
          closeBtn2.onclick = () => { areaSidebar.style.display = 'none'; };
          areaSidebar.appendChild(closeBtn2);
          const t2 = document.createElement('h2');
          t2.textContent = 'Wähle einen Bereich (z.B. Fluchthauben):';
          t2.style.fontSize = '1.2rem';
          t2.style.margin = '0 0 18px 0';
          areaSidebar.appendChild(t2);
          const grid = document.createElement('div');
          grid.className = 'sidebar-assignment-grid';
          grid.style.display = 'flex';
          grid.style.flexWrap = 'wrap';
          grid.style.gap = '10px';
          grid.style.marginBottom = '10px';
          // Build the list of areas. If a destination vehicle was selected and
          // the button being assigned is a TF, restrict choices to the two
          // permitted areas only.
          let filteredAreas = AREA_ASSIGNMENT_BUTTONS;
          const text = (moveableBtn && moveableBtn.textContent) ? String(moveableBtn.textContent).trim() : '';
          const isTFBtn = text.startsWith('TF ');
          const isFHBtn = text.startsWith('FH ');
          const isPABtn = (/^\s*PA\s+\d+/i).test(text) || (/\bPA\s+\d+\s+mit\s+FL\s+\d+/i).test(text);
          const isERKBtn = (/^\s*ERK\b/i).test(text);
          const isAMBtn = (/^\s*AM\s+\d+/i).test(text);
          const isSiBtn = (/^\s*Si\s+\d+/i).test(text);
          try {
            // PA (including combined PA+FL) should only be assigned to Atemschutzgeräte
            if (isSiBtn) {
              // Si items (Sicherheitstrupptasche) must go to the Sicherheitstrupptasche area
              filteredAreas = ['Sicherheitstrupptasche'];
            } else if (isPABtn || isERKBtn || isAMBtn) {
              // PA, ERK and AM items must go to the Atemschutzgeräte/Atemschutzmasken areas
              // AM should be saved to the Atemschutzmasken area specifically
              if (isAMBtn) filteredAreas = ['Atemschutzmasken'];
              else filteredAreas = ['Atemschutzgeräte'];
            } else if (isFHBtn) {
              // FH buttons can only go into the Fluchthauben area
              filteredAreas = ['Fluchthauben'];
            } else if (selectedVehicleFile && isTFBtn) {
              // When a destination vehicle is chosen, TFs are limited to these areas
              filteredAreas = ['Sprungretter', 'Technikflaschen'];
            } else {
              // Legacy behaviour: if assigning from the TF list page itself,
              // prefer Technikflaschen and Sprungretter first
              const isTechnikflaschenPage = window.location.pathname.toLowerCase().includes('liste-technikflaschen');
              if (isTFBtn && isTechnikflaschenPage) filteredAreas = ['Technikflaschen', 'Sprungretter'];
            }
          } catch (_) {}
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
              const fromPage = window.location.pathname.split('/').pop();
              const targetFile = selectedVehicleFile || fromPage;
              // Remove from DOM immediately
              if (moveableBtn.parentNode) moveableBtn.parentNode.removeChild(moveableBtn);
              // Persist to destination page moveables
              const moveablesKey = 'moveables_' + targetFile;
              let moveables = [];
              try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
              moveables.push({
                label: moveableBtn.textContent,
                areaId,
                areaTitle,
                className: moveableBtn.className,
                style: moveableBtn.getAttribute('style'),
                fromPage,
                assignedToPage: targetFile,
                timestamp: Date.now()
              });
              localStorage.setItem(moveablesKey, JSON.stringify(moveables));
              // Persistently remove from source list depending on type
              const label = moveableBtn.textContent.trim();
              if (fromPage === 'liste-technikflaschen.html' && label.startsWith('TF ')) {
                let removedTFs = [];
                try { removedTFs = JSON.parse(localStorage.getItem('removed_tfs_liste_technikflaschen') || '[]'); } catch (e) {}
                if (!removedTFs.includes(label)) {
                  removedTFs.push(label);
                  localStorage.setItem('removed_tfs_liste_technikflaschen', JSON.stringify(removedTFs));
                }
              }
              if (fromPage === 'liste-atemluftflaschen.html' && label.startsWith('FL ')) {
                let removedFLs = [];
                try { removedFLs = JSON.parse(localStorage.getItem('removed_fls_liste_atemluftflaschen') || '[]'); } catch (e) {}
                if (!removedFLs.includes(label)) {
                  removedFLs.push(label);
                  localStorage.setItem('removed_fls_liste_atemluftflaschen', JSON.stringify(removedFLs));
                }
              }
              if (fromPage === 'liste-pa.html' && label.startsWith('PA ')) {
                let removedPAs = [];
                try { removedPAs = JSON.parse(localStorage.getItem('removed_pas_liste_pa') || '[]'); } catch (e) {}
                if (!removedPAs.includes(label)) {
                  removedPAs.push(label);
                  localStorage.setItem('removed_pas_liste_pa', JSON.stringify(removedPAs));
                }
              }
              // Close
              areaSidebar.style.display = 'none';
            });
            grid.appendChild(btn);
          });
          areaSidebar.appendChild(grid);
          if (!document.body.contains(areaSidebar)) document.body.appendChild(areaSidebar);
          areaSidebar.style.display = 'flex';
        }, 0);
      });
      btnGrid.appendChild(abtn);
    });
    sidebar.appendChild(btnGrid);

    // Close on outside click once opened
    setTimeout(() => {
      function handler(e) {
        if (sidebar.style.display !== 'none' && !sidebar.contains(e.target)) {
          sidebar.style.display = 'none';
          document.removeEventListener('mousedown', handler);
        }
      }
      document.addEventListener('mousedown', handler);
    }, 100);

    if (!document.body.contains(sidebar)) document.body.appendChild(sidebar);
    sidebar.style.display = 'flex';
  }

  // Expose sidebar function if needed elsewhere
  window.showAssignmentSidebar = showAssignmentSidebar;
})();
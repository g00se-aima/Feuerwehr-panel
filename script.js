document.addEventListener('DOMContentLoaded', function() {
  if (typeof setupGlobalSearch === 'function') setupGlobalSearch();
});

// --- Improved global search ---
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
      // Include any custom map entries not present in pages (map values are filenames)
      if (window && window.CUSTOM_VEHICLE_MAP) {
        Object.values(window.CUSTOM_VEHICLE_MAP).forEach(f => {
          try { if (f && !files.includes(f)) files.push(f); } catch (_) {}
        });
      }
    } catch (e) {
      // Fallback to a safe hard-coded list if SPA pages aren't available yet
      files = ['index.html'];
    }
    const results = [];
    // 1. Search ALL moveable buttons in localStorage for all pages (global search)
    const pageFiles = files;
    const moveableTypes = [
      { key: 'moveables_', label: '' }, // vehicle/resource assignments
      { key: 'removed_pas_liste_pa', label: 'PA' },
      { key: 'removed_tfs_liste_technikflaschen', label: 'TF' }
    ];
    for (const file of pageFiles) {
      // Search assigned moveables
      try {
        const moveablesKey = 'moveables_' + file;
        let moveables = [];
        try { moveables = JSON.parse(localStorage.getItem(moveablesKey) || '[]'); } catch (e) {}
        moveables.forEach(m => {
          if (m.label && m.label.toLowerCase().includes(q)) {
            results.push({type:'button', title: m.label, page: file, snippet: m.areaTitle || m.areaId || ''});
          }
        });
      } catch (e) {}
    }
    // Search removed PAs
    try {
      let removedPAs = JSON.parse(localStorage.getItem('removed_pas_liste_pa') || '[]');
      removedPAs.forEach(label => {
        if (label.toLowerCase().includes(q)) {
          results.push({type:'button', title: label, page: 'liste-pa.html', snippet: 'Entfernt'});
        }
      });
    } catch (e) {}
    // Search removed TFs
    try {
      let removedTFs = JSON.parse(localStorage.getItem('removed_tfs_liste_technikflaschen') || '[]');
      removedTFs.forEach(label => {
        if (label.toLowerCase().includes(q)) {
          results.push({type:'button', title: label, page: 'liste-technikflaschen.html', snippet: 'Entfernt'});
        }
      });
    } catch (e) {}
    // 2. Search SPA page definitions (avoid fetching separate HTML files)
    // Prefer data from window.pages (title + content). For dynamic areas we also
    // search persisted moveables above, so this covers static page content.
    try {
      for (const file of files) {
        try {
          const pageKey = String(file).replace(/\.html$/i, '');
          if (pageKey === (window.location.hash.replace(/^#/, '') || '')) continue;
          const pageObj = (window && window.pages) ? window.pages[pageKey] : null;
          if (pageObj) {
            const title = String(pageObj.title || pageKey || '').trim();
            if (title && title.toLowerCase().includes(q)) {
              results.push({ type: 'page', title, page: file, snippet: '' });
            }
            const content = String(pageObj.content || '');
            if (content && content.toLowerCase().includes(q)) {
              results.push({ type: 'page', title, page: file, snippet: '' });
            }
            // Try to extract button labels from content HTML if present
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
    // 3. Search SPA source (spa.js) for hard-coded labels and button texts so search finds strings
    try {
      // Determine spa.js URL from script tag if present, otherwise fallback to 'spa.js'
      let spaUrl = 'spa.js';
      try {
        const s = Array.from(document.getElementsByTagName('script')).find(x => x.src && x.src.match(/spa\.js$/));
        if (s && s.src) spaUrl = s.src;
      } catch (_) {}
      const spaRes = await fetch(spaUrl);
      if (spaRes && spaRes.ok) {
        const spaText = await spaRes.text();
        // Capture tokens like 'PA 56', 'AM 65', 'AM 65 (Name)' or other button-like labels
        const tokenRegex = /(PA\s*\d+|FL\s*\d+|AM\s*\d+(?:\s*\([^\)]*\))?|TF\s*\d+|FH\s*\d+|Si\s*\d+|ERK)/gi;
        const seenSpa = new Set();
        let m;
        // Normalize query for fuzzy matching against code tokens (ignore punctuation)
        const qNorm = q.replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
        while ((m = tokenRegex.exec(spaText))) {
          const token = (m[0] || '').trim();
          if (!token) continue;
          const tokenNorm = token.replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
          if (tokenNorm.includes(qNorm)) {
            const key = token + '|' + spaUrl;
            if (seenSpa.has(key)) continue;
            seenSpa.add(key);
            // Build a small snippet around the match
            const idx = m.index;
            const start = Math.max(0, idx - 40);
            const end = Math.min(spaText.length, idx + token.length + 40);
            const snippet = spaText.slice(start, end).replace(/\s+/g, ' ').trim();
            results.push({ type: 'code', title: token, page: spaUrl, snippet });
            if (results.length > 200) break;
          }
        }
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
      // If this is a code result (from spa.js), open an in-app modal showing the snippet instead of navigating away
      if (type === 'code') {
        try {
          // Close dropdown
          searchDropdown.style.display = 'none';
          globalSearch.value = '';
          // Create modal
          let modal = document.getElementById('search-code-modal');
          if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
          modal = document.createElement('div');
          modal.id = 'search-code-modal';
          modal.style.position = 'fixed';
          modal.style.left = '0';
          modal.style.top = '0';
          modal.style.width = '100%';
          modal.style.height = '100%';
          modal.style.background = 'rgba(0,0,0,0.5)';
          modal.style.zIndex = '2000';
          modal.style.display = 'flex';
          modal.style.alignItems = 'center';
          modal.style.justifyContent = 'center';
          const box = document.createElement('div');
          box.style.background = '#fff';
          box.style.padding = '14px';
          box.style.borderRadius = '8px';
          box.style.maxWidth = '90%';
          box.style.maxHeight = '80%';
          box.style.overflow = 'auto';
          const h = document.createElement('div');
          h.style.display = 'flex';
          h.style.justifyContent = 'space-between';
          h.style.alignItems = 'center';
          const title = document.createElement('strong');
          title.textContent = btn || pageRaw || 'Code snippet';
          const close = document.createElement('button');
          close.className = 'btn btn-small';
          close.textContent = 'Schließen';
          close.addEventListener('click', () => { modal.remove(); });
          h.appendChild(title);
          h.appendChild(close);
          box.appendChild(h);
          const pre = document.createElement('pre');
          pre.style.whiteSpace = 'pre-wrap';
          pre.style.fontSize = '0.9rem';
          pre.style.marginTop = '8px';
          pre.textContent = snippet || '';
          box.appendChild(pre);
          modal.appendChild(box);
          modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); });
          document.body.appendChild(modal);
          return;
        } catch (e) { console.error(e); }
      }
      // If the target corresponds to a SPA page key (pages loaded by spa.js), navigate without reloading
      try {
        const pageKey = String(pageRaw).replace(/\.html$/i, '');
        if (window && window.pages && window.pages[pageKey]) {
          // Use SPA navigate to avoid full reload (keeps fullscreen)
          if (typeof window.navigate === 'function') {
            window.navigate(pageKey);
          } else {
            window.location.hash = '#' + pageKey;
          }
          // If a specific button label was requested, try to scroll & highlight it after render
          if (btn) {
            setTimeout(() => {
              try {
                // Find button by exact text match (many buttons are plain text)
                const all = Array.from(document.querySelectorAll('button'));
                const target = all.find(b => (b.textContent || '').trim() === btn.trim() || decodeURIComponent(b.textContent || '').trim() === btn.trim());
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  const orig = target.style.boxShadow;
                  target.style.transition = 'box-shadow 160ms ease-in-out';
                  target.style.boxShadow = '0 0 0 6px rgba(255,215,0,0.9)';
                  setTimeout(() => { target.style.boxShadow = orig || 'none'; }, 1400);
                }
              } catch (e) { /* ignore */ }
            }, 120);
          }
          searchDropdown.style.display = 'none';
          globalSearch.value = '';
          return;
        }
      } catch (e) { /* ignore and fallback to full navigation */ }
          // Fallback: show an in-app viewer but DO NOT open external .html files.
          (async () => {
            try {
              // Try to show a snippet from the SPA pages if available
              const pageKey = String(pageRaw).replace(/\.html$/i, '');
              let text = '';
              if (window && window.pages && window.pages[pageKey]) {
                text = String(window.pages[pageKey].content || window.pages[pageKey].title || '');
              }
              // Build a simple viewer modal (read-only) — no option to open full external page
              searchDropdown.style.display = 'none';
              globalSearch.value = '';
              let viewer = document.getElementById('search-page-viewer');
              if (viewer && viewer.parentNode) viewer.parentNode.removeChild(viewer);
              viewer = document.createElement('div');
              viewer.id = 'search-page-viewer';
              viewer.style.position = 'fixed';
              viewer.style.left = '0';
              viewer.style.top = '0';
              viewer.style.width = '100%';
              viewer.style.height = '100%';
              viewer.style.background = 'rgba(0,0,0,0.6)';
              viewer.style.zIndex = '2100';
              viewer.style.display = 'flex';
              viewer.style.alignItems = 'center';
              viewer.style.justifyContent = 'center';
              const box = document.createElement('div');
              box.style.background = '#fff';
              box.style.padding = '12px';
              box.style.borderRadius = '8px';
              box.style.maxWidth = '92%';
              box.style.maxHeight = '88%';
              box.style.overflow = 'auto';
              const head = document.createElement('div');
              head.style.display = 'flex';
              head.style.justifyContent = 'space-between';
              head.style.alignItems = 'center';
              const title = document.createElement('strong');
              title.textContent = pageRaw;
              const close = document.createElement('button');
              close.className = 'btn btn-small';
              close.textContent = 'Schließen';
              close.addEventListener('click', () => { viewer.remove(); });
              const controls = document.createElement('div');
              controls.appendChild(close);
              head.appendChild(title);
              head.appendChild(controls);
              box.appendChild(head);
              const pre = document.createElement('pre');
              pre.style.whiteSpace = 'pre-wrap';
              pre.style.fontSize = '0.9rem';
              pre.style.marginTop = '8px';
              pre.textContent = (text || '').slice(0, 10000) || 'Keine Vorschau verfügbar.';
              box.appendChild(pre);
              viewer.appendChild(box);
              viewer.addEventListener('click', (ev) => { if (ev.target === viewer) viewer.remove(); });
              document.body.appendChild(viewer);
              return;
            } catch (err) {
              // If even that fails, just hide dropdown and clear input — do not navigate away
              searchDropdown.style.display = 'none';
              globalSearch.value = '';
            }
          })();
    }));
  });
  document.addEventListener('click', function(e) {
    if (!searchDropdown.contains(e.target) && e.target !== globalSearch) searchDropdown.style.display = 'none';
  });
}

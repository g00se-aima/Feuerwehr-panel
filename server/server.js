const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const dbPath = path.join(__dirname, 'feuerwehr.db');
const db = new sqlite3.Database(dbPath);

// Enable WAL mode for better concurrent access
db.run('PRAGMA journal_mode = WAL');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Moveables Endpoints ---

// Get moveables for a specific page
app.get('/api/moveables/:pageFile', (req, res) => {
  const { pageFile } = req.params;
  
  db.all('SELECT * FROM moveables WHERE page_file = ? ORDER BY timestamp DESC', [pageFile], (err, rows) => {
    if (err) {
      console.error('Error fetching moveables:', err);
      return res.status(500).json({ error: 'Failed to fetch moveables' });
    }
    
    // Transform to match client format
    const result = rows.map(m => ({
      id: m.moveable_id,
      label: m.label,
      type: m.type,
      areaId: m.area_id,
      assignedToPage: m.assigned_to_page,
      erkId: m.erk_id,
      timestamp: m.timestamp
    }));
    
    res.json(result);
  });
});

// Save moveables for a specific page
app.post('/api/moveables/:pageFile', (req, res) => {
  const { pageFile } = req.params;
  const moveables = req.body;
  
  if (!Array.isArray(moveables)) {
    return res.status(400).json({ error: 'Expected array of moveables' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    db.run('DELETE FROM moveables WHERE page_file = ?', [pageFile], (err) => {
      if (err) {
        console.error('Error deleting moveables:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to save moveables' });
      }
      
      const stmt = db.prepare(`
        INSERT INTO moveables (page_file, moveable_id, label, type, area_id, assigned_to_page, erk_id, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      moveables.forEach(m => {
        stmt.run(
          pageFile,
          m.id || '',
          m.label || '',
          m.type || null,
          m.areaId || null,
          m.assignedToPage || null,
          m.erkId || null,
          m.timestamp || Date.now()
        );
      });
      
      stmt.finalize();
      
      db.run('COMMIT', (err) => {
        if (err) {
          console.error('Error committing transaction:', err);
          return res.status(500).json({ error: 'Failed to save moveables' });
        }
        res.json({ success: true, count: moveables.length });
      });
    });
  });
});

// --- Custom Buttons Endpoints ---

// Get all custom buttons
app.get('/api/custom-buttons', (req, res) => {
  db.all('SELECT * FROM custom_buttons ORDER BY created_at ASC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching custom buttons:', err);
      return res.status(500).json({ error: 'Failed to fetch custom buttons' });
    }
    
    res.json(rows.map(b => ({
      id: b.button_id,
      label: b.button_id
    })));
  });
});

// Save custom buttons
app.post('/api/custom-buttons', (req, res) => {
  const buttons = req.body;
  
  if (!Array.isArray(buttons)) {
    return res.status(400).json({ error: 'Expected array of buttons' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM custom_buttons');
    
    const stmt = db.prepare(`
      INSERT INTO custom_buttons (button_id, label, button_type)
      VALUES (?, ?, ?)
    `);
    
    buttons.forEach(b => {
      stmt.run(b.id || b.label, b.id || b.label, 'pa');
    });
    
    stmt.finalize();
    
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Error saving custom buttons:', err);
        return res.status(500).json({ error: 'Failed to save custom buttons' });
      }
      res.json({ success: true, count: buttons.length });
    });
  });
});

// Get custom button texts
app.get('/api/custom-button-texts', (req, res) => {
  db.all('SELECT button_id, label FROM custom_buttons', [], (err, rows) => {
    if (err) {
      console.error('Error fetching custom button texts:', err);
      return res.status(500).json({ error: 'Failed to fetch custom button texts' });
    }
    
    const texts = {};
    rows.forEach(b => {
      texts[b.button_id] = b.label;
    });
    
    res.json(texts);
  });
});

// Save custom button texts
app.post('/api/custom-button-texts', (req, res) => {
  const texts = req.body;
  
  const stmt = db.prepare('UPDATE custom_buttons SET label = ? WHERE button_id = ?');
  
  Object.entries(texts).forEach(([buttonId, label]) => {
    stmt.run(label, buttonId);
  });
  
  stmt.finalize((err) => {
    if (err) {
      console.error('Error saving custom button texts:', err);
      return res.status(500).json({ error: 'Failed to save custom button texts' });
    }
    res.json({ success: true });
  });
});

// --- Custom Vehicles Endpoints ---

// Get custom vehicles for a group
app.get('/api/custom-vehicles/:groupName', (req, res) => {
  const { groupName } = req.params;
  
  db.all('SELECT * FROM custom_vehicles WHERE group_name = ? ORDER BY created_at ASC', [groupName], (err, rows) => {
    if (err) {
      console.error('Error fetching custom vehicles:', err);
      return res.status(500).json({ error: 'Failed to fetch custom vehicles' });
    }
    
    res.json(rows.map(v => ({
      label: v.label,
      slug: v.slug
    })));
  });
});

// Add custom vehicle to a group
app.post('/api/custom-vehicles/:groupName', (req, res) => {
  const { groupName } = req.params;
  const { label, slug } = req.body;
  
  if (!label || !slug) {
    return res.status(400).json({ error: 'Label and slug are required' });
  }
  
  db.run(`
    INSERT OR REPLACE INTO custom_vehicles (group_name, label, slug)
    VALUES (?, ?, ?)
  `, [groupName, label, slug], (err) => {
    if (err) {
      console.error('Error adding custom vehicle:', err);
      return res.status(500).json({ error: 'Failed to add custom vehicle' });
    }
    res.json({ success: true });
  });
});

// Delete custom vehicle from a group
app.delete('/api/custom-vehicles/:groupName/:label', (req, res) => {
  const { groupName, label } = req.params;
  
  db.run('DELETE FROM custom_vehicles WHERE group_name = ? AND label = ?', [groupName, label], (err) => {
    if (err) {
      console.error('Error deleting custom vehicle:', err);
      return res.status(500).json({ error: 'Failed to delete custom vehicle' });
    }
    res.json({ success: true });
  });
});

// --- Removed Items Endpoints ---

// Get removed items for a specific list
app.get('/api/removed-items/:listKey', (req, res) => {
  const { listKey } = req.params;
  
  db.all('SELECT item_id FROM removed_items WHERE list_key = ? ORDER BY created_at ASC', [listKey], (err, rows) => {
    if (err) {
      console.error('Error fetching removed items:', err);
      return res.status(500).json({ error: 'Failed to fetch removed items' });
    }
    
    res.json(rows.map(i => i.item_id));
  });
});

// Save removed items for a specific list
app.post('/api/removed-items/:listKey', (req, res) => {
  const { listKey } = req.params;
  const items = req.body;
  
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Expected array of item IDs' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM removed_items WHERE list_key = ?', [listKey]);
    
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO removed_items (item_type, item_id, list_key)
      VALUES (?, ?, ?)
    `);
    
    items.forEach(itemId => {
      stmt.run('generic', itemId, listKey);
    });
    
    stmt.finalize();
    
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Error saving removed items:', err);
        return res.status(500).json({ error: 'Failed to save removed items' });
      }
      res.json({ success: true, count: items.length });
    });
  });
});

// --- Settings Endpoints ---

// Get a setting
app.get('/api/settings/:key', (req, res) => {
  const { key } = req.params;
  
  db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
    if (err) {
      console.error('Error fetching setting:', err);
      return res.status(500).json({ error: 'Failed to fetch setting' });
    }
    
    res.json({ value: row ? row.value : null });
  });
});

// Set a setting
app.post('/api/settings/:key', (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  
  db.run(`
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `, [key, value], (err) => {
    if (err) {
      console.error('Error saving setting:', err);
      return res.status(500).json({ error: 'Failed to save setting' });
    }
    res.json({ success: true });
  });
});

// --- Migration Endpoint ---

// Import data from localStorage dump
app.post('/api/migrate', (req, res) => {
  const data = req.body;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Process each localStorage key
    Object.keys(data).forEach(key => {
      try {
        // Import moveables
        if (key.startsWith('moveables_')) {
          const pageFile = key.replace('moveables_', '');
          const moveables = JSON.parse(data[key] || '[]');
          
          db.run('DELETE FROM moveables WHERE page_file = ?', [pageFile]);
          
          const stmt = db.prepare(`
            INSERT INTO moveables (page_file, moveable_id, label, type, area_id, assigned_to_page, erk_id, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          moveables.forEach(m => {
            stmt.run(
              pageFile,
              m.id || '',
              m.label || '',
              m.type || null,
              m.areaId || null,
              m.assignedToPage || null,
              m.erkId || null,
              m.timestamp || Date.now()
            );
          });
          
          stmt.finalize();
        }
        
        // Import custom buttons
        if (key === 'custom_pa_buttons') {
          const buttons = JSON.parse(data[key] || '[]');
          db.run('DELETE FROM custom_buttons');
          
          const stmt = db.prepare(`
            INSERT INTO custom_buttons (button_id, label)
            VALUES (?, ?)
          `);
          
          buttons.forEach(b => {
            stmt.run(b.id || b.label, b.id || b.label);
          });
          
          stmt.finalize();
        }
        
        // Import custom vehicles
        if (key.startsWith('custom_vehicles_')) {
          const groupName = key.replace('custom_vehicles_', '');
          const vehicles = JSON.parse(data[key] || '[]');
          
          db.run('DELETE FROM custom_vehicles WHERE group_name = ?', [groupName]);
          
          const stmt = db.prepare(`
            INSERT OR REPLACE INTO custom_vehicles (group_name, label, slug)
            VALUES (?, ?, ?)
          `);
          
          vehicles.forEach(v => {
            stmt.run(groupName, v.label, v.slug);
          });
          
          stmt.finalize();
        }
        
        // Import removed items
        if (key.startsWith('removed_')) {
          const items = JSON.parse(data[key] || '[]');
          
          db.run('DELETE FROM removed_items WHERE list_key = ?', [key]);
          
          const stmt = db.prepare(`
            INSERT OR IGNORE INTO removed_items (item_type, item_id, list_key)
            VALUES (?, ?, ?)
          `);
          
          items.forEach(itemId => {
            stmt.run('generic', itemId, key);
          });
          
          stmt.finalize();
        }
      } catch (err) {
        console.error(`Error processing key ${key}:`, err);
      }
    });
    
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Error during migration:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Migration failed', details: err.message });
      }
      res.json({ success: true, message: 'Data migrated successfully' });
    });
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Feuerwehr Panel Server running on http://localhost:${PORT}`);
  console.log(`Database: ${dbPath}`);
  console.log(`API available at http://localhost:${PORT}/api/`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  server.close(() => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
      process.exit(0);
    });
  });
});

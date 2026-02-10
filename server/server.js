const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const dbPath = path.join(__dirname, 'feuerwehr.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

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
  try {
    const { pageFile } = req.params;
    const stmt = db.prepare('SELECT * FROM moveables WHERE page_file = ? ORDER BY timestamp DESC');
    const moveables = stmt.all(pageFile);
    
    // Transform to match client format
    const result = moveables.map(m => ({
      id: m.moveable_id,
      label: m.label,
      type: m.type,
      areaId: m.area_id,
      assignedToPage: m.assigned_to_page,
      erkId: m.erk_id,
      timestamp: m.timestamp
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching moveables:', error);
    res.status(500).json({ error: 'Failed to fetch moveables' });
  }
});

// Save moveables for a specific page
app.post('/api/moveables/:pageFile', (req, res) => {
  try {
    const { pageFile } = req.params;
    const moveables = req.body;
    
    if (!Array.isArray(moveables)) {
      return res.status(400).json({ error: 'Expected array of moveables' });
    }
    
    // Use transaction for atomicity
    const deleteStmt = db.prepare('DELETE FROM moveables WHERE page_file = ?');
    const insertStmt = db.prepare(`
      INSERT INTO moveables (page_file, moveable_id, label, type, area_id, assigned_to_page, erk_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const transaction = db.transaction(() => {
      deleteStmt.run(pageFile);
      moveables.forEach(m => {
        insertStmt.run(
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
    });
    
    transaction();
    res.json({ success: true, count: moveables.length });
  } catch (error) {
    console.error('Error saving moveables:', error);
    res.status(500).json({ error: 'Failed to save moveables' });
  }
});

// --- Custom Buttons Endpoints ---

// Get all custom buttons
app.get('/api/custom-buttons', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM custom_buttons ORDER BY created_at ASC');
    const buttons = stmt.all();
    
    res.json(buttons.map(b => ({
      id: b.button_id,
      label: b.button_id
    })));
  } catch (error) {
    console.error('Error fetching custom buttons:', error);
    res.status(500).json({ error: 'Failed to fetch custom buttons' });
  }
});

// Save custom buttons
app.post('/api/custom-buttons', (req, res) => {
  try {
    const buttons = req.body;
    
    if (!Array.isArray(buttons)) {
      return res.status(400).json({ error: 'Expected array of buttons' });
    }
    
    const deleteStmt = db.prepare('DELETE FROM custom_buttons');
    const insertStmt = db.prepare(`
      INSERT INTO custom_buttons (button_id, label, button_type)
      VALUES (?, ?, ?)
    `);
    
    const transaction = db.transaction(() => {
      deleteStmt.run();
      buttons.forEach(b => {
        insertStmt.run(b.id || b.label, b.id || b.label, 'pa');
      });
    });
    
    transaction();
    res.json({ success: true, count: buttons.length });
  } catch (error) {
    console.error('Error saving custom buttons:', error);
    res.status(500).json({ error: 'Failed to save custom buttons' });
  }
});

// Get custom button texts
app.get('/api/custom-button-texts', (req, res) => {
  try {
    const stmt = db.prepare('SELECT button_id, label FROM custom_buttons');
    const buttons = stmt.all();
    
    const texts = {};
    buttons.forEach(b => {
      texts[b.button_id] = b.label;
    });
    
    res.json(texts);
  } catch (error) {
    console.error('Error fetching custom button texts:', error);
    res.status(500).json({ error: 'Failed to fetch custom button texts' });
  }
});

// Save custom button texts
app.post('/api/custom-button-texts', (req, res) => {
  try {
    const texts = req.body;
    
    const updateStmt = db.prepare('UPDATE custom_buttons SET label = ? WHERE button_id = ?');
    
    Object.entries(texts).forEach(([buttonId, label]) => {
      updateStmt.run(label, buttonId);
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving custom button texts:', error);
    res.status(500).json({ error: 'Failed to save custom button texts' });
  }
});

// --- Custom Vehicles Endpoints ---

// Get custom vehicles for a group
app.get('/api/custom-vehicles/:groupName', (req, res) => {
  try {
    const { groupName } = req.params;
    const stmt = db.prepare('SELECT * FROM custom_vehicles WHERE group_name = ? ORDER BY created_at ASC');
    const vehicles = stmt.all(groupName);
    
    res.json(vehicles.map(v => ({
      label: v.label,
      slug: v.slug
    })));
  } catch (error) {
    console.error('Error fetching custom vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch custom vehicles' });
  }
});

// Add custom vehicle to a group
app.post('/api/custom-vehicles/:groupName', (req, res) => {
  try {
    const { groupName } = req.params;
    const { label, slug } = req.body;
    
    if (!label || !slug) {
      return res.status(400).json({ error: 'Label and slug are required' });
    }
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO custom_vehicles (group_name, label, slug)
      VALUES (?, ?, ?)
    `);
    
    stmt.run(groupName, label, slug);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding custom vehicle:', error);
    res.status(500).json({ error: 'Failed to add custom vehicle' });
  }
});

// Delete custom vehicle from a group
app.delete('/api/custom-vehicles/:groupName/:label', (req, res) => {
  try {
    const { groupName, label } = req.params;
    
    const stmt = db.prepare('DELETE FROM custom_vehicles WHERE group_name = ? AND label = ?');
    stmt.run(groupName, label);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom vehicle:', error);
    res.status(500).json({ error: 'Failed to delete custom vehicle' });
  }
});

// --- Removed Items Endpoints ---

// Get removed items for a specific list
app.get('/api/removed-items/:listKey', (req, res) => {
  try {
    const { listKey } = req.params;
    const stmt = db.prepare('SELECT item_id FROM removed_items WHERE list_key = ? ORDER BY created_at ASC');
    const items = stmt.all(listKey);
    
    res.json(items.map(i => i.item_id));
  } catch (error) {
    console.error('Error fetching removed items:', error);
    res.status(500).json({ error: 'Failed to fetch removed items' });
  }
});

// Save removed items for a specific list
app.post('/api/removed-items/:listKey', (req, res) => {
  try {
    const { listKey } = req.params;
    const items = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Expected array of item IDs' });
    }
    
    const deleteStmt = db.prepare('DELETE FROM removed_items WHERE list_key = ?');
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO removed_items (item_type, item_id, list_key)
      VALUES (?, ?, ?)
    `);
    
    const transaction = db.transaction(() => {
      deleteStmt.run(listKey);
      items.forEach(itemId => {
        insertStmt.run('generic', itemId, listKey);
      });
    });
    
    transaction();
    res.json({ success: true, count: items.length });
  } catch (error) {
    console.error('Error saving removed items:', error);
    res.status(500).json({ error: 'Failed to save removed items' });
  }
});

// --- Settings Endpoints ---

// Get a setting
app.get('/api/settings/:key', (req, res) => {
  try {
    const { key } = req.params;
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key);
    
    res.json({ value: result ? result.value : null });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Set a setting
app.post('/api/settings/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(key, value);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving setting:', error);
    res.status(500).json({ error: 'Failed to save setting' });
  }
});

// --- Migration Endpoint ---

// Import data from localStorage dump
app.post('/api/migrate', (req, res) => {
  try {
    const data = req.body;
    
    // This endpoint accepts a JSON object with keys matching localStorage format
    // and migrates them to the database
    
    const transaction = db.transaction(() => {
      // Import moveables
      Object.keys(data).forEach(key => {
        if (key.startsWith('moveables_')) {
          const pageFile = key.replace('moveables_', '');
          const moveables = JSON.parse(data[key] || '[]');
          
          const deleteStmt = db.prepare('DELETE FROM moveables WHERE page_file = ?');
          const insertStmt = db.prepare(`
            INSERT INTO moveables (page_file, moveable_id, label, type, area_id, assigned_to_page, erk_id, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          deleteStmt.run(pageFile);
          moveables.forEach(m => {
            insertStmt.run(
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
        }
        
        // Import custom buttons
        if (key === 'custom_pa_buttons') {
          const buttons = JSON.parse(data[key] || '[]');
          const deleteStmt = db.prepare('DELETE FROM custom_buttons');
          const insertStmt = db.prepare(`
            INSERT INTO custom_buttons (button_id, label)
            VALUES (?, ?)
          `);
          
          deleteStmt.run();
          buttons.forEach(b => {
            insertStmt.run(b.id || b.label, b.id || b.label);
          });
        }
        
        // Import custom vehicles
        if (key.startsWith('custom_vehicles_')) {
          const groupName = key.replace('custom_vehicles_', '');
          const vehicles = JSON.parse(data[key] || '[]');
          
          const deleteStmt = db.prepare('DELETE FROM custom_vehicles WHERE group_name = ?');
          const insertStmt = db.prepare(`
            INSERT OR REPLACE INTO custom_vehicles (group_name, label, slug)
            VALUES (?, ?, ?)
          `);
          
          deleteStmt.run(groupName);
          vehicles.forEach(v => {
            insertStmt.run(groupName, v.label, v.slug);
          });
        }
        
        // Import removed items
        if (key.startsWith('removed_')) {
          const items = JSON.parse(data[key] || '[]');
          const deleteStmt = db.prepare('DELETE FROM removed_items WHERE list_key = ?');
          const insertStmt = db.prepare(`
            INSERT OR IGNORE INTO removed_items (item_type, item_id, list_key)
            VALUES (?, ?, ?)
          `);
          
          deleteStmt.run(key);
          items.forEach(itemId => {
            insertStmt.run('generic', itemId, key);
          });
        }
      });
    });
    
    transaction();
    res.json({ success: true, message: 'Data migrated successfully' });
  } catch (error) {
    console.error('Error during migration:', error);
    res.status(500).json({ error: 'Migration failed', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Feuerwehr Panel Server running on http://localhost:${PORT}`);
  console.log(`Database: ${dbPath}`);
  console.log(`API available at http://localhost:${PORT}/api/`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

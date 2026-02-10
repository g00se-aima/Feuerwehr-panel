const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'feuerwehr.db');

// Export all data to JSON
function exportData(outputFile) {
  const db = new sqlite3.Database(dbPath);
  const data = {};
  let completed = 0;
  // Whitelist of allowed tables for security
  const allowedTables = ['moveables', 'custom_buttons', 'custom_vehicles', 'removed_items', 'settings'];
  
  console.log('Exporting data from database...');
  
  allowedTables.forEach(tableName => {
    // Validate table name is in whitelist before using in query
    if (!allowedTables.includes(tableName)) {
      console.error(`Invalid table name: ${tableName}`);
      return;
    }
    
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        console.error(`Error reading ${tableName}:`, err);
      } else {
        data[tableName] = rows;
        console.log(`Exported ${rows.length} rows from ${tableName}`);
      }
      
      completed++;
      if (completed === allowedTables.length) {
        const json = JSON.stringify(data, null, 2);
        fs.writeFileSync(outputFile, json);
        console.log(`\nData exported successfully to ${outputFile}`);
        console.log(`Total size: ${(json.length / 1024).toFixed(2)} KB`);
        db.close();
      }
    });
  });
}

// Import data from JSON
function importData(inputFile) {
  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const db = new sqlite3.Database(dbPath);
  
  console.log('Importing data to database...');
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Import moveables
    if (data.moveables && data.moveables.length > 0) {
      console.log(`Importing ${data.moveables.length} moveables...`);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO moveables (id, page_file, moveable_id, label, type, area_id, assigned_to_page, erk_id, timestamp, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.moveables.forEach(m => {
        stmt.run(m.id, m.page_file, m.moveable_id, m.label, m.type, m.area_id, m.assigned_to_page, m.erk_id, m.timestamp, m.created_at, m.updated_at);
      });
      stmt.finalize();
    }
    
    // Import custom buttons
    if (data.custom_buttons && data.custom_buttons.length > 0) {
      console.log(`Importing ${data.custom_buttons.length} custom buttons...`);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO custom_buttons (id, button_id, label, button_type, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      data.custom_buttons.forEach(b => {
        stmt.run(b.id, b.button_id, b.label, b.button_type, b.created_at);
      });
      stmt.finalize();
    }
    
    // Import custom vehicles
    if (data.custom_vehicles && data.custom_vehicles.length > 0) {
      console.log(`Importing ${data.custom_vehicles.length} custom vehicles...`);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO custom_vehicles (id, group_name, label, slug, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      data.custom_vehicles.forEach(v => {
        stmt.run(v.id, v.group_name, v.label, v.slug, v.created_at);
      });
      stmt.finalize();
    }
    
    // Import removed items
    if (data.removed_items && data.removed_items.length > 0) {
      console.log(`Importing ${data.removed_items.length} removed items...`);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO removed_items (id, item_type, item_id, list_key, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      data.removed_items.forEach(r => {
        stmt.run(r.id, r.item_type, r.item_id, r.list_key, r.created_at);
      });
      stmt.finalize();
    }
    
    // Import settings
    if (data.settings && data.settings.length > 0) {
      console.log(`Importing ${data.settings.length} settings...`);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `);
      data.settings.forEach(s => {
        stmt.run(s.key, s.value, s.updated_at);
      });
      stmt.finalize();
    }
    
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Error committing transaction:', err);
        db.run('ROLLBACK');
      } else {
        console.log('\nData imported successfully!');
      }
      db.close();
    });
  });
}

// Command-line interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  Export: node export-import.js export <output-file.json>');
  console.log('  Import: node export-import.js import <input-file.json>');
  console.log('');
  console.log('Examples:');
  console.log('  node export-import.js export backup.json');
  console.log('  node export-import.js import backup.json');
  process.exit(0);
}

const command = args[0];
const filename = args[1] || 'data-export.json';

if (command === 'export') {
  exportData(filename);
} else if (command === 'import') {
  importData(filename);
} else {
  console.error('Unknown command:', command);
  console.log('Use "export" or "import"');
  process.exit(1);
}
